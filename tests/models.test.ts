import test from "node:test";
import assert from "node:assert/strict";
import {
  cacheTransition,
  initialCache,
  initialUpload,
  uploadTransition,
  loopFrames,
} from "../src/lib/simulations";
import { lessons, getLesson } from "../src/content";
import { tracks } from "../src/lib/types";
import { parseStudy } from "../src/lib/study";
import { caseStudies } from "../src/content/case-studies";
import { jsPathSlugs, jsStages, jsCoverage, jsApiFamilies } from "../src/content/javascript-path";
import { javascriptCourse } from "../src/content/js-course";
import { lessonPlaygrounds, presets } from "../src/playground/presets";

test("every lesson has a unique valid route and a valid track", () => {
  assert.equal(lessons.length, 158);
  assert.equal(new Set(lessons.map((l) => l.slug)).size, lessons.length);
  for (const l of lessons) {
    assert.match(l.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(
      tracks.some((t) => t.id === l.track),
      l.slug,
    );
    assert.ok(l.steps.length >= 3 && l.steps.every((s) => s.title && s.body.length > 80), l.slug);
    assert.ok(l.code.length > 80 && l.practice.length > 40 && l.pitfalls.length >= 2, l.slug);
    assert.ok(l.quiz.answer >= 0 && l.quiz.answer < l.quiz.choices.length, l.slug);
    assert.ok(l.quiz.explanation.length > 30, l.slug);
    for (const source of l.sources) assert.equal(new URL(source.url).protocol, "https:");
  }
});

test("the six-stage JavaScript path covers every language/runtime chapter exactly once", () => {
  assert.equal(jsStages.length, 6);
  assert.equal(jsPathSlugs.length, 66);
  assert.equal(new Set(jsPathSlugs).size, 66);
  const expected = lessons
    .filter((l) => l.track === "javascript" || l.track === "async")
    .map((l) => l.slug);
  assert.deepEqual(new Set(jsPathSlugs), new Set(expected));
  assert.equal(jsPathSlugs[0], "language-and-hosts");
  for (const [index, slug] of jsPathSlugs.entries()) {
    for (const prerequisite of getLesson(slug)!.prerequisites ?? []) {
      const prerequisiteIndex = jsPathSlugs.indexOf(prerequisite);
      if (prerequisiteIndex >= 0)
        assert.ok(prerequisiteIndex < index, `${slug} must follow ${prerequisite}`);
    }
  }
  assert.equal(jsCoverage.length, 19);
  for (const area of jsCoverage) for (const slug of area.slugs) assert.ok(getLesson(slug), slug);
  for (const family of jsApiFamilies) assert.ok(getLesson(family.chapter), family.chapter);
});

test("new chapters have worked challenges, explicit environments, and valid runnable links", () => {
  assert.equal(javascriptCourse.length, 40);
  for (const chapter of javascriptCourse) {
    assert.ok(
      chapter.steps.length >= 4 &&
        chapter.challenge?.solution &&
        chapter.challenge.explanation.length > 80,
      chapter.slug,
    );
    assert.ok(chapter.execution, chapter.slug);
    for (const slug of chapter.prerequisites ?? [])
      assert.ok(getLesson(slug), `${chapter.slug} → ${slug}`);
    if (chapter.execution === "worker") {
      const target = lessonPlaygrounds[chapter.slug];
      assert.ok(target, chapter.slug);
      assert.equal(
        presets.find((p) => p.id === target.preset)?.source,
        getLesson(chapter.slug)!.code,
      );
    }
  }
});

test("advanced boundaries have explicit invariants and valid acyclic prerequisite links", () => {
  const advanced = lessons.filter((l) => l.invariant);
  assert.equal(advanced.length, 34);
  function visit(slug: string, path: string[] = []) {
    assert.ok(!path.includes(slug), `prerequisite cycle: ${[...path, slug].join(" → ")}`);
    const item = getLesson(slug);
    assert.ok(item, `missing prerequisite ${slug}`);
    for (const prerequisite of item.prerequisites ?? []) visit(prerequisite, [...path, slug]);
  }
  for (const item of advanced) {
    assert.ok(item.prerequisites?.length);
    visit(item.slug);
  }
  for (const item of lessons) visit(item.slug);
});

test("all architecture and pattern lessons state when to use, reconsider, and the tradeoff", () => {
  for (const l of lessons.filter((l) => ["architecture", "patterns"].includes(l.track))) {
    assert.ok(l.decision?.use && l.decision?.avoid && l.decision?.tradeoff, l.slug);
  }
});

test("all advanced failure investigations resolve to existing lessons", () => {
  assert.equal(Object.keys(caseStudies).length, 10);
  for (const [slug, c] of Object.entries(caseStudies)) {
    assert.ok(getLesson(slug), slug);
    assert.equal(c.timeline.length, 4);
    assert.ok(c.alternatives.length >= 3 && c.verification.length > 100 && c.signals.length > 100);
  }
});

test("event-loop trace agrees with actual run-to-completion and microtask ordering", async () => {
  const output: string[] = [];
  output.push("A");
  const timer = new Promise<void>((resolve) =>
    setTimeout(() => {
      output.push("B");
      resolve();
    }, 0),
  );
  Promise.resolve().then(() => {
    output.push("C");
    queueMicrotask(() => output.push("D"));
  });
  output.push("E");
  await timer;
  assert.deepEqual(output, ["A", "E", "C", "D", "B"]);
  assert.deepEqual(loopFrames.at(-1)?.output, output);
});

test("a cold cache read loads the authoritative version", () => {
  const loaded = cacheTransition(initialCache, "read", 15);
  assert.equal(loaded.cached, 1);
  assert.equal(loaded.hits, 0);
  assert.equal(loaded.requests, 1);
});

test("fresh TTL can still serve an old origin version", () => {
  let s = cacheTransition(initialCache, "read", 15);
  s = cacheTransition(s, "write", 15);
  s = cacheTransition(s, "read", 15);
  assert.equal(s.source, 2);
  assert.equal(s.cached, 1);
  assert.equal(s.hits, 1);
});

test("expiry at the boundary causes a refill rather than a hit", () => {
  let s = cacheTransition(initialCache, "read", 15);
  s = cacheTransition(s, "write", 15);
  for (let i = 0; i < 3; i++) s = cacheTransition(s, "tick", 15);
  s = cacheTransition(s, "read", 15);
  assert.equal(s.cached, 2);
  assert.equal(s.hits, 0);
  assert.equal(s.writtenAt, 15);
});

test("invalidation refills from origin on the next read", () => {
  let s = cacheTransition(initialCache, "read", 60);
  s = cacheTransition(s, "write", 60);
  s = cacheTransition(s, "invalidate", 60);
  assert.equal(s.cached, null);
  s = cacheTransition(s, "read", 60);
  assert.equal(s.cached, s.source);
});

test("changing refill TTL never retroactively extends or shortens the current entry", () => {
  let state = cacheTransition(initialCache, "read", 5);
  assert.equal(state.expiresAt, 5);
  state = cacheTransition(state, "write", 60);
  state = cacheTransition(state, "tick", 60);
  state = cacheTransition(state, "read", 60);
  assert.equal(state.cached, 2);
  assert.equal(state.hits, 0);
  assert.equal(state.expiresAt, 65);
  state = cacheTransition(state, "tick", 5);
  state = cacheTransition(state, "read", 5);
  assert.equal(state.hits, 1);
  assert.equal(state.expiresAt, 65);
});

test("cancelled operation cannot complete a newer workflow", () => {
  let s = uploadTransition(initialUpload, { type: "start" });
  const first = s.activeId!;
  s = uploadTransition(s, { type: "cancel" });
  s = uploadTransition(s, { type: "start" });
  const second = s.activeId!;
  assert.notEqual(first, second);
  s = uploadTransition(s, { type: "success", id: first });
  assert.equal(s.status, "uploading");
  assert.equal(s.activeId, second);
  s = uploadTransition(s, { type: "success", id: second });
  assert.equal(s.status, "success");
  assert.equal(s.activeId, null);
});

test("duplicate start and duplicate completion do not corrupt workflow identity", () => {
  let s = uploadTransition(initialUpload, { type: "start" });
  const id = s.activeId!;
  s = uploadTransition(s, { type: "start" });
  assert.equal(s.activeId, id);
  assert.equal(s.nextId, 2);
  s = uploadTransition(s, { type: "success", id });
  s = uploadTransition(s, { type: "fail", id });
  assert.equal(s.status, "success");
});

test("retry creates a new operation identity after failure", () => {
  let s = uploadTransition(initialUpload, { type: "start" });
  const id = s.activeId!;
  s = uploadTransition(s, { type: "fail", id });
  assert.equal(s.status, "failed");
  s = uploadTransition(s, { type: "start" });
  assert.equal(s.status, "uploading");
  assert.notEqual(s.activeId, id);
});

test("corrupt and unsupported browser storage recover without crashing", () => {
  for (const raw of [null, "{", "null", "42", '"x"'])
    assert.equal(parseStudy(raw).completed.length, 0);
});

test("stored progress validates routes and preserves only bounded string notes", () => {
  const result = parseStudy(
    JSON.stringify({
      completed: ["event-loop", "missing", "event-loop", 2],
      saved: ["nextjs-caching", "missing"],
      notes: { "event-loop": "x".repeat(30000), missing: "private", "nextjs-caching": 42 },
      lastLesson: "missing",
    }),
  );
  assert.deepEqual(result.completed, ["event-loop"]);
  assert.deepEqual(result.saved, ["nextjs-caching"]);
  assert.equal(result.notes["event-loop"].length, 20000);
  assert.equal(Object.keys(result.notes).length, 1);
  assert.equal(result.lastLesson, null);
});
