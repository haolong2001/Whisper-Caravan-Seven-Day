# Codex Handoff

## Current Version and version file

v0.3.0

`docs/versions/v0.3.md`

## Current State

v0.1 frontend-only prototype is complete.

v0.2 is complete in code and build-verified.

v0.2 implements

7 daily events → choices create memories → Memory Inspector updates → Day 7 collapse preview → Day 8 forgetting → NPC reacts based on remaining active evidence.

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

v0.2 seven-day memory loop.

Verification on June 26, 2026:

- `npm run build` passes
- Day 1 → Day 8 loop is closed in current state orchestration and pure game rules
- Day 7 collapse preview and Day 8 Deer Guard aftermath are wired into the main flow

## Next Task

Start v0.3 with a small vertical slice from `docs/versions/v0.3.md`.

## Needs Testing

- Recommended manual browser smoke test for one full Day 1 → Day 8 playthrough
- Recommended spot checks for alternate weekly routes and Bear Court preview output
