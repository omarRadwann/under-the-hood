/** Keep saved work and older deep links usable after the public naming cleanup. */
export function canonicalExerciseId(id: string): string {
  return id.replace(/^interview-/, "algorithm-");
}
export function legacyExerciseId(id: string): string {
  return id.replace(/^algorithm-/, "interview-");
}

export function readTrainingDraft(storage: Pick<Storage, "getItem">, id: string): string | null {
  const canonical = canonicalExerciseId(id);
  return (
    storage.getItem("uth.training.draft.v1." + canonical) ??
    storage.getItem("uth.training.draft.v1." + legacyExerciseId(canonical))
  );
}
