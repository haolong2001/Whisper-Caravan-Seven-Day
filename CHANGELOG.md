# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added

- Documentation baseline:
  - `AGENTS.md`
  - `README.md`
  - `CHANGELOG.md`
  - `RELEASE_CHECKLIST.md`
  - `docs/` product, design, architecture, roadmap, handoff, versions, and decisions

### Notes

- The repository currently contains seven-day loop gameplay that matches `v0.2` scope.
- `package.json` now reports `0.2.0`.

## [0.2.0] - Current

### Added

- Seven authored event days plus Day 8 aftermath
- Four choices per day with faction and resource effects
- `record`, `song`, and `rumor` public evidence types
- Day 7 memory collapse preview
- Day 8 forgetting transition
- Deer Guard reaction logic driven by surviving evidence
- Bear Court evidence threshold preview
- Expanded status, memory, and evidence panels

### Changed

- Evolved from a single-incident demo into a week-long decision loop
- Consolidated game rules into `lib/gameLogic.ts`
- Shifted the UX from a one-shot event to a structured day-by-day progression

## [0.1.0] - Prototype Baseline

### Added

- Initial Whisper Caravan concept prototype
- Deer Village medicine incident
- Memory inspector
- Early evidence display
- Seven-day forgetting premise
