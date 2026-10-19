# Local verification — 2026-10-19

Environment: macOS arm64, bundled Node v24.19.0, npm 8.1.2. Playwright 1.56.1 Chromium 141.0.7390.37; static production served under `/chibilink/`. Seed 731 for the initial browser game; model generation covers 10 stages × 30 seeds at 4×6/6×6 dimensions.

## Executed checks

| Check | Actual result |
| --- | --- |
| `npm ci` | Clean install succeeded; 156 audited packages, zero reported vulnerabilities |
| `npm run verify` | Environment, PNG assets, ESLint, strict TypeScript, 11 model tests, production build passed |
| `npm run test:e2e` | 11 Chromium tests passed, including the final 48px mobile-control recheck |
| `./scripts/dev-local.sh` | Started successfully despite system PATH containing Node 16; selected bundled Node 24 |
| `node scripts/capture-preview.mjs` | Captured normal-URL desktop, mobile, short mobile and landscape previews |
| `node scripts/review-art.mjs` | Captured all nine expressions on checkerboard and dark backgrounds |

Model coverage: zero/one/two-bend paths, three-bend rejection, all four exterior edges, invalid endpoints, 300 full solution-witness replays, actual selection-only completion, no duplicate scoring, shuffle multiset/holes, pause/timer expiry, automatic deadlock recovery, hints and storage failures.

Browser coverage: complete actual-click playthrough; hint, shuffle, pause/frozen time, next stage and persistence; real keyboard selection; mobile-emulated touch taps; missing PNG fallback; unavailable/corrupt storage; reduced motion and character hiding; normal URL has no test hooks; no failed normal asset responses under nested path. Clear/fail fixtures test only terminal layout and are not counted as completion evidence.

## Screens and padding

Checked 320×568, 360×640, 390×844, 620×800, 844×390 and 1440×900. Each case runs all nine expressions, samples each animation at its midpoint/maximum upward transform, checks fixed positioned parent and single inset child, checks horizontal bounds and bottom control visibility, and captures menu/play/pause/result screens. A synthetic perimeter route verifies exterior cell centers and stroke clearance within the board; it deliberately is not a legal match path.

Each of the nine 512×512 PNGs has at least 106px (20.7%) completely transparent margin on all four sides. Alpha >32 substantial-art margins are measured separately. Runtime adds 10% inset. The original generated atlas is preserved; complete cells were uniformly resized and surrounded with transparent padding rather than relying on the original's inconsistent margins.

Visual review: all nine frames on checkerboard and dark backgrounds; no visible cut hair/hands, neighboring portraits or text. Desktop and mobile previews show intact game boards, visible controls and contained character artwork. The final named `blink` frame is a wink. Slight natural silhouette/baseline differences exist between generated poses; uniform scale and fixed frame anchor are retained.

Evidence: `test-results/` contains final browser screenshots/traces and last-run status. `npm run assets:check` writes `test-results/asset-margins.json` (Playwright clears its output directory when starting; a retained copy is kept as `docs/asset-margins.json`). `docs/screenshots/` contains reviewed normal-URL screenshots and art sheets. Browser reports are in `playwright-report/`.

## Failures found and resolved

- Initial UI put controls below the viewport at all six sizes. Preserved 320px/desktop screenshots in `docs/qa-failures/`. Fixed vertical allocation, compact header spacing, and smaller board counts on short screens. No assertion was removed.
- Exterior-route geometry required half a tile + gap + stroke clearance, rather than a fixed 18/24px corridor. Bounds checks now cover all four sides/corners.
- A unit fixture incorrectly required the upper route when both upper and lower routes were legal. Made the lower row occupied to test the intended upper route without weakening path assertions.
- Dependency versions initially reported advisories. Updated affected development tools using npm and regenerated the lockfile; clean install reports zero advisories.
- Preserved keyboard focus across board rerenders and made result handling idempotent so timeout detected by hint/shuffle is still shown by the next UI tick.

## Not verified / limitations

- No physical iPhone/Android device or Safari/Firefox run. Touch tests are Chromium emulation, not hardware gesture or safe-area certification.
- No physical listening, sound quality evaluation or sustained performance benchmark. Audio failure is nonfatal by design.
- Initial local-only qualification was followed by successful remote CI and Pages deployment; see the hosted addendum below.
- Board shape is selected at run start. Extreme in-run resizing retains topology and can shrink targets; a new run selects the suitable layout. Rotation pauses play but is not claimed as fully certified device behavior.
- Generated character art is nine still expressions with CSS motion, not nine fully hand-animated clips.


## Hosted deployment acceptance — 2026-10-19 (Asia/Seoul)

- Repository: https://github.com/HyangDan2/CDXPilot0006
- Live URL: https://hyangdan2.github.io/CDXPilot0006/
- Initial verified/deployed source commit: `7e3c02d585f4001cf4758cf47503bf80201ca46e`.
- Remote Actions verification and deployment succeeded: https://github.com/HyangDan2/CDXPilot0006/actions/runs/39266198388
- Executed `node scripts/verify-hosted.mjs` against the live URL. All six viewport sizes passed: 320×568, 360×640, 390×844, 620×800, 844×390 and 1440×900.
- Actual normal-URL hint + pair click/tap and pause/resume succeeded at every size. No normal-URL debug hook, page exceptions or HTTP error responses.
- All nine deployed PNG SHA-256 digests matched the local files; every frame retained at least 106px fully transparent padding on all sides.
- All nine expressions at each animation's maximum upward movement/scale fit their positioned frames at every viewport. Reviewed live desktop, small/tall mobile and landscape screenshots; no visible hair/hand clipping or control overflow.
- Evidence and exact browser timestamp/version: `docs/hosted-evidence/report.json` and screenshots beside it. These are real hosted Chromium checks with mobile/touch emulation, not physical iPhone/Android or Safari certification.
- This addendum and the hosted harness do not change production game files. Subsequent documentation/harness commits deploy the same application bundle after their normal CI gate.

## Two-layer release local gate — 2026-10-19
- Environment: macOS, Node 24.19.0, Playwright Chromium. `npm run verify`: PASS (16 tests, lint, strict types, nine PNG checks, production build).
- New witness coverage: 600 mode/difficulty/stage/size/seed combinations plus 300 legacy boards. Layer reveal, partial shuffle, challenge quotas/expiry and storage migration pass.
- `npm run test:e2e`: PASS, 19 tests. Both modes × six viewports; all nine expressions at maximum animation midpoint; exterior route containment; classic click completion; layered relaxed and challenge touch completion with real inputs. Error/fallback, keyboard, settings and persistence regressions pass.
- Directly inspected `test-results/play-layered-320x568.png` and `play-layered-1440x900.png`: badges, gaps, mascot and controls fit. Synthetic perimeter lines in these local screenshots are corridor fixtures, not game paths. Hosted screenshots use normal gameplay.
- Mascot source and output assets unchanged: nine 512px frames, alpha margins >=106px and independent runtime 10% inset retained.
- Physical iOS Safari/Android devices, browser toolbars and subjective difficulty balance remain unverified. Emulated touch completion is not physical-device evidence. Existing extreme mid-run resize limitation remains.
- Hosted acceptance for this release follows deployment; results recorded separately below.

## Two-layer hosted acceptance — 2026-10-19
- Deployed gameplay commit: `bf284dae0e1e2691f6eace21275973d529dc61e9`. GitHub Actions run 39268489804: verify and deploy jobs both SUCCESS, including clean npm ci and 19 browser tests.
- `node scripts/verify-hosted.mjs`: PASS against https://hyangdan2.github.io/CDXPilot0006/. Twelve scenarios: classic relaxed and layered challenge at 320×568, 360×640, 390×844, 620×800, 844×390 and 1440×900. Real click/tap hint matching and pause/resume pass; no page errors or failed asset responses.
- Nine expressions per scenario: containment at animation midpoint passes. All nine deployed PNGs equal local files and have >=106px transparent margins. `docs/hosted-evidence/report.json` records browser version, timestamp and measured bounds; mode-labelled PNGs contain screenshots. Earlier unlabelled screenshots are retained as historical evidence.
- Directly inspected hosted layered challenge screenshots at 320×568 and 1440×900: visible depth badges/gaps, readable assist counts, no character cropping or horizontal overflow. Local 844×390 landscape also inspected.
- Downloaded deployed JS/CSS match local production bytes: JS SHA256 `0862cb978e43873f4fe60f799fce3609a29c85cef64557850a6a53266fffa3c9`; CSS SHA256 `5e5388d4e6fb176558770480483163cc598f388f98035942a1c9abcfbb5b4327`.
- Physical mobile devices and Safari remain unverified; this acceptance uses Chromium desktop and mobile/touch emulation.

## BGM local gate — 2026-10-19
- `npm run verify`: PASS (16 model tests, asset margins, lint, types and build).
- `npm run test:e2e`: PASS (22 tests). New desktop and mobile-emulated tests measure nonzero actual Web Audio analyser output after user start/resume, silence after pause/mute/results, and persisted mute after reload. AudioContext failure still allows real pair matching.
- Original music generated by `src/music.ts`: 104 BPM, 16 bars (~36.9 seconds), plucked melody/chords/bass, no external music asset dependency. Cosmetic audio does not mutate gameplay.
- Existing six-size/two-mode layout and nine-expression padding regression checks passed. No layout or image geometry changed.
- This is signal/lifecycle verification; physical speaker listening, Safari and real-device autoplay remain unverified. Hosted BGM checks follow successful deployment.
