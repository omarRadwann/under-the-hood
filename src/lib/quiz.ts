import type { Lesson } from "./types";

/** Stable across SSR/hydration and revisits, without teaching a fixed answer position. */
export function arrangeQuiz(quiz: Lesson["quiz"], slug: string): Lesson["quiz"] {
  let seed = 2166136261;
  for (const char of slug) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const entries = quiz.choices.map((text, index) => ({ text, index }));
  for (let i = entries.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  return {
    ...quiz,
    choices: entries.map((entry) => entry.text),
    answer: entries.findIndex((entry) => entry.index === quiz.answer),
  };
}
