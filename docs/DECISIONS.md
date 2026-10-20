# Decisions and process provenance

## 2026-10-19 — Reuse the existing local process
Inspected the following local sources:

- [CDXPilot0004 contributor workflow](../../CDXPilot0004/AGENTS.md)
- [CDXPilot0004 harness](../../CDXPilot0004/docs/HARNESS.md)
- [CDXPilot0004 architecture: sprite isolation and result containing block](../../CDXPilot0004/docs/ARCHITECTURE.md)
- [CDXPilot0004 actual padding repair prompts](../../CDXPilot0004/assets/characters/padding-prompts.md)
- [CDXPilot0005 contributor contract](../../CDXPilot0005/AGENTS.md)
- [CDXPilot0005 phase gates](../../CDXPilot0005/docs/IMPLEMENTATION_PLAN.md)
- [CDXPilot0005 harness](../../CDXPilot0005/docs/HARNESS.md)
- [CDXPilot0005 art pipeline](../../CDXPilot0005/docs/ART_PIPELINE.md)
- [CDXPilot0005 maintenance](../../CDXPilot0005/docs/MAINTENANCE.md)

The LMPilot0002 slash-tool harness was also inspected; its Python tool registry and output-folder rules are specific to that application and do not apply to this web game.

Adopt the shared read/audit/plan/bounded-change/regression/verify/browser/visual-review/document/report workflow and failure gates. Preserve pure model ownership, original art, fixed transparent frames and honest evidence separation. Keep prior projects unchanged; instantiate these rules in CDXPilot0006.

## Padding correction
CDXPilot0004 requested 15% and 20% source margins, then used a separate 10% runtime inset because generated spacing was imperfect. Its result-layout defect required a positioned parent for the absolute sprite child. Adopt both safeguards and test them independently. Replace the earlier 10% source-margin proposal with minimum 15%, generation target 20%.

## Scope-specific adaptations
Retain verification process, not rhythm/action mechanics or old project permissions. Do not import HOLD rules, combat geometry, the rhythm game's 75:25 layout, global zoom restrictions or the action game's Phaser dependency. Proposed strict TypeScript/Vite tooling supports the existing verify/E2E gates; implementation has not started. Public deployment remains outside the current planning task.

## 2026-10-20 — horizontal overview supersedes panning
The user clarified that the doubled tiles should occupy unused horizontal space and remain visible together. Join supported footprints along x without an empty separator; keep the row count and exact occupied counts. This preserves the established rules, witnesses and records while widening the composition. Fit tile faces to both axes rather than forcing 44px and scrolling. The six-size regression minimum is 22px; this is an automated layout guard, not a physical-touch accessibility certification. Keep conservative 26px upper-effect bounds and increase independent clearance to 18px. Existing scroll assertions are replaced by explicit whole-board bounds and real-input checks because the approved interaction contract changed.

## 2026-10-20 — single pyramids and descending time bonuses
The user replaced doubling with fixed 4×6/6×6/8×6 base extents and one/two/three floors. Reuse supported single-pyramid geometry, then apply the expanded symbol/difficulty assignment without cloning. Preserve old generator regression coverage. Separate awarded time from elapsed time to avoid changing combo windows or pause clocks; clamp each award to room below the initial limit. V5 separates both relaxed and Challenge records because geometry changed in both.

## 2026-10-20 — Native Game Hub return links
Use one absolute HTTPS destination in the DOM composition module and ordinary same-tab anchors on existing start/pause/result surfaces. The existing Korean interface supplies the visible label. A clear pause-menu warning explains unfinished-board loss before activating the link; existing resume/close controls allow staying. This follows the guide's pause-explanation option without adding another dialog/focus state. Preserve synchronous result saves and storage namespaces. Page hide pauses active play and stops audio; history restoration stops audio while presenting a usable menu. Verify browser history and navigation separately from pure puzzle rules and hosted deployment separately from local navigation interception.

## 2026-10-20 — Header placement for Game Hub
Move the initial-card return action beside settings in the shared header. Keep the dialog actions because a modal dialog makes the header inert. During active play, the header anchor opens the existing paused exit menu before navigation; its warning and resume controls remain the exit convention. Compact the narrow header without adding a row or moving the board controls.
