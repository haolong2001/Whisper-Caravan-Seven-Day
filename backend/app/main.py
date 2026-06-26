from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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


app = FastAPI(title="Whisper Caravan v0.4 Backend", version="0.4.0-slice2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **store.health_info()}


@app.post("/memories/ingest", response_model=IngestResponse)
def ingest_memories(request: IngestRequest) -> IngestResponse:
    ingested_count = store.upsert_memories(request.sessionId, request.memories)
    return IngestResponse(sessionId=request.sessionId, ingestedCount=ingested_count)


@app.post("/memories/query", response_model=QueryResponse)
def query_stored_memories(request: QueryRequest) -> QueryResponse:
    memories = store.list_memories(request.sessionId)
    evidence = query_memories(memories, request)
    return QueryResponse(evidence=evidence)


@app.post("/npc/reaction", response_model=NpcReaction)
def npc_reaction(request: ReactionRequest) -> NpcReaction:
    memories = store.list_memories(request.sessionId)

    if not memories:
        raise HTTPException(status_code=404, detail="No memories ingested for session")

    try:
        return build_npc_reaction(request.npcId, memories, request.factions)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
