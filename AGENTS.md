# AGENTS.md

## Project

Whisper Caravan: Seven-Day Memory is a frontend-first narrative game prototype.

## Normal Codex Workflow

For normal coding tasks, read:

- `docs/CODEX_HANDOFF.md`
- the current version file listed in `docs/CODEX_HANDOFF.md`

Only read `docs/GAME_SYSTEMS.md` when changing:

- domain types
- memory lifecycle
- event/choice effects
- NPC reaction logic
- faction/resource logic
- retrieval or RAG-related logic

Do not scan all docs unless the user asks for planning, architecture, release, or refactor work.

## Architecture Rules

- `app/page.tsx` owns top-level state orchestration.
- `lib/mockData.ts` owns static game content.
- `lib/gameLogic.ts` owns pure game rules.
- `lib/types.ts` owns shared TypeScript domain types.
- Components should be presentational whenever possible.
- Do not put branching story logic inside JSX.

## Codex Development Rules

- Implement one version at a time.
- Keep changes small and reviewable.
- Preserve existing file boundaries.
- Do not rewrite unrelated files.
- Prefer deterministic logic before generative logic.
- `npm run build` must pass after each version or meaningful coding task.
- After each version, update `docs/CODEX_HANDOFF.md`.
- Update version docs only when version scope, status, or acceptance criteria changed.

## Forbidden Unless Explicitly Requested

- Backend
- API routes
- LLM calls
- Vector database
- Auth
- Save/load
- Combat
- Inventory
- Map screen
