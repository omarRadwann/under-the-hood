import { lesson } from "./helpers";

export const engineering = [
  lesson("engineering", {
    slug: "typescript-boundaries",
    title: "TypeScript & runtime boundaries",
    description:
      "Use discriminated unions, generics, and runtime schemas without confusing types with evidence.",
    mental:
      "TypeScript proves properties under assumptions about your program. Network payloads, storage, environment variables, and unsafe casts can violate those assumptions. Parse unknown data once at the boundary and carry a narrower domain representation inward.",
    steps: [
      {
        title: "Model valid states",
        body: "A discriminated union can make loading, success, and failure mutually exclusive. Independent booleans allow impossible combinations. Prefer explicit state transitions and exhaustive handling when behavior depends on a finite set of variants.",
      },
      {
        title: "Validate external input",
        body: "Use a runtime schema or explicit parser to turn unknown into trusted application data. An as assertion changes compiler belief, not runtime values. Validate shape, size, and semantic constraints, and keep authorization separate from structural validation.",
      },
      {
        title: "Preserve useful generic relationships",
        body: "A generic is valuable when it connects input and output types or enforces a relationship. Broad generics and any can hide an absent contract. Use satisfies for shape checking without unnecessarily widening values, and review variance when designing callback APIs.",
      },
    ],
    code: `type LoadState<T> =\n  | { status: 'idle' }\n  | { status: 'loading'; requestId: string }\n  | { status: 'success'; data: T }\n  | { status: 'error'; message: string };\n\nconst raw: unknown = await response.json();\nconst project = ProjectSchema.parse(raw); // runtime evidence`,
    pitfalls: [
      "Treating response.json() as a validated domain object.",
      "Using assertions to silence a real boundary mismatch.",
      "Independent loading/error/data flags allowing impossible UI states.",
    ],
    practice:
      "Replace a form's six booleans with a state model that prevents submitting before validation and distinguishes retryable failure from success.",
    quiz: {
      question: "What does value as Project do at runtime?",
      choices: [
        "Validates the object",
        "Nothing; it changes static type interpretation",
        "Removes unknown properties",
      ],
      answer: 1,
      explanation: "Assertions are erased. Runtime data needs a parser or validator.",
    },
    sources: [
      {
        title: "TypeScript · Narrowing",
        url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
      },
    ],
  }),
  lesson("engineering", {
    slug: "testing-strategy",
    title: "Testing behavior & contracts",
    description:
      "Build a portfolio of tests around risk, boundaries, and meaningful failure signals.",
    mental:
      "Tests buy confidence about behavior under specified conditions. A suite that mirrors private implementation details can be large and still miss authorization leaks, races, and integration failures. Choose the smallest realistic test that can detect the risk.",
    steps: [
      {
        title: "Test invariants near the logic",
        body: "Pure domain functions are good unit-test targets. Exercise boundaries, invalid inputs, and algebraic properties where meaningful. Avoid asserting every internal helper call; a refactor that preserves the contract should not require rewriting the entire suite.",
      },
      {
        title: "Integrate at important seams",
        body: "Use real databases for isolation and constraint behavior, contract tests for service compatibility, and component tests for accessible interactions. Mocks must reflect the actual contract and can otherwise create false confidence. Control clock, network, and random inputs deliberately.",
      },
      {
        title: "Reserve end-to-end tests for critical journeys",
        body: "Cover login, authorization, core mutations, navigation, and recovery under representative conditions. Prefer observable roles and names over fragile CSS selectors. Capture traces on failure, isolate test data, and investigate flakiness as a signal rather than normalizing retries.",
      },
    ],
    code: `test('a viewer cannot rename another tenant project', async () => {\n  const viewer = await fixtures.viewer({ tenant: 'A' });\n  const project = await fixtures.project({ tenant: 'B' });\n  const response = await api.rename(viewer, project.id, 'New');\n  assert.equal(response.status, 403);\n  assert.equal((await db.project.find(project.id)).name, project.name);\n});`,
    pitfalls: [
      "Measuring confidence only by line coverage.",
      "Mocking away the database behavior a test claims to verify.",
      "Asserting component implementation details instead of user behavior.",
    ],
    practice:
      "Create a risk-based test plan for checkout. Map each test to the failure it detects, including double submission, expired auth, and an ambiguous payment response.",
    quiz: {
      question: "Which test best verifies a database uniqueness invariant?",
      choices: [
        "An integration test against the relevant database behavior",
        "A mock returning the expected answer",
        "A CSS snapshot",
      ],
      answer: 0,
      explanation:
        "A mock cannot prove actual transaction and constraint behavior. Verify the invariant at the authoritative boundary.",
    },
  }),
  lesson("engineering", {
    slug: "observability",
    title: "Logs, metrics & distributed traces",
    description: "Make failures explainable across browser, BFF, service, queue, and database.",
    mental:
      "Observability lets you answer new questions about production behavior from emitted signals. Logs describe events, metrics summarize populations, and traces relate work across boundaries. None is useful if it cannot connect a user symptom to the responsible operation.",
    steps: [
      {
        title: "Start with user-facing objectives",
        body: "Define success and latency for a meaningful operation, then choose SLIs and SLOs. A server returning 200 with the wrong empty state is not necessarily success. Monitor tail latency and failure distribution, not just averages.",
      },
      {
        title: "Propagate causal context",
        body: "Carry trace context across HTTP and queue boundaries and create spans for meaningful dependency work. Distinguish queue delay, service time, retries, and cancellation. A correlation ID is useful but is not itself a full trace model.",
      },
      {
        title: "Control cost and exposure",
        body: "High-cardinality metric labels can overwhelm systems. Put entity IDs in appropriate logs or traces rather than unbounded metric dimensions. Redact tokens and personal data, sample deliberately, and ensure error reporting does not create a new failure loop.",
      },
    ],
    code: `logger.info('project.rename.completed', {\n  correlationId: ctx.correlationId,\n  tenantId: ctx.tenantId,\n  durationMs, outcome: 'success',\n});\n// No bearer tokens, raw cookies, or full request bodies.\n// Metrics use bounded labels such as operation and outcome.`,
    pitfalls: [
      "User ID as an unbounded metric label.",
      "Logging every payload to compensate for missing context.",
      "Treating average latency as a sufficient responsiveness measure.",
    ],
    practice:
      "Trace a delayed report from browser click to queue worker. Explain how to distinguish waiting for capacity from slow execution and downstream retries.",
    quiz: {
      question: "Why are unbounded entity IDs risky as metric labels?",
      choices: [
        "They create excessive time-series cardinality",
        "They prevent JavaScript parsing",
        "They guarantee data accuracy",
      ],
      answer: 0,
      explanation:
        "Each unique label combination may create another series, causing large memory, storage, and query cost.",
    },
    sources: [
      { title: "OpenTelemetry · Concepts", url: "https://opentelemetry.io/docs/concepts/" },
    ],
  }),
  lesson("engineering", {
    slug: "performance-budgets",
    title: "Performance budgets & Core Web Vitals",
    description: "Connect responsiveness, rendering, and network cost to real-user measurements.",
    mental:
      "Performance is a distribution experienced on real devices and networks. A fast development machine and a good synthetic score cannot replace field evidence. Optimize the bottleneck affecting the user journey, with a budget that prevents regression.",
    steps: [
      {
        title: "Measure the right symptoms",
        body: "LCP concerns the main visible content, INP concerns interaction responsiveness, and CLS concerns visual stability. Segment by device, network, route, and release with privacy-aware field data. Laboratory traces explain causes; field measurements quantify experience.",
      },
      {
        title: "Find the critical path",
        body: "Reduce render-blocking work, image transfer and discovery delays, excessive client JavaScript, and long main-thread tasks. A smaller bundle may still run expensive algorithms. A server-fast page may hydrate slowly or wait on fonts and images.",
      },
      {
        title: "Prevent regression",
        body: "Set budgets for key routes and representative interactions. Compare before and after under consistent throttling, but avoid gaming synthetic scores. Include accessibility and product correctness so performance shortcuts do not remove necessary functionality.",
      },
    ],
    code: `const observer = new PerformanceObserver(list => {\n  for (const entry of list.getEntries()) {\n    // Send a sampled, privacy-aware measurement to your RUM pipeline.\n    console.log(entry.entryType, entry.name, entry.duration);\n  }\n});\nobserver.observe({ type: 'longtask', buffered: true });\n// Use a maintained Web Vitals library for correct metric reporting.`,
    pitfalls: [
      "Optimizing averages while low-end devices remain unusable.",
      "Prefetching every asset and saturating the network.",
      "Assuming bundle size alone predicts interaction latency.",
    ],
    practice:
      "Write a performance report for a slow filter interaction with field evidence, a lab trace, a proposed change, and a measurable regression budget.",
    quiz: {
      question: "Which combination gives both impact and diagnosis?",
      choices: [
        "Field data plus controlled performance traces",
        "Only a local screenshot",
        "Only bundle size",
      ],
      answer: 0,
      explanation:
        "Field data shows who is affected and how much; traces reveal where time is spent.",
    },
    sources: [{ title: "web.dev · Web Vitals", url: "https://web.dev/articles/vitals" }],
  }),
  lesson("engineering", {
    slug: "accessibility",
    title: "Accessibility as an interface contract",
    description: "Design semantics, focus, keyboard interaction, and announcements together.",
    mental:
      "Accessibility is functional correctness across input and perception modes. A component's contract includes roles, names, state, focus behavior, keyboard operation, contrast, and reduced motion, not just its visual appearance.",
    steps: [
      {
        title: "Use native semantics first",
        body: "Buttons, links, inputs, headings, and labels provide behavior and meaning. Adding role=button to a div does not implement keyboard behavior or focus management. Choose a link for navigation and a button for an action.",
      },
      {
        title: "Manage composite interactions",
        body: "Dialogs need a label, appropriate focus entry, focus containment where modal, escape behavior, and focus restoration. Tabs and menus have distinct keyboard models. Do not invent one interaction pattern and label it as another.",
      },
      {
        title: "Verify with people-facing behavior",
        body: "Automated checks find only part of the problem. Test keyboard-only flows, zoom, screen-reader announcements, error recovery, and motion preferences. Live regions should communicate meaningful changes without announcing every animation frame.",
      },
    ],
    code: `<label htmlFor="email">Email address</label>\n<input id="email" type="email" aria-describedby="email-error"\n  aria-invalid={Boolean(error)} />\n<p id="email-error">{error}</p>\n<button type="submit">Create account</button>\n// Preserve entered values and move focus deliberately on errors.`,
    pitfalls: [
      "Clickable divs with no keyboard interaction.",
      "Color as the only indication of a simulation state.",
      "An aria-live region announcing every timer tick.",
    ],
    practice:
      "Audit a command palette with keyboard and a screen reader. Verify focus entry, result navigation, selection, escape, and restoration to the triggering control.",
    quiz: {
      question: "Which element is the default choice for an in-page action?",
      choices: ["button", "A div with onClick", "An empty anchor"],
      answer: 0,
      explanation:
        "A native button supplies action semantics and keyboard behavior. Use links for navigation.",
    },
    sources: [{ title: "WAI · ARIA Authoring Practices", url: "https://www.w3.org/WAI/ARIA/apg/" }],
  }),
  lesson("engineering", {
    slug: "resilience-and-load",
    title: "Resilience, overload & circuit breakers",
    description: "Design bounded failure rather than letting queues and retries amplify an outage.",
    lab: "network",
    mental:
      "A resilient system degrades within explicit limits. Timeouts, retries, circuit breakers, bulkheads, and load shedding are different tools. Applying them without a latency and capacity model can increase failure rather than contain it.",
    steps: [
      {
        title: "Bound every waiting point",
        body: "Connections, queues, worker pools, and in-flight requests need capacities and deadlines. Unlimited waiting consumes memory and increases tail latency. Queue time counts toward the user's deadline even when no dependency is actively executing.",
      },
      {
        title: "Contain dependency failure",
        body: "A circuit breaker stops repeatedly calling a failing dependency for a period and probes recovery. Bulkheads separate resource pools so one slow feature cannot exhaust all capacity. Fallbacks must be truthful and safe, especially for money, permissions, and inventory.",
      },
      {
        title: "Test recovery, not only failure",
        body: "Inject latency, partial errors, and dependency recovery under load. Check that retries and queued work do not create a second surge. Watch saturation, error budgets, and rejected work, and define what operators can disable or roll back.",
      },
    ],
    code: `const policy = {\n  totalDeadlineMs: 2500,\n  maxAttempts: 2,\n  maxConcurrent: 20,\n  maxQueued: 40,\n  overload: 'reject',\n};\n// Values come from measured capacity and product requirements.\n// A timeout alone does not stop non-cooperative work.`,
    pitfalls: [
      "Infinite queues as a substitute for capacity planning.",
      "Retrying at every layer without a shared budget.",
      "A fallback that silently grants access when auth is unavailable.",
    ],
    practice:
      "Load-test a dashboard with one slow upstream. Demonstrate that unrelated features retain capacity and recovery does not trigger a retry storm.",
    quiz: {
      question: "What is the purpose of a bulkhead?",
      choices: [
        "Isolate resource pools to limit failure spread",
        "Make all requests retry forever",
        "Replace authorization",
      ],
      answer: 0,
      explanation:
        "Resource isolation prevents one saturated workload from consuming the capacity required by unrelated operations.",
    },
  }),
  lesson("engineering", {
    slug: "delivery-and-flags",
    title: "CI/CD, flags & progressive delivery",
    description: "Separate deployment from release and define measurable rollback criteria.",
    mental:
      "Deploying code and exposing behavior are separate controls. A feature flag can reduce release risk only if both paths remain valid, ownership is explicit, and the flag is eventually removed. Rollback must include data and compatibility, not just binaries.",
    steps: [
      {
        title: "Build reproducibly",
        body: "Use a lockfile, consistent runtime, immutable artifacts, and checks appropriate to the change. Promote the same artifact across environments where feasible. Build-time public configuration may be embedded in browser assets and cannot always be changed by adjusting runtime environment variables.",
      },
      {
        title: "Release in observable cohorts",
        body: "Canaries and percentage rollouts need stable assignment and success criteria. Keep access control separate from UI feature flags. Observe errors and user-facing latency by cohort, with a clear abort threshold and responsible owner.",
      },
      {
        title: "Keep the rollback path credible",
        body: "Use backward-compatible APIs and expand/contract migrations. A kill switch should work during the failure mode it is meant to contain. Expired flags create combinatorial test states, so track cleanup dates and remove obsolete paths.",
      },
    ],
    code: `const enabled = flags.evaluate('new-search', {\n  stableSubject: session.userId,\n  tenantId: session.tenantId,\n});\n// Still authorize the underlying operation independently.\n// Observe success/error/latency by release cohort.\n// Remove the old path after a defined completion period.`,
    pitfalls: [
      "Using feature flags as authorization.",
      "Random reassignment on every request.",
      "Binary rollback after an incompatible schema contraction.",
    ],
    practice:
      "Write a release plan for a new search backend with cohorts, success criteria, fallback, data compatibility, and flag-removal ownership.",
    quiz: {
      question: "What should remain separate from feature exposure?",
      choices: ["Authoritative permission checks", "All telemetry", "Version control"],
      answer: 0,
      explanation:
        "Feature flags control release behavior. Security policy must still be enforced independently.",
    },
  }),
  lesson("engineering", {
    slug: "debugging-and-review",
    title: "Debugging, incident analysis & review",
    description:
      "Turn symptoms into falsifiable hypotheses and architecture decisions into reviewable evidence.",
    mental:
      "Debugging narrows uncertainty. Start from an observed symptom, identify the relevant boundary, propose a falsifiable explanation, and collect evidence that can disprove it. Code review then asks whether the change fixes the cause without breaking adjacent contracts.",
    steps: [
      {
        title: "Reproduce the conditions",
        body: "Record versions, input, timing, permissions, deployment cohort, and dependency state. A minimal reproduction should preserve the causal ingredient, not just minimize lines. Races often need a controlled schedule rather than repeated manual clicking.",
      },
      {
        title: "Change one hypothesis at a time",
        body: "Use logs, breakpoints, profiles, and traces to distinguish cause from correlation. Preserve evidence before restarting away the symptom. Prefer instrumentation that answers a question over broad noisy logging that exposes data and obscures the timeline.",
      },
      {
        title: "Close with prevention and limits",
        body: "Add a meaningful regression check at the boundary where the failure occurred. Document remaining uncertainty and operational safeguards. Incident analysis should improve systems and decision processes rather than assigning blame to the last person who touched the code.",
      },
    ],
    code: `Hypothesis: an old search response overwrites a newer result.\nEvidence: request 12 starts after 11, but 11 commits last.\nExperiment: control response completion order in a test.\nFix: per-instance generation guard plus cooperative abort.\nRegression: latest intent wins under reverse completion.\nLimit: server-side side effects still need their own protocol.`,
    language: "text",
    pitfalls: [
      "Fixing a symptom with a delay.",
      "Calling a flaky test resolved because retries pass.",
      "A postmortem that has no owned corrective actions.",
    ],
    practice:
      "Write an incident review for a cross-tenant cache leak, including impact, timeline, root mechanism, contributing conditions, mitigation, and testable prevention.",
    quiz: {
      question: "What makes a debugging hypothesis useful?",
      choices: [
        "It can be tested and disproved with evidence",
        "It sounds plausible",
        "It names a popular library",
      ],
      answer: 0,
      explanation:
        "A useful hypothesis predicts observations. An experiment should distinguish it from competing explanations.",
    },
  }),
];
