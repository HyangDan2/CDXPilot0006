# Development and verification harness

Status: implemented. Use Node 24.19.0 from .nvmrc (minimum 22.13).

## Workflow and gates
Read AGENTS.md and ARCHITECTURE.md → inspect working files → identify ownership and plan → bounded implementation → relevant regression checks → full verify and browser checks for gameplay/visual changes → visually inspect screenshots → update docs/QA.md and CHANGELOG.md → report actual outcomes. Resolve failures before advancing.

The committed lockfile fixes dependency versions. Available commands:

| Command | Contract |
| --- | --- |
| npm ci | Reproducible installation after a lockfile exists |
| npm run dev | Local HTTP development server |
| npm run assets:check | Actual PNG/manifest checks described in ART_PIPELINE.md |
| npm run lint / npm run typecheck | Static checks |
| npm test | Pure model and integration regression tests |
| npm run build | Production bundle |
| npm run verify | Environment, assets, lint, typecheck, model tests and build |
| npm run test:e2e | Production browser checks under a nested base path |

## Model checks
Test zero/one/two-bend paths, blocked and three-bend rejection, exterior paths on all edges/corners, same-cell/different-symbol rejection, route obstruction and pair removal exactly once. Test seeded generation/solution witness, deadlock detection, bounded shuffle recovery, hints, timer boundary/pause, restart and terminal-state input. Include a complete input-command playthrough without mutating board/score to fake completion.

## Browser checks
Use actual pointer/keyboard actions for selection, hints, shuffle, pause/resume and restart. Assert model snapshots instead of arbitrary sleeps. Test hooks must exist only in explicit test mode. Named clear/failure fixtures test layout; they do not count as full-game completion.

Exercise missing-image requests, corrupt/unavailable storage, no duplicate handlers, normal URLs without debug hooks, console errors and nested static paths. CI uses the same commands and retains failure screenshots/traces.

## Layout and character checks
Viewports: 320×568, 360×640, 390×844, 620×800, 844×390 and desktop 1440×900. Inspect menu/play/pause/results and previews; all expression cells, hidden-character mode and reduced motion.

Check outer frame containing block, square/aspect-ratio bounds, single inset sprite child, atlas coordinates, baseline stability, no neighboring cell bleed, title/card separation, route corridors, readable controls and safe areas. Freeze animations for deterministic geometry, then inspect maximum jump/scale/shadow with animation on. PNG bounds and mocked DOM tests do not prove browser containment.

On real iOS Safari and Android Chrome, check notch/home indicator, browser toolbars, rotation, touch cancellation, background/pause, dialog scrolling and actual touch targets. Emulated viewports are recorded separately from physical devices.

## Failure recovery and evidence
Preserve failing reproduction, seed, command, environment, logs, screenshot and trace. Fix implementation; do not weaken tests or regenerate references to conceal a defect. Re-run affected checks and the required phase gate.

Record exact command, result, viewport, seed/scenario, browser/OS, artifact path and remaining unverified work in QA.md. Documentation-only changes need path/command-status checks, not invented gameplay test results. Local build success never proves remote publication.


## Running this checkout
Use `nvm use` if available, then `npm ci`. Install Chromium once with `npx playwright install chromium` (CI adds `--with-deps`). Run `npm run verify`, followed by `npm run test:e2e`. The E2E server serves production at http://127.0.0.1:4173/CDXPilot0006/ and is automatically stopped by Playwright.

`npm run dev` starts the local Vite preview. `/art-review.html` displays all nine frames on checkerboard/dark backgrounds. `node scripts/pack-art.mjs` mechanically exports the preserved source cells; it does not call image generation. `node scripts/review-art.mjs` captures the review page when the dev server is on port 5173. `node scripts/measure.mjs` records viewport geometry on that same server.

E2E contains six viewport cases and a mobile Chromium touch-emulation case. It checks all nine expressions at each animation’s midpoint (its maximum upward movement/scale), outer frame containment, and a synthetic exterior-boundary route with a 2px minimum stroke clearance. That perimeter fixture is a rendering test, not a legal multi-bend match. Legal routes are independently covered by pure tests and real click/tap matching.

Clean installation, asset measurements and final local results are recorded in QA.md. Real-device Safari/Android and auditory quality remain separate qualification steps. Remote CI has now passed.

## Hosted acceptance
Pages deployment is authorized. Repeat viewport/mascot containment and actual-input smoke checks against the deployed URL; record failures, screenshot evidence and commit identity separately from local E2E. See DEPLOYMENT.md. Layered gameplay follows the same model → verify → browser → visual review → deployment gates.

Run `node scripts/verify-hosted.mjs` to repeat hosted acceptance. Optional HOSTED_URL overrides the URL. The script writes screenshots and a JSON report in docs/hosted-evidence, checks exact deployed PNG digests/alpha margins, and uses normal URL controls for actual matching before test-only expression bounds checks.

## Staggered pyramid and difficulty gate
Keep legacy model tests for the old rules. New generation tests replay all three difficulties × four responsive footprints × ten stages × three seeds (360 boards). Assert four supports for every upper tile, exact half-cell offsets, correct floor count, covered input rejection, cross-floor rejection, same/higher obstacle semantics, per-floor shuffle conservation and full command completion. Verify symbol targets and version-2 migration separately from old regression cases.

Browser cases cover all three difficulties at six viewports, all nine expressions at maximum animation, exterior corridors and exact upper-face centers relative to four lower centers. Complete Normal/Hard in relaxed/challenge with real desktop clicks and mobile-emulated taps. Verify legacy records remain visible/unchanged, disabled lower clicks cannot select, and numeric badges are absent. Save and inspect failures before fixing them; never lower viewport assertions to hide overflow.

Hosted acceptance runs Easy relaxed, Normal challenge and Hard challenge at all six sizes, actual click/tap matching, nine-expression bounds and exact PNG checks. Preserve distinction between emulator and physical devices.

## BGM gate
Browser audio tests must observe actual analyser RMS, not just a requested play flag: silent initial load, audible output after mouse/touch start, continued output through pause/results dialogs, silence on mute/backgrounding, position-preserving resume output and persisted mute after reload. Test unavailable AudioContext while matching. Run the same BGM tests against Pages with `BGM_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep 'BGM audio'`. Test hooks remain limited to `?test=1`. Headless signal checks do not certify speaker quality or physical iOS autoplay behavior.

## Branding gate
`npm run branding:check` is included in verify: validate static sharing metadata, PNG dimensions, all ICO entries and icon assets. Run `node scripts/check-branding.mjs --hosted` after deployment to check public responses and exact PNG bytes. Visually inspect the generated share card and 32px favicon; do not infer visual quality from dimensions. Third-party social cache refresh is separate from HTTP/metadata validation.

## Mobile zoom and clipping gate
Test a fresh browser starts Normal and persisted difficulties/settings/records survive. Use Chromium CDP touch pinch-in/out and double taps to assert visualViewport.scale remains 1; confirm real matching taps and single-finger scrolling in an overflowing dialog still work. `MOBILE_QA_URL` redirects the mobile test to Pages.

At all six viewports, inspect Hard with character shown and hidden. Assert board bounds remain inside the panel, controls fit, and tile face bounds expanded by conservative effect extents (16px base, 26px upper) fit inside the board. Keep all three difficulty/mascot/exterior-route regression cases. Inspect actual screenshots; DOM bounds alone cannot establish shadow appearance. Record physical-device zoom/accessibility overrides separately.

## Occupied-seam regression gate
Reproduce a full 5×5 floor with equal symbols at (1,2)/(3,2), all other cells occupied: no match or score mutation is permitted. Repeat on all three floors; removing a whole row must open a valid corridor. Compare 6,000 candidate pairs across seeded hole layouts against the independent classic grid search. Browser tests use named blocked-seam fixtures with real mouse/touch input and also prove valid adjacent matching still works. Use PATH_QA_URL to repeat these browser tests against Pages. Fixtures are regression cases, not full completion evidence.

## Compact header and continuous audio gate
Verify all six viewports, header help access, board/effect bounds and character containment after removing the separate intro section. Inspect desktop, narrow mobile and landscape screenshots.

BGM tests must prove nonzero audio and unchanged source-start count across settings/help/stage/difficulty/pause/result dialogs. The game clock must remain paused in interrupting dialogs. Verify saved playback position across mute and simulated visibility events, one restart per resumption, muted reload and unavailable audio. Visibility-event simulation is not physical browser background qualification. Run hosted audio tests with BGM_URL after deployment.

Verify timed difficulty ratios (0.85/0.75/0.70), integer-second rounding, 20-second minimum and unchanged relaxed budgets/assist penalties. Preserve record migration tests. These current contracts supersede historical pause/results-silence and 30-second-floor acceptance entries.

Run `node scripts/verify-hosted-timing.mjs` after deployment to check all three Challenge budgets on desktop/mobile, displayed countdowns and popup timer pausing. The checker derives the old stage-one budget from the actual tile count and verifies each difficulty multiplier. It records URL, browser, timestamp and observed budgets in docs/hosted-evidence/timing-report.json. HOSTED_URL can target another server; set TIMING_EVIDENCE_DIR for local runs so local evidence does not overwrite hosted results. This complements the model tests across stages and the separate BGM suite.

## Expanded-board acceptance gate
Compare occupied counts against the retained generator for each mode, 4×4/4×6/6×4/6×6 baseline and early/mid/late stages; require exactly 2×. Replay every solution and verify four supports, legal routes, no seam shortcuts and shuffle conservation. Compare aggregate checkpoint costs against unoptimized pairing on fixed seeds. Difficulty scores are heuristics, not subjective playtest results.

Check 36 unique names/SVGs, six family silhouettes and six shape/color variants. Inspect the full gallery and actual 44px tiles. Test v3→v4 preservation, separate expanded scores and settings continuity. Exercise first automatic recovery costs, rejection of a second recovery, remaining manual shuffle, blocked termination and unlimited relaxed recovery.

Browser playthrough loops derive their pair budget from the actual starting count. Test native touch and mouse drag: scroll position changes, selected tile/score/contents do not, minimum 44px faces and fixed controls remain. Check far end of scrollable board as well as the initial viewport. Retain six-size, character, audio, zoom, timer and route-clearance regressions. Run drag cases against Pages with EXPANDED_QA_URL; hosted timing uses the actual doubled tile count.
