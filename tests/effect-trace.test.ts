import test from "node:test";
import assert from "node:assert/strict";
import type { EffectCallback } from "react";
import { observeEffect } from "../src/playground/effect-trace";

test("effect observation preserves invalid returns so React can report the learner's error", () => {
  for (const result of [42, null, Promise.resolve()]) {
    const effect = (() => result) as unknown as EffectCallback;
    assert.equal(
      observeEffect(
        effect,
        () => {},
        () => {},
      )(),
      result,
    );
  }
});

test("effect observation records setup and real cleanup while preserving setup failures", () => {
  const events: string[] = [];
  const cleanup = observeEffect(
    () => {
      events.push("effect");
      return () => {
        events.push("cleanup");
      };
    },
    () => events.push("setup observed"),
    () => events.push("cleanup observed"),
  )();
  assert.deepEqual(events, ["setup observed", "effect"]);
  assert.equal(typeof cleanup, "function");
  if (typeof cleanup === "function") cleanup();
  assert.deepEqual(events, ["setup observed", "effect", "cleanup observed", "cleanup"]);
  const error = new Error("Setup failed");
  assert.throws(
    observeEffect(
      () => {
        throw error;
      },
      () => {},
      () => assert.fail("No cleanup was acquired"),
    ),
    (value) => value === error,
  );
});
