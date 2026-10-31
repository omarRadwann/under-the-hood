import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { compileExample } from "../src/playground/compiler";
import { presets } from "../src/playground/presets";
import { formatValue } from "../src/playground/format";
import { reactSandboxDocument } from "../src/playground/sandbox";
import { isRuntimeEvent } from "../src/playground/validate";
import { javascriptCourse } from "../src/content/js-course";
import type { RuntimePacket, RuntimeEvent, PlaygroundMode } from "../src/playground/types";

function execute(
  source: string,
  mode: PlaygroundMode = "event-loop",
): Promise<{ events: RuntimeEvent[]; error?: string }> {
  const code = compileExample(source, mode);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./runtime-harness.mjs", import.meta.url));
    const events: RuntimeEvent[] = [];
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("Worker test timed out"));
    }, 4000);
    worker.on("error", (error) => {
      clearTimeout(timer);
      void worker.terminate();
      reject(error);
    });
    worker.on("message", (packet: RuntimePacket) => {
      if (packet.type === "event" && packet.event) events.push(packet.event);
      if (packet.type === "done" || packet.type === "error") {
        clearTimeout(timer);
        void worker.terminate();
        resolve({ events, error: packet.type === "error" ? packet.message : undefined });
      }
    });
    worker.postMessage({ runId: "test", code, mode });
  });
}

test("every starter compiles, including TSX imports and JSX", () => {
  for (const preset of presets) {
    const code = compileExample(preset.source, preset.mode);
    assert.ok(code.includes("__trace"), preset.id);
    new Function("React", "__trace", "__uthApp", `return (async () => {\n${code}\n})();`);
  }
});

test("all 36 self-contained new course programs execute in a fresh runtime", async () => {
  const chapters = javascriptCourse.filter((chapter) => chapter.execution === "worker");
  assert.equal(chapters.length, 36);
  for (const chapter of chapters) {
    const result = await execute(chapter.code);
    assert.equal(result.error, undefined, `${chapter.slug}: ${result.error}`);
    assert.ok(
      result.events.some((e) => e.kind === "console"),
      chapter.slug,
    );
    if (chapter.output)
      assert.equal(
        result.events
          .filter((e) => e.kind === "console")
          .map((e) => e.label)
          .join("\n"),
        chapter.output,
        chapter.slug,
      );
  }
});

test("derived fields initialize after the base constructor's virtual call", async () => {
  const result = await execute(
    javascriptCourse.find((c) => c.slug === "classes-and-construction")!.code,
  );
  assert.deepEqual(
    result.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["during base: undefined", "ready 1"],
  );
});

test("lazy iterator helpers consume three values and close their producer", async () => {
  const result = await execute(presets.find((p) => p.id === "iterator-helpers")!.source);
  assert.equal(result.error, undefined);
  assert.deepEqual(
    result.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["produce: 1", "produce: 2", "produce: 3", "producer closed", "results: [2,4,6]"],
  );
});

test("async generator early exit performs native producer cleanup", async () => {
  const result = await execute(
    javascriptCourse.find((c) => c.slug === "async-iteration-and-cancellation")!.code,
  );
  assert.equal(result.error, undefined);
  assert.deepEqual(
    result.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["received: 1", "producer closed"],
  );
});
test("edited event-loop source determines the actual output", async () => {
  const run = await execute(
    "console.log('edited'); setTimeout(() => console.log('task'), 0); queueMicrotask(() => console.log('micro')); console.log('sync');",
  );
  assert.equal(run.error, undefined);
  assert.ok(run.events.filter((e) => e.kind === "timer:start").every((e) => e.line === null));
  assert.deepEqual(
    run.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["edited", "sync", "micro", "task"],
  );
});

test("empty and type-only worker programs execute as valid no-ops", async () => {
  for (const source of ["", "type Example = { id: string };"]) {
    const result = await execute(source);
    assert.equal(result.error, undefined);
    assert.equal(result.events.filter((e) => e.kind === "console").length, 0);
  }
});
test("await instrumentation preserves native continuation ordering and values", async () => {
  const run = await execute(
    "async function f(){ console.log('prefix'); const n = await 7; console.log(n); } const p=f(); console.log('caller'); await p;",
  );
  assert.equal(run.error, undefined);
  assert.deepEqual(
    run.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["prefix", "caller", "7"],
  );
  assert.ok(run.events.some((e) => e.kind === "await"));
  assert.ok(run.events.some((e) => e.kind === "resume"));
});
test("promise rejection recovery and value propagation remain correct", async () => {
  const run = await execute(presets.find((p) => p.id === "errors")!.source);
  assert.equal(run.error, undefined);
  assert.deepEqual(
    run.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["start", "recovered: deliberate failure", "fulfilled: 7"],
  );
});
test("cache algorithm edits change the store and origin outcomes", async () => {
  const run = await execute(presets.find((p) => p.id === "cache-aside")!.source, "cache");
  assert.equal(run.error, undefined);
  const logs = run.events.filter((e) => e.kind === "console").map((e) => e.label);
  assert.ok(logs.includes('before expiry: {"price":100}'));
  assert.ok(logs.includes('after expiry: {"price":125}'));
  assert.equal(run.events.at(-1)?.snapshot?.clock, 1100);
});
test("the stale refill race is observed from executed asynchronous operations", async () => {
  const run = await execute(presets.find((p) => p.id === "refill-race")!.source, "cache");
  assert.equal(run.error, undefined);
  const last = run.events.at(-1)?.snapshot;
  assert.equal(last?.origin[0].value, '{"price":125}');
  assert.equal(last?.cache[0].value, '{"price":100}');
});
test("single-flight issues one origin read for simultaneous callers", async () => {
  const run = await execute(presets.find((p) => p.id === "single-flight")!.source, "cache");
  assert.equal(run.error, undefined);
  assert.equal(run.events.filter((e) => e.kind === "origin:read").length, 1);
});
test("infinite loops fail within the instruction budget", async () => {
  const run = await execute("while (true) {}");
  assert.match(run.error ?? "", /budget exceeded/i);
});
test("syntax errors and unsupported imports produce explicit errors", () => {
  assert.throws(() => compileExample("const = ;", "event-loop"));
  assert.throws(
    () => compileExample("import x from 'untrusted-package'", "react"),
    /imports from 'react'/,
  );
  assert.throws(
    () => compileExample("const x = import('https://example.com/x.js');", "event-loop"),
    /Dynamic imports/,
  );
});

test("console snapshots do not invoke ordinary getters or toJSON", () => {
  let calls = 0;
  const value = {
    get secret() {
      calls++;
      return "unexpected";
    },
    toJSON() {
      calls++;
      return {};
    },
    count: 7,
  };
  assert.match(formatValue(value), /Accessor/);
  assert.match(formatValue(value), /"count":7/);
  assert.equal(calls, 0);
  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.match(formatValue(circular), /Circular/);
  const shared = { price: 100 };
  assert.equal(formatValue([shared, shared]), '[{"price":100},{"price":100}]');
});

test("malformed runtime packets cannot crash snapshot validation", () => {
  const base = { sequence: 0, kind: "console", label: "ok", line: null, time: 1 };
  assert.ok(isRuntimeEvent(base));
  assert.equal(isRuntimeEvent({ ...base, time: NaN }), false);
  assert.equal(isRuntimeEvent({ ...base, snapshot: { frames: [null] } }), false);
  assert.equal(isRuntimeEvent({ ...base, detail: { bad: true } }), false);
  assert.equal(isRuntimeEvent({ ...base, label: "x".repeat(5001) }), false);
});

test("sandbox source escaping preserves script-like string case", () => {
  const html = reactSandboxDocument(
    'const value="</ScRiPt>";',
    "run",
    false,
    "http://localhost:3000",
  );
  assert.ok(html.includes("<\\/ScRiPt>"));
  assert.ok(html.includes("connect-src 'none'"));
});

test("static worker host has a verified CSP hash and blocks network access", () => {
  const document = readFileSync("public/playground-assets/worker-sandbox.html", "utf8");
  const script = document.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script);
  const hash = createHash("sha256").update(script).digest("base64");
  assert.ok(document.includes(`'sha256-${hash}'`));
  assert.ok(document.includes("connect-src 'none'"));
  assert.ok(document.includes("worker-src blob:"));
  assert.ok(document.includes("event.source!==parent||started"));
  // The embedded runtime is data inside the host script, never a second HTML script.
  assert.equal(document.match(/<script>/g)?.length, 1);
});

test("thenable adoption follows actual getter and job ordering", async () => {
  const result = await execute(presets.find((p) => p.id === "assimilation")!.source);
  assert.deepEqual(
    result.events.filter((e) => e.kind === "console").map((e) => e.label),
    [
      "get then: synchronous",
      "end of script",
      "invoke then: job",
      "explicit microtask",
      "adopted value",
    ],
  );
});

test("new runs isolate global and cache state; clearing timers prevents callbacks", async () => {
  const first = await execute(
    "globalThis.example = 7; cache.set('key', 1, 100); const timer=setTimeout(()=>console.log('unexpected'),0); clearTimeout(timer); console.log('first');",
    "cache",
  );
  assert.deepEqual(
    first.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["first"],
  );
  const second = await execute(
    "console.log(typeof globalThis.example, cache.get('key'));",
    "cache",
  );
  assert.deepEqual(
    second.events.filter((e) => e.kind === "console").map((e) => e.label),
    ["undefined undefined"],
  );
});
