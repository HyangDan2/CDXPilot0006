import type { BoardMode } from "./model";
export type RecordEntry = { stage: number; best: number };
export type Preferences = {
  version: 4;
  stage: number;
  best: number;
  timed: boolean;
  muted: boolean;
  character: boolean;
  motion: boolean;
  boardMode: BoardMode;
  records: Record<string, RecordEntry>;
};
export const defaults: Preferences = {
  version: 4,
  stage: 1,
  best: 0,
  timed: false,
  muted: false,
  character: true,
  motion: true,
  boardMode: "normal",
  records: {},
};
export const key = "chibilink.v1";
export const recordKey = (mode: BoardMode, timed: boolean) =>
  `${["easy", "normal", "hard"].includes(mode) ? "expanded-" : ""}${mode}-${timed ? "challenge" : "relaxed"}`;
export const stageLimit = (mode: BoardMode) => (mode === "layered" ? 5 : 10);
export function profile(
  p: Preferences,
  mode: BoardMode = p.boardMode,
  timed = p.timed,
): RecordEntry {
  return p.records[recordKey(mode, timed)] ?? { stage: 1, best: 0 };
}
export function recordWin(
  p: Preferences,
  mode: BoardMode,
  timed: boolean,
  stage: number,
  score: number,
) {
  const old = profile(p, mode, timed);
  p.records = {
    ...p.records,
    [recordKey(mode, timed)]: {
      stage: Math.max(old.stage, Math.min(stageLimit(mode), stage + 1)),
      best: Math.max(old.best, score),
    },
  };
  if (mode === "classic" && !timed) {
    p.stage = p.records["classic-relaxed"].stage;
    p.best = p.records["classic-relaxed"].best;
  }
}
export function read(store: Pick<Storage, "getItem">): {
  data: Preferences;
  error: boolean;
} {
  try {
    const raw = store.getItem(key);
    const data = { ...defaults, records: {} } as Preferences;
    if (!raw) return { data, error: false };
    const x = JSON.parse(raw);
    if (!x || ![1, 2, 3, 4].includes(x.version)) throw Error("version");
    for (const k of ["timed", "muted", "character", "motion"] as const)
      if (typeof x[k] === "boolean") data[k] = x[k];
    if (Number.isInteger(x.stage))
      data.stage = Math.min(10, Math.max(1, x.stage));
    if (Number.isFinite(x.best)) data.best = Math.max(0, Math.floor(x.best));
    if (x.boardMode === "classic") data.boardMode = "easy";
    if (x.boardMode === "layered") data.boardMode = "normal";
    if (["easy", "normal", "hard"].includes(x.boardMode))
      data.boardMode = x.boardMode;
    if (x.version === 1)
      data.records["classic-relaxed"] = { stage: data.stage, best: data.best };
    else
      for (const mode of [
        "classic",
        "layered",
        "easy",
        "normal",
        "hard",
      ] as const)
        for (const timed of [false, true]) {
          const id = `${mode}-${timed ? "challenge" : "relaxed"}`,
            r = x.records?.[id];
          if (r && Number.isInteger(r.stage) && Number.isFinite(r.best))
            data.records[id] = {
              stage: Math.max(1, Math.min(stageLimit(mode), r.stage)),
              best: Math.max(0, Math.floor(r.best)),
            };
        }
    if (x.version === 4)
      for (const mode of ["easy", "normal", "hard"] as const)
        for (const timed of [false, true]) {
          const id = recordKey(mode, timed),
            r = x.records?.[id];
          if (r && Number.isInteger(r.stage) && Number.isFinite(r.best))
            data.records[id] = {
              stage: Math.max(1, Math.min(10, r.stage)),
              best: Math.max(0, Math.floor(r.best)),
            };
        }
    return { data, error: false };
  } catch {
    return { data: { ...defaults, records: {} }, error: true };
  }
}
export function save(store: Pick<Storage, "setItem">, data: Preferences) {
  try {
    store.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
