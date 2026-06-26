# Codex Handoff

## Current Version and version file

v0.3.0

`docs/versions/v0.3.md`

## Current State

v0.1 frontend-only prototype is complete.

v0.2 is complete in code and build-verified.

v0.2 implements

7 daily events → choices create memories → Memory Inspector updates → Day 7 collapse preview → Day 8 forgetting → NPC reacts based on remaining active evidence.

v0.3.0 has started with the first small slice:

Day 8 now shows deterministic Bear Court accepted/rejected evidence, inactive memories stay out of court retrieval, and unsupported rumors are explicitly rejected client-side.

The second v0.3.0 slice is now in place:

Deer Guard, Fox Merchant, Crow Broker, and Bear Judge each have explicit profiles, distinct visibility/type/reliability rules, and deterministic Day 8 reactions over the same active memory stack.

Current v0.3 Goal

Improve consequence clarity, evidence categories, NPC access rules, and Day 8 judgment presentation without adding backend, LLM, vector database, save/load, combat, inventory, or map screen.

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

v0.3.0 slice 2: explicit NPC profiles and per-NPC access rules.

Verification on June 26, 2026:

- `npm run build` passes
- Day 1 → Day 8 loop is closed in current state orchestration and pure game rules
- Day 7 collapse preview and Day 8 multi-NPC aftermath are wired into the main flow
- Deer Guard, Fox Merchant, Crow Broker, and Bear Judge now use explicit profiles from `lib/mockData.ts`
- NPC retrieval now filters by active status, visibility scope, memory type, and reliability in `lib/gameLogic.ts`
- Day 8 UI explains why each NPC accepted or rejected each active memory
- Bear Judge still rejects unsupported rumors deterministically in client-side game logic
- Inactive memories are excluded from all NPC reactions

## Next Task

Continue v0.3 by tightening faction-aware reaction differences and refining any weak spots in the current visibility/reliability explanation UI.

## Needs Testing

- Recommended manual browser smoke test for one full Day 1 → Day 8 playthrough
- Recommended spot checks for alternate weekly routes and Bear Court preview output
