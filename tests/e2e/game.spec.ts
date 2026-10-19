import { test, expect, type Page } from "@playwright/test";
type Point = { x: number; y: number };
type Snapshot = {
  board: { cols: number; rows: number; cells: number[] };
  status: string;
  score: number;
  elapsed: number;
  remaining: number;
  selected: Point | null;
  started: boolean;
};
declare global {
  interface Window {
    __CHIBILINK__: {
      music: () => {
        playing: boolean;
        state: string;
        rms: number;
        duration: number;
      };
      drawRoute: (route: Point[]) => void;
      snapshot: () => Snapshot;
      move: () => [Point, Point] | null;
      expression: (name: string) => void;
      fixture: (name: string) => void;
    };
  }
}
const tile = (page: Page, p: Point) =>
  page.locator(`.tile[data-x="${p.x}"][data-y="${p.y}"]`);
async function start(page: Page) {
  await page.goto("?test=1");
  await page.locator("#start").click();
}
async function match(page: Page) {
  const pair = await page.evaluate(() => window.__CHIBILINK__.move());
  expect(pair).not.toBeNull();
  for (const p of pair!) await tile(page, p).click();
}
test("real input playthrough, pause, hints, shuffle, result and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.keyboard.press("h");
  await expect(page.locator(".hinted")).toHaveCount(2);
  await match(page);
  await expect(page.locator("#score")).not.toHaveText("0");
  await page.keyboard.press("p");
  await expect(page.locator("#dialog")).toBeVisible();
  const frozen = await page.evaluate(
    () => window.__CHIBILINK__.snapshot().elapsed,
  );
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(() => window.__CHIBILINK__.snapshot().elapsed),
  ).toBe(frozen);
  await page.locator("#resume").click();
  await page.keyboard.press("s");
  for (let i = 0; i < 18; i++) {
    if (
      (await page.evaluate(() => window.__CHIBILINK__.snapshot().status)) ===
      "won"
    )
      break;
    await match(page);
  }
  await expect(page.locator("#dialog h2")).toHaveText("티타임 완성!");
  expect(
    await page.evaluate(() =>
      window.__CHIBILINK__.snapshot().board.cells.every((v) => v === 0),
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/result-desktop.png" });
  await page.locator("#next").click();
  await expect(page.locator(".stage-number")).toHaveText("02");
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("chibilink.v1")!).stage,
    ),
  ).toBe(2);
  expect(errors).toEqual([]);
});
for (const mode of ["classic", "layered"] as const)
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [390, 844],
    [620, 800],
    [844, 390],
    [1440, 900],
  ])
    test(`${mode} layout and all expressions ${width}x${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("?test=1");
      await page.locator("#settings").click();
      await page.locator("#board-mode").selectOption(mode);
      await page.locator("#settings-done").click();
      await page.screenshot({
        path: `test-results/menu-${mode}-${width}x${height}.png`,
      });
      await page.locator("#start").click();
      await expect(page.locator("#mascot")).toBeVisible();
      await page
        .locator("#mascot")
        .evaluate((el: HTMLImageElement) => el.decode());
      const geometry = await page.evaluate(() => {
        const b = document.querySelector("#board")!.getBoundingClientRect(),
          c = document.querySelector(".controls")!.getBoundingClientRect(),
          f = document.querySelector(".mascot-frame")!.getBoundingClientRect(),
          t = document.querySelector(".tile")!.getBoundingClientRect();
        return {
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
          board: { x: b.x, y: b.y, right: b.right, bottom: b.bottom },
          controls: { bottom: c.bottom },
          frame: { x: f.x, y: f.y, width: f.width, height: f.height },
          tile: { width: t.width, height: t.height },
          height: innerHeight,
        };
      });
      expect(geometry.scroll).toBeLessThanOrEqual(width);
      expect(geometry.board.x).toBeGreaterThanOrEqual(0);
      expect(geometry.board.right).toBeLessThanOrEqual(width);
      expect(geometry.controls.bottom).toBeLessThanOrEqual(height);
      expect(geometry.tile.width).toBeGreaterThanOrEqual(
        width === 844 ? 23 : 30,
      );
      for (const expression of [
        "idle",
        "excited",
        "pleased",
        "puzzled",
        "worried",
        "sad",
        "clear",
        "ready",
        "blink",
      ]) {
        await page.evaluate(
          (name) => window.__CHIBILINK__.expression(name),
          expression,
        );
        await page.locator("#mascot").evaluate(async (el: HTMLImageElement) => {
          await el.decode();
          for (const a of el.getAnimations()) {
            a.pause();
            const duration = a.effect?.getTiming().duration;
            a.currentTime = typeof duration === "number" ? duration / 2 : 0;
          }
        });
        const fit = await page.evaluate(() => {
          const f = document.querySelector(".mascot-frame")!,
            r = f.getBoundingClientRect(),
            i = document.querySelector("#mascot")!.getBoundingClientRect();
          return {
            position: getComputedStyle(f).position,
            count: f.querySelectorAll(".mascot-sprite").length,
            inside:
              i.left >= r.left &&
              i.top >= r.top &&
              i.right <= r.right &&
              i.bottom <= r.bottom,
          };
        });
        expect(fit.position).toBe("relative");
        expect(fit.count).toBe(1);
        expect(fit.inside).toBe(true);
      }
      await page.evaluate(() => {
        const b = window.__CHIBILINK__.snapshot().board;
        window.__CHIBILINK__.drawRoute([
          { x: 0, y: 0 },
          { x: -1, y: 0 },
          { x: -1, y: -1 },
          { x: b.cols, y: -1 },
          { x: b.cols, y: b.rows },
          { x: -1, y: b.rows },
        ]);
      });
      const routeBounds = await page.locator("#route").evaluate((el) => {
        const r = el.getBoundingClientRect();
        const points = el
          .querySelector("polyline")!
          .getAttribute("points")!
          .split(" ")
          .map((s) => s.split(",").map(Number));
        return points.every(
          ([x, y]) => x >= 2 && y >= 2 && x <= r.width - 2 && y <= r.height - 2,
        );
      });
      expect(routeBounds).toBe(true);
      await page.screenshot({
        path: `test-results/route-${mode}-${width}x${height}.png`,
      });
      await page.evaluate(() => window.__CHIBILINK__.expression("idle"));
      await page.screenshot({
        path: `test-results/play-${mode}-${width}x${height}.png`,
      });
      await page.locator("#hint").click();
      const pair = await page.evaluate(() => window.__CHIBILINK__.move());
      for (const p of pair!) await tile(page, p).click();
      await page.locator("#pause").click();
      await page.screenshot({
        path: `test-results/pause-${mode}-${width}x${height}.png`,
      });
      await page.locator("#resume").click();
      await page.evaluate(() => window.__CHIBILINK__.fixture("won"));
      await page.screenshot({
        path: `test-results/result-${mode}-${width}x${height}.png`,
      });
      await expect(page.locator("#next")).toBeInViewport();
      await page.locator("#next").click();
      await page.evaluate(() => window.__CHIBILINK__.fixture("lost"));
      await expect(page.locator("#dialog h2")).toHaveText("시간이 다 되었어요");
    });
test("fallback with blocked PNGs and unavailable storage remains playable", async ({
  page,
}) => {
  await page.route("**/*.png", (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Unavailable");
      },
    });
  });
  await start(page);
  await expect(page.locator("#mascot-fallback")).toBeVisible();
  await match(page);
  await expect(page.locator("#score")).not.toHaveText("0");
  await page.locator("#settings").click();
  await page.locator("#settings-done").click();
  await expect(page.locator("#notice")).toContainText("저장");
});
test("settings, keyboard selection, reduced motion, resize and normal URL isolation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  const pair = await page.evaluate(() => window.__CHIBILINK__.move());
  await tile(page, pair![0]).focus();
  await page.keyboard.press("Enter");
  await tile(page, pair![1]).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#score")).not.toHaveText("0");
  expect(
    await page
      .locator("#mascot")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.locator("#settings").click();
  await page.locator("#character-setting").uncheck();
  await page.locator("#timed-setting").check();
  await page.locator("#settings-done").click();
  await expect(page.locator(".mascot-frame")).not.toBeVisible();
  await page.reload();
  await page.locator("#start").click();
  await expect(page.locator("#mode-label")).toContainText("도전");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#board")).toBeInViewport();
  await page.goto("./");
  expect(await page.evaluate(() => typeof window.__CHIBILINK__)).toBe(
    "undefined",
  );
});
test("nested static URLs have no failed assets and corrupt storage is recoverable", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  await page.addInitScript(() =>
    localStorage.setItem("chibilink.v1", "broken"),
  );
  await page.goto("./");
  await expect(page.locator("#notice")).toContainText("기본 설정");
  await page.locator("#start").click();
  await page.locator("#mascot").evaluate((el: HTMLImageElement) => el.decode());
  expect(failures).toEqual([]);
});

test("touch taps on a mobile browser connect a pair", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/CDXPilot0006/?test=1");
  await page.locator("#start").tap();
  const pair = await page.evaluate(() => window.__CHIBILINK__.move());
  for (const p of pair!) await tile(page, p).tap();
  await expect(page.locator("#score")).not.toHaveText("0");
  await page.screenshot({ path: "test-results/touch-390x844.png" });
  await context.close();
});

for (const timed of [false, true])
  test(`layered touch completion challenge=${timed}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/CDXPilot0006/?test=1");
    await page.locator("#settings").tap();
    await page.locator("#board-mode").selectOption("layered");
    await page.locator("#timed-setting").setChecked(timed);
    await page.locator("#settings-done").tap();
    await page.locator("#start").tap();
    await expect(page.locator(".stacked").first()).toBeVisible();
    await expect(page.locator(".gap-cell").first()).toBeDisabled();
    if (timed) {
      await page.locator("#hint").tap();
      await page.locator("#hint").tap();
      await expect(page.locator("#hint")).toBeDisabled();
      await page.locator("#shuffle").tap();
      await expect(page.locator("#shuffle")).toBeDisabled();
    }
    for (let i = 0; i < 40; i++) {
      if (
        (await page.evaluate(() => window.__CHIBILINK__.snapshot().status)) ===
        "won"
      )
        break;
      const pair = await page.evaluate(() => window.__CHIBILINK__.move());
      expect(pair).not.toBeNull();
      for (const p of pair!) await tile(page, p).tap();
    }
    await expect(page.locator("#dialog h2")).toHaveText("티타임 완성!");
    await context.close();
  });

for (const mobile of [false, true])
  test(`BGM audio output and lifecycle mobile=${mobile}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      hasTouch: mobile,
      isMobile: mobile,
    });
    const page = await context.newPage();
    await page.goto(
      (process.env.BGM_URL ?? "http://127.0.0.1:4173/CDXPilot0006/") +
        "?test=1",
    );
    const state = () => page.evaluate(() => window.__CHIBILINK__.music());
    expect((await state()).state).toBe("idle");
    if (mobile) await page.locator("#start").tap();
    else await page.locator("#start").click();
    await expect.poll(async () => (await state()).rms).toBeGreaterThan(0.001);
    expect((await state()).duration).toBeGreaterThan(30);
    await page.locator("#pause").click();
    await expect.poll(async () => (await state()).rms).toBeLessThan(0.00001);
    expect((await state()).playing).toBe(false);
    await page.locator("#resume").click();
    await expect.poll(async () => (await state()).rms).toBeGreaterThan(0.001);
    await page.locator("#sound").click();
    await expect.poll(async () => (await state()).rms).toBeLessThan(0.00001);
    await page.reload();
    await page.locator("#start").click();
    expect((await state()).state).toBe("idle");
    await page.locator("#sound").click();
    await expect.poll(async () => (await state()).rms).toBeGreaterThan(0.001);
    await page.evaluate(() => window.__CHIBILINK__.fixture("won"));
    await expect.poll(async () => (await state()).rms).toBeLessThan(0.00001);
    await context.close();
  });
test("audio unavailable does not block matching", async ({ page }) => {
  await page.addInitScript(() => {
    window.AudioContext = class {
      constructor() {
        throw Error("Unavailable");
      }
    } as unknown as typeof AudioContext;
  });
  await start(page);
  await match(page);
  await expect(page.locator("#score")).not.toHaveText("0");
});
