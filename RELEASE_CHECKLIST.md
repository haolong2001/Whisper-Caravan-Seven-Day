# Release Checklist

## Versioning

- Confirm release target (`v0.1`, `v0.2`, etc.)
- Align `package.json` version with the intended release
- Align in-app marketing copy with the same version label
- Update `CHANGELOG.md`

## Product Scope

- Confirm the targeted version scope file in `docs/versions/`
- Verify all in-scope days, choices, and outcomes are implemented
- Verify out-of-scope items are not implied by the UI

## Engineering

- Run `npm run build`
- Smoke-test the app locally
- Check for console errors in the browser
- Verify Day 1 through Day 8 progression works without dead ends
- Verify memory expiration behavior on Day 8
- Verify Deer Guard and Bear Court preview logic

## Documentation

- Update `README.md` if setup or scope changed
- Update `docs/ARCHITECTURE.md` for structural changes
- Update `docs/GAME_DESIGN.md` for system changes
- Add or update ADRs in `docs/decisions/` for major decisions
- Refresh `docs/CODEX_HANDOFF.md` with current risks and next steps

## QA Scenarios

- All favorable path
- Mixed public/private evidence path
- High-legal-risk path
- Mostly neutral evidence path
- Path where Day 1 incriminating witness expires but public traces remain

## Release Packaging

- Capture screenshots or short demo video
- Confirm deploy target and environment settings
- Record known issues
- Tag the release if using git tags
