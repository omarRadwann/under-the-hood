import type { Lesson } from "@/lib/types";
import verifiedOutputs from "./example-outputs.json";
import challengeOutputs from "./challenge-outputs.json";

const worker = new Set([
  "scope-and-closures",
  "hoisting-and-tdz",
  "values-and-equality",
  "objects-and-prototypes",
  "property-descriptors-and-proxies",
  "iterators-and-generators",
  "javascript-engine",
  "execution-context",
  "weak-references",
  "shapes-and-inline-caches",
  "binary-memory",
  "event-loop",
  "promises",
  "promise-assimilation",
  "async-await",
]);
const browser = new Set([
  "memory-and-garbage-collection",
  "cancellation-and-races",
  "workers-and-parallelism",
  "shared-memory-and-atomics",
]);
const node = new Set(["node-event-loop", "streams-and-backpressure", "async-context"]);
const writtenAnswers = new Set([
  "math-and-randomness",
  "modules-tooling-and-compatibility",
  "engine-optimization-investigation",
  "debounce-throttle-and-scheduling",
  "concurrency-limits-and-fairness",
  "dom-events-and-propagation",
]);
const patches: Record<string, Partial<Lesson>> = {
  "state-and-batching": {
    filename: "replacement-counter.tsx",
    context:
      "These are alternative Client Components. Mount either with fresh state; do not combine both update sequences into one handler.",
    code: "'use client';\nimport { useState } from 'react';\nexport function ReplacementCounter() {\n  const [count, setCount] = useState(0);\n  function increment() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n  return <button onClick={increment}>{count}</button>;\n}",
    files: [
      {
        name: "functional-counter.tsx",
        language: "typescript",
        code: "'use client';\nimport { useState } from 'react';\nexport function FunctionalCounter() {\n  const [count, setCount] = useState(0);\n  function increment() {\n    setCount(c => c + 1);\n    setCount(c => c + 1);\n    setCount(c => c + 1);\n  }\n  return <button onClick={increment}>{count}</button>;\n}",
      },
    ],
  },
  "effects-and-cleanup": {
    context:
      "Client hook integration. Import stable application getRoom and report functions; rendered data is also tagged with its room owner so a changed input never displays another room's result.",
    code: "'use client';\nimport { useEffect, useState } from 'react';\nfunction useRoom(roomId: string) {\n  const [record, setRecord] = useState<{ roomId: string; data: unknown } | null>(null);\n  useEffect(() => {\n    const controller = new AbortController();\n    let active = true;\n    async function load() {\n      try {\n        const data = await getRoom(roomId, controller.signal);\n        if (active) setRecord({ roomId, data });\n      } catch (error) {\n        if (!controller.signal.aborted) report(error);\n      }\n    }\n    void load();\n    return () => { active = false; controller.abort(); };\n  }, [roomId]);\n  return record?.roomId === roomId ? record.data : null;\n}",
  },
  "concurrent-rendering": {
    context:
      "Client Component integration. ResultList is an application component; its resource protocol determines whether it can suspend.",
    code: "'use client';\nimport { useState, useTransition } from 'react';\nfunction Search() {\n  const [text, setText] = useState('');\n  const [query, setQuery] = useState('');\n  const [pending, startTransition] = useTransition();\n  function change(value: string) {\n    setText(value);\n    startTransition(() => setQuery(value));\n  }\n  return <section>\n    <input aria-label='Search' value={text} onChange={event => change(event.target.value)} />\n    <p>{pending ? 'Updating results' : 'Results ready'}</p>\n    <ResultList query={query} />\n  </section>;\n}",
  },
  "memoization-and-context": {
    code: "'use client';\nimport { createContext, useMemo } from 'react';\nconst ThemeContext = createContext('dark');\nconst SessionContext = createContext<{ userId: string } | null>(null);\n// Independent providers can own independent update frequencies.\ntype Row = { id: string; rank: number };\nfunction RankedList({ rows }: { rows: readonly Row[] }) {\n  const sorted = useMemo(() => [...rows].sort((a, b) => b.rank - a.rank), [rows]);\n  return <ul>{sorted.map(row => <li key={row.id}>{row.rank}</li>)}</ul>;\n}\n// Profile before retaining this optimization; never mutate shared rows in place.",
  },
  "fiber-lanes-and-scheduling": {
    code: "'use client';\nimport { startTransition, useState } from 'react';\nfunction SearchPreview() {\n  const [input, setInput] = useState('');\n  const [query, setQuery] = useState('');\n  function change(value: string) {\n    setInput(value);\n    startTransition(() => setQuery(value));\n  }\n  return <section>\n    <input aria-label='Search' value={input} onChange={event => change(event.target.value)} />\n    <p>Result query: {query}</p>\n  </section>;\n}\n// Public scheduling API; no assumption about an internal lane number.",
  },
  "portals-refs-and-error-boundaries": {
    context:
      "Client-side portal placement only. The target #details-root must exist. A modal additionally needs an appropriate dialog/focus/dismissal implementation.",
    code: "'use client';\nimport { useEffect, useState, type ReactNode } from 'react';\nimport { createPortal } from 'react-dom';\nfunction DetailsPortal({ children }: { children: ReactNode }) {\n  const [target, setTarget] = useState<HTMLElement | null>(null);\n  useEffect(() => { setTarget(document.getElementById('details-root')); }, []);\n  // Server and first client render both return null; no render-time document read.\n  return target ? createPortal(<aside aria-label='Details'>{children}</aside>, target) : null;\n}",
  },
  "dates-and-intl": {
    code: "const instant = new Date('2026-10-31T12:00:00Z');\nconsole.log(instant.toISOString());\nconst utc = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', calendar: 'iso8601', numberingSystem: 'latn', year: 'numeric', hour: '2-digit', hourCycle: 'h23' });\nconst parts = utc.formatToParts(instant);\nconsole.log('UTC year/hour:', parts.find(part => part.type === 'year').value, parts.find(part => part.type === 'hour').value);\nconsole.log(Number.isNaN(new Date('invalid').getTime()));\n// Feature-test typeof globalThis.Temporal before using it.\n// Localized formatting is presentation, not a wire serialization.",
  },
  "resource-ownership": {
    code: "function withResource(resource, work) {\n  try { return work(resource); }\n  finally { resource.close(); }\n}\nconst resource = { close() { console.log('closed'); } };\nconsole.log(withResource(resource, () => 'result'));\n// work is synchronous. For async work, await inside the owning try.\n// Feature-test Symbol.dispose and runtime/syntax support separately.",
  },
  "dom-events-and-propagation": { lab: "events", output: "capture\ntarget\nbubble" },
  "n-plus-one": {
    context:
      "Application service body. ctx, authorization-aware repository functions, and domain types are supplied by the application.",
  },
  "javascript-engine": {
    code: "function add(a, b) { return a + b; }\nfor (let i = 0; i < 20; i++) add(i, 1);\nconsole.log(add(2, 3), add('total: ', 1));\n// Bounded semantic example, not evidence of optimization or tier thresholds.",
    context:
      "The instrumented run demonstrates outcomes. Profile an uninstrumented, representative workload to investigate engine tiers.",
  },
  "weak-references": {
    code: "const metadata = new WeakMap();\nconst key = {};\nmetadata.set(key, { measured: 7 });\nconsole.log(metadata.has(key), metadata.get(key).measured);\nmetadata.delete(key);\nconsole.log(metadata.has(key));\n// No enumeration or assertion about garbage-collection timing.",
  },
  promises: {
    code: "const loadProfile = () => Promise.resolve({ name: 'Ada' });\nconst loadPermissions = () => Promise.resolve(['read']);\nconst [profile, permissions] = await Promise.all([loadProfile(), loadPermissions()]);\nconsole.log(profile.name, permissions);\nconst outcomes = await Promise.allSettled([Promise.resolve('healthy'), Promise.reject('offline')]);\nconsole.log(outcomes);\n// Input operations start when called; the combinator observes them.",
  },
  "modules-and-bundlers": {
    execution: "node",
    filename: "consumer.mjs",
    language: "javascript",
    context:
      "Save these files in one directory and run node consumer.mjs. This verifies native ESM, not a bundler's chunk layout.",
    files: [
      {
        name: "counter.mjs",
        language: "javascript",
        code: "export let count = 0;\nexport function increment() { count++; }",
      },
      { name: "editor.mjs", language: "javascript", code: "export const label = 'editor loaded';" },
    ],
    code: "import { count, increment } from './counter.mjs';\nincrement();\nconsole.log(count);\nconst editor = await import('./editor.mjs');\nconsole.log(editor.label);",
    output: "1\neditor loaded",
  },
  "module-linking-and-cycles": {
    execution: "node",
    filename: "consumer.mjs",
    context:
      "Save all seven .mjs files together and run node consumer.mjs. The failing graph is loaded with import() so its rejection can be caught; a failing static dependency would prevent the importer body from running.",
    files: [
      {
        name: "counter.mjs",
        language: "javascript",
        code: "export let count = 0;\nexport function increment() { count++; }",
      },
    ],
    code: "import snapshotDefault, { count, increment, liveDefault } from './counter.mjs';\nimport * as counter from './counter.mjs';\nimport { readB } from './safe-a.mjs';\nimport { readA } from './safe-b.mjs';\nconst { count: snapshot } = counter;\nconsole.log(count);\nincrement();\nconsole.log(count, snapshot);\nconsole.log('default expression / binding:', snapshotDefault, liveDefault);\nconsole.log('safe cycle:', readB(), readA());\ntry { await import('./bad-a.mjs'); }\ncatch (error) { console.log('eager cycle:', error.name); }\nconsole.log('then export:', await import('./then-export.mjs'));",
    output:
      "0\n1 0\ndefault expression / binding: 0 1\nsafe cycle: B A\neager cycle: ReferenceError\nthen export: namespace adopted",
  },
  "modules-tooling-and-compatibility": {
    filename: "package.json",
    code: JSON.stringify(
      {
        type: "module",
        exports: { ".": { import: "./dist/index.js", require: "./dist/index.cjs" } },
      },
      null,
      2,
    ),
    context:
      "Illustrative package metadata. Both dist files must exist and be tested as the real packed artifact.",
  },
  "workers-and-parallelism": {
    filename: "main.mjs",
    language: "javascript",
    context:
      "Serve these two browser modules over HTTP(S), loading main.mjs with type=module. The main and worker globals are different execution environments.",
    files: [
      {
        name: "worker.mjs",
        language: "javascript",
        code: "self.onmessage = ({ data }) => {\n  self.postMessage({ id: data.id, bytes: data.buffer.byteLength });\n};",
      },
    ],
    code: "const worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });\nworker.onmessage = ({ data }) => {\n  console.log('worker bytes:', data.bytes);\n  worker.terminate();\n};\nconst buffer = new ArrayBuffer(1024);\nworker.postMessage({ id: 1, buffer }, [buffer]);\nconsole.log('sender bytes:', buffer.byteLength);",
    output: "sender bytes: 0\nworker bytes: 1024",
  },
  "node-event-loop": {
    filename: "event-loop.cjs",
    context:
      "Run this file with Node.js as CommonJS. __filename and require are CommonJS bindings; this is not an ESM or browser example.",
  },
  "streams-and-backpressure": {
    filename: "compress.mjs",
    context:
      "Run with Node.js and an existing events.ndjson input. The pipeline owns file streams; it is not a browser/worker playground program.",
  },
  "async-context": {
    context:
      "Node.js AsyncLocalStorage integration. doWork and logger are application-provided collaborators.",
  },
  "shared-memory-and-atomics": {
    context:
      "Browser SharedArrayBuffer availability normally requires cross-origin isolation (COOP/COEP). GitHub Pages does not supply those application response headers. Run in a suitable isolated browser deployment or Node.js.",
  },
  "cancellation-and-races": {
    context:
      "Browser fetch integration with an application API and synchronous commit callback. Check ownership at the actual state-write boundary.",
    code: "// One instance per search owner; commit must be synchronous.\nfunction createSearch(commit: (value: unknown) => void) {\n  let generation = 0;\n  return async (query: string, signal: AbortSignal) => {\n    const id = ++generation;\n    const response = await fetch('/api/search?q=' + encodeURIComponent(query), { signal });\n    if (!response.ok) throw new Error('Search failed');\n    const result = await response.json();\n    if (id !== generation || signal.aborted) return;\n    commit(result); // no await between validation and the write\n  };\n}\n// Do not return a checked value and commit it after another await/then.\n// If commit defers its write, revalidate ownership at that later write.",
  },
};

/** Authored example boundaries; executable does not mean arbitrary host integrations are available. */
export function withExampleContract(lesson: Lesson): Lesson {
  const execution = worker.has(lesson.slug)
    ? "worker"
    : browser.has(lesson.slug)
      ? "browser"
      : node.has(lesson.slug)
        ? "node"
        : (lesson.execution ?? "reference");
  const patch = patches[lesson.slug] ?? {};
  const result = { ...lesson, execution, ...patch } as Lesson;
  if (
    result.execution === "worker" &&
    !["execution-context", "shapes-and-inline-caches"].includes(lesson.slug)
  )
    result.language = "javascript";
  if (lesson.slug === "module-linking-and-cycles")
    result.files = [
      ...(result.files ?? []).map((file) =>
        file.name === "counter.mjs"
          ? {
              ...file,
              code: file.code + "\nexport default count;\nexport { count as liveDefault };",
            }
          : file,
      ),
      {
        name: "then-export.mjs",
        language: "javascript",
        code: "export function then(resolve) { resolve('namespace adopted'); }\n// Avoid a callable then export: dynamic import assimilates this namespace.",
      },
      {
        name: "safe-a.mjs",
        language: "javascript",
        code: "import { b } from './safe-b.mjs';\nexport const a = 'A';\nexport function readB() { return b; }",
      },
      {
        name: "safe-b.mjs",
        language: "javascript",
        code: "import { a } from './safe-a.mjs';\nexport const b = 'B';\nexport function readA() { return a; }",
      },
      {
        name: "bad-a.mjs",
        language: "javascript",
        code: "import { b } from './bad-b.mjs';\nexport const a = b;",
      },
      {
        name: "bad-b.mjs",
        language: "javascript",
        code: "import { a } from './bad-a.mjs';\nexport const b = a;",
      },
    ];
  const expected = (verifiedOutputs as Record<string, string>)[lesson.slug];
  if (result.execution === "worker" && expected !== undefined) result.output = expected;
  if (lesson.slug === "n-plus-one")
    result.code =
      "async function loadProjectsWithOwners(ctx: RequestContext) {\n" +
      lesson.code
        .split("\n")
        .map((line) => "  " + line)
        .join("\n") +
      "\n}";
  if (lesson.slug === "flight-and-serialization")
    result.code =
      "async function ProductDetail({ id }: { id: string }) {\n" +
      lesson.code
        .split("\n")
        .map((line) => "  " + line)
        .join("\n") +
      "\n}";
  if (lesson.slug === "accessibility") result.code = "<>\n" + lesson.code + "\n</>";
  if (result.challenge && writtenAnswers.has(lesson.slug))
    result.challenge = { ...result.challenge, kind: "explanation" };
  const challengeOutput = (challengeOutputs as Record<string, string>)[lesson.slug];
  if (result.challenge && result.challenge.kind !== "explanation" && challengeOutput !== undefined)
    result.challenge = { ...result.challenge, execution: "worker", output: challengeOutput };
  return result;
}
