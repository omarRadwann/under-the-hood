import test from "node:test";
import assert from "node:assert/strict";
import {
  interviewQuestions,
  codingDrills,
  sprintSessions,
  mockStages,
} from "../src/content/interview";
import { exercises } from "../src/content/training";
import { getLesson } from "../src/content";
import {
  blankInterview,
  parseInterview,
  nextThursday,
  daysUntil,
  dateEpoch,
  remainingSeconds,
} from "../src/lib/interview";
import { updateStoredValue } from "../src/lib/local-state";

test("the interview curriculum has resolved practice/lesson links and complete discussion guides", () => {
  assert.equal(interviewQuestions.length, 25);
  assert.equal(new Set(interviewQuestions.map((q) => q.id)).size, 25);
  for (const question of interviewQuestions) {
    assert.equal(question.guide.length, 4, question.id);
    assert.ok(question.followUps.length >= 2 && question.traps.length >= 2, question.id);
    for (const slug of question.lessons) assert.ok(getLesson(slug), `${question.id}: ${slug}`);
    if (question.exercise)
      assert.ok(
        exercises.some((exercise) => exercise.id === question.exercise),
        `${question.id}: ${question.exercise}`,
      );
  }
  assert.equal(codingDrills.length, 8);
  for (const drill of codingDrills)
    assert.ok(exercises.some((exercise) => exercise.id === drill.id));
  for (const session of sprintSessions) {
    assert.equal(
      session.blocks.reduce((sum, block) => sum + block.minutes, 0),
      120,
      session.id,
    );
    for (const block of session.blocks) {
      if ("question" in block) assert.ok(interviewQuestions.some((q) => q.id === block.question));
      if ("exercise" in block)
        assert.ok(
          exercises.some((e) => e.id === block.exercise),
          String(block.exercise),
        );
    }
  }
  assert.equal(
    mockStages.reduce((sum, stage) => sum + stage.minutes, 0),
    60,
  );
});
test("calendar arithmetic uses whole calendar days including leap/year boundaries", () => {
  assert.equal(nextThursday("2026-11-02"), "2026-11-05");
  assert.equal(nextThursday("2026-11-05"), "2026-11-05");
  assert.equal(nextThursday("2026-12-31"), "2026-12-31");
  assert.equal(daysUntil("2026-11-02", "2026-11-05"), 3);
  assert.equal(daysUntil("2026-03-28", "2026-03-30"), 2);
  assert.equal(daysUntil("2024-02-28", "2024-03-01"), 2);
  assert.equal(dateEpoch("2026-02-29"), null);
  assert.equal(dateEpoch("2026-11-31"), null);
  assert.equal(daysUntil("invalid", "2026-11-05"), null);
});
test("the timer catches up after a background interval without going negative", () => {
  assert.equal(remainingSeconds(100000, 1000), 99);
  assert.equal(remainingSeconds(100000, 99999), 1);
  assert.equal(remainingSeconds(100000, 104000), 0);
});
test("interview storage validates known IDs and preserves rating zero", () => {
  assert.deepEqual(parseInterview("broken"), blankInterview());
  const state = parseInterview(
    JSON.stringify({
      version: 1,
      target: "2026-11-05",
      budget: 999,
      completed: ["language/warmup", "unknown", "language/warmup"],
      answers: {
        "js-order": { text: "x".repeat(7000), score: 0, consulted: true },
        "js-values": { text: 8, score: 4 },
        unknown: { text: "bad" },
      },
      retrospective: "r",
    }),
  );
  assert.equal(state.budget, 120);
  assert.deepEqual(state.completed, ["language/warmup"]);
  assert.equal(state.answers["js-order"].score, 0);
  assert.equal(state.answers["js-order"].text.length, 6000);
  assert.equal(state.answers["js-values"].score, undefined);
  assert.equal(state.answers.unknown, undefined);
});
test("editing one rehearsal from a stale tab preserves another question's answer", () => {
  let stored = JSON.stringify({
    ...blankInterview(),
    answers: { "js-order": { text: "first tab", score: 2, consulted: false } },
  });
  const storage = {
    getItem: () => stored,
    setItem: (_key: string, value: string) => {
      stored = value;
    },
  };
  const result = updateStoredValue({
    storage,
    key: "interview",
    parse: parseInterview,
    fallback: blankInterview(),
    change: (previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        "js-values": { text: "second tab", score: 1, consulted: false },
      },
    }),
  });
  assert.equal(result.value.answers["js-order"].text, "first tab");
  assert.equal(result.value.answers["js-values"].text, "second tab");
});
