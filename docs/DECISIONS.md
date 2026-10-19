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
