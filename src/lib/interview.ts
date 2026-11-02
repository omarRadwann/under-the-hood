import { interviewQuestions, sprintSessions } from "../content/interview";

export const INTERVIEW_KEY = "uth.interview.v1";
export const blockIds = sprintSessions.flatMap((session) =>
  session.blocks.map((block) => session.id + "/" + block.id),
);
export interface Rehearsal {
  text: string;
  score?: number;
  consulted: boolean;
}
export interface InterviewState {
  version: 1;
  target: string;
  budget: 120 | 180 | 240;
  completed: string[];
  answers: Record<string, Rehearsal>;
  retrospective: string;
}
export function blankInterview(): InterviewState {
  return { version: 1, target: "", budget: 120, completed: [], answers: {}, retrospective: "" };
}
export function dateEpoch(day: string): number | null {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, date] = day.split("-").map(Number);
  const value = Date.UTC(year, month - 1, date);
  return new Date(value).toISOString().slice(0, 10) === day ? value : null;
}
export function calendarDay(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function nextThursday(today: string): string {
  const epoch = dateEpoch(today);
  if (epoch === null) throw new RangeError("Invalid calendar date");
  return new Date(epoch + ((4 - new Date(epoch).getUTCDay() + 7) % 7) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function daysUntil(today: string, target: string): number | null {
  const start = dateEpoch(today),
    end = dateEpoch(target);
  return start === null || end === null ? null : (end - start) / 86400000;
}
export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function parseInterview(raw: string | null): InterviewState {
  const result = blankInterview();
  if (!raw || raw.length > 300000) return result;
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return result;
    if (typeof data.target === "string" && dateEpoch(data.target) !== null)
      result.target = data.target;
    if ([120, 180, 240].includes(data.budget)) result.budget = data.budget;
    if (Array.isArray(data.completed))
      result.completed = [
        ...new Set<string>(
          data.completed.filter(
            (id: unknown): id is string => typeof id === "string" && blockIds.includes(id),
          ),
        ),
      ];
    if (data.answers && typeof data.answers === "object")
      for (const question of interviewQuestions) {
        if (!Object.hasOwn(data.answers, question.id)) continue;
        const item = data.answers[question.id];
        if (!item || typeof item !== "object") continue;
        result.answers[question.id] = {
          text: typeof item.text === "string" ? item.text.slice(0, 6000) : "",
          consulted: item.consulted === true,
          ...(Number.isInteger(item.score) && item.score >= 0 && item.score <= 3
            ? { score: item.score }
            : {}),
        };
      }
    if (typeof data.retrospective === "string")
      result.retrospective = data.retrospective.slice(0, 6000);
  } catch {
    /* Keep the workspace usable when local data is malformed. */
  }
  return result;
}
