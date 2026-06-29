# Codex Handoff

## Current Version and Version File

v0.7

`docs/versions/v0.7.md`

## Current State

v0.1 frontend-only prototype is complete.

v0.2 is complete in code and build-verified.

v0.3.0 is complete in code:

Deterministic NPC access rules exist for Deer Guard, Fox Merchant, Crow Broker, and Bear Judge. Inactive memories stay out of retrieval, unsupported Bear Court rumors are rejected unless supported, and the UI explains accepted and rejected evidence.

v0.4.0 is complete in code:

FastAPI ingest/query/reaction routes exist, SQLite is the authoritative memory store, Chroma returns candidate ids only, deterministic rule filtering remains authoritative, and frontend retrieval falls back locally when the backend is unavailable.

v0.5 slice 4C is now in place:

The playable web build now uses the full 26-card pool from `docs/story-spec.md` to assemble deterministic route-dependent fourteen-day runs while preserving one major event per day, two collapse checkpoints, deterministic Bear Court trial scoring, and all five endings. The browser still supports a playtest title screen, Start/Continue/Restart flow, local save persistence, player-facing ending presentation, and frontend-only deployment without requiring the backend at runtime.

v0.6 slice 1 is now in place:

The codebase now includes a separate structured NPC reaction layer for the first four v0.6 RAG-target NPCs while keeping frontend-only playability intact. Shared reaction types, deterministic validation/clamping, local fallback reactions, and pure reaction application logic now exist without requiring a backend or changing Bear Court trial authority.

v0.6 slices 2 through 4 are now in place:

The backend now exposes a structured `POST /npc/reaction` route for the four first-pass v0.6 NPCs, can use the existing session-based retrieval stack when a structured reaction request includes a session id, and keeps all gameplay deltas deterministic even when an optional dialogue/tone provider boundary is enabled. Frontend-only local play still works with no backend and no API key.

v0.6 slice 5 is now in place:

The browser UI now exposes a player-facing structured NPC reaction loop on relevant event cards. The current run passes its real `sessionId` into structured reaction requests, backend-enabled runs can use retrieval-backed reactions when available, frontend-only fallback still works, and collected structured evidence plus a lightweight trial preview are now visible in the playtest UI without rewriting Bear Court scoring.

v0.6 slice 6 is now in place:

The browser UI now presents the run as an illustrated desktop-first web game surface. Authored event cards display mapped scene art, the right rail uses a compact Day/Status card plus a switchable Memory or Evidence panel, and debug/backend notices remain hidden by default without changing gameplay rules or trial authority.

v0.7 is now in place:

The backend now supports an optional Gemini dialogue provider on top of the structured NPC reaction stack. `POST /npc/reaction` still computes gameplay fields deterministically first, then allows Gemini to override only dialogue, tone, and optional public-facing explanation text, with safe fallback on missing config, API failure, invalid JSON, or invalid tone.

## Current v0.7 Goal

All planned v0.7 slices are now in place:

- slice 1: keep `dialogue_provider.py` as the only provider boundary and preserve stub coverage
- slice 2: add Gemini-backed dialogue/tone/public-reason override for `POST /npc/reaction`
- slice 3: validate and fall back safely on missing config, invalid JSON, or invalid tone
- slice 4: prove via backend tests that gameplay fields remain deterministic

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

v0.7 Gemini dialogue provider integration:

- preserved `POST /npc/reaction` as the only frontend-facing structured NPC endpoint
- kept deterministic structured gameplay fields authoritative before any provider override
- extended `backend/app/dialogue_provider.py` from `stub`-only to `stub` plus `gemini`
- added Gemini JSON-only dialogue/tone/public-reason override with safe fallback on missing config, transport failure, invalid JSON, or invalid tone
- kept frontend request and response shape unchanged
- added backend coverage proving valid Gemini overrides do not mutate trust, legal risk, routes, evidence, memory refs, or flags

Verification on June 28, 2026:

- `.venv/bin/python -m unittest backend.tests.test_structured_reaction backend.tests.test_rules backend.tests.test_store backend.tests.test_retrieval` passes
- `npm run build` passes

Current repo behavior after v0.6 slice 6:

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
  - an illustrated title screen with Start, Continue, Restart, and Clear Save flow
  - local save persistence in browser `localStorage`
  - deterministic restore of the current run after refresh
  - a large scene illustration area for authored event cards with safe fallback art treatment when needed
  - a right rail with one compact Day/Status card and one switchable Memory or Evidence journal
  - developer/debug metadata hidden by default behind a dev-only toggle
  - a structured NPC interaction panel on relevant loop scenes
  - lightweight latest-reaction feedback in the event card
  - collected structured evidence and a non-authoritative trial preview inside the evidence journal
- frontend deployment shape is now safe by default:
  - in development, frontend retrieval still defaults to `http://127.0.0.1:8000`
  - in production, the frontend does not assume a backend unless `NEXT_PUBLIC_BACKEND_URL` is set
  - if no backend is configured or reachable, retrieval falls back locally without crashing
- structured NPC reaction groundwork now exists for:
  - `fox_ledger_master`
  - `crow_broker`
  - `camp_healer`
  - `village_apothecary`
- the new `lib/reactionAdapter.ts` layer:
  - only calls a backend reaction endpoint when `NEXT_PUBLIC_BACKEND_URL` is explicitly configured
  - otherwise returns deterministic local fallback reactions
  - validates and clamps structured fields before they are applied
  - posts to `/npc/reaction` using the structured v0.6 request body, including optional `session_id` when a caller provides it
- the browser now builds and sends structured reaction requests with:
  - `npc_id`
  - current run `sessionId`
  - current day
  - route hint when available
  - scene-derived `player_input`
  - known memory ids
  - compact game state summary
- the backend `POST /npc/reaction` route now:
  - accepts the structured v0.6 request shape
  - returns the structured v0.6 reaction shape
  - safely handles unknown NPC ids
  - can stay purely deterministic with no session data
  - can use stored session memories and vector candidate resolution when `session_id` is provided
- retrieval-backed structured reactions now:
  - exclude inactive memories
  - apply per-NPC believable-scope filtering for the four v0.6 NPCs
  - convert accepted memories into structured evidence summaries
  - populate `memory_refs` from accepted evidence
  - derive gameplay deltas from deterministic backend rules rather than generation
  - use the current browser run when the backend is enabled and the session-backed ingest loop has already populated memory state
- optional dialogue generation boundary now exists:
  - only `dialogue`, `tone`, and optional `public_reason` may be overridden
  - invalid tone/output falls back to deterministic dialogue
  - gameplay fields never come from the provider layer
  - provider selection now supports `stub` and `gemini`
  - Gemini uses a backend-only HTTP integration path and is optional
  - no API key is required for tests, build, or local play
- `applyNpcReaction()` now deterministically updates, when present:
  - per-NPC trust
  - legal risk
  - collected reaction evidence
  - unlocked routes
  - per-NPC price modifiers
  - quest availability flags
  - generic flags
  - latest structured reaction
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
3. Set `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000` only when intentionally testing backend-assisted retrieval or structured reactions

Structured reaction smoke check:

1. Run `npm run dev`
2. Run `.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
3. Set `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`
4. Start or continue a run so the existing retrieval sync keeps ingesting memories under the browser session id
5. Open a loop scene that surfaces a structured NPC interaction
6. Trigger the NPC interaction button and confirm the response applies trust, legal risk, route, and evidence changes without double-applying on repeat clicks

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
- structured NPC reactions are wired into relevant loop-scene UI, but the current presentation remains a constrained first-pass interaction layer rather than a full conversation system

## Next Task

Recommended next slice:

- decide whether to expose a small developer-only backend/provider status indicator in the UI while keeping normal player-facing presentation clean

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
- structured reaction checks:
  - manual browser smoke test that the frontend still plays end to end with no backend configured
  - manual backend-assisted smoke test of `POST /npc/reaction` with and without `session_id`
  - loop-scene NPC interaction flow with backend enabled and disabled
  - confirmation that duplicate button clicks do not apply trust/legal risk twice
  - future deterministic trial wiring for `collectedEvidence`

## Drift Risks

- deterministic NPC rules still exist in both `lib/gameLogic.ts` and `backend/app/rules.py`
- route selection currently relies on deterministic scoring over tags, factions, and legal risk rather than explicit authored branch tables
- trial score weights are preserved, but the broader pool may still need calibration after real playtest feedback
- collected structured evidence is now visible to the player, but final Bear Court scoring still does not consume it directly
