import { js } from "./helpers";
export const runtimeLanguage = [
  js({
    slug: "reentrancy-and-observers",
    title: "Reentrancy: when synchronous code calls you back",
    level: "Deep dive",
    description:
      "Protect invariants across getters, callbacks, event dispatch, and other unexpected control transfers.",
    prerequisites: ["errors-and-completion", "property-descriptors-and-proxies", "event-loop"],
    mental:
      "Run-to-completion prevents another task from arbitrarily interrupting a running JavaScript task. It does not prevent code you call from synchronously calling back into your object while its state is temporarily inconsistent.",
    steps: [
      {
        title: "Find synchronous extension points",
        body: "A getter, Proxy trap, comparator, user callback, coercion hook, or EventTarget dispatch can execute application code before the current function returns. These are ordinary nested calls, not necessarily a later task. Audit every external call made while maintaining a multi-field invariant.",
      },
      {
        title: "Make intermediate state unobservable",
        body: "Consider an object that updates its collection and a count in separate steps. A callback between those steps can see a broken relationship or invoke the operation again. Complete the invariant before notification, snapshot data for observers, or use a carefully defined mutation phase. A boolean busy flag needs a specified nested-call behavior rather than an arbitrary dropped operation.",
      },
      {
        title: "Separate reentrancy from asynchronous races",
        body: "A stale network completion and a synchronous nested callback can both violate ownership, but they use different schedules. Cancellation or a request-generation guard solves only the relevant part. A promise continuation is deferred, whereas a promise executor or synchronous dispatch can run immediately.",
      },
      {
        title: "Test adversarial callbacks",
        body: "Write observers that read state, mutate it again, remove themselves, or throw. Define iteration semantics for subscription lists and make cleanup exception-safe. Deferring notification can change ordering and error propagation, so it should be an explicit API contract rather than an accidental fix.",
      },
    ],
    code: `const target = new EventTarget();\nconst state = { count: 0 };\ntarget.addEventListener('change', () => console.log('observer sees:', state.count));\nfunction increment() {\n  state.count++;\n  target.dispatchEvent(new Event('change'));\n  console.log('after notification');\n}\nincrement(); // observer executes before increment returns`,
    pitfalls: [
      "Treating single-threaded execution as protection against nested reentry.",
      "Notifying observers while an invariant is half-updated.",
      "Assuming an async race guard also handles synchronous recursion.",
    ],
    practice:
      "Create a collection with a size invariant and a change observer. Make the observer call back into the collection and throw. Define notification order, removal semantics, and which state is committed before callbacks run.",
    challenge: {
      prompt: "Does a Promise executor run after the current function returns?",
      solution: `console.log('before');\nnew Promise(resolve => { console.log('executor'); resolve(); });\nconsole.log('after'); // before, executor, after`,
      explanation:
        "The executor is called synchronously during construction. Deferred reactions are a different step from running the executor.",
    },
    quiz: {
      question: "Can a synchronous observer reenter an object during one task?",
      choices: ["Yes", "No", "Only with workers"],
      answer: 0,
      explanation:
        "Run-to-completion does not prohibit nested function calls triggered by the current code.",
    },
    sources: [
      {
        title: "MDN · dispatchEvent",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent",
      },
    ],
  }),
  js({
    slug: "memory-leaks-and-retention",
    title: "Memory leaks, retained graphs & heap evidence",
    level: "Deep dive",
    description:
      "Trace retaining paths through closures, listeners, caches, detached nodes, and diagnostic tools.",
    prerequisites: ["memory-and-garbage-collection", "weak-references", "scope-and-closures"],
    mental:
      "A leak is often memory that remains reachable after its useful lifetime ends. The collector can be working correctly while an application root, listener, timer, cache, or diagnostic reference keeps an obsolete graph alive.",
    steps: [
      {
        title: "Look for roots and retaining paths",
        body: "Process globals, active host registrations, store subscriptions, and long-lived closures can keep data reachable. A detached DOM node is not necessarily collectable if a listener registry or closure still retains it. A cycle alone is not a leak under tracing collection when the entire cycle is unreachable.",
      },
      {
        title: "Separate capacity from lifetime",
        body: "A cache that retains every key indefinitely can grow without bound even if every entry was useful at insertion. TTL expiration must have an eviction or cleanup mechanism where memory bounds matter. Weak keys follow reachability rather than providing deterministic eviction, hit guarantees, or a complete resource-lifetime policy.",
      },
      {
        title: "Measure a repeated workload",
        body: "Record heap baselines, repeat a representative mount/unmount or navigation cycle, allow appropriate idle/collection opportunities, and inspect retained growth. Allocation rate, retained size, and peak memory answer different questions. Heap snapshots and dominator/retaining-path views provide evidence that a specific ownership path survives.",
      },
      {
        title: "Avoid perturbing the experiment",
        body: "DevTools consoles, selected objects, closures in the test harness, and debug registries can themselves retain objects. A finalizer not running is not proof of a leak, and a temporarily high heap is not proof that collection is broken. Remove diagnostic references and reproduce in realistic build conditions before drawing conclusions.",
      },
    ],
    code: `function createOwner() {\n  const retained = new Map();\n  return {\n    add(id, value) { retained.set(id, value); },\n    remove(id) { retained.delete(id); },\n    size() { return retained.size; }\n  };\n}\nconst owner = createOwner();\nowner.add('obsolete', { payload: Array(10).fill('data') });\nconsole.log(owner.size());\nowner.remove('obsolete');\nconsole.log(owner.size()); // ownership released; GC timing remains unspecified`,
    pitfalls: [
      "Calling every cycle a leak.",
      "Using finalizer timing as a reliable test assertion.",
      "A debugging registry keeping the suspected object alive.",
    ],
    practice:
      "Run 50 controlled mount/unmount cycles around a subscription owner. Compare heap retaining paths before and after adding explicit unsubscribe. State which measurements establish retention and which merely show allocation.",
    challenge: {
      prompt: "Does dropping one reference necessarily make the object unreachable?",
      solution: `let value = { data: 'large graph' };\nconst retained = new Map([['key', value]]);\nvalue = null;\nconsole.log(retained.has('key')); // true`,
      explanation:
        "The Map still owns a strong path to the object. Removing one local binding does not remove all retaining paths.",
    },
    quiz: {
      question: "Does an unreachable cycle necessarily leak under tracing GC?",
      choices: ["No", "Yes", "Only when it contains functions"],
      answer: 0,
      explanation:
        "Reachability from roots, not simply the existence of a cycle, determines collectability in the tracing model.",
    },
    sources: [
      {
        title: "MDN · Memory management",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management",
      },
      {
        title: "Chrome DevTools · Memory problems",
        url: "https://developer.chrome.com/docs/devtools/memory-problems",
      },
    ],
  }),
  js({
    slug: "engine-optimization-investigation",
    title: "Profiling JIT behavior without benchmark folklore",
    level: "Deep dive",
    description:
      "Connect algorithmic work, allocation, tiering, feedback, deoptimization, and representative evidence.",
    prerequisites: ["javascript-engine", "shapes-and-inline-caches", "memory-leaks-and-retention"],
    mental:
      "An optimization is useful when it improves a measured system objective under the real workload. Engine feedback and execution tiers help explain a profile, but synthetic timing can measure startup, dead work, instrumentation, or an unrepresentative input distribution instead.",
    steps: [
      {
        title: "Find the system bottleneck first",
        body: "Separate scripting time from network delay, parsing, layout, rendering, and garbage collection. A fast property-access microbenchmark is irrelevant when the interaction waits on a waterfall or creates too many DOM nodes. Define the target metric and representative cardinality before selecting a code-level optimization.",
      },
      {
        title: "Understand feedback as versioned evidence",
        body: "Hot operations can specialize around observed types, shapes, and element representations. New inputs can invalidate assumptions while preserving semantics. Thresholds and tier implementations evolve between engines and versions. Do not publish a language rule that a particular syntax is always optimized or always slow based on one release.",
      },
      {
        title: "Design a benchmark that performs useful work",
        body: "Ensure results are consumed and measure distributions across appropriate runs. Account for warmup, tier transitions, allocation, GC, competing processes, and instrumentation. Repeating a tiny operation can create an artificial hot path; a benchmark can also be optimized in ways that the production workload cannot.",
      },
      {
        title: "Validate the whole tradeoff",
        body: "A lookup index can reduce CPU while increasing memory and build cost. Object normalization may create copies that outweigh a shape benefit. Measure tail latency, responsiveness, memory, and startup under realistic data, and retain a regression workload that checks the actual user objective.",
      },
    ],
    code: `function sum(values) {\n  let total = 0;\n  for (const value of values) total += value;\n  return total;\n}\nconst inputs = [[1, 2, 3], [4, 5], []];\nconsole.log(inputs.map(sum));\nconsole.log('Profile a real workload outside this instrumented playground.');\n// These tiny inputs demonstrate correctness, not engine tier thresholds.`,
    pitfalls: [
      "Benchmarking code whose result is unused.",
      "Reporting instrumented teaching timings as production performance.",
      "Trading a tiny CPU gain for substantial retained memory without measuring it.",
    ],
    practice:
      "Choose one slow interaction, record a production-like profile, and test one hypothesis. Report latency distribution, memory, startup, data size, engine version, and the observed cost transfer.",
    challenge: {
      prompt: "Does a lower microbenchmark time prove the page is faster?",
      solution:
        "No. Establish that the measured operation materially contributes to the target interaction, then measure that interaction and its memory/startup tradeoffs under representative inputs.",
      explanation:
        "An isolated metric is evidence about the isolated workload. Transferring it to a user outcome requires a causal connection and an end-to-end validation.",
    },
    quiz: {
      question: "What must a useful optimization improve?",
      choices: [
        "A defined objective under representative conditions",
        "Only the shortest synthetic loop",
        "Only the number of source lines",
      ],
      answer: 0,
      explanation:
        "Optimizations should be judged against system goals and tradeoffs, not an isolated timing anecdote.",
    },
    sources: [
      { title: "V8 · Fast properties", url: "https://v8.dev/blog/fast-properties" },
      {
        title: "Chrome DevTools · Performance",
        url: "https://developer.chrome.com/docs/devtools/performance",
      },
    ],
  }),
  js({
    slug: "language-security-boundaries",
    title: "JavaScript security: code, keys & capabilities",
    level: "Deep dive",
    description:
      "Keep data from becoming executable code or prototype authority, and bound attacker-controlled computation.",
    prerequisites: [
      "json-and-serialization",
      "property-ownership-and-immutability",
      "regex-and-backtracking",
    ],
    mental:
      "A security boundary controls authority. Escaping, validation, parsing, prototype integrity, resource budgets, and runtime isolation protect different properties; a trick in one layer does not replace the others.",
    steps: [
      {
        title: "Keep data out of code construction",
        body: "eval and Function compile source with different environment behavior, but both turn a string into executable code. JSON.parse parses data instead of evaluating an object literal. Neither a TypeScript type nor a regex sanitizer makes arbitrary code evaluation safe. Select a constrained data protocol or a deliberately isolated execution service when code execution is the actual product.",
      },
      {
        title: "Control property-key interpretation",
        body: "Untrusted merges and special property paths can lead to prototype pollution. Validate schemas and allowed keys before constructing configuration or domain objects. A null-prototype dictionary or Map removes some prototype lookup hazards but does not validate business values, prevent every path-based bug, or make a privileged merge safe automatically.",
      },
      {
        title: "Audit capability transfer",
        body: "Giving an isolated context a network client, filesystem wrapper, DOM node, or powerful function can restore authority that the context otherwise lacked. Cross-origin browser rules, CSP, worker termination, and process isolation have different scopes. A new realm alone is not a complete hostile-code sandbox.",
      },
      {
        title: "Bound resource consumption",
        body: "Pathological regex patterns, enormous recursion, huge allocations, parsing depth, and unbounded collections can exhaust a service without traditional code injection. Enforce limits close to untrusted inputs and validate them against the deployment's actual execution model. A loop guard cannot interrupt every expensive native operation or contain every allocation.",
      },
    ],
    code: `const input = JSON.parse('{"__proto__":{"admin":true},"name":"Ada"}');\nconsole.log(Object.hasOwn(input, '__proto__'));\nconst safe = Object.create(null);\nfor (const key of ['name']) {\n  if (Object.hasOwn(input, key)) safe[key] = input[key];\n}\nconsole.log(safe.name, safe.admin);\n// An explicit allowlist and domain validation are separate requirements.`,
    pitfalls: [
      "Evaluating a string that should have been parsed as data.",
      "Calling a realm or worker a complete security boundary without a threat model.",
      "Assuming a null-prototype object validates all untrusted data.",
    ],
    practice:
      "Threat-model a user-controlled configuration editor. List code-construction sinks, key/path interpretation, parsing limits, external capabilities, and denial-of-service behavior. Test each boundary independently.",
    challenge: {
      prompt: "Does JSON.parse itself turn a __proto__ field into a new prototype?",
      solution: `const value = JSON.parse('{"__proto__":{"x":1}}');\nconsole.log(Object.hasOwn(value, '__proto__')); // true\nconsole.log(value.x); // undefined`,
      explanation:
        "Parsing creates data properties. The danger can appear later when unsafe assignment or recursive merge logic interprets the key through a different protocol.",
    },
    quiz: {
      question: "Does type-asserting parsed input as a trusted type validate it at runtime?",
      choices: ["No", "Yes", "Only in strict TypeScript"],
      answer: 0,
      explanation:
        "Static assertions are erased. The runtime boundary still needs validation and authority checks.",
    },
    sources: [
      {
        title: "OWASP · Prototype pollution prevention",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html",
      },
      {
        title: "MDN · eval",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
      },
    ],
  }),
  js({
    slug: "modules-tooling-and-compatibility",
    title: "Runtime targets, ESM/CJS & package contracts",
    level: "Deep dive",
    execution: "reference",
    description:
      "Separate parsing, syntax transforms, built-in APIs, conditional exports, package identity, and deployment support.",
    prerequisites: ["module-linking-and-cycles", "language-and-hosts"],
    mental:
      "A successful build proves something about the configured toolchain, not universal runtime compatibility. A package graph is resolved under host and bundler rules; syntax support and runtime APIs are separate dependencies.",
    steps: [
      {
        title: "Separate four compatibility layers",
        body: "A parser must accept the syntax; a transform may lower it; required built-ins must exist or be supplied; host APIs must be available in the execution environment. Transpiling optional chaining does not add a DOM, and type declarations for a new method do not install that method at runtime.",
      },
      {
        title: "Understand the package boundary",
        body: "Node package type, file extensions, exports, imports, and conditions influence resolution and loading. CommonJS caches exports through a different model from ESM live bindings. Interoperability rules and require-of-ESM capabilities are version-sensitive, particularly around asynchronous module graphs. Test the supported Node line rather than copying one historical slogan.",
      },
      {
        title: "Avoid accidental duplicated identity",
        body: "Different import paths or condition branches can load logically equivalent packages as separate instances. Stores, class identity, symbols, and singleton assumptions can then diverge. A dual-format package needs a deliberate shared-state and compatibility design, not simply two builds with the same name.",
      },
      {
        title: "Verify the artifact consumers use",
        body: "Tree shaking relies on module structure and side-effect information; it is not proof of secrecy or universal deletion of unused code. Publish correct export surfaces, test packed package artifacts against the supported module/host matrix, and ensure sourcemaps and debug assets follow the intended exposure policy.",
      },
    ],
    code: `// package.json — illustration, not a complete package\n{\n  "type": "module",\n  "exports": {\n    ".": {\n      "import": "./dist/index.js",\n      "require": "./dist/index.cjs"\n    }\n  }\n}\n// Test both branches for identity and behavioral compatibility.`,
    language: "json",
    pitfalls: [
      "Assuming transpilation provides missing APIs.",
      "Testing source imports while consumers load a different packed export.",
      "A dual-format package accidentally creating two independent singleton stores.",
    ],
    practice:
      "Pack a small library and test its real artifact from ESM, CommonJS, and a browser bundler. Record supported versions, export paths, state identity, side effects, and required built-ins.",
    challenge: {
      prompt: "Does TypeScript accepting a new Array method prove the target browser has it?",
      solution:
        "No. Check runtime compatibility and the selected polyfill policy. Type declarations describe the API contract assumed by the checker; they do not install an implementation.",
      explanation:
        "Static type availability, parser support, transformed syntax, runtime built-ins, and host capabilities are separate layers.",
    },
    quiz: {
      question: "What should a package integration test consume?",
      choices: [
        "The artifact and export conditions real consumers receive",
        "Only an internal source file",
        "Only the declaration file",
      ],
      answer: 0,
      explanation:
        "Testing a convenient source path can miss packaging, resolution, condition, and identity failures.",
    },
    sources: [
      { title: "Node.js · Packages", url: "https://nodejs.org/api/packages.html" },
      { title: "Node.js · ECMAScript modules", url: "https://nodejs.org/api/esm.html" },
    ],
  }),
  js({
    slug: "math-and-randomness",
    title: "Math, rounding & secure randomness",
    level: "Advanced",
    description:
      "Distinguish numerical policy, pseudorandom simulation, secure entropy, and unbiased bounded selection.",
    prerequisites: ["numbers-and-bigint"],
    mental:
      "Randomness and rounding are domain decisions. Math.random can support ordinary simulation, while security tokens require an appropriate cryptographic generator. A secure source still needs correct encoding, bounds, collision handling, and protocol design.",
    steps: [
      {
        title: "State rounding direction and scale",
        body: "floor moves toward negative infinity, ceil toward positive infinity, and trunc toward zero. Math.round has its own tie and signed-zero behavior; it is not every business rounding mode. Scaling a decimal Number can introduce representation error before rounding even happens. Specify the domain's ties, scale, sign, and range policy.",
      },
      {
        title: "Use the right entropy source",
        body: "Math.random is not a cryptographic security primitive. Browser crypto.getRandomValues supplies cryptographically suitable random values under its API constraints; Node provides its crypto APIs. Session tokens and password-reset tokens require adequate entropy plus secure storage, lifecycle, and comparison behavior. A random-looking string is not proof of unpredictability.",
      },
      {
        title: "Avoid biased bounded selection",
        body: "Reducing a finite uniform integer space modulo a bound produces bias unless the range divides evenly. Rejection sampling can discard the incomplete range before applying the remainder. Use established crypto APIs for security-sensitive bounded choices rather than inventing a new generator or protocol.",
      },
      {
        title: "Separate identity and probability assumptions",
        body: "Random identifiers have collision probabilities, not absolute uniqueness. Enforce uniqueness where correctness depends on it and handle retries deliberately. A reproducible seeded PRNG can help simulation and testing; do not substitute that determinism for security entropy. Statistical tests do not prove an entropy source is cryptographically secure.",
      },
    ],
    code: `console.log(Math.floor(-1.2), Math.trunc(-1.2));\nconsole.log(Object.is(Math.round(-0.1), -0));\nconst bytes = new Uint8Array(8);\ncrypto.getRandomValues(bytes);\nconsole.log('random byte count:', bytes.length);\n// Demonstration only: token entropy, encoding, storage and lifetime need a protocol.`,
    pitfalls: [
      "Using Math.random for a password-reset token.",
      "Calling modulo reduction uniformly random for every bound.",
      "Using Math.round as a universal financial rounding policy.",
    ],
    practice:
      "Write a bounded integer sampler with an explicit uniform input range and rejection rule. Verify its boundary cases and separately document why statistical distribution tests do not establish cryptographic security.",
    challenge: {
      prompt: "Why is a uniform byte modulo 10 biased?",
      solution:
        "There are 256 possible byte values. Residues 0–5 occur 26 times each, while 6–9 occur 25 times. Reject byte values 250–255, then reduce the remaining uniform range modulo 10.",
      explanation:
        "The accepted range contains exactly 25 complete groups of ten, so each outcome has equal representation under the uniform-source assumption.",
    },
    quiz: {
      question: "Which source is appropriate for browser security entropy?",
      choices: [
        "crypto.getRandomValues under a sound protocol",
        "Math.random",
        "The current timestamp",
      ],
      answer: 0,
      explanation:
        "The cryptographic API is designed for security-grade random values; token design still needs adequate entropy and lifecycle controls.",
    },
    sources: [
      {
        title: "MDN · Math",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math",
      },
      {
        title: "MDN · Crypto.getRandomValues",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues",
      },
    ],
  }),
  js({
    slug: "functional-design-in-javascript",
    title: "Pure functions, composition & algebraic assumptions",
    level: "Advanced",
    description:
      "Use functional techniques where they clarify data flow, without hiding effects or invalid mathematical assumptions.",
    prerequisites: ["array-transformations", "scope-and-closures", "numbers-and-bigint"],
    mental:
      "A pure calculation depends on explicit inputs and produces a result without observable side effects. This makes reuse, testing, retries, and caching easier to reason about, but purity and useful algebraic laws must be established rather than inferred from arrow syntax.",
    steps: [
      {
        title: "Make effect boundaries explicit",
        body: "Date.now, random values, mutable globals, network calls, and in-place mutations can make a function impure even if it returns a new object. Pass required context as data and keep I/O at a deliberate boundary. A functional core can return decisions that an imperative shell executes and records.",
      },
      {
        title: "Compose around meaningful contracts",
        body: "Higher-order functions accept or return functions; partial application fixes selected arguments; currying changes a multi-argument shape into nested calls. These tools help when variation is real, but deeply nested generic combinators can hide domain meaning. Preserve errors, receiver requirements, and async completion when wrapping functions.",
      },
      {
        title: "Check the laws your algorithm needs",
        body: "Parallel reduction, memoization, replay, and retries rely on assumptions such as associativity, determinism, and absence of hidden effects. Floating-point addition is not exactly associative. A reducer mutating an external object or invoking a remote service cannot safely be reordered just because the code uses reduce.",
      },
      {
        title: "Balance allocation and maintainability",
        body: "Immutable transformations can allocate intermediate arrays and retain large closures. A clear local loop can preserve purity if its mutation is confined to unobservable local state and its output does not expose aliases. Measure hot pipelines rather than enforcing a blanket no-loop or no-mutation aesthetic.",
      },
    ],
    code: `const calculate = (items, taxRate) => {\n  const subtotal = items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);\n  return { subtotal, taxRate };\n};\nconst applyRate = rate => amount => amount * rate;\nconsole.log(calculate([{ priceMinor: 100, quantity: 2 }], 0.1));\nconsole.log(applyRate(2)(7));\nconsole.log((1e16 + -1e16) + 1, 1e16 + (-1e16 + 1));`,
    pitfalls: [
      "Calling an arrow pure while it reads mutable external state.",
      "Parallelizing a reduction whose operation is not safely associative.",
      "Hiding remote side effects inside reusable map/reduce callbacks.",
    ],
    practice:
      "Extract a pure pricing decision from a request handler. Supply time and policy versions explicitly, then test repeat execution, input aliasing, and the numerical assumptions needed for aggregation.",
    challenge: {
      prompt: "Can a locally mutating function still be pure to its callers?",
      solution: `function squares(values) {\n  const output = [];\n  for (const value of values) output.push(value * value);\n  return output;\n}\nconst input = [2, 3];\nconsole.log(squares(input), input); // [4, 9], [2, 3]`,
      explanation:
        "The output array is newly owned local state during calculation. If the function depends only on its inputs and does not mutate caller-visible state, local mutation need not violate observable purity.",
    },
    quiz: {
      question: "Does reduce imply a calculation is pure or reorderable?",
      choices: ["No", "Yes", "Only with an arrow callback"],
      answer: 0,
      explanation:
        "Those properties depend on the operation and its effects, not the traversal method's name.",
    },
    sources: [
      {
        title: "MDN · Functions",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
      },
      {
        title: "MDN · Array.reduce",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce",
      },
    ],
  }),
  js({
    slug: "async-iteration-and-cancellation",
    title: "Async iterables, generators & cancellation ownership",
    level: "Deep dive",
    prerequisites: ["iterators-and-generators", "async-await", "streams-and-backpressure"],
    description:
      "Connect incremental consumption to cleanup, producer pressure, and cancellation instead of only awaiting a loop.",
    mental:
      "Async iteration requests eventual iteration results one step at a time. It provides a consumption protocol; it does not automatically cancel external work, bound every producer queue, or define how abandoned resources are reclaimed.",
    steps: [
      {
        title: "Follow the async iterator result",
        body: "An async iterable exposes Symbol.asyncIterator, and next produces an eventual result with value and done. for-await-of can also adapt a synchronous iterable. Async generators combine suspension with promised iteration outcomes. A generator's creation does not execute its whole body or start every future I/O operation.",
      },
      {
        title: "Handle early termination and failures",
        body: "Breaking from async iteration invokes the supported closing protocol and awaits its result. Generator finally blocks can release owned resources. Adapting a synchronous generator that yields rejecting promises has subtle cleanup behavior, so do not assume every adapter path handles every ownership pattern identically; test your actual producer and consumer.",
      },
      {
        title: "Propagate cancellation to the work",
        body: "Closing an iterator must connect to the transport or subscription if those operations need stopping. Pass AbortSignal through the producer and handle abandoned pending reads. A request already committed at a remote service cannot be undone simply by ending local iteration. Cancellation and compensation belong to different contracts.",
      },
      {
        title: "Choose sequential collection deliberately",
        body: "Array.fromAsync can collect supported asynchronous inputs and await mapping under its sequential contract where available. Promise.all over already-started operations expresses another scheduling choice. Pulling one value at a time does not bound a producer that buffers independently, so inspect queue ownership and high-water behavior too.",
      },
    ],
    code: `async function* values() {\n  try {\n    yield await Promise.resolve(1);\n    yield await Promise.resolve(2);\n  } finally { console.log('producer closed'); }\n}\nfor await (const value of values()) {\n  console.log('received:', value);\n  break;\n}`,
    pitfalls: [
      "Assuming closing a consumer automatically stops unrelated external I/O.",
      "Equating an async iterable with bounded buffering.",
      "Replacing a dependency-aware sequential flow with unbounded Promise.all.",
    ],
    practice:
      "Build a paginated async producer with an abort signal. Break after one item, reject a read, and cancel during a pending request. Prove which resources are owned and released on each path.",
    challenge: {
      prompt: "How does current async-from-sync adaptation close a rejected yielded value?",
      solution: `function* source() {\n  try { yield Promise.reject(new Error('failed value')); }\n  finally { console.log('producer closed'); }\n}\nconst iterator = source();\ntry {\n  for await (const value of iterator) console.log(value);\n} catch (error) { console.log(error.message); }\nconsole.log('consumer settled');\nconsole.log('closed state:', iterator.next().done);`,
      explanation:
        "The current async-from-sync next continuation closes the not-done synchronous iterator when its wrapped value rejects, then propagates the rejection. Here finally logs before the consumer catches the failure, and the iterator is complete afterward. Older engines differed at this boundary; this example tests the modern closing contract rather than asserting that every iterator failure has the same cleanup path.",
    },
    quiz: {
      question: "Does async iteration by itself cancel every external operation?",
      choices: ["No; cancellation needs an ownership protocol", "Yes", "Only if it is slow"],
      answer: 0,
      explanation:
        "The producer must connect iterator closure or abort signals to its owned external work.",
    },
    sources: [
      {
        title: "MDN · for await...of",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of",
      },
      {
        title: "MDN · Array.fromAsync",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync",
      },
    ],
  }),
  js({
    slug: "dom-events-and-propagation",
    title: "DOM events, delegation & shadow boundaries",
    level: "Advanced",
    execution: "browser",
    description:
      "Trace capture, target, bubbling, defaults, listener lifetime, and composed event paths.",
    prerequisites: ["functions-and-parameters", "reentrancy-and-observers"],
    mental:
      "DOM dispatch follows a host-defined event path with phase and boundary rules. A listener's target, currentTarget, phase, default action, and composed path answer different questions. Dispatch can be synchronous even when the user interaction that caused it originated as a later host task.",
    steps: [
      {
        title: "Distinguish target and listener position",
        body: "target identifies the relevant retargeted origin of the event; currentTarget is the node whose listener is currently executing. Capture, target, and bubbling phases have different rules, and not every event bubbles. Delegation uses a stable ancestor listener but must validate that the matched element belongs to the intended owned subtree.",
      },
      {
        title: "Separate propagation and default behavior",
        body: "stopPropagation changes propagation; stopImmediatePropagation additionally affects later listeners on the current target. preventDefault requests cancellation of a cancelable default action and is restricted in passive listeners. None is a universal replacement for the others. Synthetic dispatch does not become a trusted physical user interaction merely because it has the same event type.",
      },
      {
        title: "Handle shadow and document boundaries",
        body: "Shadow DOM can retarget an event and restrict which path is exposed. composed and bubbles control different aspects of dispatch, and composedPath is not always the naive parentNode chain. Browser-native and React event systems also have distinct ownership and delegation layers, especially around portals.",
      },
      {
        title: "Own the listener lifetime",
        body: "Use a stable listener identity and matching relevant options for removal, or an AbortSignal when supported. once changes repeated delivery behavior, not every cleanup obligation. Event callbacks can reenter synchronously during dispatch, while exceptions and promise rejections require the appropriate host/error owner rather than a distant registration-time try/catch.",
      },
    ],
    code: `// Browser DOM example: run in a page, not the worker playground.\nconst parent = document.createElement('div');\nconst child = document.createElement('button');\nparent.append(child);\nconst owner = new AbortController();\nparent.addEventListener('click', () => console.log('capture'), { capture: true, signal: owner.signal });\nparent.addEventListener('click', () => console.log('bubble'), { signal: owner.signal });\nchild.addEventListener('click', () => console.log('target'), { signal: owner.signal });\nchild.dispatchEvent(new MouseEvent('click', { bubbles: true }));\nowner.abort();`,
    pitfalls: [
      "Using stopPropagation when the goal is to cancel a default action.",
      "Assuming target is always the node holding the listener.",
      "Delegation that accepts a matching node outside the owned subtree.",
    ],
    practice:
      "Build a delegated action list, then add nested buttons and a shadow root. Trace target/currentTarget/path/phase, verify cleanup, and test cancelable versus passive default prevention.",
    challenge: {
      prompt: "Does preventDefault stop ancestor listeners?",
      solution:
        "No. It addresses a cancelable default action. Propagation controls are separate, and a passive listener cannot use preventDefault to cancel the default action.",
      explanation:
        "Default behavior and event-path traversal are independent dimensions of the dispatch contract.",
    },
    quiz: {
      question: "Which property names the node whose listener is running?",
      choices: ["currentTarget", "target in every case", "relatedTarget in every case"],
      answer: 0,
      explanation:
        "currentTarget identifies the listener's current dispatch position; target can identify another or retargeted node.",
    },
    sources: [
      {
        title: "MDN · Introduction to events",
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events",
      },
      { title: "WHATWG · DOM events", url: "https://dom.spec.whatwg.org/#events" },
    ],
  }),
  js({
    slug: "binary-protocols-and-encoding",
    title: "Binary protocols, framing & ownership",
    level: "Deep dive",
    description:
      "Parse bytes with explicit lengths, byte order, text decoding, aliasing, transfer, and bounds.",
    prerequisites: ["binary-memory", "strings-and-unicode", "numbers-and-bigint"],
    mental:
      "A byte buffer has no inherent record structure. A binary protocol defines framing, field sizes, endianness, limits, and encoding; views interpret storage while transfer and aliasing define who can still use it.",
    steps: [
      {
        title: "Validate before reading",
        body: "Read a fixed header only when enough bytes are available, validate declared lengths against a bound, and handle incomplete messages spanning transport chunks. DataView supports explicit byte order and byte offsets. A transport chunk is not necessarily one application record, and a plausible declared size should not trigger an unbounded allocation.",
      },
      {
        title: "Choose signedness and integer width",
        body: "Uint8Array, signed integer views, floating-point views, and BigInt views interpret bytes differently. A Number bitwise expression uses 32-bit conversion and can corrupt a wider protocol value. Select operations that match the wire width and signedness, and preserve exact large integers before converting to application types.",
      },
      {
        title: "Separate text decoding from framing",
        body: "UTF-8 characters can span byte chunks. A streaming TextDecoder retains partial encoding state while the framing layer identifies record boundaries. Validate or define behavior for malformed encodings. A byte count, string code-unit length, and user-visible grapheme count are separate limits.",
      },
      {
        title: "Audit ownership and capabilities",
        body: "subarray aliases an existing typed-array buffer, while slice copies elements. Transfer can detach the sender; shared memory requires synchronization. Some environments also support resizable or transferable buffer APIs and additional numeric views. Feature-test newer APIs and specify whether a caller may retain, mutate, resize, or transfer the supplied storage.",
      },
    ],
    code: `const buffer = new ArrayBuffer(8);\nconst view = new DataView(buffer);\nview.setUint32(0, 4, false); // explicit big endian\nnew Uint8Array(buffer, 4).set([65, 66, 67, 68]);\nconst length = view.getUint32(0, false);\nif (length > buffer.byteLength - 4) throw new Error('invalid frame');\nconst payload = new Uint8Array(buffer, 4, length);\nconsole.log(new TextDecoder().decode(payload));\nconsole.log([...payload]);`,
    pitfalls: [
      "Assuming network chunks align with protocol records.",
      "Allocating from an unbounded declared length.",
      "Using 32-bit bitwise shortcuts for 64-bit identifiers.",
    ],
    practice:
      "Write an incremental length-prefixed decoder. Test a split header, split UTF-8 character, multiple frames in one chunk, oversized length, early end, and a caller mutating aliased storage.",
    challenge: {
      prompt: "Do these two views own independent bytes?",
      solution: `const bytes = new Uint8Array([1, 2, 3]);\nconst alias = bytes.subarray(0, 2);\nconst copy = bytes.slice(0, 2);\nalias[0] = 9;\nconsole.log(bytes[0], copy[0]); // 9 1`,
      explanation:
        "subarray aliases the original storage; slice copies the selected elements. View identity alone does not imply byte ownership.",
    },
    quiz: {
      question: "What must be checked before allocating a declared frame length?",
      choices: [
        "Available bytes and a deliberate size limit",
        "Only that it is a number",
        "Only the network chunk's name",
      ],
      answer: 0,
      explanation:
        "Parsing needs both framing completeness and a resource bound; an attacker-controlled length is not trustworthy allocation authority.",
    },
    sources: [
      {
        title: "MDN · Typed arrays",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays",
      },
      {
        title: "MDN · TextDecoder",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder",
      },
    ],
  }),
];
