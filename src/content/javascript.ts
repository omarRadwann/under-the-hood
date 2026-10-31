import { lesson } from "./helpers";

export const javascript = [
  lesson("javascript", {
    slug: "javascript-engine",
    title: "Inside the JavaScript engine",
    description: "Follow source code through parsing, bytecode, optimization, and deoptimization.",
    lab: "engine",
    level: "Deep dive",
    mental:
      "An engine is a translator with a feedback loop. It starts executing quickly, watches what actually happens, and invests in faster machine code for hot paths. ECMAScript specifies behavior; a particular engine chooses how to implement it.",
    steps: [
      {
        title: "Parse and establish meaning",
        body: "The parser checks grammar and builds an internal representation of the program. Scope analysis determines where identifiers resolve. Engines may parse lazily, so imagining one complete upfront AST is a useful model, not a universal implementation guarantee.",
      },
      {
        title: "Execute and collect feedback",
        body: "V8 uses an interpreter and multiple compilation tiers. Runtime feedback records information such as argument types and object shapes. Other engines use different pipelines. A function becoming hot is a heuristic, not a fixed number specified by JavaScript.",
      },
      {
        title: "Optimize, then recover when assumptions fail",
        body: "Optimized machine code specializes on observed behavior. An unexpected type or shape can invalidate an assumption and trigger deoptimization. This preserves correctness. Profile representative workloads before reshaping your code around engine folklore.",
      },
    ],
    code: `function add(a: number | string, b: number) {\n  return typeof a === 'number' ? a + b : a + b;\n}\n\nfor (let i = 0; i < 10_000; i++) add(i, 1);\nadd('total: ', 1); // different runtime behavior\n// The engine must preserve both outcomes.`,
    pitfalls: [
      "Treating V8's pipeline as an ECMAScript requirement.",
      "Assuming a microbenchmark predicts application performance.",
      "Equating every polymorphic call with a significant performance problem.",
    ],
    practice:
      "Profile a real hot function with browser Performance tools. Separate time in JavaScript from layout, network waiting, and garbage collection before proposing an optimization.",
    quiz: {
      question: "What must remain true after an engine deoptimizes code?",
      choices: [
        "The function throws",
        "Observable language behavior is preserved",
        "The entire application restarts",
      ],
      answer: 1,
      explanation:
        "Optimization is an implementation choice. Falling back to a less specialized execution tier must still produce the behavior defined by the language.",
    },
    sources: [
      { title: "V8 · Sparkplug and execution tiers", url: "https://v8.dev/blog/sparkplug" },
      { title: "ECMAScript specification", url: "https://tc39.es/ecma262/" },
    ],
  }),
  lesson("javascript", {
    slug: "execution-context",
    title: "Execution contexts & the call stack",
    description:
      "Understand what a function call creates, what the stack holds, and why recursion overflows.",
    level: "Foundations",
    mental:
      "Every function call needs a place to keep its current work: arguments, local bindings, and where execution should resume. Stack frames are the engine's implementation of that bookkeeping; specification execution contexts are an abstract model.",
    steps: [
      {
        title: "Enter a context",
        body: "Executing a script, module, or function establishes an execution context. The currently executing context is on top of the context stack. Lexical and variable environments determine identifier resolution; they are not simply a bag of copied values.",
      },
      {
        title: "Suspend the caller",
        body: "Calling another function suspends the current evaluation while the callee runs. Returning or throwing unwinds contexts. An Error stack trace is a debugging representation and may include reconstructed asynchronous ancestry rather than a literal current stack.",
      },
      {
        title: "Know the resource limit",
        body: "Unbounded synchronous recursion eventually exhausts the implementation's stack. JavaScript specifies proper tail calls in limited circumstances, but support is not portable. Use iteration or an explicit work queue when stack depth can grow with untrusted input.",
      },
    ],
    code: `function sum(n: number): number {\n  if (n === 0) return 0;\n  return n + sum(n - 1);\n}\nconsole.log(sum(3)); // 6\n// Frames descend: sum(3) → sum(2) → sum(1) → sum(0)\n// Returns unwind: 0 → 1 → 3 → 6`,
    output: "6",
    pitfalls: [
      "Confusing the call stack with the lexical scope chain.",
      "Assuming async recursion has identical stack behavior to synchronous recursion.",
    ],
    practice:
      "Add a breakpoint inside sum and inspect the call stack. Replace recursion with a loop and compare memory use for a large input.",
    quiz: {
      question: "Which relationship determines where an identifier is looked up?",
      choices: [
        "The function's caller",
        "Lexical environment relationships",
        "The most recent console log",
      ],
      answer: 1,
      explanation:
        "JavaScript has lexical scope. Where a function was defined determines its outer environment, independently of which function calls it.",
    },
  }),
  lesson("javascript", {
    slug: "scope-and-closures",
    title: "Scope, closures & retained state",
    description: "See how a function keeps access to an environment after its outer call returns.",
    lab: "memory",
    mental:
      "A closure is a function together with access to its surrounding lexical environment. It captures access to bindings, not a frozen snapshot of every value. A binding can keep an object reachable long after the outer function has returned.",
    steps: [
      {
        title: "Create the lexical environment",
        body: "A call to the factory creates fresh local bindings. Each factory invocation has its own environment. Functions created during that invocation can share the same binding, so changing it in one closure is visible to the others.",
      },
      {
        title: "Retain access, not a stack frame forever",
        body: "After return, the active execution context leaves the stack. Any environment data still needed by reachable closures remains logically accessible. An engine may optimize the physical representation; a closure does not require keeping the entire stack frame.",
      },
      {
        title: "Recognize retention in applications",
        body: "Listeners, timers, caches, and subscriptions can retain closures, which in turn retain large object graphs. Garbage collection cannot reclaim reachable data just because you no longer intend to use it. Cleanup must break the unwanted reference path.",
      },
    ],
    code: `function createCounter() {\n  let value = 0;\n  return {\n    increment: () => ++value,\n    read: () => value,\n  };\n}\nconst a = createCounter();\nconst b = createCounter();\na.increment();\nconsole.log(a.read(), b.read()); // 1 0`,
    output: "1 0",
    pitfalls: [
      "Assuming closures snapshot mutable bindings.",
      "Leaving an event listener attached after its owner is gone.",
      "Using var in a loop when each callback needs a distinct iteration binding.",
    ],
    practice:
      "Return a decrement closure from the same factory. Explain why it shares state with increment but not with a second factory invocation.",
    quiz: {
      question:
        "Two functions created in one factory invocation both close over let count. What do they share?",
      choices: [
        "Independent copied values",
        "Access to the same count binding",
        "The factory's active call stack",
      ],
      answer: 1,
      explanation:
        "They share the lexical binding from that invocation. A separate factory call creates a distinct environment.",
    },
  }),
  lesson("javascript", {
    slug: "hoisting-and-tdz",
    title: "Hoisting & the temporal dead zone",
    description: "Separate binding creation from initialization instead of imagining code moving.",
    level: "Foundations",
    mental:
      "Declarations do not physically move. Before statements execute, the runtime establishes bindings according to declaration and scope rules. Whether that binding can be read depends on its initialization state.",
    steps: [
      {
        title: "var starts as undefined",
        body: "A var binding is function-scoped or global-script scoped and is initialized to undefined before its declaration statement runs. Its assignment still happens at the original execution point. Repeated declarations do not create a fresh block binding.",
      },
      {
        title: "let and const start uninitialized",
        body: "Lexical bindings exist from the start of their scope but cannot be accessed before initialization. That interval is the temporal dead zone. Even typeof throws for a binding in its TDZ, unlike an entirely undeclared identifier.",
      },
      {
        title: "Declarations differ from expressions",
        body: "A function declaration is generally initialized with its function during scope setup. A function expression assigned to const follows that const's initialization timing. Avoid block-function edge cases in sloppy scripts; modules have strict semantics.",
      },
    ],
    code: `console.log(legacy); // undefined\nvar legacy = 1;\n\n// console.log(modern); // ReferenceError: TDZ\nlet modern = 2;\n\ngreet(); // works\nfunction greet() { return 'hello'; }`,
    output: "undefined",
    pitfalls: [
      "Describing let as simply 'not hoisted'.",
      "Assuming typeof is always safe before a declaration.",
      "Confusing a const binding with an immutable object.",
    ],
    practice:
      "Place a let declaration in an inner block with the same name as an outer variable. Predict whether a read before the inner declaration resolves to the outer value.",
    quiz: {
      question: "Reading a let binding inside its TDZ produces…",
      choices: ["undefined", "ReferenceError", "null"],
      answer: 1,
      explanation:
        "The inner binding already shadows outer bindings, but it is still uninitialized. Reading it throws.",
    },
  }),
  lesson("javascript", {
    slug: "objects-and-prototypes",
    title: "Objects, prototypes & this",
    description: "Trace property lookup and understand why the receiver controls this.",
    mental:
      "An object is a set of own properties plus a link to another object or null. A method is usually just a function stored in a property. For ordinary calls, this comes from how the function is invoked, not where it was defined.",
    steps: [
      {
        title: "Walk the prototype chain",
        body: "A property read first checks the object and then its prototype chain until a match or null. An own property can shadow an inherited property. Getters and proxies can add behavior, so a read is not necessarily a passive memory lookup.",
      },
      {
        title: "Resolve the receiver",
        body: "obj.method() passes obj as the receiver for an ordinary function. Extracting the method and calling it loses that receiver. bind creates a bound function; call and apply supply an explicit this. Arrow functions instead use lexical this.",
      },
      {
        title: "Understand classes as a language abstraction",
        body: "Class instance methods live on the prototype; public instance fields live on instances. Classes add semantics including private fields and strict-mode bodies. Describing classes as only syntax sugar misses meaningful language rules.",
      },
      {
        title: "Keep dictionary keys from becoming prototype behavior",
        body: "Untrusted recursive merges and special keys can create prototype-pollution paths. Validate input shapes and allowed keys rather than merging arbitrary configuration. Use Map or an appropriate null-prototype dictionary for untrusted key spaces, and Object.hasOwn for own-property tests. These choices still need a deliberate serialization and validation contract.",
      },
    ],
    code: `const base = { label: 'inherited' };\nconst item = Object.create(base);\nitem.name = 'Ada';\nitem.greet = function () { return this.name; };\nconsole.log(item.label, item.greet());\nconst greet = item.greet.bind(item);\nconsole.log(greet()); // Ada`,
    output: "inherited Ada\nAda",
    pitfalls: [
      "Using an arrow method when you need a dynamic receiver.",
      "Confusing Object.getPrototypeOf with a constructor's prototype property.",
      "Mutating built-in prototypes in application code.",
    ],
    practice:
      "Inspect own keys and prototype keys separately. Extract a method before and after bind and explain the different receiver behavior.",
    quiz: {
      question: "For an ordinary function called as object.method(), what supplies this?",
      choices: ["The receiver object", "The file name", "The function's lexical parent"],
      answer: 0,
      explanation:
        "The member-call syntax supplies the receiver. Arrow functions are an exception because their this is lexical.",
    },
  }),
  lesson("javascript", {
    slug: "values-and-equality",
    title: "Values, references & equality",
    description: "Reason about identity, copying, coercion, and the boundaries of immutability.",
    mental:
      "JavaScript passes values. When that value identifies an object, copying it gives another reference to the same object. Mutating the object is visible through both references; reassigning one local parameter is not.",
    steps: [
      {
        title: "Identity differs from content",
        body: "Two separately created objects are unequal with === even if their properties match. Primitive values compare by their value rules. Object.is differs from === for NaN and signed zero, and React uses Object.is for several change comparisons.",
      },
      {
        title: "Copy the required depth",
        body: "Object and array spread copy one level. Nested references remain shared. structuredClone handles many built-in types and cycles but cannot clone functions and does not preserve every custom prototype behavior. Serialization is a different contract.",
      },
      {
        title: "Make coercion explicit at boundaries",
        body: "The + operator may add numbers or concatenate strings after primitive conversion. Loose equality has conversion rules that are easy to misread. Validate external data and convert intentionally instead of relying on clever implicit coercions.",
      },
      {
        title: "Choose the numeric domain",
        body: "Number uses binary floating-point, so decimal fractions and integers beyond the safe range need deliberate handling. BigInt supports arbitrary-size integers but cannot mix directly with Number arithmetic and needs an explicit JSON representation. Money often needs integer minor units with range checks or a decimal library plus a rounding policy. Bitwise Number operators coerce to 32-bit integers; they are not a safe general rounding shortcut.",
      },
    ],
    code: `const original = { profile: { score: 1 } };\nconst shallow = { ...original };\nshallow.profile.score = 2;\nconsole.log(original.profile.score); // 2\nconsole.log({} === {}); // false\nconsole.log(Object.is(NaN, NaN)); // true`,
    output: "2\nfalse\ntrue",
    pitfalls: [
      "Calling spread a deep clone.",
      "Using JSON round-tripping as a universal clone.",
      "Mutating nested React state while replacing only the outer object.",
    ],
    practice:
      "Update a nested profile immutably. Demonstrate that the changed branch has a new identity while an untouched sibling keeps its previous identity.",
    quiz: {
      question: "After const b = { ...a }, nested object properties are…",
      choices: [
        "Always recursively cloned",
        "Shared references unless separately copied",
        "Converted into JSON",
      ],
      answer: 1,
      explanation:
        "Spread is shallow. Only the outer object's properties are copied, including the values that reference nested objects.",
    },
  }),
  lesson("javascript", {
    slug: "memory-and-garbage-collection",
    title: "Memory & garbage collection",
    description:
      "Explore reachability, retention paths, generational collection, and memory leaks.",
    lab: "memory",
    level: "Deep dive",
    mental:
      "Garbage collection asks whether an object can still be reached, not whether your application still needs it. A memory leak in a garbage-collected program is commonly a live reference to data whose useful lifetime has ended.",
    steps: [
      {
        title: "Start from roots",
        body: "The collector traces reachable objects from roots such as active execution data and runtime-owned references. Objects reachable through another reachable object also remain live. Cycles are collectable when the entire cycle becomes unreachable.",
      },
      {
        title: "Reclaim with implementation-specific strategies",
        body: "Modern engines combine generational, incremental, and concurrent techniques to reduce cost. Young objects often die quickly, but exact generations and algorithms are engine details. Collection timing is nondeterministic and should never control application correctness.",
      },
      {
        title: "Find the retaining path",
        body: "Compare heap snapshots after repeating an interaction and letting the app settle. Inspect detached DOM nodes and their retainers. Bound caches and remove listeners, abort pending work, and close subscriptions when ownership ends. WeakMap is useful for metadata, not a universal leak repair.",
      },
    ],
    code: `function observe(element: HTMLElement) {\n  const largeData = new Array(100_000).fill('data');\n  const onClick = () => console.log(largeData.length);\n  element.addEventListener('click', onClick);\n  return () => element.removeEventListener('click', onClick);\n}\n// The owner must invoke the returned cleanup.`,
    pitfalls: [
      "Assuming reference cycles always leak.",
      "Depending on FinalizationRegistry to release critical resources.",
      "Growing a process-wide Map without an eviction policy.",
    ],
    practice:
      "Create and remove a component repeatedly while recording heap snapshots. Find one object retained by a listener and fix the lifecycle that owns it.",
    quiz: {
      question: "An unreachable cycle of objects is…",
      choices: [
        "Necessarily a leak",
        "Eligible for garbage collection",
        "Stored permanently on the stack",
      ],
      answer: 1,
      explanation:
        "Tracing collectors reason from roots. References inside an unreachable group do not by themselves keep that group alive.",
    },
    sources: [
      {
        title: "MDN · Memory management",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management",
      },
    ],
  }),
  lesson("javascript", {
    slug: "modules-and-bundlers",
    title: "Modules, bundlers & tree shaking",
    description: "Follow the import graph from live bindings to production chunks.",
    mental:
      "An ES module is a node in a statically analyzable dependency graph. Imports refer to live exported bindings. A bundler transforms that graph into deployment artifacts; a module boundary and a network chunk boundary are different things.",
    steps: [
      {
        title: "Link before evaluating",
        body: "The loader resolves dependencies and connects imports to exports. Evaluation then executes module bodies. Cycles can expose uninitialized bindings if modules read each other's lexical exports too early. Module code is strict and evaluated once per module instance.",
      },
      {
        title: "Remove only provably unused work",
        body: "Tree shaking relies on static imports and side-effect analysis. Top-level side effects can require keeping a module even when an export is unused. Incorrect sideEffects metadata can delete required behavior, such as a CSS import or registration step.",
      },
      {
        title: "Split along meaningful loading boundaries",
        body: "Dynamic import returns a promise and often creates an asynchronous chunk boundary. It does not guarantee a specific chunk layout. Measure transfer size, parse time, and loading waterfalls; splitting every tiny module can increase request overhead.",
      },
    ],
    code: `// counter.ts\nexport let count = 0;\nexport function increment() { count++; }\n\n// consumer.ts\nimport { count, increment } from './counter';\nincrement();\nconsole.log(count); // 1: live binding\nconst editor = await import('./editor');`,
    pitfalls: [
      "Treating named imports as frozen copied values.",
      "Shipping a large dependency through a tiny shared client component.",
      "Marking side-effectful packages as sideEffects: false.",
    ],
    practice:
      "Inspect a production bundle. Move an infrequently used editor behind a dynamic import and compare initial transfer size and the interaction waterfall.",
    quiz: {
      question: "What does tree shaking primarily need?",
      choices: [
        "A statically analyzable graph and side-effect information",
        "Every file to be a separate chunk",
        "All imports to be dynamic",
      ],
      answer: 0,
      explanation:
        "The bundler must prove which exports and evaluations can safely be removed without changing observable behavior.",
    },
  }),
];
