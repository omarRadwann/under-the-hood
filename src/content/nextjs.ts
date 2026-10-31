import { lesson } from "./helpers";

export const nextjs = [
  lesson("nextjs", {
    slug: "app-router",
    title: "App Router & route composition",
    description:
      "Understand segments, layouts, templates, parallel slots, and ownership of navigation state.",
    lab: "streaming",
    mental:
      "The URL selects a tree of route segments. Layouts compose persistent structure around changing leaves. Routing is therefore a state and ownership model, not just a table mapping strings to page components.",
    steps: [
      {
        title: "Build the segment tree",
        body: "Folders define segments; page makes a segment publicly reachable. Route groups organize without adding URL paths. Dynamic segments capture parameters, which current Next.js exposes through asynchronous route APIs. Keep data requirements near the segment that owns them.",
      },
      {
        title: "Choose preservation deliberately",
        body: "Shared layouts preserve state across applicable navigations, while templates create fresh instances when their identity changes. Parallel routes use named slots for independent views. Unmatched slots on a hard reload need appropriate defaults; soft navigation can preserve previous slot state.",
      },
      {
        title: "Design direct entry as well as transitions",
        body: "Intercepting routes can show a modal during client navigation and a full page on direct entry. Test refresh, deep links, back, and forward. A route that works only from one navigation path has an incomplete product contract.",
      },
    ],
    code: `app/\n  layout.tsx\n  (workspace)/\n    layout.tsx\n    projects/\n      page.tsx\n      [id]/\n        page.tsx\n        loading.tsx\n        error.tsx\n  api/health/route.ts`,
    language: "text",
    pitfalls: [
      "Assuming layouts remount on every sibling navigation.",
      "Testing intercepted modals only through client navigation.",
      "Duplicating authorization assumptions in route structure.",
    ],
    practice:
      "Design a project dashboard with a persistent sidebar, a detail modal, and a direct-link detail page. List expected state behavior for soft navigation, reload, and browser back.",
    quiz: {
      question:
        "Which is appropriate when a route wrapper should intentionally reset child state on navigation?",
      choices: [
        "A template boundary",
        "A random key in every layout render",
        "A global mutable store",
      ],
      answer: 0,
      explanation:
        "Templates provide a deliberate fresh-instance boundary. Shared layouts are intended to preserve structure and state.",
    },
    sources: [
      {
        title: "Next.js · Layouts and pages",
        url: "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
      },
    ],
  }),
  lesson("nextjs", {
    slug: "rendering-strategies",
    title: "SSR, static rendering & PPR",
    description:
      "Choose freshness and delivery boundaries instead of memorizing rendering acronyms.",
    lab: "streaming",
    level: "Deep dive",
    mental:
      "Rendering strategy decides when a piece of UI is computed and which users can share it. Static shells, cached content, and request-specific content can coexist. The important questions are freshness, personalization, latency, and invalidation ownership.",
    steps: [
      {
        title: "Identify what is shareable",
        body: "Public product descriptions may be shared; a user's basket and permissions usually cannot. Prerendering can deliver stable HTML quickly. Server rendering at request time enables request-specific data but includes compute and dependency latency in the request path.",
      },
      {
        title: "Mix a shell with runtime content",
        body: "With Cache Components enabled, Next.js can prerender static and cached portions and stream runtime-dependent content behind Suspense. In current documentation this model is Partial Prerendering. The framework's behavior depends on its exact version and configuration.",
      },
      {
        title: "Budget the critical path",
        body: "Streaming improves progressive delivery but does not accelerate the underlying query. Start independent work early and choose reveal boundaries around meaningful UI. Evaluate cache misses, cold starts, status-code behavior after streaming begins, and failure UX rather than only warm-path TTFB.",
      },
    ],
    code: `export default function Page() {\n  return <>\n    <PublicHeader />\n    <Suspense fallback={<CatalogSkeleton />}>\n      <Catalog />\n    </Suspense>\n    <Suspense fallback={<BasketSkeleton />}>\n      <PersonalBasket />\n    </Suspense>\n  </>;\n}\n// Cache configuration belongs to the data/UI owners.`,
    pitfalls: [
      "Treating a whole app as exclusively static or exclusively dynamic.",
      "Sharing personalized content in a public cache.",
      "Assuming streaming removes database latency.",
    ],
    practice:
      "Create a rendering budget for a product page. Mark each region as shareable, user-specific, or browser-only and explain its failure and freshness policy.",
    quiz: {
      question: "What does partial prerendering let you combine?",
      choices: [
        "A static shell with request-time streamed regions",
        "Only browser rendering",
        "A shared session for every visitor",
      ],
      answer: 0,
      explanation:
        "The model separates stable prerenderable content from runtime work behind appropriate boundaries.",
    },
    sources: [
      {
        title: "Next.js · Caching and prerendering",
        url: "https://nextjs.org/docs/app/getting-started/caching",
      },
    ],
  }),
  lesson("nextjs", {
    slug: "nextjs-caching",
    title: "Cache Components & invalidation",
    description:
      "Trace cache keys, scope, lifetime, tags, and the consistency implications of revalidation.",
    lab: "cache",
    level: "Deep dive",
    minutes: 28,
    mental:
      "There is no single Next.js cache. React request memoization, server-side cached computation, prerendered output, browser router state, and HTTP caches have different owners and lifetimes. First name the layer; then decide its key, freshness, invalidation, and tenant isolation.",
    steps: [
      {
        title: "State the version and mode",
        body: "This lesson targets Next.js 16.4 with Cache Components enabled for the illustrated server examples. use cache, cacheLife, and cacheTag describe caching explicitly. Legacy segment configuration and older fetch defaults should not be mixed into this mode without checking migration documentation. The learning app itself serves static curriculum data and does not enable this teaching example's server cache configuration.",
      },
      {
        title: "Design the key and storage scope",
        body: "Cached function arguments and captured serializable inputs participate in its key, along with framework identity and build information. Runtime APIs such as cookies are read outside a shared cache scope and passed intentionally. Current default runtime storage is per-instance memory and ephemeral in serverless; remote caching needs a suitable shared handler.",
      },
      {
        title: "Choose a consistency contract",
        body: "Lifetime profiles express freshness behavior. revalidateTag(tag, 'max') supports stale-while-revalidate semantics; updateTag in a Server Action provides immediate expiry for read-your-own-writes flows. Neither replaces database authorization or a transaction. Invalidate every relevant representation without accidentally purging unrelated tenants.",
      },
      {
        title: "Observe misses and stale delivery",
        body: "Measure hit rate by key class, origin latency on misses, invalidation lag, and cache stampedes. A new deployment can change key scope. Revalidation is a distributed workflow, so test two server instances and a client with existing router state rather than testing only a hard reload.",
      },
    ],
    code: `// next.config.ts: { cacheComponents: true, partialPrefetching: true }\nimport { cacheLife, cacheTag } from 'next/cache';\n\nexport async function getProduct(id: string) {\n  'use cache';\n  cacheLife('minutes');\n  cacheTag('product:' + id);\n  return db.product.findUnique({ where: { id } });\n}\n// A Server Action can call updateTag('product:' + id)\n// after an authorized, validated database mutation.`,
    pitfalls: [
      "Teaching Next 14 fetch defaults as current universal behavior.",
      "Caching session-derived data without an isolation-safe key.",
      "Assuming runtime memory is shared across serverless instances.",
      "Equating a tag invalidation with a database transaction.",
    ],
    practice:
      "Specify a cache contract for inventory, product copy, and a personalized price. For each, write the key, lifetime, stale-data budget, invalidation trigger, and an integration test for two users.",
    quiz: {
      question:
        "Which API is intended for immediate expiry in a Server Action read-your-own-writes flow?",
      choices: ["updateTag", "useMemo", "A browser hard reload"],
      answer: 0,
      explanation:
        "updateTag expires tagged entries immediately in Server Actions. revalidateTag with the max profile serves stale content while revalidating, a different consistency contract.",
    },
    sources: [
      { title: "Next.js · Caching", url: "https://nextjs.org/docs/app/getting-started/caching" },
      {
        title: "Next.js · updateTag",
        url: "https://nextjs.org/docs/app/api-reference/functions/updateTag",
      },
      {
        title: "Next.js · revalidateTag",
        url: "https://nextjs.org/docs/app/api-reference/functions/revalidateTag",
      },
    ],
  }),
  lesson("nextjs", {
    slug: "server-actions",
    title: "Server Actions & mutation boundaries",
    description: "Treat every Server Function entry point as an exposed mutation API.",
    lab: "network",
    mental:
      "A Server Action is a framework-integrated server entry point, not a trusted private function because its caller happens to be a React form. Its arguments and caller identity are untrusted at the boundary. Transport convenience does not provide business authorization.",
    steps: [
      {
        title: "Authenticate and validate at the entry",
        body: "Resolve the current session on the server, validate input with a runtime schema, and authorize the specific resource and operation. Client-provided user IDs, prices, roles, and hidden fields are not authoritative. Avoid relying on a layout redirect as the only gate.",
      },
      {
        title: "Commit atomically and handle retries",
        body: "Keep multi-write invariants inside a transaction. Use idempotency for operations that must tolerate repeat submission, and enforce uniqueness where the data lives. Return a deliberate error model suitable for a form without leaking internal exceptions or secrets.",
      },
      {
        title: "Refresh the representations you own",
        body: "After successful persistence, invalidate relevant cache tags or paths with the intended consistency semantics. React action-state and pending APIs can represent progress; optimistic UI needs reconciliation on failure. Business success must not depend solely on a button being disabled.",
      },
    ],
    code: `'use server';\nexport async function renameProject(form: FormData) {\n  const session = await requireSession();\n  if (form.getAll('id').length !== 1 || form.getAll('name').length !== 1)\n    throw new Error('Expected one id and one name');\n  const input = RenameProjectSchema.parse({\n    id: form.get('id'), name: form.get('name'),\n  });\n  // This application port enforces current authorization with the write.\n  await projectCommands.renameAuthorized({\n    actorId: session.user.id, id: input.id, name: input.name,\n  });\n  updateTag('project:' + input.id);\n}\n// Schema validates strings, lengths, and domain constraints.\n// renameAuthorized must use the domain's atomic predicate/locking/isolation policy.`,
    pitfalls: [
      "Trusting a resource ID because it came from your own UI.",
      "Performing authorization only in a parent layout.",
      "Showing optimistic success without a rollback or reconciliation path.",
    ],
    practice:
      "Threat-model a project rename action. Submit it as another user, with an oversized name, with an expired session, and twice concurrently.",
    quiz: {
      question: "Where should operation-specific authorization be enforced?",
      choices: ["Only in a hidden button", "At the server mutation/data boundary", "Only in CSS"],
      answer: 1,
      explanation:
        "An attacker can call the endpoint without using your UI. The server boundary must authenticate and authorize the requested operation.",
    },
    sources: [
      { title: "Next.js · Data security", url: "https://nextjs.org/docs/app/guides/data-security" },
    ],
  }),
  lesson("nextjs", {
    slug: "route-handlers-and-bff",
    title: "Route Handlers & the BFF",
    description:
      "Choose a client-facing API boundary without creating unnecessary internal HTTP hops.",
    lab: "network",
    mental:
      "A backend for frontend adapts backend capabilities to a particular client experience. A Route Handler is one way to implement it. A Server Component that already runs next to the data layer often should call that layer directly instead of requesting its own HTTP endpoint.",
    steps: [
      {
        title: "Identify who needs HTTP",
        body: "Browser clients, webhooks, mobile clients, and external integrations need protocol boundaries. Internal server code can share application services directly. An internal fetch can introduce additional latency, deployment coupling, duplicate auth handling, and failures resolving a self URL during build.",
      },
      {
        title: "Translate contracts explicitly",
        body: "Validate request data, map domain errors to stable status codes, and return a minimal client DTO. Keep upstream credentials server-side. Set deliberate cache and content-type headers and avoid forwarding every incoming header to an upstream service.",
      },
      {
        title: "Preserve operational behavior",
        body: "Enforce deadlines, bounded payload sizes, cancellation where supported, trace propagation, and redacted logs. Verify webhook signatures over the raw body before parsing when the provider's protocol requires it. Make the BFF an adapter rather than a second domain model.",
      },
    ],
    code: `export async function GET(request: Request) {\n  const session = await requireSession();\n  const url = new URL(request.url);\n  const query = SearchSchema.parse(Object.fromEntries(url.searchParams));\n  const result = await searchService.execute(session, query);\n  return Response.json(result, {\n    headers: { 'Cache-Control': 'private, no-store' },\n  });\n}`,
    pitfalls: [
      "Fetching your own Route Handler from every Server Component.",
      "Exposing upstream tokens in client props.",
      "Turning the BFF into a collection of undocumented pass-through endpoints.",
    ],
    practice:
      "Draw separate call paths for a Server Component, a browser search box, and a payment webhook. Identify where an HTTP boundary is necessary in each.",
    quiz: {
      question:
        "A Server Component needs data from a co-located application service. The default call path should be…",
      choices: [
        "Direct service call where suitable",
        "Always an HTTP call to its own Route Handler",
        "A browser-only fetch",
      ],
      answer: 0,
      explanation:
        "Use HTTP when a protocol boundary is required. Co-located server code can share a service without an unnecessary self-request.",
    },
    sources: [
      {
        title: "Next.js · Backend for frontend",
        url: "https://nextjs.org/docs/app/guides/backend-for-frontend",
      },
    ],
  }),
  lesson("nextjs", {
    slug: "streaming-boundaries",
    title: "Streaming & reveal boundaries",
    description: "Design independent loading, failure, and hydration behavior for real screens.",
    lab: "streaming",
    mental:
      "A boundary is a product decision about what can appear or fail independently. Streaming reveals useful regions while slower work continues. A page full of tiny spinners may technically stream but communicate less than one coherent skeleton.",
    steps: [
      {
        title: "Start independent work before awaiting",
        body: "A parent that awaits all data before returning its children creates a waterfall that nested Suspense cannot undo. Start independent work early or let independent async components own it. Keep required authorization ahead of sensitive data access.",
      },
      {
        title: "Design the fallback geometry",
        body: "Reserve space to reduce layout shift. Put boundaries around meaningful regions such as recommendations, comments, or a basket. Consider how already revealed content should behave during transitions and whether a new fallback would be disorienting.",
      },
      {
        title: "Test transport behavior",
        body: "Proxies and compression can buffer streaming output. HTTP headers and status codes may already be sent before a late error occurs. Inspect the actual response timeline and verify error recovery, accessibility announcements, and partial failure under production-like hosting.",
      },
    ],
    code: `export default function Dashboard() {\n  return <main>\n    <DashboardHeader />\n    <Suspense fallback={<RevenueSkeleton />}>\n      <Revenue />\n    </Suspense>\n    <Suspense fallback={<ActivitySkeleton />}>\n      <Activity />\n    </Suspense>\n  </main>;\n}`,
    pitfalls: [
      "Awaiting all data above every Suspense boundary.",
      "Using skeletons with dimensions unrelated to the final UI.",
      "Assuming local streaming means the production proxy will not buffer.",
    ],
    practice:
      "Throttle two independent dashboard queries. Verify the fast region reveals first, the layout stays stable, and failure in one region does not erase the other.",
    quiz: {
      question:
        "Can a nested Suspense boundary remove a fetch waterfall already awaited by its parent?",
      choices: ["Yes, automatically", "No", "Only with a different CSS class"],
      answer: 1,
      explanation:
        "The child cannot begin rendering until the awaited parent proceeds. Data ownership and work initiation must be restructured.",
    },
  }),
  lesson("nextjs", {
    slug: "proxy-and-runtime",
    title: "Proxy, runtimes & deployment constraints",
    description:
      "Place cross-cutting request logic without confusing it with an authorization boundary.",
    mental:
      "Framework runtime names describe capabilities and deployment placement, not security guarantees. In Next.js 16, the middleware file convention is renamed to proxy. Use request interception for appropriate routing concerns, while enforcing authorization close to data and mutations.",
    steps: [
      {
        title: "Keep request interception focused",
        body: "Redirects, URL normalization, locale selection, and coarse optimistic checks may belong in Proxy. Database-heavy permission decisions are usually better placed in application services. Matchers must deliberately include or exclude assets, API endpoints, and prefetch traffic.",
      },
      {
        title: "Audit capability requirements",
        body: "Node APIs, connection handling, request lifetimes, and geographic placement vary by runtime and host. Current Proxy uses the Node.js runtime; do not assume older middleware Edge-runtime examples describe it. Cache Components requires a compatible Node runtime rather than blindly enabling an Edge configuration.",
      },
      {
        title: "Treat deployments as distributed systems",
        body: "Instance memory is not durable storage. Multiple replicas need shared session, rate-limit, and cache strategies when correctness requires coordination. Specify environment variable exposure, graceful shutdown, timeouts, and rollback compatibility across old and new application versions.",
      },
    ],
    code: `// proxy.ts — Next.js 16 convention\nimport { NextResponse, type NextRequest } from 'next/server';\nexport function proxy(request: NextRequest) {\n  if (request.nextUrl.pathname === '/old-docs') {\n    return NextResponse.redirect(new URL('/learn', request.url));\n  }\n  return NextResponse.next();\n}\nexport const config = { matcher: ['/old-docs'] };`,
    pitfalls: [
      "Using a proxy redirect as the only protection for a mutation.",
      "Persisting authoritative sessions in one instance's memory.",
      "Copying runtime advice from an older major version without checking.",
    ],
    practice:
      "Write a deployment capability checklist for a stateful API, an image-heavy public page, and a streaming dashboard. State which requirements force runtime or hosting choices.",
    quiz: {
      question:
        "A request is allowed through Proxy. Does that eliminate resource-level authorization later?",
      choices: ["Yes", "No", "Only for POST"],
      answer: 1,
      explanation:
        "Interception is not a substitute for authoritative authorization at the data and mutation boundaries.",
    },
    sources: [
      {
        title: "Next.js · Proxy",
        url: "https://nextjs.org/docs/app/api-reference/file-conventions/proxy",
      },
    ],
  }),
  lesson("nextjs", {
    slug: "errors-and-recovery",
    title: "Errors, redirects & recovery",
    description:
      "Design local failure boundaries and distinguish missing resources from broken dependencies.",
    mental:
      "A useful error boundary limits the blast radius and gives the user a credible recovery path. Not-found, unauthorized, validation failure, transient dependency failure, and programming errors are different outcomes and deserve different handling.",
    steps: [
      {
        title: "Classify at the right layer",
        body: "Map expected domain errors into typed results or deliberate HTTP outcomes. Preserve unexpected exceptions for observability with a correlation ID. Do not catch everything and return an empty array, because that turns an outage into convincing but false data.",
      },
      {
        title: "Understand boundary scope",
        body: "A route error boundary catches eligible descendant rendering failures, not arbitrary event-handler errors. A segment's error boundary does not wrap its own layout; place boundaries at the appropriate parent level. Global recovery has separate requirements.",
      },
      {
        title: "Make retry meaningful",
        body: "A reset retries rendering but cannot guarantee a failing upstream service has recovered. Avoid automatic loops. Server errors are sanitized for clients in production, so record useful server diagnostics without exposing stack traces, SQL, or credentials to visitors.",
      },
    ],
    code: `'use client';\nexport default function ErrorView({ error, reset }: {\n  error: Error & { digest?: string }; reset: () => void;\n}) {\n  return <section role="alert">\n    <h2>We could not load this section</h2>\n    <p>Reference: {error.digest ?? 'unavailable'}</p>\n    <button onClick={reset}>Try again</button>\n  </section>;\n}`,
    pitfalls: [
      "Returning empty data for every exception.",
      "Expecting rendering boundaries to catch every async event error.",
      "Logging raw session tokens while diagnosing failures.",
    ],
    practice:
      "Inject validation, not-found, authorization, and upstream-timeout failures into one feature. Verify each produces the intended UI, status behavior, and telemetry.",
    quiz: {
      question: "Why is returning [] from every catch dangerous?",
      choices: [
        "It disguises failures as legitimate empty results",
        "Arrays are not serializable",
        "It always throws again",
      ],
      answer: 0,
      explanation:
        "Users and monitoring cannot distinguish no data from broken dependencies if all failures are converted into a successful empty state.",
    },
    sources: [
      {
        title: "Next.js · Error handling",
        url: "https://nextjs.org/docs/app/getting-started/error-handling",
      },
    ],
  }),
];
