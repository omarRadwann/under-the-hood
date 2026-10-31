import { lesson } from "./helpers";

export const data = [
  lesson("data", {
    slug: "cache-invalidation",
    title: "Cache design & stampede control",
    description:
      "Specify ownership, key dimensions, freshness budgets, eviction, and invalidation.",
    lab: "cache",
    level: "Deep dive",
    mental:
      "A cache is a replicated representation with a consistency policy. Faster reads are the benefit; stale data, memory use, coordination, and debugging complexity are the price. If you cannot state acceptable staleness, you have not finished the design.",
    steps: [
      {
        title: "Write the cache contract",
        body: "Define key dimensions, value shape, storage location, freshness, tenant scope, maximum size, and invalidation owner. A TTL bounds some stale windows but does not synchronize a write with readers. Negative caching of misses requires its own short-lived policy.",
      },
      {
        title: "Prevent synchronized misses",
        body: "Popular keys expiring together can overload the origin. Request coalescing, per-key single-flight, staggered TTLs, or stale-while-revalidate can reduce pressure. Distributed locks add leases and failure cases; use them only when simpler duplicate-work tolerance is insufficient.",
      },
      {
        title: "Reconcile writes and failures",
        body: "Cache-aside reads load on miss; writes update the source and invalidate or update representations. Race ordering can reinsert stale data after invalidation. Versioned keys, event-driven invalidation, or bounded staleness may be needed. Measure useful hit rate, origin load, and invalidation lag rather than hit rate alone.",
      },
    ],
    code: `const inFlight = new Map<string, Promise<Product>>();\nfunction singleFlight(key: string, load: () => Promise<Product>) {\n  const existing = inFlight.get(key);\n  if (existing) return existing;\n  const promise = Promise.resolve().then(load).finally(() => inFlight.delete(key));\n  inFlight.set(key, promise);\n  return promise;\n}\n// Register before invoking load; synchronous throws become rejections.\n// No recursive same-key dependency, cancellation, or distributed coordination.\n// This coalesces in-flight work; it does not retain settled values.`,
    pitfalls: [
      "No maximum cache size.",
      "Caching authorization-dependent data under a public key.",
      "Assuming a TTL solves every invalidation race.",
    ],
    practice:
      "Model a write racing a slow cache refill. Show how stale data can be reinserted, then choose a version or freshness strategy for your use case.",
    quiz: {
      question: "What does process-local single-flight prevent?",
      choices: [
        "Duplicate simultaneous loads for one key in that process",
        "Every distributed race",
        "All stale data",
      ],
      answer: 0,
      explanation:
        "It coalesces local in-flight work. Separate instances and post-write consistency still need their own strategy.",
    },
  }),
  lesson("data", {
    slug: "transactions-and-isolation",
    title: "Transactions & isolation levels",
    description: "Protect invariants against lost updates, write skew, and concurrent operations.",
    level: "Deep dive",
    mental:
      "A transaction groups work under database guarantees. Atomicity does not imply that every read saw the latest global state or that all concurrent anomalies disappear. The invariant determines which isolation, locks, constraints, or conditional writes are required.",
    steps: [
      {
        title: "State the invariant first",
        body: "Examples include non-negative inventory, one active reservation, or balanced ledger entries. Encode constraints close to the data. A transaction around two naive application statements may still permit an anomaly under the chosen isolation level.",
      },
      {
        title: "Understand the database's actual isolation",
        body: "PostgreSQL Read Committed uses a new statement snapshot; Repeatable Read provides a stable transaction snapshot but can allow write-skew-style anomalies. Serializable detects conflicting executions and may abort transactions. Other databases use different behavior under similar names.",
      },
      {
        title: "Retry the whole unit safely",
        body: "Serialization failures and deadlocks need bounded retries of the entire transaction. External side effects such as emails or payments should not be repeated inside an automatically retried unit. Keep transactions short and use an outbox for reliable post-commit work when needed.",
      },
    ],
    code: `-- PostgreSQL; accounts.id is unique and balance is NOT NULL.\nBEGIN;\nDO $$\nBEGIN\n  UPDATE accounts SET balance = balance - 100\n    WHERE id = 'A' AND balance >= 100;\n  IF NOT FOUND THEN RAISE EXCEPTION 'Debit rejected'; END IF;\n  UPDATE accounts SET balance = balance + 100 WHERE id = 'B';\n  IF NOT FOUND THEN RAISE EXCEPTION 'Credit account missing'; END IF;\nEND;\n$$;\nCOMMIT;\n-- Any raised exception aborts the transaction, including the debit.\n-- Enforce schema/domain constraints; retry deadlocks as a whole unit.`,
    language: "sql",
    pitfalls: [
      "Assuming BEGIN alone prevents every race.",
      "Sending email inside a transaction callback that may be retried.",
      "Holding transactions open across slow network calls.",
    ],
    practice:
      "Run two concurrent booking transactions against one remaining slot. Demonstrate the anomaly, then protect it using a constraint or atomic operation.",
    quiz: {
      question: "Serializable isolation can require the application to…",
      choices: [
        "Retry an aborted transaction",
        "Remove all constraints",
        "Share one database connection globally",
      ],
      answer: 0,
      explanation:
        "Serializable execution can reject a conflicting transaction. Correct applications handle the retryable failure for the whole unit.",
    },
    sources: [
      {
        title: "PostgreSQL · Transaction isolation",
        url: "https://www.postgresql.org/docs/current/transaction-iso.html",
      },
    ],
  }),
  lesson("data", {
    slug: "indexes-and-query-plans",
    title: "Indexes, query plans & pagination",
    description:
      "Trade read speed against write amplification and validate plans with real cardinality.",
    mental:
      "An index is another data structure the database must maintain. It can reduce search work for suitable queries, but costs storage and writes. The planner chooses among strategies based on statistics, selectivity, ordering, and estimated cost.",
    steps: [
      {
        title: "Match the actual access pattern",
        body: "Composite index ordering matters for filtering and sorting, and the most useful order depends on predicates and workload. Partial indexes cover a subset of rows. An index existing does not mean the planner should use it for a query that returns most of the table.",
      },
      {
        title: "Inspect actual execution",
        body: "EXPLAIN shows estimates; EXPLAIN ANALYZE executes the statement and reports actual behavior. Use caution for mutations. Compare estimated and actual rows, loops, buffers, sorts, and time. Stale statistics or skew can produce poor plans.",
      },
      {
        title: "Paginate with a stable order",
        body: "Large OFFSET scans can become expensive and drift under concurrent changes. Keyset pagination uses a stable composite cursor such as created_at plus id. Define ordering, tie-breakers, null behavior, and snapshot expectations rather than using an unstable timestamp alone.",
      },
    ],
    code: `CREATE INDEX projects_tenant_created_idx\n  ON projects (tenant_id, created_at DESC, id DESC);\n\nSELECT id, name, created_at FROM projects\nWHERE tenant_id = $1\n  AND (created_at, id) < ($2, $3)\nORDER BY created_at DESC, id DESC\nLIMIT 50;`,
    language: "sql",
    pitfalls: [
      "Adding indexes without considering write cost.",
      "Using an unstable pagination order.",
      "Running EXPLAIN ANALYZE on a destructive query unintentionally.",
    ],
    practice:
      "Generate a million-row fixture with skewed tenant sizes. Compare offset and keyset plans for both a small tenant and the largest tenant.",
    quiz: {
      question: "Why include a unique tie-breaker in a pagination cursor?",
      choices: [
        "To make ordering deterministic for equal timestamps",
        "To encrypt the rows",
        "To avoid authorization",
      ],
      answer: 0,
      explanation:
        "Many rows can share a timestamp. A unique tie-breaker creates a strict stable ordering for page boundaries.",
    },
  }),
  lesson("data", {
    slug: "n-plus-one",
    title: "N+1, batching & data ownership",
    description:
      "Detect repeated data access and batch without leaking cached results across users.",
    mental:
      "N+1 occurs when a list query is followed by one dependent query per item. The problem is repeated access and round trips, not merely the number of source-code functions. Batching, joins, and preloading solve different shapes of the same workload.",
    steps: [
      {
        title: "Measure the fanout",
        body: "Trace a page or resolver execution and count dependency calls as list size grows. A local database may hide the issue until network latency or production cardinality increases. Avoid fetching entire tables to reduce query count if that creates massive payloads.",
      },
      {
        title: "Choose join, preload, or batch",
        body: "Joins can efficiently return related data but may multiply rows for several one-to-many relationships. Batched IN queries or request-scoped loaders can deduplicate repeated IDs. Preserve input order and missing-value behavior in the batch result.",
      },
      {
        title: "Scope caches to the security context",
        body: "A request-scoped loader naturally limits memoization lifetime. A process-global loader can leak user-specific results or serve stale permissions. Make authorization part of data access and do not treat deduplication as a substitute for tenant scoping.",
      },
    ],
    code: `const projects = await listProjects(ctx);\nconst ownerIds = [...new Set(projects.map(p => p.ownerId))];\nconst owners = await listAuthorizedUsers(ctx, ownerIds);\nconst byId = new Map(owners.map(user => [user.id, user]));\nreturn projects.map(project => ({\n  ...project, owner: byId.get(project.ownerId) ?? null,\n}));`,
    pitfalls: [
      "A globally cached loader carrying authorization-specific data.",
      "Replacing N queries with an unbounded full-table fetch.",
      "Returning batch results in database order rather than requested-key order.",
    ],
    practice:
      "Build a trace assertion that query count stays bounded when a project list grows from 10 to 100 rows. Verify missing and unauthorized owners remain safe.",
    quiz: {
      question:
        "What is a useful default lifetime for authorization-sensitive batching memoization?",
      choices: [
        "One request",
        "Forever in a global Map",
        "Until the developer restarts their laptop",
      ],
      answer: 0,
      explanation:
        "Request scope avoids unintended cross-user reuse and bounds staleness, while still deduplicating repeated access in that request.",
    },
  }),
  lesson("data", {
    slug: "optimistic-ui",
    title: "Optimistic UI & reconciliation",
    description:
      "Predict outcomes locally without confusing provisional state with committed truth.",
    lab: "react",
    mental:
      "Optimistic UI is a temporary projection of an intended server operation. It improves perceived responsiveness only when failure, reordering, duplication, and server normalization are handled. The server remains authoritative for shared invariants.",
    steps: [
      {
        title: "Represent pending intent explicitly",
        body: "Give each operation an identity and display a pending state. Temporary IDs need reconciliation with canonical server IDs. Avoid merging pending and confirmed records in ways that create duplicates when a subscription event arrives before the mutation response.",
      },
      {
        title: "Choose rollback versus rebase",
        body: "Restoring one old snapshot can erase newer successful optimistic changes. For overlapping edits, rebase remaining pending operations on the confirmed state or invalidate and refetch. Conflict handling depends on whether operations commute and whether the server returns versions.",
      },
      {
        title: "Limit optimism by consequence",
        body: "A like toggle is usually easy to reverse. A payment, permission grant, or inventory commitment may need explicit pending confirmation. Communicate uncertainty honestly and define offline and retry behavior around logical operation identity.",
      },
    ],
    code: `type PendingEdit = { id: string; patch: Partial<Project> };\nfunction projectView(confirmed: Project, pending: PendingEdit[]) {\n  return pending.reduce(\n    (view, operation) => ({ ...view, ...operation.patch }),\n    confirmed,\n  );\n}\n// On confirmation, update the base and remove only that operation.`,
    pitfalls: [
      "Rolling back a whole snapshot over newer edits.",
      "Treating optimistic success as proof a payment settled.",
      "Duplicate records after a push event and mutation response race.",
    ],
    practice:
      "Simulate two optimistic renames where the first fails after the second succeeds. Preserve the second result and explain the reconciliation algorithm.",
    quiz: {
      question: "Why can restoring the pre-mutation snapshot be wrong?",
      choices: [
        "It can erase later valid changes",
        "Snapshots cannot be copied",
        "The server always responds in order",
      ],
      answer: 0,
      explanation:
        "Concurrent optimistic operations require operation-aware reconciliation; an old full snapshot may overwrite newer intent or confirmed state.",
    },
  }),
  lesson("data", {
    slug: "events-and-outbox",
    title: "Events, outbox & delivery guarantees",
    description: "Publish committed domain facts without losing them between database and broker.",
    level: "Deep dive",
    mental:
      "Writing a database row and publishing an event are two separate commits unless a stronger protocol coordinates them. The transactional outbox stores the business change and a pending event in one database transaction, then delivers asynchronously.",
    steps: [
      {
        title: "Close the dual-write gap",
        body: "Publishing before commit can announce an operation that later rolls back. Publishing after commit can fail after the state changed. An outbox row committed with the business data provides a durable record for a relay to publish.",
      },
      {
        title: "Expect duplicate delivery",
        body: "The relay may publish successfully and crash before marking the row delivered. At-least-once delivery therefore requires consumers to deduplicate or implement idempotent effects. An event ID and consumer-specific processed record can support atomic processing with the consumer's own data.",
      },
      {
        title: "Design evolution and recovery",
        body: "Version event schemas, partition ordering where required, and avoid assuming global total order. Monitor outbox age, retries, dead letters, and consumer lag. Define replay behavior, retention, and personal-data constraints before accumulating an immutable event history.",
      },
    ],
    code: `await db.transaction(async tx => {\n  const order = await tx.orders.create(input);\n  await tx.outbox.create({\n    id: crypto.randomUUID(), type: 'order.created.v1',\n    aggregateId: order.id, payload: { orderId: order.id },\n  });\n});\n// A separate relay publishes and retries outbox entries.`,
    pitfalls: [
      "Claiming exactly-once business effects because a broker deduplicates messages.",
      "Sending external side effects before the transaction commits.",
      "No replay or poison-message policy.",
    ],
    practice:
      "Crash the relay after publishing but before acknowledging the outbox row. Show how the consumer prevents a duplicate invoice.",
    quiz: {
      question: "What does the transactional outbox primarily address?",
      choices: [
        "The atomicity gap between business persistence and event publication intent",
        "All cross-service transactions",
        "Browser rendering speed",
      ],
      answer: 0,
      explanation:
        "It durably records publication intent in the same transaction as the business change. Delivery and consumer idempotency still need handling.",
    },
  }),
  lesson("data", {
    slug: "consistency-models",
    title: "Consistency, replication & lag",
    description: "Explain stale reads, read-your-writes, and choices under network partitions.",
    lab: "cache",
    level: "Deep dive",
    mental:
      "Consistency is about which histories readers may observe. Replicas and caches improve availability or latency but can lag. A user who just saved a setting usually expects to read their own write even when other readers can tolerate eventual consistency.",
    steps: [
      {
        title: "Name the promised behavior",
        body: "Linearizability, causal relationships, monotonic reads, and read-your-writes are distinct guarantees. Eventual consistency alone does not specify a bounded convergence time. Describe user-visible invariants rather than labeling an entire system strong or weak.",
      },
      {
        title: "Route freshness-sensitive reads",
        body: "A read from a lagging replica immediately after a primary write can look like data loss. Use primary reads, version/session tokens, or another explicit strategy for freshness-sensitive flows. Cache invalidation and replica lag can interact to refill a cache with old data.",
      },
      {
        title: "Understand partitions precisely",
        body: "CAP concerns consistency and availability in the presence of a partition; it is not a casual menu where every database permanently picks two letters. Real systems make per-operation choices and add latency, quorum, durability, and recovery tradeoffs beyond that theorem.",
      },
    ],
    code: `const saved = await primary.updateProfile(input);\n// Return the canonical version from the write.\nsetProfile(saved);\n// A following read can request at least saved.version\n// or use an authoritative read path, according to the contract.`,
    pitfalls: [
      "Calling eventual consistency a fixed 100ms delay without a guarantee.",
      "Invalidating a cache then refilling from a lagging replica.",
      "Explaining CAP as an unconditional pick-any-two slogan.",
    ],
    practice:
      "Design a user-profile flow with replica reads. State exactly how the writer sees their update and what other sessions may observe during lag.",
    quiz: {
      question: "A successful write followed by a stale replica read can violate…",
      choices: ["Read-your-writes expectations", "JavaScript lexical scope", "HTTP content types"],
      answer: 0,
      explanation:
        "The session may not observe its own committed update unless the read path supplies that guarantee.",
    },
  }),
  lesson("data", {
    slug: "schema-evolution",
    title: "Schema evolution & safe migrations",
    description: "Deploy database changes while old and new application versions coexist.",
    mental:
      "A rolling deployment is a compatibility window. Old code and new code may read and write the same database simultaneously. Safe schema evolution separates expansion, migration, and contraction rather than changing every layer atomically in imagination.",
    steps: [
      {
        title: "Expand compatibly",
        body: "Add nullable columns or new structures that old code can tolerate. Understand database locking and index-build behavior for large tables. New code may temporarily dual-write or read with a fallback while data is being migrated.",
      },
      {
        title: "Backfill in bounded batches",
        body: "Large backfills can overload replication, hold locks, or amplify cache churn. Use resumable batches, progress markers, throttling, and invariant checks. New writes during backfill require a reconciliation strategy so the migration does not overwrite newer data.",
      },
      {
        title: "Contract after evidence",
        body: "Only remove old columns and compatibility logic after all readers and writers have moved and rollback requirements are understood. Application rollback does not automatically roll back data. Record the point where a migration becomes incompatible with the old binary.",
      },
    ],
    code: `1. Add display_name as nullable.\n2. Deploy writers that populate old + new fields.\n3. Backfill display_name in resumable batches.\n4. Deploy readers that prefer display_name.\n5. Verify all clients and jobs migrated.\n6. Remove old field only after the compatibility window.`,
    language: "text",
    pitfalls: [
      "Renaming or dropping a column during the first rolling deploy.",
      "Running one giant backfill transaction on a busy table.",
      "Assuming binary rollback restores the previous data model.",
    ],
    practice:
      "Write an expand/contract plan for splitting a full_name column into structured fields, including background jobs, old clients, rollback, and international naming constraints.",
    quiz: {
      question: "When is removing the old field safest?",
      choices: [
        "After all readers/writers migrate and compatibility is verified",
        "Before deploying new code",
        "Halfway through the backfill",
      ],
      answer: 0,
      explanation:
        "Contraction happens after the migration and coexistence window are complete, not while old software still depends on the schema.",
    },
  }),
];
