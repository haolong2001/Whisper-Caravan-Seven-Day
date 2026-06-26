# Codex Handoff

## Current Version and version file

v0.4.0

`docs/versions/v0.4.md`

## Current State

v0.1 frontend-only prototype is complete.

v0.2 is complete in code and build-verified.

v0.2 implements

7 daily events → choices create memories → Memory Inspector updates → Day 7 collapse preview → Day 8 forgetting → NPC reacts based on remaining active evidence.

v0.3.0 is complete in code:

Day 8 deterministic NPC access rules exist for Deer Guard, Fox Merchant, Crow Broker, and Bear Judge. Inactive memories stay out of retrieval, unsupported Bear Court rumors are rejected unless supported, and the UI explains accepted/rejected evidence.

v0.4.0 slice 1 is now in place:

Frontend memory state can be mirrored into a deterministic FastAPI backend with an in-memory session store. The frontend now uses a retrieval adapter that ingests memories, queries metadata-filtered evidence, requests structured NPC reaction JSON, and falls back to the local deterministic rules when the backend is unavailable.

v0.4.0 slice 2 is now in place:

The backend now persists ingested memory metadata in a local SQLite database while preserving the same API contract, deterministic retrieval rules, and frontend adapter behavior from slice 1.

v0.4.0 slice 3 is now in place:

The backend now adds a Chroma-backed candidate retrieval layer with local deterministic embeddings. Chroma only suggests candidate memory ids; SQLite remains authoritative, and all active/visibility/type/reliability/NPC access filtering still happens deterministically after SQLite resolution.

v0.4.0 slice 4 step 1 is now in place:

Query evidence and Day 8 reaction evidence now use deterministic post-filter ordering based only on authoritative fields, so manual playtests stay stable across vector/sqlite backend paths and local fallback. Vector candidate order no longer determines final response order.

v0.4.0 slice 4 debug/manual pass is now in place:

Developer-facing retrieval badges and console logs now separate response source (`backend` vs `local`) from candidate mode (`vector` vs `sqlite`) more clearly, and the manual smoke docs now cover backend/vector, backend/sqlite fallback, local fallback, and deterministic ordering checks.

v0.4.0 slice 4 candidate breadth pass is now in place:

Backend vector retrieval now caps default candidate breadth at `8` when no explicit request `limit` is provided, while explicit `limit` requests still use the widened candidate policy `max(limit * 3, limit, 8)` up to the session memory count. Candidate/index text and query text now include deterministic authoritative retrieval fields so the narrower vector path can influence which ids reach SQLite resolution without changing the authority model.

Current v0.4 Goal

Stand up the real retrieval backend in small deterministic slices: stable API contract first, metadata filtering first, deterministic candidate retrieval next, no LLM generation yet, and no major frontend rewrite.

## System Reference

Read `docs/GAME_SYSTEMS.md` only when changing:

- domain model
- memory lifecycle
- NPC memory access
- faction/resource effects
- retrieval logic
- RAG transition code

## Architecture Reminder

- State orchestration: `app/page.tsx`
- Data: `lib/mockData.ts`
- Rules: `lib/gameLogic.ts`
- Types: `lib/types.ts`
- UI: `components/`

## Last Completed

v0.4.0 slice 4 candidate breadth pass: default vector cap plus deterministic retrieval text helpers.

Verification on June 27, 2026:

- `npm run build` passes
- Python backend modules compile with `PYTHONPYCACHEPREFIX=/private/tmp/whisper-caravan-pycache .venv/bin/python -m compileall backend/app backend/tests`
- Backend tests pass with `.venv/bin/python -m unittest backend.tests.test_rules backend.tests.test_store backend.tests.test_retrieval` after installing `backend/requirements.txt`
- FastAPI backend skeleton exists under `backend/app/`
- `/health`, `/memories/ingest`, `/memories/query`, and `/npc/reaction` are implemented
- Backend storage now uses local SQLite persistence at `backend/data/whisper_caravan.db` by default
- Backend vector candidates now use Chroma at `backend/data/chroma` when available
- Backend embeddings are local and deterministic in `backend/app/embeddings.py`
- Backend query and reaction responses now include optional debug metadata for `retrievalSource`, candidate counts, and filtered counts
- Backend query evidence ordering is now deterministic by day desc, reliability desc, title asc, source asc, memory id asc
- Backend reaction accepted/rejected evidence lists now use the same deterministic ordering within each group
- Backend/vector and backend/sqlite debug output is now phrased as candidate-mode diagnostics rather than mixed source/mode shorthand
- Backend vector retrieval now caps default candidate breadth at `8` when no explicit query limit is provided
- Explicit backend query limits still widen candidate breadth with `max(limit * 3, limit, 8)` up to the session total
- Nonpositive explicit query limits now safely return empty evidence instead of relying on slice semantics
- Backend vector candidate documents now encode day/source/location/visibility/reliability/evidence-role/active/tag text from authoritative records
- Backend query/reaction text now encodes deterministic request and NPC context for narrowed vector retrieval
- Frontend retrieval is routed through `lib/retrievalAdapter.ts`
- Local deterministic fallback is preserved when the backend is not running
- Local fallback evidence and Day 8 reaction lists now mirror the same deterministic ordering policy
- Retrieved evidence now carries source/day/location/active/tag metadata into the UI
- Evidence panel now shows developer-facing `Evidence Source` and `Reaction Source` badges
- Browser console now logs retrieval sync lines with separate `evidenceSource` / `evidenceMode` and `reactionSource` / `reactionMode` fields
- Day 8 NPC reactions can come from backend-returned structured JSON while staying aligned with the current deterministic rules
- Inactive memories remain excluded from NPC reactions in both local and backend rule paths
- A cheap persistence test now verifies memory metadata survives store reopen across backend restart
- Focused retrieval tests now verify vector candidate ids still respect SQLite truth and deterministic filters
- Focused retrieval tests now verify the default vector cap, explicit limit widening, and deterministic retrieval text helpers
- If Chroma is unavailable, the backend falls back to SQLite-only deterministic retrieval without changing API shapes

## Next Task

Run a manual Day 8 smoke test with enough memories to observe the default candidate cap in the backend/vector path, then decide whether the next retrieval slice should tune the cap value itself or refine query/document text further based on observed misses.

## Needs Testing

- Recommended manual browser smoke test with backend running:
  - ingest after several choices
  - public evidence query before Day 8
  - Day 8 reactions for all four NPCs
- Manual startup / verification steps now documented in `docs/versions/v0.4.md`
- Recommended spot checks:
  - inactive Day 1 short-term memories do not leak on Day 8
  - Bear Judge rejects unsupported rumors and private evidence
  - Crow Broker can use public rumors
  - Fox Merchant can use records/contracts/trade-relevant evidence
  - evidence remains available after backend restart when the same session id is reused
  - Chroma candidate retrieval never causes inactive or inaccessible evidence to leak past SQLite/rules filtering
  - `retrievalSource` reports `vector` when Chroma candidates are used and `sqlite` when vector fallback is active
  - final evidence order stays stable even when vector candidate ids arrive in a different order
  - console output clearly separates response source from candidate mode during backend/manual smoke checks
  - backend/vector runs with more than `8` memories now show a capped candidate count by default
- Future drift risk to watch:
  - deterministic NPC rules now exist in both `lib/gameLogic.ts` and `backend/app/rules.py`
