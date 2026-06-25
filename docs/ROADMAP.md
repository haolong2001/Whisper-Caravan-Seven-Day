# Roadmap

## Current Position

The repository currently matches the intended `v0.2` shape, and the package metadata is now aligned to `0.2.0`.

## Version Sequence

### v0.1

Goal:
Prove the premise with a single incident and visible memory decay.

Delivered ideas:

- Deer Village theft setup
- memory inspector
- basic Day 8 consequence framing

Reference:
`docs/versions/v0.1.md`

### v0.2

Goal:
Expand the premise into a full seven-day authored loop with differentiated evidence creation.

Target outcomes:

- 7 days of events
- 4 choices per day
- Day 7 collapse preview
- Day 8 aftermath reaction
- evidence-role and reliability-based resolution

Reference:
`docs/versions/v0.2.md`

### v0.3

Goal:
Increase systemic depth through more NPC perspectives and stronger downstream consequences.

Candidate work:

- multiple NPC reaction profiles
- location-specific reactions
- stronger faction consumption
- more explicit legal and market consequences

### v0.4

Goal:
Replace authored retrieval simulation with a backend-backed retrieval architecture.

Candidate work:

- FastAPI service
- vector or hybrid retrieval store
- metadata filtering by visibility, day, reliability, and source type
- structured NPC response schema

### v0.5

Goal:
Shape the prototype into a small but complete vertical slice.

Candidate work:

- 14 days or a denser branching week
- courtroom sequence
- multiple endings
- save/load or route summary

### v1.0

Goal:
Release a polished portfolio-quality version.

Candidate work:

- stable deployment
- final documentation
- demo video
- architecture visuals
- evaluation write-up

## Recommended Immediate Next Steps

1. Keep version labels aligned across `package.json`, UI text, and docs.
2. Add tests for `applyChoice`, `applySevenDayForgetting`, and Day 8 retrieval outcomes.
3. Split `lib/mockData.ts` before further content expansion.
4. Decide whether `v0.3` prioritizes more content or a real backend.
