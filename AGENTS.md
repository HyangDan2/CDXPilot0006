# ChibiLink contributor contract

## Required workflow
1. Read AGENTS.md, docs/ARCHITECTURE.md, docs/HARNESS.md and PLAN.md before changes.
2. Inspect existing files and working changes; preserve user work and original assets.
3. Identify the owning module, affected contracts and current phase gate.
4. Make the smallest coherent change; keep pure rules independent of rendering and DOM.
5. Run relevant regression checks. Gameplay changes require the full verification and browser gates; visual changes also require actual screenshot inspection.
6. Fix unresolved failures before advancing. Never disable assertions or replace screenshots to conceal failures.
7. Update architecture/decisions for contracts, art docs for asset pipelines, and QA/changelog for results and user-visible changes.
8. Report changed behavior/files, actual commands/outcomes, limitations and unverified checks separately.

## Project invariants
- Game alone mutates puzzle state; renderer and mascot only consume state/events.
- Connections use at most two bends through empty cells, including a one-cell exterior border.
- Layered boards expose only stack tops; occupied stacks block routes. Preserve permanent gap masks and all remaining symbols on shuffle.
- A matched pair is removed and scored once. Paused or terminal games reject gameplay input.
- Use seeded randomness for reproducible boards and QA. Keep tuning in data.
- Preserve transparent source margins, fixed frame dimensions and anchors. Follow docs/ART_PIPELINE.md.
- Character loading/animation failures must not stop puzzle play.
- Keep storage failure recoverable; clean up listeners, effects and pending work on transitions.
- Respect reduced motion, character visibility and mobile safe areas.
- Distinguish model tests, asset analysis, browser execution and physical-device acceptance.

## Scope and documents
Implementation was authorized on 2026-10-19. Commands in HARNESS.md are implemented; report only checks actually executed. Local verification does not prove deployment; publishing is a separate task.

Process and padding precedents are recorded in docs/DECISIONS.md. Prior projects' rhythm/action mechanics, engines and deployment permissions are not inherited. Technical rules use English; PLAN.md is the Korean user-facing plan.
