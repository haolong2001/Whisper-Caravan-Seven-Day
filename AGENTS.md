# AGENTS.md

## Purpose

This repository contains **Whisper Caravan**, a narrative prototype about memory decay, public evidence, and delayed social consequences across a seven-day travel loop.

The current codebase is a **frontend-only playable prototype** built with Next.js. It is feature-wise closer to `v0.2` than `v0.1`, and `package.json` now reports `0.2.0`.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS

## Source Of Truth

- Product direction: `docs/PRODUCT_BRIEF.md`
- Game systems: `docs/GAME_DESIGN.md`
- Technical structure: `docs/ARCHITECTURE.md`
- Delivery sequence: `docs/ROADMAP.md`
- Agent handoff notes: `docs/CODEX_HANDOFF.md`

Treat `docs/ARCHITECTURE.md` as the current architecture reference. The older root-level `ARCHITECTURE.md` is a legacy snapshot and may lag behind the code.

## Important Paths

- `app/page.tsx`: top-level screen orchestration
- `lib/mockData.ts`: authored world events and choices
- `lib/gameLogic.ts`: pure state transitions and retrieval logic
- `lib/types.ts`: domain types
- `components/`: UI panels and cards
- `docs/versions/`: version scope definitions
- `docs/decisions/`: ADR-style product and architecture decisions

## Working Rules

- Keep game rules and state transitions in `lib/`, not inside components.
- Prefer pure functions for choice application, forgetting, retrieval, and scoring.
- Keep `app/page.tsx` as the composition root; do not spread state ownership across many components unless the architecture is intentionally revised.
- When adding features that change scope, update:
  - `CHANGELOG.md`
  - `docs/ROADMAP.md`
  - the relevant file in `docs/versions/`
- When making architectural changes, add a new ADR in `docs/decisions/`.
- If you align release/version labeling, update both `package.json` and user-facing copy in the UI.

## Local Commands

```bash
npm install
npm run dev
npm run build
```

## Known Gaps

- No automated tests yet
- No backend or persistent storage
- No real retrieval pipeline or vector store
- Version labeling is not fully synchronized across code and docs
