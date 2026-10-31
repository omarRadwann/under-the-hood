import { lesson } from "./helpers";
import type { TrackId } from "@/lib/types";
const deep = (track: TrackId, input: Parameters<typeof lesson>[1]) =>
  lesson(track, { level: "Deep dive", minutes: 25, ...input });

export const advanced = [
  deep("javascript", {
    slug: "property-descriptors-and-proxies",
    title: "Descriptors, Reflect & Proxy invariants",
    description:
      "Understand the object protocol beneath assignment, enumeration, accessors, and interception.",
    prerequisites: ["objects-and-prototypes"],
    invariant:
      "A proxy must preserve the target's non-configurable property and extensibility invariants; interception is not permission to invent an inconsistent object.",
    mental:
      "Objects expose internal operations such as getting a property, defining one, and listing keys. Syntax delegates to those operations. Descriptors and proxies let you influence that protocol, but the language imposes invariants that keep observations consistent.",
    steps: [
      {
        title: "Distinguish assignment from definition",
        body: "Assignment can invoke an inherited setter; defining an own data property follows different rules. Data descriptors have value/writable fields, while accessors have get/set. Omitted Object.defineProperty flags default to false. Spread reads enumerable own properties and can invoke getters; it does not preserve their descriptors.",
      },
      {
        title: "Forward the receiver correctly",
        body: "Reflect.get(target, key, receiver) preserves the receiver used by accessors. Returning target[key] from a get trap can bind getter this to the wrong object. Objects with internal slots, including some built-ins and private fields, may not work with a naive forwarding proxy because a proxy is a different receiver.",
      },
      {
        title: "Respect invariants and identity",
        body: "A get trap cannot contradict certain non-configurable non-writable properties. ownKeys cannot hide required keys. Revoked proxies throw on operations, and proxy identity differs from target identity. Reactive frameworks build protocols around these constraints rather than turning proxies into transparent universal wrappers.",
      },
    ],
    code: `const target = {};\nObject.defineProperty(target, 'id', { value: 7, writable: false, configurable: false });\nconst valid = new Proxy(target, { get: (t, key, receiver) => Reflect.get(t, key, receiver) });\nconsole.log(valid.id); // 7\n// Returning 8 for id would violate the target invariant and throw.`,
    pitfalls: [
      "Assuming spread preserves getter descriptors.",
      "Using target[key] as a universally transparent get trap.",
      "Forgetting that a proxy does not share the target's private-field brand.",
    ],
    practice:
      "Build a logging proxy around an accessor that reads this.name. Compare target[key] with Reflect.get using a derived receiver, then test a frozen data property.",
    quiz: {
      question:
        "Can a proxy report a different value for a non-configurable, non-writable own data property?",
      choices: [
        "No; that can violate an enforced invariant",
        "Yes, every trap is unrestricted",
        "Only in strict TypeScript",
      ],
      answer: 0,
      explanation:
        "The engine enforces object invariants even when a trap exists. A proxy cannot freely contradict protected target properties.",
    },
    sources: [
      {
        title: "MDN · Proxy",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy",
      },
      {
        title: "ECMAScript · Object internal methods",
        url: "https://tc39.es/ecma262/#sec-object-internal-methods-and-internal-slots",
      },
    ],
  }),
  deep("javascript", {
    slug: "iterators-and-generators",
    title: "Iterators, generators & resource cleanup",
    description:
      "Reason about pull-based execution, early termination, yield delegation, and async iteration.",
    prerequisites: ["scope-and-closures"],
    invariant:
      "Early termination must release the resources owned by the iterator when its protocol supports closure.",
    mental:
      "An iterator advances on demand. A generator preserves an execution state between next calls; an async iterator produces eventual iteration results. Neither automatically bounds a producer that is already buffering work elsewhere.",
    steps: [
      {
        title: "Separate iterable from iterator",
        body: "An iterable supplies Symbol.iterator; an iterator supplies next returning an object with value and done. A generator object often implements both. A generator function call creates the object without executing its body until iteration advances. Reusing one iterator is different from asking an iterable for a fresh iterator.",
      },
      {
        title: "Follow early completion",
        body: "for-of can call an iterator's return on abrupt exit such as break. Generator finally blocks can release resources. Exceptions, delegation through yield*, and manually abandoned iterators require deliberate ownership; garbage collection is not a dependable file or subscription cleanup mechanism.",
      },
      {
        title: "Distinguish pull from pressure elsewhere",
        body: "for-await-of awaits iteration results and supports async generators. It does not cancel external work merely because a promise is no longer observed. Preserve abort signals and handle errors across the iterator/resource boundary. Streaming parsers still need framing when records cross chunk boundaries.",
      },
      {
        title: "Use lazy iterator helpers with an ownership contract",
        body: "Where supported, Iterator.from and helpers such as map, filter, and take can compose lazy synchronous pipelines before a terminal operation consumes them. They are not eager array transforms, and an iterator is often one-shot. Limit consumption of unbounded sources and verify early-close behavior. Async iteration has a separate protocol; do not infer that every synchronous helper exists on every async iterator.",
      },
    ],
    code: `function* values() {\n  try { yield 1; yield 2; }\n  finally { console.log('iterator closed'); }\n}\nfor (const n of values()) { console.log(n); break; }\n// 1, then iterator closed`,
    output: "1\niterator closed",
    pitfalls: [
      "Assuming calling a generator executes its body immediately.",
      "Equating an async iterable with automatic cancellation or bounded buffering.",
    ],
    practice:
      "Implement an async iterable around a paginated source. Break after one item and prove that the current request and owned subscription are released.",
    quiz: {
      question: "When does a generator function body start running?",
      choices: [
        "When iteration is advanced",
        "When its declaration is parsed",
        "Immediately on every generator function call",
      ],
      answer: 0,
      explanation:
        "Calling the function creates a suspended generator. Advancing it begins execution.",
    },
    sources: [
      {
        title: "MDN · Iteration protocols",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols",
      },
    ],
  }),
  deep("javascript", {
    slug: "binary-memory",
    title: "ArrayBuffer, typed views & endianness",
    description:
      "Understand shared bytes, offsets, transfer, decoding boundaries, and zero-copy ownership.",
    prerequisites: ["values-and-equality"],
    invariant:
      "A view's element count, byte length, offset, and ownership state are separate facts.",
    mental:
      "An ArrayBuffer owns bytes. Typed arrays and DataView interpret a range of those bytes. Multiple views can alias the same storage, so copying a view object and copying its data are different operations.",
    steps: [
      {
        title: "Choose representation intentionally",
        body: "Typed arrays expose homogeneous elements, and byteLength differs from length for multi-byte elements. DataView supports explicit byte order for protocol parsing. Bounds checks, alignment constraints on typed-array offsets, and detached buffers are observable runtime behavior, not merely TypeScript concerns.",
      },
      {
        title: "Distinguish copy from alias",
        body: "Constructing a view over an existing buffer aliases storage. Typed-array subarray aliases a range; slice copies elements. Node Buffer has its own historical slice semantics, so do not transfer assumptions between APIs. A view over a tiny region can keep a much larger backing allocation alive.",
      },
      {
        title: "Handle transport and text boundaries",
        body: "Transferring an ArrayBuffer detaches the sender's storage. SharedArrayBuffer instead introduces a shared-memory protocol. TextDecoder with streaming mode handles characters split across byte chunks; independently decoding each network chunk can corrupt multi-byte text.",
      },
    ],
    code: `const buffer = new ArrayBuffer(8);\nconst bytes = new Uint8Array(buffer);\nconst view = new DataView(buffer);\nview.setUint16(0, 0x1234, false); // explicit big endian\nconsole.log(bytes[0], bytes[1]); // 18 52\nconst alias = bytes.subarray(0, 2);\nconst copy = bytes.slice(0, 2);`,
    pitfalls: [
      "Assuming subarray copies storage.",
      "Reading protocol integers using an implicit platform byte order.",
      "Decoding each byte chunk as an independent complete string.",
    ],
    practice:
      "Parse a length-prefixed message split across three chunks. Test a UTF-8 character crossing the same boundary and verify copies versus aliased views.",
    quiz: {
      question: "Which operation aliases existing typed-array storage?",
      choices: ["subarray", "slice on a typed array", "JSON.stringify"],
      answer: 0,
      explanation:
        "Typed-array subarray returns another view over the same backing storage. slice copies the selected elements.",
    },
    sources: [
      {
        title: "MDN · Typed arrays",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays",
      },
    ],
  }),
  deep("javascript", {
    slug: "weak-references",
    title: "WeakMap, WeakRef & finalization",
    description: "Use weak ownership without making correctness depend on collection timing.",
    prerequisites: ["memory-and-garbage-collection"],
    invariant: "Essential cleanup and durable effects cannot depend on a finalizer running.",
    mental:
      "Weak references change reachability relationships; they do not provide a dependable scheduling signal. A cache or resource owner still needs explicit lifetime and capacity rules.",
    steps: [
      {
        title: "Use weak keys for metadata ownership",
        body: "A WeakMap lets metadata follow the lifetime of object keys without keeping those keys alive by itself. It is intentionally not enumerable. A value that references its key does not automatically turn the weak-key association into a leak; tracing semantics are more subtle than simple reference counting.",
      },
      {
        title: "Treat dereference as optional",
        body: "WeakRef.deref can return the target or undefined. The engine protects certain within-job observations, but collection remains nondeterministic. A successful dereference should be kept in a local strong reference for the operation rather than repeatedly assuming the target still exists across unrelated asynchronous work.",
      },
      {
        title: "Keep finalization nonessential",
        body: "FinalizationRegistry callbacks may run late or never before process exit. Held values must not inadvertently retain the target. Use unregister where appropriate, keep fallback cleanup idempotent, and release connections, listeners, and subscriptions explicitly at the owning lifecycle boundary.",
      },
    ],
    code: `const metadata = new WeakMap<object, { measured: number }>();\nfunction remember(node: object) {\n  metadata.set(node, { measured: performance.now() });\n}\n// No enumeration and no promise about when a key is collected.\n// Critical unsubscribe/close operations remain explicit.`,
    pitfalls: [
      "Using finalization to commit a payment or release a scarce connection.",
      "Putting a target inside its own registry held value.",
      "Replacing a bounded cache with weak references and no hit/miss policy.",
    ],
    practice:
      "Review a WeakRef cache proposal. State what happens on every cache miss and why application correctness survives the finalizer never running.",
    quiz: {
      question: "Can a finalizer be relied on to run before process exit?",
      choices: ["No", "Yes", "Only with an empty microtask queue"],
      answer: 0,
      explanation:
        "Finalization timing and execution are not guaranteed. Critical resource and business lifecycles must be explicit.",
    },
    sources: [
      {
        title: "MDN · WeakRef notes",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef",
      },
    ],
  }),
  deep("javascript", {
    slug: "shapes-and-inline-caches",
    title: "Shapes, inline caches & deoptimization",
    description:
      "Connect property access feedback to real profiling without turning heuristics into dogma.",
    prerequisites: ["javascript-engine", "objects-and-prototypes"],
    invariant:
      "Specialized execution must preserve language semantics when its assumptions stop matching.",
    mental:
      "Engines can recognize repeated object layouts and specialize property access at a call site. The layout metadata and inline-cache strategy are implementation details; JavaScript does not promise one representation or optimization threshold.",
    steps: [
      {
        title: "Distinguish shape from constructor name",
        body: "Objects constructed through similar property-addition paths may share layout information in V8. Property order and later mutations can change representation. A shared constructor name alone does not establish that all objects arriving at one access site have the same shape.",
      },
      {
        title: "Reason at the access site",
        body: "Feedback describes behavior at particular operations. A site observing one, several, or many layouts may use different strategies. Arrays also have element-representation choices. These mechanisms explain possible costs; they do not prove a user-facing bottleneck without representative measurement.",
      },
      {
        title: "Optimize under a measured workload",
        body: "Inspect profiles, allocation pressure, and actual hot paths before normalizing every object. A shape-preserving refactor that adds copies or increases memory can lose overall. Engine versions evolve, so record versions and rerun representative benchmarks rather than publishing a timeless list of forbidden syntax.",
      },
    ],
    code: `function point(x: number, y: number) { return { x, y }; }\nconst points = [point(1, 2), point(3, 4)];\nfunction readX(p: { x: number }) { return p.x; }\nfor (const p of points) console.log(readX(p));\n// Profile a representative hot site before changing object construction.`,
    pitfalls: [
      "Claiming every delete causes a material performance problem.",
      "Using an engine-specific representation as a language guarantee.",
      "Optimizing a synthetic loop while ignoring allocations and layout work.",
    ],
    practice:
      "Compare two real data-processing workloads with different object creation paths. Measure total latency and memory, and record the engine version and distributions.",
    quiz: {
      question: "Where is inline-cache feedback especially relevant?",
      choices: [
        "At a particular operation/access site",
        "Only at the file name",
        "Only in TypeScript declarations",
      ],
      answer: 0,
      explanation:
        "An operation site can observe different receiver behavior across calls. That feedback can inform specialization.",
    },
    sources: [{ title: "V8 · Fast properties", url: "https://v8.dev/blog/fast-properties" }],
  }),
  deep("async", {
    slug: "promise-assimilation",
    title: "Promise resolution & thenable assimilation",
    description:
      "Separate resolving, settling, reading then, reaction jobs, and await continuation.",
    prerequisites: ["promises", "event-loop"],
    invariant:
      "A resolved promise can still be pending while it follows another unsettled promise or thenable.",
    mental:
      "Resolution is a procedure for adopting an outcome, not an immediate synonym for fulfillment. Thenables can contain accessors and arbitrary code, so observing and invoking their then property has meaningful timing and error semantics.",
    steps: [
      {
        title: "Follow the resolution procedure",
        body: "Resolving with a primitive can fulfill directly. Resolving with a promise or thenable may adopt its eventual state. Accessing then can execute a getter synchronously and can throw. Invoking a callable then is scheduled through a promise-resolution job rather than performed as the same immediate getter access.",
      },
      {
        title: "Observe reaction timing separately",
        body: "then registers reactions; callbacks run through jobs once the prerequisite outcome permits them. Registering on a pending promise does not mean its callback is already runnable. A queue graphic that marks every then call as an immediately queued microtask is wrong for unresolved promises.",
      },
      {
        title: "Understand what instrumentation misses",
        body: "Native async functions use internal promise machinery. Overriding Promise.prototype.then does not expose every await continuation. Source instrumentation can record suspension and resumption without adding another promise to the awaited value, but it still cannot inspect all private engine jobs.",
      },
    ],
    code: `const value = {\n  get then() {\n    console.log('read then');\n    return resolve => { console.log('invoke then'); resolve(7); };\n  }\n};\nPromise.resolve(value).then(console.log);\nconsole.log('script end');`,
    output: "read then\nscript end\ninvoke then\n7",
    pitfalls: [
      "Equating resolved with already fulfilled.",
      "Showing a reaction to an unsettled promise as an immediately runnable job.",
      "Using a patched then method as a complete async/await inspector.",
    ],
    practice:
      "Run the thenable experiment in the code playground. Add a throwing then getter and compare its synchronous access with the eventual rejection handler.",
    quiz: {
      question:
        "Does resolving with a pending promise necessarily fulfill the outer promise immediately?",
      choices: ["No; it can adopt the still-pending outcome", "Yes", "Only in a browser"],
      answer: 0,
      explanation:
        "Resolution may lock in adoption of another promise while settlement remains pending.",
    },
    sources: [
      {
        title: "ECMAScript · Promise resolution functions",
        url: "https://tc39.es/ecma262/#sec-promise-resolve-functions",
      },
    ],
  }),
  deep("async", {
    slug: "async-context",
    title: "Async context & request isolation",
    description:
      "Carry correlation and request metadata across asynchronous work without mutable global state.",
    prerequisites: ["node-event-loop", "multi-tenant-security"],
    invariant:
      "Concurrent requests must not inherit another request's tenant, identity, or correlation context.",
    mental:
      "Async context associates data with a chain of asynchronous execution. It can reduce parameter plumbing for diagnostics, but ambient context is not proof that the current operation is authorized.",
    steps: [
      {
        title: "Establish a bounded execution scope",
        body: "In Node, AsyncLocalStorage.run establishes a store for asynchronous work created within the callback. Keep the store immutable where possible. A module-global currentUser variable instead races whenever requests interleave around awaits.",
      },
      {
        title: "Recognize propagation boundaries",
        body: "Callbacks through custom schedulers, unusual thenables, or external processes may lose context. AsyncResource and explicit binding can bridge suitable in-process boundaries. Queues and HTTP calls need serialized, validated trace context; in-memory association does not cross a network automatically.",
      },
      {
        title: "Keep policy explicit",
        body: "Do not use ambient context as a hidden global service locator or cache mutable user objects indefinitely. Sensitive application services should have clear authorization contracts. Test concurrent requests with different tenants and verify cleanup, background work lifetime, and sampled diagnostic propagation.",
      },
    ],
    code: `import { AsyncLocalStorage } from 'node:async_hooks';\nconst context = new AsyncLocalStorage<Readonly<{ requestId: string }>>();\nawait context.run({ requestId: 'r1' }, async () => {\n  await doWork();\n  logger.info({ requestId: context.getStore()?.requestId });\n});`,
    pitfalls: [
      "A mutable global currentTenant.",
      "Assuming async context automatically follows a message into another process.",
      "Trusting an incoming trace header as authenticated identity.",
    ],
    practice:
      "Run two barrier-controlled requests through the same server and custom callback adapter. Assert correlation stays correct, then verify explicit propagation into a queue worker.",
    quiz: {
      question: "Does AsyncLocalStorage automatically carry a store into another process?",
      choices: ["No", "Yes", "Only if both use TypeScript"],
      answer: 0,
      explanation:
        "Cross-process context requires a transport protocol and validation. In-process async association is a different boundary.",
    },
    sources: [
      { title: "Node.js · Async context", url: "https://nodejs.org/api/async_context.html" },
    ],
  }),
  deep("async", {
    slug: "shared-memory-and-atomics",
    title: "Shared memory, Atomics & synchronization",
    description: "Distinguish shared bytes from a correct concurrent protocol.",
    prerequisites: ["workers-and-parallelism", "binary-memory"],
    invariant:
      "A shared read-modify-write invariant needs synchronization, not merely a shared buffer.",
    mental:
      "SharedArrayBuffer lets agents access the same storage. Ordinary source-level operations can interleave. Atomics provides specified synchronization and atomic operations for supported shared typed arrays, but the application must still define the protocol.",
    steps: [
      {
        title: "Choose message passing before sharing",
        body: "Message passing and ownership transfer often give simpler boundaries. Shared memory can reduce copies but introduces races, memory ordering, lifecycle, and cancellation problems. Browser SharedArrayBuffer availability also depends on the required cross-origin isolation conditions.",
      },
      {
        title: "Use atomic operations for atomic intent",
        body: "Reading a counter, adding one, and writing it back is not one atomic operation. Atomics.add provides an atomic read-modify-write on supported arrays. A flag protocol must specify publication and observation order rather than relying on a convenient observed schedule.",
      },
      {
        title: "Avoid blocking the wrong agent",
        body: "Atomics.wait is not available for blocking the browser main thread. Worker waits need wake-up, timeout, shutdown, and lost-notification reasoning. A lock-free label does not imply wait-free progress or better performance; contention and cache behavior must be measured.",
      },
    ],
    code: `const buffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);\nconst counter = new Int32Array(buffer);\nAtomics.add(counter, 0, 1);\nconsole.log(Atomics.load(counter, 0));\n// A multi-field protocol needs an explicit synchronization design.`,
    pitfalls: [
      "Assuming counter[0]++ is an atomic cross-worker increment.",
      "Blocking the UI agent with a worker-style waiting design.",
      "Sharing memory to optimize a workload before measuring message cost.",
    ],
    practice:
      "Compare a worker counter using ordinary increments with Atomics.add. Then design a bounded producer/consumer protocol including shutdown and timeout behavior.",
    quiz: {
      question: "What does shared storage alone guarantee about a read-modify-write operation?",
      choices: [
        "It does not make the compound operation atomic",
        "It serializes all agents",
        "It prevents races automatically",
      ],
      answer: 0,
      explanation: "Sharing bytes and synchronizing operations are separate requirements.",
    },
    sources: [
      {
        title: "MDN · Atomics",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics",
      },
    ],
  }),
  deep("react", {
    slug: "fiber-lanes-and-scheduling",
    title: "Fiber, lanes & speculative work",
    description: "Relate React's internal work model to its public scheduling guarantees.",
    prerequisites: ["render-and-commit", "concurrent-rendering"],
    invariant:
      "Only a selected commit becomes the visible tree; speculative render work must remain safe to restart.",
    mental:
      "Fiber is React's implementation structure for component work and retained state. Lanes organize pending work and priority relationships. These internals explain behavior, but their exact numbers, algorithms, and representation are not a public compatibility contract.",
    steps: [
      {
        title: "Separate current and candidate work",
        body: "React can retain a committed tree while preparing another result. A component call in the work-in-progress calculation is evidence of render work, not evidence of a DOM update. State identity and queued updates must survive interruptions without treating a discarded candidate as external truth.",
      },
      {
        title: "Use public scheduling controls",
        body: "Transitions and deferred values express urgency through supported APIs. Concurrent work can yield between units, but React cannot preempt an arbitrary long-running JavaScript function at every instruction. Expensive monolithic calculations still block their agent and may need algorithm changes or a worker.",
      },
      {
        title: "Read source as versioned evidence",
        body: "When debugging scheduler behavior, pin the React version and inspect the relevant reconciler implementation. Do not build business behavior around lane bit values or internal fields. Use Profiler commits, user-visible responsiveness, and reproducible schedules to validate a hypothesis.",
      },
    ],
    code: `const [input, setInput] = useState('');\nconst [query, setQuery] = useState('');\nfunction change(value: string) {\n  setInput(value);\n  startTransition(() => setQuery(value));\n}\n// No assumption about a particular internal lane number.`,
    pitfalls: [
      "Treating Fiber internals as a stable application API.",
      "Calling transitions parallel execution.",
      "Interpreting render logs as commit counts.",
    ],
    practice:
      "Compare component-entry logs with Profiler commits during an interrupted search transition. Explain which evidence proves a visible update and which only proves calculation occurred.",
    quiz: {
      question: "Can a render entry exist without a corresponding visible commit?",
      choices: ["Yes", "No", "Only for class components"],
      answer: 0,
      explanation:
        "React can restart or abandon candidate work. Rendering and committing have different contracts.",
    },
    sources: [
      { title: "React · useTransition", url: "https://react.dev/reference/react/useTransition" },
      {
        title: "React source · Fiber work loop",
        url: "https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js",
      },
    ],
  }),
  deep("react", {
    slug: "hook-identity",
    title: "Hook identity, order & custom hooks",
    description:
      "Understand why call order is a state-addressing contract and why use has distinct rules.",
    prerequisites: ["identity-and-keys", "state-and-batching"],
    invariant:
      "Ordinary hooks must preserve their supported call order for a component identity across renders.",
    mental:
      "Hook state is associated with a component's identity and ordered hook calls, not a variable name. A custom hook shares logic; separate calls normally create separate state ownership.",
    steps: [
      {
        title: "Keep the hook sequence stable",
        body: "A conditionally skipped useState or useEffect can shift the relationship between calls and retained state. Early returns before hooks can create the same problem. Move branching into the effect or component composition, and use the hooks lint rules to catch unsupported call structures.",
      },
      {
        title: "Separate reusable logic from shared state",
        body: "Two calls to useCounter do not share a counter merely because the function has the same name. Shared state needs a common owner or a store/subscription contract. Returning a new object from a custom hook can still affect consumer dependencies and memo boundaries.",
      },
      {
        title: "Treat special APIs precisely",
        body: "React's use API has different conditional/loop rules than ordinary hooks, but it still has contextual constraints and must not be wrapped in a try/catch that interferes with suspension. Compiler and lint rules evolve; consult the installed-version documentation instead of reducing all APIs to one slogan.",
      },
    ],
    code: `function useCounter() {\n  const [count, setCount] = useState(0);\n  return { count, increment: () => setCount(c => c + 1) };\n}\nfunction Compare() {\n  const left = useCounter();\n  const right = useCounter(); // independent state\n  return <p>{left.count} / {right.count}</p>;\n}`,
    pitfalls: [
      "Calling a hook after a conditional early return.",
      "Assuming custom hooks are implicit singletons.",
      "Applying ordinary-hook rules to use without checking its documented exceptions.",
    ],
    practice:
      "Create a conditional-hook failure, fix it through component composition, and then compare two custom-hook calls with one lifted owner. State which identity owns each value.",
    quiz: {
      question: "Do two useCounter calls automatically share state?",
      choices: [
        "No; reuse of logic is different from shared ownership",
        "Yes",
        "Only outside Strict Mode",
      ],
      answer: 0,
      explanation:
        "Each call participates in its component's hook state. Sharing requires a deliberate common owner or external store.",
    },
    sources: [
      { title: "React · Rules of hooks", url: "https://react.dev/reference/rules/rules-of-hooks" },
      { title: "React · use", url: "https://react.dev/reference/react/use" },
    ],
  }),
  deep("react", {
    slug: "hydration-and-ids",
    title: "Hydration, useId & deterministic first renders",
    description:
      "Diagnose mismatches without hiding them behind suppression or client-only rendering.",
    prerequisites: ["react-server-components", "rendering-strategies"],
    invariant:
      "The initial client tree must match the server-rendered content under the hydration contract.",
    mental:
      "Hydration reuses existing HTML while connecting behavior to a matching React tree. A visually similar page can still mismatch in attributes, text, structure, IDs, locale, or data version.",
    steps: [
      {
        title: "Identify nondeterministic inputs",
        body: "Time, random values, locale defaults, browser-only APIs, invalid HTML nesting, and inconsistent external-store snapshots can differ between environments. A typeof window branch in render often produces two different first trees rather than solving the mismatch.",
      },
      {
        title: "Use IDs for their intended purpose",
        body: "useId supports stable accessibility relationships across server and client when the component tree matches. It is not a data ID generator and should not be used for list keys. Multiple roots may need coordinated identifierPrefix settings in the server/client integration.",
      },
      {
        title: "Repair the contract",
        body: "Serialize a consistent initial snapshot, provide explicit locale/time-zone inputs, or intentionally use an appropriate post-hydration client update. suppressHydrationWarning is a limited escape hatch, not a reconciliation strategy. Record recoverable hydration failures and test production HTML through real navigation and reload paths.",
      },
    ],
    code: `function EmailField() {\n  const id = useId();\n  return <>\n    <label htmlFor={id}>Email</label>\n    <input id={id} type="email" />\n  </>;\n}\n// Use stable entity IDs, not useId(), for list keys.`,
    pitfalls: [
      "Suppressing every warning rather than finding different initial inputs.",
      "Using useId as a list identity.",
      "Implicit server/client locale or timezone assumptions.",
    ],
    practice:
      "Inject a date-format mismatch and inspect the exact HTML and first client inputs. Fix it with explicit serialized context and verify accessibility IDs remain paired.",
    quiz: {
      question: "Is useId intended as a source of list keys?",
      choices: ["No", "Yes", "Only for arrays shorter than ten"],
      answer: 0,
      explanation:
        "List keys represent data identity. useId serves stable ID relationships such as accessible labels.",
    },
    sources: [
      {
        title: "React · hydrateRoot",
        url: "https://react.dev/reference/react-dom/client/hydrateRoot",
      },
      { title: "React · useId", url: "https://react.dev/reference/react/useId" },
    ],
  }),
  deep("react", {
    slug: "portals-refs-and-error-boundaries",
    title: "Portals, refs & error-boundary scope",
    description:
      "Separate the React tree, the DOM tree, imperative access, and failure containment.",
    prerequisites: ["render-and-commit", "accessibility"],
    invariant:
      "DOM placement does not redefine React ownership, context, or every event relationship.",
    mental:
      "A portal places host nodes elsewhere while keeping their React ownership. A ref exposes an imperative capability after relevant commit work. An error boundary contains eligible descendant rendering failures, not every asynchronous exception in the app.",
    steps: [
      {
        title: "Follow React and DOM ancestry separately",
        body: "Portal children remain descendants in the React tree for context and React event propagation. Their DOM ancestors can differ for layout, styling, native listeners, and focus. A modal still needs correct semantics, focus management, and dismissal behavior.",
      },
      {
        title: "Keep imperative capabilities narrow",
        body: "Read or mutate refs in appropriate phases rather than using them as invisible render inputs. A ref change does not itself schedule a render. Callback-ref lifecycle and cleanup semantics depend on the supported React version; do not assume attachment happens during speculative rendering.",
      },
      {
        title: "Place failure boundaries by ownership",
        body: "Boundaries can catch eligible descendant render failures and support recovery UI. They do not generally catch exceptions in event handlers, ordinary timer callbacks, or server rendering through the same client mechanism. Classify expected results separately and handle asynchronous failures where they are owned.",
      },
    ],
    code: `function Modal({ children }: { children: React.ReactNode }) {\n  return createPortal(\n    <div role="dialog" aria-modal="true" aria-label="Details">{children}</div>,\n    document.getElementById('modal-root')!,\n  );\n}\n// Add focus entry, containment, Escape, and focus restoration.`,
    pitfalls: [
      "Assuming a portal stops React event propagation.",
      "Expecting an error boundary to catch every rejected fetch.",
      "Using ref.current changes as a reactive state system.",
    ],
    practice:
      "Build a portal modal and trace both a native DOM listener and a React ancestor handler. Add a render error and a timer error, then explain their different recovery paths.",
    quiz: {
      question: "Does a portal necessarily change a child's React ownership tree?",
      choices: ["No", "Yes", "Only when it has context"],
      answer: 0,
      explanation:
        "A portal changes host-node placement while preserving the relevant React parent relationship.",
    },
    sources: [
      { title: "React · createPortal", url: "https://react.dev/reference/react-dom/createPortal" },
      {
        title: "React · Catching rendering errors",
        url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary",
      },
    ],
  }),
  deep("nextjs", {
    slug: "flight-and-serialization",
    title: "RSC payloads, serialization & client graphs",
    description:
      "Trace what crosses a server/client boundary and what becomes a browser dependency.",
    prerequisites: ["react-server-components", "modules-and-bundlers"],
    invariant:
      "A server-only capability must not enter the client module graph or serialized client-visible data.",
    mental:
      "The RSC transport carries a React-specific representation, not simply the page's HTML or a generic JSON API. Module references, serialized values, and rendered server content have different roles.",
    steps: [
      {
        title: "Audit both code and data edges",
        body: "use client creates a client module entry and includes its transitive client dependencies. A seemingly small shared helper can import a server SDK into that graph. Separately, serializable props can expose fields even when the data-fetching code itself remains on the server.",
      },
      {
        title: "Use supported serialization contracts",
        body: "React supports a defined set of boundary values; an arbitrary closure or database class instance is not automatically a valid prop. Server Functions have special reference semantics, not ordinary function serialization. Keep client DTOs minimal and map errors deliberately.",
      },
      {
        title: "Inspect real artifacts",
        body: "Compare initial HTML, subsequent RSC responses, and production client chunks. Build-time tree shaking is not a secrecy guarantee if sensitive data was serialized or an exposed public variable was inlined. Server rendering of a Client Component also does not remove its browser hydration requirements.",
      },
    ],
    code: `// Server boundary: map explicitly, do not spread a private entity.\nconst product = await repository.get(id);\nconst dto = { id: product.id, name: product.name };\nreturn <FavoriteButton product={dto} />;\n// Inspect HTML, RSC responses, and chunks for accidental exposure.`,
    pitfalls: [
      "Treating RSC payloads as secret because they are not visible text.",
      "Spreading a full database model into client props.",
      "Assuming tree shaking is a security boundary.",
    ],
    practice:
      "Trace an intentionally secret marker through a server entity. Verify it is absent from HTML, RSC payloads, client bundles, logs, and exported data.",
    quiz: {
      question:
        "Can server-only code remain private while its returned props still leak sensitive data?",
      choices: ["Yes", "No", "Only in development"],
      answer: 0,
      explanation: "Execution location and serialized data exposure are independent boundaries.",
    },
    sources: [
      { title: "Next.js · Data security", url: "https://nextjs.org/docs/app/guides/data-security" },
    ],
  }),
  deep("nextjs", {
    slug: "deployment-cache-coherence",
    title: "Deployment skew & cache coherence",
    description:
      "Reason about old clients, new servers, ephemeral instances, and versioned cached representations.",
    prerequisites: ["nextjs-caching", "schema-evolution"],
    invariant:
      "A cache key and serialized representation must remain compatible with the deployment and authorization context that consumes them.",
    mental:
      "A release does not atomically replace every browser, server instance, cache entry, and background job. Compatibility windows exist even when the deployment button reports success.",
    steps: [
      {
        title: "Name each cache and owner",
        body: "Process memory, shared remote storage, prerendered output, router state, and HTTP caches have separate persistence and invalidation behavior. Current Cache Components keys include build identity. A durable shared store does not imply entries transparently survive deployment-key changes.",
      },
      {
        title: "Support version coexistence",
        body: "An old browser can send requests or action references to a new server. Framework/host skew protection and compatible contracts matter. Database and event-schema migrations must allow the supported overlap window; rollback of a binary does not restore old data.",
      },
      {
        title: "Test beyond one warm instance",
        body: "Exercise cold starts, concurrent replicas, rolling releases, cache misses after deployment, and a browser with existing router state. Verify private entries cannot cross tenant or deployment boundaries. Use release identifiers in traces and a defined invalidation/rollback plan.",
      },
    ],
    code: `Representation contract:\n  key = deployment + tenant scope + operation + inputs\n  value = explicit versioned DTO\n  invalidation owner = authoritative mutation workflow\n  storage lifetime != semantic compatibility lifetime\n  test = old browser + new server + cold cache`,
    language: "text",
    pitfalls: [
      "Treating instance memory as durable shared storage.",
      "A successful deploy assumed to invalidate every browser cache.",
      "Ignoring old clients during a data-model migration.",
    ],
    practice:
      "Write a two-version deployment test covering a stale browser, a new Server Action implementation, and a changed cache representation. Define which combinations are supported.",
    quiz: {
      question: "Does durable cache storage alone guarantee cross-deployment compatibility?",
      choices: ["No", "Yes", "Only for JSON"],
      answer: 0,
      explanation:
        "Persistence, key scope, and representation compatibility are different contracts.",
    },
    sources: [
      { title: "Next.js · Self-hosting", url: "https://nextjs.org/docs/app/guides/self-hosting" },
      { title: "Next.js · Caching", url: "https://nextjs.org/docs/app/getting-started/caching" },
    ],
  }),
  deep("network", {
    slug: "http-multiplexing",
    title: "HTTP multiplexing & head-of-line blocking",
    description: "Compare application streams, transport loss, connection reuse, and priority.",
    prerequisites: ["request-journey", "http-semantics"],
    invariant:
      "Multiplexing application messages does not remove every shared transport bottleneck.",
    mental:
      "HTTP/2 multiplexes streams over a TCP connection. HTTP/3 uses QUIC streams over UDP. The location of ordering and loss recovery changes which work can be delayed by a lost packet.",
    steps: [
      {
        title: "Separate stream and connection effects",
        body: "HTTP/2 reduces request-level serialization compared with older patterns, but TCP's ordered delivery can delay application data after packet loss even when it belongs to another HTTP stream. More requests on one connection is therefore not equivalent to independent transport progress.",
      },
      {
        title: "Understand HTTP/3's tradeoff",
        body: "QUIC provides stream-level delivery and integrated TLS behavior, avoiding the same TCP-wide ordered-delivery dependency between independent streams. It still has congestion control, flow control, connection-level resource limits, and application dependencies. It does not make latency or packet loss disappear.",
      },
      {
        title: "Measure the actual waterfall",
        body: "Connection reuse, DNS, prioritization, server scheduling, proxies, and resource discovery often matter more than an acronym. Avoid excessive preloading or connection proliferation. Compare representative networks and loss patterns, and verify which protocol the browser and origin actually negotiated.",
      },
    ],
    code: `Browser waterfall questions:\n1. Was the connection reused?\n2. Which HTTP protocol was negotiated?\n3. Was delay queueing, transport loss, or server work?\n4. Did the critical resource start late because it was discovered late?\n5. Did speculative requests compete with urgent work?`,
    language: "text",
    pitfalls: [
      "Describing HTTP/3 as TCP followed by TLS.",
      "Assuming multiplexing removes all head-of-line effects.",
      "Prefetching every resource without a network budget.",
    ],
    practice:
      "Compare the same page under HTTP/2 and HTTP/3 with controlled loss and connection reuse. Attribute the observed difference to a mechanism rather than the protocol name alone.",
    quiz: {
      question: "Can TCP ordered delivery delay multiple HTTP/2 streams after loss?",
      choices: ["Yes", "No", "Only if JavaScript is disabled"],
      answer: 0,
      explanation:
        "Independent HTTP streams still share TCP's ordered byte delivery on that connection.",
    },
    sources: [
      { title: "RFC 9113 · HTTP/2", url: "https://www.rfc-editor.org/rfc/rfc9113" },
      { title: "RFC 9114 · HTTP/3", url: "https://www.rfc-editor.org/rfc/rfc9114" },
    ],
  }),
  deep("network", {
    slug: "service-workers-and-offline",
    title: "Service workers & offline coherence",
    description: "Treat an offline cache as another deployment and data-consistency boundary.",
    prerequisites: ["http-caching", "schema-evolution"],
    invariant:
      "An offline response must preserve the correct user, version, and freshness policy rather than merely return something cached.",
    mental:
      "A service worker is a lifecycle-managed network intermediary with its own script version and storage APIs. Installing an update and controlling all current clients are separate events.",
    steps: [
      {
        title: "Follow lifecycle states",
        body: "A newly installed worker may wait while an older worker controls existing clients. skipWaiting and clients.claim change takeover behavior but can create old-page/new-worker combinations. Plan asset and API compatibility instead of using immediate takeover as an unquestioned default.",
      },
      {
        title: "Choose a strategy per resource",
        body: "Cache-first can suit immutable assets; network-first or stale strategies may suit other resources under explicit budgets. The Cache API is not the same as the HTTP cache and does not automatically implement every Cache-Control freshness rule for your application. Private API responses require deliberate identity isolation and logout handling.",
      },
      {
        title: "Design recovery and eviction",
        body: "Storage quotas and eviction are real. Offline writes need operation identity, conflict handling, and visible pending status. Avoid caching a broken shell indefinitely, and provide a path to recover from a bad worker deployment. Test multiple tabs, expired sessions, lost connectivity, and version overlap.",
      },
    ],
    code: `// Strategy sketch, not a complete service worker.\nself.addEventListener('fetch', event => {\n  // Classify URL, method, identity, and representation first.\n  // Apply a resource-specific cache/network policy.\n  // Do not cache every authenticated response blindly.\n});`,
    pitfalls: [
      "Treating Cache API storage as automatic HTTP freshness handling.",
      "Serving one user's offline data after logout or account switch.",
      "Forcing a new worker onto incompatible old pages.",
    ],
    practice:
      "Design an offline document reader with two account switches and a worker update. Specify asset versioning, private cache cleanup, quota failure, and stale-content disclosure.",
    quiz: {
      question:
        "Does a newly installed service worker necessarily control all existing tabs immediately?",
      choices: ["No", "Yes", "Only over HTTP/2"],
      answer: 0,
      explanation: "Installation, activation, and client control are separate lifecycle steps.",
    },
    sources: [
      {
        title: "MDN · Service Worker API",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API",
      },
    ],
  }),
  deep("data", {
    slug: "leases-and-fencing",
    title: "Leases, distributed locks & fencing tokens",
    description: "Protect a resource from a stale owner that resumes after its lease expires.",
    prerequisites: ["concurrency-control", "consistency-models"],
    invariant:
      "The protected resource must reject stale ownership, not merely trust that a lock was once acquired.",
    mental:
      "A lease grants ownership for a limited interval. A paused process may resume after that interval and still believe it owns the resource. A lock service's current view does not automatically constrain writes to another system.",
    steps: [
      {
        title: "Model the paused-owner failure",
        body: "Client A acquires a lease and stalls. The lease expires; B acquires it and writes. A resumes and writes late. Checking the lease once at the beginning cannot prevent this sequence, and local clocks, pauses, and network delays complicate timing assumptions.",
      },
      {
        title: "Enforce monotonic ownership at the resource",
        body: "A fencing token increases with ownership grants. The protected resource tracks the highest accepted token and rejects older writes. The token issuer needs the required ordering guarantee, and every protected write path must enforce the check. A random UUID identifies an owner but does not provide monotonic fencing order.",
      },
      {
        title: "Prefer simpler authoritative invariants",
        body: "Database constraints, conditional version updates, or a transaction may solve the actual problem more directly. Distributed locking adds lease renewal, partial failure, and recovery costs. An operation must still be idempotent or reconcilable when its outcome is ambiguous.",
      },
    ],
    code: `// Resource-side conditional write concept:\nUPDATE documents SET body = $1, fence = $2\nWHERE id = $3 AND fence < $2;\n-- Reject stale tokens. Define equal-token retry semantics separately.\n-- The resource, not just the client, enforces ownership.`,
    language: "sql",
    pitfalls: [
      "A lease checked once before a long external operation.",
      "A random owner ID called a fencing token.",
      "One write path bypassing resource-side enforcement.",
    ],
    practice:
      "Pause owner A past lease expiry, let B commit, then resume A. Prove the resource rejects A's stale write and that retry behavior for the current owner is defined.",
    quiz: {
      question: "Where must stale fencing tokens be rejected?",
      choices: [
        "At the protected resource's write boundary",
        "Only in the frontend",
        "Only when acquiring the lock",
      ],
      answer: 0,
      explanation:
        "A stale owner may resume without another lock check. Resource-side enforcement is what prevents its late write.",
    },
    sources: [
      {
        title: "Martin Kleppmann · Distributed locking",
        url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html",
      },
    ],
  }),
  deep("data", {
    slug: "sagas-and-compensation",
    title: "Sagas, compensation & ambiguous outcomes",
    description:
      "Coordinate multi-service workflows without pretending compensation erases history.",
    prerequisites: ["events-and-outbox", "retries-and-idempotency"],
    invariant:
      "Every externally visible step needs a durable operation identity and a recovery path for unknown outcomes.",
    mental:
      "A saga coordinates local transactions and compensating actions. Compensation is a new business operation that attempts to restore an acceptable state; it is not a universal time-reversing rollback.",
    steps: [
      {
        title: "Separate local atomicity from global workflow",
        body: "Inventory reservation, payment authorization, and shipment creation can live in different authorities. Committing one does not atomically commit the others. A workflow must persist progress and intent so a crash does not erase the knowledge needed for recovery.",
      },
      {
        title: "Design compensation semantics",
        body: "Releasing a reservation differs from refunding a settled payment or cancelling a shipped package. Some actions are irreversible or only partially reversible. Compensations can fail and need retries, manual escalation, and auditability. Order and concurrency must follow the business model.",
      },
      {
        title: "Reconcile unknown results",
        body: "A timeout after a provider commit is ambiguous. Query by operation identity or use the provider's idempotency protocol before creating a new action. Decide between centralized orchestration and event choreography based on ownership and observability, not a preference for diagrams with fewer arrows.",
      },
    ],
    code: `Order workflow:\nreserve inventory → authorize payment → request shipment\nFailure before shipment: release reservation / void authorization\nUnknown payment outcome: reconcile by operation ID\nCompensation failure: durable retry + explicit escalation\nEach local step has its own transaction and idempotency contract.`,
    language: "text",
    pitfalls: [
      "Calling a refund a deletion of the original charge.",
      "A workflow stored only in one process's memory.",
      "A new payment attempt created because the previous response timed out.",
    ],
    practice:
      "Write a recovery table for each checkout step: success, definite failure, timeout/unknown, duplicate delivery, and failed compensation. Assign the authoritative record for each.",
    quiz: {
      question: "Is compensation necessarily an exact inverse of the original action?",
      choices: ["No; it is a domain-specific recovery operation", "Yes", "Only for payments"],
      answer: 0,
      explanation:
        "External side effects and time cannot generally be erased. Compensation aims for an acceptable business state.",
    },
    sources: [
      {
        title: "AWS · Saga orchestration",
        url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html",
      },
    ],
  }),
  deep("engineering", {
    slug: "typescript-variance",
    title: "Variance, structural typing & sound boundaries",
    description:
      "Reason about assignability, function inputs, mutable containers, and erased guarantees.",
    prerequisites: ["typescript-boundaries", "solid-liskov"],
    invariant:
      "A consumer's accepted inputs and promised outputs must remain safe under substitution, beyond matching property names.",
    mental:
      "Variance describes how a generic relationship changes when its type argument changes. Structural typing and deliberate TypeScript compatibility concessions make it important to test your exact API shape and compiler options.",
    steps: [
      {
        title: "Separate producer from consumer",
        body: "A producer of a narrower subtype can often serve a broader consumer of outputs. A callback that accepts only a subtype cannot safely handle every value of the broader type. Function-property and method syntax have relevant checking differences under strictFunctionTypes, so test the declaration style you publish.",
      },
      {
        title: "Watch mutable aliasing",
        body: "A mutable container that is widened can expose a write path incompatible with an existing narrow alias. Readonly interfaces remove some writes from the public capability but do not deep-freeze runtime objects. Branded IDs can help distinguish structurally identical concepts while runtime parsing still validates external input.",
      },
      {
        title: "Design generics around useful relationships",
        body: "Conditional and mapped types can express powerful transformations but also distribute over unions or widen unexpectedly. Compile-time tests should cover allowed and forbidden assignments. Avoid complex type machinery that hides a simpler domain contract or pretends erased types enforce runtime constraints.",
      },
    ],
    code: `type Handler<T> = (value: T) => void;\ntype Animal = { name: string };\ntype Dog = Animal & { bark(): void };\nconst dogOnly: Handler<Dog> = dog => dog.bark();\n// Under strictFunctionTypes, this must not handle arbitrary Animal:\n// const unsafe: Handler<Animal> = dogOnly;`,
    pitfalls: [
      "Treating method and function-property variance checks as identical.",
      "Assuming readonly deeply freezes runtime data.",
      "Using a type assertion to bypass an unsafe substitution.",
    ],
    practice:
      "Create compile-time tests for producer, consumer, and mutable-container APIs under your actual tsconfig. Explain any accepted assignment that remains behaviorally unsafe.",
    quiz: {
      question: "Can a handler requiring Dog safely accept every Animal?",
      choices: ["No", "Yes", "Only because both have a name"],
      answer: 0,
      explanation:
        "The broader caller may supply an Animal without bark. Input requirements cannot be strengthened invisibly.",
    },
    sources: [
      {
        title: "TypeScript · Generics and variance",
        url: "https://www.typescriptlang.org/docs/handbook/2/generics.html",
      },
      {
        title: "TypeScript · Type compatibility",
        url: "https://www.typescriptlang.org/docs/handbook/type-compatibility.html",
      },
    ],
  }),
  deep("engineering", {
    slug: "model-based-testing",
    title: "Property-based & model-based testing",
    description:
      "Test invariants across generated action sequences rather than only a few happy paths.",
    prerequisites: ["testing-strategy", "state-machines"],
    invariant:
      "A test oracle must express the intended contract independently enough to catch implementation errors.",
    mental:
      "Example tests check selected cases. Property-based tests generate many inputs under a property; model-based tests compare a system with a simpler behavioral model across action sequences. The model must not merely duplicate the implementation's mistakes.",
    steps: [
      {
        title: "Choose a useful property",
        body: "Round trips, idempotency, monotonic versions, non-negative stock, and latest-operation ownership can be stronger than a single expected value. Constrain generators to meaningful domains, but include boundaries and invalid transitions deliberately. A property that always returns true adds no confidence.",
      },
      {
        title: "Generate schedules, not only values",
        body: "Concurrency bugs depend on completion order. A command model can start, cancel, retry, and complete operations in generated sequences. Use controlled promises or barriers instead of relying on lucky wall-clock timing. The state-machine playground's stale completion is one small example of a schedule-sensitive invariant.",
      },
      {
        title: "Shrink and preserve evidence",
        body: "Shrinking finds a smaller failing case, but the minimized case must retain the causal condition. Save the seed, generated sequence, versions, and environment so failures reproduce. Integration tests remain necessary for database and transport guarantees that an in-memory model cannot establish.",
      },
    ],
    code: `Property: a completion may commit only for the active operation.\nCommands: start(id), cancel(id), succeed(id), fail(id), retry(newId).\nGenerate: duplicate and out-of-order completions.\nAssert after every command: legal state + matching ownership.\nKeep a minimal failing sequence and seed as regression evidence.`,
    language: "text",
    pitfalls: [
      "A model copied line for line from the implementation.",
      "Random sleep-based tests with no reproducible schedule.",
      "Generated fake-database tests claimed to prove real isolation.",
    ],
    practice:
      "Generate upload workflow sequences including duplicate and stale events. Deliberately remove the identity guard and verify a generated counterexample is found and shrunk.",
    quiz: {
      question: "What makes a useful model-based oracle?",
      choices: [
        "An independently stated contract and simpler model",
        "The same code under another name",
        "Only more random inputs",
      ],
      answer: 0,
      explanation:
        "The oracle must be able to disagree with a broken implementation. Copying its logic can duplicate the same defect.",
    },
    sources: [
      {
        title: "fast-check · Model-based testing",
        url: "https://fast-check.dev/docs/advanced/model-based-testing/",
      },
    ],
  }),
  deep("engineering", {
    slug: "unicode-locale-and-time",
    title: "Unicode, locales & time-zone correctness",
    description:
      "Treat text length, user-visible characters, collation, instants, and calendar dates as distinct domains.",
    prerequisites: ["values-and-equality", "hydration-and-ids"],
    invariant:
      "A storage or formatting shortcut must not silently change the user's intended text or calendar meaning.",
    mental:
      "JavaScript strings are UTF-16 sequences, while users perceive grapheme clusters. An instant, a date in a calendar, a local wall-clock time, and a duration are also different concepts. Use the representation that matches the domain.",
    steps: [
      {
        title: "Count and compare the right thing",
        body: "String length counts UTF-16 code units. Code-point iteration still does not always match grapheme clusters such as combining sequences and emoji families. Intl.Segmenter supports appropriate segmentation. Normalization and locale collation must be chosen for the use case; display sorting is not the same as security-sensitive identifier equality.",
      },
      {
        title: "Separate dates from instants",
        body: "A birthday or billing calendar date is not inherently a UTC timestamp. Local times can be ambiguous or nonexistent around daylight-saving transitions. Store the necessary zone and calendar context, and define policy for recurrence, scheduling, and business-day boundaries instead of adding a fixed number of milliseconds blindly.",
      },
      {
        title: "Make environment defaults explicit",
        body: "Server and client locale/time-zone defaults can differ and cause hydration mismatches. Use explicit inputs for deterministic formatting and test multiple scripts, right-to-left layouts, long labels, and non-hour zone offsets. Verify library/runtime support before choosing newer date APIs.",
      },
    ],
    code: `const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });\nconst text = 'e\\u0301';\nconsole.log(text.length); // code units\nconsole.log([...segmenter.segment(text)].length); // perceived clusters\nconst format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium' });`,
    pitfalls: [
      "Using string.length as the universal user-visible character count.",
      "Treating every calendar date as midnight UTC.",
      "Implicit locale defaults in server-rendered text.",
    ],
    practice:
      "Test a name field and a recurring meeting across combining text, emoji sequences, RTL display, and a daylight-saving transition. State which domain each stored value represents.",
    quiz: {
      question: "Does iterating code points always count user-perceived grapheme clusters?",
      choices: ["No", "Yes", "Only for emoji"],
      answer: 0,
      explanation:
        "A grapheme cluster can contain multiple code points. Segmentation depends on the text-domain requirement.",
    },
    sources: [
      {
        title: "MDN · Intl.Segmenter",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter",
      },
      { title: "Unicode · Text segmentation", url: "https://unicode.org/reports/tr29/" },
    ],
  }),
  deep("engineering", {
    slug: "complexity-and-virtualization",
    title: "Algorithmic cost, virtualization & fairness",
    description:
      "Reduce work before memoizing it and preserve interaction contracts when rendering less DOM.",
    prerequisites: ["performance-budgets", "browser-rendering"],
    invariant:
      "A faster view must preserve identity, focus, navigation, and the user's ability to reach the data.",
    mental:
      "Performance comes from how much work happens, where it happens, and when the user needs it. Memoization caches work; virtualization limits rendered items; scheduling changes priority. These are different interventions.",
    steps: [
      {
        title: "Model the dominant cost",
        body: "Repeated linear searches inside a list transformation can create quadratic work. A Map may reduce lookup cost while adding memory. Sorting, parsing, serialization, and layout can dominate different datasets. Measure representative cardinality and distributions before optimizing tiny expressions.",
      },
      {
        title: "Virtualize with identity and geometry",
        body: "A windowed list renders a subset, often with overscan and estimated sizes. Stable keys, variable row heights, scroll anchoring, keyboard navigation, focus preservation, and assistive-technology access all need a contract. Rendering fewer rows must not make focused content disappear unpredictably.",
      },
      {
        title: "Yield to the host deliberately",
        body: "A long CPU function still blocks even inside a transition or async function. Microtask chains do not necessarily yield to input and painting. Break work into bounded tasks or offload suitable computation to a worker, while measuring communication and startup cost.",
      },
    ],
    code: `const ownersById = new Map(owners.map(owner => [owner.id, owner]));\nconst rows = projects.map(project => ({\n  ...project, owner: ownersById.get(project.ownerId),\n}));\n// Compare with a full owners.find(...) scan for every project.\n// Then profile DOM/layout before choosing virtualization.`,
    pitfalls: [
      "Memoizing quadratic work while inputs change every time.",
      "Virtualization that loses keyboard focus or stable row identity.",
      "A recursive microtask chain described as yielding to paint.",
    ],
    practice:
      "Profile a 20,000-row explorer. Compare an indexed join, a bounded DOM window, and worker-based indexing separately, including memory and keyboard behavior.",
    quiz: {
      question: "Does marking a long synchronous calculation as a transition move it to a worker?",
      choices: ["No", "Yes", "Only with useMemo"],
      answer: 0,
      explanation:
        "Scheduling priority does not create another execution thread or make arbitrary JavaScript instructions preemptible.",
    },
    sources: [
      {
        title: "web.dev · Optimize long tasks",
        url: "https://web.dev/articles/optimize-long-tasks",
      },
    ],
  }),
  deep("architecture", {
    slug: "architecture-fitness-functions",
    title: "Architecture fitness functions & boundary tests",
    description: "Turn dependency diagrams into enforceable properties with meaningful exceptions.",
    prerequisites: ["modular-monolith", "architecture-decisions"],
    invariant:
      "An architectural rule should preserve an important property and expose exceptions, rather than merely enforce a preferred folder spelling.",
    mental:
      "A fitness function checks whether an architecture still satisfies a chosen constraint as the system evolves. Import rules, compatibility tests, bundle budgets, and runtime isolation checks preserve different properties.",
    steps: [
      {
        title: "Express the property precisely",
        body: "Forbid feature-internal cross-imports, server-only dependencies in client entries, or cycles across domain packages. Define public entry points and allowed direction. A rule should explain what risk it controls and which actor owns it; broad exceptions can silently erase the architecture.",
      },
      {
        title: "Test both code and deployment boundaries",
        body: "Static graph checks catch dependency violations, but cannot prove runtime API compatibility or tenant isolation. Add contract tests for independently released modules and production checks for critical capability assumptions. Keep the set small enough that failures receive attention.",
      },
      {
        title: "Make exceptions reviewable",
        body: "An emergency exception can be reasonable when it has an owner, explanation, expiry, and migration path. Track recurring bypasses as evidence the architecture may no longer match the organization. Rules that block legitimate evolution without preserving value become ceremony.",
      },
    ],
    code: `Policy examples:\nfeatures/* may import another feature only through its public API.\nshared/* must not import features/*.\nClient entries must not reach server-only modules.\nA release must pass the supported shell/remote contract matrix.\nEach exception has an owner, reason, and revisit date.`,
    language: "text",
    pitfalls: [
      "A folder diagram with no enforcement.",
      "A global disable that makes every violation invisible.",
      "Static import tests claimed to prove runtime security.",
    ],
    practice:
      "Choose two valuable constraints in a real app. Write a failing counterexample for each, enforce them, and specify how a justified temporary exception is reviewed.",
    decision: {
      use: "Long-lived cross-team constraints that repeatedly regress or are expensive to review manually.",
      avoid: "Rules about incidental style that do not preserve a meaningful system property.",
      tradeoff:
        "Automated feedback and durable boundaries in exchange for rule maintenance and a deliberate exception process.",
    },
    quiz: {
      question: "What should an architecture fitness function preserve?",
      choices: [
        "A meaningful measurable constraint",
        "Every historical folder name forever",
        "Only a diagram's visual appearance",
      ],
      answer: 0,
      explanation:
        "The rule should protect a real property and evolve when its assumptions change.",
    },
    sources: [
      {
        title: "Thoughtworks · Fitness function driven development",
        url: "https://www.thoughtworks.com/insights/articles/fitness-function-driven-development",
      },
    ],
  }),
  deep("security", {
    slug: "supply-chain-and-capabilities",
    title: "Dependency supply chains & capability boundaries",
    description:
      "Audit install-time, build-time, server, browser, and sandbox privileges separately.",
    prerequisites: ["ssrf-and-secrets", "xss-and-csp"],
    invariant:
      "A dependency should receive only the capabilities required at the phase where it runs.",
    mental:
      "A package is executable code in one or more environments. A tiny frontend dependency can have a large install-time or build-time privilege surface. A version pin improves reproducibility but does not establish trust or eliminate vulnerabilities.",
    steps: [
      {
        title: "Map execution phases",
        body: "Install scripts can access the developer or CI environment; build plugins can read inputs and secrets; server dependencies execute with backend capabilities; browser scripts can act inside the page origin. Review the actual dependency graph and lifecycle scripts, not only the direct package's name.",
      },
      {
        title: "Keep provenance and updates deliberate",
        body: "Use a lockfile, verify expected sources, constrain script execution where supported, and review meaningful updates. Signing or provenance can establish information about publication without proving the code is safe. Vulnerability scanning is evidence with coverage limits, not a complete review.",
      },
      {
        title: "Contain executable examples",
        body: "A teaching playground should avoid evaluating edited code in the application's main document. Worker termination, opaque-origin frames, restrictive resource policy, input limits, and message validation reduce the capability surface. Instrumentation is still not a universal defense against hostile code; declare the supported execution contract honestly.",
      },
    ],
    code: `Execution boundary review:\ninstall → lifecycle scripts and CI credentials\nbuild → plugins, transforms, environment inputs\nserver → network, filesystem, secrets, tenant context\nbrowser → DOM, cookies, origin authority\nplayground → separate runtime + bounded messages + explicit APIs`,
    language: "text",
    pitfalls: [
      "Calling a pinned package automatically trustworthy.",
      "Only reviewing browser bundle code while install scripts run in CI.",
      "Executing editable examples with eval in the main application document.",
    ],
    practice:
      "Audit one dependency from registry artifact through install, build, and runtime. List each capability it receives and test which capabilities an isolated playground actually blocks.",
    quiz: {
      question: "Does a lockfile by itself prove a dependency is safe?",
      choices: [
        "No; it primarily supports reproducibility of resolution",
        "Yes",
        "Only for small packages",
      ],
      answer: 0,
      explanation:
        "Reproducibility, provenance, vulnerability knowledge, and behavioral trust are related but distinct questions.",
    },
    sources: [
      {
        title: "OWASP · Software supply chain security",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Software_Supply_Chain_Security_Cheat_Sheet.html",
      },
    ],
  }),
];
