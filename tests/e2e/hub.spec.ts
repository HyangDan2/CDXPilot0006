import { test, expect } from "@playwright/test";

const HUB = "https://hyangdan2.github.io/GameHub/";
const entry = process.env.HUB_QA_URL ?? "http://127.0.0.1:4173/CDXPilot0006/";
for (const [width, height] of [
  [1440, 900],
  [320, 568],
  [844, 390],
]) {
  test(`Game Hub menus and same-tab navigation ${width}x${height}`, async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width !== 1440,
    });
    const page = await context.newPage();
    let navigations = 0;
    await page.route(HUB, async (route) => {
      navigations++;
      await route.fulfill({
        contentType: "text/html",
        body: "<h1>Intercepted Game Hub</h1>",
      });
    });
    await page.goto(`${entry}?test=1&returnUrl=https://example.com/`);
    for (const screen of ["title", "pause", "won", "lost"]) {
      if (screen === "pause") {
        await page.locator("#settings").click();
        await page.locator("#timed-setting").check();
        await page.locator("#settings-done").click();
        await page.locator("#start").click();
        const headerLink = page.locator("#hub-return");
        await expect(headerLink).toBeVisible();
        const settingsBox = (await page.locator("#settings").boundingBox())!;
        const hubBox = (await headerLink.boundingBox())!;
        expect(hubBox.x).toBeGreaterThanOrEqual(
          settingsBox.x + settingsBox.width,
        );
        expect(hubBox.x + hubBox.width).toBeLessThanOrEqual(width);
        if (width === 1440) await headerLink.click();
        else await headerLink.tap();
        expect(navigations).toBe(1);
        const before = await page.evaluate(() =>
          window.__CHIBILINK__.snapshot(),
        );
        await page.keyboard.press("h");
        await page.keyboard.press("s");
        await page.waitForTimeout(350);
        expect(
          await page.evaluate(() => window.__CHIBILINK__.snapshot()),
        ).toEqual(before);
        await expect(page.locator("#hub-warning")).toContainText(
          "보드는 저장되지 않아요",
        );
        // Choosing to stay uses the existing resume action and usable focus.
        await page.locator("#resume").focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#dialog")).not.toBeVisible();
        expect(
          await page.evaluate(() => window.__CHIBILINK__.snapshot().status),
        ).toBe("playing");
        await page.locator("#pause").click();
      } else if (screen === "won" || screen === "lost") {
        await page.evaluate(
          (name) => window.__CHIBILINK__.fixture(name),
          screen,
        );
      }
      const surface =
        screen === "title"
          ? page.locator(".header-right")
          : page.locator("#dialog");
      const link = surface.getByRole("link", { name: "게임 허브로" });
      if (screen === "title")
        await expect(page.locator("#cover .hub-link")).toHaveCount(0);
      await expect(link).toHaveAttribute("href", HUB);
      expect(await link.getAttribute("target")).toBeNull();
      await link.scrollIntoViewIfNeeded();
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      await page.screenshot({ path: info.outputPath(`${screen}.png`) });
      const stored = await page.evaluate(() =>
        localStorage.getItem("chibilink.v1"),
      );
      if (screen === "won")
        expect(
          JSON.parse(stored!).records["unified-normal-challenge"].stage,
        ).toBe(2);
      if (width === 1440) {
        await link.focus();
        await page.keyboard.press("Enter");
      } else await link.tap();
      await expect(page).toHaveURL(HUB);
      expect(context.pages()).toHaveLength(1);
      expect(navigations).toBe(
        ["title", "pause", "won", "lost"].indexOf(screen) + 1,
      );
      await page.goBack();
      await expect(page.locator("#app")).toBeVisible();
      expect(
        await page.evaluate(() => localStorage.getItem("chibilink.v1")),
      ).toBe(stored);
      expect(
        await page.evaluate(() => window.__CHIBILINK__.music().playing),
      ).toBe(false);
      // Both a fresh document and BFCache restoration must remain usable.
      if (await page.locator("#dialog").isVisible())
        await page.locator(".dialog-close").click();
      if (await page.locator("#start").isVisible())
        await expect(page.locator("#start")).toBeEnabled();
    }
    await context.close();
  });
}
