import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import { exercises, reviewDomains } from "../src/content/training";
import { lessons, getLesson } from "../src/content";
import { platform } from "../src/content/platform";
import { deepenedSlugs } from "../src/content/senior-depth";
import { arrangeQuiz } from "../src/lib/quiz";
import { parseCheck, parseTraining, sourceFingerprint, trainingHarness } from "../src/lib/training";
import { compileExample } from "../src/playground/compiler";
import type { RuntimePacket } from "../src/playground/types";

async function grade(source: string, exercise: (typeof exercises)[number]) {
  const code = compileExample(source, "event-loop") + trainingHarness(exercise);
  return new Promise<{ passed: number; reported: number; error?: string }>((resolve, reject) => {
    const worker = new Worker(new URL("./runtime-harness.mjs", import.meta.url));
    const results = new Map<number, boolean>();
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("Grading timed out: " + exercise.id));
    }, 5000);
    worker.on("error", (error) => {
      clearTimeout(timer);
      void worker.terminate();
      reject(error);
    });
    worker.on("message", (packet: RuntimePacket) => {
      if (packet.type === "event" && packet.event?.kind === "console") {
        const result = parseCheck(packet.event.label, exercise.checks.length);
        if (result) results.set(result.index, result.passed);
      }
      if (packet.type === "done" || packet.type === "error") {
        clearTimeout(timer);
        void worker.terminate();
        resolve({
          passed: [...results.values()].filter(Boolean).length,
          reported: results.size,
          error: packet.type === "error" ? packet.message : undefined,
        });
      }
    });
    worker.postMessage({ runId: "training-test", mode: "event-loop", code });
  });
}

test("every reference solution passes all 46 behavioral checks in a fresh native runtime", async () => {
  assert.equal(exercises.length, 12);
  assert.equal(
    exercises.reduce((sum, exercise) => sum + exercise.checks.length, 0),
    46,
  );
  for (const exercise of exercises) {
    const result = await grade(exercise.solution, exercise);
    assert.equal(result.error, undefined, exercise.id + ": " + result.error);
    assert.equal(result.reported, exercise.checks.length, exercise.id);
    assert.equal(result.passed, exercise.checks.length, exercise.id);
  }
});
test("each intentionally broken starter is caught by its actual behavioral checks", async () => {
  for (const exercise of exercises) {
    const result = await grade(exercise.starter, exercise);
    assert.equal(result.error, undefined, exercise.id);
    assert.equal(result.reported, exercise.checks.length, exercise.id);
    assert.ok(result.passed < exercise.checks.length, exercise.id + " incorrectly passed");
  }
});
test("training and competency links cover every track without dangling lesson references", () => {
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length);
  assert.equal(reviewDomains.length, 10);
  assert.deepEqual(
    new Set(reviewDomains.map((domain) => domain.track)),
    new Set(lessons.map((lesson) => lesson.track)),
  );
  for (const exercise of exercises)
    for (const slug of exercise.lessons) assert.ok(getLesson(slug), slug);
  for (const lesson of platform) {
    assert.ok(lesson.steps.length >= 5 && lesson.invariant && lesson.execution);
    for (const prerequisite of lesson.prerequisites ?? []) assert.ok(getLesson(prerequisite));
  }
  assert.equal(deepenedSlugs.length, 24);
  for (const slug of deepenedSlugs) {
    const steps = getLesson(slug)!.steps;
    assert.ok(steps.length >= 4, slug);
    assert.equal(
      new Set(steps.map((step) => step.title)).size,
      steps.length,
      slug + ": duplicate mechanism heading",
    );
  }
});
test("quiz arrangement preserves meaning and is stable without a fixed answer position", () => {
  const quiz = {
    question: "q",
    choices: ["wrong one", "correct", "wrong two"],
    answer: 1,
    explanation: "because",
  };
  for (const lesson of lessons) {
    const result = arrangeQuiz(quiz, lesson.slug);
    assert.deepEqual(result, arrangeQuiz(quiz, lesson.slug));
    assert.equal(result.choices[result.answer], "correct");
    assert.deepEqual(new Set(result.choices), new Set(quiz.choices));
  }
  const counts = [0, 0, 0];
  for (const lesson of lessons) counts[lesson.quiz.answer]++;
  assert.ok(
    counts.every((count) => count > 25),
    counts.join(","),
  );
});
test("malformed check reports and local training state cannot produce valid grades", () => {
  for (const label of [
    "x",
    "__UTH_CHECK__{",
    '__UTH_CHECK__{"index":99,"passed":true}',
    '__UTH_CHECK__{"index":0,"passed":"yes"}',
  ])
    assert.equal(parseCheck(label, 4), null);
  for (const value of [null, "{", "null", "[]", '{"presence-before-coercion":{"best":999}}'])
    assert.deepEqual(parseTraining(value, exercises), {});
  const record = {
    runs: 1,
    best: 4,
    total: 4,
    passed: 4,
    fingerprint: sourceFingerprint("code"),
    solutionViewed: true,
  };
  assert.deepEqual(
    parseTraining(
      JSON.stringify({ "presence-before-coercion": record, unknown: record }),
      exercises,
    ),
    { "presence-before-coercion": record },
  );
});
