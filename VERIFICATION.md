# Verification record

## Version 1.7.0 JavaScript and runtime verification

- **86 tests pass.** All 52 canonical worker lesson programs and 35 coded worked answers match independently authored output fixtures in both native and instrumented execution. Every answer opens its exact displayed source in the editor.
- All **101 presets** were exercised through the production preview's browser UI. The **87 canonical JavaScript programs** matched their output fixtures; the six additional JavaScript starters, four React presets, and four cache algorithms exhibited their declared behavior. No uncaught browser errors occurred in these positive checks.
- All **20 training references** passed all **78 checks** in the browser and fresh-worker suite. Every broken starter remains rejected by at least one check.
- React browser checks confirm batching to 3, effect setup/cleanup on dependency changes and child removal, preserved keyed drafts, and a parent render count of 2 with memoized child count 1. An invalid effect return now reaches React's warning. A real React handler resumes correctly after a 650ms implicit iterator wait.
- All four cache experiments complete with their declared behavior: TTL refill, the deliberately demonstrated stale-refill race, request coalescing, and stale-while-revalidate. These examples do not claim to be Next.js/CDN cache implementations.
- Reset/start/late-completion leaves the current workflow operation active. The hoisting worked-answer link navigates to the correct preset and produces `ready`, then `3`.
- The worked-answer lesson has one main heading, named controls, and no horizontal page overflow at 390px and 768px viewports. Strict TypeScript, production export, formatting, and production dependency audit pass. The export contains **898 files** and **7,709 resolved local link/asset targets**.

See [AUDIT.md](AUDIT.md) for corrections, primary references, declared scope, and host-specific limits. The records below retain evidence from earlier releases.

## Version 1.6.0 public workshop

**77 tests pass**, strict TypeScript passes, and the nested-path production export resolves **7,674 local link/asset targets** across **898 files**. All **170 application route/asset requests** succeed, with the expected unknown-lesson 404. The obsolete workspace route is no longer exported. The production dependency audit reports no known vulnerabilities.

The four general workshop views were checked at mobile and tablet widths with one main heading, named controls, and no horizontal page overflow. A tablet layout pass widened the view selectors and stacked narrow content panels. Existing local explanation text, a zero self-rating, a consulted-guide flag, and practice progress survive migration. Export produces valid JSON containing only version, completed blocks, answers, and the learning log. Compatibility checks preserve renamed exercise links, grading records, and deliberately empty code drafts.

The current application and documentation contain general developer-learning content. Role-specific preparation and scheduling features are removed. Listed behavioral checks and self-review remain bounded evidence; they do not establish universal correctness or mastery.

## Version 1.5.1 grading precision

**76 tests pass.** Added a mutation regression for incorrect numeric bracket returns and foreign graph nodes. All reference solutions continue to satisfy the stricter boolean and node-membership checks. This follow-up changes grading predicates, while preserving the 25 discussions, eight coding patterns, and 78 listed checks.

## Version 1.5.0 coding exercise evidence

All 20 reference solutions passed their 78 listed checks; every intentionally broken starter failed at least one check. All eight new solutions passed their 32 checks through the browser grader. Local explanation records, zero ratings, guide disclosure, and conceptual boundary selection were checked. These records establish the listed behaviors rather than comprehensive correctness or mastery.

## Version 1.4.1 cache-model verification

The full suite passes **70/70 tests**. The cache lab stores an entry deadline at refill and labels TTL as a future-refill setting. Browser checks confirm that increasing TTL leaves the old t=5s deadline intact, expiry refills with a t=65s deadline, and reducing future TTL to 5s leaves that entry fresh at t=10s. Production export and strict TypeScript pass with 892 files and 7,448 resolved local targets. Exact-revision deployment evidence is saved separately. The 1.4.0 browser/example records below describe unchanged code paths.

## Version 1.4.0 content verification

Checked October 31, 2026 with Node.js 24.22.1, Next.js 16.4.3, and React 19.3.1.

- **69/69 automated tests pass.** Every JavaScript/TypeScript example file and coded answer parses, JSON examples parse, worker links resolve to exact source, and curriculum prerequisites remain acyclic.
- **52/52 runnable lessons** match reviewed expected outputs in instrumented and uninstrumented native execution. All **52 browser runs** also settled and matched their fixtures exactly. Fixtures are authored review data, not automatically regenerated by the test.
- Real named-file ESM tests cover binding/default/cycle/then-export behavior. Node tests execute the I/O-order example and gzip round trip. Controlled tests cover cancellation commits, cache-key dimensions, single-flight, SSRF transport options, and Server Action form/authorization-port sequencing.
- PostgreSQL/PGlite executes the displayed transfer: successful transfer updates both balances, missing credit account rolls back the debit, and insufficient funds leaves both balances unchanged. Multi-connection isolation is outside this fixture.
- The real DOM lab records trusted-click order as capture, capture microtask, target, target microtask, bubble, bubble microtask. Nested programmatic order is capture, target, bubble, caller-return, then those microtasks. These observations describe this dispatch context rather than every callback API.
- Seven module-file tabs support click, arrows, Home, and End; selection and tabpanel names stay aligned. Written worked answers display as prose. Mobile (390px viewport, 375px content) and tablet (768px viewport, 753px content) show no horizontal page overflow for checked module/event views.
- Production export with `/under-the-hood` passes strict TypeScript: **892 files**, **7,448 resolved local link/asset targets**, **169 successful local application route/asset requests**, and the expected unknown-lesson **404**. Formatting and the complete dependency audit pass.

See [AUDIT.md](AUDIT.md) for the reproduced defects and [EXAMPLE-VERIFICATION.md](EXAMPLE-VERIFICATION.md) for per-example scope. Deployment verification uses the exact Git revision in `release.json`; post-deployment evidence is saved separately from this source commit. The records below are historical checks for earlier releases.

## Version 1.3.1 regression verification

Checked October 31, 2026 with Node.js 24.22.1 and the existing locked framework/compiler versions.

- **58/58 tests pass**, including seventeen new regressions for native timer behavior, rejected-await frames, promise brand/species errors, microtask validation, value snapshots, persistence, React entry validation, release-versioned runtimes, oversized packets, and logical arithmetic overflow.
- Production static export and strict TypeScript pass with the real `/under-the-hood` prefix. The export has **882 files**, **7,319 valid local link/asset targets**, **167 successful application route/asset requests**, and the expected **404** for an unknown lesson.
- Real browser execution confirms JavaScript timer receivers, sparse/collection console values, resumed catch frames, React batching, delayed async recovery, clear compile errors, and cache expiry/refill. Syntax failure has no obsolete recording warning.
- Training syntax failure, interrupted work, reset/re-run, failed starter checks, and successful references recover correctly. Two open training tabs retain both exercises' records after another run and reload.
- A reproduced stale-tab progress overwrite is fixed: save different lessons in two tabs, edit completion in the older tab, reload the other tab, and both bookmarks remain. Temporary test bookmarks/completion were removed afterward.
- Keyboard Close search stays on the current page. Arrow navigation moves actual focus to result links, and Enter opens the focused result. Mobile drawer Escape restores its trigger and body scrolling.
- 390px mobile and 768px tablet views have no horizontal page overflow. Tablet JavaScript, library, architecture, glossary, and playground pages each expose one main h1 and no unnamed visible buttons in the checked DOM.
- Production dependency audit reports no known vulnerabilities. Browser checks report no uncaught errors.

See [AUDIT.md](AUDIT.md) for the defects and limits. The records below describe earlier release checks rather than replacing their historical counts.

## Version 1.3 training and depth audit

The current release contains 156 lessons, 32 lessons with explicit invariants, the unchanged 64-chapter JavaScript path, 50 playground starters, and twelve additional repair exercises with 46 behavioral checks.

- All **41 automated tests pass**, including fresh-worker execution of every training reference and rejection of every broken starter. Negative TypeScript fixture cases are checked by the production compiler.
- The optimized static export and strict TypeScript pass. The new route and all new lesson routes are generated; source and referenced primary documentation are checked separately.
- All **184 unique references** returned HTTP 200. This is point-in-time reachability evidence.
- Browser verification executed all twelve training references and all 46 checks. An independently edited parsing repair moved from 1/4 to 4/4, Ctrl/Cmd Enter ran the code, and a reload retained source and progress. Source changes require another run to establish current results.
- Recorded-call selection updated the snapshot and source highlight. A runaway loop failed within the instruction budget; reset and a later run recovered.
- The competency map contains ten domains and links all 156 lessons. Reference-assisted runs are labeled; completion is not a certification or proof of unlisted cases.

The earlier release evidence below records the original playground and deployment checks. The new runtime reuses the same opaque-frame worker containment.

Checked October 31, 2026 with Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Babel 8.0.10, Node.js 24.19.0, and pnpm 11.25.0.

## Automated checks

- Strict TypeScript and optimized production compilation passed; 160 routes/assets were prerendered including two internal framework error routes.
- All **36 model, compiler, protocol, runtime, and content tests passed**. They cover edited-source output, await values/order, thenable adoption, rejection recovery, TTLs, stale refills, single-flight, fresh-run isolation, cleared timers, loop budgets, no-op programs, import errors, accessor-safe snapshots, aliases versus cycles, malformed messages, source escaping, persistence, prerequisites, and architectural decisions.
- HTTP checks passed for **158 public prerendered routes/assets**, plus an unknown-lesson **404**.
- All **150 unique lesson-reference and coverage-guide URLs returned HTTP 200** at review time. REFERENCE-CHECK.json records statuses and redirect targets. This is a point-in-time reachability check.
- Source and Markdown passed Prettier. The archive excludes dependencies/build caches and is reopened with CRC validation.

## Executable playground browser checks

The original 13 runtime/React/cache starters have the following browser evidence:

| Area             | Observed result                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| Tasks/microtasks | Actual worker output A → E → C → D → B                                          |
| Await            | Synchronous prefix → caller → continuation → returned value                     |
| Assimilation     | Getter → script end → then invocation → explicit microtask → adopted result     |
| Closures         | Counter shares one binding; let callbacks report 0, 1, 2                        |
| Rejection        | Throw → recovery → fulfilled value 7                                            |
| Batching         | Functional updaters produce 3; edited snapshot replacements produce 1           |
| Strict Mode      | Two render entries, one initial Profiler commit, effect setup → cleanup → setup |
| Effects          | Switching rooms cleans up the old effect; removing the child cleans up the next |
| Keys             | Ada's edited state stays with entity A after reversal                           |
| Memo             | App renders twice while stable-prop Child remains at one entry                  |
| Cache-aside      | Cached 100 survives origin update; expiry refills 125                           |
| Stale refill     | An older read repopulates 100 after origin 125 and invalidation                 |
| Single-flight    | Three callers share one origin request                                          |
| SWR              | Stale 100 returns immediately; the later read sees refreshed 125                |

Additional interaction checks:

- CodeMirror edits and Ctrl/Cmd Enter run the changed program. Run-on-edit captures new output; replay selects recorded source lines.
- Editing TTL to zero changes the pre-expiry result and observed store.
- A runaway loop produces a bounded error; reset and another run recover.
- Per-example drafts preserve edits, reset, and intentionally empty source across rapid switches and reloads.
- Worker network access is blocked by CSP. The opaque React frame cannot read parent DOM or local storage, and its network requests are blocked. Expected CSP diagnostics belong to these negative checks.
- Unmount root runs React cleanup. Stop removes the runtime. Replay scrubs evidence without rewinding the engine or live DOM.

## Curriculum and responsive checks

- Library: 148 lessons; deep-dive filter derives its count from levels. New invariants and prerequisite links render and resolve.
- Desktop 1440px and mobile 390px: readable lesson/playground layouts without horizontal page overflow. Code scrolls within its editor.
- Mobile navigation contains keyboard focus, handles Escape, and closes after destination selection. Tab leaves the code editor.
- Original workspace/model checks remain covered: system-map filtering, search, note/progress persistence, quiz explanations, architecture/SOLID selection, cache invalidation, obsolete workflow rejection, discarded React candidates, role denial, closure retention, engine fallback, and partial streaming failure.

## Evidence limits

These checks establish the tested application paths and program behavior. They do not prove every contextual snippet is standalone, every browser/host behaves identically, or that instrumentation exposes private engine queues, Fiber state, or Next.js/CDN caches. Timings include instrumentation/development overhead. The local sandboxes support bounded learning examples rather than comprehensive hostile-code containment.

## JavaScript mastery revision

- Six stages contain all 64 JavaScript/async chapters exactly once; the whole registry has 148 lessons. Every new prerequisite and coverage link resolves.
- All 40 added chapters contain worked edge-case answers and named execution contexts. All 36 self-contained new chapter programs execute in fresh workers; all 50 starters compile.
- Separate semantic checks establish derived-field initialization order, lazy iterator early closure, and async-generator cleanup. Suspended generator lifetimes are omitted from the panel rather than misrepresented.
- Browser review covers the first chapter's exact source, collections, private-field construction, iterator helpers, async iteration, stage selection, search, 19 coverage rows, built-in reference details, and revealable worked answers.
- Desktop and mobile course layouts have no horizontal page overflow. Per-stage outcomes/projects and the JavaScript-specific chapter sequence remain inspectable.
- Newer built-ins are checked against runtime capabilities. Node 24.19 has iterator helpers, Array.fromAsync, Float16Array, Set composition, RegExp.escape, and Symbol.dispose; native Temporal is absent in that tested Node environment and is explicitly feature-dependent in the course.

All 42 JavaScript experiments also completed successfully in the final production browser, including every new runnable chapter. Coverage tabs, reference details, path filters, and worked answers were checked through the UI. The mobile drawer is hidden from focus/accessibility when closed and leaves dialog mode when crossing to the desktop breakpoint.

## GitHub Pages release

- A static project-site export with `/under-the-hood` as its base path passed the optimized build and TypeScript checks. The export has 833 files; 6,428 local navigation/asset references resolve, including local fonts, deep lesson URLs, the React runtime, and the worker host.
- All 42 JavaScript experiments and all four cache algorithms completed in the static browser preview. All four React starters mounted from the project prefix. Batching reached 3, room switches/unmounts cleaned up effects, edited row state followed entity A after reversal, and a parent update preserved the memoized child's single render entry.
- A worker fetch to a valid absolute local URL was blocked with TypeError, and IndexedDB access was blocked with SecurityError in the opaque worker. The static preview supplies no custom CSP response headers. A new test verifies the worker host's generated inline-script CSP hash, taking the suite to 36 passing tests.
- The deployment workflow checks tests, static compilation, and exported targets before publishing. The normal server build remains available separately.

The first public deployment succeeded in [GitHub Actions](https://github.com/omarRadwann/under-the-hood/actions/runs/41223088745). Post-deployment HTTP checks passed for all 158 public routes/assets and an unknown-lesson 404. The live JavaScript, cache, and React playgrounds also executed successfully over HTTPS. `LIVE-VERIFICATION.json` records the public URL and HTTP results; this supplements the fuller static-preview regression above.

Final v1.3 static checks: 882 exported files, 7,319 local link/asset targets resolved, and 167 public application routes/assets returned 200 in the header-free static preview. The unknown lesson returned 404. Desktop 1440px and mobile 390px had no horizontal page overflow; closed mobile navigation was absent from focus/visibility. The compact domain picker selected the matching exercise. A new CSS lesson's rearranged quiz accepted the correct semantic answer, and the expanded Liskov mechanism rendered. No browser errors were reported during these checks. The release manifest and post-deployment smoke checker also verify exact revision and route/404 behavior for future releases.
