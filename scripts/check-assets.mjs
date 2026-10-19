import sharp from "sharp";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const manifest = JSON.parse(
  await fs.readFile("public/assets/manifest.json", "utf8"),
);
assert.equal(manifest.frames.length, 9);
const results = [];
for (const f of manifest.frames) {
  const meta = await sharp("public/" + f.file).metadata();
  assert.equal(meta.width, 512);
  assert.equal(meta.height, 512);
  assert(meta.hasAlpha);
  const { data, info } = await sharp("public/" + f.file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = (threshold) => {
    let x0 = 512,
      y0 = 512,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++)
        if (data[(y * 512 + x) * info.channels + 3] > threshold) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    assert(x1 >= x0);
    return [x0, y0, 511 - x1, 511 - y1];
  };
  const alpha = bounds(0),
    substantial = bounds(32);
  assert(
    alpha.every((v) => v >= 102),
    `${f.name}: insufficient transparent padding ${alpha}`,
  );
  assert(f.origin.every((v) => v >= 0 && v <= 512));
  results.push({
    name: f.name,
    alphaMargins: alpha,
    substantialMargins: substantial,
  });
}
await fs.mkdir("test-results", { recursive: true });
await fs.writeFile(
  "test-results/asset-margins.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "PASS: 9 RGBA frames, >=20% transparent margins, dimensions and anchors",
  results,
);
