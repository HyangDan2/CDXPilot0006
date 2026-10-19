import { describe, it, expect } from "vitest";
import {
  path,
  generate,
  arrange,
  Game,
  move,
  index,
  type Board,
} from "../src/model";
import { read, save, defaults } from "../src/storage";
const board = (rows: number[][]): Board => ({
  cols: rows[0].length,
  rows: rows.length,
  cells: rows.flat(),
});
describe("path rules", () => {
  it("accepts zero, one and two bends", () => {
    expect(
      path(board([[1, 0, 1]]), { x: 0, y: 0 }, { x: 2, y: 0 }),
    ).toHaveLength(3);
    expect(
      path(
        board([
          [1, 0],
          [2, 1],
        ]),
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ),
    ).not.toBeNull();
    expect(
      path(
        board([
          [1, 2, 1],
          [2, 2, 2],
        ]),
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ),
    ).toContainEqual({ x: 0, y: -1 });
  });
  it("rejects same cell, different types, empty and out of bounds", () => {
    const b = board([[1, 2, 0]]);
    expect(path(b, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeNull();
    expect(path(b, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
    expect(path(b, { x: 2, y: 0 }, { x: 1, y: 0 })).toBeNull();
    expect(path(b, { x: -1, y: 0 }, { x: 0, y: 0 })).toBeNull();
  });
  it("rejects an enclosed pair that would need more than two turns", () => {
    const b = board([
      [2, 2, 2, 2, 2],
      [2, 1, 0, 2, 2],
      [2, 2, 0, 0, 2],
      [2, 2, 2, 1, 2],
      [2, 2, 2, 2, 2],
    ]);
    expect(path(b, { x: 1, y: 1 }, { x: 3, y: 3 })).toBeNull();
  });
  it("routes beyond all four edges", () => {
    for (const [b, a, z, exterior] of [
      [
        board([
          [1, 2, 1],
          [2, 2, 2],
        ]),
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { y: -1 },
      ],
      [
        board([
          [2, 2, 2],
          [1, 2, 1],
        ]),
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { y: 2 },
      ],
      [
        board([
          [1, 2],
          [2, 2],
          [1, 2],
        ]),
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: -1 },
      ],
      [
        board([
          [2, 1],
          [2, 2],
          [2, 1],
        ]),
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 2 },
      ],
    ] as const) {
      expect(
        path(b, a, z)?.some((p) =>
          Object.entries(exterior).every(([k, v]) => p[k as "x" | "y"] === v),
        ),
      ).toBe(true);
    }
  });
});
describe("generation and game", () => {
  it("generates reproducible fully solvable boards across 10 stages and 30 seeds", () => {
    for (let stage = 1; stage <= 10; stage++)
      for (let seed = 1; seed <= 30; seed++) {
        const cols = seed % 2 ? 4 : 6;
        const g = generate(cols, 6, seed, Math.min(stage + 6, 12));
        expect(g.board).toEqual(
          generate(cols, 6, seed, Math.min(stage + 6, 12)).board,
        );
        for (const [a, b] of g.witness) {
          expect(path(g.board, a, b)).not.toBeNull();
          g.board.cells[index(g.board, a)] = 0;
          g.board.cells[index(g.board, b)] = 0;
        }
        expect(g.board.cells.every((v) => v === 0)).toBe(true);
      }
  });
  it("preserves symbols and holes on shuffle and has full witness", () => {
    const original = board([
        [1, 0, 2, 2],
        [1, 3, 3, 0],
      ]),
      g = arrange(original, 77);
    expect([...g.board.cells].sort()).toEqual([...original.cells].sort());
    expect(g.board.cells[1]).toBe(0);
    for (const [a, b] of g.witness) {
      expect(path(g.board, a, b)).not.toBeNull();
      g.board.cells[index(g.board, a)] = g.board.cells[index(g.board, b)] = 0;
    }
  });
  it("completes via selections only and rejects duplicate scoring", () => {
    let now = 0;
    const g = new Game(731, 1, false, () => now);
    for (const [a, b] of g.witness) {
      now += 100;
      g.select(a);
      expect(g.select(b).kind).toBe("match");
    }
    expect(g.status).toBe("won");
    expect(g.pairs).toBe(18);
    const score = g.score;
    g.select({ x: 0, y: 0 });
    expect(g.score).toBe(score);
  });
  it("pauses clock, clears selection and expires exactly once", () => {
    let now = 0;
    const g = new Game(1, 1, true, () => now);
    g.select({ x: 0, y: 0 });
    now = 1000;
    g.pause();
    expect(g.selected).toBeNull();
    now = 9000;
    g.tick();
    expect(g.elapsed).toBe(1000);
    expect(g.select({ x: 1, y: 0 }).kind).toBe("ignored");
    g.resume();
    now += g.limit - 1000;
    g.tick();
    expect(g.status).toBe("lost");
    const elapsed = g.elapsed;
    now += 1000;
    g.tick();
    expect(g.elapsed).toBe(elapsed);
    expect(g.hint()).toBeNull();
  });
  it("automatically repairs a deadlock after a successful pair", () => {
    const g = new Game(1, 1, false, () => 0);
    g.board = board([
      [3, 3],
      [1, 2],
      [2, 1],
    ]);
    g.select({ x: 0, y: 0 });
    const r = g.select({ x: 1, y: 0 });
    expect(r.reshuffled).toBe(true);
    expect(g.shuffles).toBe(0);
    expect(g.recoveries).toBe(1);
    expect(move(g.board)).not.toBeNull();
  });
  it("hint is legal and shuffle/restart preserve model contracts", () => {
    const g = new Game(5, 3, false, () => 0);
    const p = g.hint()!;
    expect(path(g.board, ...p)).not.toBeNull();
    g.select(p[0]);
    g.shuffle();
    expect(g.selected).toBeNull();
    expect(move(g.board)).not.toBeNull();
    expect(new Game(5, 3, false, () => 0).score).toBe(0);
  });
});
describe("storage", () => {
  it("handles corruption, missing storage and bounded values", () => {
    expect(read({ getItem: () => "{" }).error).toBe(true);
    expect(
      read({
        getItem: () => {
          throw Error();
        },
      }).data,
    ).toEqual(defaults);
    expect(
      save(
        {
          setItem: () => {
            throw Error();
          },
        },
        defaults,
      ),
    ).toBe(false);
    expect(
      read({
        getItem: () => JSON.stringify({ ...defaults, stage: 999, best: -4 }),
      }).data.stage,
    ).toBe(10);
  });
});
