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

## Layered and challenge regression gate
Replay complete removal witnesses for both modes, both difficulties, every stage, four responsive board sizes and five seeds (600 combinations), in addition to the legacy 300 boards. Verify top-only removal/reveal, depth <=2, permanent masks, partial-board shuffle preserving all remaining symbols, challenge quotas/penalties/expiry and version-1 storage migration with isolated mode records.

Run both board modes through all six viewport/expression/corridor cases. Complete layered relaxed and challenge games using real mobile-emulated taps, including assist quota exhaustion in challenge. Hosted acceptance repeats six sizes in classic relaxed and layered challenge, checks real click/tap matching and nine expressions, and compares deployed PNG digests and transparent margins. Never substitute fixtures for actual completion.

## BGM gate
Browser audio tests must observe actual analyser RMS, not just a requested play flag: silent initial load, audible output after mouse/touch start, fade to silence on pause/mute/results, resume output and persisted mute after reload. Test unavailable AudioContext while matching. Run the same BGM tests against Pages with `BGM_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep 'BGM audio'`. Test hooks remain limited to `?test=1`. Headless signal checks do not certify speaker quality or physical iOS autoplay behavior.
