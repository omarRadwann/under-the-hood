# Verification record

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
