import type { Lesson, Step } from "@/lib/types";
const notes: Record<string, Step[]> = {
  "hoisting-and-tdz": [
    {
      title: "Function-body instantiation differs from block declarations",
      body: "In a strict function body, a function declaration creates a var-scoped binding initialized before the body runs. A var declaration of that same name is permitted; an initializer can later replace the function value. Strict block-level function declarations are lexical bindings with a different scope and conflict rules. Moving a declaration into a try block can therefore change a program. Default parameter initializers can introduce a separate environment, so a closure created there does not automatically see later body declarations.",
    },
  ],
  "async-iteration-and-cancellation": [
    {
      title: "Locate failure and use the current closing contract",
      body: "When for-await adapts a synchronous iterator, it awaits yielded values through the async-from-sync adapter. Under the current specification, rejection while unwrapping a value from a not-done next result closes the synchronous iterator before propagating the failure; the generator's finally can run before the consumer's catch. Historical implementations differed, so validate the deployment runtime rather than memorizing older examples. This rule is not a blanket guarantee for every next, done, or value getter failure. A true async iterator's result value is not automatically unwrapped in the same way; async generators perform their own yield awaiting.",
    },
  ],
  "primitives-and-typeof": [
    {
      title: "Separate a type tag from a successful invocation",
      body: "typeof a class constructor is function, but calling it without new throws. A revoked callable proxy can also keep that type tag while operations fail. In browser legacy compatibility, document.all has exceptional typeof, truthiness, and loose-null-comparison behavior; it is not a normal falsy object you can reproduce with a plain object or Proxy. These exceptions are host/context rules, not reasons to replace explicit domain validation with a type tag.",
    },
  ],
  "operators-and-precedence": [
    {
      title: "Observe reference evaluation and short-circuit writes",
      body: "Grouping determines which operations combine results; it does not reorder ordinary operand evaluations. In a() + b() * c(), calls are evaluated a, b, c before multiplication supplies its result to addition. Compound/logical assignment retains its left-hand reference rather than naively reevaluating the whole expression. const x = 1; x ||= 2 performs no write and does not throw, while an assignment actually required by its condition would violate the const binding.",
    },
  ],
  "arrays-and-sparse-data": [
    {
      title: "Presence includes the prototype contract",
      body: "Methods such as map use a property-presence check that can observe an inherited numeric property; a missing own slot is not proof that no callback will run. The array iterator reads successive indexes, and find/findIndex visit absent indexes as undefined when no inherited value supplies them. Copying methods have their own presence and allocation rules. Test an array with a custom prototype instead of assuming every method skips every hole.",
    },
  ],
  "coercion-algorithms": [
    {
      title: "The conversion hint is part of the protocol",
      body: "Ordinary conversion commonly tries valueOf first for a number-like hint and toString first for a string hint. Date has a special default-hint preference for string-like conversion. String(symbol) has an explicit primitive-Symbol case, whereas implicit string conversion such as template interpolation of that symbol throws. BigInt/Number loose comparison has rules that differ from mixed arithmetic; no one universal coerce-both-to-Number rule describes every operator.",
    },
  ],
  "json-and-serialization": [
    {
      title: "Structured cloning is not passive reflection either",
      body: "Cloning ordinary enumerable data can read getters; it does not preserve their accessor descriptors, custom prototype chain, or class private brands. A frozen input does not generally produce a frozen clone. RegExp lastIndex is not preserved, and unsupported values such as functions or proxies can cause DataCloneError. A transfer describes ownership/detachment semantics and permits implementation optimizations; a measurement is needed before claiming physical zero-copy across every host or process.",
    },
  ],
  "weak-references": [
    {
      title: "Weak eligibility and independent strong ownership",
      body: "Modern weak-key contracts permit objects and non-registered symbols; Symbol.for registry keys are not eligible. Check support on the target runtime. A WeakMap value pointing back to its key is handled through the weak association's reachability semantics, but an independently retained value can still retain that key strongly. WeakRef keeps a successfully observed target available for the relevant current job; it does not promise availability across arbitrary future asynchronous work.",
    },
  ],
  "iterators-and-generators": [
    {
      title: "Closing is a consumer protocol, not every exception",
      body: "for-of normally closes on a break or an abrupt loop-body completion. If advancing next itself throws, do not assume the consumer will call return. When a loop-body throw and closing both throw, IteratorClose preserves the original throw under that protocol. Calling return on a generator that has never started does not execute a finally inside its unentered body. Acquire resources at a boundary whose owner can actually guarantee release.",
    },
  ],
  "promise-construction-and-rejections": [
    {
      title: "Locking resolution is earlier than settlement",
      body: "The first call to a promise's resolving functions locks that resolution attempt even if resolve adopts a still-pending promise. A later reject or executor throw cannot replace it, yet the outer promise can remain pending until the adopted outcome settles. Distinguish executor completion, an already-resolved guard, thenable adoption, and eventual fulfillment/rejection when explaining why a later error is ignored.",
    },
  ],
  "module-linking-and-cycles": [
    {
      title: "Default export expressions and thenable namespaces",
      body: "export default count exports the value evaluated by that expression; export { count as default } exposes the binding. Named default function/class declarations have their own declaration rules, so do not call all default exports snapshots. A callable export named then can make a dynamically imported namespace participate in promise assimilation. The example's then-export module demonstrates that hazard with real ESM rather than pretending imports are property copies.",
    },
  ],
  "cancellation-and-races": [
    {
      title: "Do not insert a continuation after the ownership check",
      body: "Returning an already-checked value from an async function does not make a later caller commit atomic with that check. Another operation can begin before the caller's continuation runs. Perform a synchronous commit immediately after validation, or carry an operation ticket and revalidate at the later state write. If a commit callback itself awaits or schedules a write, that later boundary needs its own ownership check.",
    },
  ],
  "memory-and-garbage-collection": [
    {
      title: "Cleanup closures can themselves retain ownership",
      body: "Removing a listener breaks that registration path, but a retained disposer can still close over the element, listener, and payload. Drop obsolete cleanup callbacks from owner registries and clear captured references when a deliberately long-lived disposer requires it. A detached target/listener cycle without any rooted path can be collected; the mere presence of an event listener is not proof of a global GC root.",
    },
  ],
  "event-loop": [
    {
      title: "A task boundary is not the only checkpoint rule",
      body: "The fixed lab follows one classic-script task. HTML also defines cleanup after script/callback execution, which can expose a checkpoint when no author execution context remains. A real user event and a synchronous dispatch nested inside another handler can therefore have different listener/microtask ordering. Use the callback-checkpoints lesson's real browser lab to inspect that distinction rather than stretching this fixed trace into a universal event dispatcher.",
    },
  ],
};
const references: Record<string, string> = {
  "hoisting-and-tdz":
    "https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-functiondeclarationinstantiation",
  "async-iteration-and-cancellation":
    "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-asyncfromsynciteratorcontinuation",
  "primitives-and-typeof":
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof",
  "operators-and-precedence":
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment",
  "arrays-and-sparse-data":
    "https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map",
  "coercion-algorithms":
    "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toprimitive",
  "json-and-serialization":
    "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm",
  "weak-references":
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap",
  "iterators-and-generators":
    "https://tc39.es/ecma262/multipage/abstract-operations.html#sec-iteratorclose",
  "promise-construction-and-rejections":
    "https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-resolve-functions",
  "module-linking-and-cycles":
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import",
  "event-loop":
    "https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-script",
};
export function refineSemantics(lesson: Lesson): Lesson {
  const additions = notes[lesson.slug];
  if (!additions) return lesson;
  return {
    ...lesson,
    ...(lesson.slug === "hoisting-and-tdz"
      ? {
          challenge: {
            prompt: "Can a function-body declaration share its name with var?",
            solution:
              "function inspect() {\n  console.log(read()); // callable before its declaration\n  var read; // redeclaration does not reset its value\n  function read() { return 'ready'; }\n  read = 3;\n  console.log(read);\n}\ninspect();",
            explanation:
              "Function-body instantiation initializes read to a function before evaluation starts. A var declaration with no initializer does not overwrite it. The later assignment replaces that mutable binding with 3. A strict block-scoped function declaration has different redeclaration rules.",
          },
        }
      : {}),
    steps: [...lesson.steps, ...additions],
    sources: [
      ...lesson.sources,
      ...(references[lesson.slug]
        ? [
            {
              title: "Primary reference · reviewed semantic boundary",
              url: references[lesson.slug],
            },
          ]
        : []),
    ],
  };
}
