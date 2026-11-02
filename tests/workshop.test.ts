import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  discussionQuestions,
  codingDrills,
  learningTracks,
  commandStages,
} from "../src/content/workshop";
import { exercises } from "../src/content/training";
import { getLesson } from "../src/content";
import {
  blankWorkshop,
  blockIds,
  parseWorkshop,
  readWorkshop,
  WORKSHOP_KEY,
} from "../src/lib/workshop";
import { canonicalExerciseId, legacyExerciseId, readTrainingDraft } from "../src/lib/exercise-ids";
import { updateStoredValue } from "../src/lib/local-state";
import { parseTraining } from "../src/lib/training";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("workshop discussions, learning tracks, and coding drills have valid distinct targets", () => {
  assert.equal(discussionQuestions.length, 25);
  assert.equal(new Set(discussionQuestions.map((question) => question.id)).size, 25);
  for (const question of discussionQuestions) {
    assert.ok(question.guide.length >= 4, question.id);
    assert.ok(question.followUps.length >= 2, question.id);
    assert.ok(question.traps.length >= 2, question.id);
    for (const slug of question.lessons) assert.ok(getLesson(slug), slug);
    if (question.exercise)
      assert.ok(exercises.some((exercise) => exercise.id === question.exercise));
  }
  assert.equal(codingDrills.length, 8);
  const selected = codingDrills.map((drill) =>
    exercises.find((exercise) => exercise.id === drill.id)!,
  );
  assert.ok(selected.every(Boolean));
  assert.equal(
    selected.reduce((sum, exercise) => sum + exercise.checks.length, 0),
    32,
  );
  assert.equal(learningTracks.length, 3);
  assert.equal(blockIds.length, 14);
  assert.equal(new Set(blockIds).size, 14);
  for (const track of learningTracks)
    for (const block of track.blocks) {
      if ("exercise" in block)
        assert.ok(exercises.some((exercise) => exercise.id === block.exercise));
      if ("question" in block)
        assert.ok(discussionQuestions.some((question) => question.id === block.question));
    }
  assert.equal(commandStages.length, 6);
});

test("public workshop has no role-specific or scheduled preparation features", () => {
  const sources = [
    JSON.stringify({ discussionQuestions, codingDrills, learningTracks, commandStages }),
    readFileSync("src/components/workshop-hub.tsx", "utf8"),
    readFileSync("README.md", "utf8"),
    readFileSync("WORKSHOP.md", "utf8"),
  ].join("\n");
  assert.doesNotMatch(
    sources,
    /interview|countdown|daily budget|timed mock|type="date"|role="timer"/i,
  );
  for (const track of learningTracks)
    for (const block of track.blocks) assert.equal("minutes" in block, false);
  for (const drill of codingDrills) assert.equal("minutes" in drill, false);
  const routeSource = readFileSync("src/app/[section]/page.tsx", "utf8");
  assert.ok(routeSource.includes('"workshop"'));
  assert.ok(!routeSource.includes('"interview"'));
});

test("workshop parsing imports learning records and discards obsolete planning metadata", () => {
  const id = discussionQuestions[0].id;
  const state = parseWorkshop(
    JSON.stringify({
      version: 1,
      target: "discarded legacy value",
      budget: 180,
      timer: { seconds: 900 },
      completed: [blockIds[0], blockIds[0], "unknown", "systems/mock"],
      answers: {
        [id]: { text: "My invariant", score: 0, consulted: true },
        unknown: { text: "discard" },
      },
      retrospective: "Test a counterexample",
    }),
  );
  assert.deepEqual(Object.keys(state).sort(), ["answers", "completed", "retrospective", "version"]);
  assert.deepEqual(state.completed, [blockIds[0], "systems/integration"]);
  assert.deepEqual(state.answers, { [id]: { text: "My invariant", score: 0, consulted: true } });
  assert.equal(state.retrospective, "Test a counterexample");
  assert.deepEqual(parseWorkshop("invalid"), blankWorkshop());
  assert.deepEqual(parseWorkshop('{"version":2}'), blankWorkshop());
  const bounded = parseWorkshop(
    JSON.stringify({
      version: 1,
      retrospective: "x".repeat(7000),
      answers: { [id]: { text: "x".repeat(7000), score: 4, consulted: "true" } },
    }),
  );
  assert.equal(bounded.retrospective.length, 6000);
  assert.equal(bounded.answers[id].text.length, 6000);
  assert.equal(bounded.answers[id].score, undefined);
  assert.equal(bounded.answers[id].consulted, false);
});

test("existing local notes survive migration and the current workspace takes precedence", () => {
  const storage = memoryStorage();
  const id = discussionQuestions[0].id;
  storage.setItem(
    "uth.interview.v1",
    JSON.stringify({
      ...blankWorkshop(),
      target: "old",
      answers: { [id]: { text: "Existing explanation", score: 0, consulted: true } },
    }),
  );
  const migrated = readWorkshop(storage);
  assert.equal(migrated.answers[id].text, "Existing explanation");
  assert.equal(migrated.answers[id].score, 0);
  storage.setItem(WORKSHOP_KEY, JSON.stringify({ ...migrated, retrospective: "New learning log" }));
  assert.equal(readWorkshop(storage).retrospective, "New learning log");
  assert.doesNotMatch(JSON.stringify(readWorkshop(storage)), /target|budget|timer/);
});

test("editing a different explanation preserves another tab's latest learning record", () => {
  const storage = memoryStorage();
  const first = discussionQuestions[0].id,
    second = discussionQuestions[1].id;
  const stale = blankWorkshop();
  storage.setItem(
    WORKSHOP_KEY,
    JSON.stringify({
      ...stale,
      answers: { [first]: { text: "Saved elsewhere", consulted: false, score: 0 } },
    }),
  );
  const result = updateStoredValue({
    storage,
    key: WORKSHOP_KEY,
    parse: parseWorkshop,
    fallback: stale,
    change: (previous) => ({
      ...previous,
      answers: { ...previous.answers, [second]: { text: "Another explanation", consulted: true } },
    }),
  });
  assert.equal(result.storageError, false);
  assert.equal(result.value.answers[first].text, "Saved elsewhere");
  assert.equal(result.value.answers[second].text, "Another explanation");
});

test("renamed coding links, empty drafts, and grading records preserve existing work", () => {
  const storage = memoryStorage();
  const exercise = exercises.find((item) => item.id === codingDrills[0].id)!;
  const oldId = legacyExerciseId(exercise.id);
  assert.equal(canonicalExerciseId(oldId), exercise.id);
  assert.equal(canonicalExerciseId("latest-owner"), "latest-owner");
  const prefix = "uth.training.draft.v1.";
  storage.setItem(
    prefix + oldId,
    JSON.stringify({ source: "old source", prediction: "existing reasoning" }),
  );
  assert.equal(
    JSON.parse(readTrainingDraft(storage, exercise.id)!).prediction,
    "existing reasoning",
  );
  storage.setItem(
    prefix + exercise.id,
    JSON.stringify({ source: "", prediction: "new reasoning" }),
  );
  assert.equal(JSON.parse(readTrainingDraft(storage, oldId)!).source, "");
  const record = {
    runs: 1,
    best: 4,
    total: exercise.checks.length,
    fingerprint: "abc",
    passed: 4,
    solutionViewed: false,
  };
  assert.deepEqual(
    parseTraining(JSON.stringify({ [oldId]: record }), exercises)[exercise.id],
    record,
  );
  assert.deepEqual(Object.keys(parseTraining(JSON.stringify({ [oldId]: record }), exercises)), [
    exercise.id,
  ]);
});
