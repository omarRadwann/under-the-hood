import { lesson } from "../helpers";
import { technicalNotes } from "./technical-notes";
type Input = Parameters<typeof lesson>[1];
export const js = (input: Input) =>
  lesson("javascript", {
    language: "javascript",
    execution: "worker",
    minutes: 30,
    ...input,
    steps: [...input.steps, ...(technicalNotes[input.slug] ?? [])],
  });
export const asyncJS = (input: Input) =>
  lesson("async", { language: "javascript", execution: "worker", minutes: 35, ...input });
