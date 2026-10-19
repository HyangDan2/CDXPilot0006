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
- `src/storage.ts`: validated version-4 settings with version-1/2 migration, unlocked stages and best score; recoverable failures.
- `src/icons.ts`: eighteen original code-native dessert symbols.
- `src/main.ts`: input/presentation adapters and application composition. Model mutations go through Game except explicit test-only result fixtures.
- `src/style.css`: responsive layout, independent corridor and mascot containment.

New runs choose 6×6 on regular desktop, 4×6 on tall mobile, 4×4 on short mobile, and 6×4 on short landscape. Board dimensions remain fixed within a run to preserve connection topology; resize recalculates geometry and clears the previous route, while device orientation changes pause play. Expanded games fit the entire board after resizing; restarting selects the new baseline footprint.

The visible exterior corridor is `cell / 2 + gap + 18px`, ensuring exterior cell centers and line stroke remain within the board. Generated cell art has explicit outer 106px transparency; runtime inset remains 10%. All screens reuse one companion component, with results shown in a dialog over the game.

Runtime hooks exist only under `?test=1`: snapshot, legal move lookup, expression selection, route geometry fixture, and named won/lost layout fixtures. Fixtures are not completion evidence; the E2E playthrough uses actual pair clicks.

## Deployment and layers
The production mount is `/CDXPilot0006/`; test it with exact case. Verified dist artifacts are published through GitHub Actions only after the verification job succeeds. See DEPLOYMENT.md.

Current modes are Easy (one floor), Normal (two), Hard (three), each with ten stages. Challenge is an independent timer/assist option. Old classic/layered implementations remain pure compatibility regressions, not selectable UI modes.

`Board.tiles` is authoritative for the current rules: stable tile positions with `x,y,z,value`, where each higher floor offsets x and y by half a cell. Its initial tile must have exactly four supports on the floor immediately below. `cells` is a synchronized value list for legacy status observers, not a spatial grid for these boards. Only Game/popTile changes tile values. No gravity or relocation occurs after removal.

A tile is covered if any remaining higher tile's unit footprint overlaps it (`abs(dx)<1 && abs(dy)<1`). Covered tiles are disabled in the DOM and rejected independently by Game. A match requires equal symbols, equal z and both tiles exposed. Paths search a half-cell lattice, with at most two bends, on the selected floor. Same/higher occupied footprints block this plane; lower-floor tiles do not. This makes routes above lower floors legitimate and avoids invisible blockers below upper matches. One exterior base-cell corridor remains available. Rendering uses the exact x/y coordinates and the same face size for route endpoints and inputs; depth comes from sides, highlights and shadows rather than displacing the face from its logical center.

Generation constructs supported floors, trims odd counts at alternating corners and adds paired edge gaps where supports allow. Easy retains irregular interior gaps. Every floor has an even tile count and even count per symbol. A seeded per-floor geometric witness, ordered top-to-bottom, proves complete solvability. Shuffle preserves every surviving position and per-floor symbol multiset, including holes; it assigns a fresh complete witness without retries. Automated deadlock recovery remains separate from manual quotas.

Historical pre-expansion symbol targets were Easy 6–8, Normal 10–12, Hard 14–18. Current expanded targets and repetition caps are defined below. Challenge picks the least immediately matchable of four seeded candidates, weights adjacent matches, scales time to initial pairs/stage and applies the difficulty multipliers and 20-second Challenge minimum described below. Hints: two, -8 seconds each; shuffle: one, -12 seconds; automatic recovery: -150 points, floor zero. Relaxed mode has no deadline and unlimited assists.

Historical storage version 3 preserved v1/v2 root aliases and the four old classic/layered records, shown read-only under settings. New easy/normal/hard × relaxed/challenge records have distinct keys. Old selected classic maps to Easy, old layered maps to Normal; scores/unlocks are not copied into new rules. Audio/character preferences survive migration. All new runs clamp stage to the active profile. A failed save is recoverable and never deletes the old entry explicitly.

## Background music
`src/music.ts` owns an original 16-bar, 104 BPM synthesized café loop (plucked melody, light extended chords, soft bass). Audio is generated once into a reusable mono buffer; there are no external recordings or music requests. One looping source plays at a time; starts fade in and stopped/ended nodes disconnect. The game model has no audio dependency.

A started, visible, unmuted session enables BGM, including dialogs. Start/resume/sound controls provide the user gesture for Web Audio; initial page load is silent. Dialogs, pause and results preserve the running source; page hide and mute stop it with a saved resume offset. The persisted sound setting controls both BGM and existing match effects. Unsupported audio/resume rejection must not break gameplay. Buffer generation and note tails wrap at the loop boundary.

## Static sharing metadata
Canonical, Open Graph and Twitter metadata live directly in index.html so crawlers need no JavaScript. Share-image URLs are absolute HTTPS project URLs; browser icon references are relative to the Pages mount. Keep 1200×630 image dimensions/alt text synchronized with the asset. SVG, PNG and ICO plus Apple touch icon mirror CDXPilot0004's compatibility approach.

## Mobile viewport and effect clearance — 2026-10-20
Normal is the default only when no valid difficulty is saved. Existing Easy/Normal/Hard choices and classic→Easy/layered→Normal migration remain intact; no record schema reset occurs.

Mobile viewport metadata requests fixed 1× scale. Root touch-action allows pan-x/pan-y but excludes pinch/double-tap zoom; non-passive multi-touch and WebKit gesture guards reject mobile zoom gestures only. Single-finger dialog scrolling and button taps remain enabled; mobile selects use 16px text to avoid focus zoom. Platform accessibility overrides and physical Safari behavior require device testing.

`fitBoard` sizes the face using actual board-area width and available visual viewport height after controls/notice/padding, including the complete exterior corridor plus 12px effect clearance on every side. This overrides conflicting legacy CSS size formulas, including the hidden-character branch. Both absolute tile placement and grid-slot route coordinates share the resulting --cell/--corridor. Preference changes, notices and viewport resizes trigger refitting; geometry changes discard stale route coordinates. Character source margins and inset do not change.

## Closed obstacle boundaries
Half-cell routing treats occupied same/higher unit footprints as closed rectangles: both coordinate distances <=0.5 block a sample. Decorative CSS gaps and seams between occupied rows/columns are not empty puzzle corridors. The start/end tiles alone are excluded; lower-floor traversal and the two-bend/exterior rules remain unchanged.

## Compact header, continuous music and Challenge timing — 2026-10-20
The former introductory section is merged into the header: a desktop tagline beside the logo, help beside sound/settings, and introduction copy inside the start card. Small screens hide the header tagline. Main content begins 16px below the header on desktop, 10px on mobile and 6px in short landscape. Exterior corridors, effect clearance and character source/runtime padding remain independent.

Music now follows a started session, not the gameplay clock. Settings, help, stage/difficulty selection, pause and result dialogs keep the existing source playing while gameplay remains paused or terminal. Initial load is silent. Mute, backgrounding and returning to the initial menu stop the source and retain its loop position; resumption starts at that offset. Stopped sources disconnect before replacement to prevent overlap. Reloading creates a new audio session; playback position is not persisted to storage.

For timed Easy/Normal/Hard, multiply the previous rounded budget by 0.85/0.75/0.70 respectively, round to seconds and apply a 20-second floor. Relaxed and legacy budgets remain unchanged. Hint/shuffle penalties remain 8/12 seconds. Existing records and storage schema remain unchanged, so historical Challenge scores can predate this stricter timing policy.

## Expanded puzzle rules — 2026-10-20 (historical)
New UI games use expanded generation; legacy generators remain regression baselines. Construct two copies of the former stage/viewport footprint, joined horizontally, preserving Easy/Normal/Hard floor counts and all four supports. Assign pairs across the combined floor, not independently per copy. This gives exactly twice the former occupied-tile count for every supported starting viewport and stage, including existing holes. No gravity is introduced.

Artwork comprises six families × six variants (36 SVGs). Shared silhouettes express family; topping shape/count and color identify variant. Symbol targets are Easy 12–16, Normal 20–28, Hard 30–36. Small boards cap unique symbols at total pairs minus four (minimum six), preserving some repeated pairs instead of making every symbol unique. Distribute selected symbols across all six families before adding more variants. Per-floor even counts and full solution witnesses remain mandatory.

Pair placement prefers longer legal connections during construction. Rank three seeded candidates (four in Challenge) using immediate, 25%, 50% and 75% removal checkpoints on two orders: the full witness and a reverse-preference legal order. Penalize adjacent and straight matches more heavily; heavily penalize a deadlocked alternate order. This is a bounded difficulty heuristic, not a proof that every choice wins or every board is equally hard. The complete witness guarantees at least one solution. Shuffle preserves surviving coordinates and per-floor symbols.

Tiles adapt to the available viewport; the complete board is visible without panning. Page zoom restrictions persist. Logical exterior corridors and effect clearances remain reserved on every side. Character art/insets are unchanged.

Expanded Challenge allows one automatic recovery, costing 15 seconds and 150 points (score floor zero). At a later deadlock, leave play active if the one manual shuffle is available; otherwise end with a blocked-board result. A penalty exhausting time ends immediately. Relaxed recovery remains unlimited. Existing hint/manual shuffle limits and difficulty time multipliers remain; time scales with the doubled initial tile count.

Storage v4 retains every previous classic/layered and easy/normal/hard record under its existing key. Expanded games use expanded-{difficulty}-{relaxed|challenge} keys. Existing difficulty/audio/character settings survive; new-rule progress starts separately. Settings display all prior records read-only. The old schema key remains chibilink.v1.

## Whole-board horizontal layout — 2026-10-20
The approved correction supersedes the earlier vertical-scroll policy. The doubled footprint joins horizontally (2 × baseline columns, unchanged rows), with pair assignment across the full floor. Tile counts, support geometry, symbol tuning, recovery limits, records and character assets remain unchanged. Desktop content expands to 1600px with a 240px companion panel.

Fit the complete board, exterior corridor and effect clearance between the header and controls; remove board panning. Tile faces adapt to available width/height, including compact portrait sizes below the previous 44px target. Reserve 18px effect clearance in addition to half a cell and the gap. Mobile gaps are 2px. Existing runs keep logical coordinates on resize.

Acceptance: exact doubled counts and horizontal dimensions, complete solution witnesses, six viewport sizes with character shown/hidden, full board above controls without scroll overflow, actual mouse/touch matching, unchanged storage/audio and original character margins. Inspect screenshots, especially compact portrait symbol legibility. Physical-device ergonomics remain a separate gate.

## Unified difficulty boards and match time — 2026-10-20 (current)
This contract supersedes doubled copies and viewport-dependent footprints. UI games use Easy 4×6×1 floor, Normal 6×6×2 floors and Hard 8×6×3 floors on every device. Construct one supported pyramid across the full width. Upper floors are connected; odd floor counts trim a corner, and safe holes preserve four supports. Keep 36 available family variants, bounded difficulty ranking and full solution witnesses. Original expanded/legacy generators remain regression fixtures.

Challenge successful matches grant Easy 3000ms, Normal 2000ms or Hard 1500ms, capped at the starting limit. Credit is separate from elapsed time so combo and gameplay clocks remain monotonic. Award once after legal removal, before recovery penalties; expired, paused, invalid and relaxed inputs award nothing. Show the awarded seconds in the reaction text. Starting budgets still derive from actual occupied counts and existing difficulty factors. Assist penalties and one automatic recovery remain.

Storage v5 preserves v1–v4 records and settings; unified-{difficulty}-{relaxed|challenge} keys separate changed rules. Prior records remain read-only in settings. Full-board fitting, source transparency, runtime character inset and effect corridors remain unchanged. Short landscape chrome is compacted to retain readable six-row boards.

Gate: all ten stages per difficulty must have fixed dimensions, connected upper floors, four supports and complete legal witnesses. Test credit amount, cap, duplicate removal, pause, exact expiry and v4/v5 migration. Run full browser regression plus actual Challenge match-credit checks on desktop/touch for all difficulties; inspect all six sizes and verify Pages separately.
