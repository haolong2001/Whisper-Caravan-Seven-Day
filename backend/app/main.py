from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .dialogue_provider import maybe_enrich_reaction_dialogue
from .retrieval import (
    candidate_resolution_debug,
    resolve_candidate_memories_for_query,
    resolve_candidate_memories_for_structured_reaction,
)
from .rules import query_memories
from .schemas import (
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
    StructuredNpcReaction,
    StructuredReactionRequest,
)
from .structured_reaction import (
    build_fake_structured_reaction,
    build_retrieval_backed_structured_reaction,
    sanitize_structured_reaction,
)
from .store import store
from .vector_store import vector_store


app = FastAPI(title="Whisper Caravan v0.4 Backend", version="0.4.0-slice4-candidate-breadth")

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


@app.post("/npc/reaction", response_model=StructuredNpcReaction)
def npc_reaction(request: StructuredReactionRequest) -> StructuredNpcReaction:
    resolution = resolve_candidate_memories_for_structured_reaction(store, vector_store, request)

    if resolution.memories:
        base_reaction = sanitize_structured_reaction(
            build_retrieval_backed_structured_reaction(request, resolution.memories),
            request,
        )
        return maybe_enrich_reaction_dialogue(request, base_reaction)

    base_reaction = sanitize_structured_reaction(build_fake_structured_reaction(request), request)
    return maybe_enrich_reaction_dialogue(request, base_reaction)
