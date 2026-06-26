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

Current v0.4 Goal

Stand up the real retrieval backend in small deterministic slices: stable API contract first, metadata filtering first, no LLM generation yet, no Chroma yet, and no major frontend rewrite.

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

v0.4.0 slice 2: SQLite-backed backend persistence with stable API shapes.

Verification on June 27, 2026:

- `npm run build` passes
- Python backend modules compile with `PYTHONPYCACHEPREFIX=/private/tmp/whisper-caravan-pycache .venv/bin/python -m compileall backend/app backend/tests`
- Backend tests pass with `.venv/bin/python -m unittest backend.tests.test_rules backend.tests.test_store` after installing `backend/requirements.txt`
- FastAPI backend skeleton exists under `backend/app/`
- `/health`, `/memories/ingest`, `/memories/query`, and `/npc/reaction` are implemented
- Backend storage now uses local SQLite persistence at `backend/data/whisper_caravan.db` by default
- Frontend retrieval is routed through `lib/retrievalAdapter.ts`
- Local deterministic fallback is preserved when the backend is not running
- Retrieved evidence now carries source/day/location/active/tag metadata into the UI
- Evidence panel now shows developer-facing `Evidence Source` and `Reaction Source` badges
- Browser console now logs retrieval sync lines with `evidence=backend|local` and `reactions=backend|local|not-requested`
- Day 8 NPC reactions can come from backend-returned structured JSON while staying aligned with the current deterministic rules
- Inactive memories remain excluded from NPC reactions in both local and backend rule paths
- A cheap persistence test now verifies memory metadata survives store reopen across backend restart

## Next Task

Run a manual end-to-end smoke test with the FastAPI server live and confirm evidence survives backend restart, then decide whether v0.4 slice 3 should add richer query/debug tooling or begin vector-store integration.

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
- Future drift risk to watch:
  - deterministic NPC rules now exist in both `lib/gameLogic.ts` and `backend/app/rules.py`
