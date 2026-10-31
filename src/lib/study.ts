"use client";
import { useEffect, useState } from "react";
import { lessons } from "@/content";

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
export function useStudy() {
  const [study, setStudy] = useState<Study>(empty);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      setStudy(parseStudy(localStorage.getItem(key)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(study));
    } catch {
      setStorageError(true);
    }
  }, [study, ready]);
  const toggle = (field: "completed" | "saved", slug: string) =>
    setStudy((s) => ({
      ...s,
      [field]: s[field].includes(slug) ? s[field].filter((x) => x !== slug) : [...s[field], slug],
    }));
  return {
    study,
    ready,
    storageError,
    toggle,
    setNote: (slug: string, value: string) =>
      setStudy((s) => ({ ...s, notes: { ...s.notes, [slug]: value.slice(0, 20000) } })),
    visit: (slug: string) =>
      setStudy((s) => (s.lastLesson === slug ? s : { ...s, lastLesson: slug })),
    reset: () => setStudy(empty),
  };
}
