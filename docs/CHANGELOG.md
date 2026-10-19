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
