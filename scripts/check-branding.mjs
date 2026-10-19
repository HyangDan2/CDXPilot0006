import fs from "node:fs/promises";
import assert from "node:assert/strict";
import sharp from "sharp";
const base = "https://hyangdan2.github.io/CDXPilot0006/";
const remote = process.argv.includes("--hosted");
const get = async (path) => {
  if (!remote)
    return fs.readFile(path === "index.html" ? path : "public/" + path);
  const response = await fetch(base + (path === "index.html" ? "" : path));
  assert(response.ok, `${path}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};
const html = (await get("index.html")).toString();
for (const marker of [
  "og:title",
  "og:description",
  "og:locale",
  "og:url",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "twitter:card",
  "twitter:image:alt",
])
  assert(html.includes(`"${marker}"`), marker);
assert(html.includes(base + "assets/branding/share-card-v2.png"));
assert(html.includes("summary_large_image"));
for (const [name, width, height] of [
  ["share-card-v2.png", 1200, 630],
  ["favicon-32.png", 32, 32],
  ["apple-touch-icon.png", 180, 180],
]) {
  const bytes = await get("assets/branding/" + name),
    meta = await sharp(bytes).metadata();
  assert.equal(meta.width, width);
  assert.equal(meta.height, height);
  if (remote)
    assert.deepEqual(
      bytes,
      await fs.readFile("public/assets/branding/" + name),
    );
  assert(html.includes(name));
}
const ico = await get("assets/branding/favicon.ico");
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 3);
for (let i = 0; i < 3; i++) {
  const p = 6 + i * 16,
    size = ico.readUInt32LE(p + 8),
    offset = ico.readUInt32LE(p + 12);
  const meta = await sharp(ico.subarray(offset, offset + size)).metadata();
  assert.equal(meta.width, [16, 32, 48][i]);
}
assert((await get("assets/branding/favicon.svg")).toString().includes("<svg"));
console.log(
  `PASS ${remote ? "hosted" : "local"}: social metadata, 1200×630 PNG, SVG/ICO/PNG favicons and Apple icon.`,
);
