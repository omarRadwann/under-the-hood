import { lesson } from "./helpers";

export const architecture = [
  lesson("architecture", {
    slug: "modular-monolith",
    title: "The modular frontend monolith",
    description:
      "Build strong domain boundaries in one deployable application before distributing the system.",
    level: "Deep dive",
    mental:
      "One deployable does not require one tangled module graph. A modular monolith groups behavior around business capabilities, exposes narrow public contracts, and prevents internal details from becoming shared dependencies.",
    steps: [
      {
        title: "Find business ownership",
        body: "Group billing, projects, identity, and reporting around capabilities rather than organizing the entire app into giant components, hooks, and utils folders. A feature may contain its own UI, application logic, schemas, and adapters while sharing stable platform capabilities.",
      },
      {
        title: "Enforce the import direction",
        body: "Expose public entry points and prohibit consumers from importing another feature's internals. Shared modules should represent stable concepts, not a dumping ground. Use dependency rules, package boundaries where useful, and code ownership to make the architecture executable.",
      },
      {
        title: "Keep extraction optional",
        body: "One deployment reduces runtime integration and release coordination costs. Build-time coupling still exists, but it can be managed with tests and ownership. Measure real bottlenecks before introducing microfrontends; a package boundary is often enough to restore team autonomy.",
      },
    ],
    code: `src/\n  app/                    # routing and composition\n  features/\n    billing/\n      index.ts            # public contract\n      domain/             # pure rules\n      application/        # use cases\n      adapters/           # HTTP / persistence\n      ui/                 # feature components\n  shared/                 # small, stable platform contracts`,
    language: "text",
    pitfalls: [
      "Every feature importing every other feature's internals.",
      "A shared folder owning volatile business logic.",
      "Distributed deployment used to compensate for missing code boundaries.",
    ],
    practice:
      "Partition a dashboard into capabilities. Draw allowed imports and enforce one forbidden dependency through a lint or build rule.",
    decision: {
      use: "One or a few product teams sharing a coherent release cadence, including large apps that can maintain explicit module boundaries.",
      avoid:
        "Independent runtime deployment is a proven requirement that cannot be met by packages and coordinated releases.",
      tradeoff:
        "Lower operational cost and easier refactoring in exchange for a shared build and deployment boundary.",
    },
    quiz: {
      question: "What makes a monolith modular?",
      choices: [
        "Enforced public contracts and dependency boundaries",
        "Many folders alone",
        "A separate repository for every button",
      ],
      answer: 0,
      explanation:
        "Architecture is the allowed dependency graph and ownership model, not the number of directories.",
    },
  }),
  lesson("architecture", {
    slug: "feature-sliced-design",
    title: "Feature-sliced organization",
    description:
      "Use vertical slices and explicit layers without turning conventions into ceremony.",
    mental:
      "A vertical slice keeps the code needed for one capability close together. Feature-Sliced Design adds a vocabulary of layers and dependency direction. Adopt conventions to reduce cognitive load; do not force every small component into a maximal folder taxonomy.",
    steps: [
      {
        title: "Separate composition from capabilities",
        body: "Application and page-level modules compose features; features implement user actions; entity modules represent stable business concepts; shared contains domain-independent foundations. Exact layers should serve your product, and importing upward creates architectural cycles.",
      },
      {
        title: "Publish a small public API",
        body: "Consumers import the slice's public entry rather than its private filesystem. Avoid barrel exports that accidentally pull server-only code into a client graph. Separate server and client entry points when the framework boundary requires it.",
      },
      {
        title: "Evaluate locality and cross-cutting change",
        body: "Slices improve feature ownership and deletion, but a poorly chosen entity layer can become a highly coupled central model. Revisit boundaries when most changes touch many slices. Prefer explicit orchestration at a higher layer over cyclic peer dependencies.",
      },
    ],
    code: `pages/project-detail → features/rename-project\n                     → features/invite-member\nfeatures/rename-project → entities/project\nentities/project → shared/api\n\n// Forbidden: shared/api → features/rename-project\n// Public imports: '@/features/rename-project'`,
    language: "text",
    pitfalls: [
      "Applying every layer to a tiny app.",
      "Cross-importing feature internals to avoid designing orchestration.",
      "One huge shared entity model with every concern attached.",
    ],
    practice:
      "Move a rename-project capability out of a horizontal hooks/components/services structure. Count how many files a reviewer must inspect before and after.",
    decision: {
      use: "A growing feature-rich app where locality and consistent import rules solve real navigation and ownership problems.",
      avoid:
        "A small short-lived interface where a large taxonomy adds more ceremony than clarity.",
      tradeoff:
        "Predictable structure and feature locality in exchange for conventions, public API maintenance, and occasional orchestration overhead.",
    },
    quiz: {
      question: "Where should two peer features usually be orchestrated?",
      choices: [
        "A composition layer above them",
        "By cyclically importing each other",
        "In a shared constants file",
      ],
      answer: 0,
      explanation:
        "Higher-level composition keeps dependency direction acyclic and leaves each feature independently understandable.",
    },
  }),
  lesson("architecture", {
    slug: "hexagonal-frontend",
    title: "Hexagonal architecture in the frontend",
    description:
      "Keep application policy independent of fetch, localStorage, React, and vendor SDKs.",
    level: "Deep dive",
    mental:
      "Ports describe capabilities the application needs; adapters implement them for a specific environment. Dependency inversion means business policy chooses its contract instead of importing a vendor's shape everywhere. The goal is replaceable boundaries, not an interface for every function.",
    steps: [
      {
        title: "Extract policy from orchestration",
        body: "Discount eligibility, workflow transitions, and validation rules can be pure domain logic. Application use cases coordinate ports for persistence and messaging. UI components translate user intent and present results rather than embedding every rule inside event handlers.",
      },
      {
        title: "Define narrow semantic ports",
        body: "A ProjectRepository should express the operations a use case needs, not mirror an entire ORM. Runtime adapters translate external DTOs and errors into domain terms. Be explicit about retries, cancellation, transactional behavior, and caching; hiding those semantics behind a generic repository can be harmful.",
      },
      {
        title: "Compose at the boundary",
        body: "Construct concrete adapters in a composition root and inject them through ordinary functions or context where appropriate. Tests can use faithful in-memory adapters for domain behavior, while integration tests verify the real adapter contract. Avoid global service locators that hide dependencies.",
      },
    ],
    code: `interface ProjectWriter {\n  rename(id: string, name: string, expectedVersion: number): Promise<Project>;\n}\nexport function renameProject(repo: ProjectWriter) {\n  return async (input: RenameInput) => {\n    const name = normalizeProjectName(input.name);\n    return repo.rename(input.id, name, input.version);\n  };\n}\nconst execute = renameProject(httpProjectAdapter);`,
    pitfalls: [
      "A generic repository that conceals transaction and query semantics.",
      "Interfaces created only to wrap one trivial stable function.",
      "A global container disguising runtime dependency lookup.",
    ],
    practice:
      "Extract a pricing rule from a React component and replace an HTTP adapter with an in-memory adapter without changing the rule or its tests.",
    decision: {
      use: "Complex domain rules, multiple data sources, vendor volatility, offline support, or long-lived independently testable policy.",
      avoid:
        "Straightforward rendering and CRUD with no meaningful policy variation, where multiple layers only forward arguments.",
      tradeoff:
        "Isolation and replaceability in exchange for mapping code, composition work, and extra contracts that need maintenance.",
    },
    quiz: {
      question: "Which should define an application port's shape?",
      choices: [
        "The use case's semantic needs",
        "Every method of the vendor SDK",
        "The CSS framework",
      ],
      answer: 0,
      explanation:
        "A port protects policy from external details. Copying a vendor interface into your domain preserves the coupling under a new name.",
    },
    sources: [
      {
        title: "Alistair Cockburn · Hexagonal architecture",
        url: "https://alistair.cockburn.us/hexagonal-architecture/",
      },
    ],
  }),
  lesson("architecture", {
    slug: "microfrontends",
    title: "Microfrontends & team autonomy",
    description:
      "Evaluate independent deployment against runtime integration and operational cost.",
    level: "Deep dive",
    mental:
      "Microfrontends are an organizational and deployment choice. They can let teams own vertical product areas independently, but turn some compile-time coordination into runtime contracts. Splitting a bundle alone does not create team autonomy.",
    steps: [
      {
        title: "Verify the need for independence",
        body: "Look for independently owned product areas, release cadences, and teams capable of operating their slices. If the primary problem is slow builds or messy imports, packages and a modular monolith may solve it with much lower cost.",
      },
      {
        title: "Choose a composition mechanism",
        body: "Build-time packages, server composition, route-based isolation, and runtime module loading have different tradeoffs. Define routing, shared dependencies, design tokens, auth, telemetry, and version compatibility. Cross-slice state should use small versioned contracts rather than a giant shared global store.",
      },
      {
        title: "Design partial failure",
        body: "One remote may fail to load or deploy incompatibly. The shell needs timeouts, fallbacks, ownership, and a recovery strategy. Shared React versions and singletons can constrain independence. Test integration against more than one version and include operational cost in the decision.",
      },
    ],
    code: `Shell contracts:\n  route ownership: /billing/* → billing team\n  identity: verified session capability\n  UI: versioned design tokens and accessible primitives\n  events: small versioned cross-area messages\n  telemetry: shared trace context and release identity\n  failure: local fallback + owner + rollback`,
    language: "text",
    pitfalls: [
      "Microfrontends for a single small team.",
      "A shared global store coupling every remote.",
      "Claiming independent releases while requiring lockstep shared dependencies.",
    ],
    practice:
      "Write an ADR comparing a package-based modular monolith with route-level microfrontends for four teams. Include staffing, integration testing, outages, and rollback.",
    decision: {
      use: "Several autonomous teams with stable domain boundaries and a concrete need for independent deployment.",
      avoid:
        "One team, heavily coupled screens, or a problem mainly caused by ungoverned imports and poor build caching.",
      tradeoff:
        "Deployment autonomy in exchange for runtime compatibility, duplicated infrastructure, user-experience consistency work, and distributed operations.",
    },
    quiz: {
      question: "The strongest reason to adopt microfrontends is usually…",
      choices: [
        "A proven organizational need for independent ownership and deployment",
        "Reducing the number of folders",
        "Using the newest tooling",
      ],
      answer: 0,
      explanation:
        "Microfrontends pay for autonomy with operational and integration complexity. The organizational benefit should justify that cost.",
    },
    sources: [
      {
        title: "Martin Fowler · Micro frontends",
        url: "https://martinfowler.com/articles/micro-frontends.html",
      },
    ],
  }),
  lesson("architecture", {
    slug: "state-ownership",
    title: "State placement & ownership",
    description:
      "Choose URL, local, server, form, external-store, or durable state by lifetime and authority.",
    lab: "react",
    mental:
      "State belongs where its authority, lifetime, and sharing requirements meet. A library choice comes after deciding who may change the value, who must observe it, and whether it survives navigation, reload, or another device.",
    steps: [
      {
        title: "Separate server state from UI intent",
        body: "Remote entities have freshness, refetch, invalidation, and mutation semantics. Local UI state such as an open menu has different needs. Copying all server data into a global client store creates a second cache and an extra consistency problem.",
      },
      {
        title: "Use the URL for shareable navigation state",
        body: "Search, filters, sort, and selected resource often benefit from URL ownership so deep links, back, and reload work. Secrets, transient keystrokes, and large unsaved documents usually do not. Define parsing, defaults, and replacement versus push semantics.",
      },
      {
        title: "Lift only as far as necessary",
        body: "Keep state close to its consumers; lift when siblings need coordination. Forms own drafts until committed. External stores help cross-tree subscriptions and selective reads, while state machines model constrained workflows. Avoid duplicate authoritative copies and effect-driven synchronization loops.",
      },
    ],
    code: `State                 Owner\nmenu open             local component\nsearch filters        URL\nediting draft         form\nproject list          server-state cache\ncurrent permission    authoritative server policy\ncheckout workflow     explicit state machine\nconfirmed order       durable backend`,
    language: "text",
    pitfalls: [
      "Putting every value in a global store.",
      "Two-way effects keeping several copies of the same state aligned.",
      "Treating cached permissions as final authority.",
    ],
    practice:
      "Inventory all state in a dashboard. Assign authority, lifetime, sharing, persistence, and invalidation before deciding which library to use.",
    decision: {
      use: "URL for shareable navigation, local state for narrow transient UI, a server cache for remote entities, and a state machine for constrained workflows.",
      avoid: "One global store by default, especially when it duplicates server and URL state.",
      tradeoff:
        "Multiple specialized owners require explicit boundaries, but avoid the synchronization cost of one undifferentiated store.",
    },
    quiz: {
      question: "Which is usually a good owner for shareable search filters?",
      choices: [
        "The URL",
        "A hidden global variable",
        "A session cookie containing every keystroke",
      ],
      answer: 0,
      explanation:
        "The URL supports deep linking, navigation history, reload, and sharing for appropriate non-sensitive state.",
    },
  }),
  lesson("architecture", {
    slug: "design-system-architecture",
    title: "Design systems & component contracts",
    description:
      "Separate tokens, accessible primitives, reusable patterns, and product-specific features.",
    mental:
      "A design system is a maintained contract between design, implementation, and product teams. Reuse is valuable when the behavior and evolution are shared, not merely when two screenshots look similar today.",
    steps: [
      {
        title: "Layer stable foundations",
        body: "Tokens define semantic design decisions; primitives provide accessible behavior; patterns compose common interactions; product features carry business rules. A generic Button should not know about billing permissions or analytics for one checkout funnel.",
      },
      {
        title: "Design a constrained public API",
        body: "Prefer meaningful variants and composition points over dozens of unrelated booleans. Document controlled and uncontrolled behavior, ref ownership, focus handling, loading, errors, and responsive constraints. Escape hatches should be deliberate and observable rather than accidental internal class overrides.",
      },
      {
        title: "Govern change and adoption",
        body: "Version APIs, document migrations, test accessibility and visual behavior, and measure actual usage. Central ownership can become a bottleneck; contribution rules and compatibility policies help. Do not force unstable product experiments into a shared library before the pattern emerges.",
      },
    ],
    code: `type ButtonProps = {\n  intent?: 'primary' | 'secondary' | 'danger';\n  size?: 'small' | 'medium';\n  pending?: boolean;\n} & React.ButtonHTMLAttributes<HTMLButtonElement>;\n// Product-specific permission and mutation logic belongs above this.`,
    pitfalls: [
      "A universal component with dozens of interacting flags.",
      "Shared primitives importing business features.",
      "Visual consistency without keyboard and focus consistency.",
    ],
    practice:
      "Refactor a business-heavy modal into an accessible dialog primitive and a feature-level composition. Document which team owns each change.",
    decision: {
      use: "Repeated stable behavior across teams, with clear contribution and compatibility ownership.",
      avoid:
        "Prematurely generalizing two volatile product experiments based only on visual similarity.",
      tradeoff:
        "Consistency and shared fixes in exchange for governance, versioning, and constraints on local customization.",
    },
    quiz: {
      question: "Where should billing-specific authorization live?",
      choices: [
        "In the billing feature above generic UI primitives",
        "Inside every generic Button",
        "In a CSS token",
      ],
      answer: 0,
      explanation:
        "Business policy and generic interaction behavior have different owners and rates of change.",
    },
  }),
  lesson("architecture", {
    slug: "bff-and-domain-boundaries",
    title: "BFF, domain services & anti-corruption layers",
    description:
      "Adapt backend contracts without allowing upstream models to dictate frontend architecture.",
    lab: "network",
    mental:
      "An anti-corruption layer translates an external model into the language your application owns. A BFF can aggregate and adapt for the client, but should not become an unbounded duplicate of every backend's business logic.",
    steps: [
      {
        title: "Keep domain language intentional",
        body: "External fields, status codes, and error shapes reflect the provider's concerns. Map them to explicit client-facing DTOs and domain concepts. A change in an upstream SDK should affect an adapter rather than dozens of components.",
      },
      {
        title: "Locate policy with its authority",
        body: "Display formatting and client-specific aggregation can belong in the BFF. Money movement, permissions, and cross-client invariants usually belong in authoritative backend services. Duplicating rules in the browser and BFF without shared ownership creates drift.",
      },
      {
        title: "Budget aggregation failures",
        body: "Fanout can improve client simplicity but increase tail latency and partial-failure combinations. Use deadlines, partial results where truthful, caching with explicit scope, and trace context. Decide whether the BFF is owned by a product team or a platform team and how contracts evolve.",
      },
    ],
    code: `function toProjectCard(raw: UpstreamProject): ProjectCard {\n  return {\n    id: raw.project_uuid,\n    title: raw.display_name,\n    status: mapUpstreamStatus(raw.lifecycle_code),\n    // Expose only what the interface needs.\n  };\n}`,
    pitfalls: [
      "Returning raw ORM or SDK models directly to clients.",
      "Duplicating authoritative business rules in several adapters.",
      "An aggregation endpoint waiting forever for its slowest optional dependency.",
    ],
    practice:
      "Map two incompatible billing-provider models into one application port. Specify unsupported states and errors instead of silently forcing them into a happy-path model.",
    decision: {
      use: "Several clients or providers with different models, client-specific aggregation, or a volatile external integration.",
      avoid:
        "A pass-through layer that adds latency without adaptation, ownership, or a clear security boundary.",
      tradeoff:
        "Client independence and simpler contracts in exchange for mapping, operational ownership, and another deployable surface if hosted separately.",
    },
    quiz: {
      question: "What should an anti-corruption layer protect?",
      choices: [
        "The application's model from external model leakage",
        "A vendor's internal naming everywhere",
        "Only CSS class names",
      ],
      answer: 0,
      explanation:
        "It translates at the boundary so external concepts and changes do not dictate internal policy and UI contracts.",
    },
  }),
  lesson("architecture", {
    slug: "architecture-decisions",
    title: "ADRs, evolution & the strangler pattern",
    description: "Make architecture choices reversible where possible and migrate incrementally.",
    level: "Deep dive",
    mental:
      "Architecture is a sequence of decisions under constraints, not a final diagram. A useful decision record explains context, alternatives, consequences, evidence, and the conditions that would justify revisiting the choice.",
    steps: [
      {
        title: "Record a falsifiable decision",
        body: "State the actual problem and constraints before naming a pattern. Compare a small number of viable alternatives, including doing less. Distinguish a measured bottleneck from a forecast. Assign ownership, success metrics, and a review trigger rather than promising permanent optimality.",
      },
      {
        title: "Migrate by a bounded seam",
        body: "The strangler approach routes a slice of behavior to a new implementation while the old one continues. Choose a vertical capability with observable outcomes and a rollback path. Data ownership and consistency are often harder than moving UI files.",
      },
      {
        title: "Use fitness functions",
        body: "Automated import rules, bundle budgets, contract tests, and dependency checks can preserve important architectural properties. Review exceptions explicitly. A rule that blocks every useful change will be bypassed; revise the architecture when its assumptions stop matching the organization.",
      },
    ],
    code: `ADR: Keep one deployable, enforce feature packages.\nContext: 3 teams; release cadence weekly; import coupling is the pain.\nAlternatives: folders only / packages / runtime microfrontends.\nDecision: packages with public APIs and ownership.\nConsequences: shared deploy remains; integration cost stays low.\nRevisit: independent release delays exceed an agreed threshold.`,
    language: "text",
    pitfalls: [
      "An ADR describing only the chosen tool with no rejected alternatives.",
      "A big-bang rewrite with no incremental value or rollback.",
      "Architectural rules detached from current team constraints.",
    ],
    practice:
      "Write an ADR for a real state-management decision. Include a counterexample where your choice becomes a poor fit and a measurable revisit trigger.",
    decision: {
      use: "Long-lived cross-team decisions and migrations whose rationale will otherwise disappear.",
      avoid: "Recording every trivial local choice with ceremonial paperwork.",
      tradeoff:
        "A small documentation and review cost buys durable context and makes future changes easier to assess.",
    },
    quiz: {
      question: "What makes an ADR useful to a future team?",
      choices: [
        "Context, alternatives, consequences, and revisit criteria",
        "Only a diagram of the final folders",
        "A list of fashionable tools",
      ],
      answer: 0,
      explanation:
        "Future decisions depend on understanding why the original choice fit its constraints and when those constraints changed.",
    },
  }),
];
