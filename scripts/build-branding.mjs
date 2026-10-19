import fs from "node:fs/promises";
import sharp from "sharp";
import { chromium } from "@playwright/test";
const dir = "public/assets/branding";
await fs.mkdir(dir, { recursive: true });
const source = await fs.readFile("src/icons.ts", "utf8");
const flower = source.match(/export const flower =\s*'([^']+)'/)[1];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>치비링크 꽃</title><rect width="64" height="64" rx="15" fill="#faf6f1"/><g transform="translate(9 9) scale(1.44)" color="#b97890">${flower.replace(/<svg[^>]*>|<\/svg>/g, "")}</g></svg>`;
await fs.writeFile(`${dir}/favicon.svg`, svg);
for (const [name, size] of [
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
])
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`${dir}/${name}`);
const sizes = [16, 32, 48],
  pngs = await Promise.all(
    sizes.map((size) =>
      sharp(Buffer.from(svg)).resize(size, size).png().toBuffer(),
    ),
  );
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const p = 6 + i * 16;
  header[p] = sizes[i];
  header[p + 1] = sizes[i];
  header.writeUInt16LE(1, p + 4);
  header.writeUInt16LE(32, p + 6);
  header.writeUInt32LE(png.length, p + 8);
  header.writeUInt32LE(offset, p + 12);
  offset += png.length;
});
await fs.writeFile(`${dir}/favicon.ico`, Buffer.concat([header, ...pngs]));
const momo = (await fs.readFile("public/assets/momo-ready.png")).toString(
  "base64",
);
const shapes = [...source.matchAll(/^  '(<[^\n]+)',?$/gm)]
  .slice(0, 12)
  .map((m) => m[1]);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="ko"><meta charset="utf-8"><style>
 *{box-sizing:border-box}body{margin:0;background:#faf6f1;color:#554b4f;font-family:'Apple SD Gothic Neo','Noto Sans CJK KR',sans-serif}.card{width:1200px;height:630px;position:relative;overflow:hidden;padding:64px 74px;border:16px solid #f0e3e4}.brand{display:flex;align-items:center;gap:15px;font-size:36px;font-weight:800;letter-spacing:-1.5px}.brand svg{width:45px;color:#b97890}.tag{margin-top:42px;color:#a7778a;font-size:16px;font-weight:700;letter-spacing:3px}h1{font-size:66px;line-height:1.16;letter-spacing:-3px;margin:18px 0 22px}h1 span{color:#ad728d}.desc{font-size:23px;line-height:1.6;color:#8b7a80;margin:0}.pill{display:inline-block;margin-top:30px;border:1px solid #dbcfbf;background:#fffdf9;border-radius:30px;padding:12px 22px;font-size:18px;color:#7d8877}.orb{position:absolute;right:35px;top:72px;width:440px;height:440px;border-radius:50%;background:#efe0e7}.momo{position:absolute;right:-60px;top:-8px;width:650px;height:650px;object-fit:contain}.tile{position:absolute;width:88px;height:88px;border:1px solid #decec0;background:#fffdf9;border-radius:18px;box-shadow:0 7px #e7d7ce;padding:8px}.tile svg{width:100%;height:100%}.a{right:50px;top:68px;transform:rotate(12deg)}.b{right:416px;top:345px;transform:rotate(-12deg)}.caption{position:absolute;right:103px;bottom:62px;color:#9d7d8e;font-size:16px;letter-spacing:2px}
 </style><div class="card"><div class="orb"></div><div class="brand">${flower} chibilink</div><div class="tag">MOMO’S LITTLE CAFÉ</div><h1>작은 연결,<br><span>달콤한 휴식.</span></h1><p class="desc">모모와 함께하는 사천성 퍼즐<br>클래식부터 2층 레이어까지</p><div class="pill">PC · 모바일 &nbsp; / &nbsp; 산뜻한 BGM</div><img class="momo" src="data:image/png;base64,${momo}" alt=""><div class="tile a"><svg viewBox="0 0 52 52">${shapes[0]}</svg></div><div class="tile b"><svg viewBox="0 0 52 52">${shapes[2]}</svg></div><div class="caption">A LITTLE BREAK, A SWEET MATCH</div></div>`);
  await page.locator("img").evaluate((el) => el.decode());
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${dir}/share-card-v1.png` });
} finally {
  await browser.close();
}
console.log(
  "Branding: 1200×630 share card, SVG/ICO/32px favicon and 180px touch icon.",
);
