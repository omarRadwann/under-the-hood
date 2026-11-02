import type { Exercise } from "../content/training";
import { legacyExerciseId } from "./exercise-ids";

export const CHECK_MARKER = "__UTH_CHECK__";
export interface CheckResult {
  index: number;
  passed: boolean;
  error?: string;
}
export function parseCheck(label: string, count: number): CheckResult | null {
  if (!label.startsWith(CHECK_MARKER)) return null;
  try {
    const value = JSON.parse(label.slice(CHECK_MARKER.length));
    if (
      !Number.isInteger(value.index) ||
      value.index < 0 ||
      value.index >= count ||
      typeof value.passed !== "boolean"
    )
      return null;
    return {
      index: value.index,
      passed: value.passed,
      error: typeof value.error === "string" ? value.error.slice(0, 500) : undefined,
    };
  } catch {
    return null;
  }
}
/** Append authored checks after compilation: source line markers continue to refer to learner code. */
export function trainingHarness(exercise: Exercise): string {
  return exercise.checks
    .map(
      (check, index) =>
        "\ntry { await (async () => { const assert = (condition, message = 'Contract assertion failed') => { if (!condition) throw new Error(message); };\n" +
        check.body +
        "\n})(); console.log(" +
        JSON.stringify(CHECK_MARKER) +
        " + JSON.stringify({index:" +
        index +
        ",passed:true})); } catch (__uthCheckError) { console.log(" +
        JSON.stringify(CHECK_MARKER) +
        " + JSON.stringify({index:" +
        index +
        ",passed:false,error:String(__uthCheckError?.message ?? __uthCheckError).slice(0,500)})); }\n",
    )
    .join("");
}
export function sourceFingerprint(source: string): string {
  let hash = 2166136261;
  for (const char of source) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash.toString(16);
}
export interface TrainingRecord {
  runs: number;
  best: number;
  total: number;
  fingerprint: string;
  passed: number;
  solutionViewed: boolean;
}
export function parseTraining(
  value: string | null,
  exercises: Exercise[],
): Record<string, TrainingRecord> {
  try {
    const raw = JSON.parse(value ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: Record<string, TrainingRecord> = {};
    for (const exercise of exercises) {
      const record = raw[exercise.id] ?? raw[legacyExerciseId(exercise.id)];
      if (
        !record ||
        record.total !== exercise.checks.length ||
        !Number.isSafeInteger(record.runs) ||
        record.runs < 1 ||
        !Number.isInteger(record.best) ||
        record.best < 0 ||
        record.best > record.total ||
        !Number.isInteger(record.passed) ||
        record.passed < 0 ||
        record.passed > record.best ||
        typeof record.fingerprint !== "string" ||
        !/^[a-f0-9]{1,8}$/.test(record.fingerprint)
      )
        continue;
      result[exercise.id] = {
        runs: Math.min(record.runs, 1_000_000),
        best: record.best,
        total: record.total,
        fingerprint: record.fingerprint,
        passed: record.passed,
        solutionViewed: record.solutionViewed === true,
      };
    }
    return result;
  } catch {
    return {};
  }
}
