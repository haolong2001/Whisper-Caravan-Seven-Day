from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .retrieval import (
    candidate_resolution_debug,
    resolve_candidate_memories_for_query,
    resolve_candidate_memories_for_reaction,
)
from .rules import build_npc_reaction, query_memories
from .schemas import (
    IngestRequest,
    IngestResponse,
    NpcReaction,
    QueryRequest,
    QueryResponse,
    ReactionRequest,
)
from .store import store
from .vector_store import vector_store


app = FastAPI(title="Whisper Caravan v0.4 Backend", version="0.4.0-slice4-step1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **store.health_info(), **vector_store.health_info()}


@app.post("/memories/ingest", response_model=IngestResponse)
def ingest_memories(request: IngestRequest) -> IngestResponse:
    ingested_count = store.upsert_memories(request.sessionId, request.memories)
    vector_store.upsert_memories(request.sessionId, request.memories)
    return IngestResponse(sessionId=request.sessionId, ingestedCount=ingested_count)


@app.post("/memories/query", response_model=QueryResponse)
def query_stored_memories(request: QueryRequest) -> QueryResponse:
    resolution = resolve_candidate_memories_for_query(store, vector_store, request)
    evidence = query_memories(resolution.memories, request)
    return QueryResponse(
        evidence=evidence,
        debug=candidate_resolution_debug(resolution, len(evidence)),
    )


@app.post("/npc/reaction", response_model=NpcReaction)
def npc_reaction(request: ReactionRequest) -> NpcReaction:
    resolution = resolve_candidate_memories_for_reaction(store, vector_store, request)

    if not resolution.memories:
        raise HTTPException(status_code=404, detail="No memories ingested for session")

    try:
        reaction = build_npc_reaction(request.npcId, resolution.memories, request.factions)
        reaction.debug = candidate_resolution_debug(
            resolution,
            len(reaction.acceptedEvidence) + len(reaction.rejectedEvidence),
        )
        return reaction
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
