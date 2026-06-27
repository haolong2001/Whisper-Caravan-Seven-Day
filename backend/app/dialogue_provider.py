from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from .schemas import StructuredNpcReaction, StructuredReactionExplanation, StructuredReactionRequest
from .structured_reaction import VALID_TONES


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


def has_dialogue_provider_config() -> bool:
    return os.getenv("WHISPER_CARAVAN_LLM_PROVIDER", "").strip().lower() == "stub"


def maybe_generate_dialogue_override(
    request: StructuredReactionRequest, reaction: StructuredNpcReaction
) -> Optional[Dict[str, str]]:
    provider = os.getenv("WHISPER_CARAVAN_LLM_PROVIDER", "").strip().lower()

    if provider != "stub":
        return None

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
