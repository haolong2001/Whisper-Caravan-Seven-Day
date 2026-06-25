# Product Brief

## Working Title

Whisper Caravan: Seven-Day Memory

## One-Sentence Pitch

A narrative strategy prototype where the player learns that even when witnesses forget, the world still remembers through records, rumors, and songs.

## Product Goal

Demonstrate a game-oriented memory retrieval concept in which:

- choices create traceable memories
- different memory classes persist differently
- delayed consequences emerge from what remains retrievable after a seven-day decay boundary

## Player Fantasy

The player leads a morally compromised caravan that survives by making difficult choices, then lives with how those choices mutate into public truth.

## Target Audience

- Narrative systems designers
- AI/gameplay prototyping teams
- Recruiters or collaborators evaluating systems design thinking
- Players interested in reactive storytelling and consequence simulation

## Core Experience Pillars

### 1. Delayed Consequence

The important result is not the immediate choice outcome, but the social afterlife of the choice one week later.

### 2. Memory As World State

Memories are not flavor text. They are structured state with visibility, reliability, and evidence role.

### 3. Public Narrative Beats Private Forgetting

Private witness recall can vanish, but public artifacts keep reshaping trust, risk, and opportunity.

### 4. Interpretable Simulation

The player should be able to inspect why an NPC reacted a certain way by reading the surviving evidence stack.

## Current MVP Scope

- 7 playable event days
- 4 choices per day
- Memory creation with typed traces
- Day 7 collapse preview
- Day 8 aftermath
- One authored NPC reaction model
- One court-evidence preview model

## Non-Goals For Current Prototype

- Full RPG progression
- Combat
- Open-world traversal
- Persistent save/load
- Real LLM-backed retrieval
- Full courtroom trial flow

## Success Criteria

- A new player understands the seven-day memory premise without external explanation.
- The player can see why public evidence outlives private witness memory.
- Different routes produce meaningfully different Day 8 reactions.
- The prototype is legible enough to support future backend or RAG integration.

## Risks

- The concept may read as a static narrative demo instead of a system.
- Public evidence may dominate too strongly, making private memory feel irrelevant.
- Without a backend, the "retrieval" idea may be understood only as authored logic rather than an extensible architecture.

## Near-Term Product Questions

- Should the next milestone prioritize more NPC viewpoints or a real retrieval backend?
- Should court logic become a playable scene or remain a preview panel?
- Should faction standing become more mechanically important before expanding content breadth?
