"use client";
import { useEffect, useRef, useState } from "react";
import { lessons } from "@/content";
import { updateStoredValue } from "./local-state";

export interface Study {
  completed: string[];
  saved: string[];
  notes: Record<string, string>;
  lastLesson: string | null;
}
const empty: Study = { completed: [], saved: [], notes: {}, lastLesson: null };
const key = "under-the-hood.study.v1";
const slugs = new Set(lessons.map((l) => l.slug));
export function parseStudy(value: string | null): Study {
  if (!value) return empty;
  try {
    const raw = JSON.parse(value);
    if (!raw || typeof raw !== "object") return empty;
    const validArray = (v: unknown) =>
      Array.isArray(v)
        ? [...new Set(v.filter((x): x is string => typeof x === "string" && slugs.has(x)))]
        : [];
    const notes =
      raw.notes && typeof raw.notes === "object" && !Array.isArray(raw.notes)
        ? Object.fromEntries(
            Object.entries(raw.notes)
              .filter(([k, v]) => slugs.has(k) && typeof v === "string")
              .map(([k, v]) => [k, (v as string).slice(0, 20000)]),
          )
        : {};
    return {
      completed: validArray(raw.completed),
      saved: validArray(raw.saved),
      notes,
      lastLesson:
        typeof raw.lastLesson === "string" && slugs.has(raw.lastLesson) ? raw.lastLesson : null,
    };
  } catch {
    return empty;
  }
}
/** Re-read before a local edit so a stale tab does not replace newer unrelated fields.
 * localStorage is not transactional across simultaneous writers; same-field edits remain last-write-wins. */
export function updateStoredStudy(
  storage: Pick<Storage, "getItem" | "setItem"> | null,
  fallback: Study,
  change: (previous: Study) => Study,
  preferMemory = false,
) {
  const result = updateStoredValue({
    storage,
    key,
    parse: parseStudy,
    fallback,
    change,
    preferMemory,
  });
  return { study: result.value, storageError: result.storageError };
}
export function useStudy() {
  const [study, setStudy] = useState<Study>(empty);
  const current = useRef(study);
  const unpersisted = useRef(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    function receive() {
      if (unpersisted.current) return;
      try {
        // Read current storage, not an older queued event's newValue.
        const latest = parseStudy(localStorage.getItem(key));
        current.current = latest;
        setStudy(latest);
      } catch {
        setStorageError(true);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === key || event.key === null) receive();
    }
    receive();
    setReady(true);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function change(update: (previous: Study) => Study) {
    let storage: Storage | null = null;
    try {
      storage = localStorage;
    } catch {
      /* Private/storage-disabled contexts keep session state. */
    }
    const result = updateStoredStudy(storage, current.current, update, unpersisted.current);
    unpersisted.current = result.storageError;
    current.current = result.study;
    setStudy(result.study);
    setStorageError(result.storageError);
  }
  const toggle = (field: "completed" | "saved", slug: string) =>
    change((s) => ({
      ...s,
      [field]: s[field].includes(slug) ? s[field].filter((x) => x !== slug) : [...s[field], slug],
    }));
  return {
    study,
    ready,
    storageError,
    toggle,
    setNote: (slug: string, value: string) =>
      change((s) => ({ ...s, notes: { ...s.notes, [slug]: value.slice(0, 20000) } })),
    visit: (slug: string) =>
      change((s) => (s.lastLesson === slug ? s : { ...s, lastLesson: slug })),
    reset: () => change(() => empty),
  };
}
