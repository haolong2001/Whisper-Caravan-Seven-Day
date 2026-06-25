# Whisper Caravan: Seven-Day Memory Architecture

## Overview

This project is a small Next.js App Router demo that presents a game-oriented RAG memory flow.

The core idea:

- Day 1: the player makes a choice in Deer Village.
- If the player steals medicine, the app writes three memory traces.
- Day 8: short-term memory expires, but public records and rumors remain retrievable.
- The frontend calls an NPC reaction endpoint and renders the returned dialogue, evidence, and gameplay effects.

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Client-side state managed with `useState` only

## Directory Structure

```text
app/
  api/
    npc-react/
      route.ts         # Mock backend endpoint for Deer Guard reaction
  globals.css          # Global styles and visual theme
  layout.tsx           # Root layout
  page.tsx             # Main page and top-level state orchestration

components/
  ChoiceCard.tsx       # Reusable choice button card
  DayTracker.tsx       # Day display and Day 8 jump action
  EvidencePanel.tsx    # NPC response, evidence cards, gameplay changes
  GameScene.tsx        # Narrative event panel and player choices
  MemoryPanel.tsx      # Memory inspector for active/inactive memories

lib/
  types.ts             # Shared TypeScript domain types

next.config.ts         # Next.js config
tailwind.config.ts     # Tailwind theme config
postcss.config.js      # PostCSS config
tsconfig.json          # TypeScript config
```

## Runtime Architecture

### 1. Page Composition

The UI is rendered from `app/page.tsx` and arranged into three panels:

1. `GameScene`
2. `MemoryPanel`
3. `EvidencePanel`

`DayTracker` sits above the grid and controls time advancement to Day 8.

### 2. State Ownership

`app/page.tsx` is the single state owner for the demo.

It manages:

- `day`
- `location`
- `selectedChoice`
- `memories`
- `sceneStatus`
- `hasForgotten`
- `npcResponse`
- `retrievedEvidence`
- `gameChanges`
- `isLoadingReaction`

Child components are presentational and receive data plus handlers via props.

### 3. Memory Model

The memory model is defined in `lib/types.ts`.

There are two related domains:

- `MemoryItem`: internal game memory state shown in the Memory Inspector
- `RetrievedEvidence`: evidence returned by the NPC API

Memory categories:

- `short_term`
- `record`
- `rumor`

Key retention rules:

- `short_term` can expire with `expiresOn`
- `record` and `rumor` are persistent
- expired memories stay in state but are marked `active: false`

## Main Interaction Flow

### Day 1 Choice Flow

When the player selects an option in `GameScene`, `handleChoiceSelect` in `app/page.tsx`:

- stores the selected choice
- resets Day 8 output state
- updates the scene status
- writes demo memories only for choice `B`

If the player chooses `Steal medicine to save refugees`, three memories are inserted:

1. Guard witness memory as `short_term`
2. Wanted notice as `record`
3. Refugee song as `rumor`

### Day 8 Forgetting Flow

When the player clicks `Jump to Day 8`, `handleJumpToDay8`:

1. advances the day to 8
2. runs `applySevenDayForgetting`
3. marks expired short-term memories inactive
4. updates the Memory Inspector
5. if the player had chosen `B`, calls the NPC API

`applySevenDayForgetting` is a pure helper in `app/page.tsx` that transforms memory state without mutating the original array.

## API Layer

### Endpoint

`app/api/npc-react/route.ts`

### Request

The frontend sends:

```json
{
  "npcId": "deer_guard",
  "currentDay": 8,
  "playerQuery": "Do you know me?"
}
```

### Response

The endpoint returns:

- `dialogue`
- `trust_delta`
- `price_modifier`
- `quest_available`
- `evidence`

This simulates a backend retrieval-and-reaction step where the NPC no longer remembers the player directly, but can still act on persistent public evidence.

## Component Responsibilities

### `GameScene`

- Displays the Deer Village event
- Renders the 4 player choices
- Shows the current narrative consequence

### `ChoiceCard`

- Reusable button card for a single choice
- Handles selected styling

### `MemoryPanel`

- Shows all stored memories
- Distinguishes type, visibility, retention, and active/inactive state
- Makes the forgetting behavior visible to the player

### `EvidencePanel`

- Shows NPC dialogue
- Renders evidence cards returned by the API
- Displays gameplay effects:
  - `trust_delta`
  - `price_modifier`
  - `quest_available`

### `DayTracker`

- Displays current day and location
- Triggers Day 8 advancement
- Shows busy state while the NPC reaction is loading

## Data Flow

```text
User choice
  -> handleChoiceSelect()
  -> memory state updated
  -> MemoryPanel reflects memory writes

Jump to Day 8
  -> handleJumpToDay8()
  -> applySevenDayForgetting()
  -> memories updated
  -> fetch("/api/npc-react")
  -> EvidencePanel renders returned dialogue and evidence
```

## Styling Architecture

Styling is split across:

- `app/globals.css` for global theme, background, panel utilities
- Tailwind utility classes inside components
- `tailwind.config.ts` for custom colors and shadows

The visual style is intentionally game-like:

- dark caravan-night background
- parchment and ember accents
- translucent panel surfaces

## Extension Points

This demo is set up so it can be extended without changing the overall architecture.

Likely next steps:

- move `theftMemories` and event definitions into data files
- move forgetting logic into `lib/` helpers
- add multiple NPC endpoints or a dynamic `npcId`
- send `updatedMemories` to the backend for real retrieval
- replace the mock route with a real RAG service
- add multiple days, villages, and branching quests

## Current Design Constraints

- All frontend state is local and stored with `useState`
- The NPC API is currently mocked inside the Next.js app
- There is only one playable event
- Only choice `B` exercises the full memory-and-retrieval demo path

## Summary

The project is organized around one top-level stateful page, a small set of focused presentational components, a shared type layer, and a single mock API route.

That structure keeps the demo simple while still clearly separating:

- game state
- memory state
- retrieval response
- UI rendering
