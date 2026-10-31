import { asyncJS } from "./helpers";
export const asyncCourse = [
  asyncJS({
    slug: "promise-combinators-and-timeouts",
    title: "Promise combinators, deadlines & losing work",
    level: "Deep dive",
    prerequisites: ["promises", "promise-assimilation", "cancellation-and-races"],
    description:
      "Choose all, allSettled, any, or race by their outcome contract, including empty inputs and cancellation.",
    mental:
      "A combinator observes outcomes from an iterable of inputs. It does not automatically start function values, cap concurrency, cancel losing work, or undo side effects. Empty inputs reveal important differences among the outcome contracts.",
    steps: [
      {
        title: "Specify the aggregate outcome",
        body: "all fulfills with results in input order when every input fulfills and rejects on the first observed rejection. allSettled reports every outcome. any fulfills on the first fulfillment and rejects with AggregateError only when all inputs reject. race follows the first settlement, whether fulfillment or rejection. Settlement order and result-array order are different concepts.",
      },
      {
        title: "Handle empty iterables explicitly",
        body: "all([]) and allSettled([]) produce fulfilled promises; handlers still run asynchronously. any([]) produces a rejected AggregateError, and race([]) remains pending. A combinator consumes an iterable, which can itself throw during iteration. Passing functions rather than calling them observes function values instead of scheduling their intended operations.",
      },
      {
        title: "Budget work separately from observation",
        body: "Mapping a thousand inputs to request functions before Promise.all can start a thousand requests. A concurrency limiter bounds active work; a deadline bounds total elapsed budget; cancellation requests cooperative shutdown. These concerns remain separate even when a convenience wrapper exposes one API.",
      },
      {
        title: "Clean up timeout mechanisms",
        body: "Racing a timeout rejects the observed result but normally leaves the operation running. Use the operation's AbortSignal or ownership protocol when shutdown is needed, and clear owned timeout registrations on normal completion. A deadline should include retries and queue time rather than restart a fresh budget for every attempt.",
      },
    ],
    code: `const delayed = (value, ms) => new Promise(resolve => setTimeout(() => resolve(value), ms));\nconst first = delayed('slow', 20);\nconst second = delayed('fast', 5);\nconsole.log('race:', await Promise.race([first, second]));\nconsole.log('all preserves input order:', await Promise.all([first, second]));\nconst outcomes = await Promise.allSettled([Promise.resolve(1), Promise.reject('no')]);\nconsole.log(outcomes);\ntry { await Promise.any([]); } catch (error) { console.log(error.name, error.errors.length); }`,
    pitfalls: [
      "Promise.race assumed to cancel its losing operation.",
      "all confused with a concurrency limiter.",
      "Treating any([]) and race([]) as equivalent empty cases.",
    ],
    practice:
      "Design a request wrapper with one end-to-end deadline, bounded attempts, cancellation, timeout cleanup, and idempotency constraints. Test success just before expiry, queued work, an uncooperative operation, and an ambiguous remote commit.",
    challenge: {
      prompt: "Does a rejection from all stop the other task?",
      solution: `const slow = new Promise(resolve => setTimeout(() => {\n  console.log('still running'); resolve(7);\n}, 10));\nPromise.all([slow, Promise.reject('failed')]).catch(() => console.log('aggregate rejected'));`,
      explanation:
        "The aggregate observes rejection, but the timer and its operation remain active. A separate cancellation protocol is needed to request shutdown.",
    },
    quiz: {
      question: "What happens to Promise.race([])?",
      choices: ["It remains pending", "It fulfills with []", "It rejects with AggregateError"],
      answer: 0,
      explanation: "With no input settlement to follow, the race has no outcome to adopt.",
    },
    sources: [
      {
        title: "MDN · Promise",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
      },
    ],
  }),
  asyncJS({
    slug: "concurrency-limits-and-fairness",
    title: "Concurrency limits, queues & scheduling fairness",
    level: "Deep dive",
    prerequisites: ["concurrency-control", "promise-combinators-and-timeouts", "event-loop"],
    description:
      "Bound active work and queue growth while preserving order, cancellation, and useful host progress.",
    mental:
      "Concurrency is how many operations are in progress; parallelism concerns simultaneous execution; throughput and latency are outcomes of a resource system. A queue needs admission, capacity, service, and cancellation rules rather than only Promise.all.",
    steps: [
      {
        title: "Start work at the admission boundary",
        body: "A limiter must receive task functions or another deferred protocol. If it receives already-started promises, the resource pressure has already happened. Validate limits as positive integers, account for empty input, and define whether returned results preserve input order or completion order.",
      },
      {
        title: "Define queue and failure behavior",
        body: "Bound waiting work as well as active work where demand can grow indefinitely. Decide whether one failure stops new admissions, whether active tasks are aborted, and whether every outcome is collected. A fail-fast returned promise does not by itself stop other workers from dequeuing more tasks.",
      },
      {
        title: "Propagate ownership and deadlines",
        body: "Queued tasks can become obsolete before they start. Recheck abort and deadline state at admission and after awaits before committing results. Retries consume capacity and budget too. Per-tenant admission can prevent one caller from monopolizing a shared pool; fairness is a policy, not a consequence of a small integer limit.",
      },
      {
        title: "Yield to the host when work is CPU-bound",
        body: "A limiter for I/O does not move CPU-heavy JavaScript onto another thread. Repeated promise continuations can also monopolize microtask processing rather than yield to input or paint. Split long computation into bounded host tasks or use workers when justified, and measure queue delay separately from service time.",
      },
    ],
    code: `const tasks = [1, 2, 3, 4].map(value => async () => {\n  await new Promise(resolve => setTimeout(resolve, 5));\n  return value * 2;\n});\nlet cursor = 0;\nconst results = new Array(tasks.length);\nasync function worker() {\n  while (cursor < tasks.length) {\n    const index = cursor++;\n    try { results[index] = { status: 'fulfilled', value: await tasks[index]() }; }\n    catch (error) { results[index] = { status: 'rejected', reason: String(error) }; }\n  }\n}\nawait Promise.all(Array.from({ length: Math.min(2, tasks.length) }, worker));\nconsole.log(results); // bounded active work, input-order outcomes`,
    pitfalls: [
      "Applying a limiter after all requests have started.",
      "Bounding workers while allowing an infinite waiting queue.",
      "Using recursive microtasks as a guarantee of UI fairness.",
    ],
    practice:
      "Extend the sample with positive-limit validation, queue admission bounds, cancellation, and a deadline. Test the maximum observed active count and prove obsolete queued tasks never start.",
    challenge: {
      prompt: "Why does limiting observation of existing promises fail to limit requests?",
      solution:
        "Calling fetch or another eager operation before enqueueing has already started its work. Enqueue a task function that the limiter invokes only when capacity is available.",
      explanation:
        "The admission boundary must surround initiation, not merely the later await of a handle to already-running work.",
    },
    quiz: {
      question: "What should an eager-operation limiter accept?",
      choices: [
        "Deferred task functions or an equivalent initiation protocol",
        "Only already-started promises",
        "Only completed values",
      ],
      answer: 0,
      explanation: "Deferring initiation lets the limiter decide when capacity is allocated.",
    },
    sources: [
      {
        title: "Node.js · Don't block the event loop",
        url: "https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop",
      },
    ],
  }),
  asyncJS({
    slug: "debounce-throttle-and-scheduling",
    title: "Debounce, throttle & latest-operation ownership",
    level: "Advanced",
    prerequisites: ["scope-and-closures", "function-call-semantics", "cancellation-and-races"],
    description:
      "Specify leading/trailing behavior, cancellation, flush, receiver preservation, and result ownership.",
    mental:
      "Debounce and throttle are invocation policies. They can reduce how often work begins, but they do not establish which asynchronous result may commit or guarantee exact wall-clock scheduling.",
    steps: [
      {
        title: "Choose the policy precisely",
        body: "Trailing debounce waits for a quiet interval after the latest call; leading debounce and throttling have different immediate and repeated-call behavior. Define what happens at interval boundaries and whether a maximum wait prevents starvation under continuous input. Name the expected behavior before choosing a library helper.",
      },
      {
        title: "Preserve call data intentionally",
        body: "A wrapper may need to retain the latest arguments and receiver, while avoiding stale references after invocation or cancellation. Returning a useful result from a delayed operation requires a stated promise/observation contract. Clear pending state before invoking user code so reentrant calls can establish their own next operation safely.",
      },
      {
        title: "Own cancellation and flush",
        body: "Unmount or navigation should cancel obsolete pending work when its owner ends. Flush deliberately executes pending work and must avoid a later duplicate timer invocation. A cancellation API for the timer does not cancel a request that already started. Also release retained arguments and receiver references so obsolete UI objects are not kept alive.",
      },
      {
        title: "Guard asynchronous commits separately",
        body: "A debounced search can still receive responses out of order. Use abort where supported and an operation-identity rule at the commit boundary. Timer delays are minimum scheduling thresholds subject to host policy, not precise clocks. Test call sequences with controlled timers and separately test request completion schedules.",
      },
    ],
    code: `function debounce(fn, delay) {\n  let timer;\n  function wrapped(...args) {\n    const receiver = this;\n    clearTimeout(timer);\n    timer = setTimeout(() => { timer = undefined; fn.apply(receiver, args); }, delay);\n  }\n  wrapped.cancel = () => { clearTimeout(timer); timer = undefined; };\n  return wrapped;\n}\nconst owner = { label: 'query', run: debounce(function(value) { console.log(this.label, value); }, 10) };\nowner.run('a'); owner.run('ab'); owner.run('abc');\nawait new Promise(resolve => setTimeout(resolve, 25));`,
    pitfalls: [
      "Debouncing mistaken for protection against stale responses.",
      "A wrapper losing dynamic this.",
      "Pending timers retaining obsolete component data after unmount.",
    ],
    practice:
      "Implement and document leading/trailing debounce with cancel and flush. Add a maximum-wait policy, then test reentrant calls, disposal, the final argument set, and reverse-order request completions.",
    challenge: {
      prompt: "Does canceling the debounce timer undo a request that already started?",
      solution:
        "No. It only cancels pending scheduled invocation under that wrapper's contract. Already-started work needs its own abort and result-ownership protocol.",
      explanation:
        "Scheduling admission and controlling the lifetime of an admitted operation are separate concerns.",
    },
    quiz: {
      question: "What does trailing debounce normally wait for?",
      choices: [
        "A quiet interval after the most recent call",
        "Every promise to settle",
        "A guaranteed exact timer tick",
      ],
      answer: 0,
      explanation:
        "It reschedules the pending invocation as calls continue; host scheduling still controls when an eligible timer actually runs.",
    },
    sources: [
      {
        title: "MDN · Debounce",
        url: "https://developer.mozilla.org/en-US/docs/Glossary/Debounce",
      },
      {
        title: "MDN · Throttle",
        url: "https://developer.mozilla.org/en-US/docs/Glossary/Throttle",
      },
    ],
  }),
  asyncJS({
    slug: "promise-construction-and-rejections",
    title: "Promise construction, settlement & rejection ownership",
    level: "Deep dive",
    prerequisites: ["errors-and-completion", "promises", "promise-assimilation"],
    description:
      "Avoid async executors, floating chains, double-settlement confusion, and unhandled-rejection surprises.",
    mental:
      "The Promise constructor runs its executor synchronously and observes that executor's synchronous completion. Settlement is protected against repeated attempts, but adopting another outcome and observing rejection involve additional protocols and host checkpoints.",
    steps: [
      {
        title: "Construct only at the right boundary",
        body: "Wrap callback-based work when a promise bridge is needed; do not unnecessarily wrap an operation that already returns a promise. The executor runs immediately. A synchronous throw before settlement rejects the promise, while a throw after a successful settlement cannot replace its outcome.",
      },
      {
        title: "Avoid async executors",
        body: "An async executor returns its own promise, but the constructor does not adopt that returned promise as the executor's result. A throw after an await can therefore reject an unrelated promise while the constructed promise remains pending. Use an async function directly or keep the callback bridge executor synchronous.",
      },
      {
        title: "Own the chain you create",
        body: "then, catch, and finally produce or participate in returned promise chains. Forgetting to return or observe a derived chain can create an unhandled rejection even when another promise was handled. finally usually preserves an outcome unless its callback throws or returns a rejecting thenable. A fulfillment callback that throws rejects the new promise.",
      },
      {
        title: "Treat host reporting as a policy boundary",
        body: "Browsers and Node report unhandled rejections under host-specific timing and policy. Attaching a handler eventually is different from attaching it before a host report checkpoint. Do not use a global handler as a replacement for local ownership. Newer helpers such as Promise.withResolvers or Promise.try require a target-runtime compatibility check; they do not remove error-observation obligations.",
      },
    ],
    code: `console.log('before constructor');\nconst promise = new Promise(resolve => {\n  console.log('executor now');\n  resolve(7);\n  throw new Error('cannot replace an already settled outcome');\n});\nconsole.log('after constructor');\nconsole.log('result:', await promise);\nconst recovered = await Promise.reject('failure').catch(() => 9);\nconsole.log('recovered:', recovered);`,
    pitfalls: [
      "An async Promise executor whose returned rejection is ignored.",
      "Ignoring the new promise returned by then.",
      "Expecting a global unhandled-rejection handler to restore local operation correctness.",
    ],
    practice:
      "Refactor three redundant or unsafe Promise constructors into direct async functions or synchronous callback bridges. Track every created promise's owner, including derived chains and cleanup failures.",
    challenge: {
      prompt: "Why can this constructed promise remain pending?",
      solution: `// Anti-pattern: do not run without owning the executor's separate rejection.\n// new Promise(async resolve => {\n//   await Promise.resolve();\n//   throw new Error('rejects the async executor result');\n// });\n// Prefer: async function work() { await Promise.resolve(); throw new Error('owned rejection'); }`,
      explanation:
        "The constructor ignores the async executor's returned promise. The intended constructed promise is never resolved or rejected through its supplied resolving functions in this path.",
    },
    quiz: {
      question: "Does the Promise constructor adopt an async executor's returned promise?",
      choices: ["No", "Yes", "Only if it rejects"],
      answer: 0,
      explanation:
        "The executor's return value is not the constructed promise's adoption protocol. Async functions should usually be used directly.",
    },
    sources: [
      {
        title: "MDN · Promise constructor",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise",
      },
      {
        title: "Node.js · unhandledRejection",
        url: "https://nodejs.org/api/process.html#event-unhandledrejection",
      },
    ],
  }),
];
