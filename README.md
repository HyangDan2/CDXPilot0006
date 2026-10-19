# ChibiLink · Momo's Little Café

A tile-matching puzzle for desktop and mobile browsers. Connect two matching desserts with a path that bends at most twice. Momo, an original chibi character, reacts to your play.

## Play

Public site: [Play ChibiLink](https://hyangdan2.github.io/CDXPilot0006/)

## Run locally

On this Mac, use the launcher even if the system Node version is outdated:

```sh
./scripts/dev-local.sh
```

Open the local address printed in the terminal. In a standard development environment, activate Node 24.19.0 and run:

```sh
npm ci
npm run dev
```

## Features

- Easy: one floor; Normal: two floors; Hard: three floors, with ten stages each
- Relaxed play and timed Challenge mode; Normal is the default for new users
- Matching tiles, at most two bends, exterior routes, combos and scoring
- Hints (H), shuffle (S), pause (P), restart and stage selection
- Touch, mouse and Tab/Enter controls; locally saved settings, progress and best scores
- Seeded generation with complete solution witnesses and automatic deadlock recovery
- Nine Momo expressions, image-load fallback, reduced motion, character visibility and music/sound settings
- Responsive boards: 6×6 desktop, 4×6 tall mobile, 4×4 short mobile and 6×4 short landscape

New games choose board dimensions for the current viewport. Extreme aspect-ratio changes during play preserve the existing arrangement and can shrink tile targets. Starting a new game selects dimensions for the new viewport.

## Verification

```sh
npx playwright install chromium
npm run verify
npm run test:e2e
```

Harness: [docs/HARNESS.md](docs/HARNESS.md). Results and unverified scope: [docs/QA.md](docs/QA.md).

Deployed character PNGs are 512×512 with at least 106px (20.7%) of transparent margin on every side, plus a separate 10% runtime inset. Source artwork and exact generation prompt: [art/PROMPTS.md](art/PROMPTS.md). Inspect all expressions at `/art-review.html`.

GitHub Actions verification and Pages deployment have completed. Desktop/mobile layouts and character padding have also been checked on the public site. Physical iPhone/Android devices, Safari and listening quality require separate verification. Local static builds are generated in `dist/`.

Current layered rules: [Stacked puzzle design](docs/STACKED_PUZZLE_PROPOSAL.md). Upper tiles sit at the center of four lower tiles; only exposed matching tiles on the same floor can connect. Occupied tile boundaries block routes, while lower floors do not obstruct an upper-floor route. Legacy records remain preserved.
