import sharp from "sharp";
import fs from "node:fs/promises";
const source = "art/source/momo-original.png";
const { width, height } = await sharp(source).metadata();
const names = [
  "idle",
  "excited",
  "pleased",
  "puzzled",
  "worried",
  "sad",
  "clear",
  "ready",
  "blink",
];
const frames = [];
for (let i = 0; i < 9; i++) {
  const left = Math.round(((i % 3) * width) / 3),
    top = Math.round((Math.floor(i / 3) * height) / 3);
  const w = Math.round((((i % 3) + 1) * width) / 3) - left,
    h = Math.round(((Math.floor(i / 3) + 1) * height) / 3) - top;
  // Preserve complete original cells, alpha and a uniform scale; surround each with additional transparent space.
  const image = await sharp(source)
    .extract({ left, top, width: w, height: h })
    .resize(300, 300, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const file = `assets/momo-${names[i]}.png`;
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: image, left: 106, top: 106 }])
    .png()
    .toFile(`public/${file}`);
  frames.push({
    name: names[i],
    file,
    width: 512,
    height: 512,
    origin: [256, 390],
    sourceCell: i,
  });
}
await fs.writeFile(
  "public/assets/manifest.json",
  JSON.stringify(
    {
      version: 1,
      source,
      sourceGrid: [3, 3],
      runtimeInset: 0.1,
      minimumMargin: 0.2,
      frames,
    },
    null,
    2,
  ),
);
