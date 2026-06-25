# Architecture

This document is the current technical reference for the playable prototype. It supersedes the older root-level `ARCHITECTURE.md`, which describes an earlier single-incident shape of the project.

## Overview

The app is a frontend-only Next.js prototype. It keeps all authored content, state transitions, and retrieval logic in-process so the team can iterate quickly on the core memory-consequence loop before introducing backend complexity.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS

## Top-Level Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx

components/
  ChoiceCard.tsx
  DayTracker.tsx
  EvidencePanel.tsx
  GameScene.tsx
  MemoryCollapsePanel.tsx
  MemoryPanel.tsx
  StatusPanel.tsx

lib/
  gameLogic.ts
  mockData.ts
  types.ts
```

## Architectural Style

The app follows a simple pattern:

- `app/page.tsx` owns runtime state
- `lib/mockData.ts` holds authored content
- `lib/gameLogic.ts` holds pure transformation logic
- `components/` render state and fire user actions

This keeps the prototype easy to reason about and easy to migrate later.

## Runtime State Model

`GameState` currently contains:

- `currentDay`
- `memories`
- `factions`
- `resources`
- `dayChoices`
- `sceneStatus`
- `hasAppliedDay8`

`app/page.tsx` derives view-specific values from this state, including:

- current event
- whether the day has already been chosen
- whether the Day 7 collapse preview is active
- whether the Day 8 aftermath is active
- active vs expired memories
- active public evidence
- Deer Guard reaction

## Domain Modules

### `lib/types.ts`

Defines the core domain model:

- choices and events
- memory items and evidence
- factions and resources
- NPC reaction payloads
- memory collapse preview data

### `lib/mockData.ts`

Contains:

- initial game state
- initial UX copy
- Day 8 aftermath content
- authored game events for Days 1-7

This file currently serves as the project's content database.

### `lib/gameLogic.ts`

Contains pure gameplay logic:

- `getEventForDay`
- `applyChoice`
- `advanceDay`
- `applySevenDayForgetting`
- `getActiveMemories`
- `getExpiredMemories`
- `getActivePublicEvidence`
- `getMemoryCollapsePreview`
- `applyDay8Transition`
- `getBearCourtPreview`
- `getDeerGuardReaction`

This file is the best insertion point for future extraction into backend-shared logic or testable simulation modules.

## UI Composition

### `app/page.tsx`

Responsibilities:

- initialize `GameState`
- derive display state
- handle choice submission
- advance days
- switch between collapse preview and aftermath panels

### Component Responsibilities

- `DayTracker`: day status and progression CTA
- `StatusPanel`: factions and resources snapshot
- `GameScene`: event narrative plus daily choices
- `ChoiceCard`: single choice presentation
- `MemoryPanel`: full memory stack inspection
- `MemoryCollapsePanel`: Day 7 preview of expiring vs surviving traces
- `EvidencePanel`: Day 8 reaction, evidence, effects, and court preview

## Data Flow

```text
Player selects a choice
  -> applyChoice(gameState, choice)
  -> memories, factions, resources, and dayChoices update
  -> UI re-renders from derived state

Player advances time
  -> advanceDay() or applyDay8Transition()
  -> short-term memories may expire on Day 8
  -> active public evidence is re-derived
  -> Deer Guard reaction and Bear Court preview are computed
```

## Why Frontend-Only For Now

- Fast iteration on the premise
- Zero deployment dependency for backend services
- Easy debugging of memory state in the UI
- Lower implementation cost while game rules are still changing

## Current Constraints

- No persistence across refresh
- No API boundary around retrieval
- No automated validation for authored content integrity
- No unit tests around memory transition rules

## Suggested Next Refactors

1. Add unit tests around `lib/gameLogic.ts`.
2. Separate authored content by day or region once `mockData.ts` grows further.
3. Introduce a small service layer if backend retrieval is added.
4. Keep version labeling aligned across package metadata, UI copy, and docs.
