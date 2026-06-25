# Codex Handoff

## Project Status

Whisper Caravan is currently a playable frontend prototype centered on a seven-day memory loop. The code already contains authored events for Days 1-7 and a Day 8 consequence pass based on surviving public evidence.

## What Is Stable

- Core domain model in `lib/types.ts`
- Authored event content in `lib/mockData.ts`
- Pure game transitions in `lib/gameLogic.ts`
- Single-page UI composition in `app/page.tsx`
- Main presentation panels in `components/`

## What Needs Attention

### 1. Version Label Drift

- `package.json` now says `0.2.0`
- UI hero copy says `v0.2`
- repo scope is aligned with `v0.2`

The remaining work is mostly release hygiene, not version-name mismatch.

### 2. Documentation Drift

There is an older root `ARCHITECTURE.md` that reflects an earlier single-incident structure. Use `docs/ARCHITECTURE.md` as the current reference unless the root file is intentionally updated or removed later.

### 3. No Test Coverage

The highest-value missing tests are:

- `applyChoice`
- `advanceDay`
- `applySevenDayForgetting`
- `getMemoryCollapsePreview`
- `getDeerGuardReaction`
- `getBearCourtPreview`

## Recommended Next Tasks

1. Add unit tests for `lib/gameLogic.ts`.
2. Split `lib/mockData.ts` into smaller content modules if more events or NPCs are added.
3. Decide whether the next milestone is:
   - more authored content, or
   - backend retrieval integration
4. Clean up the legacy architecture doc situation.

## Editing Guidance

- Keep authored content data-driven.
- Prefer extending `lib/types.ts` and `lib/gameLogic.ts` before adding UI-only conditionals.
- Preserve the current inspectable prototype quality: players should always be able to understand why a reaction happened.
- Update `CHANGELOG.md` and relevant docs when scope changes.

## Suggested Release Discipline

- Treat `docs/versions/` as scope contracts
- Treat `docs/decisions/` as decision history
- Use `RELEASE_CHECKLIST.md` before tagging any milestone
