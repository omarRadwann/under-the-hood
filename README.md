# Under the Hood

A Next.js learning workspace with **148 lessons**, a dedicated **64-chapter JavaScript mastery path**, nine interactive models, ten failure investigations, a SOLID workbench, and **50 editable experiments**. JavaScript progresses from the first program to advanced language/runtime and production reasoning, alongside React, Next.js, security, data, architecture, and patterns.

## Run locally

Requires Node.js 22.18+ on the 22.x line, or 24.11+ (matching Babel 8's supported engines). Verified with Node 24.19.0.

```sh
pnpm install
pnpm dev
```

Open **http://localhost:3000**. An npm-based setup also works with `npm install` and `npm run dev`; the included reproducible lockfile is for pnpm.

For a production build:

```sh
pnpm build
pnpm start
```

No account, API key, database, or external service is required. Fonts and their licenses are bundled locally. Learning progress, bookmarks, and notes are stored in this browser's local storage. Export them from the learning-path or notes views. They do not automatically sync between devices.

## GitHub Pages

The public site is built by [the Pages workflow](.github/workflows/pages.yml) on pushes to `main`. It installs the lockfile, runs the tests, creates a static export, verifies local links/assets, and deploys the `out/` artifact. The repository must have **Settings → Pages → Source → GitHub Actions** enabled.

`pnpm build:pages` creates the static export. On Actions, the repository name determines the base path; a `username.github.io` repository uses the root. For a local project-site preview, set `NEXT_PUBLIC_BASE_PATH=/under-the-hood` when building and running `node scripts/serve-export.mjs`, then open `http://localhost:3001/under-the-hood/`. Run `node scripts/check-export.mjs` with the same base-path environment to check the exported navigation and assets. See [DEPLOYMENT.md](DEPLOYMENT.md).

All lessons, models, React previews, and editable experiments work in the static site. GitHub Pages does not execute the contextual authentication/database/SSR examples on a backend; those are teaching material. Edited source runs locally in isolated browser environments. The worker is created inside an opaque frame and inherits its Content Security Policy, so network restrictions do not rely on custom response headers that Pages cannot supply.

## What is included

| Track                  | Lessons | Coverage                                                                                                                                              |
| ---------------------- | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript internals   |      49 | Engine tiering, contexts, closures, TDZ, prototypes, numeric domains, modules, descriptors/proxies, iterators, binary memory, weak references, shapes |
| Async and runtime      |      15 | Event loops, promises, await, cancellation, Node/libuv, workers, backpressure, races, assimilation, async context, Atomics                            |
| React internals        |      12 | Render/commit, state, effects, identity, transitions, memoization, stores, RSC, Fiber/lanes, hooks, hydration/IDs, portals/refs/errors                |
| Next.js architecture   |      10 | Routing, SSR/static/PPR, Cache Components, mutations, BFFs, streaming, Proxy, recovery, serialization, deployment coherence                           |
| Browser and network    |      10 | Requests, HTTP, CORS/cookies, caching, realtime, rendering, retries, API styles, multiplexing, service workers                                        |
| Identity and security  |       9 | Sessions, authorization, OIDC/PKCE, XSS/CSP, CSRF, JWT rotation, SSRF/secrets, tenants, supply-chain capabilities                                     |
| Data and systems       |      10 | Cache races, isolation, query plans, N+1, optimistic reconciliation, outbox, consistency, migrations, fencing, sagas                                  |
| Production engineering |      12 | Type boundaries, testing, telemetry, performance, accessibility, overload, delivery, debugging, variance, model tests, Unicode/time, complexity       |
| Frontend architecture  |       9 | Modular monoliths, feature slices, hexagonal boundaries, microfrontends, state, design systems, BFFs, ADRs, fitness functions                         |
| Patterns and SOLID     |      12 | Five SOLID principles, Strategy, Adapter/Repository, Observer, state machines, Command/CQRS, compound/headless UI, functional core                    |

Every lesson includes a mental model, a mechanism broken into stages, a reference code example, production pitfalls, an investigation exercise, a quiz with explanation, and references. Architecture and pattern lessons also include explicit fit, reconsideration, and tradeoff guidance.

The 24 original advanced-boundary lessons include explicit invariants and prerequisites. The library's deep-dive filter derives its count from lesson levels. [AUDIT.md](AUDIT.md) records findings and limits; [CURRICULUM.md](CURRICULUM.md) maps every lesson.

## JavaScript from zero to expert reasoning

Open **`/javascript`**. Six stages cover foundations; data and built-ins; functions and object protocols; runtime and memory; async/concurrency; and production judgment. The path includes all **49 JavaScript** and **15 async/runtime** chapters exactly once. Its next/previous navigation follows the JavaScript sequence, and the home page/sidebar prioritize it.

The 40 added chapters each include at least four mechanism stages, a concrete program, pitfalls, a practical investigation, a quiz, and a revealable edge-case challenge with a worked solution. Thirty-six programs run directly from their lessons in the worker playground. Browser DOM and separate-module/package examples name their required context. A lazy-iterator-helper experiment adds runnable early-cleanup evidence.

The course has a searchable roadmap, per-stage outcomes and mastery projects, existing-slug progress, a **19-family language crosswalk**, and eight expandable built-in/platform reference families. [JAVASCRIPT-COVERAGE.md](JAVASCRIPT-COVERAGE.md) exports the exact map and scope. It distinguishes language semantics, engine implementations, browser/Node APIs, newer built-ins, and proposals rather than promising universal support.

## Editable execution playgrounds

Open `/playground`. CodeMirror provides TypeScript/TSX highlighting, line numbers, undo/search, a recorded-line highlight, and Ctrl/Cmd Enter to run. Tab leaves the editor for keyboard access. A plain-text fallback, per-example local drafts, optional run-on-edit, stop/reset, console, trace export, replay, and event filters are included. Babel loads on the first run; no examples or source are sent to a remote execution service.

- **JavaScript runtime:** 42 experiments cover the course plus native scheduling, thenable adoption, closures, await, collections, class initialization, binary parsing, lazy iterators, async iteration, debouncing, and bounded concurrency. Snapshots distinguish explicit microtasks from registered promise reactions.
- **React rendering:** four starters mount actual React 19.3 development components. Edit JSX/hooks, interact with the preview, toggle Strict Mode, compare named render entries with Profiler commits and effect lifetimes, and unmount through React cleanup.
- **Caching algorithms:** four starters execute editable cache-aside/TTL, stale-refill race, single-flight, and stale-while-revalidate algorithms. Inspect actual store entries and origin versions. The logical TTL clock is separate from native timer time.

Each run starts a fresh environment. Worker runs are limited to 3.5 seconds; examples have a 40,000-character source limit, a 1,200-event trace limit, and instrumented loop budgets. The React preview remains interactive after startup. Its opaque-origin frames and blob workers use restrictive resource policies. These are local learning sandboxes, not a complete hostile-code execution platform.

Replay selects recorded evidence and source lines; it does not rewind the engine or live React DOM. Instrumentation adds overhead, can affect reflection, and does not expose every internal job or Fiber. Suspended generator frames are omitted from the logical call panel while generators execute natively. The 50 playground programs run under the local environment contract; other examples can require application services, real module files, or browser DOM access.

The ten advanced investigations add a selectable failure timeline, an invariant, a comparison of corrective designs, verification guidance, and production signals. They cover stale cache refills, discarded React work, stale permission claims, latency waterfalls, transaction write skew, microfrontend version skew, closure retention, worker-pool saturation, obsolete workflow events, and cohort-level regressions.

## Interactive models

1. **Browser event loop:** step or play a fixed trace while inspecting stack, host timer, task and microtask queues, and console output.
2. **Engine pipeline:** inspect parsing, illustrative bytecode, feedback, specialization, and recovery when assumptions change.
3. **Memory reachability:** break direct and closure-retained paths and observe collection eligibility.
4. **React lifecycle:** mount, advance candidate work, discard it before commit, update state, and unmount. The DOM snapshot changes at commit.
5. **Request journey:** follow a simplified HTTPS request through host/network, proxy, application, database, and response stages.
6. **Session and authorization:** change the actor's role or revoke the session and inspect the resulting edit decision.
7. **Cache-aside:** alter TTL, advance a logical clock, update the origin, read, and invalidate while inspecting hits and version differences.
8. **Streaming:** scrub an illustrative timeline, reveal independent regions, and fail one optional dependency locally.
9. **State machine:** start, cancel, retry, complete, and deliver obsolete results to an explicit operation-identity guard.

Other lessons have a selectable mechanism diagram that follows that lesson's own stages.

## Architecture studio

Four constraint-based scenarios compare an early SaaS, a growing multi-team product, independently deployed teams, and a complex long-lived domain. The guidance distinguishes separate architectural axes: deployment topology, code organization, dependency direction, and state ownership. It is scenario guidance, not an objective architecture scoring algorithm.

The SOLID workbench shows coupling examples beside possible refactors and explains where the principle helps and where it becomes unnecessary ceremony.

## Routes and navigation

| Route                     | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `/`                       | Overview, runtime preview, track catalogue                    |
| `/library`                | Searchable curriculum and selectable system map               |
| `/library?track=patterns` | A shareable track filter                                      |
| `/javascript`             | Six-stage language-first mastery path, coverage and reference |
| `/labs`                   | All nine lab models                                           |
| `/playground`             | Editable JavaScript, React, and caching experiments           |
| `/architecture`           | Scenario comparisons and SOLID refactors                      |
| `/learn/[slug]`           | Deep dive, interactive model, practice, and local notes       |
| `/saved`                  | Bookmarked lessons                                            |
| `/progress`               | Track progress, export, and local reset controls              |
| `/glossary`               | Searchable definitions linked to lessons                      |

Use **Ctrl/Cmd K** to open global search. Arrow keys select a result, Enter opens it, and Escape closes the dialog. Native controls, visible focus states, reduced-motion support, responsive layouts, and a skip link are included.

## Development and verification

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec prettier --check src tests
```

With the production server running, `node scripts/check-routes.mjs` checks every public prerendered route and the unknown-lesson 404 behavior. Set `APP_URL` to check another local base URL. Run `pnpm curriculum` to regenerate [the full curriculum index](CURRICULUM.md).

The 36 meaningful model/compiler/runtime tests verify actual edited output, promise/await ordering, thenable adoption, cache races and coalescing, isolation, budgets, malformed messages, safe console snapshots, and content/prerequisite integrity alongside the original model and persistence checks. They do not claim to prove every reference snippet or every external runtime implementation.

## Source organization

```text
src/
  app/                    Next.js routes, metadata, global styles
  components/             Learning workspace, labs, architecture studio
  content/                Typed curriculum and failure investigations
  playground/             Babel instrumentation, native worker, React iframe runtime
  lib/
    simulations.ts        Pure cache/workflow transitions and teaching traces
    study.ts              Validated browser persistence
    types.ts              Curriculum contracts and track metadata
tests/                    Model, compiler, runtime, protocol, and content tests
public/fonts/             Local font assets and OFL licenses
public/playground-assets/ Generated local runtimes and React licenses
```

To add a lesson, use `lesson(track, input)` in its track file. Supply unique content and a valid quiz. Register new tracks in `types.ts` and `helpers.ts`. The curriculum and lesson routes derive from the content registry. Update count assertions and any editorial counts when changing the published curriculum size.

## Version and teaching boundaries

The application uses **Next.js 16.4.3**, **React 19.3.1**, and strict TypeScript. Version-sensitive lessons were checked against current official documentation and the installed Next.js documentation on October 31, 2026.

The Cache Components lesson explicitly describes that feature's enabled mode. This learning app does not enable Cache Components or implement the example database, authentication, payment, or remote services. Those snippets isolate contracts and name application-specific dependencies; they are not a preconfigured production backend.

The nine labs are educational models with explicit assumptions. The separate code playground executes edited programs under its documented contract. Neither is a garbage collector, production auth service, private Next.js cache inspector, or a claim that engine heuristics are language guarantees.

This is a broad senior engineering field guide with a finite curriculum. Use its primary references and real-system experiments to extend it as frameworks and deployment environments evolve.
