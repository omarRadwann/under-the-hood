# Engineering audit and coverage map

## Version 1.3.1 correctness audit

This pass reproduced defects in executed programs and browser workflows before fixing them. The curriculum remains 156 lessons; the change focuses on correctness and usability.

| Area | Defect corrected | Evidence |
| --- | --- | --- |
| Native timers | Wrapping changed callback `this`; clearing an already-fired timeout recorded a cancellation that never happened. | Worker tests cover the global receiver, interval arguments, shared clear handles, and completed timers. Browser output confirms the receiver. |
| Rejected await | A caught rejection left a function displayed as suspended. In React, delayed rejection could also trip an expired execution deadline. | Catch/finally tests check the frame; a real React handler recovered after 700ms and updated the DOM. No extra promise reaction is inserted around await. |
| Promise registration | Invalid receivers and throwing species constructors left nonexistent reactions in the visualization. | Native rejection tests verify zero registered reactions. |
| Microtasks | Non-callable input was accepted, then failed asynchronously. | Invalid callbacks now throw synchronously; the edited browser program catches TypeError. |
| Value snapshots | Sparse arrays, custom/symbol properties, collections, signed zero, and error names lost distinguishing information. | Tests cover holes versus undefined, Map/Set, circularity, bounded sparse arrays, dates, symbol keys, and overridden collection iteration. Ordinary getters remain uninvoked. |
| React entry | Unsupported top-level await created an invalid sandbox document and eventually a vague timeout. | The compiler now explains where async code belongs before creating a document; nested async handlers remain supported. |
| Search and feedback | Enter on Close search navigated to a lesson. Result selection did not move actual keyboard focus. Compilation failure could retain an obsolete source-change warning. | Browser checks cover closing without navigation, arrow-key focus, native link activation, a named dialog, and clear compiler feedback. Searches trim surrounding whitespace; footer spacing is corrected. |
| Browser progress | An older tab could overwrite another tab's bookmarks, notes, or exercise records. | Updates read current storage before writing; tabs observe storage changes. Two-tab browser tests preserve bookmarks after a completion edit/reload and retain both exercises' results. Failed storage keeps session edits available. |
| Reference evidence | Reference disclosure during an in-flight run could be missed by its captured callback. | Completion reads the current disclosure ref. |
| Deployment coherence | Stable runtime URLs allowed an older cached visualizer to accompany newer application code. | Worker and React URLs include the package release version; actual browser requests use `?v=1.3.1` while retaining the opaque sandbox/CSP. |
| Packet bounds | Oversized valid logs or keys could exceed parent validation and disappear; logical arithmetic could overflow into invalid snapshots. | Labels and displayed keys/names are explicitly truncated while real key identity is preserved. Clock/expiry overflow throws before mutation. Regression tests validate every emitted packet. |

Validation: **58 automated tests**, strict production TypeScript/build, **7,319 resolved local link/asset targets**, **167 successful public route/asset checks** in the static preview, and the expected unknown-lesson **404**. Dependency audit reports no known production vulnerabilities. Browser QA also covers training syntax failures, Stop/reset/recovery, React batching, cache expiry, and 390px/768px responsive layouts. All completed checks pass.

Scope: localStorage is last-write-wins, not a transaction for simultaneous writers or a cross-device account. Runtime traces show observable instrumented boundaries, not private browser queues or React Fiber. These checks provide reproducible evidence, not a proof that every possible program or browser behavior is bug-free. Earlier coverage and reference-reachability evidence follows.

## Version 1.3 findings and corrections

The current registry contains 156 lessons. This audit found real teaching weaknesses: 123 of the original 148 quizzes placed the answer first, 19 chapters used only a broad landing-page reference, several senior mechanisms were brief, and practice did not include an executable repair-and-feedback loop.

- Quiz choices now have stable per-lesson variation with answer identity preserved. Current positions are 64/41/51 across the three choices.
- Topic-specific primary references supplement those 19 chapters. All 184 unique source/crosswalk URLs resolve at review time; the obsolete OWASP Java-specific JWT link was replaced by its current general JWT cheat sheet.
- Eight platform/framework/type-system deep dives fill the concrete gaps listed in README.md. They explicitly name browser or contextual execution requirements. Twenty-four older chapters add two mechanism/review stages each, including every SOLID/design-pattern chapter.
- The training studio has twelve edited-code exercises and 46 checks. Calibration establishes that every reference passes and every broken starter fails a real behavioral check. Drafts and predictions persist locally; reference use is labeled. Ten competency domains link every lesson to evidence and failure investigations.
- The Next 16.4 Cache Components example now declares partialPrefetching explicitly, matching the installed guide. The typecheck command generates route types before compiling, so it works without a previous full build.

The curriculum is a maintained, explicit coverage map. It does not establish that every browser API, engine heuristic, experimental proposal, or organization-specific production concern has its own tutorial. A passing exercise establishes its stated checks; geometry, authorization, distributed consistency, and real React integration need their named system-level evidence.

Reviewed against the source project and current primary documentation on October 31, 2026. This is a bounded review with explicit evidence, not a guarantee that a finite curriculum contains all engineering knowledge.

## Findings before this revision

| Area               | Finding                                                                                                                                       | Action                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Runtime labs       | The event-loop, React, and cache views were fixed teaching models. Editing a lesson's code could not change execution.                        | Add executable, isolated playgrounds; retain the models as distinct conceptual explanations.                 |
| JavaScript depth   | Missing separate treatments of object descriptors and proxy invariants, iterators, binary memory, weak references, and optimization feedback. | Add advanced lessons with invariants, examples, and primary references.                                      |
| Async depth        | Missing promise assimilation, async context, fairness budgets, and shared-memory synchronization.                                             | Add explicit host/language boundaries and advanced investigations.                                           |
| React depth        | Missing focused hook identity, Fiber scheduling, hydration/IDs, and error/portal/ref behavior.                                                | Add deeper lessons; observe actual React rendering in the playground.                                        |
| Framework depth    | Version-specific caching is covered, but deployment coherence and server-function transport security need separate treatment.                 | Add lessons that distinguish deployment, request, identity, and representation boundaries.                   |
| Production depth   | Add transport multiplexing, service workers, fencing tokens, TypeScript variance, model-based testing, and Unicode/time-zone reasoning.       | Add focused senior lessons rather than labeling foundations as exhaustive.                                   |
| UI readability     | Many essential labels use 7–10px type; selected states are mostly visual.                                                                     | Increase reading/control sizes, strengthen contrast, expose selection states, and verify responsive layouts. |
| Content accounting | Some lesson counts are hardcoded and could drift.                                                                                             | Derive visible counts from the registry; validate routes and references.                                     |
| Evidence           | Existing tests validate models and content shape, not arbitrary runnable examples.                                                            | Test compiler instrumentation and sandbox execution separately; record browser execution evidence.           |

## What execution can establish

- Worker playgrounds execute edited JavaScript in a fresh worker. Instrumented calls, callbacks, timers, explicit microtasks, and promise reactions produce recorded events.
- Registered promise reactions are not presented as a fully observable engine microtask queue. Native await continuations and internal engine jobs are not exposed by browser APIs.
- Replay scrubs captured snapshots. It does not pause the engine between statements or imply a debugger breakpoint.
- React uses a locally bundled React runtime in a sandboxed document. Render entries, Profiler commits, effects, and DOM mutations are observations with different meanings.
- Caching runs the editable algorithm against an instrumented in-memory store, origin, and logical clock. This is real code operating on a defined cache implementation; it does not expose Next.js's private caches or a CDN.
- Instrumentation adds overhead. Timings are diagnostic observations, not benchmark results.

## Completed coverage map

The registry now contains **156 lessons in 10 tracks**, including **32 explicit boundaries** with explicit invariants and acyclic prerequisite links. CURRICULUM.md lists every route and prerequisite.

| Layer            | Core coverage                                                                                                                    | Added depth                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JavaScript (49)  | Engine pipeline, execution/scope, closure retention, TDZ, receivers/prototypes, copying/coercion, modules, collection            | Descriptor/Proxy invariants, iterator cleanup, binary ownership, weak lifetimes, shapes/inline caches; numeric-domain and prototype-pollution guidance |
| Async (15)       | Browser/Node loops, promises, await, cancellation, pools, workers, pressure, races                                               | Thenable assimilation, async context, shared memory/Atomics; scheduling fairness and bounded work                                                      |
| React (13)       | Render versus commit, state queues, effects, keys, transitions, memo/context, stores, RSC                                        | Fiber/lanes, hook identity, hydration/useId, portals/refs/error scope; current Effect Event constraints                                                |
| Next.js (11)     | App Router, rendering modes, Cache Components, actions, BFFs, streaming, Proxy, recovery                                         | RSC transport/data exposure and deployment/cache compatibility                                                                                         |
| Network (14)     | Request layers, HTTP semantics, CORS/cookies, caching, realtime, rendering, retries, API contracts                               | HTTP/2 versus HTTP/3 loss dependencies, service-worker/offline version coherence                                                                       |
| Security (9)     | Authentication, resource authorization, OIDC/PKCE, XSS/CSP, CSRF, JWT rotation, SSRF/secrets, tenants                            | Supply-chain execution phases and sandbox capabilities                                                                                                 |
| Data (10)        | Cache races, transactions/isolation, indexes, N+1, optimistic recovery, outbox, consistency, migrations                          | Leases/fencing and saga compensation/ambiguous outcomes                                                                                                |
| Production (14)  | Runtime validation, testing, telemetry, performance, accessibility, overload, delivery, debugging                                | Variance, model-based testing, Unicode/time-zone domains, complexity/virtualization                                                                    |
| Architecture (9) | Modular monoliths, feature slices, hexagonal direction, microfrontends, state, design systems, BFFs, ADRs                        | Enforceable fitness functions and reviewable exceptions                                                                                                |
| Patterns (12)    | All five SOLID principles, Strategy, Adapter/Repository, Observer, machines, Command/CQRS, compound/headless UI, functional core | Existing concrete refactors, behavioral contracts, selection criteria, and failure cases retained                                                      |

## Corrections and verification evidence

- Retained the original 13 runtime/React/cache experiments and added 37 language experiments, for 50 total. Actual edited source determines observations; semantic edits verify scheduling, React state, and TTL policy.
- Kept the nine deterministic models separate from the execution workbench. Lesson links identify runnable variants, not a claim that every contextual reference snippet is standalone.
- Host callbacks and React lifecycle observations omit source-line attribution when there is no trustworthy source location, rather than highlighting the last unrelated statement.
- Corrected the memory model so a reclaimed object cannot be reconnected; allocating a new object resets it.
- Replaced a module-global search-generation example with a per-owner factory.
- Removed cancellable draft-save delays so rapid example switches cannot discard the last edit or reset. Preserved intentionally empty drafts and prevented running a not-yet-loaded example.
- Corrected console snapshots so shared aliases are not falsely marked as circular, and ordinary getters/toJSON are not invoked merely for display. Proxy traps remain observable.
- Placed the optional React Strict Mode boundary at the root, outside Profiler, and verified setup → cleanup → setup development probing. Render entries and commits remain separate counters.
- Replaced unreadable default editor token colors with a dark-theme palette; increased reading/control sizes, exposed filter selections, retained keyboard escape routes, and checked desktop/mobile layout.
- Verified 36 automated tests, strict TypeScript, production compilation, 158 public prerendered routes/assets, unknown-lesson 404, and all 150 unique reference/crosswalk URLs returning HTTP 200. The reference status snapshot is REFERENCE-CHECK.json; these are point-in-time reachability checks, not a claim that external pages cannot change.
- Verified worker network blocking and opaque iframe denial of parent DOM, origin storage, and network access. This bounded capability check does not prove resistance to every hostile program.

## Coverage boundaries

The curriculum covers the language/runtime, rendering, framework, browser/network, identity/security, data/consistency, architecture, patterns, and production reasoning. It cannot replace the full ECMAScript and HTML specifications, React/Next source, database documentation, a deployment's behavior, or experience investigating real systems. Dedicated topics remain extendable; the coverage map records the concrete scope instead of promising universal completeness.

## JavaScript-first revision

The follow-up audit found a real curricular gap: the original internals material did not give a beginner an explicit entry point or provide separate in-depth chapters for several core language families. The JavaScript track is now 49 lessons and async/runtime is 15, forming a 64-chapter path in six stages. Forty chapters were added, bringing the full registry to 148.

- Every new chapter has four or more mechanism stages, a concrete example, pitfalls, an investigation, a quiz, and a worked edge-case challenge. Additional technical notes cover arguments aliasing/arity, the operator inventory, malformed text, grouping, symbol hooks, disposal stacks, import attributes, and bit-pattern domains.
- The map explicitly covers syntax/types/control flow; conversion and numeric domains; text/regex/Intl/JSON; arrays and keyed collections; function invocation and construction; descriptors/prototypes/private brands; modules/realms; iteration/disposal; memory/optimization/binary ownership; promise resolution, rejection chains, cancellation, scheduling, workers, pressure, and shared-memory protocols.
- All 64 JavaScript/async lessons occur exactly once in the six-stage path. New prerequisite references resolve, and the existing graph remains acyclic. Chapter next/previous links follow that sequence; progress retains stable slugs.
- The page exposes 19 coverage families and eight built-in/platform reference groups, plus a project and mastery outcome for each stage. JAVASCRIPT-COVERAGE.md exports the exact scope.
- Thirty-six new chapter programs run directly in the worker, plus a new lazy-iterator-helper cleanup investigation. With the original 13 experiments, the project has 50 runnable starters. DOM and separate-module examples identify their required environments.
- Generator code executes natively; suspended generator frames are excluded from the instrumented call-lifetime panel rather than displayed as running calls.
- The library deep-dive filter now uses actual lesson levels and derives its count. It includes the new deep JavaScript chapters instead of filtering only the original invariant callouts.
- Automated validation includes every new worker example, class initialization order, lazy iterator closure, async-generator cleanup, all starter compilation, path completeness, environment/runnable-link integrity, and the retained runtime/model checks.

This maps the major language families and essential host integration. It does not imply every standard-library method, optional host API, engine extension, or experimental proposal has a separate exhaustive tutorial. Precise method contracts and version availability link to primary references.
