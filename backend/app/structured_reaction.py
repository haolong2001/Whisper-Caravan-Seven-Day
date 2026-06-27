from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Sequence

from .schemas import (
    BackendMemoryRecord,
    EvidenceSummary,
    EvidenceSummaryType,
    NPCReactionTone,
    StructuredNpcReaction,
    StructuredReactionExplanation,
    StructuredReactionRequest,
)


VALID_TONES: tuple[NPCReactionTone, ...] = (
    "friendly",
    "guarded",
    "fearful",
    "hostile",
    "sympathetic",
    "evasive",
)
VALID_ROUTE_UNLOCKS = {"truth", "merchant", "rumor", "failure"}
VALID_EVIDENCE_TYPES: tuple[EvidenceSummaryType, ...] = (
    "record",
    "testimony",
    "rumor",
    "contradiction",
    "receipt",
    "law",
    "inventory",
    "medical",
)


@dataclass(frozen=True)
class StructuredNpcAccessProfile:
    npc_id: str
    route_unlock: str
    min_reliability: float
    allowed_types: tuple[str, ...]
    allowed_visibility: tuple[str, ...]
    scope_tokens: tuple[str, ...]
    topic_tokens: tuple[str, ...]
    default_flag: str
    default_tone: NPCReactionTone


STRUCTURED_NPC_PROFILES: dict[str, StructuredNpcAccessProfile] = {
    "fox_ledger_master": StructuredNpcAccessProfile(
        npc_id="fox_ledger_master",
        route_unlock="merchant",
        min_reliability=0.55,
        allowed_types=("record", "contract"),
        allowed_visibility=("public", "private"),
        scope_tokens=("fox", "market", "merchant", "ledger", "audit", "settlement"),
        topic_tokens=("ledger", "receipt", "contract", "market", "merchant", "price", "audit"),
        default_flag="fox_ledger_seen",
        default_tone="guarded",
    ),
    "crow_broker": StructuredNpcAccessProfile(
        npc_id="crow_broker",
        route_unlock="rumor",
        min_reliability=0.35,
        allowed_types=("rumor", "song", "record", "short_term"),
        allowed_visibility=("public", "private"),
        scope_tokens=("crow", "road", "public", "story", "broadside", "rumor"),
        topic_tokens=("rumor", "song", "story", "broadside", "hearsay", "contradiction", "road"),
        default_flag="crow_broker_heard",
        default_tone="friendly",
    ),
    "camp_healer": StructuredNpcAccessProfile(
        npc_id="camp_healer",
        route_unlock="truth",
        min_reliability=0.5,
        allowed_types=("record", "short_term"),
        allowed_visibility=("public", "private"),
        scope_tokens=("camp", "refugee", "healer", "medical", "treatment"),
        topic_tokens=("necessity", "witness", "medical", "healer", "refugee", "treatment", "medicine"),
        default_flag="camp_healer_statement_taken",
        default_tone="sympathetic",
    ),
    "village_apothecary": StructuredNpcAccessProfile(
        npc_id="village_apothecary",
        route_unlock="truth",
        min_reliability=0.6,
        allowed_types=("record", "contract", "short_term"),
        allowed_visibility=("public", "private"),
        scope_tokens=("deer", "village", "apothecary", "medicine", "storehouse"),
        topic_tokens=("medicine", "inventory", "village", "apothecary", "receipt", "ledger", "truth", "stock"),
        default_flag="apothecary_inventory_seen",
        default_tone="guarded",
    ),
}


def clamp_trust_delta(value: object) -> int:
    return int(_clamp_number(value, -10, 10, 0))


def clamp_legal_risk_delta(value: object) -> int:
    return int(_clamp_number(value, -8, 8, 0))


def clamp_price_modifier(value: object) -> float:
    return _clamp_number(value, 0.75, 1.25, 1.0)


def clamp_unit_interval(value: object) -> float:
    return _clamp_number(value, 0.0, 1.0, 0.0)


def sanitize_route_unlocks(values: Sequence[object] | None) -> List[str]:
    if not values:
        return []

    deduped: List[str] = []

    for value in values:
        if isinstance(value, str) and value in VALID_ROUTE_UNLOCKS and value not in deduped:
            deduped.append(value)

    return deduped


def sanitize_flags(values: Sequence[object] | None) -> List[str]:
    return _sanitize_string_list(values)


def sanitize_memory_refs(values: Sequence[object] | None) -> List[str]:
    return _sanitize_string_list(values)


def sanitize_evidence_entries(values: Iterable[object] | None) -> List[EvidenceSummary]:
    if not values:
        return []

    evidence_by_id: dict[str, EvidenceSummary] = {}

    for value in values:
        entry = sanitize_evidence_entry(value)
        if entry is not None:
            evidence_by_id[entry.memory_id] = entry

    return list(evidence_by_id.values())


def sanitize_evidence_entry(value: object) -> EvidenceSummary | None:
    if not isinstance(value, dict):
        return None

    memory_id = _as_non_empty_string(value.get("memory_id"))
    title = _as_non_empty_string(value.get("title"))
    evidence_type = value.get("type")

    if (
        not memory_id
        or not title
        or not isinstance(evidence_type, str)
        or evidence_type not in VALID_EVIDENCE_TYPES
    ):
        return None

    reliability = value.get("reliability")
    relevance = value.get("relevance")

    if not isinstance(reliability, (int, float)) or not isinstance(relevance, (int, float)):
        return None

    return EvidenceSummary(
        memory_id=memory_id,
        title=title,
        type=evidence_type,
        reliability=clamp_unit_interval(float(reliability)),
        relevance=clamp_unit_interval(float(relevance)),
    )


def sanitize_structured_reaction(
    reaction: StructuredNpcReaction | dict,
    request: StructuredReactionRequest,
) -> StructuredNpcReaction:
    fallback = build_fake_structured_reaction(request)
    data = reaction.model_dump() if isinstance(reaction, StructuredNpcReaction) else dict(reaction)

    npc_id = _as_non_empty_string(data.get("npc_id"))
    dialogue = _as_non_empty_string(data.get("dialogue"))
    tone = data.get("tone")
    route_unlocks = sanitize_route_unlocks(data.get("route_unlocks"))
    evidence = sanitize_evidence_entries(data.get("evidence"))
    memory_refs = sanitize_memory_refs(data.get("memory_refs"))
    flags_set = sanitize_flags(data.get("flags_set"))
    explanation = _sanitize_explanation(data.get("explanation"), fallback.explanation)

    return StructuredNpcReaction(
        npc_id=npc_id if npc_id == request.npc_id else fallback.npc_id,
        dialogue=dialogue or fallback.dialogue,
        tone=tone if tone in VALID_TONES else fallback.tone,
        trust_delta=clamp_trust_delta(data.get("trust_delta", fallback.trust_delta)),
        legal_risk_delta=clamp_legal_risk_delta(
            data.get("legal_risk_delta", fallback.legal_risk_delta)
        ),
        price_modifier=(
            clamp_price_modifier(data["price_modifier"])
            if data.get("price_modifier") is not None
            else fallback.price_modifier
        ),
        quest_available=(
            data["quest_available"]
            if isinstance(data.get("quest_available"), bool)
            else fallback.quest_available
        ),
        route_unlocks=route_unlocks if "route_unlocks" in data else fallback.route_unlocks,
        evidence=evidence if "evidence" in data else fallback.evidence,
        memory_refs=memory_refs if "memory_refs" in data else fallback.memory_refs,
        flags_set=flags_set if "flags_set" in data else fallback.flags_set,
        explanation=explanation,
    )


def build_fake_structured_reaction(request: StructuredReactionRequest) -> StructuredNpcReaction:
    if request.npc_id == "fox_ledger_master":
        has_paper_trail = _has_known_memory(
            request,
            ("ledger", "receipt", "contract", "market"),
        ) or _has_route_context(request, "merchant")
        high_risk = _legal_risk(request) >= 6
        evidence_id = _pick_known_memory_id(
            request,
            ("ledger", "receipt", "contract"),
            f"fox-ledger-backend-day-{request.day}",
        )
        return StructuredNpcReaction(
            npc_id=request.npc_id,
            dialogue="Your caravan left enough paper behind that I can price the risk instead of guessing at it."
            if has_paper_trail
            else "Bring me a receipt, a seal, or a signed clause. I do not open my books for free on rumor alone.",
            tone="guarded" if has_paper_trail or not high_risk else "evasive",
            trust_delta=4 if has_paper_trail else -2,
            legal_risk_delta=-2 if has_paper_trail else 1,
            price_modifier=0.9 if has_paper_trail else 1.15 if high_risk else 1.05,
            quest_available=has_paper_trail,
            route_unlocks=["merchant"],
            evidence=[
                EvidenceSummary(
                    memory_id=evidence_id,
                    title="Stamped Market Receipt" if has_paper_trail else "Ledger Gap Notice",
                    type="receipt" if has_paper_trail else "record",
                    reliability=0.88 if has_paper_trail else 0.67,
                    relevance=0.9 if has_paper_trail else 0.74,
                )
            ],
            memory_refs=[evidence_id],
            flags_set=["fox_ledger_seen"],
            explanation=StructuredReactionExplanation(
                public_reason="The ledger-master responds to receipts and contracts more than appeals."
                if has_paper_trail
                else "Without paperwork, the ledger-master assumes exposure and charges for it.",
                debug_reason="Backend fake fallback keyed off merchant route context and paperwork-like memory ids.",
            ),
        )

    if request.npc_id == "crow_broker":
        has_rumor_trail = _has_known_memory(
            request,
            ("rumor", "song", "story", "broadside", "crow"),
        ) or _has_route_context(request, "rumor")
        evidence_id = _pick_known_memory_id(
            request,
            ("rumor", "song", "story", "crow"),
            f"crow-broker-backend-day-{request.day}",
        )
        return StructuredNpcReaction(
            npc_id=request.npc_id,
            dialogue="The road is already talking. I can bend the story, but every louder telling raises the stakes."
            if has_rumor_trail
            else "There is no market in silence. Give me a contradiction, a witness, or a song worth carrying.",
            tone="friendly" if has_rumor_trail else "guarded",
            trust_delta=3 if has_rumor_trail else -1,
            legal_risk_delta=2 if has_rumor_trail else 1,
            price_modifier=0.95 if has_rumor_trail else 1.1,
            quest_available=True,
            route_unlocks=["rumor"],
            evidence=[
                EvidenceSummary(
                    memory_id=evidence_id,
                    title="Roadside Broadside" if has_rumor_trail else "Unverified Street Whisper",
                    type="rumor",
                    reliability=0.64 if has_rumor_trail else 0.41,
                    relevance=0.87 if has_rumor_trail else 0.68,
                )
            ],
            memory_refs=[evidence_id],
            flags_set=["crow_broker_heard"],
            explanation=StructuredReactionExplanation(
                public_reason="The Crow Broker values public heat even when the source is imperfect.",
                debug_reason="Backend fake fallback keyed off rumor-route context and rumor-adjacent memory ids.",
            ),
        )

    if request.npc_id == "camp_healer":
        has_medical_trail = _has_known_memory(
            request,
            ("medical", "healer", "roster", "witness", "camp", "medicine"),
        ) or _has_route_context(request, "truth")
        evidence_id = _pick_known_memory_id(
            request,
            ("medical", "healer", "roster", "witness", "medicine"),
            f"camp-healer-backend-day-{request.day}",
        )
        return StructuredNpcReaction(
            npc_id=request.npc_id,
            dialogue="The camp remembers who brought medicine when the fever was worst. I will say that plainly."
            if has_medical_trail
            else "I know the sickness, but the court listens better when suffering is written down as testimony.",
            tone="sympathetic",
            trust_delta=5 if has_medical_trail else 2,
            legal_risk_delta=-3 if has_medical_trail else -1,
            quest_available=True,
            route_unlocks=["truth"],
            evidence=[
                EvidenceSummary(
                    memory_id=evidence_id,
                    title="Refugee Treatment Testimony"
                    if has_medical_trail
                    else "Healer's Verbal Account",
                    type="medical" if has_medical_trail else "testimony",
                    reliability=0.86 if has_medical_trail else 0.72,
                    relevance=0.92 if has_medical_trail else 0.79,
                )
            ],
            memory_refs=[evidence_id],
            flags_set=["camp_healer_statement_taken"],
            explanation=StructuredReactionExplanation(
                public_reason="The camp healer centers necessity and witness testimony over procedure.",
                debug_reason="Backend fake fallback keyed off medical and witness-like memory ids.",
            ),
        )

    if request.npc_id == "village_apothecary":
        has_inventory_trail = _has_known_memory(
            request,
            ("inventory", "apothecary", "medicine", "receipt", "ledger"),
        ) or _has_route_context(request, "truth")
        high_risk = _legal_risk(request) >= 6
        evidence_id = _pick_known_memory_id(
            request,
            ("inventory", "apothecary", "medicine", "receipt"),
            f"apothecary-backend-day-{request.day}",
        )
        return StructuredNpcReaction(
            npc_id=request.npc_id,
            dialogue="The storehouse counts do not match the accusation. Missing stock and withheld stock are not the same thing."
            if has_inventory_trail
            else "If you want me to contradict the accusation, I need the inventory trail kept straight and visible.",
            tone="sympathetic" if has_inventory_trail and not high_risk else "guarded",
            trust_delta=4 if has_inventory_trail else 1,
            legal_risk_delta=-2 if has_inventory_trail else 0,
            price_modifier=0.95 if has_inventory_trail else 1.0,
            quest_available=True,
            route_unlocks=["truth"],
            evidence=[
                EvidenceSummary(
                    memory_id=evidence_id,
                    title="Incomplete Medicine Inventory"
                    if has_inventory_trail
                    else "Unsorted Storeroom Count",
                    type="inventory",
                    reliability=0.89 if has_inventory_trail else 0.7,
                    relevance=0.94 if has_inventory_trail else 0.76,
                )
            ],
            memory_refs=[evidence_id],
            flags_set=["apothecary_inventory_seen"],
            explanation=StructuredReactionExplanation(
                public_reason="The apothecary reacts to stock records and medicine counts that can survive court scrutiny.",
                debug_reason="Backend fake fallback keyed off truth-route context and inventory-like memory ids.",
            ),
        )

    return StructuredNpcReaction(
        npc_id=request.npc_id,
        dialogue="No structured backend reaction script exists for this NPC yet.",
        tone="guarded",
        trust_delta=0,
        legal_risk_delta=0,
        route_unlocks=[],
        evidence=[],
        memory_refs=[],
        flags_set=[],
        explanation=StructuredReactionExplanation(
            public_reason="This NPC does not have a structured backend reaction yet.",
            debug_reason="Unknown NPC fallback used by deterministic backend reaction layer.",
        ),
    )


def get_accessible_reaction_memories(
    request: StructuredReactionRequest,
    memories: Sequence[BackendMemoryRecord],
) -> List[BackendMemoryRecord]:
    profile = STRUCTURED_NPC_PROFILES.get(request.npc_id)

    if not profile:
        return []

    accessible: List[BackendMemoryRecord] = []

    for memory in memories:
        if not memory.active:
            continue
        if memory.visibility not in profile.allowed_visibility:
            continue
        if memory.type not in profile.allowed_types:
            continue
        if memory.reliability < profile.min_reliability:
            continue
        if not _memory_matches_profile(request, memory, profile):
            continue
        accessible.append(memory)

    return sorted(accessible, key=_memory_sort_key)


def build_retrieval_backed_structured_reaction(
    request: StructuredReactionRequest,
    memories: Sequence[BackendMemoryRecord],
) -> StructuredNpcReaction:
    profile = STRUCTURED_NPC_PROFILES.get(request.npc_id)

    if not profile:
        return build_fake_structured_reaction(request)

    accessible_memories = get_accessible_reaction_memories(request, memories)

    if not accessible_memories:
        return build_fake_structured_reaction(request)

    evidence = [_memory_to_evidence_summary(request, profile, memory) for memory in accessible_memories]
    memory_refs = [item.memory_id for item in evidence]
    top_evidence = evidence[0]
    incriminating_count = sum(1 for memory in accessible_memories if memory.evidenceRole == "incriminating")
    favorable_count = sum(1 for memory in accessible_memories if memory.evidenceRole == "favorable")

    trust_delta, legal_risk_delta, price_modifier, quest_available = _derive_effects(
        profile, evidence, accessible_memories, incriminating_count, favorable_count
    )
    dialogue, tone, public_reason = _build_deterministic_retrieval_dialogue(
        profile, top_evidence, incriminating_count, favorable_count
    )

    return sanitize_structured_reaction(
        StructuredNpcReaction(
            npc_id=request.npc_id,
            dialogue=dialogue,
            tone=tone,
            trust_delta=trust_delta,
            legal_risk_delta=legal_risk_delta,
            price_modifier=price_modifier,
            quest_available=quest_available,
            route_unlocks=[profile.route_unlock],
            evidence=evidence,
            memory_refs=memory_refs,
            flags_set=[profile.default_flag],
            explanation=StructuredReactionExplanation(
                public_reason=public_reason,
                debug_reason=f"Deterministic retrieval-backed reaction used {len(evidence)} accessible memories.",
            ),
        ),
        request,
    )


def _clamp_number(value: object, minimum: float, maximum: float, fallback: float) -> float:
    if not isinstance(value, (int, float)):
        return fallback
    return max(minimum, min(maximum, float(value)))


def _sanitize_string_list(values: Sequence[object] | None) -> List[str]:
    if not values:
        return []

    deduped: List[str] = []

    for value in values:
        normalized = _as_non_empty_string(value)
        if normalized and normalized not in deduped:
            deduped.append(normalized)

    return deduped


def _sanitize_explanation(
    value: object,
    fallback: StructuredReactionExplanation | None,
) -> StructuredReactionExplanation | None:
    if not isinstance(value, dict):
        return fallback

    public_reason = _as_non_empty_string(value.get("public_reason"))
    if not public_reason:
        return fallback

    return StructuredReactionExplanation(
        public_reason=public_reason,
        debug_reason=_as_non_empty_string(value.get("debug_reason")),
    )


def _as_non_empty_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    normalized = value.strip()
    return normalized if normalized else None


def _pick_known_memory_id(
    request: StructuredReactionRequest, terms: Sequence[str], fallback: str
) -> str:
    lowered_terms = [term.lower() for term in terms]

    for memory_id in request.known_memory_ids:
        lowered_id = memory_id.lower()
        if any(term in lowered_id for term in lowered_terms):
            return memory_id

    return fallback


def _has_known_memory(request: StructuredReactionRequest, terms: Sequence[str]) -> bool:
    return _pick_known_memory_id(request, terms, "") != ""


def _has_route_context(request: StructuredReactionRequest, route: str) -> bool:
    return request.route == route or route in (request.game_state_summary.unlocked_routes or [])


def _legal_risk(request: StructuredReactionRequest) -> int:
    return request.game_state_summary.legal_risk or 0


def _memory_sort_key(memory: BackendMemoryRecord) -> tuple:
    return (
        -memory.day,
        -memory.reliability,
        memory.title.casefold(),
        memory.source.casefold(),
        memory.memoryId,
    )


def _memory_matches_profile(
    request: StructuredReactionRequest,
    memory: BackendMemoryRecord,
    profile: StructuredNpcAccessProfile,
) -> bool:
    searchable_text = " ".join(
        [
            memory.memoryId,
            memory.title,
            memory.text,
            memory.source,
            memory.location,
            memory.sourceNpcId or "",
            memory.faction or "",
            " ".join(memory.tags),
        ]
    ).lower()

    if memory.memoryId in request.known_memory_ids:
        return True

    scope_hits = sum(1 for token in profile.scope_tokens if token in searchable_text)
    topic_hits = sum(1 for token in profile.topic_tokens if token in searchable_text)
    input_hits = sum(
        1
        for token in _tokenize_player_input(request.player_input)
        if len(token) > 3 and token in searchable_text
    )

    return scope_hits > 0 and (topic_hits > 0 or input_hits > 0)


def _tokenize_player_input(value: str) -> List[str]:
    return [token.strip(".,?!:;").lower() for token in value.split() if token.strip(".,?!:;")]


def _memory_to_evidence_summary(
    request: StructuredReactionRequest,
    profile: StructuredNpcAccessProfile,
    memory: BackendMemoryRecord,
) -> EvidenceSummary:
    searchable_text = " ".join(
        [memory.title, memory.text, memory.source, memory.location, " ".join(memory.tags)]
    ).lower()
    relevance = _calculate_relevance(request, profile, memory, searchable_text)

    return EvidenceSummary(
        memory_id=memory.memoryId,
        title=memory.title,
        type=_detect_evidence_summary_type(memory, searchable_text),
        reliability=clamp_unit_interval(memory.reliability),
        relevance=relevance,
    )


def _detect_evidence_summary_type(
    memory: BackendMemoryRecord, searchable_text: str
) -> EvidenceSummaryType:
    if memory.type in {"rumor", "song"}:
        if "contradiction" in searchable_text or memory.evidenceRole == "incriminating":
            return "contradiction"
        return "rumor"

    if "inventory" in searchable_text or "storehouse" in searchable_text or "stock" in searchable_text:
        return "inventory"
    if (
        "medical" in searchable_text
        or "healer" in searchable_text
        or "treatment" in searchable_text
        or "fever" in searchable_text
    ):
        return "medical"
    if (
        "law" in searchable_text
        or "court" in searchable_text
        or "legal" in searchable_text
        or "judge" in searchable_text
        or "tax" in searchable_text
        or "seal" in searchable_text
    ):
        return "law"
    if (
        memory.type == "contract"
        or "receipt" in searchable_text
        or "invoice" in searchable_text
        or "contract" in searchable_text
    ):
        return "receipt"
    if memory.type == "short_term" or "witness" in searchable_text or "statement" in searchable_text:
        return "testimony"
    return "record"


def _calculate_relevance(
    request: StructuredReactionRequest,
    profile: StructuredNpcAccessProfile,
    memory: BackendMemoryRecord,
    searchable_text: str,
) -> float:
    keyword_hits = sum(1 for token in profile.topic_tokens if token in searchable_text)
    scope_hits = sum(1 for token in profile.scope_tokens if token in searchable_text)
    input_hits = sum(
        1
        for token in _tokenize_player_input(request.player_input)
        if len(token) > 3 and token in searchable_text
    )
    known_hit = 1 if memory.memoryId in request.known_memory_ids else 0
    raw_score = 0.45 + min(0.15, keyword_hits * 0.04) + min(0.15, scope_hits * 0.03) + min(
        0.15, input_hits * 0.05
    ) + known_hit * 0.1
    return clamp_unit_interval(raw_score)


def _derive_effects(
    profile: StructuredNpcAccessProfile,
    evidence: Sequence[EvidenceSummary],
    memories: Sequence[BackendMemoryRecord],
    incriminating_count: int,
    favorable_count: int,
) -> tuple[int, int, float | None, bool]:
    evidence_count = len(evidence)
    support_count = sum(
        1 for item in evidence if item.type in {"record", "receipt", "inventory", "law", "medical", "testimony"}
    )

    if profile.npc_id == "fox_ledger_master":
        trust_delta = clamp_trust_delta(2 + evidence_count - incriminating_count)
        legal_risk_delta = clamp_legal_risk_delta(-(support_count + favorable_count) + incriminating_count)
        price_modifier = clamp_price_modifier(0.96 - (0.03 * min(support_count, 3)) + (0.03 * incriminating_count))
        return trust_delta, legal_risk_delta, price_modifier, True

    if profile.npc_id == "crow_broker":
        contradiction_count = sum(1 for item in evidence if item.type == "contradiction")
        trust_delta = clamp_trust_delta(1 + evidence_count - max(0, contradiction_count - 1))
        legal_risk_delta = clamp_legal_risk_delta(contradiction_count + incriminating_count)
        price_modifier = clamp_price_modifier(1.0 - (0.02 * min(evidence_count, 2)))
        return trust_delta, legal_risk_delta, price_modifier, True

    if profile.npc_id == "camp_healer":
        medical_count = sum(1 for item in evidence if item.type in {"medical", "testimony"})
        trust_delta = clamp_trust_delta(2 + medical_count + favorable_count)
        legal_risk_delta = clamp_legal_risk_delta(-(medical_count + favorable_count))
        return trust_delta, legal_risk_delta, None, True

    trust_delta = clamp_trust_delta(2 + support_count + favorable_count - incriminating_count)
    legal_risk_delta = clamp_legal_risk_delta(-(support_count + favorable_count) + incriminating_count)
    price_modifier = clamp_price_modifier(0.98 - (0.03 * min(support_count, 2)) + (0.02 * incriminating_count))
    return trust_delta, legal_risk_delta, price_modifier, True


def _build_deterministic_retrieval_dialogue(
    profile: StructuredNpcAccessProfile,
    top_evidence: EvidenceSummary,
    incriminating_count: int,
    favorable_count: int,
) -> tuple[str, NPCReactionTone, str]:
    if profile.npc_id == "fox_ledger_master":
        if incriminating_count > favorable_count:
            return (
                f"I found {top_evidence.title}. The books still open, but they do not flatter your caravan.",
                "guarded",
                "The ledger-master reacts to trade paper and prices risk from the strongest relevant record.",
            )
        return (
            f"I found {top_evidence.title}. Paper like this lets me deal in figures instead of suspicion.",
            "guarded",
            "The ledger-master trusts merchant-facing records, receipts, and contracts above appeals.",
        )

    if profile.npc_id == "crow_broker":
        if incriminating_count > 0:
            return (
                f"The road is carrying {top_evidence.title}. I can spread it, but it may cut both ways.",
                "friendly",
                "The Crow Broker values public narrative and contradiction more than formal proof.",
            )
        return (
            f"The road is carrying {top_evidence.title}. That story is worth passing along.",
            "friendly",
            "The Crow Broker reacts to rumor heat and public narrative momentum.",
        )

    if profile.npc_id == "camp_healer":
        return (
            f"I can point to {top_evidence.title}. The camp needed medicine, and that need was real.",
            "sympathetic",
            "The camp healer centers necessity, testimony, and medical witness evidence.",
        )

    if incriminating_count > favorable_count:
        return (
            f"The village records still hold {top_evidence.title}, and it leaves the accusation unsettled.",
            "guarded",
            "The apothecary reacts to inventory and medicine records but remains careful around contradictions.",
        )

    return (
        f"The village records still hold {top_evidence.title}. It does not fit the accusation cleanly.",
        "sympathetic",
        "The apothecary trusts medicine, inventory, and village-side records that survive scrutiny.",
    )
