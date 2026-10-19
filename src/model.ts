export type Point = { x: number; y: number };
export type BoardMode = "classic" | "layered";
export type Board = {
  cols: number;
  rows: number;
  cells: number[];
  stacks?: number[][];
  mask?: boolean[];
};
export const remainingTiles = (b: Board) =>
  b.stacks
    ? b.stacks.reduce((n, s) => n + s.length, 0)
    : b.cells.filter(Boolean).length;
export function popTile(b: Board, p: Point) {
  const i = index(b, p);
  if (b.stacks) {
    b.stacks[i].pop();
    b.cells[i] = b.stacks[i].at(-1) ?? 0;
  } else b.cells[i] = 0;
}
export type Pair = [Point, Point];
export const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const index = (b: Board, p: Point) => p.y * b.cols + p.x;
export const value = (b: Board, p: Point) =>
  p.x < 0 || p.y < 0 || p.x >= b.cols || p.y >= b.rows
    ? 0
    : b.cells[index(b, p)];
const inside = (b: Board, p: Point) =>
  p.x >= 0 && p.y >= 0 && p.x < b.cols && p.y < b.rows;
export function path(b: Board, a: Point, z: Point): Point[] | null {
  if (
    !inside(b, a) ||
    !inside(b, z) ||
    same(a, z) ||
    !value(b, a) ||
    value(b, a) !== value(b, z)
  )
    return null;
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];
  const queue: { p: Point; dir: number; turns: number; route: Point[] }[] = [
    { p: a, dir: -1, turns: 0, route: [a] },
  ];
  const seen = new Map<string, number>();
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head];
    for (let dir = 0; dir < 4; dir++) {
      const turns = n.turns + (n.dir !== -1 && n.dir !== dir ? 1 : 0);
      if (turns > 2) continue;
      const p = { x: n.p.x + directions[dir].x, y: n.p.y + directions[dir].y };
      if (p.x < -1 || p.y < -1 || p.x > b.cols || p.y > b.rows) continue;
      if (same(p, z)) return [...n.route, p];
      if (value(b, p)) continue;
      const key = `${p.x},${p.y},${dir}`;
      if ((seen.get(key) ?? 3) <= turns) continue;
      seen.set(key, turns);
      queue.push({ p, dir, turns, route: [...n.route, p] });
    }
  }
  return null;
}
export function points(b: Board): Point[] {
  return b.cells.flatMap((v, i) =>
    v ? [{ x: i % b.cols, y: Math.floor(i / b.cols) }] : [],
  );
}
export function move(b: Board): Pair | null {
  const ps = points(b);
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      if (path(b, ps[i], ps[j])) return [ps[i], ps[j]];
  return null;
}
export function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function arrange(
  source: Board,
  seed: number,
): { board: Board; witness: Pair[] } {
  const rng = random(seed),
    temp = { ...source, cells: source.cells.map((v) => (v ? 1 : 0)) },
    board = { ...source, cells: [...source.cells] };
  const counts = new Map<number, number>();
  source.cells.forEach((v) => {
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  const types: number[] = [];
  for (const [v, n] of counts) {
    if (n % 2) throw new Error("Unpaired symbol");
    for (let i = 0; i < n / 2; i++) types.push(v);
  }
  const witness: Pair[] = [];
  while (types.length) {
    const ps = points(temp);
    let pair: Pair | null = null;
    for (let tries = 0; tries < 48 && !pair; tries++) {
      const a = ps[Math.floor(rng() * ps.length)],
        b = ps[Math.floor(rng() * ps.length)];
      if (path(temp, a, b)) pair = [a, b];
    }
    pair ??= move(temp);
    if (!pair) throw new Error("No geometric pairing");
    const [symbol] = types.splice(Math.floor(rng() * types.length), 1);
    for (const p of pair) {
      temp.cells[index(temp, p)] = 0;
      board.cells[index(board, p)] = symbol;
    }
    witness.push(pair);
  }
  return { board, witness };
}
export function generate(
  cols: number,
  rows: number,
  seed: number,
  kindCount = 8,
) {
  if ((cols * rows) % 2) throw new Error("Even board required");
  return arrange(
    {
      cols,
      rows,
      cells: Array.from(
        { length: cols * rows },
        (_, i) => 1 + (Math.floor(i / 2) % kindCount),
      ),
    },
    seed,
  );
}
export function layoutMask(
  cols: number,
  rows: number,
  stage: number,
): boolean[] {
  const mask = Array(cols * rows).fill(true) as boolean[];
  // Symmetric paired gaps keep an even support count, including short landscape.
  const holes =
    stage % 3 === 1
      ? [Math.floor(rows / 2) * cols + Math.floor(cols / 2) - 1]
      : stage % 3 === 2
        ? [0, cols - 1]
        : [cols + 1];
  for (const i of holes) {
    if (i >= 0 && i < mask.length) {
      mask[i] = false;
      mask[mask.length - 1 - i] = false;
    }
  }
  return mask;
}
export function arrangementDifficulty(b: Board) {
  let score = 0;
  const ps = points(b);
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      if (path(b, ps[i], ps[j]))
        score +=
          1 +
          (Math.abs(ps[i].x - ps[j].x) + Math.abs(ps[i].y - ps[j].y) === 1
            ? 4
            : 0);
  return score;
}
function buildLayers(
  cols: number,
  rows: number,
  mask: boolean[],
  symbols: number[],
  seed: number,
  stage: number,
) {
  const skeleton = arrange(
    { cols, rows, cells: mask.map((v) => (v ? 1 : 0)) },
    seed,
  );
  const rng = random(seed + 91),
    pool = [...symbols],
    stacks: number[][] = mask.map(() => []),
    witness: Pair[] = [];
  const pairSlots = skeleton.witness;
  // Each geometric pair is removed top then bottom before the next pair.
  // Every emitted witness is valid, without probabilistic solver retries.
  const used = Math.min(pairSlots.length, pool.length),
    extra = pool.length - used;
  for (let j = 0; j < used; j++) {
    const pair = pairSlots[j],
      depth = j < extra ? 2 : 1;
    const values: number[] = [];
    for (let d = 0; d < depth; d++) {
      const pick = Math.floor(rng() * pool.length);
      values.push(pool.splice(pick, 1)[0]);
      witness.push(pair);
    }
    for (const point of pair)
      stacks[index(skeleton.board, point)] = [...values].reverse();
  }
  if (pool.length) throw new Error("Layer capacity exceeded");
  return {
    board: {
      cols,
      rows,
      mask: [...mask],
      stacks,
      cells: stacks.map((s) => s.at(-1) ?? 0),
    },
    witness,
    stage,
  };
}
export function generatePuzzle(
  cols: number,
  rows: number,
  seed: number,
  stage: number,
  mode: BoardMode,
  timed: boolean,
) {
  const mask = layoutMask(cols, rows, stage),
    slots = mask.filter(Boolean).length;
  const count =
    mode === "layered" ? slots + 2 * Math.max(1, Math.floor(slots / 4)) : slots;
  const symbols = Array.from(
    { length: count / 2 },
    (_, i) => 1 + (i % (timed ? 12 : Math.min(6 + stage, 12))),
  );
  let best: ReturnType<typeof buildLayers> | null = null;
  for (let attempt = 0; attempt < (timed ? 8 : 1); attempt++) {
    const next = buildLayers(
      cols,
      rows,
      mask,
      symbols,
      seed + attempt * 104729,
      stage,
    );
    if (mode === "classic") delete (next.board as Board).stacks;
    if (
      !best ||
      arrangementDifficulty(next.board) < arrangementDifficulty(best.board)
    )
      best = next;
  }
  return best!;
}
export function rearrangeLayers(source: Board, seed: number) {
  const counts = new Map<number, number>();
  for (const stack of source.stacks ?? source.cells.map((v) => (v ? [v] : [])))
    for (const v of stack) counts.set(v, (counts.get(v) ?? 0) + 1);
  const symbols: number[] = [];
  for (const [v, n] of counts) {
    if (n % 2) throw new Error("Odd remaining symbol");
    for (let j = 0; j < n / 2; j++) symbols.push(v);
  }
  return buildLayers(
    source.cols,
    source.rows,
    source.mask ?? source.cells.map(() => true),
    symbols,
    seed,
    1,
  );
}
export const challengeRules = {
  hints: 2,
  shuffles: 1,
  hintPenalty: 8000,
  shufflePenalty: 12000,
  recoveryScore: 150,
};
export type Status = "playing" | "paused" | "won" | "lost";
export class Game {
  board: Board;
  status: Status = "playing";
  selected: Point | null = null;
  score = 0;
  combo = 0;
  pairs = 0;
  shuffles = 0;
  hintCount = 0;
  recoveries = 0;
  initialTiles: number;
  elapsed = 0;
  last: number;
  lastMatch = -Infinity;
  witness: Pair[];
  constructor(
    public seed: number,
    public stage: number,
    public timed: boolean,
    public clock: () => number,
    cols = 6,
    rows = 6,
    public mode: BoardMode = "classic",
    irregular = false,
  ) {
    const generated =
      irregular || mode === "layered" || timed
        ? generatePuzzle(cols, rows, seed, stage, mode, timed)
        : generate(cols, rows, seed, Math.min(6 + stage, 12));
    this.board = generated.board;
    this.witness = generated.witness;
    this.initialTiles = remainingTiles(this.board);
    this.last = clock();
  }
  get limit() {
    return (
      Math.max(
        30,
        Math.round(
          (this.initialTiles / 2) * Math.max(2.8, 4.5 - this.stage * 0.15) +
            (this.mode === "layered" ? 12 : 6),
        ),
      ) * 1000
    );
  }
  get remaining() {
    return Math.max(0, this.limit - this.elapsed);
  }
  tick() {
    const now = this.clock();
    if (this.status === "playing") {
      this.elapsed += Math.max(0, now - this.last);
      if (this.timed && this.remaining <= 0) {
        this.status = "lost";
        this.selected = null;
      }
    }
    this.last = now;
  }
  pause() {
    this.tick();
    if (this.status === "playing") {
      this.status = "paused";
      this.selected = null;
    }
  }
  resume() {
    if (this.status === "paused") {
      this.last = this.clock();
      this.status = "playing";
    }
  }
  hint() {
    this.tick();
    if (
      this.status !== "playing" ||
      (this.timed && this.hintCount >= challengeRules.hints)
    )
      return null;
    this.hintCount++;
    if (this.timed) {
      this.elapsed += challengeRules.hintPenalty;
      this.tick();
      if (this.status !== "playing") return null;
    }
    return move(this.board);
  }
  shuffle(automatic = false) {
    this.tick();
    if (
      this.status !== "playing" ||
      (!automatic && this.timed && this.shuffles >= challengeRules.shuffles)
    )
      return false;
    if (automatic) {
      this.recoveries++;
      if (this.timed)
        this.score = Math.max(0, this.score - challengeRules.recoveryScore);
    } else {
      this.shuffles++;
      if (this.timed) {
        this.elapsed += challengeRules.shufflePenalty;
        this.tick();
        if (this.status !== "playing") return false;
      }
    }
    const next = this.board.stacks
      ? rearrangeLayers(
          this.board,
          this.seed + (this.shuffles + this.recoveries) * 7919,
        )
      : arrange(
          this.board,
          this.seed + (this.shuffles + this.recoveries) * 7919,
        );
    this.board = next.board;
    this.witness = next.witness;
    this.selected = null;
    this.combo = 0;
    return true;
  }
  select(p: Point): {
    kind: "select" | "invalid" | "match" | "ignored";
    route?: Point[];
    reshuffled?: boolean;
  } {
    this.tick();
    if (
      this.status !== "playing" ||
      !inside(this.board, p) ||
      !value(this.board, p)
    )
      return { kind: "ignored" };
    if (!this.selected) {
      this.selected = p;
      return { kind: "select" };
    }
    const a = this.selected;
    this.selected = null;
    if (same(a, p)) return { kind: "select" };
    const route = path(this.board, a, p);
    if (!route) {
      this.selected = p;
      this.combo = 0;
      return { kind: "invalid" };
    }
    popTile(this.board, a);
    popTile(this.board, p);
    this.combo = this.elapsed - this.lastMatch <= 5000 ? this.combo + 1 : 1;
    this.lastMatch = this.elapsed;
    this.pairs++;
    this.score += 100 + Math.min(this.combo - 1, 9) * 25;
    let reshuffled = false;
    if (!this.board.cells.some(Boolean)) this.status = "won";
    else if (!move(this.board)) {
      this.shuffle(true);
      reshuffled = true;
    }
    return { kind: "match", route, reshuffled };
  }
}
