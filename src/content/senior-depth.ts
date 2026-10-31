import type { Lesson, Step } from "../lib/types";

const extra: Record<string, [string, string][]> = {
  "solid-single-responsibility": [
    [
      "Find independent change pressures",
      "A checkout component can coordinate a use case without owning tax policy, serialization, analytics schemas, and visual layout. Examine which changes come from product, finance, and infrastructure and which files actually change together. Extract an independently changing policy while leaving cohesive orchestration together. File count and function length are weak proxies. A useful boundary lets one policy change without making consumers understand another team's implementation details; a pile of tiny helpers can still be tightly coupled.",
    ],
    [
      "Preserve failure ownership",
      "An extraction that splits one transaction across several helpers can make recovery harder even when every helper is short. Specify which operation validates, commits, reports failure, and releases resources. In a submit flow, a pure validation core can be independent while one coordinator owns pending state and cancellation. Test that validation failure never starts a write and that an uncertain write outcome does not silently retry a non-idempotent operation.",
    ],
  ],
  "solid-open-closed": [
    [
      "Require a stable axis of variation",
      "A shipping-policy map is useful when every policy accepts a normalized basket and returns the same semantic quote. It becomes misleading when one policy needs human negotiation and another returns an immediate number. Specify inputs, failures, latency expectations, and ownership before introducing plug-ins. Keep a conditional when cases change together and extension is not a real requirement. Closure against every imaginable future change is neither achievable nor a useful design target.",
    ],
    [
      "Bound extension failure",
      "An extension point also grants authority: a pricing function can throw, retain data, or start unbounded work. Validate registration, define unknown-policy behavior, and preserve the caller's execution budget. Run every strategy against its contract. A coordinator that inspects each concrete strategy to interpret its result reveals that the supposed common protocol has diverged. Keep either a coherent shared contract or an explicit higher-level workflow instead of hiding different capabilities behind matching method names.",
    ],
  ],
  "solid-liskov": [
    [
      "Test histories, not only signatures",
      "Substitution includes what remains true after a sequence of operations. If deleting an absent document is promised to be harmless, an adapter that throws strengthens its requirements. If save resolves before a later read can observe it, it weakens a promised postcondition. Include duplicate operations, cancellation, ordering, and failure categories in a shared suite. A single happy-path call cannot establish these temporal guarantees, even when structural typing accepts every implementation.",
    ],
    [
      "Expose weaker capabilities honestly",
      "A read-only source, eventually consistent replica, and transactional store can deserve separate ports. Do not implement unsupported operations by dropping writes or returning success. Repeated concrete-type inspection across callers weakens the abstraction. Shared conformance tests should establish the common promise, while integration tests establish backend-specific durability, latency, and partition behavior. A fake's stronger consistency can conceal a production race; either align the fake's contract or limit the claim its tests make.",
    ],
  ],
  "solid-interface-segregation": [
    [
      "Separate capability from convenience",
      "A product-label component should not require refund, deletion, and account-administration methods. Pass its data or a narrow query capability. Conversely, splitting a transactional operation into many primitive calls can force consumers to reconstruct hidden ordering rules. Preserve the unit of intent. Optional methods often reveal separate capabilities and need an explicit unsupported outcome rather than non-null assertions. Narrowness is valuable when it reduces obligations, not simply when it reduces the number of methods.",
    ],
    [
      "Review real consumers and fakes",
      "Evaluate a port from several actual consumers and a realistic test double. Implementations that ignore unrelated options indicate an overly broad contract. Consumers needing five adapters to read one consistent view can indicate fragmentation. Test minimal implementations against consumer behavior. Keep overloads, generics, and injection proportional to actual variation. A good interface makes an important boundary easier to explain and verify rather than requiring every caller to learn a custom abstraction framework.",
    ],
  ],
  "solid-dependency-inversion": [
    [
      "Invert semantic authority",
      "A domain port such as reserveStock communicates an invariant that a generic HTTP post method does not. Policy owns the meaning of success, conflict, and cancellation; the adapter translates transport details. Inject concrete adapters at composition. Merely wrapping fetch with the same low-level options moves syntax while leaving business rules coupled to remote endpoint details. Preserve material uncertainty, including a timeout after an operation may already have committed remotely.",
    ],
    [
      "Verify both sides of the seam",
      "Drive policy with deterministic semantic fake ports, then test adapters against real serialization and service contracts. A fake often grants stronger guarantees than the service. If atomic reservation is required, an implementation using separate read and write operations cannot promise it just because TypeScript accepts its shape. Reject the misleading implementation or revise the operation. Core tests cannot prove cookie transport, database isolation, or network recovery; integration evidence establishes those boundaries.",
    ],
  ],
  "strategy-pattern": [
    [
      "Preserve a common outcome contract",
      "Normalize inputs once when normalization belongs to every strategy. Select policy from validated domain context and define unknown or unavailable-policy behavior. A quote-returning policy and one starting an approval workflow do not fit the same synchronous number-returning contract. Test accepted inputs, failure categories, and resource lifetime. Prefer a small table of pure functions before a class hierarchy; use stateful objects when the policy has a meaningful lifecycle.",
    ],
    [
      "Measure the value of variation",
      "The abstraction pays for independent policy evolution. When every strategy changes together, direct composition or a conditional may be simpler. Compare change history and test ownership rather than assuming polymorphism is more professional. Do not let a strategy silently start unbounded remote work or retain a user's context beyond the caller's lifetime. Its execution and cancellation contract remains part of substitutability even if the implementation is a single function.",
    ],
  ],
  "adapter-and-repository": [
    [
      "Define conflict and consistency explicitly",
      "A repository exposes operations at a useful domain consistency boundary rather than pretending every backend is a universal collection. Reading an entity with a version and conditionally saving its next revision can make lost-update handling explicit. Distinguish absence, denial, conflict, unavailability, and an uncertain committed outcome where the protocol supports it. Turning every transport failure into null confuses service failure with an entity that does not exist.",
    ],
    [
      "Test translation with real representations",
      "Run semantic conformance against fake and real adapters, then verify serialization, pagination, indexes, and retry behavior. A Date can become a string or an undefined property can disappear across a wire without a useful compiler warning if the response is asserted. Validate and map data. Separate DTOs from UI models where their change pressures differ, but avoid repeated mechanical mapping without a concrete boundary or compatibility concern to protect.",
    ],
  ],
  "observer-and-events": [
    [
      "Specify reentrant delivery",
      "If listener A removes B during emission, should B still receive that emission? If A adds C, should C run now or on the next emission? Snapshot traversal and live Set traversal answer differently. Also specify nested emission order, duplicate subscription behavior, exception handling, and whether asynchronous listeners are awaited. These are observable semantics. Verify exact call sequences and idempotent unsubscribe behavior, not merely that a callback ran at least once.",
    ],
    [
      "Keep causality and authority visible",
      "A global bus can hide dependencies and make a user action difficult to trace. Give events owners, stable schemas, and correlation IDs where useful. A local notification is not a durable distributed event, and delivery does not establish a remote commit. Prefer a direct call when a caller requires a result or coordinates failure. Use events when consumers can react independently under an explicit ordering, failure, and lifetime contract.",
    ],
  ],
  "state-machines": [
    [
      "Separate transitions from effects",
      "A pure reducer can return state and effect descriptions; a runtime executes effects and returns results carrying operation IDs. Cancellation must invalidate an ID before its late completion can arrive. A retry is a new attempt, not permission for an old result to commit. Test impossible events and duplicate completions. Derive button states from domain state instead of maintaining independent booleans that can contradict the transition model.",
    ],
    [
      "Rehydrate intent, not imaginary work",
      "Nested states and parallel regions can remove duplication but introduce additional transition semantics. Start with a table and invariants, and adopt a statechart library when hierarchy and inspection justify it. Persisted state needs versioning. Restoring an uploading state does not prove that its former network request exists. Recovery must reconcile with the external authority and explain whether the operation committed, can be resumed, or needs a new attempt.",
    ],
  ],
  "command-and-cqrs": [
    [
      "Distinguish intention and compensation",
      "A command asks for a change; an event records an accepted fact. Undoing local text can restore a previous value, while undoing an email or payment needs a domain-specific compensating action and may be impossible literally. Give commands stable operation IDs and validate their current preconditions when executed. Replaying an old command under another session is a fresh authorization decision, not a mechanical traversal of history.",
    ],
    [
      "Budget projection lag and recovery",
      "Separate read models add synchronization, deduplication, rebuild, and compatibility work. Specify event ordering and how users obtain read-your-own-writes while a projection catches up. A query cache plus a mutation function does not automatically require distributed CQRS. Choose separation to satisfy measured scale or domain constraints, then test duplicated and poisoned events, stale projections, rebuild interruption, and the supported lag window. Make the recovery owner explicit.",
    ],
  ],
  "compound-and-headless-components": [
    [
      "Specify controlled ownership",
      "A controlled component receives authoritative value and reports requested changes. An uncontrolled component owns an initial value and later updates. Switching ownership modes mid-lifecycle is often ambiguous. Define disabled states, reset behavior, and a consumer refusing a requested change. Headless logic still needs roles, names, keyboard behavior, focus, and relationships. Arbitrary consumer markup can break those contracts, so document the integration responsibility and test realistic compositions.",
    ],
    [
      "Test dynamic and portaled composition",
      "Context can coordinate a portaled popup while DOM ancestry and outside-interaction detection need separate logic. Dynamic insertion, disabled items, typeahead, RTL, and focus restoration expose assumptions hidden by a static demo. Keep registry entries keyed by stable identity where needed. Verify through public behavior rather than inspecting an internal context object. A headless library is useful when consumers can customize presentation while preserving a well-defined and testable interaction protocol.",
    ],
  ],
  "composition-and-functional-core": [
    [
      "Keep time and authority explicit",
      "The pure core receives state and inputs and returns a decision. The shell owns time, randomness, storage, network, and cleanup. Injecting a clock makes time policy testable but does not make a remote operation deterministic. Preserve cancellation and uncertain outcomes at the shell. Purity also does not imply speed: a pure quadratic transform can still block input. Bound work and measure its actual dominant cost.",
    ],
    [
      "State algebraic assumptions",
      "Tiny transforms can hide failure semantics when every step uses unstructured null or exceptions. Represent expected domain outcomes and retain useful diagnostic context. Build a readable composition for a real workflow before inventing a general pipeline. Floating-point addition is not generally associative; mutation makes order observable; locale-dependent work needs explicit inputs. Test a claimed identity or associative law only where the operation's actual domain supports it.",
    ],
  ],
  "modular-monolith": [
    [
      "Enforce executable ownership",
      "Folders are not boundaries when every file can import every internal detail. Publish small module entry points, constrain dependency direction, and test forbidden imports in CI. Compose cross-domain workflows at an intentional owner instead of making a shared directory own the whole product. Keep deployment topology separate: one deployable frontend can contain strong policy boundaries, explicit ownership, and independent tests. Evaluate a boundary by change impact and failure isolation.",
    ],
    [
      "Prove an extraction seam first",
      "Before separate deployment, identify one capability with a clear data owner, compatibility contract, and failure behavior. Measure its shared state and synchronous coordination needs. A module that cannot change without reaching through neighbors may become harder across a network. Make migration reversible and compare the actual delivery bottleneck with new deployment cost. Team structure is evidence about ownership, not by itself proof that independent runtime composition is beneficial.",
    ],
  ],
  "feature-sliced-design": [
    [
      "Apply dependency direction to workflows",
      "Features represent user capabilities; entities represent domain concepts; page composition joins them. Avoid letting one feature import another's internals simply because both appear on a page. Compose at an allowed higher boundary or extract genuinely shared lower policy. Public APIs should express ownership instead of re-exporting every implementation file. Enforce chosen rules and record specific exceptions with owners so the architecture does not become a diagram contradicted by imports.",
    ],
    [
      "Evaluate locality against real change",
      "Follow one change through data mapping, UI state, tests, and transport. Useful structure makes relevant files discoverable without forcing unrelated concerns to move together. Deep slicing can increase navigation and ceremony in a small product. Measure cycles, import direction, review ownership, and boundaries crossed for routine work. Revisit the organization when actual change patterns contradict its original assumptions; directory names do not establish cohesion by themselves.",
    ],
  ],
  "hexagonal-frontend": [
    [
      "Keep domain outcomes at the port",
      "A semantic port can expose accepted, version-conflict, or unavailable outcomes while an adapter translates HTTP and storage details. Do not erase material uncertainty: a timeout after a write can mean committed but unobserved. Preserve that distinction when it changes retry behavior. Translate at a narrow boundary and keep policy ownership explicit. A generic transport interface alone does not invert the dependency between business intent and a vendor endpoint.",
    ],
    [
      "Use evidence appropriate to each seam",
      "Policy tests use deterministic semantic ports. Adapter tests establish wire mapping, validation, and service behavior. Browser checks establish interaction, cookies, and navigation under a real host. No one layer proves the others. Choose this architecture when meaningful policy and volatile details justify it; a port around every DOM property can add indirection without protecting a decision. Review the saved complexity as well as the abstractions introduced.",
    ],
  ],
  microfrontends: [
    [
      "Budget runtime coupling",
      "Independent deployment still needs compatibility for dependencies, tokens, routes, identity, and telemetry. A shared React runtime avoids some duplicate-context problems but adds version-skew and loader concerns. Iframes provide another isolation boundary with messaging and accessibility costs. Compare these options against an actual autonomy requirement. A team boundary is not by itself evidence that separate composition improves delivery, and shared dependencies can quietly make nominally independent releases move together.",
    ],
    [
      "Test partial rollout and failure",
      "Exercise unavailable manifests, incompatible payloads, old tabs, partial rollout, and rollback of one participant. A shell fallback should communicate local failure without corrupting unrelated state. Validate messages and constrain origin and authority. Contract tests should cover the newest producer and supported older consumers. Specify a version-coexistence window and a coordination owner. Independent deployability is incomplete without compatibility, monitoring, and a credible recovery path.",
    ],
  ],
  "state-ownership": [
    [
      "Place state by invariant and lifetime",
      "A remote entity remains server-authoritative even when a query cache holds its representation. A local draft can diverge until an explicit save or reset. URL state needs parsing and shareability rules. A global ephemeral hover flag creates a lifetime unrelated consumers do not need. Place state where its invariant is owned, then choose a library or transport. Easy access to a store is not evidence that the store is the correct authority.",
    ],
    [
      "Test ownership changes",
      "Account switching, route changes, tab reuse, and modal closure reveal lifetime leaks. Specify which drafts survive, which work is canceled, and which pending confirmations may commit. A library does not choose that policy. Guard asynchronous commits with operation identity or versions and reset by entity identity when appropriate. Prove that results from a departed owner cannot write into a new user's UI or a shared personalized cache.",
    ],
  ],
  "design-system-architecture": [
    [
      "Treat behavior as public API",
      "A button contract includes its semantic element, name, disabled behavior, focus visibility, and event behavior as well as appearance. A token rename can break consumers while TypeScript passes. Publish compatibility and deprecation guidance and keep product policy out of primitives. Verify representative compositions. A component requiring hidden global styles or providers can work in a demo while failing in the application that consumes its package.",
    ],
    [
      "Test distribution and accessibility",
      "Check high contrast, reduced motion, zoom, RTL, nested overlays, and long translations. Package exports, CSS ordering, server/client compatibility, and tree shaking affect consumers. Use a separate consumption fixture and a bounded visual regression matrix, then add keyboard and accessible-name checks. Screenshots establish selected visual states, not the whole interaction contract. Give failures an owner and make migration guidance part of the release rather than relying on every product team to discover the change.",
    ],
  ],
  accessibility: [
    [
      "Separate names, state, and focus",
      "An accessible name identifies a control, a description adds context, and role/state communicate semantics. A tooltip alone is not a dependable label. Inspect the accessibility tree and keyboard sequence rather than assuming visual adjacency creates an association. Modal containment belongs to a modal interaction, and focus should return to a useful surviving target. Virtualization needs an identity and focus policy when a focused row leaves the DOM.",
    ],
    [
      "Verify recovery under reading constraints",
      "Test zoom, text size, contrast, reflow, motion preference, and error recovery alongside screen-reader announcements. Announcing every trace frame overwhelms the task; expose an inspectable log and announce meaningful outcomes. Automation finds selected naming and structural issues but does not establish understandable reading order or a usable recovery path. Put those behaviors in acceptance criteria and include representative user feedback where possible. Accessibility is an interaction contract, not a passing score from one tool.",
    ],
  ],
  "external-stores": [
    [
      "Define no-op and reentrant updates",
      "An unchanged snapshot should preserve identity under the store's equality contract and avoid needless notification. Replace the snapshot before notifying so reads during delivery see the new version. Specify live versus snapshot listener iteration and nested update ordering. Idempotent unsubscribe supports repeated cleanup. Verify exact versions and callback sequences; a test that only sees some notification can miss duplicate registration, stale reads, or an update delivered after its owner has ended.",
    ],
    [
      "Separate hydration from client lifetime",
      "getServerSnapshot supplies the value needed for a consistent initial server/client view. Serialize allowed initial data and initialize the client from that contract. A browser-global store can fit the application's lifetime while a shared-server singleton can leak across requests. useSyncExternalStore supplies React's snapshot protocol; it does not validate external data, authorize changes, or establish persistence consistency. Keep those boundaries explicit and test concurrent server identities separately.",
    ],
  ],
  "memoization-and-context": [
    [
      "Inspect actual compiler configuration",
      "React Compiler can memoize eligible code when integrated into the build; a recent React runtime alone does not enable that transformation. This playground uses ordinary development React without React Compiler. Diagnose the actual deployed build before adding manual memoization everywhere. Rendering purity and correct hook usage remain required. Compare production-like profiles and keep a manual optimization for its measured or contractual purpose instead of counting render calls as a universal performance score.",
    ],
    [
      "Keep correctness independent of cache retention",
      "Discarding a memoized computation should not corrupt application behavior. Mutating a memoized object can make a child miss a meaningful update. Context subscriptions still propagate under their own dependencies; memo does not erase those subscriptions. Split contexts or consider selector-based storage for a measured propagation problem, then compare total work, memory, and complexity. Reference stability is a performance tool, not a replacement for coherent state ownership and immutable change signals.",
    ],
  ],
  "performance-budgets": [
    [
      "Attribute the complete interaction",
      "An interaction can wait behind earlier work, spend time in handlers and rendering, and wait for presentation. Small React render duration does not prove fast interaction when layout or third-party code dominates. Inspect browser traces and field cohorts by device and route. State percentiles and sample sizes. A better average can hide a severe regression in a slower cohort, and a single laboratory run does not establish a real-user distribution.",
    ],
    [
      "Keep budgets tied to outcomes",
      "Use bundle and algorithm budgets to prevent known failure modes, then keep actual interaction and loading evidence. Avoid noisy CI timing gates based on one sample. Compare cold/warm paths, slow CPU/network, and long-lived memory growth. Tie a regression to a bounded workload and retain a diagnostic trace or benchmark fixture. A budget is useful when it protects a user outcome and produces an actionable failure, rather than merely keeping an arbitrary dashboard number green.",
    ],
  ],
  "browser-rendering": [
    [
      "Distinguish visual dependency structures",
      "DOM parentage, formatting contexts, containing blocks, stacking contexts, and composited layers are related but separate structures. Transforms can affect fixed descendants, z-index is scoped, and clipping can hide an otherwise correctly ordered overlay. Debug each relationship. Portaling an overlay can solve one constraint while changing inherited CSS, focus handling, or an event-boundary assumption. Measure the real pipeline instead of inferring cost or correctness from a CSS property name alone.",
    ],
    [
      "Give measurement a convergence rule",
      "ResizeObserver reports box changes, MutationObserver reports configured DOM mutations, and IntersectionObserver reports selected intersection changes. They are not interchangeable after-render hooks. Writing a measured size can create oscillation; deferring it to a frame changes scheduling without guaranteeing convergence. Release observers and frame work when the owner ends. Test geometry in a real layout engine with fractional sizes, zoom, and asynchronous font changes rather than a layout-free DOM emulator.",
    ],
  ],
  "typescript-boundaries": [
    [
      "Validate the received representation",
      "JSON can violate an asserted DTO even when transport succeeds. Validate required fields, numeric ranges, discriminants, and unknown-field policy before constructing a trusted value. A schema-derived type aligns a validator and its static view, but tenant membership and transactional authority remain separate checks. Turn parsing failure into a deliberate error outcome with safe diagnostics instead of casting and allowing a later UI crash. Keep every unsafe conversion localized for review.",
    ],
    [
      "Test rejection as well as acceptance",
      "Include null, absent fields, extra data, invalid tags, extreme size, and unsupported versions. Check that diagnostics do not leak secrets. Negative type examples verify static relationships under actual compiler options; runtime tests establish validation. Do not assert a value merely to make a type test pass. A declaration-consumption fixture can reveal a package that builds locally but exports unusable types, while runtime integration confirms what the emitted JavaScript actually does.",
    ],
  ],
};

const references: Record<string, string[]> = {
  "scope-and-closures": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"],
  "hoisting-and-tdz": [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let",
  ],
  "values-and-equality": [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness",
  ],
  "objects-and-prototypes": [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain",
  ],
  "execution-context": [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
  ],
  "modules-and-bundlers": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules"],
  "state-and-batching": ["https://react.dev/learn/queueing-a-series-of-state-updates"],
  "identity-and-keys": ["https://react.dev/learn/preserving-and-resetting-state"],
  "memoization-and-context": [
    "https://react.dev/learn/react-compiler/introduction",
    "https://react.dev/reference/react/memo",
  ],
  "streaming-boundaries": ["https://nextjs.org/docs/app/api-reference/file-conventions/loading"],
  authorization: ["https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"],
  csrf: [
    "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
  ],
  "jwt-and-key-rotation": [
    "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet",
  ],
  "ssrf-and-secrets": [
    "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
  ],
  "multi-tenant-security": [
    "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
  ],
  "n-plus-one": ["https://www.postgresql.org/docs/current/using-explain.html"],
  "optimistic-ui": ["https://react.dev/reference/react/useOptimistic"],
  "consistency-models": ["https://www.postgresql.org/docs/current/transaction-iso.html"],
  "schema-evolution": ["https://www.postgresql.org/docs/current/ddl-alter.html"],
};

export const deepenedSlugs = Object.keys(extra);
export function deepen(item: Lesson): Lesson {
  const steps: Step[] = (extra[item.slug] ?? []).map(([title, body]) => ({ title, body }));
  return {
    ...item,
    minutes: item.minutes + steps.length * 4,
    steps: [...item.steps, ...steps],
    sources: [
      ...item.sources,
      ...(references[item.slug] ?? [])
        .filter((url) => !item.sources.some((source) => source.url === url))
        .map((url) => ({
          title:
            "Primary reference · " +
            new URL(url).pathname.split("/").filter(Boolean).at(-1)!.replaceAll("_", " "),
          url,
        })),
    ],
  };
}
