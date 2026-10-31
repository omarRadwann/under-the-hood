import { lesson } from "./helpers";

export const asyncLessons = [
  lesson("async", {
    slug: "event-loop",
    title: "The event loop",
    description:
      "Trace tasks, microtasks, the call stack, and rendering opportunities, one operation at a time.",
    lab: "event-loop",
    level: "Deep dive",
    minutes: 25,
    mental:
      "The browser schedules work around a single JavaScript agent. A task runs; when control permits a microtask checkpoint, queued microtasks drain, including new ones added by microtasks. Rendering happens at browser-chosen opportunities. A zero-delay timer means eligible later, not execute now.",
    steps: [
      {
        title: "Run the current task to completion",
        body: "The initial script is a task. Calling setTimeout registers a timer with the host; it does not push its callback onto the current stack. Promise executors run synchronously, while reactions to settled promises are queued as jobs integrated into the host's microtask machinery.",
      },
      {
        title: "Perform the microtask checkpoint",
        body: "Once the synchronous work finishes, promise reactions and queueMicrotask callbacks run in enqueue order. A callback can append more microtasks, and the checkpoint continues until the queue is empty. Recursively scheduling microtasks can starve input and paint even though every callback is individually short.",
      },
      {
        title: "Give the host another opportunity",
        body: "The browser chooses runnable tasks from task sources; the platform does not expose one universal FIFO macrotask queue. At rendering opportunities it runs rendering work, including animation callbacks before painting. requestAnimationFrame is therefore not equivalent to a timeout or a microtask.",
      },
      {
        title: "Distinguish model from implementation",
        body: "This lab shows a deterministic trace for a fixed snippet, not a general JavaScript interpreter. Real I/O readiness, multiple task sources, nested event loops, background throttling, and rendering policy add variability. Node has a different host loop and nextTick behavior; never transfer browser ordering rules blindly.",
      },
    ],
    code: `console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => {\n  console.log('C');\n  queueMicrotask(() => console.log('D'));\n});\nconsole.log('E');`,
    output: "A\nE\nC\nD\nB",
    pitfalls: [
      "Assuming setTimeout(fn, 0) is immediate or precisely timed.",
      "Calling promise executors asynchronous.",
      "Using a chain of microtasks to yield to rendering.",
      "Assuming every task is followed by a paint.",
    ],
    practice:
      "Predict the trace before pressing Play. Then replace the inner queueMicrotask with a timer. Explain which ordering is guaranteed and which rendering timing depends on the browser.",
    quiz: {
      question:
        "A microtask schedules another microtask while the checkpoint is draining. When does the new one run?",
      choices: [
        "During that checkpoint, before the next task",
        "Only after the next timer",
        "In parallel with the current callback",
      ],
      answer: 0,
      explanation:
        "The checkpoint keeps draining newly enqueued microtasks until the queue is empty. This is why an unbounded microtask chain can starve the main thread.",
    },
    sources: [
      {
        title: "WHATWG · Event loops",
        url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops",
      },
      {
        title: "MDN · Microtasks in depth",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth",
      },
    ],
  }),
  lesson("async", {
    slug: "promises",
    title: "Promises & error propagation",
    description:
      "Understand resolution, settlement, chaining, and the difference between parallel work and observation.",
    lab: "event-loop",
    mental:
      "A promise is a handle to an eventual outcome. Resolving a promise can adopt another promise's state, so resolved does not always mean already fulfilled. A then call creates a new promise whose result depends on what its handler returns or throws.",
    steps: [
      {
        title: "Separate starting from waiting",
        body: "Calling an asynchronous operation usually starts it. Promise.all does not start functions for you; it observes promises produced by the expressions you pass. Independent operations should be started before awaiting their combined result, subject to resource limits.",
      },
      {
        title: "Follow the returned chain",
        body: "A returned value fulfills the next promise; a thrown exception rejects it; a returned thenable is adopted. Forgetting to return a nested promise detaches it from the chain, so callers may observe completion before dependent work finishes.",
      },
      {
        title: "Choose failure semantics deliberately",
        body: "all rejects on the first observed rejection but does not cancel other operations. allSettled preserves every outcome. any resolves on the first fulfillment; race follows the first settlement. A catch that returns a value converts a rejected chain into a fulfilled one.",
      },
    ],
    code: `const [profile, permissions] = await Promise.all([\n  fetchProfile(userId),\n  fetchPermissions(userId),\n]);\n\nconst results = await Promise.allSettled(\n  regions.map(region => checkHealth(region))\n);\n// Neither combinator cancels ongoing work.`,
    pitfalls: [
      "Swallowing errors in catch and returning undefined unintentionally.",
      "Using Promise.all for an unbounded list of requests.",
      "Expecting Promise.race to stop the losing operation.",
    ],
    practice:
      "Design a multi-region health check that reports partial failures, has an overall deadline, and cancels outstanding requests when the deadline expires.",
    quiz: {
      question: "What does Promise.all do to other pending operations after one rejects?",
      choices: ["Cancels them", "Leaves them running", "Automatically retries them"],
      answer: 1,
      explanation:
        "Promise composition observes results. Cancellation needs a separate cooperative mechanism such as AbortSignal.",
    },
  }),
  lesson("async", {
    slug: "async-await",
    title: "Async functions & continuation",
    description: "See why await suspends one function without blocking the JavaScript thread.",
    lab: "event-loop",
    mental:
      "An async function executes synchronously until it reaches an await or returns. Await arranges a continuation for a future microtask; it does not pause the entire thread. The surrounding caller can continue with the promise returned by the async function.",
    steps: [
      {
        title: "Execute the prefix now",
        body: "Statements before the first await run during the current call. An exception becomes a rejection of the async function's returned promise. An async function always returns a promise, even when its source code returns a plain value.",
      },
      {
        title: "Resume through a continuation",
        body: "Await unwraps an eventual result and resumes later, including when awaiting an already fulfilled promise or a non-promise value. Local state remains available to the continuation without keeping an active synchronous call stack frame for the entire wait.",
      },
      {
        title: "Build the dependency graph explicitly",
        body: "Sequential awaits are correct for dependent operations but create accidental waterfalls for independent ones. Parallelism increases pressure on rate limits, memory, database pools, and cancellation handling. Treat scheduling as resource management rather than a syntactic preference.",
      },
    ],
    code: `async function run() {\n  console.log('start');\n  await 42;\n  console.log('resume');\n}\nconst done = run();\nconsole.log('caller');\nawait done;\n// start → caller → resume`,
    output: "start\ncaller\nresume",
    pitfalls: [
      "Assuming async makes CPU-heavy work non-blocking.",
      "Using array.forEach with async callbacks and expecting it to await them.",
      "Serializing independent data requests by habit.",
    ],
    practice:
      "Draw a dependency DAG for an account page with independent profile and billing calls plus invoices that depend on the account ID. Implement only the necessary awaits.",
    quiz: {
      question: "Does await 42 resume the function immediately in the same synchronous execution?",
      choices: [
        "Yes",
        "No, continuation resumes asynchronously",
        "It throws because 42 is not a promise",
      ],
      answer: 1,
      explanation:
        "Await accepts non-promises and still schedules the continuation asynchronously.",
    },
  }),
  lesson("async", {
    slug: "cancellation-and-races",
    title: "Cancellation, deadlines & races",
    description: "Prevent stale responses and make ownership of asynchronous work explicit.",
    mental:
      "Cancellation is a request to stop work, not time travel. A response may already have arrived or a side effect may already have committed. Correctness needs both a cancellation mechanism and a rule for deciding which result still owns the right to update state.",
    steps: [
      {
        title: "Tie work to an owner",
        body: "Create an AbortController for a search, navigation, or component lifetime and pass its signal through the whole operation. Cleanup aborts obsolete work. Libraries and transports must cooperate; aborting a fetch does not undo a server-side mutation.",
      },
      {
        title: "Guard the commit",
        body: "A monotonically increasing request ID or an active flag can prevent an old completion from overwriting a newer result. Validate ownership after every asynchronous boundary that can outlive the request. Transforms and custom promises may not honor the signal.",
      },
      {
        title: "Budget the entire operation",
        body: "A deadline should include retries and queueing, not reset for every attempt. Distinguish cancellation, timeout, validation errors, and remote failure in telemetry and UI. Retry only when semantics and remaining budget permit it.",
      },
    ],
    code: `// One instance per search owner; never share across unrelated users.\nfunction createSearch() {\n  let generation = 0;\n  return async (query: string, signal: AbortSignal) => {\n    const id = ++generation;\n    const response = await fetch('/api/search?q=' + encodeURIComponent(query), { signal });\n    if (!response.ok) throw new Error('Search failed');\n    const result = await response.json();\n    if (id !== generation || signal.aborted) return;\n    return result; // caller commits only current results\n  };\n}`,
    pitfalls: [
      "Treating AbortError as an application failure toast.",
      "Assuming abort rolls back remote writes.",
      "Using a module-global generation counter for unrelated component instances.",
    ],
    practice:
      "Implement typeahead with per-instance ownership, debouncing, an abort signal, and deterministic tests where responses arrive in reverse order.",
    quiz: {
      question: "Why might a stale-result guard still be useful with AbortController?",
      choices: [
        "Abort guarantees rollback",
        "Some downstream work may not cooperate with cancellation",
        "Abort makes requests faster",
      ],
      answer: 1,
      explanation:
        "A signal is cooperative. Ownership checks protect the state commit even if parsing, transformation, or a custom client continues.",
    },
  }),
  lesson("async", {
    slug: "node-event-loop",
    title: "Node.js, libuv & nextTick",
    description:
      "Separate event-loop phases, the worker pool, promise jobs, and module-dependent ordering.",
    level: "Deep dive",
    mental:
      "Node integrates V8 with host facilities. libuv schedules I/O and loop phases; some operations use an OS facility, some use a worker pool. process.nextTick is a special queue, not a normal event-loop phase, and context matters when comparing its order with promise reactions.",
    steps: [
      {
        title: "Know where the work happens",
        body: "Network sockets generally use non-blocking OS mechanisms. Filesystem operations and certain crypto and DNS functions use libuv's thread pool. CPU-heavy JavaScript still blocks its executing thread unless moved to worker threads or another process.",
      },
      {
        title: "Reason about phases without inventing timing guarantees",
        body: "The loop includes timers, pending callbacks, poll, check, and close callbacks. Timer callbacks become eligible after thresholds. Starting with libuv 1.45 / Node 20, timers run after poll, affecting timer and immediate interactions. Top-level setTimeout versus setImmediate order is not a reliable contract.",
      },
      {
        title: "Avoid starvation",
        body: "Node drains its nextTick queue at defined checkpoints, and then processes promise microtasks. ES module evaluation itself runs in asynchronous machinery, so simple CommonJS ordering examples do not transfer unchanged. Recursive nextTick chains can prevent the loop from reaching I/O.",
      },
    ],
    code: `// CommonJS example; do not assume identical ESM ordering.\nconst fs = require('node:fs');\nfs.readFile(__filename, () => {\n  setTimeout(() => console.log('timer'), 0);\n  setImmediate(() => console.log('immediate'));\n});\n// In this I/O callback, immediate runs before timer.`,
    language: "javascript",
    pitfalls: [
      "Calling Node single-threaded without qualifying JavaScript execution.",
      "Assuming all asynchronous APIs use the worker pool.",
      "Applying browser ordering diagrams directly to Node.",
    ],
    practice:
      "Run ordering probes separately in .cjs and .mjs files. Record the Node version and whether registration occurred at top level or inside an I/O callback.",
    quiz: {
      question: "Which is a valid reason to use worker_threads?",
      choices: [
        "Offloading CPU-heavy JavaScript",
        "Making every fetch asynchronous",
        "Guaranteeing timer precision",
      ],
      answer: 0,
      explanation:
        "Worker threads provide additional JavaScript execution threads. Ordinary non-blocking network I/O already uses host facilities.",
    },
    sources: [
      {
        title: "Node.js · Event loop, timers, and nextTick",
        url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
      },
    ],
  }),
  lesson("async", {
    slug: "workers-and-parallelism",
    title: "Workers & parallel execution",
    description:
      "Choose message passing, transferable memory, or shared memory for CPU-heavy work.",
    mental:
      "A worker has its own JavaScript agent and event loop. It provides actual parallel execution, but communication and coordination have a cost. Moving a tiny operation to a worker can be slower than keeping it on the main thread.",
    steps: [
      {
        title: "Send a serializable protocol",
        body: "postMessage normally uses structured cloning. Functions and DOM nodes cannot be cloned. Design explicit request IDs, versioned message types, success results, and errors so concurrent requests can be matched and obsolete responses can be discarded.",
      },
      {
        title: "Understand ownership transfer",
        body: "Transferring an ArrayBuffer moves ownership without copying its bytes and detaches the sending buffer. SharedArrayBuffer permits shared memory under required isolation constraints. Atomics supplies synchronization for supported shared typed arrays; ordinary reads and writes do not create a safe concurrent protocol.",
      },
      {
        title: "Bound the pool and the queue",
        body: "A worker per request creates startup and memory overhead. Reuse a bounded pool for expensive parsing, indexing, image processing, or simulation. Track queue delay, service time, cancellation, and worker crashes separately from end-to-end latency.",
      },
    ],
    code: `// main thread\nconst worker = new Worker(new URL('./worker.ts', import.meta.url));\nconst buffer = new ArrayBuffer(1024);\nworker.postMessage({ id: 1, buffer }, [buffer]);\nconsole.log(buffer.byteLength); // 0: ownership transferred\n\n// worker.ts\nself.onmessage = ({ data }) => {\n  self.postMessage({ id: data.id, bytes: data.buffer.byteLength });\n};`,
    pitfalls: [
      "Trying to manipulate the DOM inside a web worker.",
      "Transferring a buffer and then reading it on the sender.",
      "Creating an unbounded worker pool under peak load.",
    ],
    practice:
      "Move a large search-index build into a worker. Measure main-thread responsiveness and total elapsed time, including startup and message transfer.",
    quiz: {
      question:
        "After an ArrayBuffer is successfully transferred, what happens to the sender's buffer?",
      choices: ["It remains a shared mutable buffer", "It is detached", "It becomes a string"],
      answer: 1,
      explanation:
        "Transfer moves ownership and detaches the original. SharedArrayBuffer has different shared-memory semantics.",
    },
  }),
  lesson("async", {
    slug: "streams-and-backpressure",
    title: "Streams & backpressure",
    description: "Keep memory bounded when producers are faster than consumers.",
    lab: "streaming",
    mental:
      "A stream is a flow-control contract. If a producer generates data faster than a consumer handles it, buffering grows until something applies backpressure, drops work, or fails. Streaming without a pressure strategy is just an unbounded queue in disguise.",
    steps: [
      {
        title: "Process incrementally",
        body: "Readable streams expose chunks, which are transport boundaries rather than guaranteed application records. A JSON object or UTF-8 character can span chunks. Use incremental decoders and framing protocols instead of parsing each chunk as a complete message.",
      },
      {
        title: "Respect demand",
        body: "Web Streams communicate desired capacity through queues and pull behavior. Node writable streams return false when a high-water threshold is reached, after which producers should wait for drain. High-water marks are pressure thresholds, not universal hard memory limits.",
      },
      {
        title: "Propagate failure and cancellation",
        body: "A robust pipeline closes upstream resources when downstream stops and reports failures without leaking file handles or network bodies. Node pipeline and Web Streams pipeTo help compose backpressure and error propagation, but application-level cleanup still needs an owner.",
      },
    ],
    code: `import { pipeline } from 'node:stream/promises';\nimport { createReadStream, createWriteStream } from 'node:fs';\nimport { createGzip } from 'node:zlib';\n\nawait pipeline(\n  createReadStream('events.ndjson'),\n  createGzip(),\n  createWriteStream('events.ndjson.gz'),\n); // pressure and errors propagate through the pipeline`,
    pitfalls: [
      "Assuming one chunk equals one JSON message.",
      "Ignoring writable.write() returning false.",
      "Buffering the full response before displaying 'streaming' UI.",
    ],
    practice:
      "Build a newline-delimited parser that handles a line split across three chunks. Add a slow consumer and verify queue size remains bounded.",
    quiz: {
      question: "What does backpressure communicate?",
      choices: [
        "The consumer cannot currently accept unlimited additional work",
        "The network connection is encrypted",
        "Every chunk is a complete record",
      ],
      answer: 0,
      explanation:
        "Backpressure coordinates the producer's rate with downstream capacity so memory and latency do not grow without bound.",
    },
    sources: [
      {
        title: "Node.js · Backpressuring in streams",
        url: "https://nodejs.org/en/learn/modules/backpressuring-in-streams",
      },
    ],
  }),
  lesson("async", {
    slug: "concurrency-control",
    title: "Concurrency limits & race conditions",
    description: "Protect shared state across awaits and keep downstream systems within capacity.",
    mental:
      "One JavaScript thread does not mean no races. Two operations can read the same state, await different work, and then both commit based on obsolete assumptions. Concurrency is interleaving; parallelism is simultaneous execution.",
    steps: [
      {
        title: "Identify the critical read-modify-write",
        body: "If a correctness invariant spans an await, another operation can change the world in between. An in-process mutex protects only that process. Across multiple instances, use database transactions, conditional updates, or another authoritative coordination mechanism.",
      },
      {
        title: "Separate throughput from concurrency",
        body: "Concurrency limits cap in-flight work; rate limits cap work per time interval. A pool of ten fast operations can still exceed a requests-per-second quota. Bound waiting queues as well, or overload simply moves from the database to application memory.",
      },
      {
        title: "Preserve fairness and observability",
        body: "Record queue time separately from execution time. Decide whether overload rejects new work, sheds low-priority work, or waits within a deadline. Protect small tenants from starvation by noisy neighbors with per-tenant quotas or fair scheduling.",
      },
    ],
    code: `// Atomic inventory decrement, executed by the database.\nconst result = await db.query(\n  'UPDATE inventory SET stock = stock - 1 ' +\n  'WHERE id = $1 AND stock > 0 RETURNING stock',\n  [productId],\n);\nif (result.rowCount === 0) throw new Error('Sold out');\n// Avoid: read stock → await → write stock - 1`,
    pitfalls: [
      "Using a process-local lock as a cross-instance guarantee.",
      "Confusing a rate limiter with a concurrency pool.",
      "Using an unbounded Promise.all against a database.",
    ],
    practice:
      "Simulate 100 simultaneous purchases of an item with stock 1. Assert exactly one success, including when requests run through two application instances.",
    quiz: {
      question: "Which prevents overselling across multiple app instances?",
      choices: [
        "A local boolean",
        "An atomic conditional update in the authoritative database",
        "A disabled frontend button",
      ],
      answer: 1,
      explanation:
        "The invariant must be enforced where concurrent requests meet. UI state and per-process locks cannot coordinate multiple servers.",
    },
  }),
];
