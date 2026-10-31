import type { RuntimeEvent } from "./types";

const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object";
const text = (v: unknown, max = 5000): v is string => typeof v === "string" && v.length <= max;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const items = (v: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(v) && v.length <= 1200 && v.every(check);

/** The parent treats runtime messages as an input boundary, including malformed snapshots. */
export function isRuntimeEvent(value: unknown): value is RuntimeEvent {
  if (
    !record(value) ||
    !text(value.kind, 80) ||
    !text(value.label) ||
    !Number.isInteger(value.sequence) ||
    (value.sequence as number) < 0 ||
    !finite(value.time) ||
    value.time < 0 ||
    !(value.line === null || (Number.isInteger(value.line) && (value.line as number) > 0)) ||
    !(value.detail === undefined || text(value.detail))
  )
    return false;
  const s = value.snapshot;
  if (s === undefined) return true;
  if (!record(s)) return false;
  return (
    finite(s.clock) &&
    s.clock >= 0 &&
    items(
      s.frames,
      (f) =>
        record(f) &&
        text(f.name) &&
        finite(f.id) &&
        ["running", "suspended"].includes(f.status as string),
    ) &&
    items(s.timers, (t) => record(t) && text(t.label) && finite(t.id) && finite(t.delay)) &&
    items(s.microtasks, (v) => text(v)) &&
    items(s.reactions, (v) => text(v)) &&
    items(
      s.cache,
      (e) =>
        record(e) &&
        text(e.key) &&
        text(e.value) &&
        finite(e.expiresAt) &&
        typeof e.fresh === "boolean",
    ) &&
    items(s.origin, (e) => record(e) && text(e.key) && text(e.value) && finite(e.version))
  );
}
