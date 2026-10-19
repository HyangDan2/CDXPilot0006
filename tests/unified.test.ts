import { it, expect } from "vitest";
import { Game, path, popTile, remainingTiles } from "../src/model";
import { read, profile, recordWin } from "../src/storage";

it("builds fixed connected floors with four supports and complete solutions", () => {
  for (const mode of ["easy", "normal", "hard"] as const)
    for (let stage = 1; stage <= 10; stage++) {
      const g = new Game(7, stage, true, () => 0, 4, 4, mode, true, true, true);
      expect(g.board.cols).toBe({ easy: 4, normal: 6, hard: 8 }[mode]);
      expect(g.board.rows).toBe(6);
      const tiles = g.board.tiles!;
      for (const t of tiles.filter((t) => t.z > 0))
        expect(
          tiles.filter(
            (p) =>
              p.z === t.z - 1 &&
              Math.abs(p.x - t.x) === 0.5 &&
              Math.abs(p.y - t.y) === 0.5,
          ),
        ).toHaveLength(4);
      for (const z of [1, 2]) {
        const floor = tiles.filter((t) => t.z === z);
        if (!floor.length) continue;
        const reached = new Set([floor[0]]);
        for (let i = 0; i < floor.length; i++)
          for (const t of floor)
            if (
              [...reached].some(
                (p) => Math.abs(p.x - t.x) + Math.abs(p.y - t.y) === 1,
              )
            )
              reached.add(t);
        expect(reached.size).toBe(floor.length);
      }
      for (const pair of g.witness) {
        expect(path(g.board, ...pair)).not.toBeNull();
        pair.forEach((p) => popTile(g.board, p));
      }
      expect(remainingTiles(g.board)).toBe(0);
    }
}, 120000);

it("awards capped time once per valid match without changing elapsed or reviving expiry", () => {
  for (const mode of ["easy", "normal", "hard"] as const) {
    let now = 0;
    const g = new Game(7, 1, true, () => now, 6, 6, mode, true, true, true);
    now = 10000;
    const [a, b] = g.witness[0];
    g.select(a);
    const result = g.select(b);
    expect(result.bonus).toBe({ easy: 3000, normal: 2000, hard: 1500 }[mode]);
    expect(g.elapsed).toBe(10000);
    const credit = g.timeCredit;
    expect(g.select(b).kind).toBe("ignored");
    expect(g.timeCredit).toBe(credit);
    g.pause();
    expect(g.select(g.witness[1][0]).kind).toBe("ignored");
    g.resume();
    now = g.limit + credit;
    expect(g.select(g.witness[1][0]).kind).toBe("ignored");
    expect(g.status).toBe("lost");
    const capped = new Game(7, 1, true, () => 0, 6, 6, mode, true, true, true);
    capped.elapsed = 500;
    capped.select(capped.witness[0][0]);
    expect(capped.select(capped.witness[0][1]).bonus).toBe(500);
    expect(capped.remaining).toBe(capped.limit);
    const relaxed = new Game(
      7,
      1,
      false,
      () => 0,
      6,
      6,
      mode,
      true,
      true,
      true,
    );
    relaxed.select(relaxed.witness[0][0]);
    expect(relaxed.select(relaxed.witness[0][1]).bonus).toBe(0);
  }
});
it("preserves expanded records and separates unified records across saves", () => {
  const old = {
    version: 4,
    muted: true,
    boardMode: "hard",
    records: { "expanded-hard-challenge": { stage: 8, best: 999 } },
  };
  const p = read({ getItem: () => JSON.stringify(old) }).data;
  expect(p.records["expanded-hard-challenge"]).toEqual(
    old.records["expanded-hard-challenge"],
  );
  expect(p.muted).toBe(true);
  expect(profile(p, "hard", true).best).toBe(0);
  recordWin(p, "hard", true, 1, 100);
  const again = read({ getItem: () => JSON.stringify(p) }).data;
  expect(profile(again, "hard", true).best).toBe(100);
  expect(again.records["expanded-hard-challenge"].best).toBe(999);
});
