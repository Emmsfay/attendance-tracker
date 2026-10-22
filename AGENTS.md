# Attendance Tracker

Track when workers come to work and leave: clock in/out with time and GPS location, late (>08:00) and too-early (<17:00) flags, office geofence, and manager corrections.

## Agent skills

### Issue tracker

Issues and specs live in GitHub (`https://github.com/Emmsfay/attendance-tracker`). Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
