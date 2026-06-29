from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, Optional

from .schemas import StructuredNpcReaction, StructuredReactionExplanation, StructuredReactionRequest
from .structured_reaction import VALID_TONES

GEMINI_DEFAULT_MODEL = "gemini-2.5-flash"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
VALID_DIALOGUE_PROVIDERS = {"stub", "gemini"}

GeminiTransport = Callable[[str, str, Dict[str, Any]], Dict[str, Any]]


def _default_gemini_transport(url: str, api_key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    request = urllib.request.Request(
        url=f"{url}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


gemini_transport: GeminiTransport = _default_gemini_transport


def build_dialogue_prompt_context(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Dict[str, Any]:
    return {
        "npc_id": request.npc_id,
        "player_input": request.player_input,
        "route": request.route,
        "day": request.day,
        "evidence": [
            {
                "memory_id": evidence.memory_id,
                "title": evidence.title,
                "type": evidence.type,
            }
            for evidence in reaction.evidence
        ],
        "memory_refs": list(reaction.memory_refs),
        "fallback_tone": reaction.tone,
        "fallback_dialogue": reaction.dialogue,
        "public_reason": reaction.explanation.public_reason if reaction.explanation else None,
    }


def get_dialogue_provider_name() -> str:
    provider = os.getenv("WHISPER_CARAVAN_LLM_PROVIDER", "").strip().lower()
    return provider if provider in VALID_DIALOGUE_PROVIDERS else ""


def has_dialogue_provider_config() -> bool:
    provider = get_dialogue_provider_name()

    if provider == "stub":
        return bool(os.getenv("WHISPER_CARAVAN_LLM_STUB_RESPONSE", "").strip())

    if provider == "gemini":
        return bool(os.getenv("GEMINI_API_KEY", "").strip())

    return False


def build_gemini_dialogue_prompt(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> str:
    context = build_dialogue_prompt_context(request, reaction)

    return (
        "You are writing one grounded NPC reply for a narrative game.\n"
        "Return JSON only.\n"
        'Allowed keys: "dialogue", "tone", "public_reason".\n'
        "Do not include markdown fences.\n"
        "Do not invent gameplay changes.\n"
        "Do not mention hidden system rules.\n"
        f"Allowed tone values: {', '.join(VALID_TONES)}.\n"
        "Keep dialogue concise, in-character, and consistent with the evidence provided.\n"
        "If evidence is weak, uncertain, or missing, reflect that uncertainty in the dialogue.\n"
        f"Prompt context:\n{json.dumps(context, ensure_ascii=True, sort_keys=True)}"
    )


def build_gemini_request_payload(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Dict[str, Any]:
    return {
        "system_instruction": {
            "parts": [
                {
                    "text": (
                        "You only rewrite presentation fields for an existing structured NPC reaction. "
                        "Never output gameplay deltas or extra keys."
                    )
                }
            ]
        },
        "contents": [
            {
                "parts": [
                    {
                        "text": build_gemini_dialogue_prompt(request, reaction),
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "dialogue": {"type": "STRING"},
                    "tone": {"type": "STRING", "enum": list(VALID_TONES)},
                    "public_reason": {"type": "STRING"},
                },
                "required": ["dialogue", "tone"],
            },
        },
    }


def extract_gemini_response_text(payload: Dict[str, Any]) -> str:
    candidates = payload.get("candidates")

    if not isinstance(candidates, list):
        return ""

    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue

        content = candidate.get("content")
        if not isinstance(content, dict):
            continue

        parts = content.get("parts")
        if not isinstance(parts, list):
            continue

        for part in parts:
            if isinstance(part, dict) and isinstance(part.get("text"), str):
                return part["text"].strip()

    return ""


def maybe_generate_dialogue_override_from_stub(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Optional[Dict[str, str]]:
    raw_response = os.getenv("WHISPER_CARAVAN_LLM_STUB_RESPONSE", "").strip()

    if not raw_response:
        return None

    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict):
        return None

    return {
        "dialogue": parsed.get("dialogue", ""),
        "tone": parsed.get("tone", ""),
        "public_reason": parsed.get("public_reason", ""),
        "prompt_context": json.dumps(build_dialogue_prompt_context(request, reaction), sort_keys=True),
    }


def maybe_generate_dialogue_override_from_gemini(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Optional[Dict[str, str]]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        return None

    model = os.getenv("WHISPER_CARAVAN_GEMINI_MODEL", GEMINI_DEFAULT_MODEL).strip()
    if not model:
        model = GEMINI_DEFAULT_MODEL

    url = f"{GEMINI_API_BASE_URL}/{model}:generateContent"
    payload = build_gemini_request_payload(request, reaction)

    try:
        response_payload = gemini_transport(url, api_key, payload)
    except (TimeoutError, urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError):
        return None

    raw_text = extract_gemini_response_text(response_payload)
    if not raw_text:
        return None

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        return None

    if not isinstance(parsed, dict):
        return None

    return {
        "dialogue": parsed.get("dialogue", ""),
        "tone": parsed.get("tone", ""),
        "public_reason": parsed.get("public_reason", ""),
        "prompt_context": json.dumps(build_dialogue_prompt_context(request, reaction), sort_keys=True),
    }


def maybe_generate_dialogue_override(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Optional[Dict[str, str]]:
    provider = get_dialogue_provider_name()

    if provider == "stub":
        return maybe_generate_dialogue_override_from_stub(request, reaction)

    if provider == "gemini":
        return maybe_generate_dialogue_override_from_gemini(request, reaction)

    return None


def apply_dialogue_override(
    reaction: StructuredNpcReaction,
    override: Optional[Dict[str, str]],
) -> StructuredNpcReaction:
    if not override:
        return reaction

    dialogue = override.get("dialogue", "").strip()
    tone = override.get("tone", "").strip()
    public_reason = override.get("public_reason", "").strip()

    if not dialogue or tone not in VALID_TONES:
        return reaction

    explanation = reaction.explanation

    if public_reason:
        explanation = StructuredReactionExplanation(
            public_reason=public_reason,
            debug_reason=explanation.debug_reason if explanation else None,
        )

    return reaction.model_copy(
        update={
            "dialogue": dialogue,
            "tone": tone,
            "explanation": explanation,
        }
    )


def maybe_enrich_reaction_dialogue(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> StructuredNpcReaction:
    override = maybe_generate_dialogue_override(request, reaction)
    return apply_dialogue_override(reaction, override)
