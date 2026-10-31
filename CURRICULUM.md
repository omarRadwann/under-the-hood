# Curriculum index

148 lessons across 10 tracks. Each lesson includes a mental model, mechanism, code, pitfalls, practice, a quiz, and references. Architecture and pattern lessons also include explicit tradeoffs.

## JavaScript internals

From first expressions to object protocols, memory, and engine optimization. Build a complete language model.

- **Your first program: language, engine & host** — Start with expressions and statements, then separate ECMAScript from the environment executing it. Route: `/learn/language-and-hosts`.
- **Bindings, assignment & mutation** — Learn what let, const, and var actually bind, and distinguish changing a value from changing an object. Route: `/learn/bindings-and-assignment`.
- **The value system: primitives, objects & typeof** — Identify all primitive domains, callable objects, absent values, NaN, and typeof's historical edge cases. Route: `/learn/primitives-and-typeof`.
- **Operators, precedence & short-circuit evaluation** — Predict operand evaluation, logical return values, optional chaining, numeric coercion, and update expressions. Route: `/learn/operators-and-precedence`.
- **Control flow, iteration & completion** — Use branches, loops, labels, and early exits while preserving the intended state invariant. Route: `/learn/control-flow-and-loops`.
- **Functions, parameters & returned values** — Build functions deliberately: declarations, expressions, arrows, defaults, rest parameters, recursion, and contracts. Route: `/learn/functions-and-parameters`.
- **Errors, exceptions & finally semantics** — Follow abrupt completion, preserve diagnostic causes, and avoid finally blocks that overwrite outcomes. Route: `/learn/errors-and-completion`.
- **Arrays, indexes, holes & length** — Understand array storage semantics before treating every array as a dense list. Route: `/learn/arrays-and-sparse-data`.
- **Objects, keys, ownership & enumeration** — Distinguish own/inherited keys, symbols, enumerability, accessors, and ordering. Route: `/learn/objects-and-enumeration`.
- **Destructuring, defaults, rest & spread** — Follow evaluation, iterator consumption, property reads, defaults, and shallow copying precisely. Route: `/learn/destructuring-and-spread`.
- **Coercion: ToPrimitive, truthiness & equality** — Explain conversions as ordered algorithms rather than memorized surprising expressions. Route: `/learn/coercion-algorithms`.
- **Number precision, BigInt & decimal domains** — Keep identifiers exact, validate integers, and define rounding instead of patching floating-point symptoms. Route: `/learn/numbers-and-bigint`.
- **Strings, Unicode & text boundaries** — Separate code units, code points, graphemes, normalization, and byte encoding. Route: `/learn/strings-and-unicode`.
- **Array algorithms, sorting & mutation** — Choose transforms with explicit order, identity, missing-value, and complexity contracts. Route: `/learn/array-transformations`.
- **Map, Set & collection identity** — Design key spaces and set operations with the right equality, ordering, and ownership rules. Route: `/learn/keyed-collections`.
- **Regular expressions, state & backtracking** — Build patterns with explicit Unicode, matching, escaping, state, and input-size assumptions. Route: `/learn/regex-and-backtracking`.
- **Dates, instants, Intl & calendar policy** — Stop mixing UTC instants, wall-clock schedules, calendar dates, durations, and locale formatting. Route: `/learn/dates-and-intl`.
- **JSON, structured cloning & wire contracts** — Audit what serialization preserves, transforms, executes, omits, and rejects. Route: `/learn/json-and-serialization`.
- **Math, rounding & secure randomness** — Distinguish numerical policy, pseudorandom simulation, secure entropy, and unbiased bounded selection. Route: `/learn/math-and-randomness`.
- **Scope, closures & retained state** — See how a function keeps access to an environment after its outer call returns. Route: `/learn/scope-and-closures`.
- **Hoisting & the temporal dead zone** — Separate binding creation from initialization instead of imagining code moving. Route: `/learn/hoisting-and-tdz`.
- **Values, references & equality** — Reason about identity, copying, coercion, and the boundaries of immutability. Route: `/learn/values-and-equality`.
- **Objects, prototypes & this** — Trace property lookup and understand why the receiver controls this. Route: `/learn/objects-and-prototypes`.
- **Call, apply, bind, new & lexical this** — Trace the receiver and constructor protocol instead of attaching this to a function's declaration location. Route: `/learn/function-call-semantics`.
- **Descriptors, Reflect & Proxy invariants** — Understand the object protocol beneath assignment, enumeration, accessors, and interception. Route: `/learn/property-descriptors-and-proxies`.
  - Invariant: A proxy must preserve the target's non-configurable property and extensibility invariants; interception is not permission to invent an inconsistent object.
  - Prerequisites: objects-and-prototypes.
- **Classes, construction & private brands** — Trace field initialization, super, constructor returns, static state, and private-field identity. Route: `/learn/classes-and-construction`.
- **Inheritance, super & composition contracts** — Choose behavioral substitution or explicit capabilities, and understand super's home-object semantics. Route: `/learn/inheritance-and-composition`.
- **Symbols & language extension protocols** — Use symbol keys and well-known hooks without mistaking hidden-looking properties for privacy. Route: `/learn/symbols-and-protocols`.
- **Descriptors, integrity levels & immutable updates** — Compare extensibility, sealing, freezing, structural sharing, and observable accessor behavior. Route: `/learn/property-ownership-and-immutability`.
- **Pure functions, composition & algebraic assumptions** — Use functional techniques where they clarify data flow, without hiding effects or invalid mathematical assumptions. Route: `/learn/functional-design-in-javascript`.
- **Iterators, generators & resource cleanup** — Reason about pull-based execution, early termination, yield delegation, and async iteration. Route: `/learn/iterators-and-generators`.
  - Invariant: Early termination must release the resources owned by the iterator when its protocol supports closure.
  - Prerequisites: scope-and-closures.
- **Inside the JavaScript engine** — Follow source code through parsing, bytecode, optimization, and deoptimization. Route: `/learn/javascript-engine`.
- **Execution contexts & the call stack** — Understand what a function call creates, what the stack holds, and why recursion overflows. Route: `/learn/execution-context`.
- **Modules, bundlers & tree shaking** — Follow the import graph from live bindings to production chunks. Route: `/learn/modules-and-bundlers`.
- **ESM linking, live bindings & cycles** — Separate module discovery, linking, initialization, evaluation, dynamic loading, and top-level await. Route: `/learn/module-linking-and-cycles`.
- **Runtime targets, ESM/CJS & package contracts** — Separate parsing, syntax transforms, built-in APIs, conditional exports, package identity, and deployment support. Route: `/learn/modules-tooling-and-compatibility`.
- **Realms, intrinsics & cross-boundary identity** — Understand why instanceof, constructors, globals, and authority change across iframe or VM boundaries. Route: `/learn/realms-and-cross-realm-identity`.
- **Memory & garbage collection** — Explore reachability, retention paths, generational collection, and memory leaks. Route: `/learn/memory-and-garbage-collection`.
- **WeakMap, WeakRef & finalization** — Use weak ownership without making correctness depend on collection timing. Route: `/learn/weak-references`.
  - Invariant: Essential cleanup and durable effects cannot depend on a finalizer running.
  - Prerequisites: memory-and-garbage-collection.
- **Memory leaks, retained graphs & heap evidence** — Trace retaining paths through closures, listeners, caches, detached nodes, and diagnostic tools. Route: `/learn/memory-leaks-and-retention`.
- **Shapes, inline caches & deoptimization** — Connect property access feedback to real profiling without turning heuristics into dogma. Route: `/learn/shapes-and-inline-caches`.
  - Invariant: Specialized execution must preserve language semantics when its assumptions stop matching.
  - Prerequisites: javascript-engine, objects-and-prototypes.
- **Profiling JIT behavior without benchmark folklore** — Connect algorithmic work, allocation, tiering, feedback, deoptimization, and representative evidence. Route: `/learn/engine-optimization-investigation`.
- **ArrayBuffer, typed views & endianness** — Understand shared bytes, offsets, transfer, decoding boundaries, and zero-copy ownership. Route: `/learn/binary-memory`.
  - Invariant: A view's element count, byte length, offset, and ownership state are separate facts.
  - Prerequisites: values-and-equality.
- **Binary protocols, framing & ownership** — Parse bytes with explicit lengths, byte order, text decoding, aliasing, transfer, and bounds. Route: `/learn/binary-protocols-and-encoding`.
- **Async iterables, generators & cancellation ownership** — Connect incremental consumption to cleanup, producer pressure, and cancellation instead of only awaiting a loop. Route: `/learn/async-iteration-and-cancellation`.
- **Reentrancy: when synchronous code calls you back** — Protect invariants across getters, callbacks, event dispatch, and other unexpected control transfers. Route: `/learn/reentrancy-and-observers`.
- **Resource ownership, disposal & using** — Build deterministic cleanup and understand synchronous versus asynchronous disposal and error composition. Route: `/learn/resource-ownership`.
- **DOM events, delegation & shadow boundaries** — Trace capture, target, bubbling, defaults, listener lifetime, and composed event paths. Route: `/learn/dom-events-and-propagation`.
- **JavaScript security: code, keys & capabilities** — Keep data from becoming executable code or prototype authority, and bound attacker-controlled computation. Route: `/learn/language-security-boundaries`.

## Async & the runtime

Trace the stack, follow the queues, and make concurrency predictable.

- **The event loop** — Trace tasks, microtasks, the call stack, and rendering opportunities, one operation at a time. Route: `/learn/event-loop`.
- **Promises & error propagation** — Understand resolution, settlement, chaining, and the difference between parallel work and observation. Route: `/learn/promises`.
- **Promise resolution & thenable assimilation** — Separate resolving, settling, reading then, reaction jobs, and await continuation. Route: `/learn/promise-assimilation`.
  - Invariant: A resolved promise can still be pending while it follows another unsettled promise or thenable.
  - Prerequisites: promises, event-loop.
- **Promise construction, settlement & rejection ownership** — Avoid async executors, floating chains, double-settlement confusion, and unhandled-rejection surprises. Route: `/learn/promise-construction-and-rejections`.
- **Async functions & continuation** — See why await suspends one function without blocking the JavaScript thread. Route: `/learn/async-await`.
- **Cancellation, deadlines & races** — Prevent stale responses and make ownership of asynchronous work explicit. Route: `/learn/cancellation-and-races`.
- **Promise combinators, deadlines & losing work** — Choose all, allSettled, any, or race by their outcome contract, including empty inputs and cancellation. Route: `/learn/promise-combinators-and-timeouts`.
- **Debounce, throttle & latest-operation ownership** — Specify leading/trailing behavior, cancellation, flush, receiver preservation, and result ownership. Route: `/learn/debounce-throttle-and-scheduling`.
- **Concurrency limits & race conditions** — Protect shared state across awaits and keep downstream systems within capacity. Route: `/learn/concurrency-control`.
- **Concurrency limits, queues & scheduling fairness** — Bound active work and queue growth while preserving order, cancellation, and useful host progress. Route: `/learn/concurrency-limits-and-fairness`.
- **Node.js, libuv & nextTick** — Separate event-loop phases, the worker pool, promise jobs, and module-dependent ordering. Route: `/learn/node-event-loop`.
- **Workers & parallel execution** — Choose message passing, transferable memory, or shared memory for CPU-heavy work. Route: `/learn/workers-and-parallelism`.
- **Streams & backpressure** — Keep memory bounded when producers are faster than consumers. Route: `/learn/streams-and-backpressure`.
- **Async context & request isolation** — Carry correlation and request metadata across asynchronous work without mutable global state. Route: `/learn/async-context`.
  - Invariant: Concurrent requests must not inherit another request's tenant, identity, or correlation context.
  - Prerequisites: node-event-loop, multi-tenant-security.
- **Shared memory, Atomics & synchronization** — Distinguish shared bytes from a correct concurrent protocol. Route: `/learn/shared-memory-and-atomics`.
  - Invariant: A shared read-modify-write invariant needs synchronization, not merely a shared buffer.
  - Prerequisites: workers-and-parallelism, binary-memory.

## React under the hood

Rendering, identity, scheduling, and the lifecycle of a reactive interface.

- **Render, reconcile & commit** — Separate speculative calculations from committed mutations and effects. Route: `/learn/render-and-commit`.
- **State snapshots, queues & batching** — Understand functional updates, stale closures, and why three updates may increment once. Route: `/learn/state-and-batching`.
- **Effects as synchronization** — Model setup and cleanup instead of translating class lifecycle methods. Route: `/learn/effects-and-cleanup`.
- **Identity, keys & state preservation** — Explain disappearing inputs, state resets, and bugs caused by unstable list keys. Route: `/learn/identity-and-keys`.
- **Concurrency, transitions & Suspense** — Prioritize urgent input while treating interruptible rendering as a scheduling tool. Route: `/learn/concurrent-rendering`.
- **Memoization, context & profiling** — Find expensive work before adding identity-management overhead. Route: `/learn/memoization-and-context`.
- **External stores & tearing** — Integrate mutable state with concurrent rendering through a consistent snapshot contract. Route: `/learn/external-stores`.
- **Server Components & hydration** — Distinguish the RSC payload, server-rendered HTML, and client module boundaries. Route: `/learn/react-server-components`.
- **Fiber, lanes & speculative work** — Relate React's internal work model to its public scheduling guarantees. Route: `/learn/fiber-lanes-and-scheduling`.
  - Invariant: Only a selected commit becomes the visible tree; speculative render work must remain safe to restart.
  - Prerequisites: render-and-commit, concurrent-rendering.
- **Hook identity, order & custom hooks** — Understand why call order is a state-addressing contract and why use has distinct rules. Route: `/learn/hook-identity`.
  - Invariant: Ordinary hooks must preserve their supported call order for a component identity across renders.
  - Prerequisites: identity-and-keys, state-and-batching.
- **Hydration, useId & deterministic first renders** — Diagnose mismatches without hiding them behind suppression or client-only rendering. Route: `/learn/hydration-and-ids`.
  - Invariant: The initial client tree must match the server-rendered content under the hydration contract.
  - Prerequisites: react-server-components, rendering-strategies.
- **Portals, refs & error-boundary scope** — Separate the React tree, the DOM tree, imperative access, and failure containment. Route: `/learn/portals-refs-and-error-boundaries`.
  - Invariant: DOM placement does not redefine React ownership, context, or every event relationship.
  - Prerequisites: render-and-commit, accessibility.

## The Next.js architecture

Move confidently across server boundaries, streaming, routing, and caching.

- **App Router & route composition** — Understand segments, layouts, templates, parallel slots, and ownership of navigation state. Route: `/learn/app-router`.
- **SSR, static rendering & PPR** — Choose freshness and delivery boundaries instead of memorizing rendering acronyms. Route: `/learn/rendering-strategies`.
- **Cache Components & invalidation** — Trace cache keys, scope, lifetime, tags, and the consistency implications of revalidation. Route: `/learn/nextjs-caching`.
- **Server Actions & mutation boundaries** — Treat every Server Function entry point as an exposed mutation API. Route: `/learn/server-actions`.
- **Route Handlers & the BFF** — Choose a client-facing API boundary without creating unnecessary internal HTTP hops. Route: `/learn/route-handlers-and-bff`.
- **Streaming & reveal boundaries** — Design independent loading, failure, and hydration behavior for real screens. Route: `/learn/streaming-boundaries`.
- **Proxy, runtimes & deployment constraints** — Place cross-cutting request logic without confusing it with an authorization boundary. Route: `/learn/proxy-and-runtime`.
- **Errors, redirects & recovery** — Design local failure boundaries and distinguish missing resources from broken dependencies. Route: `/learn/errors-and-recovery`.
- **RSC payloads, serialization & client graphs** — Trace what crosses a server/client boundary and what becomes a browser dependency. Route: `/learn/flight-and-serialization`.
  - Invariant: A server-only capability must not enter the client module graph or serialized client-visible data.
  - Prerequisites: react-server-components, modules-and-bundlers.
- **Deployment skew & cache coherence** — Reason about old clients, new servers, ephemeral instances, and versioned cached representations. Route: `/learn/deployment-cache-coherence`.
  - Invariant: A cache key and serialized representation must remain compatible with the deployment and authorization context that consumes them.
  - Prerequisites: nextjs-caching, schema-evolution.

## Browser ↔ server

Follow a request through the layers that connect your frontend and backend.

- **The life of a request** — Follow DNS, connection establishment, TLS, HTTP, application code, and response delivery. Route: `/learn/request-journey`.
- **HTTP semantics & API contracts** — Design methods, status codes, conditional requests, and errors as a coherent protocol. Route: `/learn/http-semantics`.
- **CORS, origins & credentialed requests** — Separate browser read permission from authentication, CSRF protection, and cookie policy. Route: `/learn/cors-and-cookies`.
- **Browser & CDN cache semantics** — Control storage, freshness, validation, variants, and private representations. Route: `/learn/http-caching`.
- **Polling, SSE & WebSockets** — Choose a realtime transport around directionality, reconnection, and delivery semantics. Route: `/learn/realtime-transports`.
- **Style, layout, paint & compositing** — Connect DOM updates to pixels and identify forced synchronous layout. Route: `/learn/browser-rendering`.
- **Retries, idempotency & jitter** — Recover from transient failures without multiplying load or duplicating business operations. Route: `/learn/retries-and-idempotency`.
- **REST, GraphQL & typed RPC** — Choose a contract style around clients, evolution, caching, and operational complexity. Route: `/learn/rest-graphql-rpc`.
- **HTTP multiplexing & head-of-line blocking** — Compare application streams, transport loss, connection reuse, and priority. Route: `/learn/http-multiplexing`.
  - Invariant: Multiplexing application messages does not remove every shared transport bottleneck.
  - Prerequisites: request-journey, http-semantics.
- **Service workers & offline coherence** — Treat an offline cache as another deployment and data-consistency boundary. Route: `/learn/service-workers-and-offline`.
  - Invariant: An offline response must preserve the correct user, version, and freshness policy rather than merely return something cached.
  - Prerequisites: http-caching, schema-evolution.

## Identity & security

Build trust boundaries with sessions, authorization, and threat models.

- **Sessions & authentication** — Trace login, cookie delivery, server verification, session rotation, and revocation. Route: `/learn/sessions-and-authentication`.
- **Authorization, RBAC & resource policies** — Enforce tenant, ownership, and operation permissions at the authoritative data boundary. Route: `/learn/authorization`.
- **OAuth, OIDC & PKCE** — Distinguish delegated access from login and follow an authorization-code flow. Route: `/learn/oauth-and-oidc`.
- **XSS, output encoding & CSP** — Protect rendering contexts and reduce the impact of script injection. Route: `/learn/xss-and-csp`.
- **CSRF & request intent** — Protect ambient cookie credentials with origin checks, tokens, and deliberate HTTP methods. Route: `/learn/csrf`.
- **JWT validation & key rotation** — Treat signed claims as a constrained trust contract, not encrypted truth. Route: `/learn/jwt-and-key-rotation`.
- **SSRF, secrets & untrusted boundaries** — Keep server capabilities from becoming attacker-controlled network and data access. Route: `/learn/ssrf-and-secrets`.
- **Multi-tenant isolation & auditability** — Carry tenant context safely through queries, caches, background work, and logs. Route: `/learn/multi-tenant-security`.
- **Dependency supply chains & capability boundaries** — Audit install-time, build-time, server, browser, and sandbox privileges separately. Route: `/learn/supply-chain-and-capabilities`.
  - Invariant: A dependency should receive only the capabilities required at the phase where it runs.
  - Prerequisites: ssrf-and-secrets, xss-and-csp.

## Data & distributed systems

Reason about consistency, persistence, invalidation, and failure.

- **Cache design & stampede control** — Specify ownership, key dimensions, freshness budgets, eviction, and invalidation. Route: `/learn/cache-invalidation`.
- **Transactions & isolation levels** — Protect invariants against lost updates, write skew, and concurrent operations. Route: `/learn/transactions-and-isolation`.
- **Indexes, query plans & pagination** — Trade read speed against write amplification and validate plans with real cardinality. Route: `/learn/indexes-and-query-plans`.
- **N+1, batching & data ownership** — Detect repeated data access and batch without leaking cached results across users. Route: `/learn/n-plus-one`.
- **Optimistic UI & reconciliation** — Predict outcomes locally without confusing provisional state with committed truth. Route: `/learn/optimistic-ui`.
- **Events, outbox & delivery guarantees** — Publish committed domain facts without losing them between database and broker. Route: `/learn/events-and-outbox`.
- **Consistency, replication & lag** — Explain stale reads, read-your-writes, and choices under network partitions. Route: `/learn/consistency-models`.
- **Schema evolution & safe migrations** — Deploy database changes while old and new application versions coexist. Route: `/learn/schema-evolution`.
- **Leases, distributed locks & fencing tokens** — Protect a resource from a stale owner that resumes after its lease expires. Route: `/learn/leases-and-fencing`.
  - Invariant: The protected resource must reject stale ownership, not merely trust that a lock was once acquired.
  - Prerequisites: concurrency-control, consistency-models.
- **Sagas, compensation & ambiguous outcomes** — Coordinate multi-service workflows without pretending compensation erases history. Route: `/learn/sagas-and-compensation`.
  - Invariant: Every externally visible step needs a durable operation identity and a recovery path for unknown outcomes.
  - Prerequisites: events-and-outbox, retries-and-idempotency.

## Production engineering

Turn good code into resilient, observable, accessible software.

- **TypeScript & runtime boundaries** — Use discriminated unions, generics, and runtime schemas without confusing types with evidence. Route: `/learn/typescript-boundaries`.
- **Testing behavior & contracts** — Build a portfolio of tests around risk, boundaries, and meaningful failure signals. Route: `/learn/testing-strategy`.
- **Logs, metrics & distributed traces** — Make failures explainable across browser, BFF, service, queue, and database. Route: `/learn/observability`.
- **Performance budgets & Core Web Vitals** — Connect responsiveness, rendering, and network cost to real-user measurements. Route: `/learn/performance-budgets`.
- **Accessibility as an interface contract** — Design semantics, focus, keyboard interaction, and announcements together. Route: `/learn/accessibility`.
- **Resilience, overload & circuit breakers** — Design bounded failure rather than letting queues and retries amplify an outage. Route: `/learn/resilience-and-load`.
- **CI/CD, flags & progressive delivery** — Separate deployment from release and define measurable rollback criteria. Route: `/learn/delivery-and-flags`.
- **Debugging, incident analysis & review** — Turn symptoms into falsifiable hypotheses and architecture decisions into reviewable evidence. Route: `/learn/debugging-and-review`.
- **Variance, structural typing & sound boundaries** — Reason about assignability, function inputs, mutable containers, and erased guarantees. Route: `/learn/typescript-variance`.
  - Invariant: A consumer's accepted inputs and promised outputs must remain safe under substitution, beyond matching property names.
  - Prerequisites: typescript-boundaries, solid-liskov.
- **Property-based & model-based testing** — Test invariants across generated action sequences rather than only a few happy paths. Route: `/learn/model-based-testing`.
  - Invariant: A test oracle must express the intended contract independently enough to catch implementation errors.
  - Prerequisites: testing-strategy, state-machines.
- **Unicode, locales & time-zone correctness** — Treat text length, user-visible characters, collation, instants, and calendar dates as distinct domains. Route: `/learn/unicode-locale-and-time`.
  - Invariant: A storage or formatting shortcut must not silently change the user's intended text or calendar meaning.
  - Prerequisites: values-and-equality, hydration-and-ids.
- **Algorithmic cost, virtualization & fairness** — Reduce work before memoizing it and preserve interaction contracts when rendering less DOM. Route: `/learn/complexity-and-virtualization`.
  - Invariant: A faster view must preserve identity, focus, navigation, and the user's ability to reach the data.
  - Prerequisites: performance-budgets, browser-rendering.

## Frontend architecture

Choose boundaries, ownership, state placement, and deployment models deliberately.

- **The modular frontend monolith** — Build strong domain boundaries in one deployable application before distributing the system. Route: `/learn/modular-monolith`.
- **Feature-sliced organization** — Use vertical slices and explicit layers without turning conventions into ceremony. Route: `/learn/feature-sliced-design`.
- **Hexagonal architecture in the frontend** — Keep application policy independent of fetch, localStorage, React, and vendor SDKs. Route: `/learn/hexagonal-frontend`.
- **Microfrontends & team autonomy** — Evaluate independent deployment against runtime integration and operational cost. Route: `/learn/microfrontends`.
- **State placement & ownership** — Choose URL, local, server, form, external-store, or durable state by lifetime and authority. Route: `/learn/state-ownership`.
- **Design systems & component contracts** — Separate tokens, accessible primitives, reusable patterns, and product-specific features. Route: `/learn/design-system-architecture`.
- **BFF, domain services & anti-corruption layers** — Adapt backend contracts without allowing upstream models to dictate frontend architecture. Route: `/learn/bff-and-domain-boundaries`.
- **ADRs, evolution & the strangler pattern** — Make architecture choices reversible where possible and migrate incrementally. Route: `/learn/architecture-decisions`.
- **Architecture fitness functions & boundary tests** — Turn dependency diagrams into enforceable properties with meaningful exceptions. Route: `/learn/architecture-fitness-functions`.
  - Invariant: An architectural rule should preserve an important property and expose exceptions, rather than merely enforce a preferred folder spelling.
  - Prerequisites: modular-monolith, architecture-decisions.

## Patterns & SOLID

Refactor around variation, dependencies, and contracts with concrete production examples.

- **SOLID: Single Responsibility** — Separate reasons to change, not every ten lines into another file. Route: `/learn/solid-single-responsibility`.
- **SOLID: Open/Closed** — Create an extension point around a proven axis of variation. Route: `/learn/solid-open-closed`.
- **SOLID: Liskov Substitution** — Make interchangeable implementations preserve behavioral contracts. Route: `/learn/solid-liskov`.
- **SOLID: Interface Segregation** — Expose capabilities consumers need instead of a giant application service. Route: `/learn/solid-interface-segregation`.
- **SOLID: Dependency Inversion** — Make high-level policy own its dependencies through explicit ports. Route: `/learn/solid-dependency-inversion`.
- **Strategy: interchangeable policy** — Replace distributed branching with cohesive pure policies. Route: `/learn/strategy-pattern`.
- **Adapter & Repository boundaries** — Translate protocols without hiding important data-access semantics. Route: `/learn/adapter-and-repository`.
- **Observer, subscriptions & event buses** — Decouple notifications while keeping ownership and causal flow understandable. Route: `/learn/observer-and-events`.
- **State machines & workflow invariants** — Replace impossible boolean combinations with explicit legal transitions. Route: `/learn/state-machines`.
- **Commands, undo & CQRS** — Represent intent explicitly and separate write models from read projections when justified. Route: `/learn/command-and-cqrs`.
- **Compound & headless components** — Compose behavior and presentation through accessible, explicit contracts. Route: `/learn/compound-and-headless-components`.
- **Composition & the functional core** — Keep decisions pure and effects explicit while resisting premature abstraction. Route: `/learn/composition-and-functional-core`.
