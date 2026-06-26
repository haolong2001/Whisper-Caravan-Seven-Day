from __future__ import annotations

from typing import Dict, List, Optional

from .schemas import (
    BackendMemoryRecord,
    EvaluatedEvidence,
    GameEffects,
    NPCProfile,
    NpcId,
    NpcReaction,
    QueryRequest,
    RetrievedEvidence,
)


NPC_PROFILES: List[NPCProfile] = [
    NPCProfile(
        id="deerGuard",
        name="Deer Guard",
        faction="deerVillage",
        acceptedMemoryTypes=["record", "short_term"],
        rejectedMemoryTypes=["rumor"],
        visibleMemoryScopes=["public"],
        minReliability=0.65,
    ),
    NPCProfile(
        id="foxMerchant",
        name="Fox Merchant",
        faction="foxMarket",
        acceptedMemoryTypes=["record", "contract", "rumor"],
        rejectedMemoryTypes=["song"],
        visibleMemoryScopes=["public", "private"],
        minReliability=0.55,
    ),
    NPCProfile(
        id="crowBroker",
        name="Crow Broker",
        faction="crowBrokers",
        acceptedMemoryTypes=["rumor", "song", "short_term"],
        rejectedMemoryTypes=[],
        visibleMemoryScopes=["public", "private"],
        minReliability=0.4,
    ),
    NPCProfile(
        id="bearJudge",
        name="Bear Judge",
        faction="bearCourt",
        acceptedMemoryTypes=["record", "contract"],
        rejectedMemoryTypes=["rumor", "song"],
        visibleMemoryScopes=["public"],
        minReliability=0.7,
    ),
]


def get_profile(npc_id: NpcId) -> Optional[NPCProfile]:
    return next((profile for profile in NPC_PROFILES if profile.id == npc_id), None)


def to_retrieved_evidence(memory: BackendMemoryRecord) -> RetrievedEvidence:
    return RetrievedEvidence(
        memoryId=memory.memoryId,
        title=memory.title,
        text=memory.text,
        reliability=memory.reliability,
        sourceType=memory.type,
        evidenceRole=memory.evidenceRole,
        visibility=memory.visibility,
        metadata={
            "day": memory.day,
            "source": memory.source,
            "sourceNpcId": memory.sourceNpcId,
            "location": memory.location,
            "faction": memory.faction,
            "active": memory.active,
            "expiresOnDay": memory.expiresOnDay,
            "tags": memory.tags,
            "persistent": memory.persistent,
        },
    )


def _evidence_sort_key(evidence: RetrievedEvidence) -> tuple:
    return (
        -evidence.metadata.day,
        -evidence.reliability,
        evidence.title.casefold(),
        evidence.metadata.source.casefold(),
        evidence.memoryId,
    )


def _sort_retrieved_evidence(evidence: List[RetrievedEvidence]) -> List[RetrievedEvidence]:
    return sorted(evidence, key=_evidence_sort_key)


def _sort_evaluated_evidence(evidence: List[EvaluatedEvidence]) -> List[EvaluatedEvidence]:
    return sorted(evidence, key=_evidence_sort_key)


def query_memories(memories: List[BackendMemoryRecord], request: QueryRequest) -> List[RetrievedEvidence]:
    profile = get_profile(request.npcId) if request.npcId else None
    filtered = list(memories)

    if request.activeOnly:
        filtered = [memory for memory in filtered if memory.active]

    if request.visibility:
        filtered = [memory for memory in filtered if memory.visibility in request.visibility]

    if request.sourceTypes:
        filtered = [memory for memory in filtered if memory.type in request.sourceTypes]

    if request.minReliability is not None:
        filtered = [memory for memory in filtered if memory.reliability >= request.minReliability]

    if request.tags:
        filtered = [
            memory for memory in filtered if all(tag in memory.tags for tag in request.tags or [])
        ]

    if profile:
        filtered = [
            memory
            for memory in filtered
            if memory.visibility in profile.visibleMemoryScopes
            and memory.reliability >= profile.minReliability
        ]

    evidence = _sort_retrieved_evidence([to_retrieved_evidence(memory) for memory in filtered])

    if request.limit is not None:
        return evidence[: request.limit]

    return evidence


def _has_supporting_legal_record(
    evidence: RetrievedEvidence, visible_evidence: List[RetrievedEvidence]
) -> bool:
    return any(
        item.memoryId != evidence.memoryId
        and item.sourceType in {"record", "contract"}
        and item.evidenceRole == evidence.evidenceRole
        and item.reliability >= 0.7
        for item in visible_evidence
    )


def _can_npc_see_evidence(profile: NPCProfile, evidence: RetrievedEvidence) -> bool:
    return evidence.visibility in profile.visibleMemoryScopes


def _get_acceptance_reason(profile: NPCProfile, evidence: RetrievedEvidence) -> str:
    if profile.id == "deerGuard":
        if evidence.sourceType == "short_term":
            return "Accepted as a still-active witness trace the Deer Guard can act on."
        return "Accepted as a reliable official trace the Deer Guard recognizes."
    if profile.id == "foxMerchant":
        if evidence.sourceType == "rumor":
            return "Accepted as market gossip worth pricing into the next deal."
        return "Accepted as paperwork the Fox Market can trade on."
    if profile.id == "crowBroker":
        if evidence.sourceType == "short_term":
            return "Accepted as fresh off-book intelligence before it cools."
        return "Accepted as story heat the Crow network can spread."
    if profile.id == "bearJudge":
        if evidence.sourceType in {"record", "contract"}:
            return "Accepted as legal evidence above the Bear Court reliability threshold."
        return f"Accepted because a reliable legal record supports this {evidence.sourceType}."
    return "Accepted by the current NPC access rules."


def _get_rejected_type_reason(profile: NPCProfile, evidence: RetrievedEvidence) -> str:
    if profile.id == "deerGuard":
        if evidence.sourceType == "rumor":
            return "Rejected because the Deer Guard does not trust road rumors."
        return f"Rejected because the Deer Guard does not rely on {evidence.sourceType} evidence."
    if profile.id == "foxMerchant":
        if evidence.sourceType == "song":
            return "Rejected because the Fox Merchant will not price a deal from song alone."
        return f"Rejected because the Fox Merchant does not use {evidence.sourceType} evidence here."
    if profile.id == "crowBroker":
        return f"Rejected because the Crow Broker cannot turn this {evidence.sourceType} into useful traffic."
    if profile.id == "bearJudge":
        if evidence.sourceType == "rumor":
            return "Rejected as an unsupported rumor."
        if evidence.sourceType == "song":
            return "Rejected because songs need legal record support in Bear Court."
        return f"Rejected because Bear Court does not rely on {evidence.sourceType} evidence."
    return f"Rejected because {profile.name} does not rely on {evidence.sourceType} evidence."


def _evaluate_evidence_for_npc(
    profile: NPCProfile, evidence: RetrievedEvidence, visible_evidence: List[RetrievedEvidence]
) -> EvaluatedEvidence:
    if not _can_npc_see_evidence(profile, evidence):
        return EvaluatedEvidence(
            **evidence.model_dump(),
            decision="rejected",
            decisionReason=f"{profile.name} cannot access {evidence.visibility} memories.",
        )

    if evidence.reliability < profile.minReliability:
        return EvaluatedEvidence(
            **evidence.model_dump(),
            decision="rejected",
            decisionReason=f"{profile.name} requires at least {round(profile.minReliability * 100)}% reliability.",
        )

    if (
        profile.id == "bearJudge"
        and evidence.sourceType in profile.rejectedMemoryTypes
        and evidence.evidenceRole != "neutral"
        and _has_supporting_legal_record(evidence, visible_evidence)
    ):
        return EvaluatedEvidence(
            **evidence.model_dump(),
            decision="accepted",
            decisionReason=_get_acceptance_reason(profile, evidence),
        )

    if evidence.sourceType in profile.acceptedMemoryTypes:
        return EvaluatedEvidence(
            **evidence.model_dump(),
            decision="accepted",
            decisionReason=_get_acceptance_reason(profile, evidence),
        )

    return EvaluatedEvidence(
        **evidence.model_dump(),
        decision="rejected",
        decisionReason=_get_rejected_type_reason(profile, evidence),
    )


def get_npc_evaluations(profile: NPCProfile, memories: List[BackendMemoryRecord]) -> List[EvaluatedEvidence]:
    active_evidence = [to_retrieved_evidence(memory) for memory in memories if memory.active]
    visible_evidence = [
        evidence for evidence in active_evidence if _can_npc_see_evidence(profile, evidence)
    ]
    return [
        _evaluate_evidence_for_npc(profile, evidence, visible_evidence) for evidence in active_evidence
    ]


def _count_evidence(
    evidence: List[EvaluatedEvidence],
    *,
    evidence_role: Optional[str] = None,
    source_type: Optional[str] = None,
) -> int:
    total = 0

    for item in evidence:
        if evidence_role and item.evidenceRole != evidence_role:
            continue
        if source_type and item.sourceType != source_type:
            continue
        total += 1

    return total


def _build_deer_guard_reaction(
    profile: NPCProfile,
    factions: Dict[str, int],
    accepted_evidence: List[EvaluatedEvidence],
    rejected_evidence: List[EvaluatedEvidence],
) -> NpcReaction:
    deer_standing = factions.get("deerVillage", 0)
    incriminating_count = _count_evidence(accepted_evidence, evidence_role="incriminating")
    favorable_count = _count_evidence(accepted_evidence, evidence_role="favorable")
    has_wanted_notice = any(item.title == "Wanted Notice" for item in accepted_evidence)
    hidden_witness_count = sum(
        1
        for item in rejected_evidence
        if item.sourceType == "short_term" and item.visibility == "private"
    )

    if has_wanted_notice:
        return NpcReaction(
            profile=profile,
            dialogue="The Deer Guard follows the posted notice first. Private whispers do not save you once a record is on the board.",
            effects=GameEffects(
                trustDelta=deer_standing - 6,
                priceModifier=1.3,
                questAvailable=False,
                legalRiskDelta=3,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    if incriminating_count > 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Deer Guard sees enough official evidence to stay wary, even if some witness traces are hidden from view.",
            effects=GameEffects(
                trustDelta=deer_standing - 3,
                priceModifier=1.15,
                questAvailable=deer_standing > 0,
                legalRiskDelta=2,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    if favorable_count > 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Deer Guard can only act on the public record, and what remains visible leans in your favor."
            if hidden_witness_count > 0
            else "No hostile record survives the week strongly enough to outweigh the public help tied to your caravan.",
            effects=GameEffects(
                trustDelta=deer_standing + 2,
                priceModifier=0.95,
                questAvailable=True,
                legalRiskDelta=0,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    return NpcReaction(
        profile=profile,
        dialogue="The Deer Guard has no active evidence it trusts enough to move against you, though hidden memories may still exist elsewhere.",
        effects=GameEffects(
            trustDelta=deer_standing,
            priceModifier=1.0,
            questAvailable=True,
            legalRiskDelta=0,
        ),
        acceptedEvidence=accepted_evidence,
        rejectedEvidence=rejected_evidence,
    )


def _build_fox_merchant_reaction(
    profile: NPCProfile,
    factions: Dict[str, int],
    accepted_evidence: List[EvaluatedEvidence],
    rejected_evidence: List[EvaluatedEvidence],
) -> NpcReaction:
    fox_standing = factions.get("foxMarket", 0)
    accepted_contracts = _count_evidence(accepted_evidence, source_type="contract")
    accepted_rumors = _count_evidence(accepted_evidence, source_type="rumor")
    incriminating_count = _count_evidence(accepted_evidence, evidence_role="incriminating")
    private_accepted_count = sum(1 for item in accepted_evidence if item.visibility == "private")

    if accepted_contracts > 0 and incriminating_count == 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Fox Market values your off-book discipline and the contract that proves you can still close clean business."
            if private_accepted_count > 0
            else "The Fox Market sees enough reliable paperwork to offer fair terms.",
            effects=GameEffects(
                trustDelta=fox_standing + 3,
                priceModifier=0.9,
                questAvailable=True,
                legalRiskDelta=0,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    if accepted_rumors > 0 or incriminating_count > 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Fox Market can still trade with you, but the price now includes every rumor and discrepancy attached to your route.",
            effects=GameEffects(
                trustDelta=fox_standing - 1,
                priceModifier=1.2,
                questAvailable=True,
                legalRiskDelta=1,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    return NpcReaction(
        profile=profile,
        dialogue="The Fox Market hears traces of your week, but too little of it converts into reliable profit."
        if rejected_evidence
        else "No trade-relevant evidence stands out strongly enough for the Fox Market to change its offer.",
        effects=GameEffects(
            trustDelta=fox_standing,
            priceModifier=1.0,
            questAvailable=fox_standing >= 0,
            legalRiskDelta=0,
        ),
        acceptedEvidence=accepted_evidence,
        rejectedEvidence=rejected_evidence,
    )


def _build_crow_broker_reaction(
    profile: NPCProfile,
    factions: Dict[str, int],
    accepted_evidence: List[EvaluatedEvidence],
    rejected_evidence: List[EvaluatedEvidence],
) -> NpcReaction:
    crow_standing = factions.get("crowBrokers", 0)
    rumor_heat = (
        _count_evidence(accepted_evidence, source_type="rumor")
        + _count_evidence(accepted_evidence, source_type="song")
        + _count_evidence(accepted_evidence, source_type="short_term")
    )
    incriminating_count = _count_evidence(accepted_evidence, evidence_role="incriminating")
    private_accepted_count = sum(1 for item in accepted_evidence if item.visibility == "private")

    if rumor_heat > 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Crow Broker has both public noise and fresh private scraps to resell. Your week is becoming traffic."
            if private_accepted_count > 0
            else "The Crow Broker sees enough heat in songs and rumors to move your name ahead of the caravan.",
            effects=GameEffects(
                trustDelta=crow_standing + 2,
                priceModifier=0.95,
                questAvailable=True,
                legalRiskDelta=1 if incriminating_count > 0 else 0,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    return NpcReaction(
        profile=profile,
        dialogue="The Crow Broker lacks enough live gossip to make you worth broadcasting. For now, your trail is cooling.",
        effects=GameEffects(
            trustDelta=crow_standing,
            priceModifier=1.0,
            questAvailable=crow_standing > 0,
            legalRiskDelta=0,
        ),
        acceptedEvidence=accepted_evidence,
        rejectedEvidence=rejected_evidence,
    )


def _build_bear_judge_reaction(
    profile: NPCProfile,
    factions: Dict[str, int],
    accepted_evidence: List[EvaluatedEvidence],
    rejected_evidence: List[EvaluatedEvidence],
) -> NpcReaction:
    bear_standing = factions.get("bearCourt", 0)
    incriminating_count = _count_evidence(accepted_evidence, evidence_role="incriminating")
    favorable_count = _count_evidence(accepted_evidence, evidence_role="favorable")
    supported_song_or_rumor = any(
        item.sourceType in {"song", "rumor"} for item in accepted_evidence
    )

    if incriminating_count > favorable_count:
        return NpcReaction(
            profile=profile,
            dialogue="The Bear Judge still leans on legal records first, but supported songs and rumors now reinforce the case against you."
            if supported_song_or_rumor
            else "The Bear Judge sees enough legal evidence to treat your caravan as a credible risk.",
            effects=GameEffects(
                trustDelta=bear_standing - 4,
                priceModifier=1.25,
                questAvailable=False,
                legalRiskDelta=3,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    if favorable_count > 0:
        return NpcReaction(
            profile=profile,
            dialogue="The Bear Judge finds enough records in your favor to keep the road open, even if weaker stories are discarded.",
            effects=GameEffects(
                trustDelta=bear_standing + 2,
                priceModifier=1.0,
                questAvailable=True,
                legalRiskDelta=0,
            ),
            acceptedEvidence=accepted_evidence,
            rejectedEvidence=rejected_evidence,
        )

    return NpcReaction(
        profile=profile,
        dialogue="The Bear Judge rejects most of what still circulates about your caravan and reserves judgment until stronger records appear.",
        effects=GameEffects(
            trustDelta=bear_standing,
            priceModifier=1.05,
            questAvailable=bear_standing >= 0,
            legalRiskDelta=1,
        ),
        acceptedEvidence=accepted_evidence,
        rejectedEvidence=rejected_evidence,
    )


def build_npc_reaction(
    npc_id: NpcId, memories: List[BackendMemoryRecord], factions: Dict[str, int]
) -> NpcReaction:
    profile = get_profile(npc_id)

    if profile is None:
        raise ValueError(f"Unknown NPC profile: {npc_id}")

    evaluations = get_npc_evaluations(profile, memories)
    accepted_evidence = _sort_evaluated_evidence(
        [item for item in evaluations if item.decision == "accepted"]
    )
    rejected_evidence = _sort_evaluated_evidence(
        [item for item in evaluations if item.decision == "rejected"]
    )

    if profile.id == "deerGuard":
        return _build_deer_guard_reaction(profile, factions, accepted_evidence, rejected_evidence)
    if profile.id == "foxMerchant":
        return _build_fox_merchant_reaction(profile, factions, accepted_evidence, rejected_evidence)
    if profile.id == "crowBroker":
        return _build_crow_broker_reaction(profile, factions, accepted_evidence, rejected_evidence)
    return _build_bear_judge_reaction(profile, factions, accepted_evidence, rejected_evidence)
