export type InterviewGroup =
  "JavaScript" | "React" | "Platform & Next.js" | "System design" | "Ownership";
export interface InterviewQuestion {
  id: string;
  group: InterviewGroup;
  title: string;
  prompt: string;
  guide: string[];
  followUps: string[];
  traps: string[];
  lessons: string[];
  exercise?: string;
}
const question = (
  id: string,
  group: InterviewGroup,
  title: string,
  prompt: string,
  guide: string[],
  followUps: string[],
  traps: string[],
  lessons: string[],
  exercise?: string,
): InterviewQuestion => ({ id, group, title, prompt, guide, followUps, traps, lessons, exercise });

const groupOrder: InterviewGroup[] = [
  "JavaScript",
  "React",
  "Platform & Next.js",
  "System design",
  "Ownership",
];
export const interviewQuestions: InterviewQuestion[] = [
  question(
    "ts-state",
    "Platform & Next.js",
    "Model an async workflow with honest types",
    "A form has independent loading, success, error, and data flags. Replace contradictory combinations with a TypeScript model, then explain what happens when JSON crosses the boundary.",
    [
      "Use a discriminated union so each state owns its valid data: idle, pending with operation identity, success with canonical data, or failure with an explicit error outcome.",
      "Preserve useful generic correlations, such as an event name and its payload. Do not widen everything to unrelated unions or silence missing guarantees with as.",
      "Treat incoming data as unknown and parse it at runtime. satisfies checks compatibility and as const narrows selected types; neither validates a response nor freezes its runtime object graph.",
      "Check exhaustive branches under the real compiler options and include expected negative type cases. A never assertion does not reject an unexpected production payload; runtime validation and authoritative permissions remain separate.",
    ],
    [
      "How do method and function-property variance differ under strictFunctionTypes?",
      "Where should a branded ID be constructed, and can an assertion forge the brand?",
    ],
    [
      "A DTO assertion validates JSON",
      "Readonly deeply freezes data",
      "Four booleans describe only legal states",
    ],
    ["typescript-boundaries", "typescript-type-algebra", "typescript-variance"],
  ),
  question(
    "js-order",
    "JavaScript",
    "Explain an execution order, not a memorized rule",
    "A script logs A, schedules a zero-delay timer logging B, registers a fulfilled-promise reaction logging C and queuing a microtask D, then logs E. Predict the output and explain every dependency.",
    [
      "For this snippet the order is A, E, C, D, B. Synchronous evaluation completes before the registered reaction runs.",
      "The reaction queues D during a microtask checkpoint; that checkpoint drains newly queued microtasks before the timer task can run.",
      "A timer delay is an eligibility threshold, not a punctual deadline. Promise registration is not proof that a reaction is already runnable.",
      "Distinguish this script from native event dispatch: host callback cleanup can introduce other checkpoints. Use the real event lab to explain that boundary.",
    ],
    [
      "How does an await continuation differ from a new timer task?",
      "Why can a recursive microtask chain hurt responsiveness?",
    ],
    [
      "One universal FIFO queue",
      "Zero milliseconds means immediate",
      "Treating the visualization as the private engine queue",
    ],
    ["event-loop", "callback-boundaries-and-microtasks", "promise-assimilation"],
  ),
  question(
    "js-values",
    "JavaScript",
    "Choose equality and ownership deliberately",
    "You must group API records by arbitrary keys, including objects and '__proto__'. Explain the collection choice, copying policy, and key equality.",
    [
      "Map preserves object identity and uses SameValueZero; object property keys have a different coercion/ownership contract.",
      "Specify whether result arrays are newly owned and whether item references remain shared. Shallow copying does not clone nested graphs.",
      "Distinguish Object.is signed-zero behavior from Map key equality, and explain why NaN can be a useful Map key.",
      "Validate transport data before trusting its shape; selecting a safe collection does not grant authorization.",
    ],
    [
      "When would a null-prototype object be appropriate?",
      "When is a WeakMap useful, and why is it not an enumerable cache?",
    ],
    ["Object keys preserve arbitrary identity", "Spread is a deep clone"],
    ["keyed-collections", "objects-and-enumeration", "json-and-serialization"],
    "collection-identity",
  ),
  question(
    "js-invariant",
    "JavaScript",
    "Defend a sliding window",
    "Find the longest substring with no repeated character. Clarify what 'character' means, propose a simple approach, then explain the invariant behind an efficient solution.",
    [
      "Clarify code units, code points, or grapheme clusters before indexing. The executable drill explicitly chooses code points.",
      "Maintain a window with no duplicate point and a left boundary that never retreats. A previous occurrence outside the window is irrelevant.",
      "Trace 'abba' to expose a backwards-boundary bug. Include empty input and supplementary Unicode points.",
      "Explain expected linear time with ordinary Map operations and the extra storage bound; passing example tests alone does not prove complexity.",
    ],
    [
      "How would the API return original UTF-16 offsets?",
      "What changes if the requirement is user-perceived grapheme clusters?",
    ],
    ["Mixing for-of point counts with string indexes", "Moving left backwards"],
    ["strings-and-unicode", "complexity-and-virtualization"],
    "interview-unique-window",
  ),
  question(
    "js-closure",
    "JavaScript",
    "Reason about captured bindings and receivers",
    "A debounced object method reads stale configuration and loses its receiver. Explain which values are captured, when they are read, and how you would specify cancellation and invocation.",
    [
      "Closures retain access to lexical bindings; they do not universally freeze current values. A render snapshot and a mutable binding are different situations.",
      "A normal function's this depends on invocation; an arrow inherits it lexically. Passing a bare method can discard its intended receiver.",
      "Specify trailing/leading policy, argument and receiver ownership, cancellation, flush, and what happens to waiting callers.",
      "Own the timer and release it at the lifecycle boundary. Separately guard asynchronous result commits after cancellation.",
    ],
    [
      "Should an aborted operation reject callers or silently disappear?",
      "Can a cleanup closure itself retain the large object you intended to release?",
    ],
    ["An arrow always fixes this", "Abort proves the remote operation did not commit"],
    ["scope-and-closures", "function-call-semantics", "debounce-throttle-and-scheduling"],
  ),
  question(
    "js-promise",
    "JavaScript",
    "Separate resolution from settlement",
    "A promise executor resolves with a pending promise, then calls reject. Which outcome wins, and why can the outer promise still be pending?",
    [
      "The first resolving-function call locks its resolution attempt. Adopting another pending promise can delay settlement.",
      "A later reject or executor throw cannot replace that already-selected resolution attempt.",
      "Thenable property access, invocation, assimilation jobs, and reactions have different observable ordering; do not collapse them into one step.",
      "Promise.all rejection does not cancel sibling operations. Cancellation and rejection ownership require separate protocols.",
    ],
    ["What if a then getter throws?", "How do you avoid unhandled rejections in losing work?"],
    ["Resolved always means fulfilled", "Promise.all automatically cancels fetches"],
    [
      "promise-construction-and-rejections",
      "promise-assimilation",
      "promise-combinators-and-timeouts",
    ],
  ),
  question(
    "js-search",
    "JavaScript",
    "Prove a binary-search boundary",
    "Implement the first index whose value is at least a target. Include duplicates, no exact match, and empty input; explain why it terminates.",
    [
      "Use a half-open [lo,hi) candidate interval with hi initially length. Equality keeps the earlier candidate half.",
      "Indexes before lo are too small; indexes at/after hi meet the boundary when they exist. Each iteration shrinks the interval.",
      "Trace before-first, between-values, after-last, and repeated-equality cases. Returning -1 for a missing exact match violates this API.",
      "The comparison count is logarithmic and auxiliary storage constant. Avoid assuming a bitwise midpoint supports every JavaScript index range.",
    ],
    [
      "How would you find the first value strictly greater than target?",
      "What invariant changes in a rotated array?",
    ],
    ["An exact-match search is the same operation", "No explanation of boundary updates"],
    ["control-flow-and-loops", "complexity-and-virtualization"],
    "interview-lower-bound",
  ),
  question(
    "react-snapshot",
    "React",
    "Explain state updates under pressure",
    "From count=0, a click calls setCount(count+1) three times. Another implementation calls setCount(c=>c+1) three times. Explain the results and what the handler can read immediately.",
    [
      "For these examples the replacement calls request 1 three times; functional updaters compose to 3.",
      "The running handler keeps the snapshot from its render. Scheduling an update does not mutate its count binding.",
      "Render computes a candidate; reconciliation is render work, and commit makes the selected host changes. A render need not produce a DOM mutation.",
      "Do not infer a fixed production render count from development Strict Mode or a simplified model. Keep rendering pure.",
    ],
    [
      "What happens when an older timer callback reads count?",
      "When would a ref represent the right kind of mutable ownership?",
    ],
    [
      "setState mutates the variable immediately",
      "Every render commits",
      "Strict Mode doubles every production update",
    ],
    ["state-and-batching", "render-and-commit", "fiber-lanes-and-scheduling"],
  ),
  question(
    "react-race",
    "React",
    "Stop an obsolete search result from committing",
    "A user changes query A→B. B completes first; A returns later. Design the effect and result owner so the UI cannot show A as B's data.",
    [
      "Assign ownership per component/request generation and check it at the actual commit boundary, after asynchronous body parsing.",
      "Use cooperative abort to release work, plus a logical ownership guard. Aborting is not a proof that every continuation or remote side effect stopped.",
      "Tag rendered data by the current query/entity so a changed input cannot temporarily display another owner's record.",
      "Test with controlled response gates completing in reverse order, including unmount and failure. Do not fix the race with a sleep.",
    ],
    [
      "Why can returning a guarded result then committing in a caller's .then create another race?",
      "What happens across account switching?",
    ],
    [
      "A guard before await is enough",
      "Only check HTTP response arrival",
      "Use a global generation for unrelated components",
    ],
    ["effects-and-cleanup", "cancellation-and-races", "state-ownership"],
    "latest-owner",
  ),
  question(
    "react-identity",
    "React",
    "Preserve the correct row's draft",
    "An editable list is sorted while one row contains an unsaved draft. Explain a keying policy, virtualization risks, and what should reset when entity identity changes.",
    [
      "React state identity depends on position/type/key relationships. A stable domain ID can keep a draft with its entity through reordering.",
      "An index key can associate a reused instance with different data. Random keys cause remounts and lost state.",
      "Define draft ownership separately from authoritative server records. Decide whether a departed entity's draft persists or is discarded.",
      "Virtualization additionally needs measurement identity, focus recovery, and accessible navigation. Rendering fewer rows is not the whole contract.",
    ],
    [
      "What if the same entity appears twice in one sibling list?",
      "What should happen to focus when the active row disappears?",
    ],
    [
      "Keys are globally unique identities",
      "Putting a key inside the child changes its parent's identity decision",
    ],
    ["identity-and-keys", "hook-identity", "complexity-and-virtualization"],
  ),
  question(
    "react-store",
    "React",
    "Specify an external store snapshot",
    "Build a small external store consumed through useSyncExternalStore. What must getSnapshot, subscribe, and notification ordering promise?",
    [
      "Return a stable cached snapshot until the underlying value actually changes; allocating a new object on every read violates that identity expectation.",
      "Publish the new state before notifying subscribers. Supply symmetric unsubscribe and define reentrant notification behavior.",
      "Use the React integration intended for external subscriptions and account for server/initial-client snapshot consistency when rendering on a server.",
      "Test no-op writes, repeated reads, unsubscribe, and observable notification order. A fake store must preserve the production contract.",
    ],
    [
      "How do you avoid notifying removed listeners during snapshot traversal?",
      "What differs between this store and a server-state query cache?",
    ],
    ["Read returns a fresh object every time", "Notify first and update later"],
    ["external-stores", "state-ownership"],
    "snapshot-protocol",
  ),
  question(
    "react-speed",
    "React",
    "Diagnose a slow interaction before memoizing",
    "Typing into a large filtered table feels slow. Explain the evidence you collect and how you choose between indexing, deferred UI, memoization, virtualization, and a worker.",
    [
      "Measure input delay, handler work, rendering/layout, and presentation under representative data and devices. Separate React evidence from browser work.",
      "Fix avoidable algorithmic cost before relying on memoization. A changed dependency still reruns a cached calculation.",
      "Transitions/deferred values change scheduling and UI priority; they do not move arbitrary synchronous JavaScript onto a worker.",
      "Virtualization bounds DOM work but adds focus/geometry responsibilities. Workers add serialization, startup, cancellation, and result-ownership cost.",
    ],
    [
      "How do you prove the change improved the affected cohort?",
      "Why can useMemo be correct yet provide no benefit?",
    ],
    ["A transition makes a blocking loop preemptible", "One fast laptop run proves responsiveness"],
    [
      "performance-budgets",
      "memoization-and-context",
      "concurrent-rendering",
      "workers-and-parallelism",
    ],
  ),
  question(
    "next-boundary",
    "Platform & Next.js",
    "Draw the server/client boundary",
    "Design a searchable authenticated page in Next.js. What stays server-side, what becomes a Client Component, and what must match during initial rendering?",
    [
      "Keep authoritative data access, credentials, and authorization at server boundaries. Use client state/events where interaction needs them.",
      "A use-client boundary defines a client module graph; it is not a general claim that no server HTML will be produced for that UI.",
      "Pass supported serializable values across the boundary and map minimal DTOs; TypeScript alone does not validate or redact a payload.",
      "Use explicit locale/time-zone and stable initial inputs to avoid hydration mismatches. Verify the installed Next version's caching defaults and deployment capabilities.",
    ],
    [
      "Can a static GitHub Pages export execute Server Actions?",
      "Where would a small pending control live relative to a server-rendered list?",
    ],
    [
      "use client means document is always safe during render",
      "The browser can hold a server secret",
    ],
    ["react-server-components", "flight-and-serialization", "hydration-and-ids"],
  ),
  question(
    "api-trust",
    "Platform & Next.js",
    "Follow a tRPC call across trust boundaries",
    "A typed client submits {tenantId,projectId,name} to rename a project. Explain what tRPC's type sharing buys you and what the server must still enforce.",
    [
      "Shared inference improves coordinated client development; an untrusted HTTP caller still requires runtime input validation.",
      "Resolve actor and tenant authority from a verified session/context, not a trusted-looking body field. Scope the resource query and returned fields.",
      "Enforce mutable authorization and the write using the domain's coherent conditional/transaction/locking policy; an earlier boolean check may become stale.",
      "Return expected domain outcomes deliberately, keep secrets out of errors, and test direct requests that bypass UI restrictions.",
    ],
    [
      "How do old tabs coexist with a newly deployed procedure?",
      "What does an ORM type prove about SQL isolation?",
    ],
    ["End-to-end types replace runtime schemas", "A hidden button enforces permission"],
    ["rest-graphql-rpc", "authorization", "multi-tenant-security", "server-actions"],
  ),
  question(
    "web-auth",
    "Platform & Next.js",
    "Distinguish session transport from authorization",
    "An app uses a cookie session and a cross-origin API. Explain credential transport, CSRF, CORS, session expiry, and tenant authorization as separate decisions.",
    [
      "A verified session identifies a principal; resource-specific authorization decides whether this operation is allowed now.",
      "Cookie flags and SameSite choices affect transport and exposure; HttpOnly limits script reads, not all abuse by same-origin script.",
      "CORS controls selected cross-origin response access and some preflight requirements; it is not general authentication or universal CSRF protection.",
      "Plan expiry, revocation, account switching, and personalized-cache cleanup. Test the real browser/origin/cookie behavior rather than only a mocked fetch.",
    ],
    [
      "How does an expired session change a pending form?",
      "What must logout invalidate besides visible user state?",
    ],
    ["A signed token guarantees fresh permissions", "CORS means the request cannot be sent"],
    ["sessions-and-authentication", "csrf", "cors-and-cookies", "authorization"],
  ),
  question(
    "web-forms",
    "Platform & Next.js",
    "Build a form that survives failure",
    "A care-team member submits an edit with keyboard or pointer input. Define validation, pending state, repeated submission, error announcements, and focus recovery.",
    [
      "Use form submission semantics and named controls. Capture submitter intent, handle repeated values deliberately, and validate at the server boundary.",
      "Preserve recoverable input on failure and distinguish field errors, authorization denial, conflicts, and uncertain remote outcomes.",
      "Associate labels/errors with controls, use an error summary where useful, and move/restore focus deliberately. Test keyboard, IME, zoom, and assistive behavior.",
      "A disabled button can reduce accidental clicks but cannot enforce operation uniqueness at the server. Respect the domain's idempotency/reconciliation policy.",
    ],
    [
      "How do requestSubmit and submit differ?",
      "What happens when a focused row or modal trigger is removed?",
    ],
    ["Handle only the submit button click", "Client validation is the security boundary"],
    ["forms-focus-and-recovery", "accessibility", "retries-and-idempotency"],
  ),
  question(
    "web-layout",
    "Platform & Next.js",
    "Debug an overlay and a long-data layout",
    "A dropdown is clipped inside a scrolling table, despite a huge z-index. A long identifier also breaks the mobile layout. Explain your investigation.",
    [
      "Identify stacking context, containing block, clipping, and scroll constraints separately. z-index is scoped; a larger child value does not escape an ancestor context.",
      "Consider the top layer or an appropriate portal with a complete focus/dismissal contract. Portaling changes DOM ancestry and may change CSS inheritance.",
      "Inspect intrinsic sizing: a shrinkable flex item may need min-inline-size:0 and a grid track may need minmax(0,1fr), where the layout contract calls for it.",
      "Test long strings, zoom, RTL, dynamic content, keyboard focus, and reduced motion. Overflow hidden can conceal necessary content rather than repair its layout.",
    ],
    [
      "How can a transform affect fixed-position descendants?",
      "Why is a portal alone not a complete modal?",
    ],
    ["z-index is a global order", "Clipping is always a stacking problem"],
    ["css-layout-and-containment", "portals-refs-and-error-boundaries", "browser-rendering"],
  ),
  question(
    "system-cache",
    "System design",
    "Design a tenant-safe cache",
    "A dashboard caches project summaries across users and deploys. Specify keys, authority, freshness, invalidation, and what happens when an old refill finishes after a write.",
    [
      "Name each cache owner and representation: browser query cache, HTTP/CDN, server cache, and database replica have different lifetimes.",
      "Encode all representation dimensions without delimiter collisions, and enforce authorization independently. A tenant-only key is insufficient if fields vary by actor or role.",
      "Define a staleness budget and write/read expectations. A TTL cannot prevent an older in-flight load from publishing after invalidation.",
      "Choose version-aware publication, a freshness-aware read path, or explicitly tolerated staleness. Test the old-load/new-write schedule and account switching.",
    ],
    [
      "Where does process-local single-flight stop helping?",
      "Why should a changed refill TTL not rewrite an existing entry's deadline?",
    ],
    ["One global cache key", "A fresh TTL proves current data", "Delete always repairs every race"],
    ["cache-invalidation", "nextjs-caching", "request-isolation-and-cache-authority"],
    "stale-refill-fence",
  ),
  question(
    "system-booking",
    "System design",
    "Handle an ambiguous booking response",
    "Two users try to reserve one appointment slot. One request times out after the server may have committed. Design the frontend and authoritative command protocol.",
    [
      "Clarify product invariants and the slot/time representation. UI disabled states do not protect a cross-user reservation invariant.",
      "Use authoritative constraints/conditional writes or suitable isolation. Verify the affected row/commit outcome; retry transaction conflicts as a whole safe unit.",
      "Identify one logical operation across retries and reconcile an unknown outcome before creating duplicate intent. Idempotency must be enforced by the authority.",
      "Show pending, confirmed, conflicted, and recoverable-unknown states honestly. Notifications need post-commit delivery intent and duplicate handling where required.",
    ],
    [
      "Can optimistic UI claim a reservation is confirmed?",
      "How would a worker crash between database commit and event publication?",
    ],
    ["A timeout proves nothing was written", "A frontend UUID alone implements idempotency"],
    ["transactions-and-isolation", "retries-and-idempotency", "events-and-outbox"],
  ),
  question(
    "system-architecture",
    "System design",
    "Choose boundaries before tools",
    "Design a multi-tenant dashboard owned by a small product team. Choose feature boundaries, state ownership, API adapters, and release strategy; explain when you would change the design.",
    [
      "Clarify users, data sensitivity, main workflows, latency, access policy, scale, and deployment constraints before naming libraries.",
      "Place UI drafts, URL navigation, remote representations, and authoritative permissions with their actual owners and lifetimes.",
      "Use public feature contracts and semantic ports where they protect policy. Compose peer workflows at an intentional higher owner.",
      "Compare a modular deployable with independently deployed slices using real team/release requirements. State costs, failure modes, evidence, and a revisit trigger.",
    ],
    [
      "Which SOLID principle protects the API adapter seam, and what are its limits?",
      "When would a shared entity model become harmful?",
    ],
    [
      "Microfrontends by default",
      "Interfaces for every function",
      "Global state because it is easy to access",
    ],
    ["modular-monolith", "hexagonal-frontend", "state-ownership", "architecture-decisions"],
  ),
  question(
    "system-data",
    "System design",
    "Keep a large list stable and affordable",
    "A project list loads owners, supports pagination, and updates while a user browses. Explain query cost, stable ordering, cache scope, and visible reconciliation.",
    [
      "Measure dependency calls as list size grows; choose joins, bounded preloads, or authorization-scoped batching rather than hiding N+1 behind an adapter.",
      "Use a stable order with a unique tie-breaker and define null/snapshot behavior for cursor pagination. Keyset and offset have different tradeoffs.",
      "Model pending operations separately from confirmed state; rolling back an old full snapshot can erase newer successful edits.",
      "Profile network, parsing, indexing, render, layout, and focus behavior. Virtualize only with an identity and geometry contract.",
    ],
    [
      "What can a lagging replica do after a successful write?",
      "When does fewer SQL queries still produce a worse workload?",
    ],
    [
      "Timestamp alone is always a stable cursor",
      "One global request loader",
      "Full-snapshot rollback during overlapping edits",
    ],
    ["n-plus-one", "indexes-and-query-plans", "optimistic-ui", "consistency-models"],
  ),
  question(
    "own-incident",
    "Ownership",
    "Tell a technical incident story with evidence",
    "Describe an incident you owned. Use an anonymized example and explain the symptom, diagnosis, contribution, rollout, result, and what remains uncertain.",
    [
      "Set context and stakes briefly, identify your personal responsibility, and distinguish your actions from the team's work.",
      "Explain one falsifiable hypothesis and the evidence that changed your mind. Preserve causal detail rather than listing tools.",
      "Describe mitigation, a safe corrective change, regression evidence, rollout/rollback, and monitoring.",
      "Quantify outcomes only when you have real evidence. Explain a tradeoff, a learning, and a concrete prevention owner; do not invent metrics.",
    ],
    [
      "What would you do differently?",
      "What did you deliberately choose not to fix in the incident?",
    ],
    [
      "Blaming a person instead of explaining the mechanism",
      "Claiming team outcomes without your contribution",
    ],
    ["debugging-and-review", "observability", "delivery-and-flags"],
  ),
  question(
    "own-ai",
    "Ownership",
    "Own AI-assisted code quality",
    "How would you use an AI coding tool on a product feature while remaining accountable for correctness, privacy, and maintainability?",
    [
      "Define the user problem, constraints, invariants, accepted inputs, and a reviewable plan before relying on a generated implementation.",
      "Inspect generated dependency choices, data flow, authorization, cleanup, and failure paths. Use an independent contract or test oracle so tests do not repeat the same mistake.",
      "Verify the real boundaries through types, runtime validation, integration/browser evidence, and staged rollout. Keep sensitive production data out of ad hoc prompts and demos.",
      "Record decisions and communicate remaining uncertainty. Ask what tools are permitted in the actual interview; the employer's AI workflow does not establish interview rules.",
    ],
    [
      "Give a specific example where you rejected a generated approach.",
      "How do you detect a polished-looking implementation with a wrong invariant?",
    ],
    ["AI wrote it, so it is reviewed", "A passing mocked test proves the database guarantee"],
    ["model-based-testing", "typescript-boundaries", "supply-chain-and-capabilities"],
  ),
  question(
    "own-product",
    "Ownership",
    "Deliver through ambiguity",
    "A founder asks for a feature with an unclear workflow and a short deadline. Explain how you reduce uncertainty, scope a vertical slice, and ship without hiding important failure modes.",
    [
      "Clarify the user and desired outcome, identify high-risk assumptions, and agree on observable success and boundaries.",
      "Build a small vertical slice from interaction to authoritative write. Use realistic invented fixtures and validate the workflow with representative users.",
      "Keep expected errors, accessibility, telemetry, and rollback in scope. Use progressive exposure when its control path remains dependable.",
      "Communicate scope, uncertainty, tradeoffs, and the next decision. Record a revisit trigger instead of promising a permanently optimal design.",
    ],
    [
      "Which shortcuts are reversible and which create a security or data invariant debt?",
      "How do you know the prototype is ready for broader use?",
    ],
    ["Equating speed with skipping validation", "A feature flag is an authorization control"],
    ["architecture-decisions", "delivery-and-flags", "design-system-architecture"],
  ),
  question(
    "own-automation",
    "Ownership",
    "Make automation understandable",
    "An automated system proposes changes for a care-team dashboard. Design the interaction so people can understand what happened, what is pending, and what they control.",
    [
      "Separate a suggestion, a requested action, an authoritative commit, and a failure. Show actor/provenance and relevant status without implying uncertain success.",
      "Define permission and confirmation boundaries with product owners; a convincing explanation does not grant the automation authority.",
      "Preserve useful recovery paths: cancel where meaningful, reconcile unknown results, and use domain compensation when a real action cannot simply be undone.",
      "Test comprehension, keyboard operation, error recovery, stale state, and duplicate submissions. Measure product outcomes rather than only acceptance clicks.",
    ],
    [
      "How do you avoid an optimistic success indicator for an unconfirmed action?",
      "What does an audit event prove, and what should it exclude?",
    ],
    [
      "A fluent explanation establishes correctness",
      "An undo button can erase every remote side effect",
    ],
    ["state-machines", "sagas-and-compensation", "accessibility"],
  ),
].sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));

export const codingDrills = [
  {
    id: "interview-pair-sum",
    pattern: "Lookup map",
    minutes: 20,
    focus: "Complement lookup before insertion; explain duplicate and tie policy.",
  },
  {
    id: "interview-unique-window",
    pattern: "Sliding window",
    minutes: 25,
    focus: "A monotonic left boundary and an explicit Unicode unit.",
  },
  {
    id: "interview-lower-bound",
    pattern: "Binary search",
    minutes: 20,
    focus: "A half-open interval invariant, duplicates, and insertion endpoints.",
  },
  {
    id: "interview-merge-windows",
    pattern: "Sort + scan",
    minutes: 25,
    focus: "State the endpoint policy, preserve ownership, then merge.",
  },
  {
    id: "interview-tree-preorder",
    pattern: "Iterative DFS",
    minutes: 25,
    focus: "Preserve sibling order and explain graph versus tree assumptions.",
  },
  {
    id: "interview-lru-cache",
    pattern: "Ordered map / LRU",
    minutes: 30,
    focus: "Capacity after every write, recency, identity, and undefined values.",
  },
  {
    id: "interview-balanced-brackets",
    pattern: "Stack warm-up",
    minutes: 10,
    focus: "Nesting is stronger than equal counts. Define the input language.",
  },
  {
    id: "interview-dependency-order",
    pattern: "Graph / topological order",
    minutes: 35,
    focus: "Indegrees, disconnected cycles, duplicate edges, and queue cost.",
  },
];

export const sprintSessions = [
  {
    id: "language",
    title: "JavaScript + problem solving",
    outcome:
      "Explain a contract and invariant before typing. Finish two solutions without a guide.",
    blocks: [
      {
        id: "warmup",
        minutes: 15,
        title: "Practice the five-step problem-solving loop",
        detail:
          "Clarify → trace a small example → choose a structure/invariant → implement → test and explain complexity.",
        question: "js-invariant",
      },
      {
        id: "maps",
        minutes: 25,
        title: "Map lookup, then a sliding window",
        detail:
          "Solve pair sum first. Trace duplicates and a window whose left edge must not retreat.",
        exercise: "interview-pair-sum",
      },
      {
        id: "window",
        minutes: 30,
        title: "Implement the unique-window contract",
        detail: "Use the runner, then explain code points and the extra-space bound out loud.",
        exercise: "interview-unique-window",
      },
      {
        id: "async",
        minutes: 30,
        title: "Predict scheduling and repair stale results",
        detail:
          "Explain the event loop, then prove latest-owner commits with reordered completions.",
        question: "react-race",
        exercise: "latest-owner",
      },
      {
        id: "recall",
        minutes: 20,
        title: "Closed-book explanation and mistake log",
        detail:
          "Re-explain two missed points without notes; write the invariant you originally violated.",
        question: "js-order",
      },
    ],
    extra: [
      "Use binary search and interval merging as two additional timed problems.",
      "Do not read a solution until you have written an approach and at least three tests.",
    ],
  },
  {
    id: "react",
    title: "React + browser behavior",
    outcome: "Diagnose UI bugs by ownership and lifecycle, with a concrete verification plan.",
    blocks: [
      {
        id: "snapshot",
        minutes: 25,
        title: "Predict state, keys, and rendering",
        detail:
          "Use the real React playground. Explain count 1 versus 3, then reordered editable rows.",
        question: "react-snapshot",
      },
      {
        id: "effects",
        minutes: 25,
        title: "Defend effect cleanup and snapshot identity",
        detail: "Discuss a query race, unmount, external subscriptions, and a no-op write.",
        question: "react-store",
        exercise: "snapshot-protocol",
      },
      {
        id: "lru",
        minutes: 35,
        title: "Build a bounded LRU cache",
        detail:
          "Discuss API behavior and eviction before implementing. Test undefined and object keys.",
        exercise: "interview-lru-cache",
      },
      {
        id: "browser",
        minutes: 20,
        title: "Investigate a slow, inaccessible form",
        detail:
          "Name the evidence for layout/interaction cost; cover keyboard, focus, and recoverable errors.",
        question: "web-forms",
      },
      {
        id: "teach",
        minutes: 15,
        title: "Explain one fix in two minutes",
        detail: "Give the symptom, mechanism, fix, test, and one limit of your evidence.",
        question: "react-speed",
      },
    ],
    extra: [
      "Implement the iterative tree traversal, then discuss how a graph changes its assumptions.",
      "Rehearse the CSS clipping/stacking question at mobile width and 200% zoom.",
    ],
  },
  {
    id: "systems",
    title: "Bask role rehearsal + full mock",
    outcome: "Connect a user action to tenant-safe persistence, recovery, and production evidence.",
    blocks: [
      {
        id: "design",
        minutes: 25,
        title: "Trace a rescheduling command end to end",
        detail:
          "Clarify the booking invariant, typed API, runtime schema, tenant policy, transaction, and uncertain response.",
        question: "system-booking",
      },
      {
        id: "boundary",
        minutes: 15,
        title: "Defend the Next.js and cache boundaries",
        detail:
          "Distinguish server/client execution, private representations, invalidation, and stale refills.",
        question: "system-cache",
        exercise: "stale-refill-fence",
      },
      {
        id: "mock",
        minutes: 60,
        title: "Run the uninterrupted practice mock",
        detail:
          "Use the mock timer and speak your reasoning. Review only after the round finishes.",
        question: "api-trust",
      },
      {
        id: "stories",
        minutes: 20,
        title: "Prepare two true ownership stories",
        detail:
          "One incident and one delivery tradeoff; include your contribution, evidence, and what you learned.",
        question: "own-incident",
      },
    ],
    extra: [
      "Extend the mock with topological order if core problems are already solid.",
      "Prepare a concrete example of reviewing and correcting AI-generated code.",
    ],
  },
];

export const mockStages = [
  {
    title: "Clarify",
    minutes: 5,
    prompt:
      "Restate the function/API, inputs, outputs, constraints, mutation policy, and one ambiguous edge case. Ask permission to use any tool.",
  },
  {
    title: "Solve",
    minutes: 25,
    prompt:
      "Trace a simple example. Describe the straightforward approach, then your data structure and invariant. Implement while narrating decisions.",
  },
  {
    title: "Test & defend",
    minutes: 10,
    prompt:
      "Run normal, empty, duplicate, and boundary cases. Explain a counterexample to a broken version, plus complexity and its assumptions.",
  },
  {
    title: "Frontend follow-up",
    minutes: 15,
    prompt:
      "Connect the algorithm to a UI. Discuss result ownership, accessibility, performance, runtime validation, and the server's authority.",
  },
  {
    title: "Ownership",
    minutes: 5,
    prompt:
      "Tell one evidence-based project story. State your contribution, a tradeoff, result, and learning. Ask a useful question about the team's quality bar.",
  },
];

export const commandStages = [
  {
    title: "UI intent",
    contract:
      "A draft is local; a click requests an operation. Show pending intent without claiming the server committed.",
    failure: "Duplicate submission, stale entity, abandoned screen, or lost keyboard focus.",
    evidence:
      "Exercise Enter, IME, pending/error recovery, repeated clicks, and account switching.",
  },
  {
    title: "Typed API",
    contract:
      "A tRPC or HTTP adapter transports a contract. Parse unknown input and map intentional DTOs/errors.",
    failure: "A forged request bypasses the UI, or an old tab sends an older payload.",
    evidence:
      "Validate runtime schemas and supported compatibility cases against the actual transport.",
  },
  {
    title: "Tenant policy",
    contract:
      "Resolve actor and scope from verified context. Authorize the requested resource and returned fields.",
    failure: "A trusted-looking tenantId or a stale permission check grants the wrong authority.",
    evidence: "Test two tenants and denied actors at the authoritative read/write boundary.",
  },
  {
    title: "Atomic write",
    contract:
      "Protect the booking/version invariant using the database's real constraints and concurrency behavior.",
    failure: "Concurrent writers both appear valid, or a timeout hides a successful commit.",
    evidence:
      "Use controlled concurrent transactions and operation identity; verify commit and rollback behavior.",
  },
  {
    title: "Reconcile",
    contract:
      "Return canonical outcome/version, update the intended UI owner, and invalidate the right representations.",
    failure: "An old response or refill overwrites newer state; a replica returns older data.",
    evidence:
      "Reverse completion order, replay a duplicate, and verify the promised read-your-writes behavior.",
  },
  {
    title: "Operate",
    contract:
      "Observe the operation, deliver post-commit work safely, and keep a credible rollout/recovery path.",
    failure:
      "A relay duplicates an event, a deployment skews versions, or diagnostics expose secrets.",
    evidence:
      "Trace operation identity, test duplicate delivery and rollback, and keep sensitive payloads out of routine logs.",
  },
];
