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

BGM hosted acceptance: gameplay commit `3a6154f0cdcf85072bbc511faabdf06d9a4185be`, Actions run 39269590710 verify/deploy SUCCESS. `BGM_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep 'BGM audio'`: 2/2 PASS on the public Pages URL (desktop and touch emulation), including actual output, pause/resume, mute persistence and results silence. This documentation-only follow-up does not change the deployed bundle.

## Branding local acceptance — 2026-10-19
- Read CDXPilot0004/index.html and its SVG favicon as reference; reused its static OG/Twitter, ICO/PNG/SVG and Apple icon approach, with ChibiLink-specific artwork and URLs.
- `node scripts/build-branding.mjs`: generated card and icons. Directly inspected the 1200×630 card and 32px icon: Korean copy readable, character/tiles separated, no character clipping; source PNG retained unchanged.
- `npm run verify`: PASS, including new branding metadata/dimension/ICO checks, nine character alpha-margin checks, 16 model tests, lint/types and production build. JS/CSS bundle identities unchanged; no gameplay/layout changes.
- Social-platform cached previews and actual Apple home-screen installation are not verified by local asset checks. Public response checks follow deployment.

Branding hosted acceptance: deployed commit `745a9202c87b7d7c545ea31b5aafacd4ecef5f4e`, Actions 39270309983 SUCCESS (including 22 browser tests). First hosted-check invocation exposed a harness-only mistake (`Response.ok` treated as a method); corrected to its boolean property. Re-ran both `node scripts/check-branding.mjs --hosted` and `npm run branding:check`: PASS. Public card/icon responses and exact PNG bytes match local exports; social services' cache refresh remains outside this verification. The follow-up changes only the checker and QA record, not website output.

## Staggered pyramid local acceptance — 2026-10-19
- `npm run verify`: PASS, 22 model tests plus asset/branding/lint/type/build gates. New 360-board sweep covers three difficulties, four supported footprints, ten stages and three seeds; legacy 900-board regression coverage remains.
- New cases prove four supports per upper tile, half-cell offsets, blocked/cross-floor input rejection, floor-relative obstacles, full witnesses, partial shuffle conservation, command-only completion, 8/12/18 high-stage symbol targets and v2-to-v3 record isolation.
- First browser run found 844×390 controls ending at y=399. Preserved reproduction under `/tmp/chibilink-pyramid-failures/` and log `/tmp/pyramid-e2e.log`. Fixed landscape heading spacing; retained the original viewport assertion and 48px landscape controls.
- Final `npm run test:e2e`: PASS, 35 tests. All three difficulties × six sizes with nine-expression containment/corridors; Normal and Hard × relaxed/challenge × desktop mouse/mobile tap full completion. DOM face centers equal the mean of four supporting face centers; forced covered click is ignored. Legacy records remain readable/unchanged. BGM/fallback/persistence regressions pass.
- Direct screenshot review: Hard at 320×568, 1440×900 and 844×390; Normal at 390×844; share-card-v2 at 1200×630. Faces, shadows and uncovered colors communicate depth; character padding and controls fit. Long perimeter lines in local screenshots are explicit route-boundary fixtures, not real multi-bend game paths.
- No character PNG edits: original nine 512px outputs retain >=106px transparent margins plus runtime 10% inset. Hosted verification follows deployment. Physical Safari/iOS/Android and subjective difficulty balance remain unverified; existing mid-run extreme resize limitation remains.

## Staggered pyramid hosted acceptance — 2026-10-19
- Gameplay commit `adfe58808b3feb4db5b6558fc18a03dead52a19d`; GitHub Actions run 39272910908: verify/deploy SUCCESS, including all 35 browser tests.
- `node scripts/verify-hosted.mjs`: PASS on https://hyangdan2.github.io/CDXPilot0006/. Three difficulties × six viewports (18 scenarios): actual matching clicks/taps, pause/resume, no page/asset errors, nine expression bounds per scenario. All nine original PNG digests match and retain >=106px margins. Latest report and difficulty-labelled screenshots are in docs/hosted-evidence; earlier mode-labelled evidence remains historical.
- `node scripts/check-branding.mjs --hosted`: PASS for updated share-card-v2, metadata and favicon family.
- Directly inspected hosted Hard challenge screenshots at 1440×900 and 320×568: staggered faces, covered-state shading, visible upper controls/targets and mascot remain within bounds. Public JS/CSS exactly match local build: JS SHA256 `95d8cfa2e226213c1ba2db891fce95a949e4d400eb1127c4b5ad06ca15178740`, CSS SHA256 `63874db553ac52a18c88106fa3a472310ed51420679fa691c6d27f3c7397c3d0`.
- Physical mobile devices/Safari remain unverified. Follow-up evidence commit changes no deployed runtime.

## Viewport/default/clearance local acceptance — 2026-10-20
- Reproduced hidden-character Hard at 320×568 before changes: board left=-1.5/right=321.5 versus panel left=12/right=308, with controls below the viewport. Screenshot: `/tmp/chibilink-clipping-before.png`. The hidden-character CSS face formula omitted full exterior/effect space. This reproduces board/corridor clipping; it does not claim every device-specific clipping report has the same cause.
- Fit now uses measured panel/visual-viewport space, full corridor and 12px clearance. Shared tile/grid-slot geometry keeps input and route coordinates aligned; geometry changes clear stale routes.
- Final `npm run verify`: PASS (23 tests, asset/branding/lint/type/build checks). Final `npm run test:e2e`: PASS (42 tests). All existing full playthrough/BGM/storage/three-difficulty/six-viewport/nine-expression cases pass.
- Added six shown/hidden-character Hard cases: board/panel/control containment and conservative 16px base/26px upper effect bounds. Directly reviewed 320×568 hidden and 844×390 shown screenshots in test-results/effect-safe-*; tiles, shadows, controls and companion remain contained.
- Added actual Chromium touch pinch-in/out and double taps: visualViewport.scale stays 1. Real pair taps and single-finger scrolling of an overflowing settings dialog work. New profiles begin Normal; saved difficulties, migrated classic/layered choices, sound/character preferences and records remain intact.
- Browser emulation is not physical-device Safari/Android or OS accessibility-zoom certification. Original character assets/padding remain unchanged. Hosted checks follow deployment.

- Initial remote gate 39275100083: 41/42 browser cases passed; dialog scroll stayed at 0 in the fixed-coordinate synthetic swipe. Deployment was blocked. Replaced fixed screen coordinates with a real touch drag along measured dialog padding after resize settles, avoiding native form controls; retained the scrollTop assertion. Targeted local mobile test passes. Remote recheck follows.

## Viewport/default/clearance hosted acceptance — 2026-10-20
- Runtime commit `0e32c59d30337d74d19c5c30b4279661d177be99`; Actions run 39276023399 verify/deploy SUCCESS, including 23 model tests and all 42 browser tests. The measured touch drag also passes on Linux CI; initial scroll-test failure is resolved without weakening the scroll assertion.
- `node scripts/verify-hosted.mjs`: PASS on the public Pages URL. Three difficulties × six viewports, actual mouse/touch matches and pause/resume, nine expressions per scenario and six Hard hidden-character layouts. No page/asset failures; original nine character PNGs match local bytes and retain >=106px transparent margins.
- `MOBILE_QA_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep 'mobile Normal start'`: PASS. Public fresh profile starts Normal, actual touch pinch-in/out and double taps retain scale 1; matching and overflowing-dialog touch scroll work.
- Visually inspected hosted 320×568 hidden Hard, 320×568 shown Normal and 1440×900 shown Hard: tile effects, controls and character fit. Report/screenshots are in docs/hosted-evidence.
- Public production bytes match local: JS SHA256 `5f8853676598df1c08f6b73da350ce3015695a883c2f21ce77135daadab67e1e`; CSS SHA256 `375ba9523d652a4cbefd1b856c660966b5e387f3fe35517ae6a2cc40b85fe7dd`.
- Physical mobile devices, Safari and OS accessibility zoom remain unverified. Evidence-only follow-up changes no runtime assets.

## Occupied-seam reproduction — 2026-10-20
- Before fix: `npm test` fails new regression (23 previous pass): full 5×5 floor incorrectly connects (1,2) to (3,2) along y=2.5, through the boundary of occupied rows. Failure log `/tmp/path-before.log`. Existing tests only required a detour; they did not reject this invalid seam.
- Root cause: strict <0.5 footprint check left boundary samples passable. Closed <=0.5 footprints reject the shortcut while preserving complete empty-cell corridors. No storage migration/reset or art/layout changes.
- Local `npm run verify`: PASS, 25 model tests including all 360 generation witnesses and 6,000 independent grid comparisons. `npm run test:e2e`: PASS, 44 cases. Real mouse/touch blocked-seam inputs preserve tiles/score and emit no route; adjacent legal matches still remove exactly two tiles. Reviewed mobile blocked-seam screenshot: enclosed strawberry tiles remain and feedback asks for another route. Existing PC/mobile playthrough, zoom/scroll and character-padding checks pass.

- Hosted acceptance: runtime commit `a3d6ed3a5a3cd6e425fbb9681e0fc9fa19f50e15`, Actions 39277161128 verify/deploy SUCCESS. `PATH_QA_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep 'blocked seam'`: 2/2 PASS, real mouse/touch rejection and valid adjacent matching. Hosted fixture screenshots saved as docs/hosted-evidence/blocked-seam-{desktop,mobile}.png; desktop screenshot reviewed directly.
- `node scripts/verify-hosted.mjs`: PASS, all three difficulties × six viewports, real matches, nine-expression bounds, hidden-character containment and identical source PNGs. Public JS SHA256 `1493a7e9c9ce70647a4a655299fb2619d3a0abcc1022a9a6672a588c2d7aee1a` and unchanged CSS match local production bytes. Physical devices/Safari remain unverified. Evidence-only follow-up does not change runtime.

## English documentation acceptance — 2026-10-20
- Checked all 14 tracked text documents: no Korean text remains and relative Markdown links resolve. `git diff --check` passes. Translated the historical UI snapshot with explicit provenance; its original is retained in Git history. Updated the contributor language rule and stale README descriptions.
- Documentation-only change: runtime code, UI, assets and saved data are unchanged. Gameplay/browser tests were not rerun for this translation.

## Compact header, continuous BGM and Challenge budgets — 2026-10-20
- `npm run verify`: PASS (26 model tests, assets/branding, lint/types/build). Difficulty budgets match the previous rounded seconds multiplied by 0.85/0.75/0.70; relaxed budgets and 8/12-second penalties remain unchanged. Storage is untouched.
- `npm run test:e2e`: PASS, 44 tests including all six viewports, three difficulties, actual mouse/touch completion, closed-seam rejection, zoom/scroll and original character padding. Reviewed desktop Normal 1440×900, narrow mobile menu 320×568 and landscape Hard 844×390 screenshots. Desktop panel begins at y=92 instead of the preceding y=212 layout; header help, controls and companion remain contained. Perimeter lines in layout screenshots are synthetic rendering fixtures.
- After adding deterministic visibility-event coverage, lint and targeted `npm run test:e2e -- --grep 'BGM audio'`: PASS (2/2 desktop/touch cases). Actual analyser output continues through five interrupting dialogs and results; source-start count stays unchanged and paused game elapsed time stays fixed. Mute/background handlers retain loop position and each resumption starts one source. Muted reload and unsupported-audio fallbacks remain covered.
- Visibility events are simulated in Chromium; physical devices/Safari, OS audio interruption and subjective listening quality remain unverified. No character art/source margins or persistence schema changes. Hosted acceptance follows deployment.

- Remote publication pending: implementation commit `6a52398e9c2cd2b3ee15aaf725781ce7de54226e` pushed successfully. Actions run 39279811761 remains queued with no runner assigned after repeated checks. Public HTML still references the preceding `index-BCAbD3_f.js` / `index-BwE3aUZ5.css`, so the new runtime is not yet published and hosted acceptance has not been claimed. Required follow-up once deployment succeeds: `node scripts/verify-hosted.mjs` and `BGM_URL=https://hyangdan2.github.io/CDXPilot0006/ npm run test:e2e -- --grep "BGM audio"`, plus bundle identity and screenshot inspection.

## Deployment retry and external service incident — 2026-10-20
- Original run 39279811761 remained queued. Cancellation returned HTTP 202 but its reported status did not change; force-cancel returned HTTP 409 because it was not in progress. Dispatched the unchanged runtime at latest main (`e6c641b`) as run [39280973973](https://github.com/HyangDan2/CDXPilot0006/actions/runs/39280973973); this also remains queued without a runner.
- GitHub's [official incident](https://www.githubstatus.com/incidents/8tzbpcnl75jp), first reported at 00:49 KST on 2026-10-20, identifies degraded Actions and Pages performance. The status API reports an active investigation. This is an external blocker; no verification/deployment gates were bypassed.
- Added `scripts/verify-hosted-timing.mjs`. Local production build PASS; target checker PASS for three difficulties × desktop/mobile, exact budget ratios, displayed countdowns and paused popup timers. Desktop stage-one budgets: Easy 68s, Normal 103s, Hard 117s; mobile 390×844: 46s, 67s, 71s. Local-only evidence is `/tmp/chibilink-timing/timing-report.json` and explicitly records the localhost URL.
- Public layout, popup BGM and Challenge-time acceptance remain pending because the new runtime is not deployed. After the queued workflow succeeds, run verify-hosted.mjs, the BGM_URL E2E suite and verify-hosted-timing.mjs against Pages; compare production bytes and inspect screenshots before recording success. No runtime code or storage changed in this follow-up.

## Expanded edition local verification — 2026-10-20
- The new generator exactly doubles legacy occupied counts using two supported footprints and shared per-floor pair assignment. Model coverage includes all three difficulties, four footprints and stages 1/5/10, full witness replay, four supports, 36 unique names/SVGs, v3→v4 record separation, recovery limits/costs and deadlock termination. A fixed-seed aggregate comparison verifies lower early/mid/late easy-match cost than unoptimized pairing; subjective difficulty remains a playtest question.
- First browser gate: 42 passed / 4 failed. Three failures were old hard-coded 18/60-pair playthrough ceilings; loops now derive the count from actual occupied tiles while retaining the full-win assertion. Mobile pinch-then-tap also exposed stale drag click suppression; a fresh pointer press now resets suppression. Failure evidence retained under /tmp/expanded-first-failures and /tmp/expanded-e2e.log. Full rerun follows.
- Reviewed the 36-symbol gallery (docs/screenshots/expanded-symbols.png), desktop Normal 1440×900 and mobile Hard 320×568: family silhouettes and topping geometry distinguish variants; panels/character/controls fit. The full board intentionally extends beyond its scroll viewport. Minimum face size is 44px, with unchanged logical corridor/effect clearance and original character margins/inset.
- Final `npm run verify`: PASS (33 model tests, assets/branding/lint/types/build). Final `npm run test:e2e`: PASS, 46 cases. Actual-input full completion passes for Normal/Hard × relaxed/Challenge × desktop/touch. Native touch and mouse drag scroll without selecting/removing tiles; controls stay fixed and faces stay >=44px. Fresh taps after zoom/drag pass. Reviewed the mobile far-end drag screenshot: final rows, effects and corridor remain reachable without character/control overlap.
- Physical iOS/Android and Safari are unverified; all browser evidence uses Chromium desktop/touch emulation. Difficulty ranking is verified against deterministic heuristics, not a human difficulty rating. Public checks follow the deployment gate.
