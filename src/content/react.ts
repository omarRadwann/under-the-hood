import { lesson } from "./helpers";

export const react = [
  lesson("react", {
    slug: "render-and-commit",
    title: "Render, reconcile & commit",
    description: "Separate speculative calculations from committed mutations and effects.",
    lab: "react",
    level: "Deep dive",
    minutes: 25,
    mental:
      "Rendering computes a candidate UI from a snapshot of inputs. Committing applies the selected result. React can call a component without committing its work; therefore rendering must not mutate external systems or depend on a component being called exactly once.",
    steps: [
      {
        title: "Schedule a candidate render",
        body: "A state update queues work; it does not rewrite the state variable in the currently running handler. React calls components with a snapshot of props and state. In concurrent rendering, work may be paused, restarted, or discarded before commit.",
      },
      {
        title: "Reconcile by identity",
        body: "React compares elements by their type, position, and keys within the relevant parent. It determines which component state to preserve and what host mutations would be required. A render does not necessarily imply a DOM mutation, and reconciliation is not a generic optimal tree-edit solver.",
      },
      {
        title: "Commit the selected tree",
        body: "React applies DOM changes and handles commit-phase work, including refs and layout effects. useLayoutEffect runs before paint and can block it. Passive effect timing depends on the update; useEffect is not an unconditional 'after paint' guarantee. An update inside a layout effect can also affect scheduling.",
      },
      {
        title: "Interpret development probes correctly",
        body: "Strict Mode deliberately re-invokes render logic and, when applicable, performs additional effect setup and cleanup checks in development. This exposes impure rendering and missing cleanup. The simulator shows a conceptual production mount/update/unmount trace, not a complete implementation of React's scheduler.",
      },
    ],
    code: `function Counter() {\n  const [count, setCount] = useState(0);\n  useLayoutEffect(() => {\n    // Measure committed DOM; keep synchronous work small.\n  }, [count]);\n  useEffect(() => {\n    const stop = subscribe(count);\n    return stop; // cleanup before re-sync / on unmount\n  }, [count]);\n  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;\n}`,
    pitfalls: [
      "Performing subscriptions, mutations, or network requests in render.",
      "Assuming useEffect always runs after a visible paint.",
      "Treating extra development calls as a production lifecycle contract.",
    ],
    practice:
      "Use the simulator to mount, update, and unmount. For each phase, classify which work may be discarded and which has external side effects. Then inspect an actual component with React DevTools Profiler.",
    quiz: {
      question: "React calls a component but abandons that render. What must remain safe?",
      choices: [
        "A request started in render",
        "The render's pure calculations",
        "A global mutation in render",
      ],
      answer: 1,
      explanation:
        "Pure calculations can be repeated or discarded. External side effects need event handlers or an appropriate effect with cleanup.",
    },
    sources: [
      { title: "React · Render and commit", url: "https://react.dev/learn/render-and-commit" },
      { title: "React · useEffect timing", url: "https://react.dev/reference/react/useEffect" },
    ],
  }),
  lesson("react", {
    slug: "state-and-batching",
    title: "State snapshots, queues & batching",
    description:
      "Understand functional updates, stale closures, and why three updates may increment once.",
    lab: "react",
    mental:
      "Each render gives your handler a snapshot. Calling a setter schedules future work. Functional updaters describe transformations that React applies in order, while replacement updates carry a value calculated from the existing snapshot.",
    steps: [
      {
        title: "Read the snapshot, not a live variable",
        body: "Within one handler, count keeps the value from the render that created that handler. An async callback retains that snapshot too. Waiting does not magically refresh a closure; use an updater for state transformations or restructure ownership of asynchronous reads.",
      },
      {
        title: "Process the update queue",
        body: "Calling setCount(count + 1) three times enqueues the same replacement value. Calling setCount(c => c + 1) three times composes three transformations. Updaters must be pure because React may invoke them more than once in development to verify correctness.",
      },
      {
        title: "Batch without assuming zero intermediate work",
        body: "Modern React batches many updates, including updates in promises and timers. Separate intentional user events are handled separately. flushSync can force a synchronous commit for unusual integration cases, but it can hurt performance and expose pending fallbacks.",
      },
    ],
    code: `// In a handler where count is 0:\nsetCount(count + 1);\nsetCount(count + 1);\nsetCount(count + 1); // next count: 1\n\n// A different example, starting from 0:\nsetCount(c => c + 1);\nsetCount(c => c + 1);\nsetCount(c => c + 1); // next count: 3`,
    pitfalls: [
      "Mutating state objects and expecting identity checks to notice.",
      "Using a ref as a substitute for every stale-closure problem.",
      "Putting side effects inside a state updater.",
    ],
    practice:
      "Implement a queued shopping-cart quantity update. Test two rapid increments while a network request is pending, and explain which state belongs on the server versus locally.",
    quiz: {
      question: "Starting at zero, three setCount(c => c + 1) calls result in…",
      choices: ["1", "3", "An undefined order"],
      answer: 1,
      explanation:
        "React applies the pure updater functions sequentially to the queued state: 0 → 1 → 2 → 3.",
    },
  }),
  lesson("react", {
    slug: "effects-and-cleanup",
    title: "Effects as synchronization",
    description: "Model setup and cleanup instead of translating class lifecycle methods.",
    lab: "react",
    mental:
      "An effect keeps an external system synchronized with reactive inputs. Its lifecycle is start synchronization, stop synchronization, then possibly start again. Derived values and user-triggered business operations usually do not need an effect.",
    steps: [
      {
        title: "Describe one synchronization process",
        body: "Connect a chat subscription to roomId, or attach a browser observer to an element. Split unrelated processes into separate effects so each has its own dependencies and cleanup. Computing filtered rows from props is render-time derivation, not external synchronization.",
      },
      {
        title: "Include actual reactive dependencies",
        body: "React compares dependency values using Object.is. Suppressing exhaustive-deps often hides stale data. Stabilize ownership, move helper construction inside the effect where appropriate, or remove unnecessary object dependencies through restructuring rather than omitting real inputs.",
      },
      {
        title: "Make teardown symmetric",
        body: "Before re-running with changed dependencies, React runs the previous cleanup. Unmount also cleans up. Handle races for async work with cancellation and ownership guards. An async effect callback returns a promise instead of cleanup, so place the async function inside the effect.",
      },
      {
        title: "Separate reactive synchronization from Effect Events",
        body: "useEffectEvent can read the latest committed values for event logic fired from Effects without making that logic resynchronize the Effect. It is not a shortcut for omitting real dependencies. Call Effect Events only from supported Effect contexts, do not pass them around as ordinary callbacks, and follow the current hooks linter. Their identity is not a general stable-callback guarantee.",
      },
    ],
    code: `useEffect(() => {\n  const controller = new AbortController();\n  let active = true;\n  async function load() {\n    try {\n      const data = await getRoom(roomId, controller.signal);\n      if (active) setRoom(data);\n    } catch (error) {\n      if (!controller.signal.aborted) report(error);\n    }\n  }\n  void load();\n  return () => { active = false; controller.abort(); };\n}, [roomId]);`,
    pitfalls: [
      "Using an effect to copy props into state without a clear ownership rule.",
      "Disabling the dependency lint rule as a default fix.",
      "Forgetting subscription cleanup when an input changes.",
    ],
    practice:
      "Refactor a component containing five effects. Remove derivations, move click-triggered work into event handlers, and document the external system owned by each remaining effect.",
    quiz: {
      question: "When dependencies change, the previous effect cleanup runs…",
      choices: ["Before the new setup", "Only on unmount", "Before every render begins"],
      answer: 0,
      explanation:
        "Cleanup ends the previous synchronization before setup begins the new one for the changed inputs.",
    },
    sources: [
      {
        title: "React · Lifecycle of reactive effects",
        url: "https://react.dev/learn/lifecycle-of-reactive-effects",
      },
      { title: "React · useEffectEvent", url: "https://react.dev/reference/react/useEffectEvent" },
    ],
  }),
  lesson("react", {
    slug: "identity-and-keys",
    title: "Identity, keys & state preservation",
    description:
      "Explain disappearing inputs, state resets, and bugs caused by unstable list keys.",
    lab: "react",
    mental:
      "Component state belongs to an identity in the rendered tree. Type, position, and keys help React match the next tree to the previous one. Keys are local identity hints among siblings, not globally unique IDs and not ordinary props.",
    steps: [
      {
        title: "Match the same logical entity",
        body: "A stable key such as an entity ID keeps a row's state attached to the same entity during reorder. An index identifies a position, which is different when rows can move, insert, or delete. Reusing positions can attach input state to the wrong record.",
      },
      {
        title: "Reset intentionally",
        body: "Changing a component's key creates a new identity and resets its state. This can be useful for a form that should reset when accountId changes. It also causes cleanup and new setup, so using random keys creates constant remounting and lost focus.",
      },
      {
        title: "Keep component types stable",
        body: "Defining a component function inside another component creates a new function identity on each render. Using it as a component type can remount its subtree. Move stable component definitions to module scope and pass the required inputs explicitly.",
      },
    ],
    code: `{accounts.map(account => (\n  <AccountRow key={account.id} account={account} />\n))}\n\n// Deliberate reset when switching the edited account:\n<ProfileForm key={selectedAccount.id} account={selectedAccount} />`,
    pitfalls: [
      "Using Math.random() as a key.",
      "Assuming keys need only be unique across the entire application.",
      "Defining stateful child components inside their parent render.",
    ],
    practice:
      "Build a reorderable list of uncontrolled text inputs. Compare index keys with entity keys and observe which input value follows which entity.",
    quiz: {
      question: "Changing the key of a stateful form intentionally does what?",
      choices: [
        "Preserves its previous state",
        "Creates a new identity and resets state",
        "Only updates a DOM attribute",
      ],
      answer: 1,
      explanation:
        "A different key tells React the element represents a different identity, so the previous subtree is unmounted and a new one mounts.",
    },
  }),
  lesson("react", {
    slug: "concurrent-rendering",
    title: "Concurrency, transitions & Suspense",
    description:
      "Prioritize urgent input while treating interruptible rendering as a scheduling tool.",
    lab: "react",
    level: "Deep dive",
    mental:
      "Concurrent rendering is cooperative scheduling of candidate UI work, not multiple component functions executing in parallel on the same thread. A transition marks non-urgent updates so urgent interactions can take priority.",
    steps: [
      {
        title: "Keep urgent feedback immediate",
        body: "The controlled input's state should update immediately. Mark dependent expensive views as transitions or use a deferred value. Deferral does not make a single long synchronous function interruptible; break up CPU work or use a worker if necessary.",
      },
      {
        title: "Use Suspense-enabled resources",
        body: "Suspense coordinates a fallback when a child suspends during rendering through supported integrations such as lazy code or framework data. A fetch started inside useEffect does not automatically activate a Suspense boundary. Boundary placement shapes reveal behavior and perceived progress.",
      },
      {
        title: "Handle ordering beyond rendering priority",
        body: "Transitions affect scheduling, not business-level consistency. Async responses can arrive out of order. Use framework action mechanisms or explicit ordering and cancellation guards. A transition cannot guarantee that the server's latest write matches the user's latest intent.",
      },
    ],
    code: `const [text, setText] = useState('');\nconst [query, setQuery] = useState('');\nconst [pending, startTransition] = useTransition();\nfunction onChange(value: string) {\n  setText(value); // urgent input feedback\n  startTransition(() => setQuery(value));\n}\n// Render a costly result view from query, not text.`,
    pitfalls: [
      "Putting the controlled input update itself into a transition.",
      "Assuming startTransition offloads CPU work to a thread.",
      "Expecting useEffect fetching to automatically suspend.",
    ],
    practice:
      "Profile a searchable large list under CPU throttling. Compare urgent state, a deferred result view, list virtualization, and moving indexing to a worker.",
    quiz: {
      question: "What does a transition change?",
      choices: [
        "Update priority and interruptibility of render work",
        "The number of JavaScript main threads",
        "Network request order",
      ],
      answer: 0,
      explanation:
        "A transition marks non-urgent rendering work. It does not introduce parallel threads or solve remote response races.",
    },
    sources: [
      { title: "React · useTransition", url: "https://react.dev/reference/react/useTransition" },
      { title: "React · Suspense", url: "https://react.dev/reference/react/Suspense" },
    ],
  }),
  lesson("react", {
    slug: "memoization-and-context",
    title: "Memoization, context & profiling",
    description: "Find expensive work before adding identity-management overhead.",
    mental:
      "Memoization trades comparison, retained memory, and code complexity for avoided work. It is a performance technique, not a correctness boundary. Start by measuring commits and understanding which values change and why.",
    steps: [
      {
        title: "Understand the propagation graph",
        body: "A state update normally renders the owning component and recursively considers its children. memo may skip a child when props compare equal, but its own state and consumed context still cause updates. Context consumers update when their provider's value changes.",
      },
      {
        title: "Stabilize only meaningful identities",
        body: "useMemo caches a calculation and useCallback caches a function identity subject to dependencies. A single always-new prop can defeat an otherwise useful memo boundary. Incorrect custom comparators can retain stale callbacks and create behavioral bugs.",
      },
      {
        title: "Measure with production-like conditions",
        body: "Profile actual user interactions and representative data. Optimize broad context providers, state placement, algorithmic cost, and DOM count before blanket memoization. React Compiler may automate some memoization when configured; do not assume every project enables it.",
      },
    ],
    code: `const ThemeContext = createContext('dark');\nconst SessionContext = createContext<Session | null>(null);\n\n// Split contexts by ownership and update frequency.\n// A theme change need not broadcast a fresh giant app object.\nconst sorted = useMemo(() => expensiveSort(rows), [rows]);\n// Useful when rows is stable and the calculation is costly.`,
    pitfalls: [
      "Using memo as a guarantee a component never renders.",
      "Memoizing trivial expressions while ignoring a large DOM tree.",
      "Ignoring function props in a custom comparison.",
    ],
    practice:
      "Record a slow interaction in the Profiler. Write a before-and-after report with render cost, commit duration, and the changed propagation boundary.",
    quiz: {
      question: "Can a memoized component re-render when its consumed context changes?",
      choices: ["Yes", "No", "Only in development"],
      answer: 0,
      explanation:
        "memo compares props. Context subscriptions and the component's own state remain independent reasons for updating.",
    },
  }),
  lesson("react", {
    slug: "external-stores",
    title: "External stores & tearing",
    description:
      "Integrate mutable state with concurrent rendering through a consistent snapshot contract.",
    mental:
      "React needs a coherent snapshot of an external mutable store. If different components observe different versions in one candidate tree, the interface can tear. useSyncExternalStore supplies the subscription and snapshot protocol for this boundary.",
    steps: [
      {
        title: "Define a stable snapshot",
        body: "getSnapshot must return a cached value while the underlying store is unchanged. Returning a fresh object on every call can create repeated renders. Prefer immutable snapshots or cache a versioned projection of mutable state.",
      },
      {
        title: "Subscribe without losing updates",
        body: "The subscription returns an unsubscribe function. React coordinates snapshot checks with its rendering work so a change during a transition does not commit an inconsistent view. Stable subscribe identity avoids unnecessary resubscription.",
      },
      {
        title: "Respect server isolation",
        body: "Server-rendered applications need a getServerSnapshot matching hydration expectations. Never put user-specific mutable state in a process-global singleton that can leak across requests. State ownership and request isolation are more important than the choice of state library.",
      },
    ],
    code: `const listeners = new Set<() => void>();\nlet snapshot = { online: true };\nconst store = {\n  subscribe(fn: () => void) {\n    listeners.add(fn); return () => { listeners.delete(fn); };\n  },\n  getSnapshot: () => snapshot,\n};\n// useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot)\n// On change: replace snapshot, then notify listeners.`,
    pitfalls: [
      "Returning a new snapshot object without a store change.",
      "Sharing one user's server store with another request.",
      "Reading mutable external state directly in render without a subscription contract.",
    ],
    practice:
      "Implement a small immutable store with version numbers. Verify two subscribers always render the same version and hydration starts from a matching server snapshot.",
    quiz: {
      question: "Why should getSnapshot return the same identity when nothing changed?",
      choices: [
        "React uses snapshot equality to detect changes",
        "Objects cannot be returned",
        "It prevents all future updates",
      ],
      answer: 0,
      explanation:
        "Stable snapshot identity expresses that the store has not changed. A fresh identity on every read falsely signals continuous change.",
    },
    sources: [
      {
        title: "React · useSyncExternalStore",
        url: "https://react.dev/reference/react/useSyncExternalStore",
      },
    ],
  }),
  lesson("react", {
    slug: "react-server-components",
    title: "Server Components & hydration",
    description: "Distinguish the RSC payload, server-rendered HTML, and client module boundaries.",
    lab: "streaming",
    level: "Deep dive",
    mental:
      "A Server Component runs in a server environment and produces a serialized component result. A Client Component participates in the browser module graph and can use interactive state. Server-rendered HTML gives an initial view; hydration connects browser behavior to the matching tree.",
    steps: [
      {
        title: "Follow the module boundary",
        body: "use client marks a module entry and its transitive client dependencies. It does not mean the component is never rendered on the server: frameworks can pre-render Client Components into HTML. Server-only dependencies must remain outside the client graph.",
      },
      {
        title: "Pass serializable data and composed UI",
        body: "Values crossing the boundary must be supported by React's serialization protocol. Arbitrary closure functions cannot be passed as ordinary props; Server Functions have a distinct reference mechanism. A Server Component can pass rendered server content as children to a Client Component.",
      },
      {
        title: "Keep the first render deterministic",
        body: "Hydration expects the client result to match the server-rendered content. Locale, time, random IDs, and browser-only reads can cause mismatches. Keep secrets on the server and verify that supposedly private data does not enter HTML, props, or the RSC payload.",
      },
    ],
    code: `// page.tsx — Server Component\nimport { FavoriteButton } from './favorite-button';\nexport default async function Page() {\n  const product = await getProduct();\n  return <article><h1>{product.name}</h1>\n    <FavoriteButton productId={product.id} />\n  </article>;\n}\n// favorite-button.tsx begins with 'use client'\n// Keep the interactive boundary narrow.`,
    pitfalls: [
      "Equating use client with client-only HTML rendering.",
      "Passing database entities with secrets into client props.",
      "Importing a server-only data module into a client entry.",
    ],
    practice:
      "Inspect both the initial HTML and network RSC payload of a product page. Identify exactly which data and module references cross to the browser.",
    quiz: {
      question:
        "Does use client prevent a framework from producing initial HTML for that component on the server?",
      choices: ["Yes", "No", "Only when it has state"],
      answer: 1,
      explanation:
        "The directive establishes the client module boundary. Initial server HTML rendering and later browser hydration are separate concerns.",
    },
    sources: [
      {
        title: "React · Server Components",
        url: "https://react.dev/reference/rsc/server-components",
      },
      {
        title: "Next.js · Server and Client Components",
        url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
      },
    ],
  }),
];
