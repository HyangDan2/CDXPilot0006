import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
  ["mobile-small", 320, 568],
  ["landscape", 844, 390],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://127.0.0.1:5173/");
  await page.locator("#start").click();
  await page.locator("#mascot").evaluate((image) => image.decode());
  await page.screenshot({ path: `docs/screenshots/${name}.png` });
  await page.close();
}
await browser.close();
