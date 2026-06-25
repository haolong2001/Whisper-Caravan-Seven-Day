# Architecture

This document is the current technical reference for the playable prototype. It supersedes the older root-level `ARCHITECTURE.md`, which describes an earlier single-incident shape of the project.

## Overview

The app is a frontend-only Next.js prototype. It keeps all authored content, state transitions, and retrieval logic in-process so the team can iterate quickly on the core memory-consequence loop before introducing backend complexity.

## Frontend-Only

- Fast iteration on the premise
- Zero deployment dependency for backend services
- Easy debugging of memory state in the UI
- Lower implementation cost while game rules are still changing
