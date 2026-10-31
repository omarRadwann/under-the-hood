import { js } from "./helpers";
export const objectModel = [
  js({
    slug: "classes-and-construction",
    title: "Classes, construction & private brands",
    level: "Deep dive",
    description:
      "Trace field initialization, super, constructor returns, static state, and private-field identity.",
    prerequisites: ["function-call-semantics", "objects-and-prototypes"],
    mental:
      "Classes combine prototype methods, instance and static initialization, constructor rules, private brands, and strict execution. Understanding the construction timeline explains bugs that a class-is-just-a-function slogan misses.",
    steps: [
      {
        title: "Follow allocation and initialization",
        body: "Base and derived constructors have different rules for establishing this. A derived constructor normally calls super before accessing this, and derived instance fields initialize after the base construction step returns. A base constructor calling an overridable method can therefore reach a derived implementation before its fields are initialized.",
      },
      {
        title: "Separate instance, prototype, and static storage",
        body: "Ordinary instance methods are shared through the prototype; public instance fields belong to each instance; static fields and methods belong to the constructor object. A class-field arrow usually creates a per-instance function closing over its receiver. Static initialization blocks execute as class definition work, not every time an instance is created.",
      },
      {
        title: "Respect private branding",
        body: "Private names are not ordinary string or symbol keys. Access requires the relevant brand; changing a prototype does not grant it. Extracting a private-field method or forwarding it through a proxy can supply a receiver without the expected brand. A supported private-in check tests the brand but still needs an appropriate object operand.",
      },
      {
        title: "Treat construction as a protocol",
        body: "Constructors can return objects that replace the usual instance, with additional derived-constructor constraints. new.target identifies the construction target. Class constructors cannot be called as ordinary functions. Property definitions, inheritance of constructor objects, and method home objects have observable semantics, so test a hierarchy's initialization and substitution contract explicitly.",
      },
    ],
    code: `class Base {\n  constructor() { this.describe(); }\n}\nclass Derived extends Base {\n  label = 'ready';\n  #count = 0;\n  describe() { console.log('during base:', this.label); }\n  increment() { return ++this.#count; }\n}\nconst value = new Derived();\nconsole.log(value.label, value.increment());`,
    pitfalls: [
      "Calling overridable behavior before derived fields initialize.",
      "Thinking setPrototypeOf grants private-field access.",
      "Forgetting the allocation cost and identity of class-field arrows.",
    ],
    practice:
      "Draw the initialization order for a base field, base constructor, derived field, and derived constructor body. Add one overridden method and a private field, then test extracted and bound calls.",
    challenge: {
      prompt: "Does sharing the prototype grant a private brand?",
      solution: `class Secret {\n  #value = 7;\n  read() { return this.#value; }\n}\nconst impostor = Object.create(Secret.prototype);\n// impostor.read() throws: it has the prototype, not the private brand.`,
      explanation:
        "Private-field eligibility is established through the class's initialization machinery. Prototype ancestry alone is insufficient.",
    },
    quiz: {
      question: "When are derived instance fields initialized in ordinary derived construction?",
      choices: [
        "After super returns, before the rest of that constructor body",
        "Before the base constructor starts",
        "Only when first read",
      ],
      answer: 0,
      explanation:
        "This is why base-constructor virtual calls can observe uninitialized derived fields.",
    },
    sources: [
      {
        title: "MDN · Using classes",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes",
      },
    ],
  }),
  js({
    slug: "inheritance-and-composition",
    title: "Inheritance, super & composition contracts",
    level: "Advanced",
    description:
      "Choose behavioral substitution or explicit capabilities, and understand super's home-object semantics.",
    prerequisites: ["classes-and-construction", "property-descriptors-and-proxies"],
    mental:
      "Inheritance connects lookup and construction behavior; composition connects explicit collaborators. Either can express useful reuse, but neither removes the obligation to preserve behavioral contracts and ownership.",
    steps: [
      {
        title: "Separate the two prototype relationships",
        body: "A class hierarchy connects instance prototypes and also relates constructor objects for static inheritance. Object.getPrototypeOf(instance), a constructor's prototype property, and Object.getPrototypeOf(Constructor) answer different questions. Mutating these relationships after optimization or publication can change behavior far beyond one method.",
      },
      {
        title: "Understand super's lookup and receiver",
        body: "A method's super lookup depends on its home object rather than simply where the function is later assigned. The call can still use the current this as receiver. Copying a method to another object does not retarget its home object, so a mixin formed by assigning methods with super can behave unexpectedly.",
      },
      {
        title: "Preserve substitutability",
        body: "A subclass must preserve the promises expected by its consumers: allowed inputs, outputs, failure behavior, and state invariants. Sharing method names is insufficient. Built-in subclasses also encounter special construction and species behavior in some operations; a wrapper can provide a smaller, more predictable capability surface.",
      },
      {
        title: "Compose around genuine variation",
        body: "Delegate formatting, persistence, and transport through narrow collaborators when those policies vary independently. Avoid a universal abstraction with many optional methods or flags. Composition can still hide global state or create cycles, so make lifecycle, error translation, and dependency direction explicit and test behavior rather than inheritance diagrams alone.",
      },
    ],
    code: `const base = { label: 'base', read() { return this.label; } };\nconst child = {\n  __proto__: base,\n  label: 'child',\n  read() { return super.read(); }\n};\nconst elsewhere = { label: 'elsewhere', read: child.read };\nconsole.log(child.read(), elsewhere.read());\n// Lookup uses the method's home object; the receiver is still elsewhere.`,
    pitfalls: [
      "Confusing constructor inheritance with instance ancestry.",
      "Copying a super-using method and expecting its lookup base to change.",
      "Creating subclasses that strengthen preconditions or weaken promised results.",
    ],
    practice:
      "Replace a hierarchy whose subclasses vary formatting and transport independently with composed capabilities. Preserve its observable contract and show one case where inheritance remains the simpler appropriate choice.",
    challenge: {
      prompt: "Does assigning a method retarget its super lookup?",
      solution: `const parent = { value: 'original' };\nconst original = { __proto__: parent, read() { return super.value; } };\nconst other = { __proto__: { value: 'other' }, read: original.read };\nconsole.log(other.read()); // original`,
      explanation:
        "The method retains its home-object information. The object receiving the copied property does not become a new home object for that function.",
    },
    quiz: {
      question: "Does matching a base class's method names establish behavioral substitution?",
      choices: ["No", "Yes", "Only for static methods"],
      answer: 0,
      explanation:
        "Substitution concerns the full input/output/failure and state contract, not just property names.",
    },
    sources: [
      {
        title: "MDN · Inheritance and the prototype chain",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain",
      },
      {
        title: "MDN · super",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super",
      },
    ],
  }),
  js({
    slug: "symbols-and-protocols",
    title: "Symbols & language extension protocols",
    level: "Deep dive",
    description:
      "Use symbol keys and well-known hooks without mistaking hidden-looking properties for privacy.",
    prerequisites: ["coercion-algorithms", "objects-and-enumeration"],
    mental:
      "Symbols provide primitive identity suitable for property keys. Well-known symbols let objects participate in selected language protocols, while the global symbol registry serves another purpose. None of these mechanisms makes arbitrary properties secret.",
    steps: [
      {
        title: "Separate description from identity",
        body: "Symbol('id') creates a distinct symbol even when another symbol has the same description. Symbol.for uses a registry lookup and can return the same registered symbol for a key within its supported agent context. A description is diagnostic text, not an identity or an authorization token.",
      },
      {
        title: "Distinguish visibility and secrecy",
        body: "Symbol keys are omitted by some common enumeration APIs but can be found through Reflect.ownKeys or getOwnPropertySymbols. Enumerable symbol properties can also be copied by object spread. Private class fields have a different brand-enforced mechanism; a symbol field should not be treated as a security boundary.",
      },
      {
        title: "Implement a protocol coherently",
        body: "Symbol.iterator supplies synchronous iteration; Symbol.asyncIterator supplies asynchronous iteration; Symbol.toPrimitive influences conversion; Symbol.hasInstance can customize instance checks. Other hooks affect matching and descriptive behavior. Returning the wrong shape can fail at the consumer's protocol boundary even when the property exists.",
      },
      {
        title: "Keep extension points bounded",
        body: "Protocol hooks can execute during operations that look like simple reads, conversion, loops, or instanceof. Reentrancy and exceptions therefore matter. Registered symbols also differ from eligible weakly held symbols in modern weak-collection contracts. Verify the target's supported semantics instead of calling all symbol behavior interchangeable.",
      },
    ],
    code: `const first = Symbol('id');\nconst second = Symbol('id');\nconsole.log(first === second, Symbol.for('shared') === Symbol.for('shared'));\nconst value = { [first]: 7, visible: true };\nconsole.log(Object.keys(value), Reflect.ownKeys(value).map(String));\nconst iterable = {\n  *[Symbol.iterator]() { yield 1; yield 2; }\n};\nconsole.log([...iterable]);`,
    pitfalls: [
      "Treating equal symbol descriptions as equal symbols.",
      "Using symbols as secret properties.",
      "Implementing iterator hooks that return protocol-incompatible results.",
    ],
    practice:
      "Create an object with one symbol metadata key and one iteration hook. Show exactly which APIs reveal or copy each property, and document the protocol's cleanup behavior.",
    challenge: {
      prompt: "Does object spread always drop symbol properties?",
      solution: `const key = Symbol('key');\nconst source = { [key]: 7 };\nconst copy = { ...source };\nconsole.log(copy[key]); // 7`,
      explanation:
        "Object spread copies eligible enumerable own properties, including symbol keys. Symbols are not private storage.",
    },
    quiz: {
      question: "Does Symbol('x') equal another Symbol('x')?",
      choices: ["No", "Yes", "Only in modules"],
      answer: 0,
      explanation:
        "Each ordinary Symbol call produces a distinct identity. The registry operation Symbol.for has a different contract.",
    },
    sources: [
      {
        title: "MDN · Symbol",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol",
      },
    ],
  }),
  js({
    slug: "property-ownership-and-immutability",
    title: "Descriptors, integrity levels & immutable updates",
    level: "Deep dive",
    description:
      "Compare extensibility, sealing, freezing, structural sharing, and observable accessor behavior.",
    prerequisites: ["objects-and-enumeration", "property-descriptors-and-proxies"],
    mental:
      "An integrity operation constrains selected object operations. It does not automatically deep-freeze a graph, remove accessor side effects, or make every embedded capability immutable.",
    steps: [
      {
        title: "Read the descriptor contract",
        body: "Data descriptors combine value with writable; accessor descriptors combine get/set. Both also have enumerable and configurable flags. Defining a property differs from assigning through normal property access, and omitted defineProperty flags default to restrictive values. A copy of values is not a copy of descriptors.",
      },
      {
        title: "Distinguish integrity levels",
        body: "preventExtensions prevents adding own properties; seal also makes own properties non-configurable; freeze additionally makes own data properties non-writable. These operations are shallow. Accessor setters can still have effects, nested objects can remain mutable, and freezing the wrapper of a collection does not necessarily freeze its internal entries.",
      },
      {
        title: "Design immutable updates at the owning boundary",
        body: "Structural sharing reuses unchanged parts while replacing the path that changed. Replacing only the outer object after mutating a shared nested record breaks the intended ownership contract. Readonly TypeScript annotations expose a restricted static capability but do not enforce runtime deep immutability.",
      },
      {
        title: "Handle object graphs, not just trees",
        body: "A generic deep-freeze or clone must account for cycles, repeated aliases, built-ins, accessors, and external capabilities. Recursively reading every property can itself execute code. Prefer immutable DTO shapes and explicit domain transformations when a universal deep operation would obscure these assumptions.",
      },
    ],
    code: `const value = Object.freeze({ nested: { n: 1 } });\nvalue.nested.n = 2;\nconsole.log(value.nested.n);\nconst map = Object.freeze(new Map([['a', 1]]));\nmap.set('a', 2);\nconsole.log(map.get('a'));\nconst next = { ...value, nested: { ...value.nested, n: 3 } };\nconsole.log(value.nested.n, next.nested.n);`,
    pitfalls: [
      "Assuming freeze recursively freezes nested state.",
      "Assuming a frozen Map cannot change its entries.",
      "Reading arbitrary getters while implementing a supposedly passive deep operation.",
    ],
    practice:
      "Write immutable updates for a graph with two aliases to the same record. State whether the aliases must remain shared or become separate, then test the chosen identity invariant.",
    challenge: {
      prompt: "Can a setter still execute on a frozen object?",
      solution: `let stored = 0;\nconst object = { set value(next) { stored = next; } };\nObject.freeze(object);\nobject.value = 7;\nconsole.log(stored); // 7`,
      explanation:
        "Freezing prevents selected structural and data-property changes. It does not erase an accessor's setter or prevent effects that setter performs elsewhere.",
    },
    quiz: {
      question: "Does Object.freeze guarantee deep immutability?",
      choices: ["No", "Yes", "Only for arrays"],
      answer: 0,
      explanation:
        "The operation is shallow and has specific property-level semantics, not a universal object-graph guarantee.",
    },
    sources: [
      {
        title: "MDN · Object.freeze",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze",
      },
    ],
  }),
  js({
    slug: "module-linking-and-cycles",
    title: "ESM linking, live bindings & cycles",
    level: "Deep dive",
    execution: "reference",
    description:
      "Separate module discovery, linking, initialization, evaluation, dynamic loading, and top-level await.",
    prerequisites: ["scope-and-closures", "hoisting-and-tdz", "modules-and-bundlers"],
    mental:
      "A module graph connects bindings and evaluation dependencies. Imports are not ordinary property copies, and a cycle is not automatically an error: the time at which a binding is accessed determines whether its initialization contract is satisfied.",
    steps: [
      {
        title: "Separate linking from execution",
        body: "Static imports describe graph edges that a host or bundler resolves before ordinary module evaluation proceeds. Linking establishes relationships among bindings; evaluation executes module bodies in the applicable order. A dependency may fail to resolve or parse before the importing body runs, while an evaluation failure has a different origin.",
      },
      {
        title: "Observe live read-only imports",
        body: "A named import observes the exporting binding rather than copying its current value into an independent local variable. The importer cannot reassign that imported binding, though an exported object can still be mutable. Destructuring a property from an imported namespace into a new local binding can instead capture a current value.",
      },
      {
        title: "Analyze a cycle by access timing",
        body: "Cycles can work when code defers access until involved bindings have initialized. An eager top-level read of a still-uninitialized lexical binding can throw. Reordering imports is not a robust architectural repair for a tangled dependency cycle; extract a contract, invert a dependency, or defer an operation with explicit ownership.",
      },
      {
        title: "Account for asynchronous graph evaluation",
        body: "Top-level await can hold up modules that depend on the awaited evaluation. Independent work and dynamically imported work have distinct scheduling. import() returns a promise and normally reuses the host's module instance for the resolved identity; it is not a general reload mechanism. The worker playground intentionally blocks arbitrary imports, so these examples require separate real module files.",
      },
    ],
    code: `// counter.mjs\nexport let count = 0;\nexport function increment() { count++; }\n\n// consumer.mjs\nimport { count, increment } from './counter.mjs';\nconsole.log(count); // 0\nincrement();\nconsole.log(count); // 1: live binding\n// count = 9; // the imported binding cannot be reassigned here.`,
    pitfalls: [
      "Calling imports simple copied values.",
      "Assuming all module cycles are either safe or always forbidden.",
      "Using dynamic import as a universal fresh-instance loader.",
    ],
    practice:
      "Create two .mjs files with a cycle. Make one version read too early and another defer the read through a function. Draw the initialization and call order, then remove the architectural cycle deliberately.",
    challenge: {
      prompt: "Is a local destructured copy also a live import binding?",
      solution: `// Given: import * as counter from './counter.mjs'\n// const { count: snapshot } = counter;\n// counter.increment();\n// counter.count reflects the export's new value; snapshot retains its captured value.`,
      explanation:
        "The namespace property gives access to an exported binding, but ordinary destructuring initializes a new local binding with the value observed at that moment.",
    },
    quiz: {
      question: "Does a cycle always produce an error?",
      choices: [
        "No; access and initialization timing matter",
        "Yes",
        "Only when there are three modules",
      ],
      answer: 0,
      explanation:
        "A cycle can defer reads until bindings are initialized. Early lexical reads are the dangerous case.",
    },
    sources: [
      {
        title: "MDN · JavaScript modules",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
      },
    ],
  }),
  js({
    slug: "realms-and-cross-realm-identity",
    title: "Realms, intrinsics & cross-boundary identity",
    level: "Deep dive",
    execution: "browser",
    description:
      "Understand why instanceof, constructors, globals, and authority change across iframe or VM boundaries.",
    prerequisites: ["objects-and-prototypes", "symbols-and-protocols"],
    mental:
      "A realm supplies its own global environment and intrinsic objects. Objects can cross some boundaries without acquiring the receiving realm's prototype identities. A realm is not automatically a process, an agent, a worker, or a security sandbox.",
    steps: [
      {
        title: "Separate the execution concepts",
        body: "A realm packages globals and intrinsics; an agent organizes execution and job processing; a worker normally runs a separate agent with host-defined communication. Same-origin frames can have different realms while still interacting closely. Isolating intrinsics does not by itself remove access to host capabilities.",
      },
      {
        title: "Check what instanceof actually asks",
        body: "Ordinary instanceof follows a prototype-based protocol involving the constructor, and Symbol.hasInstance can customize it. An array from another realm may fail instanceof against the receiving realm's Array. Array.isArray uses a more appropriate array-brand check, so it answers a different question.",
      },
      {
        title: "Distinguish identity crossing from cloning",
        body: "A same-origin object reference can retain foreign prototype identities. Structured cloning reconstructs supported data under its own rules and does not preserve arbitrary behavior or custom prototypes. Across-origin access adds browser security constraints, while a cross-realm reference alone says nothing about authentication or trust.",
      },
      {
        title: "Keep capability security explicit",
        body: "Node vm contexts and browser frames are not interchangeable hostile-code execution services. Supplying a powerful function or object can reintroduce authority into an otherwise restricted environment. Sandboxing requires host controls, resource policies, lifecycle limits, and a precise threat model beyond a different global object.",
      },
    ],
    code: `// Run in a same-origin browser page with permission to create a frame.\nconst frame = document.createElement('iframe');\ndocument.body.append(frame);\ntry {\n  const foreign = new frame.contentWindow.Array(1, 2);\n  console.log(foreign instanceof Array); // false\n  console.log(Array.isArray(foreign)); // true\n} finally { frame.remove(); }`,
    pitfalls: [
      "Treating instanceof as a universal cross-realm structural validator.",
      "Equating a realm with a worker or OS process.",
      "Calling a new context secure after passing it privileged host functions.",
    ],
    practice:
      "Compare a same-origin frame reference, a structured-cloned array, and a worker message. Document which identities, prototypes, capabilities, and access rules survive each boundary.",
    challenge: {
      prompt: "Does passing an instanceof check prove an object is trustworthy?",
      solution: `const acceptsEverything = { [Symbol.hasInstance]() { return true; } };\nconsole.log({} instanceof acceptsEverything); // true`,
      explanation:
        "The protocol itself is customizable. A classification expression does not supply authentication, authorization, or deep structural validation.",
    },
    quiz: {
      question: "Which test is suitable for ordinary arrays from another realm?",
      choices: [
        "Array.isArray",
        "Only value instanceof local Array",
        "Only comparing constructor names",
      ],
      answer: 0,
      explanation:
        "Array.isArray checks array branding rather than relying on one realm's Array.prototype identity.",
    },
    sources: [
      {
        title: "MDN · Execution model",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
      },
      { title: "Node.js · vm", url: "https://nodejs.org/api/vm.html" },
    ],
  }),
  js({
    slug: "resource-ownership",
    title: "Resource ownership, disposal & using",
    level: "Deep dive",
    description:
      "Build deterministic cleanup and understand synchronous versus asynchronous disposal and error composition.",
    prerequisites: ["errors-and-completion", "symbols-and-protocols", "async-await"],
    mental:
      "Garbage collection manages memory reachability, not the timely release of every scarce resource. A resource needs an owner, an acquisition boundary, a release protocol, and a defined outcome when work or cleanup fails.",
    steps: [
      {
        title: "Define one responsible owner",
        body: "A subscription, lock, stream, temporary file, or connection can outlive the useful operation unless ownership is explicit. Acquire only when the owner can arrange release, and make cleanup idempotent where retries or repeated lifecycle signals are possible. Finalization is a fallback observation, not a guarantee of essential cleanup.",
      },
      {
        title: "Match cleanup to completion",
        body: "try/finally can release a synchronously owned resource across return and throw. If the operation is asynchronous, returning its promise from a try without awaiting can run finally before the work completes. Await within the owning region when resource lifetime must include that asynchronous completion.",
      },
      {
        title: "Understand explicit disposal protocols",
        body: "Supported explicit-resource-management syntax uses using with Symbol.dispose and await using with asynchronous disposal semantics. Multiple resources are disposed in reverse acquisition order. Availability depends on the target parser, runtime, and toolchain; a syntax transform and a runtime built-in are distinct compatibility concerns.",
      },
      {
        title: "Preserve both primary and cleanup failures",
        body: "Disposal can fail while another error is already propagating. Explicit disposal semantics include suppressed-error handling rather than silently discarding one failure. A hand-written finally block must also choose an error policy. Cancellation requests, releasing local ownership, and rolling back a remote side effect remain different operations.",
      },
    ],
    code: `function withResource(resource, work) {\n  try { return work(resource); }\n  finally { resource.close(); }\n}\nconst resource = { close() { console.log('closed'); } };\nconsole.log(withResource(resource, () => 'result'));\n// This helper's work contract is synchronous.\nconsole.log('dispose supported:', typeof Symbol.dispose === 'symbol');`,
    pitfalls: [
      "Essential cleanup deferred to garbage collection.",
      "Returning an async operation and releasing its resource before it settles.",
      "Assuming a syntax transform supplies every disposal-related runtime API.",
    ],
    practice:
      "Implement an asynchronous resource owner with nested acquisition, cancellation, and failures in both work and cleanup. Define release order and the caller-visible error evidence. Compare it with supported await-using behavior in your target runtime.",
    challenge: {
      prompt: "How does an async owner keep the resource alive until work settles?",
      solution: `async function withAsyncResource(resource, work) {\n  try { return await work(resource); }\n  finally { await resource.close(); }\n}`,
      explanation:
        "Awaiting inside the try makes the finally region cover the asynchronous operation's settlement. The cleanup error policy still needs deliberate design.",
    },
    quiz: {
      question: "Does GC guarantee prompt release of a connection?",
      choices: ["No", "Yes", "Only if it is stored in a WeakMap"],
      answer: 0,
      explanation:
        "Essential resource lifetime requires deterministic ownership and release rather than nondeterministic collection.",
    },
    sources: [
      {
        title: "MDN · Resource management",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management",
      },
      {
        title: "MDN · using",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using",
      },
    ],
  }),
];
