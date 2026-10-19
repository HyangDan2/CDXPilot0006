import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const url =
  process.env.HOSTED_URL || "https://hyangdan2.github.io/CDXPilot0006/";
const evidenceDir = process.env.TIMING_EVIDENCE_DIR || "docs/hosted-evidence";
const browser = await chromium.launch();
const cases = [];
try {
  for (const mobile of [false, true])
    for (const mode of ["easy", "normal", "hard"]) {
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
      });
      const page = await context.newPage();
      await page.goto(url + "?test=1");
      await page.locator("#settings").click();
      await page.locator("#board-mode").selectOption(mode);
      await page.locator("#timed-setting").check();
      await page.locator("#settings-done").click();
      if (mobile) await page.locator("#start").tap();
      else await page.locator("#start").click();
      const state = await page.evaluate(() => window.__CHIBILINK__.snapshot());
      const count = state.board.tiles.filter((t) => t.value).length;
      const priorCount = mobile
        ? { easy: 22, normal: 38, hard: 44 }[mode]
        : { easy: 34, normal: 60, hard: 74 }[mode];
      assert.equal(
        count,
        priorCount * 2,
        "Expanded occupied count must double the preceding stage-one footprint",
      );
      const previous = Math.max(30, Math.round((count / 2) * (4.5 - 0.15) + 6));
      const expected = Math.max(
        20,
        Math.round(previous * { easy: 0.85, normal: 0.75, hard: 0.7 }[mode]),
      );
      assert.equal(state.remaining + state.elapsed, expected * 1000);
      const display = await page.locator("#time").textContent();
      const [m, s] = display.split(":").map(Number);
      assert(Math.abs(m * 60 + s - state.remaining / 1000) < 2);
      await page.locator("#how").click();
      const paused = await page.evaluate(() => window.__CHIBILINK__.snapshot());
      assert.equal(paused.status, "paused");
      await page.waitForTimeout(200);
      assert.equal(
        (await page.evaluate(() => window.__CHIBILINK__.snapshot())).elapsed,
        paused.elapsed,
      );
      cases.push({
        mobile,
        mode,
        stage: 1,
        tiles: count,
        previousSeconds: previous,
        expectedSeconds: expected,
        display,
      });
      await context.close();
    }
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(
    `${evidenceDir}/timing-report.json`,
    JSON.stringify(
      {
        url,
        checkedAt: new Date().toISOString(),
        browser: browser.version(),
        cases,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(cases));
  console.log(
    "PASS: target Challenge ratios, displayed countdown and popup timer pause, 3 difficulties × desktop/mobile.",
  );
} finally {
  await browser.close();
}
