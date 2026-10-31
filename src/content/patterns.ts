import { lesson } from "./helpers";

export const patterns = [
  lesson("patterns", {
    slug: "solid-single-responsibility",
    title: "SOLID: Single Responsibility",
    description: "Separate reasons to change, not every ten lines into another file.",
    mental:
      "Single Responsibility concerns cohesive ownership: a module should not combine unrelated reasons to change. A component can legitimately contain several details of one interaction; splitting those details blindly can make the feature harder to understand.",
    steps: [
      {
        title: "Find independent change pressures",
        body: "A checkout component that calculates tax, calls a payment SDK, formats UI, and sends analytics serves policies owned by different actors. Trace actual changes to identify seams. File length is a clue about complexity, not a definition of responsibility.",
      },
      {
        title: "Extract stable boundaries",
        body: "Move pricing rules into a pure policy module, payment communication into an adapter, and orchestration into a use case. Keep presentation close to the feature. Each boundary should hide a decision, own a contract, or isolate a meaningful effect.",
      },
      {
        title: "Avoid fragmentation",
        body: "A hook per statement does not improve cohesion. Excessive indirection increases navigation and makes transactional behavior difficult to see. Evaluate whether a reviewer can understand the full use case without opening dozens of forwarding modules.",
      },
    ],
    code: `// Before: UI computes tax, calls vendor, sends email.\n// After:\nconst quote = pricing.quote(cart, taxPolicy);\nconst result = await checkout.execute({ cartId, quoteVersion: quote.version });\n// UI owns presentation and pending/error states.\n// pricing owns policy; checkout owns orchestration;\n// payment adapter owns the provider protocol.`,
    pitfalls: [
      "Defining responsibility as one method per class.",
      "Extracting code without reducing independent change reasons.",
    ],
    practice:
      "Inspect a large form and identify three changes owned by different actors. Extract only boundaries that isolate those pressures.",
    decision: {
      use: "Unrelated policy, transport, and presentation concerns repeatedly change together by accident.",
      avoid: "Splitting cohesive local behavior purely to meet a line-count rule.",
      tradeoff: "Clearer ownership and testability versus indirection and contract maintenance.",
    },
    quiz: {
      question: "Which is the best SRP signal?",
      choices: [
        "Independent reasons and actors requiring change",
        "A strict 20-line limit",
        "One hook per expression",
      ],
      answer: 0,
      explanation: "SRP is about cohesion around reasons to change, not arbitrary file size.",
    },
  }),
  lesson("patterns", {
    slug: "solid-open-closed",
    title: "SOLID: Open/Closed",
    description: "Create an extension point around a proven axis of variation.",
    mental:
      "Open/Closed means stable policy can support new behavior through a deliberate extension point. It does not mean existing code can never change, and it does not justify a plugin framework before variation exists.",
    steps: [
      {
        title: "Identify repeated branching",
        body: "If adding a payment provider requires editing unrelated UI, validation, and orchestration branches, the provider choice is leaking. Locate a coherent capability that varies and define the smallest semantic contract for it.",
      },
      {
        title: "Extend through composition",
        body: "A strategy map, adapter registry, or injected function can add a provider without changing the stable use case. Validate unknown keys at runtime and ensure errors and asynchronous behavior follow the same contract. Extension is safe only when semantics match.",
      },
      {
        title: "Keep the escape cost visible",
        body: "Some changes really alter the abstraction. Update the contract rather than forcing incompatible cases into it. Registries add discoverability and configuration costs, so direct branching can remain the best design for two small, stable cases.",
      },
    ],
    code: `type ShippingStrategy = (cart: Cart) => Money;\nconst shipping: Record<ShippingMethod, ShippingStrategy> = {\n  standard: cart => standardQuote(cart),\n  express: cart => expressQuote(cart),\n};\nfunction quote(cart: Cart, method: ShippingMethod) {\n  return shipping[method](cart);\n}`,
    pitfalls: [
      "An extension point for every hypothetical future variation.",
      "A registry that accepts providers with incompatible semantics.",
    ],
    practice:
      "Refactor a growing export-format switch into strategies. Explain which shared behavior stays fixed and what happens for unsupported formats.",
    decision: {
      use: "Repeated additions along a stable, observed axis such as format, provider, or policy.",
      avoid:
        "Speculative extensibility with no credible variation and a simpler direct implementation.",
      tradeoff: "Localized extensions versus more contracts and indirect control flow.",
    },
    quiz: {
      question: "When is an extension point most justified?",
      choices: [
        "When a stable recurring axis of variation is observed",
        "Before every first implementation",
        "Whenever a function has an if",
      ],
      answer: 0,
      explanation:
        "Observed change pressure gives evidence for the abstraction. Every conditional is not an architectural failure.",
    },
  }),
  lesson("patterns", {
    slug: "solid-liskov",
    title: "SOLID: Liskov Substitution",
    description: "Make interchangeable implementations preserve behavioral contracts.",
    mental:
      "Matching method signatures does not guarantee substitutability. A replacement must preserve the caller's behavioral expectations: accepted inputs, promised outcomes, side effects, ordering, error semantics, and relevant invariants.",
    steps: [
      {
        title: "Specify more than types",
        body: "If a repository promises read-after-write consistency, a replica-backed implementation that returns stale data may violate its contract despite identical TypeScript signatures. Document preconditions, postconditions, and failure behavior at important ports.",
      },
      {
        title: "Avoid strengthening requirements",
        body: "A substitute should not unexpectedly accept fewer valid inputs or promise less than the contract. A storage adapter that silently drops unsupported values is not a correct replacement. Model capabilities separately if one backend cannot support the required operation.",
      },
      {
        title: "Test every implementation against the contract",
        body: "Run shared contract tests against real adapters. An in-memory fake often has stronger consistency or different error behavior than production storage, which can hide bugs. Either align the fake or explicitly limit what its tests establish.",
      },
    ],
    code: `interface DocumentStore {\n  // Contract: a successful save is visible to the next read.\n  save(doc: Document): Promise<void>;\n  read(id: string): Promise<Document | null>;\n}\n// Both memory and HTTP adapters run the same contract suite.\n// A lagging replica reader needs a different declared guarantee.`,
    pitfalls: [
      "Assuming structural typing proves behavioral equivalence.",
      "Fakes that always succeed and ignore concurrency semantics.",
    ],
    practice:
      "Write a shared adapter contract for save/read/delete, including not-found and conflicts. Run it against a fake and a real implementation.",
    decision: {
      use: "Multiple implementations or test doubles used behind one semantic port.",
      avoid: "Forcing different capabilities into one misleading interface.",
      tradeoff: "Interchangeability requires stronger documentation and realistic contract tests.",
    },
    quiz: {
      question:
        "Two adapters share signatures but differ in promised read-after-write behavior. Are they necessarily substitutable?",
      choices: ["No", "Yes", "Only if both are classes"],
      answer: 0,
      explanation:
        "Substitution is behavioral. A caller relying on the stronger promise can break with the weaker implementation.",
    },
  }),
  lesson("patterns", {
    slug: "solid-interface-segregation",
    title: "SOLID: Interface Segregation",
    description: "Expose capabilities consumers need instead of a giant application service.",
    mental:
      "A consumer should depend on the capabilities it uses. Narrow contracts reduce accidental coupling and make unsupported operations explicit. The same idea applies to component props, context values, hooks, and service ports.",
    steps: [
      {
        title: "Read the consumer's needs",
        body: "A project list needs a query capability, not the entire admin SDK. An oversized context forces unrelated consumers to know one broad object and can amplify updates. Separate concerns by ownership and volatility rather than splitting every method mechanically.",
      },
      {
        title: "Model optional capabilities honestly",
        body: "Do not require read-only adapters to implement delete by throwing an unsupported-operation error unless that is the explicit contract. Separate readers and writers or use a discriminated capability model. Consumer types should make valid usage clear before runtime.",
      },
      {
        title: "Preserve cohesive operations",
        body: "Narrow interfaces can still expose an atomic use case. Splitting a transaction into tiny unrelated setters may destroy important semantics. Optimize for the consumer's meaningful capability, not simply the fewest methods.",
      },
    ],
    code: `interface ProjectReader {\n  get(id: string): Promise<Project | null>;\n}\ninterface ProjectRenamer {\n  rename(id: string, name: string, version: number): Promise<Project>;\n}\nfunction createProjectView(reader: ProjectReader) { /* ... */ }`,
    pitfalls: [
      "One global AppService with dozens of unrelated methods.",
      "Tiny interfaces that split one atomic invariant into unsafe steps.",
    ],
    practice:
      "Narrow a dashboard's dependency from a whole SDK to the operations it actually uses. Preserve any required atomic behavior.",
    decision: {
      use: "Consumers depend on broad contracts with unrelated capabilities or unsupported methods.",
      avoid: "Splitting cohesive transactional behavior solely to reduce method count.",
      tradeoff: "Lower coupling versus more named contracts and composition work.",
    },
    quiz: {
      question: "A read-only screen should usually depend on…",
      choices: [
        "A relevant read capability",
        "The full mutable admin service",
        "A global service locator",
      ],
      answer: 0,
      explanation:
        "A narrow consumer-driven capability limits coupling and exposes only the needed behavior.",
    },
  }),
  lesson("patterns", {
    slug: "solid-dependency-inversion",
    title: "SOLID: Dependency Inversion",
    description: "Make high-level policy own its dependencies through explicit ports.",
    mental:
      "High-level policy should not be dictated by low-level infrastructure. Both can depend on a contract owned near the policy. In JavaScript, an injected function is often enough; dependency inversion does not require a container or a class hierarchy.",
    steps: [
      {
        title: "Find the unstable detail",
        body: "A use case importing fetch, localStorage, or a vendor SDK directly becomes coupled to environment and protocol. Extract a semantic operation such as charge or saveDraft, including errors and cancellation where relevant.",
      },
      {
        title: "Inject at composition",
        body: "The composition root selects concrete adapters. Pure application logic receives the capability as a parameter or factory dependency. Avoid hidden global lookup because it obscures requirements and can share state across requests accidentally.",
      },
      {
        title: "Keep the abstraction honest",
        body: "A renamed SDK interface is still vendor-shaped. Design the contract from application needs and map types at the adapter. Do not wrap stable language primitives without a useful boundary; the mapping and testing cost must buy actual isolation.",
      },
    ],
    code: `type SaveDraft = (draft: Draft) => Promise<void>;\nfunction createAutosave(save: SaveDraft) {\n  return async (draft: Draft) => {\n    validateDraft(draft);\n    await save(draft);\n  };\n}\nconst autosave = createAutosave(httpDraftAdapter.save);`,
    pitfalls: [
      "A dependency injection container hiding dependencies instead of exposing them.",
      "Ports that copy every vendor-specific type.",
    ],
    practice:
      "Run the same autosave use case with an HTTP adapter and IndexedDB adapter. Document different durability and offline semantics instead of pretending they are identical.",
    decision: {
      use: "Important policy coupled to volatile infrastructure, environment-specific behavior, or multiple implementations.",
      avoid: "A forwarding wrapper around every stable helper with no meaningful variation.",
      tradeoff:
        "Testable policy and replaceable details versus adapter mapping and composition complexity.",
    },
    quiz: {
      question: "Does dependency inversion require a DI container?",
      choices: ["No, ordinary functions can express it", "Yes", "Only in React"],
      answer: 0,
      explanation:
        "The principle concerns dependency direction. Passing a capability explicitly is often sufficient.",
    },
  }),
  lesson("patterns", {
    slug: "strategy-pattern",
    title: "Strategy: interchangeable policy",
    description: "Replace distributed branching with cohesive pure policies.",
    mental:
      "A strategy packages one algorithm behind a stable contract. It fits cases where the same workflow varies by one policy, such as sorting, pricing, validation, or retry decisions. It is distinct from a state machine, which constrains transitions over time.",
    steps: [
      {
        title: "Separate orchestration from policy",
        body: "Keep the workflow fixed and inject the calculation or decision. Strategies should not secretly perform unrelated network operations if callers expect a pure calculation. Define shared input, output, and error semantics.",
      },
      {
        title: "Choose selection ownership",
        body: "The composition layer or verified domain context chooses the strategy. Do not let an untrusted browser choose a privileged discount policy. A strategy map can be simpler than class inheritance and supports small independently testable functions.",
      },
      {
        title: "Revisit the abstraction when cases diverge",
        body: "If each strategy requires unrelated arguments and special handling, the common contract may be false. Split use cases or redesign the domain rather than adding optional parameters until everything becomes loosely typed.",
      },
    ],
    code: `type DiscountPolicy = (subtotal: Money, customer: Customer) => Money;\nconst standard: DiscountPolicy = amount => amount;\nconst loyalty: DiscountPolicy = (amount, customer) =>\n  customer.years >= 3 ? amount.multiply(0.9) : amount;\nfunction price(cart: Cart, customer: Customer, policy: DiscountPolicy) {\n  return policy(cart.subtotal, customer);\n}`,
    pitfalls: [
      "A strategy selected from unverified user privileges.",
      "A common interface filled with unrelated optional parameters.",
    ],
    practice:
      "Implement three shipping policies and a shared contract suite. Explain when a simple conditional would be clearer.",
    decision: {
      use: "Several cohesive alternative algorithms with stable inputs and outcomes.",
      avoid: "One trivial branch or alternatives with fundamentally different workflows.",
      tradeoff: "Localized policy variation versus extra indirection and selection configuration.",
    },
    quiz: {
      question: "Strategy primarily models…",
      choices: [
        "Interchangeable algorithms or policies",
        "Workflow transition legality",
        "Durable event delivery",
      ],
      answer: 0,
      explanation:
        "Strategies vary an algorithm behind a shared contract. State machines address legal transitions.",
    },
  }),
  lesson("patterns", {
    slug: "adapter-and-repository",
    title: "Adapter & Repository boundaries",
    description: "Translate protocols without hiding important data-access semantics.",
    mental:
      "An adapter changes the shape of an interface. A repository offers a domain-oriented persistence boundary. Either is useful when it protects policy, but a generic CRUD wrapper can obscure query efficiency, transactions, and consistency.",
    steps: [
      {
        title: "Map data and errors",
        body: "Translate transport DTOs, provider status codes, and SDK exceptions into application concepts. Validate external responses. Keep credentials and retry policy inside the relevant boundary while preserving cancellation and deadline propagation.",
      },
      {
        title: "Expose meaningful operations",
        body: "reserveInventoryIfAvailable communicates an atomic guarantee better than generic get and update. A repository should not force every query into an inefficient universal abstraction. Permit specialized queries or application ports where they express the actual need.",
      },
      {
        title: "Verify real adapter behavior",
        body: "Contract tests should cover missing records, conflicts, partial failure, and serialization. A fake is useful for policy tests but cannot prove SQL isolation or remote API behavior. Track mapping overhead and avoid retaining both external and internal giant models unnecessarily.",
      },
    ],
    code: `interface InventoryPort {\n  reserveIfAvailable(productId: string, quantity: number): Promise<\n    { ok: true; reservationId: string } | { ok: false; reason: 'sold-out' }\n  >;\n}\n// SQL and HTTP adapters preserve this atomic semantic contract.`,
    pitfalls: [
      "Generic get/update APIs concealing an atomic reservation requirement.",
      "An adapter that swallows all upstream errors into null.",
    ],
    practice:
      "Wrap a vendor inventory API with an application port. Specify timeout ambiguity and duplicate-request handling, then test the mapping.",
    decision: {
      use: "External model volatility, multiple backends, or domain operations that need explicit persistence semantics.",
      avoid:
        "A generic repository that hides the database features and query behavior the application actually relies on.",
      tradeoff:
        "Boundary isolation versus mapping code and the risk of a misleading lowest-common-denominator API.",
    },
    quiz: {
      question: "Which port better communicates an inventory invariant?",
      choices: ["reserveIfAvailable", "get followed by update with no contract", "executeAnything"],
      answer: 0,
      explanation:
        "A semantic operation can state its atomic guarantee; generic CRUD alone does not express the invariant.",
    },
  }),
  lesson("patterns", {
    slug: "observer-and-events",
    title: "Observer, subscriptions & event buses",
    description: "Decouple notifications while keeping ownership and causal flow understandable.",
    mental:
      "Observer connects a source to interested listeners. It removes direct calls but introduces lifecycle, ordering, error, and discoverability concerns. An in-memory event bus is not durable messaging and does not create a transaction across subscribers.",
    steps: [
      {
        title: "Define notification semantics",
        body: "State whether listeners run synchronously, whether one failure stops others, and whether emissions can re-enter the source. Typed event names and payloads help, but runtime boundaries still need validation. Avoid global string channels as invisible control flow.",
      },
      {
        title: "Own subscription cleanup",
        body: "Subscribe should return an unsubscribe capability and the component or scope must invoke it. Listeners retain closures and their object graphs. Repeated mounts without teardown can duplicate behavior and leak memory.",
      },
      {
        title: "Prefer direct composition when causality matters",
        body: "If an operation requires a result from another module, an explicit use-case call is often clearer than publishing an event and hoping a listener responds. Use domain events for decoupled facts with defined delivery semantics, not to disguise required synchronous dependencies.",
      },
    ],
    code: `function subscribe(listener: (value: Snapshot) => void) {\n  listeners.add(listener);\n  return () => { listeners.delete(listener); };\n}\n// The owner invokes unsubscribe at the end of its lifetime.\n// Document synchronous/asynchronous emission and error behavior.`,
    pitfalls: [
      "A global bus as the main application control flow.",
      "No listener cleanup.",
      "Assuming an in-memory notification survives a process crash.",
    ],
    practice:
      "Build a typed subscription interface and test duplicate subscribe, unsubscribe, listener failure, and reentrant emission.",
    decision: {
      use: "One-to-many notifications with independent observers and explicit lifecycle ownership.",
      avoid: "A required request/response dependency better expressed as a direct function call.",
      tradeoff:
        "Loose source-to-listener coupling versus harder traceability and lifecycle management.",
    },
    quiz: {
      question: "Does an in-memory event bus provide durable delivery?",
      choices: ["No", "Yes", "Only with TypeScript"],
      answer: 0,
      explanation:
        "Notifications disappear with process lifetime unless a separate durable protocol persists them.",
    },
  }),
  lesson("patterns", {
    slug: "state-machines",
    title: "State machines & workflow invariants",
    description: "Replace impossible boolean combinations with explicit legal transitions.",
    lab: "machine",
    mental:
      "A state machine describes which states exist and which events may move between them. It is valuable when time and legal ordering matter. A reducer can implement a machine, but a switch statement alone does not guarantee the state model is complete.",
    steps: [
      {
        title: "Model domain states",
        body: "An upload may be idle, selecting, uploading, succeeded, failed, or cancelled. Each state owns the data valid there. Independent flags such as loading, done, error, and cancelled can represent contradictory combinations unless transitions are controlled.",
      },
      {
        title: "Separate transitions from effects",
        body: "Pure transition logic decides the next state. An effect runner owns network work, cancellation, and result events. Late completions must carry operation identity so a cancelled or superseded request cannot illegally restore success.",
      },
      {
        title: "Choose sophistication by workflow",
        body: "Hierarchical and parallel machines help complex flows, but a small typed reducer may be sufficient. Persistent backend workflows require durability and recovery beyond a browser state-machine library. Coordinate client projection with server truth.",
      },
    ],
    code: `type State = { status: 'idle' } | { status: 'saving'; id: string }\n  | { status: 'saved' } | { status: 'failed'; error: string };\nfunction complete(state: State, id: string): State {\n  if (state.status !== 'saving' || state.id !== id) return state;\n  return { status: 'saved' };\n}\n// Explicit transition rejects stale completions.`,
    pitfalls: [
      "A machine with every transition allowed.",
      "Assuming client state persists a business workflow across crashes.",
    ],
    practice:
      "Model a checkout with address, payment pending, confirmed, failed, and cancelled states. Define which late events must be ignored or reconciled.",
    decision: {
      use: "Multi-step workflows, concurrency, cancellation, and invalid combinations causing recurring bugs.",
      avoid: "One simple toggle that does not need workflow modeling.",
      tradeoff:
        "Explicit correctness and visualization versus modeling and effect-orchestration overhead.",
    },
    quiz: {
      question: "What is the key value of a state machine?",
      choices: [
        "Explicit legal states and transitions",
        "Unlimited boolean flags",
        "Automatic backend durability",
      ],
      answer: 0,
      explanation:
        "It constrains temporal behavior. Persistence and distributed correctness require additional mechanisms.",
    },
  }),
  lesson("patterns", {
    slug: "command-and-cqrs",
    title: "Commands, undo & CQRS",
    description:
      "Represent intent explicitly and separate write models from read projections when justified.",
    mental:
      "A command expresses intent to change state; an event states a fact that occurred. CQRS separates command and query responsibilities, potentially using different models. It does not require event sourcing, separate databases, or a message broker.",
    steps: [
      {
        title: "Give intent a shape",
        body: "A typed command can carry operation identity, expected version, and validated arguments. Authorization and invariants apply when executing it. An event such as ProjectRenamed should only describe a committed fact, not an unverified user request.",
      },
      {
        title: "Understand undo semantics",
        body: "Local reversible edits can keep inverse operations or snapshots. Remote business actions may need compensating commands rather than erasing history. Concurrent edits complicate reversal; a naive inverse can overwrite newer changes.",
      },
      {
        title: "Separate models only for a reason",
        body: "Read projections can optimize complex query needs independently from write invariants. They introduce synchronization and lag. Start with logical separation in one codebase; add physical separation only when scale or model divergence justifies it.",
      },
    ],
    code: `type RenameProject = {\n  type: 'rename-project'; operationId: string;\n  projectId: string; expectedVersion: number; name: string;\n};\n// Command handler: authenticate → authorize → validate invariant → commit.\n// Event after commit: ProjectRenamed with canonical version.`,
    pitfalls: [
      "Calling every user intent a committed event.",
      "CQRS assumed to require event sourcing.",
      "Undo restoring old state over concurrent changes.",
    ],
    practice:
      "Design undo for a local editor and cancellation for a shipped order. Explain why the second is compensation rather than historical deletion.",
    decision: {
      use: "Complex write invariants, distinct read projections, audit needs, or explicit queued user intents.",
      avoid: "Simple CRUD where separate physical models add only synchronization overhead.",
      tradeoff:
        "Clear intent and optimized projections versus lag, more models, and reconciliation work.",
    },
    quiz: {
      question: "Does CQRS inherently require event sourcing?",
      choices: ["No", "Yes", "Only for a frontend"],
      answer: 0,
      explanation:
        "Command/query separation and event sourcing are independent design choices, though they can be combined.",
    },
  }),
  lesson("patterns", {
    slug: "compound-and-headless-components",
    title: "Compound & headless components",
    description: "Compose behavior and presentation through accessible, explicit contracts.",
    mental:
      "A headless component owns interaction behavior without prescribing all styling. Compound components expose coordinated parts through composition. Both can improve flexibility, but context, focus, and state ownership still need deliberate design.",
    steps: [
      {
        title: "Define controlled and uncontrolled modes",
        body: "A control can own its value internally or receive value and onChange from a parent. Avoid switching modes accidentally. Specify default values, disabled behavior, validation, and which callbacks represent user intent versus committed state.",
      },
      {
        title: "Keep coordination local",
        body: "A compound root may provide scoped context to Trigger, List, and Item parts. Error clearly when parts are used outside their root. Avoid context values that change unnecessarily, and do not require fragile DOM ordering assumptions without documenting them.",
      },
      {
        title: "Preserve interaction semantics",
        body: "A flexible API must still implement the correct keyboard model, role, labeling, focus movement, and dismissal. Composition is not successful if arbitrary children can break required semantics silently. Prefer maintained accessible primitives for complex behaviors.",
      },
    ],
    code: `<Tabs value={tab} onValueChange={setTab}>\n  <Tabs.List aria-label="Project sections">\n    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>\n    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Panel value="activity"><Activity /></Tabs.Panel>\n  <Tabs.Panel value="settings"><Settings /></Tabs.Panel>\n</Tabs>`,
    pitfalls: [
      "An attractive compositional API with no keyboard model.",
      "Switching from uncontrolled to controlled mid-lifecycle.",
    ],
    practice:
      "Specify a headless accordion contract covering keyboard behavior, single/multiple expansion, controlled state, IDs, and nested instances.",
    decision: {
      use: "Shared interaction behavior needs multiple visual compositions with a stable accessibility contract.",
      avoid: "A one-off interaction where the abstraction adds API surface without reuse.",
      tradeoff:
        "Styling and composition flexibility versus more public contracts and misuse cases to support.",
    },
    quiz: {
      question: "What must headless abstractions still own?",
      choices: [
        "Their declared interaction and accessibility contract",
        "Every product's business rules",
        "All application routing",
      ],
      answer: 0,
      explanation:
        "Separating visual style does not remove responsibility for correct interaction semantics.",
    },
  }),
  lesson("patterns", {
    slug: "composition-and-functional-core",
    title: "Composition & the functional core",
    description: "Keep decisions pure and effects explicit while resisting premature abstraction.",
    mental:
      "A functional core computes decisions from inputs; an imperative shell performs effects and passes results inward. Composition assembles small capabilities without deep inheritance. This is a direction for managing complexity, not a demand that every function be mathematically pure.",
    steps: [
      {
        title: "Make hidden inputs explicit",
        body: "Time, randomness, storage, and network access make behavior harder to reproduce. Pass a clock, generated ID, or loaded data where the policy needs it. The boundary should reflect a genuine source of nondeterminism rather than wrapping every language operation.",
      },
      {
        title: "Compose policy transformations",
        body: "Pure validation, normalization, and state transitions are easy to test with many cases. The shell handles authentication, I/O, retries, transactions, and telemetry in a visible sequence. Keep error semantics explicit so failed effects do not masquerade as valid core results.",
      },
      {
        title: "Abstract after understanding variation",
        body: "Duplication can be cheaper than a wrong shared abstraction. Two similar snippets may evolve for different business reasons. Prefer simple composition and refactor when shared semantics, ownership, and change patterns become clear.",
      },
    ],
    code: `function renewalDecision(account: Account, now: Date): Decision {\n  return account.expiresAt <= now ? { kind: 'renew' } : { kind: 'wait' };\n}\nasync function runRenewal(id: string, clock: () => Date) {\n  const account = await repository.get(id);\n  const decision = renewalDecision(account, clock());\n  await executeDecision(account, decision);\n}`,
    pitfalls: [
      "Pure wrappers that only forward to impure hidden globals.",
      "A shared abstraction joining unrelated business concepts because the syntax looks alike.",
    ],
    practice:
      "Refactor a date-dependent subscription rule to accept time explicitly. Test boundary dates and timezone assumptions without changing the global clock.",
    decision: {
      use: "Complex decision logic surrounded by I/O, nondeterministic tests, and behavior that benefits from replay.",
      avoid: "Excessive decomposition of straightforward effects with no meaningful policy.",
      tradeoff:
        "Deterministic policy and explicit effects versus more data passing and orchestration code.",
    },
    quiz: {
      question: "What makes a functional core easier to test?",
      choices: [
        "Explicit inputs and deterministic outputs",
        "Hidden global state",
        "More inheritance",
      ],
      answer: 0,
      explanation:
        "Reproducible decisions require controlling their inputs rather than relying on ambient time, randomness, or I/O.",
    },
  }),
];
