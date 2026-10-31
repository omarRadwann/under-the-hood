export interface CaseStudy {
  title: string;
  context: string;
  invariant: string;
  timeline: { actor: string; event: string; state: string }[];
  alternatives: { approach: string; fits: string; cost: string }[];
  verification: string;
  signals: string;
}
export const caseStudies: Record<string, CaseStudy> = {
  "cache-invalidation": {
    title: "The refill that resurrected stale data",
    context:
      "A product API uses cache-aside. A slow read starts before a price update and completes after the write invalidates the cache. Both handlers appear correct when reviewed in isolation.",
    invariant:
      "After a writer is promised read-your-writes, the next read for that writer must not silently receive an older version.",
    timeline: [
      {
        actor: "Reader A",
        event: "Cache miss. Starts loading product version 7 from the database.",
        state: "Origin v7 · cache empty · load v7 in flight",
      },
      {
        actor: "Writer B",
        event: "Commits version 8 and deletes the cache key.",
        state: "Origin v8 · cache empty · old load still in flight",
      },
      {
        actor: "Reader A",
        event: "The old load finishes and writes version 7 into the empty cache.",
        state: "Origin v8 · cache v7 with a fresh TTL",
      },
      {
        actor: "Writer B",
        event: "Reads again. A cache hit returns v7 despite the completed invalidation.",
        state: "Read-your-writes violated; TTL freshness hid data staleness",
      },
    ],
    alternatives: [
      {
        approach: "Accept bounded staleness",
        fits: "Public descriptive content with an explicit stale-data budget.",
        cost: "Users can observe old data; TTL is a product contract, not a correctness repair.",
      },
      {
        approach: "Version-aware publication",
        fits: "An authoritative version or generation can prevent older refill results becoming current.",
        cost: "Requires atomic compare/publish behavior and careful version ownership across instances.",
      },
      {
        approach: "Writer returns canonical state",
        fits: "The writing session needs immediate confirmation while other readers tolerate lag.",
        cost: "Following reads still need a freshness-aware route; UI state alone does not fix shared caches.",
      },
    ],
    verification:
      "Use a controllable loader barrier. Pause reader A after observing v7, commit v8 and invalidate, then release A. Assert the explicitly promised consistency behavior. Repeat with two instances, a lagging replica, and a client holding router state.",
    signals:
      "Record representation version, origin version where feasible, key class, invalidation event ID, and refill completion time. A high hit rate can coexist with incorrect data, so measure stale-read outcomes for critical flows.",
  },
  "render-and-commit": {
    title: "A discarded render still charged the customer",
    context:
      "A developer starts an external operation inside a component body because the component 'only renders after submit'. Rendering can repeat or be abandoned, so the supposed one-time call has no safe lifecycle.",
    invariant: "Computing a candidate UI must not cause an irreversible external action.",
    timeline: [
      {
        actor: "User event",
        event: "A submit event queues a non-urgent UI update.",
        state: "Current committed UI remains visible",
      },
      {
        actor: "Render A",
        event: "The component calls a payment API while calculating JSX.",
        state: "External effect started before any commit",
      },
      {
        actor: "Urgent update",
        event: "New work supersedes candidate A. React abandons that render.",
        state: "Candidate A discarded; remote request continues",
      },
      {
        actor: "Render B",
        event: "The component body runs again and starts a second payment.",
        state: "Two remote intents despite one visible commit",
      },
    ],
    alternatives: [
      {
        approach: "Event-driven command",
        fits: "A payment is caused by explicit user intent.",
        cost: "Still needs server authorization, operation identity, and ambiguous-timeout handling.",
      },
      {
        approach: "Effect synchronization",
        fits: "A subscription should follow committed reactive inputs.",
        cost: "Must be safely repeatable with symmetric cleanup; not a substitute for mutation idempotency.",
      },
      {
        approach: "Pure render calculation",
        fits: "Formatting, filtering, and deriving a view from a snapshot.",
        cost: "Expensive calculations may still need profiling or offloading.",
      },
    ],
    verification:
      "Render under Strict Mode and exercise rapid transitions. Assert no external mutation occurs from rendering. Separately test duplicate form submissions against the server's idempotency contract; React rendering behavior cannot enforce payment uniqueness.",
    signals:
      "Correlate one user operation ID with all transport attempts. Count business effects independently from render counts. A Profiler commit is not evidence that render-phase side effects executed only once.",
  },
  "sessions-and-authentication": {
    title: "A revoked editor keeps access through stale claims",
    context:
      "An application stores an editor role in a long-lived signed token. An administrator removes the user's permission, but protected endpoints trust the token's old role until expiry.",
    invariant:
      "A privileged operation must follow the product's stated revocation latency, not an accidental token lifetime.",
    timeline: [
      {
        actor: "Login",
        event: "The provider or app issues a valid token containing editor claims.",
        state: "Token valid · membership editor",
      },
      {
        actor: "Administrator",
        event: "Changes membership to viewer in the authoritative store.",
        state: "Token still says editor · store says viewer",
      },
      {
        actor: "API",
        event: "Verifies the signature but authorizes solely from old claims.",
        state: "Authentication valid; authorization stale",
      },
      {
        actor: "User",
        event: "A forbidden edit succeeds during the unplanned revocation window.",
        state: "Security policy violated despite correct signature verification",
      },
    ],
    alternatives: [
      {
        approach: "Central session/policy lookup",
        fits: "Sensitive actions need prompt revocation.",
        cost: "Adds an authoritative dependency and availability decisions.",
      },
      {
        approach: "Short-lived claims",
        fits: "A bounded delay is explicitly acceptable.",
        cost: "Refresh infrastructure and a remaining revocation window.",
      },
      {
        approach: "Policy-version check",
        fits: "Claims can be checked against a current version or epoch.",
        cost: "Central state reappears; version caches need their own lag budget.",
      },
    ],
    verification:
      "Issue a session, revoke membership, and test the sensitive endpoint before token expiry on more than one application instance. Verify the documented latency and behavior when the policy store is unavailable. Do not fail open by default.",
    signals:
      "Audit authorization decision, policy version, resource, actor, and correlation ID. Never record raw bearer credentials. Distinguish invalid identity from valid identity lacking permission.",
  },
  "request-journey": {
    title: "Three 'fast' services exceed the page deadline",
    context:
      "A dashboard calls three independent dependencies sequentially, each with a generous timeout. Individual p50 metrics look healthy, but tail requests frequently exceed the user's total budget.",
    invariant:
      "All work, including queueing and retries, must fit within an operation-level deadline or produce a deliberate partial result.",
    timeline: [
      {
        actor: "Browser",
        event: "Starts a dashboard operation with a 2.5-second user budget.",
        state: "Budget 2500ms",
      },
      {
        actor: "BFF",
        event: "Waits 900ms for profile before starting independent billing work.",
        state: "1600ms left; avoidable waterfall",
      },
      {
        actor: "Billing",
        event: "Waits 1000ms including a retry. Reporting still has not started.",
        state: "600ms left; downstream per-attempt timeout still 2000ms",
      },
      {
        actor: "Reporting",
        event: "Continues beyond the page budget while the user navigates away.",
        state: "Wasted capacity and confusing partial failure",
      },
    ],
    alternatives: [
      {
        approach: "Parallel independent work",
        fits: "Dependencies do not require one another's result.",
        cost: "Higher instantaneous load; needs bounded concurrency.",
      },
      {
        approach: "Independent reveal boundaries",
        fits: "Optional regions can appear or fail separately.",
        cost: "More product states, skeletons, and local error handling.",
      },
      {
        approach: "Deadline propagation",
        fits: "Every downstream stage can respect remaining time.",
        cost: "Cancellation is cooperative; remote side effects may already commit.",
      },
    ],
    verification:
      "Inject deterministic delays and failures. Verify independent work begins early, total time stays within the stated contract, and optional failure does not erase valid critical content. Test production proxy buffering for streamed regions.",
    signals:
      "Trace queue time, connect time, dependency service time, retries, and abandoned work. Compare p95/p99 by route and device rather than only averaging upstream durations.",
  },
  "transactions-and-isolation": {
    title: "Two valid transactions create an invalid roster",
    context:
      "A service requires at least one on-call engineer. Two engineers concurrently check that someone else is on call, then each disables their own status. The transactions update different rows, so simple row-level conflict detection may not protect the cross-row invariant.",
    invariant: "At least one engineer remains on call after any committed change.",
    timeline: [
      {
        actor: "Transaction A",
        event: "Reads the roster: A and B are both on call.",
        state: "Snapshot sees 2 available",
      },
      {
        actor: "Transaction B",
        event: "Reads the same roster before A commits.",
        state: "Snapshot also sees 2 available",
      },
      {
        actor: "Transaction A",
        event: "Sets A off call and commits.",
        state: "B remains in A's reasoning",
      },
      {
        actor: "Transaction B",
        event: "Sets B off call and commits under an isolation mode permitting the anomaly.",
        state: "No one remains; each local check seemed valid",
      },
    ],
    alternatives: [
      {
        approach: "Serializable transaction",
        fits: "The database can detect the conflicting execution.",
        cost: "The application must retry whole transactions safely.",
      },
      {
        approach: "Lock a coordinating row",
        fits: "All writers follow one explicit roster lock protocol.",
        cost: "Contention and protocol discipline; bypassing writers break the guarantee.",
      },
      {
        approach: "Redesign the invariant representation",
        fits: "The business permits a schema that makes valid state easier to enforce.",
        cost: "May change data access and introduce a single coordination point.",
      },
    ],
    verification:
      "Use barriers to force both transactions to read before either writes. Run against the real database and isolation level. Assert at least one operation aborts or is denied, and verify bounded retry behavior without duplicate external effects.",
    signals:
      "Monitor serialization failures, deadlocks, transaction duration, lock waits, and invariant-violation checks. A transaction success rate alone cannot show business correctness.",
  },
  microfrontends: {
    title: "Independent deployments, incompatible runtime contracts",
    context:
      "The billing remote deploys a new session interface. The shell still provides the old one. Both teams' unit tests pass, but production composition fails only for users who receive the new remote and old shell together.",
    invariant:
      "Any supported combination of independently deployed shell and remote must preserve the integration contract or fail locally with a useful fallback.",
    timeline: [
      {
        actor: "Shell team",
        event: "Publishes session capability v1 to production.",
        state: "All current remotes compatible",
      },
      {
        actor: "Billing team",
        event: "Deploys a remote expecting a renamed required field from v2.",
        state: "Independent release creates version skew",
      },
      {
        actor: "Browser",
        event: "Loads a cached shell v1 and remote v2.",
        state: "The pair was never tested together",
      },
      {
        actor: "Billing screen",
        event: "Crashes or misinterprets auth context.",
        state: "One remote failure may spread without isolation",
      },
    ],
    alternatives: [
      {
        approach: "Versioned compatibility contract",
        fits: "Independent releases need an overlap window.",
        cost: "Multiple supported versions and contract tests.",
      },
      {
        approach: "Route-level containment",
        fits: "Teams own clear product areas.",
        cost: "Cross-route UX and state coordination still need a shell contract.",
      },
      {
        approach: "Return to build-time packages",
        fits: "Runtime independence is not worth the operational burden.",
        cost: "Shared deployment returns, but integration can be checked before release.",
      },
    ],
    verification:
      "Test a compatibility matrix of supported shell and remote versions. Simulate a remote timeout, integrity/load failure, stale asset cache, and a broken optional capability. Confirm the owning team can roll back independently.",
    signals:
      "Include shell version, remote version, contract version, and deployment cohort in error context. Track cross-team incidents and release lead time to verify the architecture buys the autonomy it was chosen for.",
  },
  "scope-and-closures": {
    title: "A closed modal keeps a large dataset alive",
    context:
      "An analytics modal attaches a document listener whose closure references a large parsed dataset. Closing the modal removes its DOM but does not remove the listener. The data remains reachable from the document's listener registry.",
    invariant:
      "Resources owned only by a closed modal must lose all unintended retaining paths when its lifetime ends.",
    timeline: [
      {
        actor: "Modal mount",
        event: "Loads data and creates a key handler closing over it.",
        state: "Dataset reachable through component and listener",
      },
      {
        actor: "Document",
        event: "Registers the key handler as a long-lived listener.",
        state: "Document → listener → closure binding → dataset",
      },
      {
        actor: "Modal close",
        event: "Removes visible UI but omits listener cleanup.",
        state: "The direct component path is gone; listener path remains",
      },
      {
        actor: "Repeated use",
        event: "Every open/close adds another listener and retained dataset.",
        state: "Live memory and duplicate event handling grow",
      },
    ],
    alternatives: [
      {
        approach: "Symmetric unsubscribe",
        fits: "The modal clearly owns the listener lifetime.",
        cost: "Cleanup must run on dependency changes and unmount.",
      },
      {
        approach: "Narrow captured capability",
        fits: "The handler does not need the full dataset.",
        cost: "Must preserve correctness; minimizing capture is not a substitute for teardown.",
      },
      {
        approach: "Bounded shared cache",
        fits: "Reusing the data is intentionally valuable.",
        cost: "Needs eviction, size limits, freshness, and separate ownership.",
      },
    ],
    verification:
      "Repeat the interaction, settle pending work, and compare heap snapshots. Inspect the actual retaining path rather than inferring a leak from one temporary memory peak. Also assert one key press triggers only one active handler.",
    signals:
      "Look at retained size, detached nodes, listener count, and memory after repeated equivalent cycles. Collection timing is nondeterministic; a short delay is not a reliable reclamation test.",
  },
  "node-event-loop": {
    title: "The event loop is free, but requests still queue",
    context:
      "A Node API performs expensive asynchronous password hashing. Main-thread CPU and event-loop delay look acceptable, yet unrelated filesystem-backed work becomes slow because the shared worker pool is saturated.",
    invariant:
      "One workload must not consume unbounded shared capacity required by other latency-sensitive operations.",
    timeline: [
      {
        actor: "Login burst",
        event: "Submits many costly asynchronous hash operations.",
        state: "Worker pool busy; main thread can still schedule callbacks",
      },
      {
        actor: "Other request",
        event: "Queues a filesystem operation that uses the same pool.",
        state: "Execution waits behind hashing workload",
      },
      {
        actor: "Dashboard metrics",
        event: "Reports low event-loop delay and misses the queue bottleneck.",
        state: "Healthy main-thread signal, unhealthy end-to-end latency",
      },
      {
        actor: "Retry policy",
        event: "Adds more work after timeouts without admission control.",
        state: "Queue growth and recovery delay worsen",
      },
    ],
    alternatives: [
      {
        approach: "Admission and concurrency limits",
        fits: "Protecting a costly workload and rejecting excess demand safely.",
        cost: "Some users wait or receive overload responses; fairness matters.",
      },
      {
        approach: "Isolate the workload",
        fits: "Security-sensitive expensive work needs independent capacity.",
        cost: "Worker/process/service operational overhead and new failure boundaries.",
      },
      {
        approach: "Tune pool capacity after measurement",
        fits: "The machine has resources and pool queueing is the proven bottleneck.",
        cost: "More concurrency can increase contention; it does not create CPU capacity.",
      },
    ],
    verification:
      "Load the hashing endpoint while measuring a representative pool-dependent operation. Separate queue delay from execution duration and compare bounded admission with unlimited submission. Keep hashing security parameters intact.",
    signals:
      "Track request concurrency, workload queue age, CPU saturation, dependency latency, and event-loop delay together. No single 'Node is healthy' metric captures every host resource.",
  },
  "state-machines": {
    title: "A cancelled upload returns as successful",
    context:
      "A user starts upload A, cancels it, and starts upload B. The transport or transformation for A does not cooperate fully with cancellation. A late success event from A reaches the state reducer.",
    invariant:
      "Only the active operation may complete the current workflow; obsolete completions must not overwrite newer intent.",
    timeline: [
      { actor: "User", event: "Starts upload A with operation ID A.", state: "uploading(A)" },
      {
        actor: "User",
        event: "Cancels A, then starts B.",
        state: "uploading(B); A may still be running remotely",
      },
      {
        actor: "Old operation",
        event: "A emits a delayed success event.",
        state: "Event carries A, active state carries B",
      },
      {
        actor: "Reducer",
        event: "Checks legal state and operation identity before transitioning.",
        state: "Reject A's obsolete event; remain uploading(B)",
      },
    ],
    alternatives: [
      {
        approach: "Abort plus identity guard",
        fits: "Cooperative I/O cancellation and latest-intent UI behavior.",
        cost: "Server-side side effects still need reconciliation.",
      },
      {
        approach: "Typed reducer/machine",
        fits: "Workflow legality is complex enough to deserve explicit states.",
        cost: "Effects and persistence remain separate responsibilities.",
      },
      {
        approach: "Durable backend job",
        fits: "Work must survive navigation, retries, or process failure.",
        cost: "Job ownership, authorization, status polling/events, and retention.",
      },
    ],
    verification:
      "Control completion order and deliver A's success after B starts. Also test failure, cancel, duplicate completion, and retry with a new operation ID. Assert every accepted event belongs to the active state.",
    signals:
      "Log operation identity and state transition names without private file content. Count ignored stale events to reveal lifecycle problems while treating expected cancellation separately from failures.",
  },
  observability: {
    title: "A healthy average hides a failed release",
    context:
      "A new search release affects a small cohort of low-end mobile devices. Global average latency barely changes, while that cohort experiences long tasks, delayed interactions, and a sharp increase in abandonment.",
    invariant:
      "Release decisions must use the experience of the exposed population and critical tails, not only aggregate averages.",
    timeline: [
      {
        actor: "Release",
        event: "Enables a new client algorithm for a stable 5% cohort.",
        state: "Most traffic remains on old behavior",
      },
      {
        actor: "Affected device",
        event: "Large local sorting creates a long main-thread task.",
        state: "Network remains fast; interaction presentation is delayed",
      },
      {
        actor: "Global dashboard",
        event: "Averages old and new users together.",
        state: "Small overall change masks a severe cohort regression",
      },
      {
        actor: "Investigation",
        event: "Segments field data and captures a representative trace.",
        state: "CPU work identified; rollout can pause with evidence",
      },
    ],
    alternatives: [
      {
        approach: "Cohort-aware field metrics",
        fits: "Quantifying actual release impact.",
        cost: "Privacy, sampling, and cardinality require deliberate design.",
      },
      {
        approach: "Controlled lab trace",
        fits: "Explaining where time goes under representative constraints.",
        cost: "A lab cannot establish the real population distribution alone.",
      },
      {
        approach: "Automatic release guard",
        fits: "A trusted SLI and enough traffic support safe decisions.",
        cost: "False positives, low-volume cohorts, and data delay need handling.",
      },
    ],
    verification:
      "Define the release cohort, baseline, relevant device segment, and rollback threshold before rollout. Reproduce the expensive interaction under controlled CPU constraints, then verify the improvement in field measurements.",
    signals:
      "Use bounded dimensions for route, release, device class, and outcome. Keep entity identifiers in appropriately controlled traces or logs instead of creating unlimited metric series.",
  },
};
