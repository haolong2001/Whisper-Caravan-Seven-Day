# Whisper Caravan

Whisper Caravan is a narrative systems prototype about what happens **seven days after a morally ambiguous action**. The player guides a caravan through one week of travel, creating memories that may fade privately but survive publicly as records, rumors, and songs.

## Current Status

- Playable frontend prototype
- 7 authored days plus Day 8 aftermath
- 4 choices per day
- Memory creation, expiration, and retrieval preview
- NPC reaction logic based on surviving public evidence
- Bear Court evidence preview

The repository is currently **feature-wise at `v0.2` scope**, and `package.json` now reports `0.2.0`.

## Core Idea

The design question is simple:

> If a witness forgets you after seven days, what still remains powerful enough to shape how the world treats you?

The prototype answers that through a memory model with:

- `short_term` memories that expire
- `record`, `song`, and `rumor` traces that persist publicly
- retrieval logic that drives NPC dialogue and downstream effects

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project Structure

```text
app/                    Next.js App Router entrypoints
components/             UI panels and reusable cards
lib/                    domain types, authored content, pure game logic
docs/                   product, design, architecture, roadmap, handoff
docs/versions/          scope definitions by version
docs/decisions/         ADR-style decisions
```

## Documentation Map

- Product brief: `docs/PRODUCT_BRIEF.md`
- Game design: `docs/GAME_DESIGN.md`
- Architecture: `docs/ARCHITECTURE.md`
- Roadmap: `docs/ROADMAP.md`
- Codex handoff: `docs/CODEX_HANDOFF.md`
- Version scopes: `docs/versions/`
- Decisions: `docs/decisions/`

## Prototype Flow

1. The player makes one choice per day across Days 1-7.
2. Each choice creates memory traces with different visibility, reliability, and evidence role.
3. Day 7 previews what will collapse at dawn.
4. Day 8 expires eligible short-term memories.
5. Surviving public evidence drives NPC response and gameplay effects.

## Known Limitations

- No save system
- No backend service
- No authored court scene yet
- No automated tests
- Root `ARCHITECTURE.md` is a legacy document and not the primary technical reference
