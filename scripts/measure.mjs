import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [620, 800],
  [844, 390],
  [1440, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:5173/?test=1");
  await page.locator("#start").click();
  console.log(
    width,
    height,
    await page.evaluate(() =>
      Object.fromEntries(
        [
          ".topbar",
          ".page-heading",
          ".companion",
          ".game-top",
          ".stats",
          ".board-area",
          "#board",
          ".board-bottom",
          ".controls",
        ].map((s) => {
          const r = document.querySelector(s).getBoundingClientRect();
          return [s, [r.y, r.height, r.bottom]];
        }),
      ),
    ),
  );
  await page.close();
}
await browser.close();
