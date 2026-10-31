# JavaScript coverage and mastery path

64 language/runtime chapters in 6 stages. The project contains 156 lessons overall. The path includes every lesson in the JavaScript and async tracks exactly once.

This is an explicit curriculum map. It covers the major language and standard-library families and essential host integration, while linking method-level specification and compatibility details. It is not a claim that every platform API or experimental proposal has its own chapter.

## 1. First program → reliable basics

Read source, predict values, and control execution.

Mastery: Explain evaluation, bindings, types, operators, branches, function calls, and error completion without relying on a framework.

- **Your first program: language, engine & host** — `/learn/language-and-hosts` · Foundations · worker context
- **Bindings, assignment & mutation** — `/learn/bindings-and-assignment` · Foundations · worker context
- **The value system: primitives, objects & typeof** — `/learn/primitives-and-typeof` · Foundations · worker context
- **Operators, precedence & short-circuit evaluation** — `/learn/operators-and-precedence` · Foundations · worker context
- **Control flow, iteration & completion** — `/learn/control-flow-and-loops` · Foundations · worker context
- **Functions, parameters & returned values** — `/learn/functions-and-parameters` · Foundations · worker context
- **Errors, exceptions & finally semantics** — `/learn/errors-and-completion` · Foundations · worker context

Stage project: Build a validated command-style calculator. Separate parsing, domain validation, calculation, and diagnostics; include zero, missing values, invalid input, and thrown failures.

## 2. Values → dependable data transformations

Choose the right representation, traversal, and comparison.

Mastery: Reason about sparse arrays, key identity, conversion, floating-point limits, text units, parsing, and wire representations.

- **Arrays, indexes, holes & length** — `/learn/arrays-and-sparse-data` · Foundations · worker context
- **Objects, keys, ownership & enumeration** — `/learn/objects-and-enumeration` · Foundations · worker context
- **Destructuring, defaults, rest & spread** — `/learn/destructuring-and-spread` · Advanced · worker context
- **Coercion: ToPrimitive, truthiness & equality** — `/learn/coercion-algorithms` · Deep dive · worker context
- **Number precision, BigInt & decimal domains** — `/learn/numbers-and-bigint` · Advanced · worker context
- **Strings, Unicode & text boundaries** — `/learn/strings-and-unicode` · Advanced · worker context
- **Array algorithms, sorting & mutation** — `/learn/array-transformations` · Advanced · worker context
- **Map, Set & collection identity** — `/learn/keyed-collections` · Advanced · worker context
- **Regular expressions, state & backtracking** — `/learn/regex-and-backtracking` · Deep dive · worker context
- **Dates, instants, Intl & calendar policy** — `/learn/dates-and-intl` · Advanced · worker context
- **JSON, structured cloning & wire contracts** — `/learn/json-and-serialization` · Advanced · worker context
- **Math, rounding & secure randomness** — `/learn/math-and-randomness` · Advanced · worker context

Stage project: Build an immutable record explorer: exact IDs, indexed lookup, locale-aware display, stable sorting, and an explicitly versioned DTO. Test holes, aliases, Unicode, and large numeric identifiers.

## 3. Functions → the object protocol

Trace identity, receivers, environments, and construction.

Mastery: Predict closures and TDZ, call/construct behavior, prototype lookup, descriptors, symbols, private brands, iteration, and immutable updates.

- **Scope, closures & retained state** — `/learn/scope-and-closures` · Advanced · conceptual/reference context
- **Hoisting & the temporal dead zone** — `/learn/hoisting-and-tdz` · Foundations · conceptual/reference context
- **Values, references & equality** — `/learn/values-and-equality` · Advanced · conceptual/reference context
- **Objects, prototypes & this** — `/learn/objects-and-prototypes` · Advanced · conceptual/reference context
- **Call, apply, bind, new & lexical this** — `/learn/function-call-semantics` · Deep dive · worker context
- **Descriptors, Reflect & Proxy invariants** — `/learn/property-descriptors-and-proxies` · Deep dive · conceptual/reference context
- **Classes, construction & private brands** — `/learn/classes-and-construction` · Deep dive · worker context
- **Inheritance, super & composition contracts** — `/learn/inheritance-and-composition` · Advanced · worker context
- **Symbols & language extension protocols** — `/learn/symbols-and-protocols` · Deep dive · worker context
- **Descriptors, integrity levels & immutable updates** — `/learn/property-ownership-and-immutability` · Deep dive · worker context
- **Pure functions, composition & algebraic assumptions** — `/learn/functional-design-in-javascript` · Advanced · worker context
- **Iterators, generators & resource cleanup** — `/learn/iterators-and-generators` · Deep dive · conceptual/reference context

Stage project: Build a small observable domain model with explicit ownership. Test nested observer calls, descriptor invariants, private-method receivers, iteration cleanup, and structural-sharing assumptions.

## 4. Source → runtime and memory

Connect language guarantees to versioned engine and host behavior.

Mastery: Distinguish linking from evaluation, realms from agents, reachability from cleanup, specialized code from semantics, and byte ownership from view identity.

- **Inside the JavaScript engine** — `/learn/javascript-engine` · Deep dive · conceptual/reference context
- **Execution contexts & the call stack** — `/learn/execution-context` · Foundations · conceptual/reference context
- **Modules, bundlers & tree shaking** — `/learn/modules-and-bundlers` · Advanced · conceptual/reference context
- **ESM linking, live bindings & cycles** — `/learn/module-linking-and-cycles` · Deep dive · reference context
- **Runtime targets, ESM/CJS & package contracts** — `/learn/modules-tooling-and-compatibility` · Deep dive · reference context
- **Realms, intrinsics & cross-boundary identity** — `/learn/realms-and-cross-realm-identity` · Deep dive · browser context
- **Memory & garbage collection** — `/learn/memory-and-garbage-collection` · Deep dive · conceptual/reference context
- **WeakMap, WeakRef & finalization** — `/learn/weak-references` · Deep dive · conceptual/reference context
- **Memory leaks, retained graphs & heap evidence** — `/learn/memory-leaks-and-retention` · Deep dive · worker context
- **Shapes, inline caches & deoptimization** — `/learn/shapes-and-inline-caches` · Deep dive · conceptual/reference context
- **Profiling JIT behavior without benchmark folklore** — `/learn/engine-optimization-investigation` · Deep dive · worker context
- **ArrayBuffer, typed views & endianness** — `/learn/binary-memory` · Deep dive · conceptual/reference context
- **Binary protocols, framing & ownership** — `/learn/binary-protocols-and-encoding` · Deep dive · worker context

Stage project: Build a bounded binary-message decoder and profile a repeated workload. Test split frames, malformed lengths, shared aliases, retention paths, cross-realm checks, and the real packaged artifact.

## 5. Callbacks → controlled concurrency

Control initiation, continuation, pressure, lifetime, and ownership.

Mastery: Trace browser/Node work, promise resolution, rejection chains, await, scheduling policies, worker communication, streaming, async context, and Atomics.

- **The event loop** — `/learn/event-loop` · Deep dive · conceptual/reference context
- **Promises & error propagation** — `/learn/promises` · Advanced · conceptual/reference context
- **Promise resolution & thenable assimilation** — `/learn/promise-assimilation` · Deep dive · conceptual/reference context
- **Promise construction, settlement & rejection ownership** — `/learn/promise-construction-and-rejections` · Deep dive · worker context
- **Async functions & continuation** — `/learn/async-await` · Advanced · conceptual/reference context
- **Cancellation, deadlines & races** — `/learn/cancellation-and-races` · Advanced · conceptual/reference context
- **Promise combinators, deadlines & losing work** — `/learn/promise-combinators-and-timeouts` · Deep dive · worker context
- **Debounce, throttle & latest-operation ownership** — `/learn/debounce-throttle-and-scheduling` · Advanced · worker context
- **Concurrency limits & race conditions** — `/learn/concurrency-control` · Advanced · conceptual/reference context
- **Concurrency limits, queues & scheduling fairness** — `/learn/concurrency-limits-and-fairness` · Deep dive · worker context
- **Node.js, libuv & nextTick** — `/learn/node-event-loop` · Deep dive · conceptual/reference context
- **Workers & parallel execution** — `/learn/workers-and-parallelism` · Advanced · conceptual/reference context
- **Streams & backpressure** — `/learn/streams-and-backpressure` · Advanced · conceptual/reference context
- **Async iterables, generators & cancellation ownership** — `/learn/async-iteration-and-cancellation` · Deep dive · worker context
- **Async context & request isolation** — `/learn/async-context` · Deep dive · conceptual/reference context
- **Shared memory, Atomics & synchronization** — `/learn/shared-memory-and-atomics` · Deep dive · conceptual/reference context

Stage project: Build a cancellable bounded job runner. Specify queue admission, active limits, result order, end-to-end deadlines, retries, stale completion guards, resource cleanup, and controlled failure schedules.

## 6. Language knowledge → production judgment

Protect invariants at callbacks, lifecycle, host, and trust boundaries.

Mastery: Design deterministic resource ownership, safe extension points, event lifetimes, and constrained data/capability boundaries; use the wider curriculum for system-level evidence.

- **Reentrancy: when synchronous code calls you back** — `/learn/reentrancy-and-observers` · Deep dive · worker context
- **Resource ownership, disposal & using** — `/learn/resource-ownership` · Deep dive · worker context
- **DOM events, delegation & shadow boundaries** — `/learn/dom-events-and-propagation` · Advanced · browser context
- **JavaScript security: code, keys & capabilities** — `/learn/language-security-boundaries` · Deep dive · worker context

Stage project: Integrate the previous projects into a search interface with explicit listener lifetimes, per-owner cancellation, validated data, bounded work, and a written threat model. Produce failure tests and a profile-based review.

## Language-guide crosswalk

- **Grammar, lexical rules & types**: language-and-hosts, bindings-and-assignment, primitives-and-typeof, hoisting-and-tdz. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types).
- **Control flow & error handling**: control-flow-and-loops, errors-and-completion. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling).
- **Loops & iteration**: control-flow-and-loops, iterators-and-generators, async-iteration-and-cancellation. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration).
- **Functions & closures**: functions-and-parameters, function-call-semantics, scope-and-closures, functional-design-in-javascript. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions).
- **Expressions, operators & coercion**: operators-and-precedence, coercion-algorithms, destructuring-and-spread. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators).
- **Numbers & strings**: numbers-and-bigint, strings-and-unicode, math-and-randomness. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings).
- **Dates, times & internationalization**: dates-and-intl, strings-and-unicode. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Internationalization).
- **Regular expressions**: regex-and-backtracking. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions).
- **Indexed collections**: arrays-and-sparse-data, array-transformations. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections).
- **Keyed collections**: keyed-collections, weak-references. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections).
- **Objects, ownership & descriptors**: objects-and-enumeration, property-descriptors-and-proxies, property-ownership-and-immutability. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects).
- **Classes & inheritance**: classes-and-construction, inheritance-and-composition, objects-and-prototypes. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes).
- **Promises & jobs**: promises, promise-assimilation, promise-construction-and-rejections, promise-combinators-and-timeouts, event-loop. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises).
- **Typed arrays & shared storage**: binary-memory, binary-protocols-and-encoding, shared-memory-and-atomics. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays).
- **Iterators & generators**: iterators-and-generators, async-iteration-and-cancellation. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators).
- **Resource management**: resource-ownership. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management).
- **Modules & graph evaluation**: modules-and-bundlers, module-linking-and-cycles, modules-tooling-and-compatibility. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).
- **Metaprogramming & protocols**: symbols-and-protocols, property-descriptors-and-proxies, realms-and-cross-realm-identity. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Meta_programming).
- **Memory & agent coordination**: memory-and-garbage-collection, memory-leaks-and-retention, workers-and-parallelism, shared-memory-and-atomics. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management).

## Built-in and platform reference families

### Values, bindings & global operations

globalThis · undefined / null · Boolean · Symbol / Symbol.for · Number · BigInt · String · parseInt / parseFloat · isNaN / isFinite · encodeURI / encodeURIComponent

Global helpers have distinct coercion/encoding rules; URI encoding is not HTML escaping.
Related chapter: `/learn/primitives-and-typeof`.

### Objects, functions & reflection

Object · Function · Reflect · Proxy · Object.hasOwn · Object.keys / values / entries · Reflect.ownKeys · Object.getOwnPropertyDescriptors · Object.freeze / seal / preventExtensions · Object.groupBy / Map.groupBy

Read property and identity contracts; grouping and reflection do not validate untrusted schemas.
Related chapter: `/learn/property-descriptors-and-proxies`.

### Errors & control completion

Error / cause · TypeError · RangeError · ReferenceError · SyntaxError · URIError · EvalError · AggregateError · SuppressedError

Some error families and disposal features depend on target support; caught values need not be Error objects.
Related chapter: `/learn/errors-and-completion`.

### Collections, text & serialization

Array / copying methods · Map / Set / set operations · WeakMap / WeakSet · String / normalization · RegExp / lastIndex / escape · JSON / replacer / reviver · structuredClone (host API)

Check equality, ownness, accessor execution, aliasing, Unicode units, and transport loss.
Related chapter: `/learn/keyed-collections`.

### Numbers, calendars & internationalization

Math · Date · Temporal (check availability) · Intl.DateTimeFormat · Intl.NumberFormat · Intl.Collator · Intl.Segmenter · Intl.PluralRules · Intl.RelativeTimeFormat · Intl.ListFormat / DisplayNames / Locale · Intl.DurationFormat

The reference includes newer APIs. Native availability is feature-tested; declarations and transforms do not install built-ins.
Related chapter: `/learn/dates-and-intl`.

### Binary storage & coordination

ArrayBuffer / SharedArrayBuffer · DataView · Int8/16/32Array / Uint8/16/32Array · Uint8ClampedArray · Float16/32/64Array · BigInt64Array / BigUint64Array · Atomics · TextEncoder / TextDecoder (host APIs)

Specify widths, alignment, endianness, resize/transfer behavior, shared ownership, and supported synchronization.
Related chapter: `/learn/binary-protocols-and-encoding`.

### Iteration, jobs & lifetime

Iterator / helpers · Generator / GeneratorFunction · AsyncIterator protocol · AsyncGenerator / AsyncGeneratorFunction · AsyncFunction · Promise / combinators / withResolvers / try · WeakRef / FinalizationRegistry · DisposableStack / AsyncDisposableStack · Symbol.dispose / Symbol.asyncDispose

Lazy versus eager work, closure protocols, disposal order, and rejection ownership require separate reasoning.
Related chapter: `/learn/resource-ownership`.

### Syntax and platform reference

Statements & declarations · Expressions & operators · Classes / private elements / static blocks · Modules / import attributes / dynamic import · Lexical grammar / strict mode / ASI · DOM / events / fetch (browser APIs) · Node modules / streams / async context (host APIs) · Stage proposals / engine extensions (verify status)

This index maps reference families to lessons; it does not label proposals or every host capability as universally available JavaScript.
Related chapter: `/learn/language-and-hosts`.

## Evidence and limits

Forty added chapters include worked edge-case challenges, solutions, practice investigations, explicit execution contexts, and at least four mechanism stages. Thirty-six new chapter programs run directly in the worker playground. Module/package and browser DOM examples state their separate execution requirements. A lazy-iterator-helper experiment adds a runnable cleanup investigation. Engine internals, host APIs, standards proposals, and newer built-ins are labeled by their actual contract rather than universalized.

Use VERIFICATION.md for current checks and REFERENCE-CHECK.json for point-in-time link status. Self-assessed completion is not an automated certification.
