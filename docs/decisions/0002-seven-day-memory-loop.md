# 0002: Seven-Day Memory Loop

## Status

Accepted

## Context

The original single-incident prototype proved the premise, but it did not yet show how memory, rumor, paperwork, and testimony evolve across time. A one-shot scene made the Day 8 consequence feel illustrative rather than systemic.

## Decision

Expand the prototype into a structured seven-day loop:

- one authored event per day from Day 1 to Day 7
- Day 7 used as a visible collapse boundary preview
- Day 8 used for aftermath resolution
- choices generate memories with typed evidence characteristics

## Consequences

### Positive

- the design premise becomes legible as a system
- players can compare how different evidence types accumulate
- the prototype becomes a stronger portfolio and design artifact

### Negative

- more authored content to maintain
- higher risk of documentation drift
- more need for test coverage around memory rules
- `lib/mockData.ts` grows quickly and may need decomposition

## Follow-Up

- add tests around Day 8 consequence logic
- split content modules when adding more regions or NPCs
- decide whether the next milestone expands breadth or adds real retrieval infrastructure
