# Character art pipeline

Status: nine generated expressions exported and inspected locally. Exact prompt and provenance: [art/PROMPTS.md](../art/PROMPTS.md).

## Provenance and replacement workflow
Preserve original reference/generated files and prompts separately from runtime exports. Use original or licensed art. Record generation/edit provenance, expression order, canvas dimensions, baseline/origin and runtime paths in a manifest.

Workflow: source + provenance → inspect → extract → normalize/pack → update manifest and renderer together → assets:check → model/verify → browser checks → inspect screenshots → record QA. Oversized frames fail packing rather than silently crop. Do not trim transparent borders or stretch poses independently. Keep sources, metadata and runtime exports in the same reviewed change.

## Padding specification
- RGBA transparent canvas. All hair, hands, clothes, props and authored shadows must fit inside the safe region.
- Minimum source target: 15% transparent margin on every side of each cell (central 70% artwork region). Generate at 20% per side (central 60%) when possible, following the stricter CDXPilot0004 repair prompt.
- This supersedes PLAN.md's initial 10% source-margin proposal. Runtime adds a separate 10% inset; it does not repair an already clipped source image.
- Put loose particles/glow in a separate bounded effects layer. Fixed cell dimensions, scale and shoulder/foot anchor apply across all expressions.
- Atlas cells require isolation and correct row/column metadata; inspect interpolation at actual display scales. Transparent atlas gutters must not contain neighboring fragments.

## Asset and visual acceptance
Measure per-frame nonzero-alpha bounds and substantial-art bounds (alpha >32); record all four margins. The declared transparent safe margin must be clear. Report faint stray alpha separately rather than treating alpha >32 as proof of full transparency. The older project's two-pixel substantial-art guard was a minimum regression detector, not this project's desired margin.

Validate decode, alpha, dimensions, frame order/count, nonempty content, anchor bounds, margins and manifest paths. Inspect every pose on checkerboard and dark backgrounds, at source size and actual thumbnail/mobile/desktop sizes. Check missing limbs, cut hair, stray text, neighbor contamination and consistency; numerical checks do not establish visual quality.

Runtime missing-image fallback must preserve layout and play. Release asset checks still fail for missing required files. Review both frozen animations for deterministic bounds and enabled maximum movement/shadows for actual clipping.


## Production exports
The untouched 1254×1254 generated sheet is retained in `art/source/momo-original.png`. Its cells do not uniformly satisfy the requested source margins; it is never consumed by the game. The deterministic packer extracts complete cells, uses one 300×300 scale, and surrounds each with 106px of clear alpha on a fixed 512×512 canvas. Exported assets meet >20% transparent margins independently of runtime CSS. Frame anchor (256,390) is shared; natural silhouette differences are not stretched away. Nine separate PNGs avoid runtime atlas interpolation into neighbors.

`npm run assets:check` measures alpha >0 and alpha >32 separately, validates 512×512 RGBA frames and anchors, and writes `test-results/asset-margins.json`. The raw source has faint alpha noise; complete cells are retained, and the added outer border is fully clear. Checkerboard/dark review found no visible detached fragments in normal display. The final `blink` frame is a wink.

Dessert icons are original inline SVG in `src/icons.ts`; they are not extracted or scraped assets. Audio is a short locally synthesized two-note match cue, without external recordings.
