import { lesson } from "./helpers";

export const network = [
  lesson("network", {
    slug: "request-journey",
    title: "The life of a request",
    description:
      "Follow DNS, connection establishment, TLS, HTTP, application code, and response delivery.",
    lab: "network",
    level: "Deep dive",
    mental:
      "A fetch is a pipeline, not a single latency number. Some stages are reused or skipped through caches and existing connections. A slow API call could be waiting on connection setup, server queueing, a database, transfer, or browser processing.",
    steps: [
      {
        title: "Resolve and establish transport",
        body: "DNS resolves a hostname through caches and resolvers. HTTPS commonly uses HTTP/1.1 or HTTP/2 over TCP plus TLS, while HTTP/3 uses QUIC over UDP with integrated TLS. Existing connections can avoid repeated setup; the lab is a simplified cold HTTP/2-style path.",
      },
      {
        title: "Cross the application boundary",
        body: "A CDN or reverse proxy may terminate TLS, serve a cache hit, or forward to the origin. The application validates the request, authenticates it, authorizes the operation, and calls dependencies. Every queue and retry contributes to the request's deadline.",
      },
      {
        title: "Consume the response deliberately",
        body: "fetch resolves when response headers are available, not after the whole body is consumed. HTTP error statuses do not reject fetch by themselves. Parsing, decompression, rendering, and hydration can still take time after server processing finishes.",
      },
    ],
    code: `const start = performance.now();\nconst response = await fetch('/api/projects', { signal });\nif (!response.ok) throw new Error('HTTP ' + response.status);\nconst projects = await response.json();\nconsole.log('Headers + body + parsing:', performance.now() - start);\n// Use Resource Timing / server traces to break down stages.`,
    pitfalls: [
      "Assuming HTTP 500 rejects fetch.",
      "Counting only server processing as request latency.",
      "Drawing HTTP/3 as TCP followed by TLS.",
    ],
    practice:
      "Use a browser waterfall and a distributed trace to explain one slow request. Separate queueing, connection reuse, TTFB, transfer, parse, and UI work.",
    quiz: {
      question: "When does fetch normally fulfill with a Response?",
      choices: [
        "When response headers are available",
        "Only after JSON parsing",
        "Only for 2xx statuses",
      ],
      answer: 0,
      explanation:
        "Body consumption is separate. Check response.ok and explicitly await the desired body reader.",
    },
  }),
  lesson("network", {
    slug: "http-semantics",
    title: "HTTP semantics & API contracts",
    description:
      "Design methods, status codes, conditional requests, and errors as a coherent protocol.",
    lab: "network",
    mental:
      "HTTP is an application protocol with semantics that infrastructure can understand. Method and status choices influence caching, retries, and intermediaries. A JSON payload does not replace those semantics.",
    steps: [
      {
        title: "Separate safe from idempotent",
        body: "Safe methods are intended to be read-only; idempotent methods have the same intended effect when repeated. PUT and DELETE are idempotent by definition even if repeated responses differ. POST can implement an idempotency contract, but that must be designed explicitly.",
      },
      {
        title: "Define machine-readable outcomes",
        body: "Use appropriate status codes and a stable error shape. Distinguish authentication failure, authorization denial, validation errors, conflicts, and transient unavailability. Do not expose internals. Define pagination, ordering, versioning, and retry behavior as part of the public contract.",
      },
      {
        title: "Use conditional operations",
        body: "ETag and If-None-Match can validate a representation without transferring it again. If-Match can enforce optimistic concurrency on a write. The validator must reflect the representation or version you actually protect, including authorization and content negotiation where relevant.",
      },
    ],
    code: `// Client updates only if its known version still matches.\nawait fetch('/api/documents/42', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json', 'If-Match': '"v7"' },\n  body: JSON.stringify({ title: 'Revised' }),\n});\n// Server returns 412 if the precondition no longer holds.`,
    pitfalls: [
      "Using GET for mutations.",
      "Returning 200 for every failure.",
      "Equating idempotency with identical response bytes.",
    ],
    practice:
      "Write an API contract for document editing that prevents lost updates and specifies errors for stale versions, invalid input, and missing permissions.",
    quiz: {
      question:
        "Which header expresses a write precondition using a known representation validator?",
      choices: ["If-Match", "Accept-Language", "User-Agent"],
      answer: 0,
      explanation:
        "If-Match can require the server's current representation validator to match before applying the method.",
    },
    sources: [
      { title: "RFC 9110 · HTTP semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" },
    ],
  }),
  lesson("network", {
    slug: "cors-and-cookies",
    title: "CORS, origins & credentialed requests",
    description:
      "Separate browser read permission from authentication, CSRF protection, and cookie policy.",
    lab: "network",
    mental:
      "CORS is the browser's permission system for exposing cross-origin responses to JavaScript. It is not server authentication and does not generally prevent a request from being sent. Origin and site are different concepts, especially when reasoning about cookies.",
    steps: [
      {
        title: "Know what triggers a preflight",
        body: "Certain methods, headers, and content types trigger an OPTIONS check before the actual request. Some simple requests are sent without preflight even when their response will not be readable. A successful curl request says nothing about browser CORS permission.",
      },
      {
        title: "Configure credentials explicitly",
        body: "Cross-origin fetch credentials require the appropriate credentials option and compatible server headers. Access-Control-Allow-Origin cannot be * for a credentialed response. When dynamically echoing an allowed origin, include Vary: Origin and use an allowlist rather than reflecting arbitrary input.",
      },
      {
        title: "Keep defenses separate",
        body: "Cookie SameSite and third-party-cookie policy are independent of CORS and may prevent cookie delivery. Protect state-changing cookie-authenticated operations against CSRF. An attacker using their own HTTP client is not constrained by the browser's same-origin policy.",
      },
    ],
    code: `await fetch('https://api.example.com/account', {\n  credentials: 'include',\n});\n// Allowed server response:\n// Access-Control-Allow-Origin: https://app.example.com\n// Access-Control-Allow-Credentials: true\n// Vary: Origin\n// Cookie attributes still independently control delivery.`,
    pitfalls: [
      "Using CORS as authentication.",
      "Combining wildcard origin with credentials.",
      "Assuming blocked response access means no side effect occurred.",
    ],
    practice:
      "Create a matrix of same-origin, cross-origin same-site, and cross-site requests. For each, predict preflight, cookie delivery, and JavaScript response visibility separately.",
    quiz: {
      question: "Does CORS authenticate a non-browser API client?",
      choices: ["Yes", "No", "Only with JSON"],
      answer: 1,
      explanation:
        "CORS is enforced by browsers for response access. Servers still need authentication and authorization for all clients.",
    },
    sources: [
      { title: "MDN · CORS", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS" },
    ],
  }),
  lesson("network", {
    slug: "http-caching",
    title: "Browser & CDN cache semantics",
    description: "Control storage, freshness, validation, variants, and private representations.",
    lab: "cache",
    level: "Deep dive",
    mental:
      "A cache first asks whether it may store a response, then whether a stored representation matches the request, then whether it is fresh or needs validation. Cache-Control directives describe different parts of that contract.",
    steps: [
      {
        title: "Distinguish no-store and no-cache",
        body: "no-store tells caches not to store the response. no-cache permits storage but requires successful validation before reuse. max-age controls freshness; s-maxage targets shared caches. private prevents shared-cache storage but permits a browser cache to store under the applicable rules.",
      },
      {
        title: "Key all representation dimensions",
        body: "Vary expands matching by relevant request headers such as Accept-Encoding. Query parameters, cookies, authorization, and CDN configuration also affect safety. A cache that fails to separate tenants can turn a latency optimization into data exposure.",
      },
      {
        title: "Plan stale delivery and purges",
        body: "stale-while-revalidate can trade freshness for low latency. Validation with ETag can return 304 without a full body. A browser cache, CDN, service worker, and application cache may each need separate invalidation. Immutable content-hashed assets are easier to cache than mutable URLs.",
      },
    ],
    code: `// Content-hashed public asset:\nCache-Control: public, max-age=31536000, immutable\n\n// Personalized account response:\nCache-Control: private, no-store\n\n// Stored, but validate before each reuse:\nCache-Control: no-cache\nETag: "representation-v12"`,
    language: "http",
    pitfalls: [
      "Explaining no-cache as 'never store'.",
      "Using a public cache for a personalized response.",
      "Purging a CDN and assuming browser caches disappear.",
    ],
    practice:
      "Specify headers for hashed JS, public product data, a personalized account page, and a downloadable private invoice. Include your invalidation strategy.",
    quiz: {
      question: "Which directive permits storage but requires validation before reuse?",
      choices: ["no-cache", "no-store", "immutable"],
      answer: 0,
      explanation:
        "Despite its name, no-cache requires validation. no-store is the directive that prohibits storage.",
    },
    sources: [{ title: "RFC 9111 · HTTP caching", url: "https://www.rfc-editor.org/rfc/rfc9111" }],
  }),
  lesson("network", {
    slug: "realtime-transports",
    title: "Polling, SSE & WebSockets",
    description:
      "Choose a realtime transport around directionality, reconnection, and delivery semantics.",
    lab: "network",
    mental:
      "A transport moves messages; it does not automatically provide durable delivery, deduplication, authorization refresh, or ordering across reconnections. Start with the product's acceptable delay and failure semantics before choosing a protocol.",
    steps: [
      {
        title: "Choose the smallest sufficient protocol",
        body: "Polling is simple and works with ordinary request infrastructure, but trades latency for repeated traffic. SSE carries server-to-client events over HTTP and has browser reconnection support. WebSockets provide bidirectional messaging but require application-level lifecycle and flow-control decisions.",
      },
      {
        title: "Design reconnect as normal behavior",
        body: "Networks disconnect. Use sequence IDs or cursors to resume where appropriate, bound replay windows, and deduplicate messages. A reconnect may land on another server, so important subscription or replay state cannot live only in one process.",
      },
      {
        title: "Secure long-lived ownership",
        body: "Authorize subscriptions and individual resource channels, enforce payload limits, and plan token expiry and revocation. Measure connection count, fanout, queue depth, and dropped messages. Slow clients require a policy rather than unlimited buffering.",
      },
    ],
    code: `const events = new EventSource('/api/events');\nevents.addEventListener('project.updated', event => {\n  const message = JSON.parse((event as MessageEvent).data);\n  // Validate schema and deduplicate using message.eventId.\n});\n// Owner cleanup:\n// events.close();`,
    pitfalls: [
      "Choosing WebSockets for a feed that only needs infrequent server updates.",
      "Treating connection success as authorization for every channel.",
      "Assuming reconnect implies lossless delivery.",
    ],
    practice:
      "Choose a transport for stock quotes, collaborative editing, and a job-status screen. Define reconnection, replay, ordering, and slow-consumer policy for each.",
    quiz: {
      question: "What must still be designed when using WebSockets?",
      choices: [
        "Delivery and reconnection semantics",
        "Whether JavaScript exists",
        "The HTTP status of every message",
      ],
      answer: 0,
      explanation:
        "A bidirectional socket is a transport. Durable delivery and recovery are application protocols built on top.",
    },
  }),
  lesson("network", {
    slug: "browser-rendering",
    title: "Style, layout, paint & compositing",
    description: "Connect DOM updates to pixels and identify forced synchronous layout.",
    mental:
      "Changing the DOM does not directly paint pixels. The browser resolves styles, computes geometry, paints content, and composites layers as needed. JavaScript can accidentally force parts of this pipeline to run synchronously.",
    steps: [
      {
        title: "Invalidate only necessary work",
        body: "Different CSS changes affect different stages. Geometry changes often require layout; transforms and opacity can sometimes be handled efficiently in compositing. Layer promotion is a browser decision and extra layers consume memory, so will-change is not free acceleration.",
      },
      {
        title: "Avoid read-write-read thrashing",
        body: "Reading layout metrics after invalidating geometry can force synchronous layout. Repeating this inside a loop amplifies cost. Batch reads before writes, use observers for suitable measurement, and inspect actual layout events instead of optimizing based only on property names.",
      },
      {
        title: "Budget responsiveness",
        body: "Long main-thread tasks delay input handling and presentation. DOM virtualization reduces work for large lists, but it needs focus and accessibility care. Coordinate animations with requestAnimationFrame and respect reduced-motion preferences.",
      },
    ],
    code: `// Measure once, then write.\nconst width = container.getBoundingClientRect().width;\nfor (const row of rows) {\n  row.style.width = width + 'px';\n}\n// Avoid changing width, measuring, changing, measuring\n// for every row in the same tight loop.`,
    pitfalls: [
      "Assuming React render time equals total browser rendering time.",
      "Adding will-change to every element.",
      "Virtualizing content without preserving keyboard navigation.",
    ],
    practice:
      "Record a list resize in the Performance panel. Identify forced layout and compare batched measurement with an alternating read/write loop.",
    quiz: {
      question: "What can force synchronous layout?",
      choices: [
        "Reading geometry after invalidating layout",
        "Every console.log",
        "A stable object identity",
      ],
      answer: 0,
      explanation:
        "The browser may need to flush pending style and layout work to answer an up-to-date geometry query.",
    },
  }),
  lesson("network", {
    slug: "retries-and-idempotency",
    title: "Retries, idempotency & jitter",
    description:
      "Recover from transient failures without multiplying load or duplicating business operations.",
    lab: "network",
    mental:
      "A timeout means you do not know the outcome. The server may have committed the operation while the response was lost. A retry policy must account for ambiguity, operation semantics, deadline, and downstream capacity.",
    steps: [
      {
        title: "Classify retryable outcomes",
        body: "Network failures, rate limits, and some server errors may be transient. Validation and permission errors are usually not. Honor Retry-After when appropriate. Set a total deadline and attempt limit, and avoid retrying independently at every layer because attempts multiply.",
      },
      {
        title: "Make repeated intent recognizable",
        body: "An idempotency key identifies one logical operation. The server stores its request fingerprint and outcome atomically with the business action or through a robust workflow. Reusing the same key for a different payload should be rejected. A frontend UUID alone does not implement the contract.",
      },
      {
        title: "Spread retries under failure",
        body: "Exponential backoff with jitter reduces synchronized retry waves. Retry budgets and circuit breakers protect dependency recovery. Monitor retries as additional load and distinguish user operations from transport attempts in traces and metrics.",
      },
    ],
    code: `const key = crypto.randomUUID(); // one logical purchase\nawait fetch('/api/purchases', {\n  method: 'POST',\n  headers: { 'Idempotency-Key': key, 'Content-Type': 'application/json' },\n  body: JSON.stringify({ cartId }),\n});\n// A retry of this same intent reuses key.\n// The server must atomically enforce the key contract.`,
    pitfalls: [
      "Retrying payment creation with a new key every time.",
      "Retries at browser, BFF, gateway, and service multiplying together.",
      "Treating every timeout as proof no write occurred.",
    ],
    practice:
      "Design a payment attempt protocol where the server commits but the response is lost. Explain how the next request discovers the existing result.",
    quiz: {
      question: "After a mutation request times out, what do you know?",
      choices: [
        "The server definitely did nothing",
        "The outcome may be ambiguous",
        "It is safe to create a new logical operation",
      ],
      answer: 1,
      explanation:
        "The server may have committed before the response was lost. Reconcile by operation identity instead of blindly duplicating intent.",
    },
  }),
  lesson("network", {
    slug: "rest-graphql-rpc",
    title: "REST, GraphQL & typed RPC",
    description:
      "Choose a contract style around clients, evolution, caching, and operational complexity.",
    mental:
      "API styles optimize different constraints. REST exposes resource semantics, GraphQL exposes a queryable schema, and typed RPC often optimizes coordinated application development. None removes authorization, validation, observability, or version compatibility work.",
    steps: [
      {
        title: "Match the client ecosystem",
        body: "Multiple independent clients may benefit from stable HTTP resources or a graph schema. A tightly coordinated TypeScript app can gain velocity from typed RPC. Compile-time inference does not validate untrusted runtime data and can couple deployments if compatibility is ignored.",
      },
      {
        title: "Bound execution cost",
        body: "Graph queries can create resolver waterfalls and N+1 access patterns. Use request-scoped batching and cost/depth limits where appropriate. REST aggregation and RPC handlers can also hide expensive fanout, so measure data access rather than blaming only one style.",
      },
      {
        title: "Define evolution and cache behavior",
        body: "HTTP cache semantics fit resource GETs naturally but can be designed for other contracts. Graph schemas need deprecation and field ownership; RPC needs backward-compatible procedures. Avoid shared server types leaking database models and internal secrets directly to clients.",
      },
    ],
    code: `// Transport-independent application port:\ntype ProjectSummary = { id: string; name: string };\ninterface ProjectQueries {\n  listForUser(userId: string): Promise<ProjectSummary[]>;\n}\n// REST, GraphQL, or RPC adapters call this contract.\n// Runtime schemas validate transport input at each boundary.`,
    pitfalls: [
      "Choosing a protocol based only on popularity.",
      "Treating end-to-end TypeScript as runtime validation.",
      "Letting resolver convenience bypass resource authorization.",
    ],
    practice:
      "Compare contracts for a public API, an internal dashboard, and a mobile app with irregular connectivity. Document the chosen tradeoff and a migration exit path.",
    quiz: {
      question: "Does shared TypeScript inference validate an incoming HTTP payload?",
      choices: ["Yes", "No", "Only in strict mode"],
      answer: 1,
      explanation:
        "TypeScript types are erased. Boundary validation must happen at runtime regardless of transport style.",
    },
  }),
];
