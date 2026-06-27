# Codex Handoff

## Current Version and Version File

v0.5

`docs/versions/v0.5.md`

## Current State

v0.1 frontend-only prototype is complete.

v0.2 is complete in code and build-verified.

v0.3.0 is complete in code:

Deterministic NPC access rules exist for Deer Guard, Fox Merchant, Crow Broker, and Bear Judge. Inactive memories stay out of retrieval, unsupported Bear Court rumors are rejected unless supported, and the UI explains accepted and rejected evidence.

v0.4.0 is complete in code:

FastAPI ingest/query/reaction routes exist, SQLite is the authoritative memory store, Chroma returns candidate ids only, deterministic rule filtering remains authoritative, and frontend retrieval falls back locally when the backend is unavailable.

v0.5 slice 4C is now in place:

The playable web build now uses the full 26-card pool from `docs/story-spec.md` to assemble deterministic route-dependent fourteen-day runs while preserving one major event per day, two collapse checkpoints, deterministic Bear Court trial scoring, and all five endings. The browser still supports a playtest title screen, Start/Continue/Restart flow, local save persistence, player-facing ending presentation, and frontend-only deployment without requiring the backend at runtime.

## Current v0.5 Goal

Turn the prototype into a playable beta in small deterministic slices:

- slice 1: timeline and phase framework
- slice 2: fixed fourteen-day starter spine content pass
- slice 3: deterministic Bear Court trial scoring and ending resolution
- slice 4A: web playtest build and fixed-spine playtest hardening
- slice 4C: route-dependent 26-card pool and broader beta content expansion
- slice 5: post-pool playtest polish and beta tuning

## System Reference

Read `docs/GAME_SYSTEMS.md` when changing:

- domain model
- memory lifecycle
- NPC memory access
- faction/resource effects
- retrieval logic
- final trial evidence logic

## Architecture Reminder

- State orchestration: `app/page.tsx`
- Data: `lib/mockData.ts`
- Rules: `lib/gameLogic.ts`
- Types: `lib/types.ts`
- UI: `components/`

## Last Completed

v0.5 slice 4C: route-dependent 26-card pool and broader beta content expansion.

Verification on June 27, 2026:

- `npm run test:timeline` passes
- `.venv/bin/python -m unittest backend.tests.test_rules backend.tests.test_store backend.tests.test_retrieval` passes
- `PYTHONPYCACHEPREFIX=/private/tmp/whisper-caravan-pycache .venv/bin/python -m compileall backend/app backend/tests` passes
- `npm run build` passes

Current repo behavior after slice 4C:

- the game now keeps a 26-card authored pool in `lib/mockData.ts`
- each run deterministically selects a route-dependent subset of fourteen cards
- one major event appears per player-facing day across Days 1 through 14
- Day 15 remains the Bear Court resolution phase, not a normal event card
- the phased run model from slices 1 to 3 remains intact:
  - `loop_one`
  - `collapse_one`
  - `loop_two`
  - `collapse_two`
  - `trial`
  - `ending`
- collapse previews and seven-day forgetting remain deterministic
- Bear Court still evaluates:
  - accepted evidence
  - rejected evidence
  - expired memories
  - rumor conflicts
  - faction modifiers
  - legal risk
- ending priority remains deterministic:
  - A1 Full Truth / Public Justice
  - A2 Partial Truth / Necessary Crime
  - B Merchant Settlement
  - C Folk Hero / Rumor Victory
  - D Guilty Exile
- structural anchor cards always appear:
  - Day 1: Deer Village Medicine Conflict
  - Day 7: First Memory Collapse Night
  - Day 13: Court Packet Sorting
  - Day 14: Eve of Bear Court
- route pressure now biases which cards fill Days 2 through 6 and Days 8 through 12:
  - truth pressure favors court evidence, necessity, and system-exposure cards
  - merchant pressure favors ledger cleanup, settlement, audit, and debt cards
  - rumor pressure favors songs, broadsides, and public-memory cards
  - failure pressure favors contradiction, suspicion, and pressure cards
- frontend simulations now prove route-dependent fourteen-day paths still reach the trial and can feed all five endings through deterministic fixtures
- the browser UI now includes:
  - visible build label: `Whisper Caravan v0.5 Playtest - Slice 4C`
  - title screen with Start, Continue, Restart, and Clear Save flow
  - local save persistence in browser `localStorage`
  - deterministic restore of the current run after refresh
  - ending presentation that shows ending id and title and asks for screenshot/feedback
  - developer/debug metadata hidden by default behind a dev-only toggle
- frontend deployment shape is now safe by default:
  - in development, frontend retrieval still defaults to `http://127.0.0.1:8000`
  - in production, the frontend does not assume a backend unless `NEXT_PUBLIC_BACKEND_URL` is set
  - if no backend is configured or reachable, retrieval falls back locally without crashing
- backend authority remains unchanged:
  - SQLite is authoritative
  - Chroma returns candidate ids only
  - deterministic filtering lives in `backend/app/rules.py`
  - deterministic evidence ordering remains day desc, reliability desc, title asc, source asc, memory id asc

## Local Run

Frontend-only playtest:

1. `npm install` if dependencies are missing.
2. `npm run dev`
3. Open `http://127.0.0.1:3000`

Optional backend-assisted local run:

1. Start frontend with `npm run dev`
2. Start backend with `.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
3. Leave `NEXT_PUBLIC_BACKEND_URL` unset in development unless using a non-default backend URL

## Build and Deploy

- Build with `npm run build`
- The current app builds as a static Next.js page output without requiring backend env vars
- Frontend-only deployment is the recommended playtest shape for friends
- Set `NEXT_PUBLIC_BACKEND_URL` only if you intentionally want hosted frontend traffic to hit a hosted FastAPI backend

## Known Playtest Limits

- route-dependent selection is deterministic but still heuristic rather than fully authored per-branch
- browser persistence is local-only and single-device
- no accounts, cloud saves, analytics, multiplayer, or feedback backend exist
- backend ingest/query can still be used locally, but the shipped playtest does not require it

## Next Task

Recommended next slice:

- v0.5 slice 5: absorb route-pool playtest feedback, tune route clarity and card weighting, and tighten trial readability without changing backend authority

## Needs Testing

- manual browser smoke test through:
  - title screen Start / Continue / Restart / Clear Save flow
  - refresh during an in-progress run and confirm deterministic resume
  - loop one scene progression
  - first collapse preview
  - loop two scene progression
  - second collapse preview
  - deterministic trial resolution
  - deterministic ending resolution
- manual hosted-frontend smoke test with no backend configured:
  - confirm the run completes end to end
  - confirm no player-facing crash occurs when backend is absent
- backend/manual regression checks:
  - ingest still works when backend is running
  - local/backend evidence ordering stays identical
  - vector candidate breadth behavior remains unchanged

## Drift Risks

- deterministic NPC rules still exist in both `lib/gameLogic.ts` and `backend/app/rules.py`
- route selection currently relies on deterministic scoring over tags, factions, and legal risk rather than explicit authored branch tables
- trial score weights are preserved, but the broader pool may still need calibration after real playtest feedback
