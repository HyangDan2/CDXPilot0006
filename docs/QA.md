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
- CI workflow exists but has not run remotely. No repository publication or hosted deployment was performed.
- Board shape is selected at run start. Extreme in-run resizing retains topology and can shrink targets; a new run selects the suitable layout. Rotation pauses play but is not claimed as fully certified device behavior.
- Generated character art is nine still expressions with CSS motion, not nine fully hand-animated clips.
