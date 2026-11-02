import { discussionQuestions, learningTracks } from "../content/workshop";

export const WORKSHOP_KEY = "uth.workshop.v1";
const legacyKey = "uth.interview.v1";
export const blockIds = learningTracks.flatMap((track) =>
  track.blocks.map((block) => track.id + "/" + block.id),
);
export interface Reflection {
  text: string;
  score?: number;
  consulted: boolean;
}
export interface WorkshopState {
  version: 1;
  completed: string[];
  answers: Record<string, Reflection>;
  retrospective: string;
}
export function blankWorkshop(): WorkshopState {
  return { version: 1, completed: [], answers: {}, retrospective: "" };
}
export function parseWorkshop(raw: string | null): WorkshopState {
  const result = blankWorkshop();
  if (!raw || raw.length > 300000) return result;
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return result;
    if (Array.isArray(data.completed))
      result.completed = [
        ...new Set<string>(
          data.completed
            .map((id: unknown) => (id === "systems/mock" ? "systems/integration" : id))
            .filter((id: unknown): id is string => typeof id === "string" && blockIds.includes(id)),
        ),
      ];
    if (data.answers && typeof data.answers === "object")
      for (const question of discussionQuestions) {
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
    /* Malformed local data must not break the learning workspace. */
  }
  return result;
}
/** Import learning notes only; obsolete planning metadata is never retained or exported. */
export function readWorkshop(storage: Pick<Storage, "getItem">): WorkshopState {
  return parseWorkshop(storage.getItem(WORKSHOP_KEY) ?? storage.getItem(legacyKey));
}
export function isWorkshopStorageKey(key: string | null): boolean {
  return key === null || key === WORKSHOP_KEY || key === legacyKey;
}
