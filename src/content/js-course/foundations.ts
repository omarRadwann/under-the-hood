import { js } from "./helpers";
export const foundations = [
  js({
    slug: "language-and-hosts",
    title: "Your first program: language, engine & host",
    level: "Foundations",
    description:
      "Start with expressions and statements, then separate ECMAScript from the environment executing it.",
    prerequisites: [],
    mental:
      "JavaScript is a language with specified evaluation rules. An engine implements those rules; a host supplies facilities such as a document, files, timers, or networking. Understanding this split explains why the same function can work in a worker but fail when it tries to access document.",
    steps: [
      {
        title: "Read one evaluation at a time",
        body: "An expression produces a value; a statement controls execution or declares something. A script is source text evaluated under a parsing and execution context. Syntax errors can prevent evaluation before any log runs, whereas a runtime exception can happen after earlier side effects. Build a habit of predicting values and order before running code.",
      },
      {
        title: "Name the environment",
        body: "console and setTimeout are host facilities, not ECMAScript language keywords. The DOM belongs to browser window environments; workers have different globals, and Node adds its own APIs. globalThis names the current global object across environments, but its available properties and authority still differ.",
      },
      {
        title: "Understand source goals and strictness",
        body: "Classic scripts and modules have different top-level scope and loading rules. Modules are strict automatically; a strict directive applies only in a valid directive position. Accidental globals and a standalone function's this behave differently in sloppy versus strict code. This playground deliberately compiles module-like, strict source inside an async worker entry.",
      },
      {
        title: "Do not let punctuation become folklore",
        body: "Automatic semicolon insertion follows grammar rules, not a rule that every newline ends a statement. A line break after return changes its meaning; a following parenthesis or bracket can continue the previous expression. Use a formatter and explicit statement boundaries. Comments, Unicode identifiers, literals, reserved words, and lexical grammar are parsing concerns rather than runtime scheduling.",
      },
    ],
    code: `const price = 20;\nconst quantity = 3;\nconst total = price * quantity;\nconsole.log('total:', total);\nconsole.log('host console:', typeof console);\nconsole.log('DOM available:', typeof document);\n// This worker has a console, but no document.`,
    output: "total: 60\nhost console: object\nDOM available: undefined",
    pitfalls: [
      "Expecting browser DOM globals in Node or a worker.",
      "Reading a runtime exception as if no earlier line executed.",
      "Assuming a newline always separates statements.",
    ],
    practice:
      "Run the example, change an expression, and introduce a syntax error. Compare which logs exist. Then explain where Promise, console, fetch, and document come from, and which are available in your actual host.",
    challenge: {
      prompt: "What does this function return, and why?",
      solution: `function answer() {\n  return\n  { value: 42 };\n}\nconsole.log(answer()); // undefined`,
      explanation:
        "The restricted production after return makes the line break significant. The object is not the returned expression. Formatting the intended return on the same line or using parentheses fixes the program.",
    },
    quiz: {
      question:
        "Which facility belongs to the browser host rather than the ECMAScript language itself?",
      choices: ["document", "The addition operator", "Lexical bindings"],
      answer: 0,
      explanation:
        "The browser supplies the document API. JavaScript's language semantics do not require a DOM.",
    },
    sources: [
      {
        title: "MDN · JavaScript language overview",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Language_overview",
      },
      {
        title: "MDN · Lexical grammar",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar",
      },
    ],
  }),
  js({
    slug: "bindings-and-assignment",
    title: "Bindings, assignment & mutation",
    level: "Foundations",
    description:
      "Learn what let, const, and var actually bind, and distinguish changing a value from changing an object.",
    prerequisites: ["language-and-hosts"],
    mental:
      "A binding associates a name with a value. Reassignment changes that association; mutation changes an object reachable through a value. const restricts reassignment of the binding, while object immutability is a separate contract.",
    steps: [
      {
        title: "Declare an owner and a lifetime",
        body: "let and const are lexical declarations with block scope. var is function-scoped or has classic-script global behavior and permits redeclaration in situations where lexical declarations do not. Prefer a narrow scope and a clear initialization point. A name can exist in a scope before its binding is initialized; that distinction is the temporal dead zone.",
      },
      {
        title: "Copy a value deliberately",
        body: "Assigning one object-valued variable to another copies the value identifying the object, not the object's contents. Both can observe the same mutation. Passing a value into a function works the same way: reassigning the parameter does not reassign the caller's binding. Primitive values do not expose mutable object storage.",
      },
      {
        title: "Treat shadowing as a separate binding",
        body: "A nested lexical declaration can have the same spelling while referring to another binding. Closures resolve names through their defining lexical environment rather than the most recent caller. Name resolution and object-property lookup are different operations; an object property called count is not itself a lexical count binding.",
      },
      {
        title: "Keep assignment expressions readable",
        body: "Assignment is an expression and can return the assigned value, which makes accidental assignment inside a condition especially misleading. Compound assignment reads and writes a target, and prefix/postfix increments return different values. Destructuring assignments have their own evaluation rules; do not infer them from visual similarity to an object literal.",
      },
    ],
    code: `const original = { count: 1 };\nconst alias = original;\nalias.count += 1;\nconsole.log(original.count); // 2\nlet replacement = original;\nreplacement = { count: 99 };\nconsole.log(original.count, replacement.count);\n// const original prevents reassignment, not this object's mutation.`,
    pitfalls: [
      "Describing const objects as deeply immutable.",
      "Saying objects are passed by reference without explaining parameter reassignment.",
      "Shadowing a binding and expecting a closure to read the caller's local variable.",
    ],
    practice:
      "Write three functions: one mutates an object, one reassigns a parameter, and one returns a new object. Predict each caller-visible effect and prove which identities remain equal.",
    challenge: {
      prompt: "Does assigning a new object to a parameter replace the caller's object?",
      solution: `function replace(value) { value = { n: 2 }; }\nconst value = { n: 1 };\nreplace(value);\nconsole.log(value.n); // 1`,
      explanation:
        "The parameter is another binding containing the passed value. Its reassignment changes that local binding, not the caller's binding.",
    },
    quiz: {
      question: "What does const prevent?",
      choices: [
        "Reassigning that binding",
        "Every mutation of reachable objects",
        "All side effects in a function",
      ],
      answer: 0,
      explanation: "Binding reassignment and the mutability of an object are separate concerns.",
    },
    sources: [
      {
        title: "MDN · Grammar and types",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types",
      },
    ],
  }),
  js({
    slug: "primitives-and-typeof",
    title: "The value system: primitives, objects & typeof",
    level: "Foundations",
    description:
      "Identify all primitive domains, callable objects, absent values, NaN, and typeof's historical edge cases.",
    prerequisites: ["bindings-and-assignment"],
    mental:
      "Values have runtime types; variable names do not acquire fixed JavaScript types merely from their first assignment. TypeScript can add static constraints, but those annotations do not change the underlying JavaScript value domains.",
    steps: [
      {
        title: "Inventory the primitive domains",
        body: "The primitive types are undefined, null, boolean, number, bigint, string, and symbol. Objects form another domain; arrays and functions are objects with additional behavior. A wrapper object such as new Boolean(false) is an object and therefore truthy, even though its wrapped primitive is false.",
      },
      {
        title: "Use typeof with its limits",
        body: "typeof is useful for primitive categories and callability checks, but typeof null is object for historical reasons and arrays also report object. typeof an unresolvable name can return undefined; referencing a lexical binding in its temporal dead zone still throws. Array.isArray is a better array check than guessing from typeof.",
      },
      {
        title: "Represent absence intentionally",
        body: "undefined commonly represents an absent property or missing argument; null can be an explicit domain marker. Neither automatically means the same business state as an empty string, zero, or an empty array. Model missing, loading, denied, and empty results explicitly rather than collapsing all falsy values.",
      },
      {
        title: "Distinguish numeric anomalies from types",
        body: "NaN is a Number value, not a separate type. Infinity and signed zero also belong to Number. Number.isNaN avoids the coercion performed by the older global isNaN helper. Runtime type validation at external boundaries needs structural and domain checks beyond typeof, including ranges and required fields.",
      },
    ],
    code: `const values = [undefined, null, false, 0, 1n, 'text', Symbol('id'), {}, []];\nconsole.log(values.map(value => typeof value));\nconsole.log(typeof NaN, Number.isNaN(NaN));\nconsole.log(Array.isArray([]), typeof (() => 1));\nconsole.log(Boolean(new Boolean(false))); // true: an object`,
    pitfalls: [
      "Using typeof null to classify ordinary objects safely.",
      "Using if (!value) when zero or an empty string is valid.",
      "Confusing a TypeScript type assertion with runtime validation.",
    ],
    practice:
      "Define a parser for a count value that rejects missing values, numeric strings, NaN, Infinity, fractions, and negative numbers while accepting zero. Explain every check separately.",
    challenge: {
      prompt: "Predict the difference between these two NaN checks.",
      solution: `console.log(isNaN('not a number')); // true\nconsole.log(Number.isNaN('not a number')); // false`,
      explanation:
        "The global helper first coerces its argument to Number. Number.isNaN asks whether the existing value is the Number NaN, so it does not classify an arbitrary string as NaN.",
    },
    quiz: {
      question: "Which value is truthy?",
      choices: ["new Boolean(false)", "0", "undefined"],
      answer: 0,
      explanation:
        "Every ordinary object is truthy; wrapping a false primitive does not make the wrapper falsy.",
    },
    sources: [
      {
        title: "MDN · Data structures and types",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures",
      },
    ],
  }),
  js({
    slug: "operators-and-precedence",
    title: "Operators, precedence & short-circuit evaluation",
    level: "Foundations",
    description:
      "Predict operand evaluation, logical return values, optional chaining, numeric coercion, and update expressions.",
    prerequisites: ["primitives-and-typeof"],
    mental:
      "Operators specify both a result and an evaluation protocol. Precedence groups expressions, associativity resolves certain equal-precedence combinations, and short-circuiting decides whether some operands are evaluated at all.",
    steps: [
      {
        title: "Separate grouping from operand effects",
        body: "Multiplication groups more tightly than addition, but precedence is not a general license to reorder side effects. Parenthesize expressions where the grouping matters to a reader. Exponentiation, unary operators, conditional expressions, assignments, and the comma operator have rules that are easier to verify than to guess.",
      },
      {
        title: "Read logical operators as value selectors",
        body: "Logical AND and OR return an operand value, not necessarily a boolean. OR falls back for every falsy value; nullish coalescing falls back only for null or undefined. Mixing nullish coalescing directly with AND/OR requires explicit grouping. Logical assignment also avoids evaluating or writing when its short-circuit condition does not require it.",
      },
      {
        title: "Follow the optional chain boundary",
        body: "Optional chaining skips a continuous chain when its relevant base is nullish. Grouping can end that chain, and optional method calls still require a present target to be callable. It does not swallow arbitrary exceptions thrown by a getter or function, and it is not a replacement for validating a domain object.",
      },
      {
        title: "Know which domain an operator requests",
        body: "Addition can concatenate after primitive conversion, while many other arithmetic operators request numeric operands. Number bitwise operations use 32-bit integer conversions; BigInt has separate arithmetic constraints and no unsigned right shift. Prefix and postfix updates return different values even when both mutate the same binding.",
      },
    ],
    code: `let calls = 0;\nconst fallback = () => { calls++; return 10; };\nconsole.log(0 || fallback());\nconsole.log(0 ?? fallback());\nconst user = null;\nconsole.log(user?.profile?.name);\nlet n = 1;\nconsole.log(n++, ++n, calls);`,
    output: "10\n0\nundefined\n1 3 1",
    pitfalls: [
      "Using OR defaults where zero is valid.",
      "Assuming optional chaining catches exceptions from called code.",
      "Using bitwise truncation on identifiers larger than 32 bits.",
    ],
    practice:
      "Write a decision table for values null, undefined, zero, false, empty string, and NaN through OR and nullish defaults. Add side effects to the fallback and count exactly when it runs.",
    challenge: {
      prompt: "Why does the grouped expression still throw?",
      solution: `const value = null;\nconsole.log(value?.a.b); // undefined\n// console.log((value?.a).b); // TypeError`,
      explanation:
        "The first expression is one optional chain. Parentheses finish that chain, leaving an ordinary property access on undefined in the second expression.",
    },
    quiz: {
      question: "Which values trigger the right operand of ?? ?",
      choices: ["Only null and undefined", "Every falsy value", "Only zero"],
      answer: 0,
      explanation:
        "Nullish coalescing preserves valid falsy values such as zero, false, and the empty string.",
    },
    sources: [
      {
        title: "MDN · Expressions and operators",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators",
      },
    ],
  }),
  js({
    slug: "control-flow-and-loops",
    title: "Control flow, iteration & completion",
    level: "Foundations",
    description:
      "Use branches, loops, labels, and early exits while preserving the intended state invariant.",
    prerequisites: ["operators-and-precedence"],
    mental:
      "Control flow determines which evaluations occur and how they finish. Normal completion, return, throw, break, and continue are different outcomes that enclosing constructs handle differently.",
    steps: [
      {
        title: "Make branches explicit",
        body: "if applies truthiness; switch selects cases using strict comparison semantics and can fall through without an explicit exit. A default branch need not be last syntactically. Guard clauses can reduce nesting, but they must not skip required cleanup or violate hook-order requirements in a React component.",
      },
      {
        title: "Choose the iteration contract",
        body: "A counted for loop controls an index; for-of consumes iterable values; for-in enumerates enumerable string-keyed properties including inherited ones. These are not interchangeable. A plain object is not automatically iterable, and an array's properties are not the same thing as its sequence of values.",
      },
      {
        title: "State the invariant at each boundary",
        body: "For a search loop, identify the range already inspected and what remains. For mutation during iteration, check the particular method's rules about captured length, deleted entries, and newly appended items. break and continue target their appropriate enclosing construct; labels can support explicit exits but often signal a useful function boundary.",
      },
      {
        title: "Bound work and handle asynchronous iteration separately",
        body: "A loop's syntax does not make expensive work non-blocking. An infinite or enormous synchronous loop prevents its agent from doing other work. forEach does not await asynchronous callbacks. Use a deliberate sequential async loop or a bounded concurrency policy depending on dependencies and resource limits.",
      },
    ],
    code: `const scores = [4, 8, 12];\nlet total = 0;\nfor (const score of scores) {\n  if (score < 8) continue;\n  total += score;\n}\nconsole.log(total); // 20\nconst object = Object.create({ inherited: true });\nobject.own = true;\nconsole.log(Object.keys(object)); // own enumerable keys only`,
    pitfalls: [
      "Using for-in as a universal array-values loop.",
      "An unintended switch fallthrough.",
      "Expecting forEach(async ...) to return a completion promise.",
    ],
    practice:
      "Implement a first-match search with an explicit inspected-prefix invariant. Then build a sequential async version and explain why a parallel version needs a different definition of first.",
    challenge: {
      prompt: "Which keys are included by for-in, and how does Object.keys differ?",
      solution: `const base = { inherited: 1 };\nconst value = Object.create(base);\nvalue.own = 2;\nfor (const key in value) console.log(key); // own, inherited\nconsole.log(Object.keys(value)); // ['own']`,
      explanation:
        "for-in includes enumerable inherited string properties. Object.keys returns only enumerable own string keys, with the specified own-key ordering.",
    },
    quiz: {
      question: "What does for-of consume?",
      choices: [
        "An iterable's values",
        "Every object's enumerable property names",
        "Only numeric indexes",
      ],
      answer: 0,
      explanation:
        "for-of uses the iteration protocol. Property enumeration is the separate for-in contract.",
    },
    sources: [
      {
        title: "MDN · Loops and iteration",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration",
      },
    ],
  }),
  js({
    slug: "functions-and-parameters",
    title: "Functions, parameters & returned values",
    level: "Foundations",
    description:
      "Build functions deliberately: declarations, expressions, arrows, defaults, rest parameters, recursion, and contracts.",
    prerequisites: ["control-flow-and-loops"],
    mental:
      "A function call evaluates arguments and creates parameter bindings for an execution. A function can return a value, throw, or fall through to undefined. Its shape also determines whether it has an ordinary this, arguments, or constructor capability.",
    steps: [
      {
        title: "Choose a function form",
        body: "Declarations, expressions, arrow functions, and methods share callable behavior but differ in binding initialization, this, arguments, constructibility, and naming. An arrow captures lexical this and has no own arguments object. Not every callable can be used with new; methods and arrows are important counterexamples.",
      },
      {
        title: "Read argument evaluation before body execution",
        body: "Arguments are evaluated before the ordinary call proceeds, from left to right. Missing arguments normally produce undefined parameter values, and extra arguments are allowed. Rest parameters collect trailing arguments into a real array. Defaults apply to undefined, not null, and can run code with observable effects at call time.",
      },
      {
        title: "Make the returned contract visible",
        body: "A normal function without a returned expression produces undefined. A throw is a different completion, not a magic error-valued return. Return the recursive or nested operation when the caller must observe its result. Separate calculation from side effects so callers know whether repeat invocation is safe.",
      },
      {
        title: "Understand parameter environments",
        body: "Default-parameter initializers can refer to earlier parameters but not freely to later uninitialized ones or function-body declarations. Non-simple parameter lists have additional arguments and scope rules. Prefer explicit parameter objects when a long positional signature becomes hard to use, and validate external inputs at the boundary rather than relying on parameter names.",
      },
    ],
    code: `let defaults = 0;\nfunction sum(first = (++defaults, 10), ...rest) {\n  return rest.reduce((total, value) => total + value, first);\n}\nconsole.log(sum(undefined, 2, 3)); // 15\nconsole.log(sum(0, 2), defaults); // 2, 1\nconst makeLabel = prefix => value => prefix + value;\nconsole.log(makeLabel('item: ')(7));`,
    pitfalls: [
      "Using null and expecting a default parameter to run.",
      "An arrow relying on its own arguments or dynamic this.",
      "Forgetting to return the nested computation.",
    ],
    practice:
      "Write a numeric aggregation API with clear handling for missing inputs, null, empty input, and invalid values. Explain how its rest parameter, default initializer, and return contract interact.",
    challenge: {
      prompt: "Does this default run for null?",
      solution: `function identify(value = 'default') { return value; }\nconsole.log(identify(undefined)); // default\nconsole.log(identify(null)); // null`,
      explanation:
        "A default parameter is selected when its supplied argument value is undefined. Null is an explicit supplied value and is preserved.",
    },
    quiz: {
      question: "What is a rest parameter?",
      choices: [
        "An array of remaining arguments",
        "The function's lexical scope",
        "A reference to the caller's variables",
      ],
      answer: 0,
      explanation:
        "Rest gathers the remaining arguments into an array; it is distinct from the array-like arguments object.",
    },
    sources: [
      {
        title: "MDN · Functions",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
      },
    ],
  }),
  js({
    slug: "arrays-and-sparse-data",
    title: "Arrays, indexes, holes & length",
    level: "Foundations",
    description: "Understand array storage semantics before treating every array as a dense list.",
    prerequisites: ["functions-and-parameters"],
    mental:
      "An array is an object with special behavior for indexed properties and length. A missing indexed property, an explicit undefined value, and a removed element are observably different states.",
    steps: [
      {
        title: "Separate length from present elements",
        body: "Writing a large valid array index can increase length while leaving holes between present properties. Setting a smaller length can delete indexed properties, subject to property constraints. Negative numbers and many index-like strings are ordinary keys rather than array indexes. Do not use length as a count of present records in sparse data.",
      },
      {
        title: "Compare holes with undefined",
        body: "A hole means an indexed property is absent; undefined can be a present property's value. The in operator observes presence through the prototype chain, while Object.hasOwn checks ownership. Some methods skip absent entries, but the iterator used by for-of and spread can expose them as undefined. Method-specific contracts matter.",
      },
      {
        title: "Delete is not list removal",
        body: "delete removes a property without shifting later indexes or generally shrinking length. splice changes the sequence by removing or inserting elements; toSpliced creates a new result. Mutating indexed storage while another owner is iterating can create subtle observations, even when both owners have the same array reference.",
      },
      {
        title: "Use dense collections intentionally",
        body: "Array.from({ length: n }, mapper) constructs deliberate entries rather than holes. fill with the same object aliases that object in every slot; a per-element mapper can create independent objects. Validate remote arrays when missing positions or incorrect element types would violate an application invariant.",
      },
    ],
    code: `const sparse = new Array(3);\nsparse[1] = undefined;\nconsole.log(sparse.length, Object.keys(sparse));\nconsole.log(0 in sparse, 1 in sparse);\nconsole.log([...sparse]);\nconsole.log(sparse.map(() => 'present').join('|'));\nconst rows = Array.from({ length: 3 }, (_, id) => ({ id }));\nconsole.log(rows.map(row => row.id));`,
    pitfalls: [
      "Using delete as if it shifts later elements.",
      "Expecting map to populate the holes in new Array(n).",
      "Using fill({}) and assuming each element owns a separate object.",
    ],
    practice:
      "Compare a three-slot sparse array with an array containing three explicit undefined values across keys, map, for-of, JSON serialization, and a property-presence test.",
    challenge: {
      prompt: "How many independent objects are created by fill?",
      solution: `const rows = Array(3).fill({ n: 0 });\nrows[0].n = 7;\nconsole.log(rows.map(row => row.n)); // 7, 7, 7`,
      explanation:
        "fill writes the same object-valued reference to each position. A mapper that constructs an object for each position is needed for independent state.",
    },
    quiz: {
      question: "Does deleting index 1 automatically reduce array length?",
      choices: ["No", "Yes", "Only in strict mode"],
      answer: 0,
      explanation:
        "Deleting an indexed property creates an absence; it is not the sequence-editing behavior of splice.",
    },
    sources: [
      {
        title: "MDN · Indexed collections",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Indexed_collections",
      },
    ],
  }),
  js({
    slug: "objects-and-enumeration",
    title: "Objects, keys, ownership & enumeration",
    level: "Foundations",
    description: "Distinguish own/inherited keys, symbols, enumerability, accessors, and ordering.",
    prerequisites: ["arrays-and-sparse-data"],
    mental:
      "An object's visible fields depend on which operation you perform. Ownness, key type, enumerability, accessor behavior, and prototype lookup are independent dimensions; there is no single universal all-properties loop.",
    steps: [
      {
        title: "Build a property deliberately",
        body: "Object literals support shorthand fields, methods, computed keys, and spread. Ordinary property keys are strings or symbols, so most non-symbol keys are converted rather than retained as arbitrary object identities. Computed property expressions execute during construction. Choose Map when the intended key domain is arbitrary values.",
      },
      {
        title: "Choose the correct key view",
        body: "Object.keys exposes enumerable own string keys; getOwnPropertyNames also includes non-enumerable own strings; getOwnPropertySymbols returns own symbols; Reflect.ownKeys combines own key types. for-in additionally traverses enumerable inherited string properties. Object.hasOwn avoids relying on an object's possibly shadowed hasOwnProperty method.",
      },
      {
        title: "Respect ordering without using it as schema",
        body: "For ordinary own-key enumeration, array-index string keys come before other strings, followed by symbols in their relevant insertion order. JSON and different enumeration APIs filter these keys differently. Proxies and exotic objects add constraints, so an observed order is not a substitute for an explicit ordered data structure.",
      },
      {
        title: "Treat reads and copies as possible execution",
        body: "A getter or proxy can run code during a property read. Spread copies enumerable own values and does not preserve accessor descriptors or deep structure. Assigning to another object can encounter setters. Validate untrusted key spaces and avoid prototype-sensitive recursive merging when an explicit DTO or Map expresses the contract more safely.",
      },
    ],
    code: `const symbol = Symbol('private label');\nconst base = { inherited: true };\nconst value = Object.assign(Object.create(base), { '10': 'ten', '2': 'two', name: 'Ada' });\nvalue[symbol] = 7;\nObject.defineProperty(value, 'hidden', { value: 9 });\nconsole.log(Object.keys(value));\nconsole.log(Reflect.ownKeys(value).map(String));\nconsole.log(Object.hasOwn(value, 'inherited'));`,
    pitfalls: [
      "Assuming Object.keys includes symbols or inherited properties.",
      "Using arbitrary object keys in a plain dictionary and expecting identity-based lookup.",
      "Calling object.hasOwnProperty on untrusted objects.",
    ],
    practice:
      "Build a property matrix containing an own enumerable string, a hidden string, a symbol, and an inherited string. Predict each enumeration API's result before executing it.",
    challenge: {
      prompt: "Does copying an accessor preserve it as an accessor?",
      solution: `let reads = 0;\nconst source = { get value() { return ++reads; } };\nconst copy = { ...source };\nconsole.log(copy.value, copy.value, reads); // 1 1 1`,
      explanation:
        "Spread reads the getter's value and creates a data property in the copy. Reading that copied property does not invoke the original getter again.",
    },
    quiz: {
      question: "Which API includes all own string and symbol keys?",
      choices: ["Reflect.ownKeys", "Object.keys", "for-in"],
      answer: 0,
      explanation:
        "Reflect.ownKeys includes own keys independent of enumerability and includes both key types.",
    },
    sources: [
      {
        title: "MDN · Working with objects",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects",
      },
    ],
  }),
  js({
    slug: "errors-and-completion",
    title: "Errors, exceptions & finally semantics",
    level: "Foundations",
    description:
      "Follow abrupt completion, preserve diagnostic causes, and avoid finally blocks that overwrite outcomes.",
    prerequisites: ["functions-and-parameters"],
    mental:
      "An exception changes how evaluation completes and transfers control to a matching handler. Error objects carry diagnostics, but JavaScript can throw other values. finally runs as control leaves its associated region and can itself replace the original outcome.",
    steps: [
      {
        title: "Separate expected results from defects",
        body: "A missing optional record, a validation failure, and an invariant violation have different meanings. Use an explicit application result contract for expected outcomes where appropriate. Throwing enables stack unwinding, but blindly catching everything and returning an empty value can disguise a broken dependency as successful empty data.",
      },
      {
        title: "Preserve the causal chain",
        body: "Catch bindings can hold any thrown value, not necessarily an Error. Narrow them before accessing fields. When translating errors across a boundary, retain a useful cause and operation context while omitting secrets. Error subclasses and instanceof checks need care across realms or duplicated package versions.",
      },
      {
        title: "Follow finally precisely",
        body: "finally runs for normal completion and abrupt exits such as throw or return. A return or throw inside finally overrides an earlier outcome. Cleanup must therefore avoid accidentally hiding the original failure; if cleanup itself fails, define which error the caller receives and retain enough evidence to diagnose both.",
      },
      {
        title: "Do not extend synchronous catch beyond its lifetime",
        body: "try/catch around a timer registration does not catch a later callback's throw. Promise rejection and awaited failures have their own observation path. Handle a callback's failure in the callback's owner, and await or return asynchronous work when its completion must participate in the surrounding error boundary.",
      },
    ],
    code: `function calculate() {\n  try { return 7; }\n  finally { console.log('cleanup runs before the return completes'); }\n}\nconsole.log(calculate());\ntry {\n  throw new Error('read failed', { cause: new Error('connection closed') });\n} catch (error) {\n  console.log(error.message, error.cause.message);\n}`,
    pitfalls: [
      "Returning from finally and hiding the original failure.",
      "Assuming every caught value has a message field.",
      "Expecting a surrounding synchronous catch to handle a future timer callback.",
    ],
    practice:
      "Write an operation where the primary work and cleanup can fail independently. Define an error contract that preserves causality, and test all four success/failure combinations.",
    challenge: {
      prompt: "Which value wins when finally returns?",
      solution: `function result() {\n  try { throw new Error('original'); }\n  finally { return 'overridden'; }\n}\nconsole.log(result()); // overridden`,
      explanation:
        "The abrupt return from finally replaces the pending throw. Avoid this pattern unless replacing the original outcome is explicitly intended.",
    },
    quiz: {
      question: "Can a return in finally override an earlier throw?",
      choices: ["Yes", "No", "Only for TypeError"],
      answer: 0,
      explanation:
        "The completion produced by finally can replace the completion that was already propagating.",
    },
    sources: [
      {
        title: "MDN · Control flow and error handling",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling",
      },
    ],
  }),
];
