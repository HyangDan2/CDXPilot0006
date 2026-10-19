import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1040, height: 1200 } });
await page.goto("http://127.0.0.1:5173/art-review.html");
await page
  .locator("img")
  .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
await page.screenshot({
  path: "docs/screenshots/art-checkerboard.png",
  fullPage: true,
});
await page.locator("button").click();
await page.screenshot({
  path: "docs/screenshots/art-dark.png",
  fullPage: true,
});
await browser.close();
