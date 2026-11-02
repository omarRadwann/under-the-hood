import type { PlaygroundPreset } from "./types";
import { lessons } from "@/content";
const executableLessons = lessons.filter((lesson) => lesson.execution === "worker");
const executableAnswers = lessons.filter((lesson) => lesson.challenge?.execution === "worker");

export const presets: PlaygroundPreset[] = [
  {
    id: "queues",
    mode: "event-loop",
    name: "Tasks & microtasks",
    description:
      "Change the order, add callbacks, and observe native browser scheduling in a worker.",
    concept:
      "Promise reactions are registered before they run. The visualizer cannot inspect the browser's private queue.",
    source: `console.log('A: script starts');\nsetTimeout(() => console.log('B: timer'), 0);\nPromise.resolve().then(() => {\n  console.log('C: promise reaction');\n  queueMicrotask(() => console.log('D: nested microtask'));\n});\nconsole.log('E: script ends');`,
  },
  {
    id: "await",
    mode: "event-loop",
    name: "Await & continuations",
    description: "Observe the synchronous prefix and the continuation of a real async function.",
    concept:
      "Await suspends one function; it does not block the worker's agent. Even an already fulfilled promise resumes later.",
    source: `async function load() {\n  console.log('1: synchronous prefix');\n  await Promise.resolve(42);\n  console.log('3: await continuation');\n  return 'done';\n}\nconst result = load();\nconsole.log('2: caller keeps running');\nresult.then(value => console.log('4:', value));`,
  },
  {
    id: "assimilation",
    mode: "event-loop",
    name: "Thenable assimilation",
    description: "Compare creating a promise with adopting a thenable's result.",
    concept:
      "A thenable's then method is invoked through promise resolution jobs. Reading that method and invoking it are separate operations.",
    source: `const thenable = {\n  get then() {\n    console.log('get then: synchronous');\n    return resolve => {\n      console.log('invoke then: job');\n      resolve('adopted value');\n    };\n  }\n};\nPromise.resolve(thenable).then(console.log);\nqueueMicrotask(() => console.log('explicit microtask'));\nconsole.log('end of script');`,
  },
  {
    id: "closures",
    mode: "event-loop",
    name: "Closures & loop bindings",
    description: "Replace let with var and compare what timer callbacks read.",
    concept:
      "A closure retains access to bindings, not a frozen copy. let creates per-iteration bindings in this loop.",
    source: `function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = makeCounter();\nconsole.log('same environment:', next(), next());\nfor (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log('iteration:', i), 10);\n}`,
  },
  {
    id: "errors",
    mode: "event-loop",
    name: "Rejection & recovery",
    description: "Throw, recover, and inspect which branch of a promise chain runs.",
    concept:
      "Returning from catch converts the chain to fulfillment. Throwing from a handler rejects the next promise.",
    source: `Promise.resolve('start')\n  .then(value => {\n    console.log(value);\n    throw new Error('deliberate failure');\n  })\n  .catch(error => {\n    console.warn('recovered:', error.message);\n    return 7;\n  })\n  .then(value => console.log('fulfilled:', value));`,
  },
  {
    id: "state-batching",
    mode: "react",
    name: "State snapshots & batching",
    description:
      "Edit the updater form and click the rendered button. Compare real renders with commits.",
    concept:
      "Three replacement updates use one snapshot; three functional updaters compose. Profiler commits and render calls are different observations.",
    source: `import React, { useState, useEffect } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    console.log('effect setup:', count);\n    return () => console.log('effect cleanup:', count);\n  }, [count]);\n  function increment() {\n    setCount(c => c + 1);\n    setCount(c => c + 1);\n    setCount(c => c + 1);\n    // Try replacing each updater with setCount(count + 1).\n  }\n  return <section>\n    <h2>Count: {count}</h2>\n    <button onClick={increment}>Increment three times</button>\n  </section>;\n}`,
  },
  {
    id: "effect-lifetime",
    mode: "react",
    name: "Effect setup & cleanup",
    description: "Switch dependencies or remove a child and inspect real effect cleanup.",
    concept:
      "Effects synchronize with committed inputs. Cleanup ends the previous synchronization; it is not a render-phase operation.",
    source: `import React, { useState, useEffect } from 'react';\n\nfunction Connection({ room }) {\n  useEffect(() => {\n    console.log('connect', room);\n    return () => console.log('disconnect', room);\n  }, [room]);\n  return <p>Connected view: {room}</p>;\n}\nexport default function App() {\n  const [room, setRoom] = useState('engineering');\n  const [visible, setVisible] = useState(true);\n  return <section>\n    <button onClick={() => setRoom(r => r === 'engineering' ? 'design' : 'engineering')}>Switch room</button>\n    <button onClick={() => setVisible(v => !v)}>Toggle child</button>\n    {visible && <Connection room={room} />}\n  </section>;\n}`,
  },
  {
    id: "keys",
    mode: "react",
    name: "Keys & component identity",
    description: "Type into rows, reverse the list, and compare stable IDs with index keys.",
    concept:
      "Local state belongs to React identity. An index key can attach draft state to the wrong entity after reorder.",
    source: `import React, { useState } from 'react';\n\nfunction Row({ item }) {\n  const [draft, setDraft] = useState(item.name);\n  return <label>{item.id}: <input value={draft} onChange={e => setDraft(e.target.value)} /></label>;\n}\nexport default function App() {\n  const [rows, setRows] = useState([{id:'A',name:'Ada'}, {id:'B',name:'Grace'}]);\n  return <section>\n    <button onClick={() => setRows(r => [...r].reverse())}>Reverse order</button>\n    {rows.map((item, index) => <Row key={item.id} item={item} />)}\n    <p>Try key={/* replace item.id above with index */ 'index'}</p>\n  </section>;\n}`,
  },
  {
    id: "memo",
    mode: "react",
    name: "Memo & prop identity",
    description: "Change an unrelated state value and see which named components actually render.",
    concept:
      "memo compares props. An always-new object can defeat the boundary. React is running; the tree display summarizes instrumented named function entries.",
    source: `import React, { useState, memo, useMemo } from 'react';\n\nconst Child = memo(function Child({ options }) {\n  return <p>Child label: {options.label}</p>;\n});\nexport default function App() {\n  const [count, setCount] = useState(0);\n  const options = useMemo(() => ({ label: 'stable' }), []);\n  // Try: const options = { label: 'new object' };\n  return <section>\n    <button onClick={() => setCount(c => c + 1)}>Parent count: {count}</button>\n    <Child options={options} />\n  </section>;\n}`,
  },
  {
    id: "cache-aside",
    mode: "cache",
    name: "Cache-aside & TTL",
    description:
      "Edit the cache algorithm, keys, TTL, or operation sequence and inspect the resulting store.",
    concept:
      "The code runs against a real in-memory teaching store. Its logical clock is explicit and separate from wall-clock timer scheduling.",
    source: `const TTL = 1000; // logical milliseconds\n\nasync function getProduct(key) {\n  const entry = cache.get(key);\n  if (entry && entry.expiresAt > clock.now()) {\n    console.log('HIT', key);\n    return entry.value;\n  }\n  console.log('MISS', key);\n  const value = await origin.read(key);\n  cache.set(key, value, TTL);\n  return value;\n}\nconsole.log('first:', await getProduct('product'));\norigin.write('product', { price: 125 });\nconsole.log('before expiry:', await getProduct('product'));\nclock.advance(1100);\nconsole.log('after expiry:', await getProduct('product'));`,
  },
  {
    id: "refill-race",
    mode: "cache",
    name: "Stale refill after invalidation",
    description: "Run a real race where an older origin read completes after an update and purge.",
    concept:
      "origin.read captures a value at request start and delivers it after the chosen wall-clock delay. Invalidating the key does not cancel that old refill.",
    source: `async function refill() {\n  const value = await origin.read('product', 60);\n  cache.set('product', value, 1000);\n  return value;\n}\nconst oldLoad = refill();\nawait sleep(10);\norigin.write('product', { price: 125 });\ncache.delete('product');\nconsole.log('new origin committed and cache invalidated');\nawait oldLoad;\nconsole.log('stale cache:', cache.get('product'));\n// Design a generation/version guard before publishing refill results.`,
  },
  {
    id: "single-flight",
    mode: "cache",
    name: "Request coalescing",
    description:
      "Delete the in-flight check and compare origin requests for three concurrent reads.",
    concept:
      "Single-flight coalesces simultaneous requests in this one process. It is not a distributed lock or a freshness guarantee.",
    source: `const inFlight = new Map();\nasync function load(key) {\n  if (inFlight.has(key)) return inFlight.get(key);\n  const promise = origin.read(key, 50).then(value => {\n    cache.set(key, value, 1000);\n    return value;\n  }).finally(() => inFlight.delete(key));\n  inFlight.set(key, promise);\n  return promise;\n}\nconst values = await Promise.all([load('product'), load('product'), load('product')]);\nconsole.log('results:', values);`,
  },
  {
    id: "swr",
    mode: "cache",
    name: "Stale while revalidating",
    description:
      "Return a stale value immediately, refresh in the background, and inspect both observations.",
    concept:
      "Stale-while-revalidate trades freshness for latency. A production implementation also needs deduplication, errors, and tenant-safe keys.",
    source: `async function getProduct() {\n  const entry = cache.get('product');\n  if (entry && entry.expiresAt > clock.now()) return entry.value;\n  const refresh = origin.read('product', 50).then(value => {\n    cache.set('product', value, 1000);\n    return value;\n  });\n  if (entry) { console.log('serve stale, refresh in background'); return entry.value; }\n  return refresh;\n}\nconsole.log('first:', await getProduct());\nclock.advance(1200);\norigin.write('product', { price: 125 });\nconsole.log('stale:', await getProduct());\nawait sleep(80);\nconsole.log('refreshed:', await getProduct());`,
  },
  {
    id: "iterator-helpers",
    mode: "event-loop",
    name: "Lazy iterator helpers & early cleanup",
    description: "Observe which values a lazy pipeline requests and when take closes its producer.",
    concept:
      "Iteration is demand-driven. A terminal consumer advances the pipeline, and an early boundary can trigger producer cleanup.",
    source: `function* source() {\n  try {\n    for (let n = 1; ; n++) { console.log('produce:', n); yield n; }\n  } finally { console.log('producer closed'); }\n}\nconst results = Iterator.from(source()).map(n => n * 2).take(3).toArray();\nconsole.log('results:', results);`,
  },
  ...executableLessons.map((chapter) => ({
    id: `js-${chapter.slug}`,
    mode: "event-loop" as const,
    name: chapter.title,
    description: chapter.description,
    concept: chapter.mental.split(". ")[0] + ".",
    source: chapter.code,
  })),
  ...executableAnswers.map((chapter) => ({
    id: `answer-${chapter.slug}`,
    mode: "event-loop" as const,
    name: `Worked answer · ${chapter.title}`,
    description: chapter.challenge!.prompt,
    concept: chapter.challenge!.explanation,
    source: chapter.challenge!.solution,
  })),
];

export const lessonPlaygrounds: Record<string, { mode: PlaygroundPreset["mode"]; preset: string }> =
  {
    ...Object.fromEntries(
      executableLessons.map((chapter) => [
        chapter.slug,
        { mode: "event-loop" as const, preset: `js-${chapter.slug}` },
      ]),
    ),
    "render-and-commit": { mode: "react", preset: "state-batching" },
    "state-and-batching": { mode: "react", preset: "state-batching" },
    "effects-and-cleanup": { mode: "react", preset: "effect-lifetime" },
    "identity-and-keys": { mode: "react", preset: "keys" },
    "memoization-and-context": { mode: "react", preset: "memo" },
    "hook-identity": { mode: "react", preset: "state-batching" },
    "nextjs-caching": { mode: "cache", preset: "cache-aside" },
    "http-caching": { mode: "cache", preset: "cache-aside" },
    "cache-invalidation": { mode: "cache", preset: "refill-race" },
  };
export function playgroundUrl(
  slug: string,
  variant: "example" | "challenge" = "example",
): string | null {
  if (variant === "challenge")
    return executableAnswers.some((chapter) => chapter.slug === slug)
      ? `/playground?mode=event-loop&preset=answer-${slug}`
      : null;
  const target = lessonPlaygrounds[slug];
  return target ? `/playground?mode=${target.mode}&preset=${target.preset}` : null;
}
