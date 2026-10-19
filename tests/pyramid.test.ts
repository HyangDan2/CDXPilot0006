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
