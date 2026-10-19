# Architecture and design rules

Status: implemented locally, 2026-10-19.

## Ownership
Dependency direction: data/types → pure board/path/game model → input and presentation adapters → application composition. No circular imports; production never imports tests.

- Path finder: pure path search on a board with a one-cell empty border; returns a valid route with zero, one or two bends, or no route.
- Board: generation, pair counts, seeded shuffle and available-move detection. Generation should retain a solution witness; a legal first move alone does not prove full solvability. Bound shuffle retries and provide a deterministic recoverable fallback.
- Game: selection, atomic pair removal, score/combo, timer, hint/shuffle and state transitions. Renderer never awards points.
- Input: translates pointer/keyboard actions to commands; clears pending gestures on pause, cancellation and rotation.
- Presentation: board, returned connection route, mascot reactions, dialogs and effects.
- Settings/storage: validated versioned local data; storage failure keeps session play usable.

States: menu → preparing → playing ↔ paused → results. Retry creates a fresh run. Time uses an injected monotonic clock, excluding pauses, rather than frame-count accumulation. Stale async asset callbacks cannot mutate a newer run.

## Responsive geometry
Keep screen padding, exterior connection corridor, tile gaps, source-image margins and sprite inset as separate values. Render the same exterior route used by the model. Recompute pointer coordinates and route geometry after resize; do not crop the route at the tile-grid boundary.

PC: board with side mascot. Mobile: compact mascot above the board. Reduce column count when necessary instead of shrinking targets excessively. Initial layout targets: 24–32px desktop outer padding, 12–16px mobile outer padding plus safe-area insets, 4–8px tile gaps, 48px mobile controls. Menus/dialogs remain scrollable; active play should fit the visual viewport.

## Character containment
Use one fixed aspect-ratio outer frame with position:relative and one inset sprite child. Only the child owns sprite image/cell position, shadow and reaction transforms. The outer frame remains stationary and clips overflow as a final boundary; clipping must not hide valid art at maximum motion.

Start with 10% child inset on all sides, independently of source-image margins. Never render the sheet on both parent and child or alter atlas coordinates by adding CSS padding to the sampled sheet. Never set the containing frame to position:static. Reuse the same helper in menu, play, results and previews.

Keep per-frame canvas, scale and baseline consistent. Full-body assets use a foot anchor; bust assets use a shoulder baseline. Contain individual images without stretching. Verify maximum motion and shadow bounds; increase reserved room or reduce motion if art crosses the frame. Disable/reduce transforms for reduced motion. Cosmetic reactions never affect puzzle state.

## Tooling
TypeScript strict + Vite, DOM/CSS presentation, Vitest, Playwright, ESLint/Prettier and a PNG asset checker. A game engine is unnecessary for this board puzzle. This implementation retains CDXPilot0005's verification workflow, without assuming all prior projects used one stack. CI must run the same gates as local development. Static paths must work under a nested project URL.


## Implemented modules and layout policy
- `src/model.ts`: path search, seeded board arrangement with full removal witness, Game state/time/scoring and automatic deadlock recovery.
- `src/storage.ts`: validated version-1 local settings, unlocked stages and best score; recoverable failures.
- `src/icons.ts`: twelve original code-native dessert symbols.
- `src/main.ts`: input/presentation adapters and application composition. Model mutations go through Game except explicit test-only result fixtures.
- `src/style.css`: responsive layout, independent corridor and mascot containment.

New runs choose 6×6 on regular desktop, 4×6 on tall mobile, 4×4 on short mobile, and 6×2 on short landscape. Board dimensions remain fixed within a run to preserve connection topology; resize recalculates geometry and clears the previous route, while device orientation changes pause play. Very severe resizing of an existing larger board can reduce tile targets; restarting selects the new viewport's board size. This is a known limitation, not a verified universal rotation solution.

The visible exterior corridor is `cell / 2 + gap + 4px`, ensuring exterior cell centers and line stroke remain within the board. Generated cell art has explicit outer 106px transparency; runtime inset remains 10%. All screens reuse one companion component, with results shown in a dialog over the game.

Runtime hooks exist only under `?test=1`: snapshot, legal move lookup, expression selection, route geometry fixture, and named won/lost layout fixtures. Fixtures are not completion evidence; the E2E playthrough uses actual pair clicks.

## Deployment and proposed layers
The production mount is `/CDXPilot0006/`; test it with exact case. Verified dist artifacts are published through GitHub Actions only after the verification job succeeds. See DEPLOYMENT.md.

Multi-layer puzzles are feasible but not part of this release: the proposed extension uses per-position stacks, top-only selection and the existing projected 2D path rule. Every occupied stack obstructs intermediate path cells. See STACKED_PUZZLE_PROPOSAL.md before changing the Board contract.
