import { lesson } from "./helpers";

export const platform = [
  lesson("network", {
    slug: "css-layout-and-containment",
    title: "CSS sizing, containing blocks & containment",
    description:
      "Explain overflow, intrinsic sizing, stacking contexts, cascade layers, and layout isolation from their actual constraints.",
    level: "Deep dive",
    execution: "browser",
    language: "css",
    minutes: 40,
    prerequisites: ["browser-rendering"],
    invariant:
      "A component's geometry and overlay behavior must hold under its real content, ancestors, writing mode, and available space.",
    mental:
      "CSS solves constraints in formatting contexts. A declared width is only one input: intrinsic content, minimum sizes, flex/grid rules, containing blocks, and the cascade also participate. Debug by identifying the rule that owns the final value rather than increasing specificity or z-index until one screenshot looks right.",
    steps: [
      {
        title: "Resolve the cascade before geometry",
        body: "Origin, importance, cascade layers, specificity, scoping proximity where applicable, and source order decide which declaration wins. Layers can make resets, vendor styles, components, and overrides explicit; an unlayered normal declaration outranks layered normal declarations. Inheritance and custom-property resolution are separate from selector matching. Inspect computed values and the winning declaration before changing a layout algorithm. A token's semantic meaning should survive theme and component boundaries.",
      },
      {
        title: "Separate available space from intrinsic size",
        body: "Flex items can retain an automatic minimum based on their content, and a grid track's minimum may prevent shrinking. Long identifiers, translated labels, images, and preformatted code reveal this. min-inline-size: 0 on a shrinkable item and minmax(0, 1fr) on the appropriate grid track can express the intended constraint. They are deliberate choices, not universal resets. Test min-content, max-content, wrapping, replaced elements, percentage dependencies, and definite versus indefinite sizes.",
      },
      {
        title: "Find the containing block and stacking context",
        body: "Absolutely positioned and fixed descendants derive geometry from containing-block rules, which can be affected by ancestors such as transformed elements. A stacking context groups descendants into a unit in its parent's stacking order; a huge z-index cannot escape that unit. Clipping and scrolling are additional constraints. Overlays may need a top-layer primitive or a portal with an explicit focus contract. Moving DOM can change CSS inheritance, layout, and accessible relationships.",
      },
      {
        title: "Use containment as a dependency decision",
        body: "Size, layout, style, and paint containment restrict different dependencies and have different consequences. content-visibility can skip rendering work, but intrinsic-size estimates and accessibility behavior still require review. Container queries let a component respond to its container rather than only the viewport. Do not choose containment merely to silence a profile: verify that intrinsic sizing, focus targets, anchored UI, and offscreen content remain correct.",
      },
      {
        title: "Verify a matrix rather than one breakpoint",
        body: "Exercise narrow and wide containers, zoom, large text, RTL, vertical writing when supported by the product, long unbroken data, and missing media. Use logical properties when the domain is direction-independent. Prefer a minimal reproduction that removes unrelated CSS while preserving the ancestor that creates the problematic formatting or stacking context. Record both a geometric assertion and the interaction that exposes failure, such as focusing an offscreen menu item.",
      },
    ],
    code: ".workspace { display: grid; grid-template-columns: 16rem minmax(0, 1fr); }\n.workspace__content { min-inline-size: 0; }\n.card { container-type: inline-size; }\n.card__actions { display: flex; gap: .5rem; }\n@container (width < 28rem) { .card__actions { flex-direction: column; } }\n/* Test long content and zoom; these constraints belong to this layout. */",
    pitfalls: [
      "Treating z-index as a global integer order.",
      "Applying overflow: hidden to conceal inaccessible content.",
      "Adding size containment without an intrinsic sizing plan.",
    ],
    practice:
      "Build a resizable card containing a long URL and a menu inside a transformed ancestor. Explain every overflow and stacking decision; verify at 200% zoom, RTL, and keyboard-only use.",
    quiz: {
      question: "Can a child escape its ancestor's stacking context by choosing a larger z-index?",
      choices: [
        "Yes, with enough digits",
        "No; its stacking context remains a unit",
        "Only with TypeScript",
      ],
      answer: 1,
      explanation:
        "The child is ordered inside its own stacking context. Changing a number does not move that context above a separate ancestor context.",
    },
    sources: [
      {
        title: "MDN · Containing blocks",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block",
      },
      {
        title: "MDN · CSS containment",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment",
      },
      {
        title: "MDN · Cascade",
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade",
      },
    ],
  }),
  lesson("engineering", {
    slug: "forms-focus-and-recovery",
    title: "Forms, focus & recoverable user intent",
    description:
      "Connect native submission, validation, focus, composition input, and accessible recovery.",
    level: "Deep dive",
    execution: "browser",
    language: "html",
    minutes: 35,
    prerequisites: ["accessibility", "dom-events-and-propagation"],
    invariant:
      "A failed submission preserves the user's recoverable intent and exposes an understandable next action.",
    mental:
      "A form is a browser interaction protocol, not a collection of onClick handlers. Its controls define submitted data, its semantics support input methods, and its recovery behavior determines whether a person can finish the task. Client checks improve feedback; the authoritative boundary still validates and authorizes the operation.",
    steps: [
      {
        title: "Let submission carry the intent",
        body: "A submit button can participate in implicit keyboard submission, and its name/value can distinguish intents. Give non-submit buttons type=button. Named successful controls contribute to FormData; disabled controls generally do not, and repeated names require getAll rather than a scalar assumption. requestSubmit invokes submission behavior and constraint validation; directly calling submit bypasses those mechanisms. Test Enter from relevant inputs as well as pointer activation.",
      },
      {
        title: "Model validation and failure separately",
        body: "Distinguish field format, cross-field domain rules, authorization, conflicts, and uncertain network outcomes. Native constraints help, but server validation must handle crafted requests. Keep field errors associated with their inputs and provide a useful summary for multi-field failure. Avoid resetting all values on a failed save. An ambiguous timeout after a remote commit needs an operation lookup or idempotency policy rather than an automatic duplicate mutation.",
      },
      {
        title: "Preserve input-method behavior",
        body: "Composition events, autocomplete, password managers, spellcheck, mobile input keyboards, and selection are part of the interface contract. A keydown handler that submits on Enter without considering IME composition can interrupt text entry. A controlled React input should update its value synchronously from the editing event; expensive derived work can be deferred separately. Do not trim or transform every keystroke if it destroys the person's intermediate editing state.",
      },
      {
        title: "Make focus an owned resource",
        body: "Move focus when it helps explain a meaningful change, such as opening a modal or revealing an error summary. Restore it to a sensible surviving control when an interaction closes. Removing a focused row requires a next-target policy. A visual order changed by CSS does not automatically change reading or tab order. Inert backgrounds, modal top-layer behavior, scroll locking, and live announcements are distinct concerns; test them together with zoom and a screen reader.",
      },
      {
        title: "Specify pending and resubmission behavior",
        body: "Show a pending state without hiding the task or disabling every recovery action. If disabling a submitter prevents a duplicate, confirm its intent is captured before controls change. Preserve meaningful retry data while avoiding credential retention. For uploads, distinguish selection, transfer, server processing, and final confirmation. Measure completion and recovery outcomes rather than only whether a validation library returns true.",
      },
    ],
    code: '<form action="/profile" method="post">\n  <label for="display-name">Display name</label>\n  <input id="display-name" name="displayName" required autocomplete="nickname">\n  <button type="submit" name="intent" value="save">Save profile</button>\n  <button type="button">Cancel editing</button>\n</form>\n<!-- The server must validate, authorize, and preserve recoverable input on failure. -->',
    pitfalls: [
      "Handling only the submit button's click.",
      "Dropping repeated FormData values or disabled-control intent.",
      "Treating client validation as the trust boundary.",
    ],
    practice:
      "Implement an account form with two submit intents. Test Enter, IME composition, autofill, duplicate submission, field and server errors, a lost response after commit, and focus recovery.",
    quiz: {
      question: "Which API requests normal form submission with validation behavior?",
      choices: ["form.submit()", "element.click() on any div", "form.requestSubmit()"],
      answer: 2,
      explanation:
        "requestSubmit follows the form submission path, including validation and submit-event behavior; submit bypasses those steps.",
    },
    sources: [
      {
        title: "MDN · form",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form",
      },
      {
        title: "MDN · requestSubmit",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit",
      },
      {
        title: "WAI · Form notifications",
        url: "https://www.w3.org/WAI/tutorials/forms/notifications/",
      },
    ],
  }),
  lesson("network", {
    slug: "browser-storage-and-coordination",
    title: "Browser storage, transactions & multi-tab ownership",
    description:
      "Design IndexedDB migrations, storage failure, cross-tab notification, and coordination without confusing durability with authority.",
    level: "Deep dive",
    execution: "browser",
    minutes: 40,
    prerequisites: ["transactions-and-isolation", "service-workers-and-offline"],
    invariant:
      "Local state survives only under its stated storage contract; notifications and locks do not replace authoritative conflict resolution.",
    mental:
      "A browser origin has several storage and coordination facilities with different lifetimes. Local state can be evicted, unavailable, stale in another tab, or incompatible with a new deployment. Design an explicit data version, transaction boundary, synchronization protocol, and recovery path rather than treating localStorage as a small database server.",
    steps: [
      {
        title: "Choose storage by operation and lifetime",
        body: "Web Storage is synchronous and string-based. IndexedDB supports asynchronous structured data, indexes, and transactions. Cache Storage holds request/response representations, not arbitrary transactional application records. Capacity, persistence grants, partitioning, private browsing, and eviction vary by environment. Handle denied access and quota errors as ordinary failures. Device-local browser storage is not a backup or a secure boundary against script executing with the same origin's authority.",
      },
      {
        title: "Observe transaction completion",
        body: "An IndexedDB request succeeding does not prove that its containing transaction committed. Resolve the operation on transaction completion and reject on abort/error. Keep operations inside the transaction's active lifetime: arbitrary network awaits can leave it inactive before the next request. Validate records before opening a short transaction, and use one transaction for the atomic local change that the product requires. A local transaction cannot atomically commit an unrelated remote service.",
      },
      {
        title: "Plan upgrades while older tabs exist",
        body: "Schema upgrades occur through a version-change transaction. Another connection can block the upgrade; existing connections should close on versionchange and the UI should explain when a reload is needed. Make migration behavior observable, preserve unsupported records where appropriate, and test interrupted upgrades with actual browsers. Separate storage-schema version from the server API version. A newly deployed client may coexist with an old service worker and an old tab.",
      },
      {
        title: "Separate notification from coordination",
        body: "BroadcastChannel can notify same-storage-partition participants, but it is not a durable event log and a sleeping tab can miss context. Re-read authoritative local state after a notification. Web Locks can coordinate cooperating contexts around a named resource; they do not prevent a remote device from updating the server. A lease-like leader election needs crash recovery and fencing at the real commit authority. Never infer global exclusivity from one browser's lock.",
      },
      {
        title: "Reconcile offline intent deliberately",
        body: "Represent queued mutations with stable operation IDs, status, schema version, and retry policy. On reconnection, revalidate authorization and resolve conflicts using server versions or domain rules. A replay queue needs bounded growth, cancellation, poison-record handling, and a visible failure state. Test account switching: one user's pending operations must not silently run under another user's session. Decide what logout deletes and what requires explicit user recovery.",
      },
    ],
    code: "function saveRecord(db, record) {\n  return new Promise((resolve, reject) => {\n    const tx = db.transaction('records', 'readwrite');\n    tx.oncomplete = () => resolve(undefined);\n    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));\n    tx.onerror = () => {}; // abort handler owns the rejected outcome\n    tx.objectStore('records').put(record);\n  });\n}\n// db is an opened, migrated IDBDatabase; request success is not commit.",
    pitfalls: [
      "Resolving when put succeeds while the transaction can still abort.",
      "Awaiting a fetch midway through a short IndexedDB transaction.",
      "Treating BroadcastChannel as a durable message queue.",
    ],
    practice:
      "Create a two-tab offline editor. Block a version upgrade, close the old connection, simulate quota failure, switch accounts with queued work, and reconcile two conflicting remote revisions.",
    quiz: {
      question: "Which event establishes successful IndexedDB transaction completion?",
      choices: [
        "The first request's success",
        "The transaction's complete event",
        "A BroadcastChannel message",
      ],
      answer: 1,
      explanation:
        "Request success is an intermediate result. The transaction can still fail before the complete event establishes its successful outcome.",
    },
    sources: [
      {
        title: "MDN · Using IndexedDB",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB",
      },
      {
        title: "MDN · Web Locks",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API",
      },
      {
        title: "MDN · Storage quotas and eviction",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria",
      },
    ],
  }),
  lesson("network", {
    slug: "observers-and-frame-scheduling",
    title: "Observers, animation frames & measurement loops",
    description:
      "Choose MutationObserver, ResizeObserver, IntersectionObserver, and frame scheduling by the evidence each API actually provides.",
    level: "Deep dive",
    execution: "browser",
    minutes: 35,
    prerequisites: ["browser-rendering", "event-loop"],
    invariant:
      "A measurement callback must converge and release all registrations when its owner ends.",
    mental:
      "Observers deliver selected evidence under host-defined processing rules. They do not expose one universal 'after render' callback. Choose the observable fact you need, keep callbacks bounded, and avoid a feedback cycle in which measuring and writing geometry continuously invalidate one another.",
    steps: [
      {
        title: "Observe the fact rather than an approximate event",
        body: "MutationObserver reports configured DOM mutations, not every visual change. ResizeObserver reports selected element box size changes, including changes unrelated to window resize. IntersectionObserver reports threshold-based intersection changes with a root; it is asynchronous and is not a complete proof that a person saw unobscured content. Font loading, ancestor styles, clipping, transforms, and visibility each affect what evidence is relevant. Document why one observation is sufficient for the product decision.",
      },
      {
        title: "Separate measurement and mutation",
        body: "A ResizeObserver callback that changes its own observed size can create repeated delivery and loop errors. Compare against a stable target, avoid unnecessary writes, and choose an architecture that converges. Deferring a write to a frame can change timing but does not mathematically fix a divergent dependency. A one-pixel oscillation still oscillates. Test with fractional geometry, zoom, scrollbar changes, and wrapping text rather than only integer dimensions.",
      },
      {
        title: "Understand what an animation frame promises",
        body: "requestAnimationFrame schedules a callback for a rendering opportunity and supplies a time value suitable for time-based animation. It is not proof that an earlier update was painted to the display, and a promise microtask is not an input-yield guarantee. Background throttling and display refresh rates vary. Advance animations by elapsed time rather than counting frames. Keep reads and writes organized, and inspect browser traces when making a performance claim.",
      },
      {
        title: "Own registration and pending work",
        body: "Disconnect observers, unobserve departing targets, and cancel owned frame callbacks. React effects should establish one synchronization process and undo it symmetrically; development setup/cleanup probes should not leak duplicate registrations. A virtualized list can reuse DOM nodes, so associate measurements with current entity identity and discard obsolete callbacks. A late measurement for an old item should not overwrite the new item's layout model.",
      },
      {
        title: "Prove behavior with controlled changes",
        body: "Create a diagnostic panel recording observation type, target identity, box size, and the write it triggers. Reproduce an ancestor resize, text reflow, a target replacement, and a hidden/background transition. Test cleanup by unmounting during a scheduled frame. Use actual browser integration checks for geometry; a DOM emulator with no real layout cannot establish pixel-size correctness.",
      },
    ],
    code: "const panel = document.createElement('div');\npanel.textContent = 'Resize this panel or its container.';\ndocument.body.append(panel);\nconst observer = new ResizeObserver(entries => {\n  for (const entry of entries) {\n    console.log(entry.target.id, entry.contentRect.width);\n  }\n});\nobserver.observe(panel);\n// Cleanup when the owner ends:\n// observer.disconnect(); panel.remove();\n// Measure only; any geometry write needs a separate convergence rule.",
    pitfalls: [
      "Calling an IntersectionObserver notification proof of human visibility.",
      "Moving a divergent resize loop into requestAnimationFrame.",
      "Testing real geometry exclusively in a layout-free DOM emulator.",
    ],
    practice:
      "Build a measured virtual row with identity tokens. Reuse its node for another item, trigger a font-size change, and prove an obsolete measurement and a pending frame cannot update the departed owner.",
    quiz: {
      question: "Does deferring every resize-induced write to a frame guarantee convergence?",
      choices: ["Yes", "Only on 60Hz screens", "No; the size dependency can still oscillate"],
      answer: 2,
      explanation:
        "Scheduling changes when a cycle advances. A separate stable sizing rule is needed to make the cycle converge.",
    },
    sources: [
      {
        title: "MDN · ResizeObserver",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver",
      },
      {
        title: "MDN · requestAnimationFrame",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame",
      },
      {
        title: "MDN · Intersection Observer",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API",
      },
    ],
  }),
  lesson("engineering", {
    slug: "typescript-type-algebra",
    title: "Type algebra, inference & honest generic APIs",
    description:
      "Use conditional, mapped, indexed, and template-literal types without hiding runtime uncertainty or compiler cost.",
    level: "Deep dive",
    execution: "reference",
    language: "typescript",
    minutes: 40,
    prerequisites: ["typescript-boundaries", "typescript-variance"],
    invariant:
      "A generic API preserves a useful relationship the implementation can honor; a type assertion is not runtime evidence.",
    mental:
      "TypeScript computes relationships between sets of possible values. Its transformations help express APIs, but JavaScript still executes without those types. Design the runtime contract first, use inference to preserve meaningful correlations, and keep validation at boundaries where external values enter.",
    steps: [
      {
        title: "Preserve correlations instead of widening everything",
        body: "A key constrained by keyof T can relate the selected key to T[K]. If related values are represented as independent unions, the relation may be lost. Discriminated unions encode valid combinations and enable control-flow narrowing. Use unknown for unvalidated data and narrow with real checks. never represents an impossible branch and can support exhaustive handling, but an assertion to never does not make an unexpected production value disappear.",
      },
      {
        title: "Control conditional distribution",
        body: "A conditional type over a naked type parameter distributes across union members. Wrapping the checked type in a tuple suppresses that distribution when the question concerns the whole union. infer introduces a type variable from a matching structure; it does not inspect runtime objects. Test empty unions, optional properties, readonly inputs, overloads, and any/unknown interactions before making a clever helper part of a public package.",
      },
      {
        title: "Transform keys and modifiers deliberately",
        body: "Mapped types can traverse keys, add or remove optional/readonly modifiers, and remap keys. Template-literal types can encode a finite protocol such as event names, but large combinations increase compiler work and can harm editor responsiveness. A mapped type over a DTO does not validate JSON or remove runtime properties. Keep serialization, defaulting, and trusted construction explicit rather than relying on a compile-time projection.",
      },
      {
        title: "Distinguish checking from conversion",
        body: "satisfies checks compatibility while retaining useful inferred information; it does not convert a value. as const narrows literal information and makes selected type positions readonly, but does not deeply freeze the runtime graph. A branded string can mark that an application passed a constructor's validation, but assertions can forge that brand. Hide unsafe construction behind a small boundary and keep the server's authoritative checks.",
      },
      {
        title: "Budget the type system like other computation",
        body: "Recursive conditional types, broad distributive unions, and enormous inferred object graphs can dominate build and editor time. Prefer a small named contract that users can read and errors can explain. Test types with positive examples and expected negative cases under the package's actual compiler options. Also test emitted JavaScript and declaration consumption in a separate fixture: a successful library build does not prove its exported declarations work for consumers.",
      },
    ],
    code: "type Item<T> = T extends readonly (infer U)[] ? U : T;\ntype IsAllText<T> = [T] extends [string] ? true : false;\nfunction read<T, K extends keyof T>(value: T, key: K): T[K] { return value[key]; }\nconst settings = { mode: 'dark', retries: 2 } as const;\nconst mode = read(settings, 'mode'); // type: 'dark'\ntype Mixed = Item<string[] | number>; // string | number\n// Run type checks with tsc; the playground erases types and cannot validate them.",
    pitfalls: [
      "Using as to conceal a missing runtime check.",
      "Assuming a conditional type always examines a union as one unit.",
      "Shipping recursive helpers without measuring consumer compiler cost.",
    ],
    practice:
      "Design a typed event API preserving event-name/payload relationships. Add rejected examples for invalid payloads, check union behavior, and benchmark declaration consumption from a second package.",
    quiz: {
      question: "What does wrapping T in [T] usually change in a conditional check?",
      choices: [
        "It enables runtime validation",
        "It suppresses naked-parameter distributivity",
        "It freezes the input",
      ],
      answer: 1,
      explanation:
        "A tuple-wrapped checked type tests the union as a whole rather than distributing the conditional across each union member.",
    },
    sources: [
      {
        title: "TypeScript · Conditional types",
        url: "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html",
      },
      {
        title: "TypeScript · Mapped types",
        url: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html",
      },
      {
        title: "TypeScript · Narrowing",
        url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
      },
    ],
  }),
  lesson("react", {
    slug: "actions-and-optimistic-state",
    title: "Actions, optimistic state & mutation ownership",
    description:
      "Separate Action scheduling, pending UI, speculative projection, server authority, and recovery.",
    level: "Deep dive",
    execution: "reference",
    language: "tsx",
    minutes: 40,
    prerequisites: ["state-and-batching", "concurrent-rendering", "optimistic-ui"],
    invariant:
      "An optimistic projection never becomes authoritative merely because it rendered; the confirmed mutation outcome owns reconciliation.",
    mental:
      "A mutation crosses several contracts: expressing user intent, showing pending work, projecting a likely outcome, committing at an authority, and reconciling the result. React Actions help organize asynchronous transitions and UI state. They do not add a database transaction, authorization, idempotency, or automatic cancellation of remote side effects.",
    steps: [
      {
        title: "Choose the Action entry and signature",
        body: "A function passed to a form action receives FormData and participates in React's Action behavior. Dispatch through an Action prop or a Transition so pending status participates in an Action context. useActionState returns state, a dispatch function, and pending state; its action receives the previous state before the dispatched payload. Passing that dispatcher to the form differs from manually calling an arbitrary async handler. Read the installed React version's Action rules, including how updates after awaits join transition context. Hook names do not prove that a mutation runs on a server.",
      },
      {
        title: "Make optimistic projection pure and rebasable",
        body: "useOptimistic derives a temporary view from a base value and queued intent using its reducer contract. Trigger optimistic updates within an Action or Transition. Keep the reducer pure because React may recompute the projection against an updated base. Use stable client operation IDs so confirmation can replace a pending entity instead of duplicating it. A server-assigned ID and a client correlation ID serve different purposes. Authoritative data updates and pending intent must combine consistently when responses arrive in a different order.",
      },
      {
        title: "Define failure and ordering policy",
        body: "Expected validation failures can return structured state; unexpected exceptions need an appropriate error boundary and observability. A failed optimistic operation may disappear, remain visibly retryable, or require a compensating action according to the product. Actions and transitions are UI mechanisms, not a total ordering of network requests or business transactions. Prevent an older confirmation from overwriting a newer accepted version. Repeated submissions need server-side idempotency where duplicated effects matter.",
      },
      {
        title: "Preserve form semantics and pending feedback",
        body: "useFormStatus reads the status of a parent form, so place the consuming component under that form. Native validation, submitter intent, focus, and error associations still matter. Function form actions can reset uncontrolled fields after success; choose recovery behavior intentionally. Framework-backed Server Functions can support progressive enhancement when composed appropriately, but a browser-only handler is not equivalent to a server endpoint that works before JavaScript loads.",
      },
      {
        title: "Test the mutation as a state machine",
        body: "Exercise two rapid submissions, reversed responses, a rejected optimistic insert, navigation during pending work, validation failure, and an ambiguous remote commit. Distinguish UI pending state from whether the server has committed. Check that a stale result cannot reset a newer draft and that rollback does not erase another operation's confirmed work. Record correlation IDs across browser, action boundary, and database logs without exposing sensitive payloads.",
      },
    ],
    code: "import { useActionState } from 'react';\n// saveProfile is an application operation with server validation and authorization.\nasync function action(previous, formData) {\n  const result = await saveProfile(formData.get('name'));\n  return result.ok ? { message: 'Saved' } : { message: result.message };\n}\nfunction ProfileForm() {\n  const [state, submit, pending] = useActionState(action, { message: '' });\n  return <form action={submit}>\n    <label>Name <input name=\"name\" required /></label>\n    <button disabled={pending}>Save</button>\n    <p role=\"status\">{state.message}</p>\n  </form>;\n}",
    pitfalls: [
      "Treating optimistic UI as an authoritative write.",
      "Forgetting useActionState's previous-state parameter.",
      "Assuming a transition cancels old server mutations.",
    ],
    practice:
      "Build a comment form with client correlation IDs. Reverse two responses, reject one operation, then navigate away. Show which projection rolls back and which committed data remains.",
    quiz: {
      question: "What must remain true of an optimistic reducer?",
      choices: [
        "It performs the database write",
        "It mutates the base array",
        "It is pure and can be recomputed against a new base",
      ],
      answer: 2,
      explanation:
        "Optimistic state is a projection. React can recompute it; side effects and mutation would make replay and rebasing unsafe.",
    },
    sources: [
      { title: "React · useActionState", url: "https://react.dev/reference/react/useActionState" },
      { title: "React · useOptimistic", url: "https://react.dev/reference/react/useOptimistic" },
      { title: "React · form", url: "https://react.dev/reference/react-dom/components/form" },
    ],
  }),
  lesson("nextjs", {
    slug: "request-isolation-and-cache-authority",
    title: "Request isolation, parallel reads & cache authority",
    description:
      "Keep request context, cached representations, authorization, and streaming boundaries coherent across users and instances.",
    level: "Deep dive",
    execution: "reference",
    language: "tsx",
    minutes: 40,
    prerequisites: ["nextjs-caching", "server-actions", "multi-tenant-security"],
    invariant:
      "Every protected operation authorizes the current actor and resource; a reused representation must respect its declared audience.",
    mental:
      "A request's identity and a cached computation's lifetime are different scopes. Read identity at the request boundary, authorize at the authoritative operation, and share only a representation whose key and policy make that audience safe. React rendering and a cache hit cannot substitute for this security contract.",
    steps: [
      {
        title: "Capture request context without making it global",
        body: "Next's cookies and headers APIs are asynchronous request-time facilities. A module-global mutable currentUser can be overwritten by another request while the first one awaits. Pass a validated request context through the operation or use a framework-supported request-scoped mechanism with a clear lifetime. Do not allow a caller-supplied tenant ID to become proof of membership. Authentication establishes an actor; authorization establishes permission for this particular operation and resource.",
      },
      {
        title: "Separate shared computation from authority",
        body: "A public product description can be shared more broadly than a negotiated tenant price or account balance. Include every relevant representation dimension in a shared key, but do not assume adding a role string makes a stale authorization decision safe. Recheck access at the mutation/read boundary and establish a policy for revocation. Cache Components examples require the enabled Next mode; declare partialPrefetching explicitly for this installed version, and check current configuration guidance when migrating.",
      },
      {
        title: "Start independent authorized work deliberately",
        body: "Awaiting each independent read before starting the next creates an avoidable waterfall. Start operations together only after the required authorization and input validation are established. One read may depend on another's result or permission, so parallelization is a dependency decision. Promise.all rejects its observation on one failure without canceling other work. Decide which regions can fail independently, and budget database pool capacity and downstream fan-out as well as response latency.",
      },
      {
        title: "Place streaming and transport decisions together",
        body: "A Suspense boundary controls reveal behavior; an HTTP status or outgoing cookie must be established at a suitable response boundary. Cookies cannot be set after the response has started streaming. Give personalized regions explicit boundaries under Cache Components rather than accidentally including runtime identity in a shared shell. Test direct requests, soft navigation, prefetched routes, and existing router state. Inspect both HTML and the RSC payload for accidental data exposure.",
      },
      {
        title: "Test concurrent identities and revocation",
        body: "Run two overlapping requests with different tenants, warm their caches, revoke access between requests, and repeat on two server instances. A happy-path single-user test cannot reveal cross-request contamination. Keep a matrix of data owner, cache key, audience, maximum stale budget, invalidation mechanism, and verification method. Treat request memoization, server caching, router caching, and CDN/browser storage as separate rows. The teaching app's Pages deployment executes none of these server operations.",
      },
    ],
    code: "// Server example: application-specific auth and repository ports.\nimport { cookies } from 'next/headers';\nexport async function readDashboard() {\n  const session = await authenticate((await cookies()).get('session')?.value);\n  await authorize(session.actor, 'read-dashboard', session.tenantId);\n  const [summary, activity] = await Promise.all([\n    repository.summary(session.tenantId),\n    repository.activity(session.tenantId),\n  ]);\n  return { summary, activity }; // return an explicitly allowed DTO\n}\n// Do not cache this wrapper globally or store session in a module variable.",
    pitfalls: [
      "A process-global currentUser shared by concurrent requests.",
      "Authorization checked only when a shared cache entry is created.",
      "Parallel reads started before validating the authority needed to perform them.",
    ],
    practice:
      "Write concurrent two-tenant integration tests, including warm caches and a revoked session. Inspect HTML/RSC data and repeat with two server instances plus an already-prefetched browser route.",
    quiz: {
      question:
        "Can a module-global mutable currentUser safely hold per-request identity across awaits?",
      choices: [
        "No; requests can overlap and overwrite it",
        "Yes, JavaScript has one call stack",
        "Only if it uses const",
      ],
      answer: 0,
      explanation:
        "One thread does not imply one request at a time. Asynchronous continuations can overlap shared mutable request state.",
    },
    sources: [
      {
        title: "Next.js · cookies",
        url: "https://nextjs.org/docs/app/api-reference/functions/cookies",
      },
      { title: "Next.js · Data security", url: "https://nextjs.org/docs/app/guides/data-security" },
      { title: "Next.js · Caching", url: "https://nextjs.org/docs/app/getting-started/caching" },
    ],
  }),
  lesson("network", {
    slug: "web-components-and-shadow-boundaries",
    title: "Custom elements, shadow DOM & integration contracts",
    description:
      "Integrate platform components through lifecycle, properties, slots, composed events, focus, and styling boundaries.",
    level: "Deep dive",
    execution: "browser",
    language: "javascript",
    minutes: 35,
    prerequisites: ["dom-events-and-propagation", "css-layout-and-containment"],
    invariant:
      "A component's public contract survives connection changes, property updates, and boundary crossing without leaking registrations.",
    mental:
      "A custom element supplies a platform-level component boundary. Shadow DOM affects tree traversal, event retargeting, and style scoping, but does not create a security sandbox. Define the public property, attribute, event, focus, and styling contract explicitly so framework and non-framework consumers can integrate predictably.",
    steps: [
      {
        title: "Design connection and upgrade behavior",
        body: "Custom elements can be constructed, connected, disconnected, moved, and upgraded at different times. Initialization in the constructor should respect the platform's construction constraints; connection work must tolerate re-entry without duplicate listeners. A property assigned before definition can shadow a prototype setter after upgrade unless the component handles it. Disconnection cleanup and reconnection must preserve the intended state and release resources such as observers and timers.",
      },
      {
        title: "Separate properties from serialized attributes",
        body: "Attributes are string-oriented declarative configuration; properties can carry structured values or functions. Reflection needs a deliberate conversion rule, especially for booleans, null, invalid numbers, and missing values. Avoid a reflection cycle that keeps writing the same attribute and triggering another update. State what consumers may mutate and which updates are observed. Framework integration can differ by version, so test the emitted DOM operations instead of assuming every JSX binding behaves identically.",
      },
      {
        title: "Define the event boundary",
        body: "Shadow DOM can retarget event.target. An event's bubbles and composed flags control different parts of propagation; composedPath supplies the accessible propagation path subject to shadow-root visibility. Choose an outward semantic event such as selection-change with a stable detail schema rather than exposing internal click coordinates. Specify cancellation if consumers can veto an action. Do not place confidential data in event details merely because the implementation uses a closed shadow root.",
      },
      {
        title: "Make styling and accessibility extension points explicit",
        body: "Slots compose light DOM into a rendered tree without simply copying it into the shadow tree. CSS custom properties and parts can expose selected styling hooks; inherited values and host styles still participate. Accessible names, form association, focus delegation, and keyboard interaction require separate design. A styled div inside a shadow root does not acquire button behavior. Prefer native interactive controls and verify the component in actual accessibility trees.",
      },
      {
        title: "Treat distribution as part of compatibility",
        body: "Namespace element names, define registration behavior, and avoid duplicate-definition crashes when bundles overlap. Test multiple consumers, lazy loading, server-rendered markup, and hydration ownership. Cross-team reuse needs a versioned contract for events, properties, styles, and failure behavior; sharing one tag name does not eliminate dependency management. A small platform component can reduce framework coupling, but a complex product workflow may still need stronger shared orchestration.",
      },
    ],
    code: "class StatusBadge extends HTMLElement {\n  static observedAttributes = ['label'];\n  constructor() {\n    super();\n    this.attachShadow({ mode: 'open' });\n  }\n  connectedCallback() { this.render(); }\n  attributeChangedCallback() { this.render(); }\n  render() {\n    this.shadowRoot.textContent = this.getAttribute('label') ?? 'Unknown';\n  }\n}\nif (!customElements.get('status-badge')) customElements.define('status-badge', StatusBadge);\n// A text-only badge; richer interactive components need separate focus/event contracts.",
    pitfalls: [
      "Treating a closed shadow root as a confidentiality boundary.",
      "Confusing composed with bubbles.",
      "Duplicating listeners every time connectedCallback runs.",
    ],
    practice:
      "Build a selectable custom element and consume it from React and plain HTML. Test pre-upgrade property assignment, reconnection, event retargeting, keyboard use, and two bundles registering the component.",
    quiz: {
      question: "Does a closed shadow root provide a security sandbox?",
      choices: ["Yes", "No; it is an encapsulation mechanism", "Only for JavaScript modules"],
      answer: 1,
      explanation:
        "Shadow DOM changes encapsulation and tree access behavior. It does not isolate code authority the way an appropriately sandboxed origin boundary can.",
    },
    sources: [
      {
        title: "MDN · Web Components",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components",
      },
      {
        title: "MDN · Using custom elements",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements",
      },
      {
        title: "MDN · Event composed",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Event/composed",
      },
    ],
  }),
];
