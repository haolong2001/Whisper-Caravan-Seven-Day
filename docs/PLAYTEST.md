# Whisper Caravan Playtest

## Build

Recommended friend-facing shape: frontend-only.

- install dependencies if needed: `npm install`
- local dev run: `npm run dev`
- production build: `npm run build`

The browser build does not require the backend in production. If `NEXT_PUBLIC_BACKEND_URL` is unset, the app uses deterministic frontend fallback and the full route-dependent run remains playable.

## Optional Backend

Only run the backend if you specifically want to inspect backend-assisted ingest/query behavior.

- start FastAPI: `.venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000`
- start frontend: `npm run dev`

In development, the frontend defaults to `http://127.0.0.1:8000` when no `NEXT_PUBLIC_BACKEND_URL` is set.

## What Friends Should Test

- start a fresh run and play from Day 1 through Day 14
- reach Bear Court on Day 15
- note which ending id they reached: `A1`, `A2`, `B`, `C`, or `D`
- try multiple fresh runs and note which route-dependent cards changed
- try at least one Truth-leaning, Merchant-leaning, Rumor-leaning, and reckless/failure-leaning route
- try refresh during a run and confirm Continue works
- use Restart Run and confirm a clean reset
- report any confusing day transitions, evidence presentation, or ending explanation text

## Feedback To Collect

- where route intent felt unclear
- where consequences felt surprising for the wrong reason
- where collapse checkpoints or evidence survival were hard to understand
- whether the ending explanation felt earned by the route they played
- any browser/device issues or save/refresh issues

## Current Limits

- repeat runs now pull different deterministic subsets from the 26-card pool
- the route selector is deterministic and tag-driven, but not yet final beta polish
- save data is local browser storage only
- no accounts, cloud save, analytics, or feedback backend
