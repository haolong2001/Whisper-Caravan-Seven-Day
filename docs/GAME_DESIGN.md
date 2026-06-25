# Game Design

## High Concept

Whisper Caravan is a consequence-driven narrative prototype built around a single thesis:

**time does not erase accountability equally.**

The player navigates a seven-day journey. Every daily choice writes one or more memory traces into the world. On Day 8, short-term witness memory can collapse, but public traces still influence how authorities and communities respond.

## Core Loop

1. Read the day's scenario.
2. Choose one of four actions.
3. Apply immediate narrative, faction, and resource effects.
4. Write memory traces into world state.
5. Advance to the next day.
6. On Day 7, preview what will expire and what will remain.
7. On Day 8, resolve the aftermath from surviving public evidence.

## Primary Systems

### Memory System

Each choice can generate one or more memories with these fields:

- `type`: `short_term`, `record`, `song`, `rumor`
- `visibility`: `private` or `public`
- `reliability`
- `evidenceRole`: `incriminating`, `favorable`, `neutral`
- `createdDay`
- `expiresOn`
- `active`

Design intent:

- `short_term` is fragile and usually private
- `record` is official and highly reliable
- `song` is durable but interpretive
- `rumor` is public but noisy

### Seven-Day Forgetting Rule

- Short-term memories expire on `createdDay + 7`
- Persistent public traces survive the Day 8 transition
- Expired memories remain inspectable for player understanding, but stop participating in active retrieval

### Evidence Retrieval

The current prototype uses authored retrieval rules:

- gather active public evidence
- filter by reliability and evidence role
- generate NPC dialogue and downstream effects

This is intentionally structured so it can later be replaced by a real backend retrieval layer without rewriting the core game concept.

### Factions

Current faction tracks:

- Deer Village
- Refugees
- Fox Market
- Crow Brokers
- Bear Court

Faction values currently act as visible state and design scaffolding. They are not yet deeply consumed by downstream branching.

### Resources

Current resources:

- Silver
- Medicine
- Provisions
- Legal Risk

These create immediate tradeoffs and establish a base for later scarcity design.

## Daily Event Structure

### Day 1: Deer Village Medicine Conflict

Introduces the core moral dilemma and the first high-impact evidence trail.

### Day 2: River Refugee Camp

Shifts focus from theft to aid distribution and social interpretation.

### Day 3: Fox Market Ledger Deal

Explores paperwork, brokerage, and the dangers of altering records.

### Day 4: Crow Relay Station

Tests message control, rumor propagation, and intentional narrative shaping.

### Day 5: Bear Border Checkpoint

Introduces formal scrutiny and proto-legal consequences.

### Day 6: Fog Forest Witness

Reframes the original crime through testimony and moral context.

### Day 7: Memory Collapse Night

Lets the player prepare for dawn by reinforcing or distorting what the public world will remember.

### Day 8: Aftermath

Resolves the week through evidence retrieval instead of direct recollection.

## Choice Design Principles

- Every option should be morally legible but strategically ambiguous.
- The strongest short-term benefit should not always produce the best long-term evidence trail.
- Public evidence should feel authored by the world, not by UI abstraction.
- Favorable evidence should be possible, but not frictionless.

## Current Outcome Model

The prototype currently resolves Day 8 through:

- Deer Guard dialogue
- trust change
- price modifier
- quest availability
- legal risk delta
- Bear Court accepted/rejected evidence preview

## Future Design Directions

- More NPC reaction profiles with distinct evidence thresholds
- Courtroom resolution scene
- Faction-driven availability changes
- Memory suppression, forgery, and counter-evidence systems
- Save/load and replay comparison
