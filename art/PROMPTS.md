# Momo generation provenance

Generated 2026-10-19 using the built-in image_gen tool with transparent_background=true. No CLI/API fallback was used.

The untouched output is preserved at `art/source/momo-original.png`. Production exports are `public/assets/momo-*.png`; their manifest records the nine-cell order. The raw generated margins were nonuniform, so the packer uniformly scales each complete cell into a 300×300 region inside a 512×512 transparent canvas, leaving 106 pixels on all sides. It does not repaint or discard alpha. No source cell is used directly at runtime.

## Exact prompt

Use case: stylized-concept. Asset type: production transparent character expression sheet for ChibiLink cozy dessert matching puzzle. Create a square RGBA sprite atlas with EXACTLY 3 columns x 3 rows of the SAME original Japanese anime chibi cafe girl, soft lilac bob hair with tiny strawberry clip, violet eyes, cream blouse and rose pink pinafore apron. Beautiful polished gentle anime game art, crisp linework, warm pastel shading. Waist-up chibi portraits, identical head scale, identical shoulder baseline and exact cell centers. Row-major expressions: 1 neutral welcoming smile, 2 excited eyes sparkling with hands near cheeks, 3 pleased closed-eye smile, 4 puzzled head tilt, 5 concerned, 6 sad but kind, 7 clear celebration with raised hands, 8 determined ready, 9 blink. CRITICAL each entire portrait INCLUDING all hair and hands fits ONLY inside central 60 percent width and height of its own equal cell, leaving at least 20 percent completely transparent empty margin on EACH of four sides. Large intentional empty transparent gutters. No drawing crosses cell bounds. No loose particles or glow. No labels, typography, lines, frames, background, watermark. True transparent alpha, opaque character interiors. All nine separated portraits fully visible. Canvas square.

## Inspection

Nine waist-up poses were inspected on checkerboard and dark backgrounds. No visible cut hair/hands or neighboring portraits in exported cells. The final expression is a wink rather than both eyes closed; the stable internal key remains `blink`. Slight pose-specific silhouette variation is inherent to the generated art; exports retain uniform scale and a shared frame anchor, without stretching individual poses.
