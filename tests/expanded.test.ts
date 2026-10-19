import { it, expect } from "vitest";
import {
  generateExpanded,
  generatePyramid,
  path,
  popTile,
  remainingTiles,
  Game,
  progressionCost,
  rearrangePyramid,
} from "../src/model";
import { read, profile, recordWin } from "../src/storage";
import { names, icon } from "../src/icons";
it("doubles every footprint exactly and retains full supported solutions", () => {
  for (const mode of ["easy", "normal", "hard"] as const)
    for (const [cols, rows] of [
      [4, 4],
      [4, 6],
      [6, 4],
      [6, 6],
    ])
      for (const stage of [1, 5, 10]) {
        const old = generatePyramid(cols, rows, 3, stage, mode, false);
        const { board, witness } = generateExpanded(
          cols,
          rows,
          3,
          stage,
          mode,
          true,
        );
        expect(remainingTiles(board)).toBe(2 * remainingTiles(old.board));
        for (const t of board.tiles!.filter((t) => t.z > 0))
          expect(
            board.tiles!.filter(
              (p) =>
                p.z === t.z - 1 &&
                Math.abs(p.x - t.x) === 0.5 &&
                Math.abs(p.y - t.y) === 0.5,
            ),
          ).toHaveLength(4);
        for (const pair of witness) {
          expect(path(board, ...pair)).not.toBeNull();
          pair.forEach((p) => popTile(board, p));
        }
        expect(remainingTiles(board)).toBe(0);
      }
}, 120000);
it("selects no easier checkpoint score than its first candidate", () => {
  const best = generateExpanded(4, 6, 7, 5, "normal", true);
  const first = rearrangePyramid(best.board, 7, true);
  expect(progressionCost(best.board, best.witness)).toBeLessThanOrEqual(
    progressionCost(first.board, first.witness),
  );
});
it("has 36 distinct family/variant symbols", () => {
  expect(new Set(names).size).toBe(36);
  expect(new Set(Array.from({ length: 36 }, (_, i) => icon(i + 1))).size).toBe(
    36,
  );
});
it("preserves prior difficulty records and saves expanded records separately", () => {
  const previous = {
    version: 3,
    boardMode: "hard",
    muted: true,
    records: { "hard-challenge": { stage: 8, best: 9000 } },
  };
  const p = read({ getItem: () => JSON.stringify(previous) }).data;
  expect(p.records["hard-challenge"]).toEqual(
    previous.records["hard-challenge"],
  );
  expect(profile(p, "hard", true)).toEqual({ stage: 1, best: 0 });
  recordWin(p, "hard", true, 1, 300);
  expect(p.records["hard-challenge"].best).toBe(9000);
  expect(
    profile(read({ getItem: () => JSON.stringify(p) }).data, "hard", true),
  ).toEqual({ stage: 2, best: 300 });
});
it("limits Challenge recovery to once with time and score costs, preserves manual shuffle", () => {
  const g = new Game(7, 1, true, () => 0, 4, 4, "easy", true, true);
  g.score = 500;
  const before = g.remaining;
  expect(g.shuffle(true)).toBe(true);
  expect(g.recoveries).toBe(1);
  expect(g.score).toBe(350);
  expect(g.remaining).toBe(before - 15000);
  expect(g.shuffle(true)).toBe(false);
  expect(g.recoveries).toBe(1);
  expect(g.shuffles).toBe(0);
  expect(g.shuffle()).toBe(true);
  expect(g.shuffle()).toBe(false);
  const relaxed = new Game(7, 1, false, () => 0, 4, 4, "easy", true, true);
  expect(relaxed.shuffle(true)).toBe(true);
  expect(relaxed.shuffle(true)).toBe(true);
});
it("reduces aggregate early/mid/late easy-match cost versus random pairing", () => {
  let tuned = 0,
    baseline = 0;
  for (const seed of [2, 7, 13]) {
    const selected = generateExpanded(4, 6, seed, 5, "normal", true);
    tuned += progressionCost(selected.board, selected.witness);
    const random = rearrangePyramid(selected.board, seed, false);
    baseline += progressionCost(random.board, random.witness);
  }
  expect(tuned).toBeLessThan(baseline);
});

it("waits for remaining manual shuffle at a deadlock, then ends when both resources are exhausted", () => {
  for (const manualUsed of [0, 1]) {
    const g = new Game(2, 1, true, () => 0, 4, 4, "easy", true, true);
    // Enclosed identical pair; all other values are distinct blockers.
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      x: i % 5,
      y: Math.floor(i / 5),
      z: 0,
      value: i === 11 || i === 13 ? 1 : i + 2,
    }));
    tiles.push(
      { x: 0, y: 6, z: 0, value: 36 },
      { x: 1, y: 6, z: 0, value: 36 },
    );
    g.board = { cols: 5, rows: 7, tiles, cells: tiles.map((t) => t.value) };
    g.recoveries = 1;
    g.shuffles = manualUsed;
    g.select(tiles[25]);
    expect(g.select(tiles[26]).kind).toBe("match");
    expect(g.recoveries).toBe(1);
    expect(g.status).toBe(manualUsed ? "lost" : "playing");
    expect(g.blockedOut).toBe(!!manualUsed);
  }
});
