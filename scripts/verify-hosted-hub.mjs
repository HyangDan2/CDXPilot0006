import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const gameUrl = "https://hyangdan2.github.io/CDXPilot0006/";
const hubUrl = "https://hyangdan2.github.io/GameHub/";
const dir = "docs/hosted-evidence/gamehub";
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch();
const report = {
  gameUrl,
  hubUrl,
  checkedAt: new Date().toISOString(),
  browser: browser.version(),
  physicalDevices: false,
  interceptedNavigation: false,
  bundles: [],
  cases: [],
};
try {
  const api = await browser.newContext();
  const html = await (await api.request.get(gameUrl)).text();
  const localHtml = await fs.readFile("dist/index.html", "utf8");
  for (const file of localHtml.matchAll(
    /(?:src|href)="(\.\/assets\/index-[^\"]+\.(?:js|css))"/g,
  )) {
    assert(html.includes(file[1]), `Deployed HTML must load ${file[1]}`);
    const response = await api.request.get(new URL(file[1], gameUrl).href);
    assert(response.ok());
    const bytes = await response.body();
    assert(bytes.equals(await fs.readFile(path.join("dist", file[1]))));
    report.bundles.push({
      file: file[1],
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    });
  }
  assert.equal(report.bundles.length, 2);
  await api.close();
  for (const [width, height] of [
    [1440, 900],
    [320, 568],
    [844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width !== 1440,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const surface of ["title", "pause"]) {
      await page.goto(gameUrl);
      await expect(page.locator("#start")).toBeVisible();
      if (surface === "pause") {
        await page.locator("#settings").click();
        await page.locator("#timed-setting").check();
        await page.locator("#settings-done").click();
        await page.locator("#start").click();
        await page.locator("#hub-return").click();
        await expect(page.locator("#hub-warning")).toBeVisible();
      }
      const menu = page.locator(
        surface === "title" ? ".header-right" : "#dialog",
      );
      const link = menu.getByRole("link", { name: "게임 허브로" });
      await expect(link).toHaveAttribute("href", hubUrl);
      const storage = await page.evaluate(() => {
        localStorage.setItem("other-game.hub-qa", "preserve");
        return localStorage.getItem("chibilink.v1");
      });
      await link.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${dir}/${surface}-${width}x${height}.png`,
      });
      if (width === 1440) {
        await link.focus();
        await page.keyboard.press("Enter");
      } else await link.tap();
      await expect(page).toHaveURL(hubUrl);
      await expect(page.locator(".brand")).toContainText("GameHub");
      const reopen = page.locator(`a[href="${gameUrl}"]`);
      await expect(reopen).toBeVisible();
      assert.equal(context.pages().length, 1);
      const hubTitle = await page.title();
      await page.goBack();
      await expect(page.locator("#app")).toBeVisible();
      const restored = await page.evaluate(() => ({
        record: localStorage.getItem("chibilink.v1"),
        other: localStorage.getItem("other-game.hub-qa"),
        freshMenu: !document.querySelector("#cover").hidden,
        pausedMenu: !!document.querySelector("#resume"),
      }));
      assert.equal(restored.record, storage);
      assert.equal(restored.other, "preserve");
      assert(restored.freshMenu || restored.pausedMenu);
      await page.goForward();
      await expect(page).toHaveURL(hubUrl);
      await page.locator(`a[href="${gameUrl}"]`).click();
      await expect(page).toHaveURL(gameUrl);
      await expect(page.locator("#start")).toBeVisible();
      await expect(page.locator("#hub-return")).toHaveAttribute("href", hubUrl);
      assert.equal(context.pages().length, 1);
      report.cases.push({
        width,
        height,
        surface,
        hubTitle,
        back: restored,
        reopenedUrl: page.url(),
        errors: [...errors],
      });
      assert.deepEqual(errors, []);
    }
    await context.close();
  }
  await fs.writeFile(
    `${dir}/report.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `PASS: ${report.cases.length} real same-tab hub round trips; deployed JS/CSS match dist. Report: ${dir}/report.json`,
  );
} finally {
  await browser.close();
}
