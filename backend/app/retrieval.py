from __future__ import annotations

from dataclasses import dataclass
from typing import List

from .rules import get_profile
from .schemas import BackendMemoryRecord, QueryRequest, ReactionRequest, RetrievalDebug


@dataclass
class CandidateResolution:
    memories: List[BackendMemoryRecord]
    candidate_ids: List[str]
    retrieval_source: str


DEFAULT_VECTOR_CANDIDATE_LIMIT = 8
VECTOR_LIMIT_MULTIPLIER = 3


def _normalized_text_list(values: List[str] | None) -> str:
    return " ".join(value.replace("_", " ") for value in values or [])


def build_query_text(request: QueryRequest) -> str:
    parts: List[str] = ["memory", "evidence", "retrieval"]
    profile = get_profile(request.npcId) if request.npcId else None

    if profile:
        parts.extend(["npc", profile.name, profile.faction, "accepted"])
        parts.append(_normalized_text_list(profile.acceptedMemoryTypes))

        if not request.visibility:
            parts.extend(["visibility", _normalized_text_list(profile.visibleMemoryScopes)])

        if request.minReliability is None:
            parts.extend(["minimum", str(round(profile.minReliability * 100))])

    parts.extend(
        [
            "active",
            "true" if request.activeOnly else "false",
        ]
    )

    if request.sourceTypes:
        parts.extend(["types", _normalized_text_list(request.sourceTypes)])

    if request.tags:
        parts.extend(["tags", " ".join(request.tags)])

    if request.visibility:
        parts.extend(["visibility", _normalized_text_list(request.visibility)])

    if request.minReliability is not None:
        parts.extend(["minimum", str(round(request.minReliability * 100))])

    return " ".join(part for part in parts if part)


def build_reaction_query_text(request: ReactionRequest) -> str:
    profile = get_profile(request.npcId)

    if not profile:
        return request.npcId

    return " ".join(
        part
        for part in [
            "reaction",
            "evidence",
            "day",
            str(request.currentDay),
            "npc",
            profile.name,
            profile.faction,
            "accepted",
            _normalized_text_list(profile.acceptedMemoryTypes),
            "rejected",
            _normalized_text_list(profile.rejectedMemoryTypes),
            "visibility",
            _normalized_text_list(profile.visibleMemoryScopes),
            "minimum",
            str(round(profile.minReliability * 100)),
        ]
        if part
    )


def _vector_query_limit(total_memories: int, requested_limit: int | None = None) -> int:
    if total_memories <= 0:
        return 0

    if requested_limit is None:
        return min(total_memories, DEFAULT_VECTOR_CANDIDATE_LIMIT)

    if requested_limit <= 0:
        return 0

    return min(
        total_memories,
        max(
            requested_limit * VECTOR_LIMIT_MULTIPLIER,
            requested_limit,
            DEFAULT_VECTOR_CANDIDATE_LIMIT,
        ),
    )


def _resolve_candidates(store, session_id: str, all_memories, candidate_ids: List[str]) -> CandidateResolution:
    if not candidate_ids:
        return CandidateResolution(
            memories=all_memories,
            candidate_ids=[],
            retrieval_source="sqlite",
        )

    resolved = store.get_memories_by_ids(session_id, candidate_ids)

    if not resolved:
        return CandidateResolution(
            memories=all_memories,
            candidate_ids=candidate_ids,
            retrieval_source="sqlite",
        )

    return CandidateResolution(
        memories=resolved,
        candidate_ids=candidate_ids,
        retrieval_source="vector",
    )


def resolve_candidate_memories_for_query(store, vector_store, request: QueryRequest) -> CandidateResolution:
    all_memories = store.list_memories(request.sessionId)

    if not all_memories:
        return CandidateResolution(memories=[], candidate_ids=[], retrieval_source="sqlite")

    candidate_ids = vector_store.query_candidate_memory_ids(
        request.sessionId,
        build_query_text(request),
        _vector_query_limit(len(all_memories), request.limit),
    )

    return _resolve_candidates(store, request.sessionId, all_memories, candidate_ids)


def candidate_memories_for_query(store, vector_store, request: QueryRequest) -> List[BackendMemoryRecord]:
    return resolve_candidate_memories_for_query(store, vector_store, request).memories


def resolve_candidate_memories_for_reaction(
    store, vector_store, request: ReactionRequest
) -> CandidateResolution:
    all_memories = store.list_memories(request.sessionId)

    if not all_memories:
        return CandidateResolution(memories=[], candidate_ids=[], retrieval_source="sqlite")

    candidate_ids = vector_store.query_candidate_memory_ids(
        request.sessionId,
        build_reaction_query_text(request),
        _vector_query_limit(len(all_memories)),
    )

    return _resolve_candidates(store, request.sessionId, all_memories, candidate_ids)


def candidate_memories_for_reaction(
    store, vector_store, request: ReactionRequest
) -> List[BackendMemoryRecord]:
    return resolve_candidate_memories_for_reaction(store, vector_store, request).memories


def candidate_resolution_debug(
    resolution: CandidateResolution, filtered_evidence_count: int
) -> RetrievalDebug:
    return RetrievalDebug(
        retrievalSource="vector" if resolution.retrieval_source == "vector" else "sqlite",
        candidateCount=len(resolution.candidate_ids),
        resolvedCandidateCount=len(resolution.memories),
        filteredEvidenceCount=filtered_evidence_count,
    )
