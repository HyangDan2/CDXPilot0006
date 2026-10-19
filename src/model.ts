export type Point = { x: number; y: number; z?: number };
export type Difficulty = "easy" | "normal" | "hard";
export type Tile = Point & { z: number; value: number };
export const difficulty = {
  easy: { name: "Easy", layers: 1, kinds: 6 },
  normal: { name: "Normal", layers: 2, kinds: 10 },
  hard: { name: "Hard", layers: 3, kinds: 14 },
};
export const isDifficulty = (m: string): m is Difficulty => m in difficulty;
export type BoardMode = "classic" | "layered" | Difficulty;
export type Board = {
  cols: number;
  rows: number;
  cells: number[];
  tiles?: Tile[];
  stacks?: number[][];
  mask?: boolean[];
};
export const remainingTiles = (b: Board) =>
  b.tiles
    ? b.tiles.filter((t) => t.value).length
    : b.stacks
      ? b.stacks.reduce((n, s) => n + s.length, 0)
      : b.cells.filter(Boolean).length;
export function popTile(b: Board, p: Point) {
  if (b.tiles) {
    const t = b.tiles.find((t) => same(t, p));
    if (t) t.value = 0;
    b.cells = b.tiles.map((t) => t.value);
    return;
  }
  const i = index(b, p);
  if (b.stacks) {
    b.stacks[i].pop();
    b.cells[i] = b.stacks[i].at(-1) ?? 0;
  } else b.cells[i] = 0;
}
export type Pair = [Point, Point];
export const same = (a: Point, b: Point) =>
  a.x === b.x && a.y === b.y && (a.z ?? 0) === (b.z ?? 0);
export const index = (b: Board, p: Point) => p.y * b.cols + p.x;
export const value = (b: Board, p: Point) =>
  b.tiles
    ? (b.tiles.find((t) => same(t, p))?.value ?? 0)
    : p.x < 0 || p.y < 0 || p.x >= b.cols || p.y >= b.rows
      ? 0
      : b.cells[index(b, p)];
const inside = (b: Board, p: Point) =>
  p.x >= 0 && p.y >= 0 && p.x < b.cols && p.y < b.rows;
export function path(b: Board, a: Point, z: Point): Point[] | null {
  if (b.tiles) return spatialPath(b, a, z);
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
  if (b.tiles)
    return b.tiles
      .filter((t) => exposed(b, t))
      .map(({ x, y, z }) => ({ x, y, z }));
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
  preferDistance = false,
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
    for (
      let tries = 0;
      tries < 48 && (!pair || (preferDistance && tries < 24));
      tries++
    ) {
      const a = ps[Math.floor(rng() * ps.length)],
        b = ps[Math.floor(rng() * ps.length)];
      if (
        (!pair ||
          Math.abs(a.x - b.x) + Math.abs(a.y - b.y) >
            Math.abs(pair[0].x - pair[1].x) +
              Math.abs(pair[0].y - pair[1].y)) &&
        path(temp, a, b)
      )
        pair = [a, b];
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
  recoveries: 1,
  recoveryPenalty: 15000,
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
  blockedOut = false;
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
    public expanded = false,
  ) {
    const generated = isDifficulty(mode)
      ? (expanded ? generateExpanded : generatePyramid)(
          cols,
          rows,
          seed,
          stage,
          mode,
          timed,
        )
      : irregular || mode === "layered" || timed
        ? generatePuzzle(cols, rows, seed, stage, mode, timed)
        : generate(cols, rows, seed, Math.min(6 + stage, 12));
    this.board = generated.board;
    this.witness = generated.witness;
    this.initialTiles = remainingTiles(this.board);
    this.last = clock();
  }
  get limit() {
    const base = Math.max(
      30,
      Math.round(
        (this.initialTiles / 2) * Math.max(2.8, 4.5 - this.stage * 0.15) +
          (this.mode === "layered" ? 12 : 6),
      ),
    );
    const factor =
      this.timed && isDifficulty(this.mode)
        ? { easy: 0.85, normal: 0.75, hard: 0.7 }[this.mode]
        : 1;
    return Math.max(factor < 1 ? 20 : 30, Math.round(base * factor)) * 1000;
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
      if (
        this.expanded &&
        this.timed &&
        this.recoveries >= challengeRules.recoveries
      )
        return false;
      this.recoveries++;
      if (this.expanded && this.timed) {
        this.elapsed += challengeRules.recoveryPenalty;
        this.tick();
        if (this.status !== "playing") return false;
      }
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
    const next = this.board.tiles
      ? rearrangePyramid(
          this.board,
          this.seed + (this.shuffles + this.recoveries) * 7919,
          this.expanded,
        )
      : this.board.stacks
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
      !value(this.board, p) ||
      (this.board.tiles && !exposed(this.board, p))
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
      reshuffled = this.shuffle(true);
      if (
        !reshuffled &&
        this.expanded &&
        this.timed &&
        this.shuffles >= challengeRules.shuffles
      ) {
        this.blockedOut = true;
        this.status = "lost";
      }
    }
    return { kind: "match", route, reshuffled };
  }
}

export function exposed(b: Board, p: Point): boolean {
  return (
    !!value(b, p) &&
    !(b.tiles ?? []).some(
      (t) =>
        t.value &&
        t.z > (p.z ?? 0) &&
        Math.abs(t.x - p.x) < 1 &&
        Math.abs(t.y - p.y) < 1,
    )
  );
}
// Paths run horizontally on the selected floor. Lower floors do not obstruct
// that plane; same/higher occupied footprints do. Coordinates are half-cells.
function spatialPath(b: Board, a: Point, end: Point): Point[] | null {
  if (
    same(a, end) ||
    (a.z ?? 0) !== (end.z ?? 0) ||
    !exposed(b, a) ||
    !exposed(b, end) ||
    value(b, a) !== value(b, end)
  )
    return null;
  const floor = a.z ?? 0;
  const obstacles = b.tiles!.filter(
    (t) => t.value && t.z >= floor && !same(t, a) && !same(t, end),
  );
  const directions = [
    [0.5, 0],
    [0, 0.5],
    [-0.5, 0],
    [0, -0.5],
  ];
  const queue = [{ p: a, dir: -1, turns: 0, route: [a] }],
    seen = new Map<string, number>();
  for (let head = 0; head < queue.length; head++) {
    const n = queue[head];
    for (let dir = 0; dir < 4; dir++) {
      const turns = n.turns + (n.dir !== -1 && n.dir !== dir ? 1 : 0);
      if (turns > 2) continue;
      const p = {
        x: n.p.x + directions[dir][0],
        y: n.p.y + directions[dir][1],
        z: floor,
      };
      if (p.x < -1 || p.y < -1 || p.x > b.cols || p.y > b.rows) continue;
      if (
        obstacles.some(
          // Closed footprints: decorative tile gaps are not playable corridors.
          (t) => Math.abs(t.x - p.x) <= 0.5 && Math.abs(t.y - p.y) <= 0.5,
        )
      )
        continue;
      if (same(p, end)) return [...n.route, p];
      const key = `${p.x},${p.y},${dir}`;
      if ((seen.get(key) ?? 3) <= turns) continue;
      seen.set(key, turns);
      queue.push({ p, dir, turns, route: [...n.route, p] });
    }
  }
  return null;
}
export function rearrangePyramid(
  source: Board,
  seed: number,
  preferDistance = false,
): { board: Board; witness: Pair[] } {
  const tiles = source.tiles!.map((t) => ({ ...t })),
    witness: Pair[] = [];
  const top = Math.max(...tiles.map((t) => t.z));
  for (let z = top; z >= 0; z--) {
    const cols = source.cols - z,
      rows = source.rows - z;
    const cells = Array(cols * rows).fill(0) as number[];
    for (const t of tiles.filter((t) => t.z === z))
      cells[(t.y - z / 2) * cols + t.x - z / 2] = t.value;
    const next = arrange(
      { cols, rows, cells },
      seed + z * 1009,
      preferDistance,
    );
    for (const t of tiles.filter((t) => t.z === z))
      t.value = next.board.cells[(t.y - z / 2) * cols + t.x - z / 2];
    witness.push(
      ...next.witness.map(
        (pair) =>
          pair.map((p) => ({ x: p.x + z / 2, y: p.y + z / 2, z })) as Pair,
      ),
    );
  }
  return {
    board: {
      cols: source.cols,
      rows: source.rows,
      tiles,
      cells: tiles.map((t) => t.value),
    },
    witness,
  };
}
export function generatePyramid(
  cols: number,
  rows: number,
  seed: number,
  stage: number,
  mode: Difficulty,
  timed: boolean,
) {
  const layers = difficulty[mode].layers;
  if (cols < 4 || rows < 4)
    throw Error("Pyramid requires at least a 4×4 footprint");
  const tiles: Tile[] = [];
  for (let z = 0; z < layers; z++) {
    const floor: Tile[] = [];
    for (let y = 0; y < rows - z; y++)
      for (let x = 0; x < cols - z; x++) {
        const t = { x: x + z / 2, y: y + z / 2, z, value: 1 };
        if (
          z &&
          tiles.filter(
            (p) =>
              p.z === z - 1 &&
              Math.abs(p.x - t.x) === 0.5 &&
              Math.abs(p.y - t.y) === 0.5,
          ).length !== 4
        )
          continue;
        if (
          !z &&
          mode === "easy" &&
          !layoutMask(cols, rows, stage)[y * cols + x]
        )
          continue;
        floor.push(t);
      }
    // Rotate the missing corner across stages; preserve four supports upstairs.
    if (floor.length % 2) floor.splice(stage % 2 ? floor.length - 1 : 0, 1);
    tiles.push(...floor);
  }
  // Create additional paired edge gaps only where no upper tile needs support.
  if (mode !== "easy") {
    const free = tiles.filter(
      (t) =>
        t.z === 0 &&
        !tiles.some(
          (u) =>
            u.z === 1 && Math.abs(u.x - t.x) < 1 && Math.abs(u.y - t.y) < 1,
        ),
    );
    if (free.length >= 2)
      for (const t of free.slice(0, 2)) tiles.splice(tiles.indexOf(t), 1);
  }
  const kinds = Math.min(
    mode === "easy" ? 8 : mode === "normal" ? 12 : 18,
    difficulty[mode].kinds + Math.floor((stage - 1) / 2),
  );
  let pairOffset = 0;
  for (let z = 0; z < layers; z++) {
    const floor = tiles.filter((t) => t.z === z);
    floor.forEach(
      (t, i) => (t.value = 1 + ((pairOffset + Math.floor(i / 2)) % kinds)),
    );
    pairOffset += floor.length / 2;
  }
  const source = { cols, rows, tiles, cells: tiles.map((t) => t.value) };
  let best = rearrangePyramid(source, seed),
    cost = arrangementDifficulty(best.board);
  for (let i = 1; i < (timed ? 4 : 1); i++) {
    const candidate = rearrangePyramid(source, seed + i * 104729),
      next = arrangementDifficulty(candidate.board);
    if (next < cost) {
      best = candidate;
      cost = next;
    }
  }
  return best;
}

// Score early/mid/late positions on both the guaranteed and alternate legal order.
export function progressionCost(board: Board, witness: Pair[]): number {
  let cost = 0;
  for (const reverse of [false, true]) {
    const b: Board = {
      ...board,
      tiles: board.tiles!.map((t) => ({ ...t })),
      cells: [...board.cells],
    };
    const pending = [...witness];
    for (let step = 0; step < witness.length; step++) {
      if (
        [
          0,
          Math.floor(witness.length * 0.25),
          Math.floor(witness.length * 0.5),
          Math.floor(witness.length * 0.75),
        ].includes(step)
      ) {
        const ps = points(b);
        let tested = 0;
        for (let i = 0; i < ps.length; i++)
          for (let j = i + 1; j < ps.length; j++) {
            if (
              value(b, ps[i]) !== value(b, ps[j]) ||
              (ps[i].z ?? 0) !== (ps[j].z ?? 0)
            )
              continue;
            if (++tested > 160) break;
            const route = path(b, ps[i], ps[j]);
            if (route) {
              const distance =
                Math.abs(ps[i].x - ps[j].x) + Math.abs(ps[i].y - ps[j].y);
              const straight =
                route.every((p) => p.x === ps[i].x) ||
                route.every((p) => p.y === ps[i].y);
              cost += 1 + (distance === 1 ? 12 : 0) + (straight ? 3 : 0);
            }
          }
      }
      const indices = pending.map((_, i) => i);
      if (reverse) indices.reverse();
      const index = indices.find((i) => path(b, ...pending[i]));
      if (index === undefined) {
        cost += 10000;
        break;
      }
      pending.splice(index, 1)[0].forEach((p) => popTile(b, p));
    }
  }
  return cost;
}

export function generateExpanded(
  cols: number,
  rows: number,
  seed: number,
  stage: number,
  mode: Difficulty,
  timed: boolean,
) {
  const original = generatePyramid(cols, rows, seed, stage, mode, false).board;
  // Two supported footprints, joined horizontally; pair assignment spans both.
  const tiles = [0, cols].flatMap((offset) =>
    original.tiles!.map((t) => ({ ...t, x: t.x + offset })),
  );
  const target = { easy: [12, 16], normal: [20, 28], hard: [30, 36] }[mode];
  const kinds = Math.min(
    target[1],
    target[0] + Math.floor((stage - 1) / 2) * 2,
    Math.max(6, tiles.length / 2 - 4),
  );
  let offset = 0;
  for (let z = 0; z < difficulty[mode].layers; z++) {
    const floor = tiles.filter((t) => t.z === z);
    floor.forEach((t, i) => {
      const kind = (offset + Math.floor(i / 2)) % kinds;
      t.value = 1 + (kind % 6) * 6 + Math.floor(kind / 6);
    });
    offset += floor.length / 2;
  }
  const source: Board = {
    cols: cols * 2,
    rows,
    tiles,
    cells: tiles.map((t) => t.value),
  };
  let best = rearrangePyramid(source, seed, true);
  let cost = progressionCost(best.board, best.witness);
  for (let i = 1; i < (timed ? 4 : 3); i++) {
    const candidate = rearrangePyramid(source, seed + i * 104729, true);
    const next = progressionCost(candidate.board, candidate.witness);
    if (next < cost) {
      best = candidate;
      cost = next;
    }
  }
  return best;
}
