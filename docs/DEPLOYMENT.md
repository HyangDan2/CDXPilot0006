# GitHub Pages deployment

Target repository: https://github.com/HyangDan2/CDXPilot0006
Expected project URL: https://hyangdan2.github.io/CDXPilot0006/

Publishing was authorized on 2026-10-19. Pages source is GitHub Actions. `.github/workflows/ci.yml` installs dependencies, runs verify and production E2E, then uploads only dist/. The deploy job depends on verification and runs only for main pushes/manual runs; pull requests never deploy. Pages write and ID-token permissions are scoped to deployment.

Production assets use relative Vite URLs. Local preview/E2E mounts at `/CDXPilot0006/`, including exact case. CI uses the Node 24 release line; local .nvmrc records the tested patch. Do not assume a local bundled runtime patch is already downloadable by setup-node.

Before release: inspect working changes, run npm ci, npm run verify and npm run test:e2e. Preserve original character art, manifest and alpha-margin checks. Push without force; inspect unexpected remote changes before merging.

After release: confirm the exact deployed commit and successful Actions jobs. Check the live URL, asset responses, actual pair input, PC/mobile viewports, all mascot expressions and maximum transforms. Record hosted QA separately from localhost and real hardware. Update docs/QA.md with evidence.

Rollback: revert the faulty change and push to main, allowing the same gates and deployment workflow to publish the previous known-good behavior. Do not bypass verification by uploading arbitrary local files.
