import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import { compileExample } from "../src/playground/compiler";
import { formatValue } from "../src/playground/format";
import type { RuntimeEvent, RuntimePacket } from "../src/playground/types";
import { parseStudy, updateStoredStudy } from "../src/lib/study";
import { runtimeAssetPath } from "../src/playground/assets";
import { reactSandboxDocument } from "../src/playground/sandbox";
import release from "../package.json";
import { isRuntimeEvent } from "../src/playground/validate";

test("worker and React hosts request the current release's runtime assets", () => {
  const worker = new URL(runtimeAssetPath("worker-sandbox.html"), "https://example.test");
  assert.equal(worker.searchParams.get("v"), release.version);
  const html = reactSandboxDocument(
    "function App(){return null}",
    "versioned",
    false,
    "https://example.test",
  );
  const script = html.match(/<script[^>]*src="([^"]+)"/)?.[1];
  assert.ok(script);
  assert.equal(new URL(script).searchParams.get("v"), release.version);
  assert.equal(new URL(script).pathname.endsWith("/playground-assets/react-runtime.js"), true);
});

test("a stale study tab preserves another tab's saved lessons and notes", () => {
  let raw: string | null = null;
  const storage = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  const stale = parseStudy(null);
  updateStoredStudy(storage, stale, (previous) => ({
    ...previous,
    saved: ["event-loop"],
    notes: { "event-loop": "Keep this note" },
  }));
  const result = updateStoredStudy(storage, stale, (previous) => ({
    ...previous,
    completed: ["render-and-commit"],
  }));
  assert.deepEqual(result.study.saved, ["event-loop"]);
  assert.equal(result.study.notes["event-loop"], "Keep this note");
  assert.deepEqual(result.study.completed, ["render-and-commit"]);
  assert.equal(result.storageError, false);
});
test("failed persistence keeps session edits until a later successful write", () => {
  const blocked = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Quota");
    },
  };
  const first = updateStoredStudy(blocked, parseStudy(null), (previous) => ({
    ...previous,
    notes: { "event-loop": "Unsaved note" },
  }));
  assert.equal(first.storageError, true);
  let raw: string | null = null;
  const recovered = {
    getItem: () => raw,
    setItem: (_key: string, value: string) => {
      raw = value;
    },
  };
  const second = updateStoredStudy(
    recovered,
    first.study,
    (previous) => ({ ...previous, saved: ["event-loop"] }),
    true,
  );
  assert.equal(second.storageError, false);
  assert.equal(parseStudy(raw).notes["event-loop"], "Unsaved note");
  assert.deepEqual(parseStudy(raw).saved, ["event-loop"]);
});

test("React rejects unsupported top-level awaits before creating a broken document", () => {
  assert.throws(
    () => compileExample("await Promise.resolve(); function App(){return null}", "react"),
    /entry is synchronous/,
  );
  assert.throws(
    () => compileExample("for await (const value of []) {} function App(){return null}", "react"),
    /entry is synchronous/,
  );
  assert.doesNotThrow(() =>
    compileExample(
      "function App(){async function handle(){await Promise.resolve()} return <button onClick={handle}>Run</button>}",
      "react",
    ),
  );
});

function execute(source: string) {
  return new Promise<{ events: RuntimeEvent[]; error?: string }>((resolve, reject) => {
    const worker = new Worker(new URL("./runtime-harness.mjs", import.meta.url));
    const events: RuntimeEvent[] = [];
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("Runtime timeout"));
    }, 5000);
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
    worker.postMessage({
      runId: "regression",
      mode: "event-loop",
      code: compileExample(source, "event-loop"),
    });
  });
}
test("large valid logs, identifiers, and cache keys remain visible within validated packets", async () => {
  const name = "f".repeat(6000);
  const result = await execute(
    `console.log('a'.repeat(2000),'b'.repeat(2000),'c'.repeat(2000)); function ${name}(){console.log('called');} ${name}(); const key='k'.repeat(6000); cache.set(key,7,1); console.log(cache.get(key).value); await sleep(-Infinity);`,
  );
  assert.equal(result.error, undefined);
  assert.ok(result.events.every(isRuntimeEvent));
  const logs = result.events.filter((event) => event.kind === "console");
  assert.equal(logs[0].label.length, 5000);
  assert.ok(logs[0].label.endsWith("…"));
  assert.equal(logs.at(-1)?.label, "7");
});
test("logical clock and expiry arithmetic reject overflow without poisoning snapshots", async () => {
  const result = await execute(
    "clock.advance(Number.MAX_VALUE); try{clock.advance(Number.MAX_VALUE)}catch(error){console.log(error.name)} try{cache.set('key',1,Number.MAX_VALUE)}catch(error){console.log(error.name)}",
  );
  assert.equal(result.error, undefined);
  assert.ok(result.events.every(isRuntimeEvent));
  assert.deepEqual(
    result.events.filter((event) => event.kind === "console").map((event) => event.label),
    ["RangeError", "RangeError"],
  );
});
test("worker timer callbacks receive the worker global receiver", async () => {
  const result = await execute(
    "await new Promise(resolve => setTimeout(function(){ console.log(this === globalThis); resolve(); }, 0));",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.find((event) => event.kind === "console")?.label, "true");
});
test("fired one-shot timers cannot be retroactively cancelled in the recording", async () => {
  const result = await execute(
    "const timer = setTimeout(() => { clearTimeout(timer); console.log('fired'); }, 0);",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.filter((event) => event.kind === "timer:cancel").length, 0);
  assert.equal(result.events.at(-1)?.snapshot?.timers.length, 0);
});
test("interval receivers and arguments survive wrapping and timer clear APIs share handles", async () => {
  const result = await execute(
    "await new Promise(resolve => {const timer = setInterval(function(a,b){console.log(this===globalThis,a,b);clearTimeout(timer);resolve();},0,'argument',2);});",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.find((event) => event.kind === "console")?.label, "true argument 2");
  assert.equal(result.events.at(-1)?.snapshot?.timers.length, 0);
});
test("a caught rejected await resumes its logical function frame", async () => {
  const result = await execute(
    "async function work(){ try { await Promise.reject('expected'); } catch { console.log('caught'); } } await work();",
  );
  assert.equal(result.error, undefined);
  const observed = result.events.find((event) => event.kind === "console");
  assert.equal(
    observed?.snapshot?.frames.find((frame) => frame.name === "work")?.status,
    "running",
  );
});
test("invalid promise receivers do not leave nonexistent registered reactions", async () => {
  const result = await execute(
    "try { Promise.prototype.then.call({}); } catch { console.log('rejected'); }",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.at(-1)?.snapshot?.reactions.length, 0);
});
test("queueMicrotask rejects non-callable input synchronously", async () => {
  const result = await execute(
    "try { queueMicrotask(null); console.log('accepted'); } catch(error) { console.log(error.name); }",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.find((event) => event.kind === "console")?.label, "TypeError");
});
test("console snapshots distinguish holes, explicit undefined, and custom array properties", () => {
  const sparse = new Array(3);
  sparse[2] = "x";
  assert.equal(formatValue(sparse), '[<empty>,<empty>,"x"]');
  assert.equal(formatValue([undefined]), "[undefined]");
  const decorated = Object.assign([1], { label: "kept" });
  assert.equal(formatValue(decorated), '[1] {"label":"kept"}');
});
test("console snapshots expose collection entries and accurate primitive/error names", () => {
  assert.equal(formatValue(new Map([["a", 1]])), 'Map {"a" => 1}');
  assert.equal(formatValue(new Set([1, 2])), "Set {1,2}");
  assert.equal(formatValue(-0), "-0");
  assert.equal(formatValue(new RangeError("limit")), "RangeError: limit");
});
test("console snapshots preserve symbol keys and never call collection overrides", () => {
  assert.equal(formatValue({ [Symbol("token")]: 1 }), "{[Symbol(token)]:1}");
  const map = new Map([["a", 1]]);
  map.entries = () => {
    throw new Error("User override must not run");
  };
  map[Symbol.iterator] = map.entries;
  assert.equal(formatValue(map), 'Map {"a" => 1}');
  const cycle = new Set<unknown>();
  cycle.add(cycle);
  assert.equal(formatValue(cycle), "Set {[Circular]}");
  assert.equal(formatValue(new Date("invalid")), "Invalid Date");
  assert.equal(formatValue(new Date("2026-01-01T00:00:00Z")), 'Date("2026-01-01T00:00:00.000Z")');
  assert.ok(formatValue(new Array(1_000_000)).length < 300);
});
test("finally after rejected await resumes before observing native completion", async () => {
  const result = await execute(
    "async function work(){ try { await Promise.reject('expected'); } finally { console.log('cleanup'); } } try { await work(); } catch { console.log('recovered'); }",
  );
  assert.equal(result.error, undefined);
  const observed = result.events.find((event) => event.kind === "console");
  assert.equal(
    observed?.snapshot?.frames.find((frame) => frame.name === "work")?.status,
    "running",
  );
  assert.deepEqual(
    result.events.filter((event) => event.kind === "console").map((event) => event.label),
    ["cleanup", "recovered"],
  );
});

test("timer delay conversion rejects BigInt primitives and conversion hooks before registration", async () => {
  const result = await execute(
    "for (const delay of [1n, {[Symbol.toPrimitive](){return 1n}}, Symbol('delay')]) { try { setTimeout(()=>console.log('unexpected'), delay); } catch(error) { console.log(error.name); } }",
  );
  assert.equal(result.error, undefined);
  assert.deepEqual(
    result.events.filter((event) => event.kind === "console").map((event) => event.label),
    ["TypeError", "TypeError", "TypeError"],
  );
  assert.equal(result.events.filter((event) => event.kind === "timer:register").length, 0);
});
test("failing Promise species construction leaves no registered reaction", async () => {
  const result = await execute(
    "const promise = Promise.resolve(1); promise.constructor = {[Symbol.species]: function(){throw new Error('species');}}; try { promise.then(); } catch { console.log('caught'); }",
  );
  assert.equal(result.error, undefined);
  assert.equal(result.events.at(-1)?.snapshot?.reactions.length, 0);
});
