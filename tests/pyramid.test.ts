import { it, expect } from "vitest";
import {
  generatePyramid,
  path,
  popTile,
  exposed,
  Game,
  remainingTiles,
  move,
  type Board,
  type Difficulty,
} from "../src/model";
import { read, recordWin, profile } from "../src/storage";
it("all difficulties have supported staggered layers and fully replayable solutions", () => {
  for (const mode of ["easy", "normal", "hard"] as Difficulty[])
    for (const [cols, rows] of [
      [4, 4],
      [4, 6],
      [6, 4],
      [6, 6],
    ])
      for (let stage = 1; stage <= 10; stage++)
        for (let seed = 1; seed <= 3; seed++) {
          const { board, witness } = generatePyramid(
            cols,
            rows,
            seed,
            stage,
            mode,
            seed === 1,
          );
          expect(Math.max(...board.tiles!.map((t) => t.z)) + 1).toBe(
            { easy: 1, normal: 2, hard: 3 }[mode],
          );
          for (const t of board.tiles!.filter((t) => t.z > 0)) {
            expect(
              board.tiles!.filter(
                (p) =>
                  p.z === t.z - 1 &&
                  Math.abs(p.x - t.x) === 0.5 &&
                  Math.abs(p.y - t.y) === 0.5,
              ),
            ).toHaveLength(4);
            expect(exposed(board, t)).toBe(
              !board.tiles!.some(
                (p) =>
                  p.z > t.z &&
                  Math.abs(p.x - t.x) < 1 &&
                  Math.abs(p.y - t.y) < 1,
              ),
            );
          }
          for (const pair of witness) {
            expect(path(board, ...pair)).not.toBeNull();
            pair.forEach((p) => popTile(board, p));
          }
          expect(remainingTiles(board)).toBe(0);
        }
}, 30000);
it("blocked lower input cannot select or score, cross-layer matches are rejected", () => {
  const g = new Game(5, 1, false, () => 0, 4, 4, "hard", true);
  const covered = g.board.tiles!.find((t) => !exposed(g.board, t))!;
  expect(g.select(covered).kind).toBe("ignored");
  expect(g.selected).toBeNull();
  expect(g.score).toBe(0);
  const b: Board = {
    cols: 4,
    rows: 4,
    cells: [1, 1],
    tiles: [
      { x: 0, y: 0, z: 0, value: 1 },
      { x: 2.5, y: 2.5, z: 1, value: 1 },
    ],
  };
  expect(path(b, b.tiles![0], b.tiles![1])).toBeNull();
});
it("same/higher footprints block a route while lower tiles do not block its plane", () => {
  const b: Board = {
    cols: 4,
    rows: 4,
    cells: [],
    tiles: [
      { x: 0.5, y: 0.5, z: 1, value: 1 },
      { x: 2.5, y: 0.5, z: 1, value: 1 },
      { x: 1.5, y: 0.5, z: 0, value: 2 },
    ],
  };
  expect(path(b, b.tiles![0], b.tiles![1])!.every((p) => p.y === 0.5)).toBe(
    true,
  );
  b.tiles![2].z = 1;
  expect(path(b, b.tiles![0], b.tiles![1])!.some((p) => p.y !== 0.5)).toBe(
    true,
  );
});
it("partial-board shuffles retain positions and per-floor symbols; complete through commands", () => {
  for (const mode of ["easy", "normal", "hard"] as Difficulty[]) {
    const g = new Game(8, 4, false, () => 0, 6, 6, mode, true);
    for (let i = 0; i < 4; i++) {
      const pair = move(g.board)!;
      g.select(pair[0]);
      expect(g.select(pair[1]).kind).toBe("match");
    }
    const before = g.board
      .tiles!.map((t) => `${t.x},${t.y},${t.z},${!!t.value}`)
      .sort();
    const values = g.board.tiles!.map((t) => `${t.z}:${t.value}`).sort();
    expect(g.shuffle()).toBe(true);
    expect(
      g.board.tiles!.map((t) => `${t.x},${t.y},${t.z},${!!t.value}`).sort(),
    ).toEqual(before);
    expect(g.board.tiles!.map((t) => `${t.z}:${t.value}`).sort()).toEqual(
      values,
    );
    for (const pair of g.witness) {
      g.select(pair[0]);
      expect(g.select(pair[1]).kind).toBe("match");
    }
    expect(g.status).toBe("won");
    const score = g.score;
    g.select({ x: 0, y: 0 });
    expect(g.score).toBe(score);
  }
});
it("more difficult stages introduce additional distinct symbols", () => {
  const counts = (["easy", "normal", "hard"] as Difficulty[]).map(
    (mode) =>
      new Set(
        generatePyramid(6, 6, 7, 10, mode, false).board.tiles!.map(
          (t) => t.value,
        ),
      ).size,
  );
  expect(counts).toEqual([8, 12, 18]);
});
it("version 2 records remain intact and separate from new difficulty records", () => {
  const old = {
    version: 2,
    stage: 8,
    best: 9000,
    boardMode: "layered",
    muted: true,
    records: {
      "classic-relaxed": { stage: 8, best: 9000 },
      "layered-challenge": { stage: 5, best: 7000 },
    },
  };
  const p = read({ getItem: () => JSON.stringify(old) }).data;
  expect(p.version).toBe(3);
  expect(p.boardMode).toBe("normal");
  expect(p.muted).toBe(true);
  expect(p.records).toEqual(old.records);
  recordWin(p, "hard", true, 1, 1400);
  expect(p.records["layered-challenge"]).toEqual(
    old.records["layered-challenge"],
  );
  expect(profile(p, "hard", true)).toEqual({ stage: 2, best: 1400 });
  expect(profile(p, "easy", false).stage).toBe(1);
  expect(read({ getItem: () => JSON.stringify(p) }).data).toEqual(p);
});

it("Normal default does not overwrite saved difficulty, settings or records", () => {
  expect(read({ getItem: () => null }).data.boardMode).toBe("normal");
  for (const mode of ["easy", "normal", "hard", "classic", "layered"]) {
    const saved = {
      version: 3,
      boardMode: mode,
      muted: true,
      character: false,
      motion: false,
      records: { "easy-relaxed": { stage: 6, best: 1200 } },
    };
    const p = read({ getItem: () => JSON.stringify(saved) }).data;
    expect(p.boardMode).toBe(
      mode === "classic" ? "easy" : mode === "layered" ? "normal" : mode,
    );
    expect(p.records).toEqual(saved.records);
    expect(p.muted).toBe(true);
    expect(p.character).toBe(false);
    expect(p.motion).toBe(false);
  }
  expect(
    read({ getItem: () => JSON.stringify({ version: 3, records: {} }) }).data
      .boardMode,
  ).toBe("normal");
});

it("rejects seam shortcuts between occupied tiles on every floor", () => {
  for (const z of [0, 1, 2]) {
    const tiles = Array.from({ length: 25 }, (_, i) => ({
      x: (i % 5) + z / 2,
      y: Math.floor(i / 5) + z / 2,
      z,
      value: i === 11 || i === 13 ? 1 : 2,
    }));
    const b: Board = {
      cols: 7,
      rows: 7,
      cells: tiles.map((t) => t.value),
      tiles,
    };
    expect(path(b, tiles[11], tiles[13])).toBeNull();
    const g = new Game(1, 1, false, () => 0, 4, 4, "normal", true);
    g.board = b;
    g.select(tiles[11]);
    expect(g.select(tiles[13]).kind).toBe("invalid");
    expect(g.score).toBe(0);
    expect(remainingTiles(b)).toBe(25);
    // A whole empty row is a real corridor, unlike the seam between rows.
    for (let i = 5; i < 10; i++) popTile(b, tiles[i]);
    expect(path(b, tiles[11], tiles[13])).not.toBeNull();
  }
});

it("matches classic corridor legality for isolated floors, including holes and all directions", () => {
  let seed = 714;
  for (let sample = 0; sample < 50; sample++) {
    const cells = Array.from({ length: 16 }, () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % 3;
    });
    const classic: Board = { cols: 4, rows: 4, cells };
    const tiles = cells.map((value, i) => ({
      x: i % 4,
      y: Math.floor(i / 4),
      z: 0,
      value,
    }));
    const spatial: Board = { ...classic, tiles };
    for (let a = 0; a < 16; a++)
      for (let b = a + 1; b < 16; b++) {
        expect(!!path(spatial, tiles[a], tiles[b])).toBe(
          !!path(classic, tiles[a], tiles[b]),
        );
      }
  }
});

it("shortens Challenge budgets by difficulty while preserving relaxed budgets and penalties", () => {
  for (const mode of ["easy", "normal", "hard"] as const)
    for (const stage of [1, 5, 10]) {
      const g = new Game(17, stage, true, () => 0, 4, 4, mode, true);
      const base = Math.max(
        30,
        Math.round(
          (g.initialTiles / 2) * Math.max(2.8, 4.5 - stage * 0.15) + 6,
        ),
      );
      expect(g.limit).toBe(
        Math.max(
          20,
          Math.round(base * { easy: 0.85, normal: 0.75, hard: 0.7 }[mode]),
        ) * 1000,
      );
      g.timed = false;
      expect(g.limit).toBe(base * 1000);
      g.timed = true;
      const before = g.remaining;
      g.hint();
      expect(g.remaining).toBe(Math.max(0, before - 8000));
      g.shuffle();
      expect(g.remaining).toBe(Math.max(0, before - 20000));
    }
});
