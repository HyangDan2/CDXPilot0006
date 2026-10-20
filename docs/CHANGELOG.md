# Changelog

## 2026-10-19 — Planning
- Adopted existing CDXPilot0004/0005 development and verification workflow.
- Specified independent source transparency, runtime inset and board exterior-path padding.
- Added containing-block, sprite-isolation, asset provenance and visual QA rules.
- Game implementation and image production remain pending.

## 0.1.0 — 2026-10-19
- Implemented the ten-stage dessert matching game with relaxed/timed modes, scores/combos, hints, shuffling, automatic deadlock recovery, pause/retry and local progress/settings.
- Added original Momo generated expression art, nine padded RGBA exports, twelve original SVG dessert icons and optional local match sounds.
- Added desktop/mobile/short-landscape layouts, keyboard/touch input, image/storage fallbacks, reduced motion and character visibility settings.
- Implemented deterministic rule/integration tests, production nested-path browser checks, PNG validation, CI, asset review and maintenance documentation.
- Fixed initial viewport overflow and exterior-route clearance after browser failures. Physical mobile/Safari remain unverified; remote deployment was completed in the follow-up below.


## Deployment — 2026-10-19
- Published to HyangDan2/CDXPilot0006 and enabled GitHub Pages through Actions.
- Changed production E2E mount to exact `/CDXPilot0006/`; deployment waits for successful verify/E2E and uploads only dist.
- Verified the live service at six PC/mobile viewport sizes, nine expressions, source PNG padding/digests, real pair input and error-free loading.
- Added hosted verification harness/evidence and a separate multi-layer puzzle design proposal; production remains classic 2D.

## Layered update — 2026-10-19
- Added two-layer/five-stage play, top-only selection, depth badges and lower-tile reveal.
- Added irregular gap masks to classic and layered boards.
- Hardened challenge generation, timer, limited assists and recovery penalty.
- Migrated legacy records and isolated four gameplay profiles.
- Extended model, browser and hosted harnesses; retained original mascot PNG padding.

## Fresh café BGM — 2026-10-19
- Added an original 104 BPM, 16-bar plucked melody/chord/bass loop, generated locally without external audio assets.
- Linked BGM to gameplay, pause/results/background state and the saved sound toggle; clarified settings as “BGM · sound effects” (English translation of the UI label).
- Added desktop/touch signal-output and lifecycle tests plus audio-unavailable gameplay coverage.

## Share preview and favicon — 2026-10-19
- Added a Momo/dessert 1200×630 share card with static Open Graph and Twitter metadata, following CDXPilot0004.
- Added flower-logo SVG/ICO/32px PNG favicon and 180px Apple touch icon.
- Added reproducible branding build and local/hosted acceptance scripts.

## Staggered 3D difficulty update — 2026-10-19
- Replaced numeric layer badges with half-cell upper tiles centered over four supports, shaded covered tiles and 2.5D faces/sides/shadows.
- Added Easy/Normal/Hard with one/two/three floors, ten stages each and up to 18 distinct dessert symbols.
- Same-floor exposed matches use half-cell paths; lower floors do not obstruct upper routes. Preserved complete generation/shuffle solutions.
- Archived old records visibly in settings; v3 difficulty records remain separate. BGM, padding, sound and character preferences retained.
- Updated static share description/card to reflect Hard three-floor play.

## Mobile viewport fix — 2026-10-20
- Prevent mobile pinch/double-tap zoom while retaining single-finger scrolling and normal inputs.
- Fit tile geometry plus 12px exterior-effect clearance to the actual panel/visual viewport, fixing narrow hidden-character board overflow.
- Default new users to Normal; preserve saved difficulties and records.

## 2026-10-20 — Occupied seam routing fix
- Block routes that slipped between occupied tile rows/columns along half-cell boundaries. Preserve legitimate empty-cell/exterior routes, floor rules, saved settings and records.
- Add enclosed-pair rejection on all three floors, independent classic-path comparison and actual mouse/touch blocked-pair checks.

## 2026-10-20 — English documentation
- Translate README, the implementation plan, layered design and historical snapshot labels into English; identify the snapshot as a translation and retain its original in Git history.
- Require English for all future repository documentation. Correct stale README references to two-dimensional-only play and the old landscape dimensions. Runtime UI and assets are unchanged.

## 2026-10-20 — compact play area and uninterrupted popup music
- Move the introduction into the header/start card to raise the game and companion without reducing effect/corridor/character padding.
- Keep music playing through dialogs, including pause/results; resume from its saved position after mute/backgrounding instead of restarting the melody. Initial load stays silent.
- Reduce Challenge budgets by 15%/25%/30% for Easy/Normal/Hard, rounded to seconds with a 20-second floor. Preserve assist penalties and all existing records.

## 2026-10-20 — expanded puzzle edition
- Double occupied tile counts, keep layer supports and holes, and pan the board while retaining 44px minimum tile faces and fixed controls.
- Add six families × six shape/color variants, distribute symbols across families and preserve repeated pairs on compact boards.
- Prefer distant pair placement; score early/mid/late checkpoints across two legal-order policies when selecting seeded boards.
- Limit Challenge automatic recovery to one use costing 15 seconds/150 points. Further deadlocks require remaining manual shuffle or end the run.
- Preserve old records/settings in v4; separate expanded progression and scores. Keep character/effect/corridor padding, popup BGM and shortened Challenge-time multipliers.

## 2026-10-20 — whole-board horizontal overview
- Spread doubled tile counts horizontally with unchanged floor counts, family variants and Challenge limits.
- Widen desktop play space and fit the complete board above controls; remove board dragging and scrolling.
- Retain records, original character margins and continuous popup music. Compact portrait faces adapt below 44px to show the entire board.

## 2026-10-20 — connected floors and Challenge match bonuses
- Easy uses 4×6, Normal 6×6 and Hard 8×6 on desktop and mobile; upper floors form one connected pyramid.
- Challenge matches award +3/+2/+1.5 seconds respectively, capped at starting time; assist costs remain.
- Preserve previous records and preferences; track the new rules separately. Compact short-landscape controls retain the full six-row board.

## Game Hub return — 2026-10-20
- Added “게임 허브로” (Game Hub) links to the start card, pause dialog, victory and defeat results, opening https://hyangdan2.github.io/GameHub/ in the same tab.
- Pause explains that unfinished boards are lost when leaving while completed progress, best scores and settings remain. Existing resume controls allow staying in the run.
- Kept native keyboard/touch link behavior, visible focus, 44px targets and scrollable small-screen menus. Page hide pauses active play and stops music; Back restores a usable menu.
- Added focused navigation/paused-state/storage browser checks and a real hosted round-trip checker. See QA.md for executed checks and deployment status.

## Game Hub header placement — 2026-10-20
- Moved the initial-card Game Hub link to the top header beside settings. Compact phone spacing keeps the Korean label visible.
- During active play, the header action pauses the run and opens the existing exit warning; resume allows staying, and the dialog link completes navigation. Pause/result dialog links remain accessible while the header is inert.
