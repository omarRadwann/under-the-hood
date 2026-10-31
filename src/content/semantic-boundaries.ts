import { lesson } from "./helpers";

export const semanticBoundaries = [
  lesson("javascript", {
    slug: "strict-eval-and-source-goals",
    title: "Strict mode, eval & generated-function scope",
    description:
      "Separate parsing goals, inherited strictness, direct evaluation, and global code construction.",
    level: "Deep dive",
    execution: "worker",
    language: "javascript",
    minutes: 35,
    prerequisites: ["hoisting-and-tdz", "execution-context"],
    invariant:
      "A code-construction mechanism's environment and strictness must be understood before reasoning about its names or authority.",
    mental:
      "The same-looking source can resolve names differently depending on how it is parsed and invoked. Direct eval, indirect eval, Function construction, classic scripts, and modules do not share one universal scope rule.",
    steps: [
      {
        title: "Name the source goal",
        body: "A module is automatically strict and has module bindings; a classic script has different global-declaration rules. Top-level lexical declarations are not ordinary global-object properties. This worker editor uses a strict async function wrapper: it supports top-level-looking await without pretending to implement ESM linking or browser global-script declarations.",
      },
      {
        title: "Distinguish direct and indirect eval",
        body: "An ordinary direct eval call can use the calling lexical environment; strict eval keeps its own declarations from leaking into the caller. Aliasing eval, using the comma operator, or eval?.(...) invokes indirect evaluation in the global environment. Indirect evaluation does not inherit a caller's strictness; its own source can request strict mode. Renaming a local variable can therefore affect direct eval in ways that a normal static import does not.",
      },
      {
        title: "Keep Function construction out of caller scope",
        body: "Function constructs code against a global environment rather than closing over the local variables where it was constructed. Its generated body does not inherit the caller's strictness. Ordinary strict standalone calls keep undefined as this; a generated non-strict function can receive the global object instead. Reflective function source and stack locations inside this teaching editor include instrumentation and are not a copy of the authored source.",
      },
      {
        title: "Treat compatibility and authority separately",
        body: "A host's CSP can block dynamic code construction. Allowing a parser to accept code does not grant permission to execute it or make its authority safe. Use JSON parsing for data and avoid evaluating untrusted strings. Legacy sloppy-script Annex B behavior is contextual, not a rule to transplant into modules or strict code.",
      },
    ],
    code: "function inspectScope() {\n  const localName = 'inner';\n  console.log(eval('localName'));\n  console.log((0, eval)('typeof localName'));\n  console.log(Function('return typeof localName')());\n  console.log((function() { return this; })() === undefined);\n  console.log(Function('return this')() === globalThis);\n}\ninspectScope();\n// Only known literal source is evaluated here; never substitute untrusted input.",
    output: "inner\nundefined\nundefined\ntrue\ntrue",
    pitfalls: [
      "Assuming generated functions close over their construction site.",
      "Calling the worker wrapper a real ES module.",
      "Using eval to parse data or establish a security boundary.",
    ],
    practice:
      "Run the same controlled scope probe as a classic script and a real .mjs file. Record declaration visibility, this, eval mode, and CSP restrictions. Explain which differences the strict worker wrapper intentionally cannot reproduce.",
    challenge: {
      prompt: "Can Function read a caller's local secret by name?",
      solution:
        "function build() {\n  const secret = 'local';\n  return Function('return typeof secret');\n}\nconsole.log(build()()); // undefined",
      explanation:
        "Function construction uses a global environment rather than forming a closure over build. This example uses typeof so an unresolvable name produces a value rather than an ordinary reference-read exception.",
    },
    quiz: {
      question: "Inside a strict function, what does (0, eval)('typeof localOnly') inspect?",
      choices: [
        "The global environment, not the caller's local binding",
        "The caller's nearest lexical binding",
        "A frozen copy of every caller variable",
      ],
      answer: 0,
      explanation:
        "Producing the eval function value through the comma expression makes this an indirect eval call. Its source is evaluated globally and does not inherit the caller's local scope.",
    },
    sources: [
      {
        title: "MDN · eval: direct and indirect evaluation",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
      },
      {
        title: "MDN · Function constructor",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function",
      },
      {
        title: "MDN · Strict mode",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode",
      },
    ],
  }),
  lesson("async", {
    slug: "callback-boundaries-and-microtasks",
    title: "Event callbacks & microtask checkpoints",
    description:
      "Explain why a real user click and button.click() can expose different listener/microtask orderings.",
    level: "Deep dive",
    execution: "browser",
    language: "javascript",
    lab: "events",
    minutes: 35,
    prerequisites: ["event-loop", "dom-events-and-propagation"],
    invariant:
      "A queued microtask runs at an eligible checkpoint; synchronous nesting and host callback cleanup determine when that checkpoint can occur.",
    mental:
      "After the current task is a useful first model, but it is not the only checkpoint rule. The browser also performs defined script/callback cleanup. A native event dispatch with no author script left on the stack can expose checkpoints between listener callbacks, while a dispatch nested inside running JavaScript keeps that outer execution active.",
    steps: [
      {
        title: "Follow the author stack, not only the event name",
        body: "A physical user interaction starts host dispatch; a listener executes author JavaScript and then returns to the host. Cleanup can perform a checkpoint when the JavaScript execution-context stack is empty. A microtask queued by a capture listener can therefore run before a later listener in that dispatch. Do not treat the event name click as a complete ordering contract.",
      },
      {
        title: "Contrast a nested programmatic dispatch",
        body: "button.click() or dispatchEvent invoked inside an existing function dispatches synchronously. The caller remains active while nested listeners run, so their queued microtasks cannot interrupt that outer synchronous JavaScript. The programmatic example below logs capture, target, bubble, and returned before its queued microtasks. This is a consequence of the remaining execution context, not a special fast microtask queue.",
      },
      {
        title: "Capture event observations before returning",
        body: "currentTarget identifies the listener position while its callback is running; reading it later from a queued microtask does not recover that position. Capture the relevant primitive values before returning. isTrusted distinguishes browser-generated events from script dispatch in this example; it is not an authentication or authorization guarantee.",
      },
      {
        title: "Test real host behavior",
        body: "Use the live lab's actual target and its separate programmatic control. It records its own listeners and explicit microtasks, not every private host or framework job. This lesson concerns a browser DOM event path; a Node EventEmitter, worker EventTarget, React synthetic event handler, and an arbitrary callback API have different surrounding host contracts.",
      },
    ],
    context:
      "Browser DOM program. The shown expected output is for the explicit button.click() invocation while this script remains on the stack. Use the lab target for an actual browser interaction.",
    code: "const parent = document.createElement('div');\nconst target = document.createElement('button');\nparent.append(target);\nconst owner = new AbortController();\nfunction observe(label) {\n  console.log(label);\n  queueMicrotask(() => console.log('microtask from ' + label));\n}\nparent.addEventListener('click', () => observe('capture'), { capture: true, signal: owner.signal });\ntarget.addEventListener('click', () => observe('target'), { signal: owner.signal });\nparent.addEventListener('click', () => observe('bubble'), { signal: owner.signal });\ntarget.click();\nconsole.log('returned');\nowner.abort();",
    output:
      "capture\ntarget\nbubble\nreturned\nmicrotask from capture\nmicrotask from target\nmicrotask from bubble",
    pitfalls: [
      "Assuming all listeners of a user interaction form one uninterrupted JavaScript call.",
      "Using programmatic dispatch as proof of physical-interaction scheduling.",
      "Reading currentTarget after the listener returns and expecting its old value.",
    ],
    practice:
      "Record both lab paths. Annotate exactly when the outer author execution exists. Add a target listener that queues another microtask, then explain the order without assuming a paint or a universal task-source FIFO.",
    challenge: {
      kind: "explanation",
      prompt:
        "Does a microtask queued inside a synchronous dispatch interrupt its still-running caller?",
      solution:
        "No. The outer author execution is still active. The queued microtask waits for an eligible checkpoint after that synchronous execution yields.",
      explanation:
        "A callback returning is not enough by itself if an enclosing JavaScript execution context remains. The host's cleanup and checkpoint algorithms determine eligibility; arbitrary nested function returns do not automatically drain a queue.",
    },
    quiz: {
      question:
        "A function calls target.click(), then logs returned. Its listeners queue microtasks. Which log comes first?",
      choices: [
        "returned, before those queued microtasks",
        "Every listener microtask, before returned",
        "A guaranteed browser paint",
      ],
      answer: 0,
      explanation:
        "The programmatic dispatch is nested in the active function. Listener callbacks complete synchronously and their microtasks wait until the surrounding author execution permits a checkpoint.",
    },
    sources: [
      {
        title: "WHATWG HTML · Clean up after running script",
        url: "https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-script",
      },
      {
        title: "WHATWG DOM · Dispatching events",
        url: "https://dom.spec.whatwg.org/#concept-event-dispatch",
      },
    ],
  }),
];
