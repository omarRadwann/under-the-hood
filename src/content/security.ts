import { lesson } from "./helpers";

export const security = [
  lesson("security", {
    slug: "sessions-and-authentication",
    title: "Sessions & authentication",
    description:
      "Trace login, cookie delivery, server verification, session rotation, and revocation.",
    lab: "auth",
    level: "Deep dive",
    minutes: 24,
    mental:
      "Authentication establishes an identity; a session carries that proof across requests. The browser should hold an appropriately protected credential, while the server decides whether it remains valid. Hiding a route or decoding a token is not proof of identity.",
    steps: [
      {
        title: "Create a session after verified identity",
        body: "Use a maintained authentication implementation for credential and federation flows. After successful verification, issue a fresh unpredictable session identifier or a carefully managed signed credential. Rotate session identity at login and privilege changes to prevent fixation.",
      },
      {
        title: "Deliver credentials with a deliberate cookie policy",
        body: "HttpOnly prevents script from directly reading the cookie but does not prevent an XSS payload from performing actions as the user. Secure requires HTTPS delivery; SameSite affects cross-site sending. Cookie Path and Domain are scoping controls, not authorization boundaries. Consider a host-only __Host- cookie where suitable.",
      },
      {
        title: "Verify on every authoritative boundary",
        body: "Resolve identity server-side, enforce absolute and idle expiry as designed, and check revocation. Opaque sessions make central revocation straightforward but require store access. Signed stateless tokens reduce that lookup only by accepting other costs such as revocation and stale claims.",
      },
      {
        title: "Plan the whole lifecycle",
        body: "Logout, password reset, account disablement, stolen-device recovery, and role changes all require defined session behavior. Store only a digest of a bearer session token when feasible. Redact credentials from logs and keep authentication failures observable without disclosing account existence.",
      },
    ],
    code: `// Conceptual server cookie; use a maintained auth library.\n(await cookies()).set('__Host-session', opaqueToken, {\n  httpOnly: true, secure: true, sameSite: 'lax',\n  path: '/', maxAge: 60 * 60 * 8,\n});\n// Server stores a token digest, user ID, expiry, and revocation state.\n// Every protected read/mutation resolves and verifies that session.`,
    pitfalls: [
      "Using a token merely decoded in the browser as authentication.",
      "Assuming HttpOnly prevents all XSS consequences.",
      "Leaving old sessions valid after a security-sensitive account event.",
    ],
    practice:
      "Threat-model a session from issuance to logout. Demonstrate expiry, revocation, fixation prevention, and two-device logout behavior without recording bearer secrets in telemetry.",
    quiz: {
      question: "Which property does HttpOnly provide?",
      choices: [
        "Blocks direct cookie access through browser JavaScript",
        "Prevents every action by an XSS payload",
        "Authorizes every API request",
      ],
      answer: 0,
      explanation:
        "HttpOnly protects direct script access to the cookie. The browser can still send that cookie with requests initiated by malicious script.",
    },
    sources: [
      {
        title: "OWASP · Session management",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
      },
      {
        title: "Next.js · Authentication",
        url: "https://nextjs.org/docs/app/guides/authentication",
      },
    ],
  }),
  lesson("security", {
    slug: "authorization",
    title: "Authorization, RBAC & resource policies",
    description:
      "Enforce tenant, ownership, and operation permissions at the authoritative data boundary.",
    lab: "auth",
    mental:
      "Authorization answers whether this actor may perform this operation on this resource in this context. A role is only one input. Tenant boundaries, ownership, account status, and resource state often matter more than a global admin boolean.",
    steps: [
      {
        title: "Centralize policy, enforce at entry",
        body: "Define policy in a reusable application layer so UI affordances and server checks share intent. The server remains authoritative. Deny by default and validate object-level access for reads as well as writes to prevent insecure direct object references.",
      },
      {
        title: "Scope the data query",
        body: "Prefer queries constrained by the verified tenant and actor instead of fetching an arbitrary ID and trusting client-supplied ownership. Enforce invariants atomically when permission depends on mutable state. Database row-level security can add defense in depth but still needs correct session context.",
      },
      {
        title: "Account for change",
        body: "Cached permissions can outlive a role revocation. Define acceptable lag and key caches by identity and policy version where needed. Audit privileged decisions with redacted context, and test a matrix of actors, resources, tenants, and operations.",
      },
    ],
    code: `const actor = await requireSession();\nconst project = await db.project.findFirst({\n  where: {\n    id: input.projectId,\n    tenantId: actor.tenantId,\n    members: { some: { userId: actor.userId, canEdit: true } },\n  },\n});\nif (!project) throw new ForbiddenError();`,
    pitfalls: [
      "Enforcing permission only through UI visibility.",
      "Trusting tenantId from a request body.",
      "Checking only list endpoints while detail endpoints accept arbitrary IDs.",
    ],
    practice:
      "Write an authorization test matrix including a user from another tenant, a removed member, a read-only member, and a valid editor.",
    quiz: {
      question: "Where should an incoming tenant ID become authoritative?",
      choices: [
        "From the request body directly",
        "From verified identity and authorized membership",
        "From a hidden input",
      ],
      answer: 1,
      explanation:
        "Client data is untrusted. Tenant scope must be derived or verified against the actor's authoritative membership.",
    },
  }),
  lesson("security", {
    slug: "oauth-and-oidc",
    title: "OAuth, OIDC & PKCE",
    description: "Distinguish delegated access from login and follow an authorization-code flow.",
    lab: "auth",
    level: "Deep dive",
    mental:
      "OAuth delegates access to a resource. OpenID Connect adds an identity layer for authentication. An access token is intended for its resource server, while an ID token asserts identity to the relying client under a validation contract.",
    steps: [
      {
        title: "Bind the browser flow",
        body: "An authorization-code flow redirects the user to the provider and receives a short-lived code at an exact registered redirect URI. State binds the response to the initiating session. PKCE binds code redemption to a secret verifier created for that flow, limiting authorization-code interception.",
      },
      {
        title: "Validate the identity assertion",
        body: "For OIDC, validate signature, expected issuer, audience, expiry, and applicable nonce using a maintained library. Merely base64-decoding a JWT establishes nothing. Discovery and key retrieval must be tied to trusted configuration rather than attacker-controlled issuer input.",
      },
      {
        title: "Separate local session from provider tokens",
        body: "After login, create an application session appropriate for your domain. Keep refresh tokens protected on the server where feasible. Handle rotation and reuse detection according to the provider's protocol. Logout semantics differ between local session termination and provider single sign-on.",
      },
    ],
    code: `// Conceptual flow — use an OIDC client library.\nBrowser → Authorization endpoint: state + code_challenge\nProvider → Registered redirect: code + state\nServer → Token endpoint: code + code_verifier\nServer: validate ID token claims and signature\nServer → Browser: local application session cookie`,
    language: "text",
    pitfalls: [
      "Using an ID token as an arbitrary API access token.",
      "Treating PKCE as a replacement for every CSRF and flow-binding check.",
      "Accepting tokens for the wrong audience.",
    ],
    practice:
      "Draw the trust boundary for each token in a provider login. Explain who issues it, who may consume it, its audience, and how revocation or expiry is handled.",
    quiz: {
      question: "What does OIDC add to OAuth?",
      choices: [
        "An identity/authentication layer",
        "Automatic authorization to every app resource",
        "Database transactions",
      ],
      answer: 0,
      explanation:
        "OIDC specifies identity assertions and related behavior. Your app still owns resource-level authorization.",
    },
    sources: [
      {
        title: "OpenID · Connect Core",
        url: "https://openid.net/specs/openid-connect-core-1_0.html",
      },
      { title: "RFC 7636 · PKCE", url: "https://www.rfc-editor.org/rfc/rfc7636" },
    ],
  }),
  lesson("security", {
    slug: "xss-and-csp",
    title: "XSS, output encoding & CSP",
    description: "Protect rendering contexts and reduce the impact of script injection.",
    mental:
      "XSS occurs when untrusted data becomes executable browser content. Encoding is context-specific. React's text escaping helps with ordinary text interpolation, but it is not a blanket sanitizer for HTML, URLs, script contexts, or third-party DOM manipulation.",
    steps: [
      {
        title: "Keep data in data contexts",
        body: "Use text rendering for untrusted strings. Avoid raw HTML insertion unless content has passed a maintained sanitizer with a deliberate policy. Validate URL schemes before creating user-controlled links. Markdown and rich text pipelines still need a security boundary.",
      },
      {
        title: "Use CSP as defense in depth",
        body: "A nonce- or hash-based Content Security Policy can restrict executable script and reduce injection impact. Deploy in report-only mode to learn compatibility issues, then enforce. CSP configuration interacts with server rendering and hydration; a broad unsafe-inline allowance weakens the intended protection.",
      },
      {
        title: "Review the full dependency surface",
        body: "Third-party scripts run with powerful access to the page. Minimize them, pin integrity where applicable, and monitor changes. Trusted Types can protect certain DOM sinks in supported browsers but does not replace safe architecture or all input validation.",
      },
    ],
    code: `// Safe ordinary text rendering:\n<p>{userProvidedText}</p>\n\n// Dangerous without a trustworthy sanitization policy:\n// <div dangerouslySetInnerHTML={{ __html: untrusted }} />\n\nfunction allowWebUrl(value: string) {\n  const url = new URL(value);\n  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL');\n  return url.href;\n}`,
    pitfalls: [
      "Assuming React makes all input contexts safe.",
      "Writing a sanitizer with a regular expression.",
      "Treating CSP as permission to insert arbitrary HTML.",
    ],
    practice:
      "Audit a rich-text feature across paste, markdown links, HTML import, and preview. Identify every transition from data into an executable or navigable context.",
    quiz: {
      question:
        "Does ordinary JSX text escaping sanitize arbitrary HTML supplied to dangerouslySetInnerHTML?",
      choices: ["Yes", "No", "Only in production"],
      answer: 1,
      explanation:
        "Raw HTML insertion bypasses ordinary text escaping. It needs an explicit, maintained sanitization policy.",
    },
    sources: [
      {
        title: "OWASP · XSS prevention",
        url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
      },
    ],
  }),
  lesson("security", {
    slug: "csrf",
    title: "CSRF & request intent",
    description:
      "Protect ambient cookie credentials with origin checks, tokens, and deliberate HTTP methods.",
    lab: "auth",
    mental:
      "A browser can attach cookies automatically. CSRF exploits that ambient authority to trigger an action the user did not intend. Preventing another origin from reading the response is insufficient when the harmful part is the side effect.",
    steps: [
      {
        title: "Remove unsafe safe-method behavior",
        body: "GET requests must not perform state-changing operations. A link, image, or browser prefetch can initiate a GET. Requiring POST is a start but does not by itself prove legitimate intent for cookie-authenticated endpoints.",
      },
      {
        title: "Combine compatible defenses",
        body: "Use framework CSRF protection where available, validate Origin or appropriate Fetch Metadata under a deliberate policy, and apply synchronizer-token or signed double-submit techniques where needed. SameSite cookies provide useful defense but differ by context and are not a complete universal replacement.",
      },
      {
        title: "Understand the threat boundary",
        body: "CORS may block response access while the request still occurs. XSS can defeat many CSRF defenses because attacker code runs in the trusted origin. OAuth callback flows need their own correlation protections, and webhooks use provider signature verification rather than browser CSRF tokens.",
      },
    ],
    code: `// Conceptual mutation boundary:\nassertAllowedOrigin(request.headers.get('origin'));\nconst session = await requireSession(request);\nawait verifyCsrfToken(request, session);\nconst input = MutationSchema.parse(await request.json());\nawait authorizeAndExecute(session, input);`,
    pitfalls: [
      "Using CORS alone as CSRF protection.",
      "Making logout, email changes, or purchases happen through GET.",
      "Treating a custom header as sufficient without a full origin and credential model.",
    ],
    practice:
      "Test a cookie-authenticated endpoint from an attacker-controlled HTML form. Verify the server rejects the mutation before business logic runs.",
    quiz: {
      question: "Why is blocked cross-origin response reading not enough to prevent CSRF?",
      choices: [
        "The request may already cause a side effect",
        "Cookies never cross origins",
        "All browsers ignore CORS",
      ],
      answer: 0,
      explanation:
        "The attacker often does not need the response. They need the browser to submit an authenticated mutation.",
    },
  }),
  lesson("security", {
    slug: "jwt-and-key-rotation",
    title: "JWT validation & key rotation",
    description: "Treat signed claims as a constrained trust contract, not encrypted truth.",
    lab: "auth",
    mental:
      "A signed JWT protects integrity under a key and validation policy. It is normally readable, not encrypted. Its claims are trustworthy only after validating the intended algorithm, issuer, audience, lifetime, and application-specific constraints.",
    steps: [
      {
        title: "Constrain verification",
        body: "Choose allowed algorithms from trusted configuration rather than the token alone. Validate issuer and audience exactly as required. Retrieve keys only from trusted endpoints and handle unknown key IDs safely. Use a maintained JOSE implementation instead of assembling crypto primitives.",
      },
      {
        title: "Design rotation overlap",
        body: "Publish new verification keys before issuing tokens with them. Keep old verification keys available until legitimate old tokens expire, unless responding to compromise. Cache JWKS with bounded refresh behavior so an attacker cannot force unlimited network requests with random key IDs.",
      },
      {
        title: "Accept the revocation tradeoff explicitly",
        body: "A self-contained token can remain valid after a role or account changes. Short lifetimes reduce this window; revocation lists or introspection reintroduce central state. Avoid putting confidential or excessive profile data in tokens that pass through browsers and infrastructure.",
      },
    ],
    code: `const { payload } = await jwtVerify(token, trustedJwks, {\n  issuer: 'https://identity.example.com',\n  audience: 'projects-api',\n  algorithms: ['RS256'],\n});\n// Validate application-required claims after verification.\n// Authorization still checks the requested resource.`,
    pitfalls: [
      "Using decode as verify.",
      "Assuming signed means encrypted.",
      "Long-lived permission claims without a revocation plan.",
    ],
    practice:
      "Simulate a signing-key rotation with an overlap window. Verify correct handling of old tokens, new tokens, unknown keys, expired claims, and the wrong audience.",
    quiz: {
      question: "A normally signed JWT's payload is…",
      choices: [
        "Readable unless separately encrypted",
        "Always confidential",
        "An authorization decision for every resource",
      ],
      answer: 0,
      explanation:
        "JWS signing provides integrity, not confidentiality. JWE is a distinct encryption format.",
    },
  }),
  lesson("security", {
    slug: "ssrf-and-secrets",
    title: "SSRF, secrets & untrusted boundaries",
    description:
      "Keep server capabilities from becoming attacker-controlled network and data access.",
    mental:
      "A server has privileges the browser may not have: internal network access, metadata credentials, and secrets. An endpoint that fetches a user-supplied URL can accidentally delegate those capabilities to an attacker.",
    steps: [
      {
        title: "Constrain outbound destinations",
        body: "Prefer an allowlist of expected services and protocols. If arbitrary external URLs are required, account for redirects, DNS rebinding, private and loopback addresses, alternate IP formats, and outbound network policy. Parsing a URL is necessary but not sufficient validation.",
      },
      {
        title: "Treat environment exposure deliberately",
        body: "Next.js NEXT_PUBLIC_ variables are intended for browser exposure and may be inlined into client bundles. Keep credentials in server-only modules and managed secret storage. Rotation requires knowing every consumer, log sink, build artifact, and cache that may contain a secret.",
      },
      {
        title: "Limit damage at the capability boundary",
        body: "Apply response-size limits, connection deadlines, content-type handling, and restricted egress. Avoid returning raw fetched content under your trusted origin. Log destination classes and errors without recording authorization headers or signed private URLs.",
      },
    ],
    code: `import 'server-only';\nconst base = new URL('https://trusted-api.example.com');\nexport async function getProduct(id: string) {\n  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid ID');\n  const url = new URL('/products/' + encodeURIComponent(id), base);\n  return fetch(url, { headers: { Authorization: 'Bearer ' + process.env.API_TOKEN } });\n}`,
    pitfalls: [
      "Accepting a complete arbitrary URL when an identifier would suffice.",
      "Naming a secret NEXT_PUBLIC_API_SECRET.",
      "Following redirects without revalidating destinations.",
    ],
    practice:
      "Threat-model a link preview service. Define outbound network restrictions, redirect validation, response limits, and safe rendering of returned metadata.",
    quiz: {
      question: "Which capability makes SSRF especially dangerous?",
      choices: [
        "The server's access to privileged networks and credentials",
        "The browser's text selection",
        "React's state queue",
      ],
      answer: 0,
      explanation: "SSRF turns server-side network access into an attacker-influenced capability.",
    },
  }),
  lesson("security", {
    slug: "multi-tenant-security",
    title: "Multi-tenant isolation & auditability",
    description: "Carry tenant context safely through queries, caches, background work, and logs.",
    lab: "auth",
    mental:
      "Tenant isolation is an invariant across every representation, not a filter added to the main list query. A correct database query can still leak through a cache key, export job, websocket channel, or object-storage URL.",
    steps: [
      {
        title: "Establish trusted context once",
        body: "Resolve the actor and authorized tenant from a verified session and membership. Pass an explicit immutable context through application services. Avoid ambient mutable global tenant state, especially in servers processing concurrent requests.",
      },
      {
        title: "Scope every secondary system",
        body: "Include tenant identity in cache keys, storage paths, search indexes, job payloads, uniqueness rules, and event channels where required. Re-authorize when a background job executes if permissions may have changed. Signed URLs need appropriate expiry and resource scope.",
      },
      {
        title: "Make violations testable",
        body: "Create adversarial cross-tenant test fixtures with similar IDs and names. Audit sensitive operations with actor, tenant, operation, resource, decision, and correlation IDs while minimizing personal data. Retention and access to audit logs are themselves security decisions.",
      },
    ],
    code: `type RequestContext = Readonly<{\n  actorId: string; tenantId: string; correlationId: string;\n}>;\nfunction projectCacheKey(ctx: RequestContext, id: string) {\n  return ['project', ctx.tenantId, id].join(':');\n}\n// A scoped key complements, never replaces, authorized reads.`,
    pitfalls: [
      "Tenant-scoping SQL but sharing cache entries across tenants.",
      "Using a mutable process-global currentTenant.",
      "Running exported reports under outdated permissions without a policy.",
    ],
    practice:
      "Trace a private report through request, database, queue, worker, object storage, email link, and download. State the isolation and authorization check at every stage.",
    quiz: {
      question: "Which needs tenant isolation?",
      choices: [
        "Only database tables",
        "All relevant data paths, including caches and jobs",
        "Only the sidebar",
      ],
      answer: 1,
      explanation:
        "Secondary representations can leak data even when the primary query is correctly scoped.",
    },
  }),
];
