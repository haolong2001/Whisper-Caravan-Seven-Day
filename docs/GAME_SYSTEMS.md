# Whisper Caravan: Seven-Day Memory — Game Systems

This document defines the core game systems for **Whisper Caravan: Seven-Day Memory**.

It is intended to describe the domain model, memory lifecycle, NPC access rules, retrieval rules, and future RAG transition plan.

This document should be treated as a system reference, not as a task list. Version-specific scope should live in `docs/versions/vX.Y.md`. Current project status should live in `docs/CODEX_HANDOFF.md`. Codex development behavior should live in `AGENTS.md`.

---

## 1. System Design Principles

The project should evolve in small, verifiable versions.

Each version must preserve the existing architecture unless that version explicitly requires a refactor.

Current architectural source of truth:

* The app is frontend-only.
* `app/page.tsx` owns top-level state orchestration.
* `lib/mockData.ts` owns static game content.
* `lib/gameLogic.ts` owns pure game rules.
* `lib/types.ts` owns shared TypeScript domain types.
* Components should be presentational whenever possible.
* There is no real backend, LLM, vector database, auth, save/load system, combat, inventory, or map screen yet.

If a mock API route exists, it should be treated only as a temporary adapter. It should not become the main architecture before the project explicitly reaches a backend/RAG version.

---

## 2. Domain Model

The domain model defines the objects used by the game loop, memory system, NPC reactions, and future retrieval pipeline.

The TypeScript definitions below are descriptive references. The actual source of truth for executable types is `lib/types.ts`.

---

## 2.1 GameState

`GameState` is the top-level runtime object.

It represents the current playable state of a run.

```ts
type GameState = {
  currentDay: number;
  currentLocation: string;
  selectedChoiceByDay: Record<number, string>;
  memories: Memory[];
  factionScores: FactionScores;
  resources: GameResources;
  latestReaction?: NPCReaction;
};
```

### Responsibilities

`GameState` should track:

* Current in-game day.
* Current location.
* Which choice was selected on each day.
* Active and inactive memories.
* Faction scores.
* Player-facing resources.
* Latest deterministic NPC reaction, if any.

### Rules

* `GameState` should be updated through pure functions in `lib/gameLogic.ts`.
* React components should not mutate game rules directly.
* `app/page.tsx` may own state orchestration, but it should call game logic helpers rather than embedding rules in JSX.

---

## 2.2 GameEvent

`GameEvent` describes one playable event.

```ts
type GameEvent = {
  id: string;
  day: number;
  location: string;
  title: string;
  description: string;
  choices: Choice[];
};
```

### Responsibilities

A `GameEvent` should define:

* The day on which the event appears.
* The location of the event.
* The title and description shown to the player.
* The choices available for that event.

### Rules

* Event data should live in `lib/mockData.ts` until a future content-loading system is introduced.
* Events should be data-driven.
* Event descriptions should not contain hidden game rules. Rules should be expressed through choice effects and logic helpers.

---

## 2.3 Choice

`Choice` describes a player decision inside a `GameEvent`.

```ts
type Choice = {
  id: string;
  label: string;
  description: string;
  memoryEffects: MemoryEffect[];
  factionEffects?: FactionEffect[];
  resourceEffects?: ResourceEffect[];
};
```

### Responsibilities

A `Choice` may:

* Create memories.
* Change faction scores.
* Change resources.
* Influence later NPC reactions.
* Influence final judgment or legal risk.

### Rules

* A player should select only one choice per day.
* Choice effects should be applied through pure functions in `lib/gameLogic.ts`.
* Choice effects should not be hardcoded into React components.
* Choice IDs should be stable enough to support future save/load or analytics systems.

---

## 2.4 Memory

`Memory` is the core game-memory object.

It represents remembered events, records, rumors, contracts, songs, or short-term experiences.

```ts
type Memory = {
  id: string;
  day: number;
  type: MemoryType;
  title: string;
  text: string;
  source: string;
  location: string;
  reliability: number;
  visibility: MemoryVisibility;
  active: boolean;
  expiresOnDay?: number;
  tags: string[];
};
```

### Responsibilities

A `Memory` should support:

* Player inspection.
* NPC retrieval.
* Forgetting and collapse rules.
* Public evidence checks.
* Faction-specific knowledge.
* Future RAG retrieval.

### Rules

* Memories should be created by choice effects or story events.
* Memories should remain visible in the Memory Inspector even after expiration.
* Expired memories must be marked inactive.
* Inactive memories must not be used by NPC reactions.
* Persistent memory types should remain active unless explicitly removed by future mechanics.

---

## 2.5 MemoryType

`MemoryType` describes the kind of memory or evidence.

```ts
type MemoryType =
  | "short_term"
  | "record"
  | "rumor"
  | "contract"
  | "song";
```

### Type Meanings

| Type         | Meaning                                            | Default Expiration               |
| ------------ | -------------------------------------------------- | -------------------------------- |
| `short_term` | Personal or local short-term experience            | Expires after seven in-game days |
| `record`     | Written, administrative, legal, or ledger evidence | Persists                         |
| `rumor`      | Socially transmitted information                   | Persists unless suppressed later |
| `contract`   | Legal or commercial agreement                      | Persists                         |
| `song`       | Public cultural memory or reputation carrier       | Persists                         |

### Rules

* `short_term` memories are fragile.
* `record`, `contract`, `song`, and `rumor` memories persist by default.
* Rumors may have low reliability but high social impact.
* Contracts and records may have high legal impact.
* Songs may improve public reputation but may not be accepted by legal authorities.

---

## 2.6 MemoryVisibility

`MemoryVisibility` describes who can potentially access a memory.

```ts
type MemoryVisibility =
  | "private"
  | "public"
  | "faction"
  | "npc_private";
```

### Visibility Meanings

| Visibility    | Meaning                                       |
| ------------- | --------------------------------------------- |
| `private`     | Known to the player or caravan only           |
| `public`      | Publicly visible or socially known            |
| `faction`     | Known within a faction or institution         |
| `npc_private` | Known only to a specific NPC or narrow source |

### Rules

* Visibility should affect NPC retrieval.
* NPCs must not behave as omniscient agents.
* A private memory should not be available to an unrelated NPC unless future mechanics explicitly reveal it.
* Public memories are broadly available but may still be filtered by reliability or accepted type.

---

## 2.7 FactionScores

`FactionScores` tracks social and political relationships.

```ts
type FactionScores = {
  deerVillage: number;
  refugees: number;
  foxMarket: number;
  crowBrokers: number;
  bearCourt: number;
};
```

### Current Factions

| Faction       | Role                                           |
| ------------- | ---------------------------------------------- |
| `deerVillage` | Local village trust and social reputation      |
| `refugees`    | Displaced camp trust and humanitarian standing |
| `foxMarket`   | Trade, ledgers, contracts, and profit networks |
| `crowBrokers` | Rumor, information, and social transmission    |
| `bearCourt`   | Legal judgment, authority, and trial outcomes  |

### Rules

* Faction changes should be represented by `FactionEffect`.
* Faction effects should be deterministic.
* Faction scores should influence later responses, prices, options, or judgment only through rule functions.

---

## 2.8 GameResources

`GameResources` tracks lightweight player-facing variables.

```ts
type GameResources = {
  gold: number;
  legalRisk: number;
  rumorHeat: number;
};
```

### Resource Meanings

| Resource    | Meaning                                               |
| ----------- | ----------------------------------------------------- |
| `gold`      | Money or trade capacity                               |
| `legalRisk` | Exposure to legal punishment or suspicion             |
| `rumorHeat` | How intensely rumors are spreading around the caravan |

### Rules

* Resources should stay lightweight before v1.0.
* Do not turn resources into a full inventory system unless explicitly scoped in a future version.
* `legalRisk` may be used by Bear Court or final trial logic.
* `rumorHeat` may affect public NPC reactions or rumor spread.

---

## 2.9 GameEffect

`GameEffect` is a general category for effects created by player choices.

Current effect categories:

* `MemoryEffect`
* `FactionEffect`
* `ResourceEffect`

### Rules

* Effects should be data-driven where possible.
* Effects should be applied through `lib/gameLogic.ts`.
* Effects should be easy to inspect and test.
* Effects should avoid hidden behavior inside UI components.

---

## 3. Memory Lifecycle

Every memory should follow a lifecycle.

```text
created
  -> active
  -> retrieved or ignored
  -> expired if short-term
  -> preserved if record, contract, song, or rumor
  -> used by NPC reaction
  -> used by final trial
```

---

## 3.1 Creation

Memories are created by choices or story events.

Creation should happen through rule functions in `lib/gameLogic.ts`, not inside React components.

### Rules

* A choice may create one or more memories.
* Memory creation should be represented by `MemoryEffect`.
* Each created memory should have a stable `id`.
* Each memory should have a `day`, `type`, `source`, `location`, `visibility`, `reliability`, and `tags`.

---

## 3.2 Active Period

A memory is active while it is within the current retention window or marked as persistent.

### Rules

* Active memories may appear in the Memory Inspector.
* Active memories may be retrieved by NPCs if access rules allow it.
* Active memories may influence faction, legal, reputation, or trade outcomes.
* Active status is not the same as visibility. A memory can be active but private.

---

## 3.3 Expiration

Short-term memories expire after seven in-game days.

### Rules

1. `short_term` memories expire after seven in-game days.
2. Expired memories should remain visible in the Memory Inspector.
3. Expired memories must be marked inactive.
4. NPC reactions must not use inactive memories.
5. Expiration should be handled by pure functions in `lib/gameLogic.ts`.
6. Expiration should not delete memories unless a future version explicitly introduces deletion.

Example helper functions:

```ts
getActiveMemories(memories: Memory[]): Memory[];

getExpiredMemories(memories: Memory[]): Memory[];

applySevenDayForgetting(memories: Memory[], currentDay: number): Memory[];
```

---

## 3.4 Persistence

Persistent memories do not expire under normal seven-day forgetting.

Persistent types:

* `record`
* `contract`
* `song`
* `rumor`

### Rules

* Persistent memories remain active unless explicitly removed by future mechanics.
* Records and contracts may be accepted by legal authorities.
* Rumors may continue spreading even when unreliable.
* Songs may carry public reputation but may not count as legal proof.
* Persistence should be modeled explicitly rather than handled as a UI-only exception.

---

## 3.5 Retrieval

Retrieval means selecting which memories or evidence an NPC is allowed to use.

For v0.2, retrieval should be deterministic and client-side.

### Rules

* Retrieval should filter by active status.
* Retrieval should filter by NPC access rules.
* Retrieval should filter by memory type.
* Retrieval should filter by visibility scope.
* Retrieval may filter by reliability.
* Retrieval may filter by tags or location in future versions.
* Retrieval should not use inactive short-term memories.
* Retrieval should not allow NPCs to access memories they should not know.

---

## 3.6 NPC Usage

NPC responses should only use memories or evidence that remain active after filtering.

### Rules

* NPCs must not behave like omniscient chatbots.
* NPCs should only react to evidence they can access.
* NPC reactions should remain deterministic and client-side until retrieval logic is stable.
* LLM-generated responses should not be added before retrieval rules are stable.
* RAG must eventually affect game state, not only dialogue.

---

## 4. Memory Collapse Rules

Memory Collapse happens at the end of Day 7 and Day 14.

The first implementation should be read-only.

### Read-Only Collapse Screen

The Memory Collapse screen should show:

* Memories that will expire.
* Memories that will persist.
* Memories that are public.
* Memories that are private.
* Rumors that may continue spreading.
* Records that may influence legal judgment.

### Future Collapse Actions

Future versions may allow the player to perform one collapse action:

* Preserve one short-term memory as a written record.
* Destroy one negative record.
* Promote one rumor.
* Suppress one rumor.

### Rules

* Do not add collapse actions before the read-only collapse screen is stable.
* Collapse preview should be based on current memory state.
* Collapse should not silently delete memories.
* Collapse should make the memory lifecycle visible to the player.
* Collapse actions, when introduced, should be implemented as explicit game rules, not UI-only behavior.

---

## 5. NPC Memory Access Rules

NPC reactions must be based on access rules.

NPCs should not behave like omniscient chatbots.

---

## 5.1 NPCProfile

```ts
type NPCProfile = {
  id: string;
  name: string;
  faction: keyof FactionScores;
  acceptedMemoryTypes: MemoryType[];
  rejectedMemoryTypes: MemoryType[];
  visibleMemoryScopes: MemoryVisibility[];
  minReliability: number;
};
```

### Responsibilities

`NPCProfile` defines:

* Which faction the NPC belongs to.
* Which memory types the NPC accepts.
* Which memory types the NPC rejects.
* Which visibility scopes the NPC can access.
* Minimum reliability required for evidence to matter.

---

## 5.2 Example NPC Behavior

### Deer Guard

Expected behavior:

* Trusts public records.
* Trusts direct witness memories when visible.
* May distrust rumors.
* Should not know private caravan-only memories unless revealed.

### Fox Merchant

Expected behavior:

* Trusts ledgers, contracts, and profitable rumors.
* Responds to trade-relevant evidence.
* May care less about moral reputation if profit is high.

### Crow Broker

Expected behavior:

* Accepts rumors even at low reliability.
* Responds strongly to rumor heat.
* May spread information that legal authorities would reject.

### Bear Judge

Expected behavior:

* Rejects rumors and songs unless supported by records or contracts.
* Cares strongly about legal risk.
* Should not use private Deer Guard memories.
* Should prefer records, contracts, and public evidence.

---

## 5.3 NPC Access Rules

Rules:

1. NPCs may only retrieve active memories.
2. NPCs may only retrieve memories with allowed visibility scopes.
3. NPCs may only use accepted memory types.
4. NPCs must reject explicitly rejected memory types unless future rules provide support evidence.
5. NPCs should respect `minReliability`.
6. NPCs may use faction scores and resources if the current response logic allows it.
7. NPCs should never access all memories by default.

---

## 6. RAG Transition Plan

The project should move from mock retrieval to real RAG in stages.

Do not skip directly to backend, vector database, or LLM behavior before deterministic retrieval rules are stable.

---

## 6.1 Stage 1: Deterministic Retrieval

Use client-side filtering over local memory arrays.

This is the current target stage.

### Rules

* Retrieval is local.
* Retrieval is deterministic.
* Retrieval uses memory type, visibility, reliability, active status, and tags.
* NPC reactions are structured and predictable.
* No backend is required.
* No LLM is required.
* No vector database is required.

---

## 6.2 Stage 2: Retrieval Adapter

Create a retrieval function interface.

```ts
type RetrievalRequest = {
  npcId: string;
  currentDay: number;
  query: string;
  gameState: GameState;
};

type RetrievalResult = {
  evidence: RetrievedEvidence[];
};
```

Initially, this adapter can call local functions.

Later, it can call a backend without changing UI components.

### Rules

* UI components should depend on the adapter interface, not the backend implementation.
* The adapter should return structured evidence.
* The adapter should preserve NPC access rules.
* The adapter should not introduce LLM generation.

---

## 6.3 Stage 3: Backend Retrieval

Move retrieval to FastAPI or Next route handlers.

### Rules

* Backend retrieval should preserve the same request and response shape where possible.
* Backend should not change UI components unnecessarily.
* Access rules must remain testable.
* Backend routes should not become story-rule containers.

---

## 6.4 Stage 4: Vector Retrieval

Store memories in a vector database and retrieve by semantic similarity plus metadata filters.

### Rules

* Metadata filters must remain authoritative.
* Expired memories must not leak into NPC reactions.
* NPC permission filters must run before or during retrieval.
* Vector similarity should not override hard access rules.
* Retrieval should remain explainable enough for debugging.

---

## 6.5 Stage 5: Reranking and Structured Generation

Use retrieved memories to generate structured NPC responses.

### Rules

* NPC responses must remain structured and machine-readable.
* Generated text must be grounded in retrieved evidence.
* Retrieved evidence should be attached to the response for inspection.
* RAG must affect game state, not only dialogue.
* LLM output should not directly mutate `GameState` without validation.

---

## 7. Evaluation Plan

The project should include lightweight evaluation before v1.0.

Evaluation should focus on whether the memory and NPC systems obey the rules.

---

## 7.1 Expired Memory Leakage Rate

Measures whether expired short-term memories incorrectly appear in NPC responses.

Expected behavior:

* Day 8 NPCs should not directly remember Day 1 short-term experiences.
* Day 8 NPCs may refer to persistent records, rumors, songs, or contracts.
* Inactive memories should not appear as accepted evidence.

---

## 7.2 NPC Permission Accuracy

Measures whether NPCs only use memories they are allowed to access.

Expected behavior:

* Bear Judge should not use private Deer Guard memories.
* Crow Broker may use public rumors.
* Fox Merchant may use ledger records or contracts.
* NPCs should not retrieve all memories by default.

---

## 7.3 Retrieval Precision

Measures whether retrieved evidence is relevant to the NPC query.

Expected behavior:

* Retrieved evidence should relate to the NPC, location, faction, tags, or current query.
* Irrelevant memories should not dominate the response.
* Retrieval should be inspectable during development.

---

## 7.4 Structured Output Validity

Measures whether NPC reaction output matches the expected schema.

Expected behavior:

* NPC reaction data should be machine-readable.
* Required fields should be present.
* Invalid or unstructured output should not directly affect game state.

---

## 7.5 Gameplay Effect Consistency

Measures whether returned gameplay effects are consistent with retrieved evidence.

Potential fields:

* `trustDelta`
* `priceModifier`
* `questAvailable`
* `legalRiskDelta`

Expected behavior:

* Gameplay effects should follow from accepted evidence.
* Rumors should not create strong legal effects without support.
* Records and contracts should have stronger legal weight.
* Songs may influence reputation but should not act as formal legal proof.

---

## 8. Implementation Boundaries

These boundaries exist to keep the project stable.

### Current Boundaries

* Keep data in `lib/mockData.ts` until real content loading is needed.
* Keep game rules in `lib/gameLogic.ts`.
* Keep shared domain types in `lib/types.ts`.
* Keep React components small and presentational.
* Do not put branching story logic inside JSX.
* Do not add backend before the version that explicitly scopes backend work.
* Do not add LLM calls before retrieval logic is stable.
* Do not add vector database before metadata rules are stable.
* Prefer deterministic logic before generative logic.
* NPCs must not behave as omniscient agents.

### Version Discipline

* Implement one version at a time.
* Do not ask a coding agent to build v0.2 through v1.0 in one pass.
* Each version should have clear goals, non-goals, and acceptance criteria.
* Run `npm run build` after each completed version.
* Update relevant docs after each completed version.
