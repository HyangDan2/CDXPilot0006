import { it, expect } from "vitest";
import {
  Game,
  generatePuzzle,
  remainingTiles,
  popTile,
  path,
  rearrangeLayers,
} from "../src/model";
import { read, profile, recordWin } from "../src/storage";
it("replays complete witnesses for both modes, all stages and responsive geometries", () => {
  for (const mode of ["classic", "layered"] as const)
    for (const timed of [false, true])
      for (const [cols, rows] of [
        [6, 6],
        [4, 6],
        [4, 4],
        [6, 2],
      ])
        for (let stage = 1; stage <= (mode === "layered" ? 5 : 10); stage++)
          for (let seed = 1; seed <= 5; seed++) {
            const { board, witness } = generatePuzzle(
              cols,
              rows,
              seed,
              stage,
              mode,
              timed,
            );
            expect(board.mask.some((v) => !v)).toBe(true);
            expect(board.stacks?.every((s) => s.length <= 2) ?? true).toBe(
              true,
            );
            for (const pair of witness) {
              expect(path(board, ...pair)).not.toBeNull();
              pair.forEach((p) => popTile(board, p));
            }
            expect(remainingTiles(board)).toBe(0);
          }
}, 30000);
it("removes only exposed tiles and completes layered games through commands", () => {
  const g = new Game(7, 1, false, () => 0, 6, 6, "layered", true);
  const first = g.witness[0],
    before = remainingTiles(g.board);
  expect(g.board.stacks![first[0].y * 6 + first[0].x]).toHaveLength(2);
  g.select(first[0]);
  expect(g.select(first[1]).kind).toBe("match");
  expect(remainingTiles(g.board)).toBe(before - 2);
  expect(g.board.stacks![first[0].y * 6 + first[0].x]).toHaveLength(1);
  for (const pair of g.witness.slice(1)) {
    g.select(pair[0]);
    expect(g.select(pair[1]).kind).toBe("match");
  }
  expect(g.status).toBe("won");
  expect(g.pairs * 2).toBe(before);
});
it("layered shuffle preserves all remaining symbols and permanent gaps with a full solution", () => {
  const g = generatePuzzle(6, 6, 19, 3, "layered", false);
  g.witness
    .slice(0, 3)
    .flat()
    .forEach((p) => popTile(g.board, p));
  const symbols = g.board.stacks.flat().sort();
  const shuffled = rearrangeLayers(g.board, 900);
  expect(shuffled.board.stacks.flat().sort()).toEqual(symbols);
  expect(shuffled.board.mask).toEqual(g.board.mask);
  shuffled.board.mask.forEach((v, i) => {
    if (!v) expect(shuffled.board.stacks[i]).toEqual([]);
  });
  for (const pair of shuffled.witness) {
    expect(path(shuffled.board, ...pair)).not.toBeNull();
    pair.forEach((p) => popTile(shuffled.board, p));
  }
  expect(remainingTiles(shuffled.board)).toBe(0);
});
it("challenge enforces assist quotas, penalties and terminal input", () => {
  const g = new Game(1, 1, true, () => 0, 6, 6, "layered", true);
  expect(g.limit).toBeLessThan(180000);
  expect(g.hint()).not.toBeNull();
  expect(g.elapsed).toBe(8000);
  g.hint();
  expect(g.hint()).toBeNull();
  expect(g.hintCount).toBe(2);
  expect(g.shuffle()).toBe(true);
  expect(g.elapsed).toBe(28000);
  expect(g.shuffle()).toBe(false);
  expect(g.shuffles).toBe(1);
  const expiring = new Game(1, 1, true, () => 0);
  expiring.elapsed = expiring.limit - 1000;
  expect(expiring.hint()).toBeNull();
  expect(expiring.status).toBe("lost");
  expect(expiring.shuffle()).toBe(false);
});
it("migrates old progress and isolates all four new record profiles", () => {
  const p = read({
    getItem: () =>
      JSON.stringify({ version: 1, stage: 8, best: 4200, timed: true }),
  }).data;
  expect(profile(p, "classic", false)).toEqual({ stage: 8, best: 4200 });
  expect(profile(p, "classic", true)).toEqual({ stage: 1, best: 0 });
  recordWin(p, "layered", true, 5, 6000);
  expect(profile(p, "layered", true)).toEqual({ stage: 5, best: 6000 });
  expect(profile(p, "classic", false).best).toBe(4200);
  expect(profile(p, "layered", false).stage).toBe(1);
  expect(read({ getItem: () => JSON.stringify(p) }).data).toEqual(p);
});
