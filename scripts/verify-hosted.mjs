import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import sharp from "sharp";
const url =
  process.env.HOSTED_URL || "https://hyangdan2.github.io/CDXPilot0006/";
const dir = "docs/hosted-evidence";
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const report = {
  url,
  browser: browser.version(),
  checkedAt: new Date().toISOString(),
  assets: [],
  viewports: [],
  physicalDevices: false,
};
try {
  const api = await browser.newContext();
  const manifest = await (
    await api.request.get(url + "assets/manifest.json")
  ).json();
  for (const frame of manifest.frames) {
    const response = await api.request.get(url + frame.file);
    assert(response.ok());
    const bytes = await response.body();
    const local = await fs.readFile("public/" + frame.file);
    const digest = (b) => crypto.createHash("sha256").update(b).digest("hex");
    assert.equal(digest(bytes), digest(local));
    const { data, info } = await sharp(bytes)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let x0 = info.width,
      y0 = info.height,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (data[(y * info.width + x) * 4 + 3]) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    const margins = [x0, y0, info.width - 1 - x1, info.height - 1 - y1];
    assert(margins.every((m) => m >= 106));
    report.assets.push({ name: frame.name, sha256: digest(bytes), margins });
  }
  await api.close();
  for (const mode of ["easy", "normal", "hard"])
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [620, 800],
      [844, 390],
      [1440, 900],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: width <= 620,
        hasTouch: width <= 620,
      });
      const page = await context.newPage();
      const errors = [],
        failed = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("response", (r) => {
        if (r.status() >= 400) failed.push([r.status(), r.url()]);
      });
      await page.goto(url, { waitUntil: "networkidle" });
      assert.equal(
        await page.evaluate(() => typeof window.__CHIBILINK__),
        "undefined",
      );
      await page.locator("#settings").click();
      await page.locator("#board-mode").selectOption(mode);
      await page.locator("#timed-setting").setChecked(mode !== "easy");
      await page.locator("#settings-done").click();
      await page.locator("#start").click();
      await page.locator("#mascot").evaluate((el) => el.decode());
      const bounds = await page.evaluate(() => {
        const c = document.querySelector(".controls").getBoundingClientRect(),
          b = document.querySelector("#board").getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          width: innerWidth,
          height: innerHeight,
          controlsBottom: c.bottom,
          boardLeft: b.left,
          boardRight: b.right,
        };
      });
      assert(bounds.scrollWidth <= width);
      assert(bounds.controlsBottom <= height);
      assert(bounds.boardLeft >= 0 && bounds.boardRight <= width);
      await page.screenshot({
        path: `${dir}/play-${mode}-${width}x${height}.png`,
      });
      // Use real hint and buttons on the normal deployed URL, without model fixtures.
      await page.locator("#hint").click();
      const hinted = await page
        .locator(".hinted")
        .evaluateAll((els) =>
          els.map((el) => ({
            x: el.dataset.x,
            y: el.dataset.y,
            z: el.dataset.z,
          })),
        );
      assert.equal(hinted.length, 2);
      for (const p of hinted) {
        const locator = page.locator(
          `.tile[data-x="${p.x}"][data-y="${p.y}"][data-z="${p.z}"]`,
        );
        if (width <= 620) await locator.tap();
        else await locator.click();
      }
      assert.notEqual(await page.locator("#score").textContent(), "0");
      await page.locator("#pause").click();
      assert(await page.locator("#dialog").isVisible());
      await page.locator("#resume").click();
      await page.goto(url + "?test=1", { waitUntil: "networkidle" });
      await page.locator("#start").click();
      for (const expression of manifest.frames.map((f) => f.name)) {
        await page.evaluate(
          (n) => window.__CHIBILINK__.expression(n),
          expression,
        );
        await page.locator("#mascot").evaluate(async (el) => {
          await el.decode();
          for (const a of el.getAnimations()) {
            a.pause();
            const duration = a.effect.getTiming().duration;
            a.currentTime = typeof duration === "number" ? duration / 2 : 0;
          }
        });
        const valid = await page.evaluate(() => {
          const f = document.querySelector(".mascot-frame"),
            r = f.getBoundingClientRect(),
            img = document.querySelector("#mascot"),
            b = img.getBoundingClientRect();
          return (
            !img.hidden &&
            getComputedStyle(f).position === "relative" &&
            f.querySelectorAll(".mascot-sprite").length === 1 &&
            b.left >= r.left &&
            b.top >= r.top &&
            b.right <= r.right &&
            b.bottom <= r.bottom
          );
        });
        assert(valid, `${width} ${expression} containment`);
      }
      await page.screenshot({
        path: `${dir}/expressions-${mode}-${width}x${height}.png`,
      });
      assert.deepEqual(errors, []);
      assert.deepEqual(failed, []);
      report.viewports.push({
        mode,
        challenge: mode !== "easy",
        width,
        height,
        bounds,
        expressions: 9,
        normalUrlInput: "pass",
        consoleErrors: errors,
        failedResponses: failed,
      });
      await context.close();
    }
  await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
  console.log(
    "PASS: live Pages, 3 difficulties × 6 viewports, 9 expressions per viewport, actual match inputs, 9 identical PNGs with >=106px margins.",
  );
} finally {
  await browser.close();
}
