export type Preferences = {
  version: 1;
  stage: number;
  best: number;
  timed: boolean;
  muted: boolean;
  character: boolean;
  motion: boolean;
};
export const defaults: Preferences = {
  version: 1,
  stage: 1,
  best: 0,
  timed: false,
  muted: false,
  character: true,
  motion: true,
};
export const key = "chibilink.v1";
export function read(store: Pick<Storage, "getItem">): {
  data: Preferences;
  error: boolean;
} {
  try {
    const raw = store.getItem(key);
    if (!raw) return { data: { ...defaults }, error: false };
    const x = JSON.parse(raw);
    if (x.version !== 1) throw Error("version");
    const data = { ...defaults };
    for (const k of ["timed", "muted", "character", "motion"] as const)
      if (typeof x[k] === "boolean") data[k] = x[k];
    if (Number.isInteger(x.stage))
      data.stage = Math.min(10, Math.max(1, x.stage));
    if (Number.isFinite(x.best)) data.best = Math.max(0, Math.floor(x.best));
    return { data, error: false };
  } catch {
    return { data: { ...defaults }, error: true };
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
