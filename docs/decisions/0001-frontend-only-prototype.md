# 0001: Frontend-Only Prototype

## Status

Accepted

## Context

The project needs to validate a design premise quickly:

- can a game system model delayed consequence through structured memory traces?
- can players understand evidence persistence without backend complexity?

At this stage, the mechanics, terminology, and presentation are still fluid. Building backend services too early would slow iteration and lock in interfaces before the design stabilizes.

## Decision

Build the first playable versions as a frontend-only prototype:

- authored content stored locally
- state kept in React
- gameplay transitions implemented as pure TypeScript functions
- retrieval behavior simulated in local logic

## Consequences

### Positive

- fast iteration
- easy debugging
- simple local setup
- clear visibility into memory state

### Negative

- no persistence
- no realistic retrieval stack
- architecture may require refactoring when backend integration begins
- authored logic can be mistaken for scalable AI behavior if not documented clearly

## Follow-Up

Revisit this decision when the game rules are stable enough to justify `v0.4` backend work.
