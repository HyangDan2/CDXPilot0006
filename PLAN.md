# ChibiLink implementation plan — padding requirements

## Status
- Implementation and local verification completed on 2026-10-19. Physical mobile devices and Safari remain explicitly unverified. GitHub Pages deployment and remote CI also completed after subsequent authorization.
- Reviewed existing processes and padding fixes in MacRepo/CDXPilot0004 and CDXPilot0005. Applied relevant precedents without changing those projects.
- Contributor contract: [AGENTS.md](AGENTS.md); design rules: [ARCHITECTURE.md](docs/ARCHITECTURE.md); verification: [HARNESS.md](docs/HARNESS.md); asset specifications: [ART_PIPELINE.md](docs/ART_PIPELINE.md).
- Sources and adoption decisions: [DECISIONS.md](docs/DECISIONS.md). Actual verification status: [QA.md](docs/QA.md).
- Workflow: read rules → inspect working files → identify ownership and scope → plan → bounded implementation → regression/full/browser checks → inspect screenshots → record results. Do not advance with unresolved failures.

## Confirmed requirements
- A desktop/mobile tile-matching puzzle: connect identical tiles with at most two bends.
- An original Japanese-animation-inspired chibi character reacts to gameplay.
- Reserve a logical one-cell empty border on all four sides and display the exterior connection corridor.
- Manage screen padding, board corridors, tile gaps and internal character-image margins separately.
- Include transparent padding in the source character images; CSS padding alone is insufficient.

## Character design rules
- Measure content bounds including hair, ears, limbs, clothing, props, shadows and effects in every pose.
- Require at least 15% transparent margins on all sides of each source cell, targeting 20% at generation. Apply an independent 10% runtime inset. These precedents come from prior fixes and must hold at maximum motion.
- Keep canvas size, scale and anchors consistent across frames: feet for full-body art, shoulders for busts. Never automatically trim transparent borders.
- Preserve aspect ratio with contain sizing and a fixed display frame.
- Reserve container space for maximum jumping, scaling and rotation independently of source margins.
- Keep the character, speech bubbles and effects clear of tiles and controls.
- Sprite sheets require gutters and protection against texture-filter bleed between cells.
- Provide an image-load fallback; character resource failures must not stop gameplay.

## Harness guidance
- Assets: verify decoding, alpha channels, consistent frame dimensions/anchors, content bounds and transparent margins.
- Visuals: inspect every expression/pose and maximum jump/scale for clipping, frame jitter and adjacent-frame bleed.
- Responsive layouts: check character, speech-bubble and control overlap on narrow portrait, landscape and desktop screens.
- Board: check exterior routes at every edge/corner, selection borders and match effects for clipping.
- States: retain layout and input during loading, image failure, viewport changes and device safe-area handling.
- Preserve the existing harness execution and reporting workflow; add these checks to its gates.
- Never report checks as passed unless they actually ran.

## Implementation sequence and gates
1. **Process and documentation — complete:** review precedents; write contributor, design, harness and art rules; verify document paths and plan status.
2. **Bootstrap and harness — complete:** TypeScript strict/Vite start screen, pinned environment/lockfile, lint/typecheck/test/build/verify and CI. Temporary assets also follow padding requirements. Gate: executable verification.
3. **Pure puzzle engine — complete:** two-bend paths, exterior border, seeded boards and solution witnesses, hints, deadlocks, shuffle, timing, scoring and state transitions. Gate: model/integration tests and verify.
4. **Desktop/mobile UI and input — complete:** padding/corridors, mouse/touch/keyboard, pause, rotation and storage-failure handling. Gate: verify, real-input E2E and viewport screenshot inspection.
5. **Chibi assets and reactions — complete:** preserve sources/prompts → extract and inspect → pack fixed canvases → update metadata and renderer together. Gate: PNG margin checks, verify/E2E and all-expression/maximum-motion screenshots.
6. **Local acceptance — complete; physical devices unverified:** full playthroughs, failure/restart/resource errors, nested URLs and small screens. Gate: full verify/E2E, visual inspection and QA/changelog updates. Explicitly record unavailable physical-device checks.
7. **Delivery:** distinguish implementation, executed checks, failures, unverified scope and limitations. Public deployment is a separate activity.

Initial acceptance: after a clean `npm ci`, verify passed with 11 model tests and E2E passed with 11 tests. Reuse prior projects' workflow and verification rigor, without importing their rhythm/action mechanics.

## Acceptance criteria
- Logical exterior paths match displayed connection lines.
- All character poses and motions fit both source and display bounds.
- Mobile tiles and controls remain unobstructed and usable.
- Gameplay continues when character images fail to load.
- Harness/design rules reflect changes and required verification results are recorded.

## Initial implementation results and adjustments
These are historical milestones; subsequent sections describe later changes.

- Implemented nine Momo expressions, twelve dessert symbols, ten stages, relaxed/Challenge modes, hints, shuffle, automatic deadlock recovery, combos and persistence.
- Preserved generated sources; standardized 512×512 deployment PNGs have at least 106px (20.7%) fully transparent margins on all sides. Independent 10% runtime inset and maximum-motion checks passed.
- Visual inspection found and fixed overflowing bottom controls. Initial responsive dimensions were 6×6 desktop, 4×6 tall mobile, 4×4 short mobile and 6×2 short landscape; the layered update later changed landscape to 6×4.
- Initial exterior clearance used half a cell + gap + 4px and kept lines inside the board. Later clearance changes are recorded below.
- Unit tests replayed full solutions for ten stages × thirty seeds. E2E covered actual-click completion, mobile taps, resource fallback, six viewport sizes and every expression.
- Evidence and limitations: [QA.md](docs/QA.md). Running the project: [README.md](README.md).

## Initial deployment results
- Uploaded to GitHub `HyangDan2/CDXPilot0006` and deployed through Actions to Pages.
- Public site: [Play ChibiLink](https://hyangdan2.github.io/CDXPilot0006/).
- Eleven local model tests, eleven E2E cases and remote CI passed under the actual deployment path.
- Public-site checks passed for six viewports, real input, nine expressions and PNG margins; see the hosted addendum in QA.md.
- Reviewed layered puzzles as a separate extension; subsequent approval authorized the two-floor work below.

## Approved follow-up — two floors, irregular layouts and harder Challenge mode
- Retain ten classic stages and add five two-floor stages, selectable in settings or the board mode control.
- Apply permanent hole masks to both modes. Since holes can open routes, tune difficulty through symbol variety, fewer easy matches and time/assist limits together.
- Challenge allows two hints costing eight seconds each and one shuffle costing twelve seconds. Automatic recovery costs 150 points without consuming manual shuffle quota.
- Preserve existing records as classic relaxed and separate all four mode combinations.
- Follow model/full checks → two modes at six viewports and touch completion → screenshot review → documentation → Actions/Pages → public-site verification.
- Preserve at least 106px PNG margins and 10% runtime inset; distinguish physical devices from emulation.

Completed: 16 model tests, 19 browser tests and remote CI/Pages passed. Public checks covered two modes × six viewports, actual matching input, nine-expression padding and matching deployed bundles. See QA.md's Two-layer entry. Physical mobile devices and Safari remain unverified.

## Fresh background music
Add an original 104 BPM, sixteen-bar café-style loop. Play after game start; stop on pause, results and backgrounding. Persist the existing sound preference for both BGM and effects. Verify actual audio output, mute persistence and mobile-tap startup before Pages deployment.

## Sharing preview and favicon
Reviewed CDXPilot0004's metadata/icon structure and applied it here. Added a 1200×630 preview featuring Momo, dessert tiles and a game introduction, flower-logo SVG/ICO/PNG favicons and an Apple home-screen icon. Preserve character padding, inspect generated assets and verify static metadata, image dimensions and deployed responses.

## Approved layered difficulty redesign
- Replace numeric badges with upper tiles centered over four lower tiles. Align input and routes using half-cell coordinates and same-floor connection rules.
- Easy: one floor; Normal: two; Hard: three. Each has ten stages. Symbol counts progress through 6–8 / 10–12 / 14–18 respectively.
- Add face/side depth, shadows, covered-tile shading and reveal effects. Preserve mobile controls, 106px source margins and 10% runtime inset.
- Use v3 storage to preserve old settings/records and separate new-rule records.
- Verify generation/coverage/routes/shuffle/migration → full checks → three difficulties × six viewports and mouse/touch completion → visual review → Pages/public-site verification.

Completed: 22 model tests, 35 browser tests and Actions/Pages passed. Hosted checks covered three difficulties × six viewports, actual clicks/taps and all-expression padding. Legacy records remain visible in settings and separate from new records. Physical devices/Safari remain unverified.

## 2026-10-20 — mobile zoom, effect clearance and default difficulty
- Restrict pinch/double-tap zoom while preserving taps and settings scrolling.
- Size tiles using actual available board width/height and 3D effect clearance. Verify hidden-character layouts and all corners.
- Default new users or users without a saved difficulty to Normal; preserve existing selections and records.
- Run full checks, mobile gestures/desktop input and character padding checks, followed by Pages deployment and public acceptance.

Completed: 23 model tests, 42 browser tests and Actions/Pages passed. Hosted checks covered three difficulties × six viewports, six hidden-character layouts, all expressions, zoom restrictions, taps and dialog scrolling. New users start Normal; saved choices/records survive. Physical devices/Safari remain unverified.

## 2026-10-20 — blocked-tile connection fix
Reproduced half-cell search treating occupied tile boundaries as empty corridors. Include boundaries in obstacles and add tests for rejection on three floors, opening a full empty row, comparison against classic-grid routing and actual mouse/touch input. Run full and hosted verification.

Fix deployed: 25 model tests, 44 browser tests and remote CI passed. Public checks confirmed blocked-pair rejection, valid matching and three difficulties × six viewports.

## 2026-10-20 — compact header, continuous BGM and shorter Challenge time
Approved: merge the introduction into the header/start card, preserve all board/character padding, continue BGM through popups, resume from the saved loop position after mute/backgrounding, and shorten timed Easy/Normal/Hard budgets by 15%/25%/30% with a 20-second minimum. Preserve existing records and assist penalties. Update English documentation, run model and desktop/mobile browser gates, inspect screenshots, push and deploy Pages, then verify the public site.

Deployment follow-up: an official GitHub Actions/Pages incident is blocking publication. A fresh workflow dispatch (39280973973) is queued; local timing verification passes for all three difficulties on desktop/mobile. Public layout, continuous BGM and timing verification remain outstanding until deployment succeeds. See QA.md for the incident, exact attempts and required acceptance commands.

## 2026-10-20 — doubled boards and sustained difficulty
Approved scope: exactly double the previous occupied count at each starting viewport/difficulty/stage; 36 family/variant symbols; fewer adjacent pairs; early/mid/late candidate evaluation; mobile/native and desktop/mouse board panning with 44px minimum faces; one Challenge automatic recovery (-15s/-150 points), then manual shuffle or blocked termination. Preserve original padding and records, store expanded records separately, update English contracts, run full desktop/mobile gates and deploy/verify Pages.

Implementation uses two vertically connected supported footprints with pair assignment across both. Small boards retain repeated pairs by capping the number of unique symbols; 36 is the available artwork set, not a claim that every compact board displays 36 kinds. Generation remains fully solvable with bounded difficulty sampling.

Expanded edition completed: model 33 and browser 46 checks passed locally and on remote CI; Pages deployed successfully. Public acceptance passed for three difficulties × six viewports, mouse/touch panning, continuous popup BGM, exact doubled counts, difficulty time budgets and character padding. Previous records remain separate; physical devices/Safari and subjective difficulty ratings remain unverified. Earlier service-blocked publication is resolved.
