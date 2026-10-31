import { js } from "./helpers";
export const dataLanguage = [
  js({
    slug: "coercion-algorithms",
    title: "Coercion: ToPrimitive, truthiness & equality",
    description:
      "Explain conversions as ordered algorithms rather than memorized surprising expressions.",
    level: "Deep dive",
    prerequisites: ["primitives-and-typeof", "operators-and-precedence", "objects-and-enumeration"],
    mental:
      "Coercion is an operation-specific protocol. Converting an object to a primitive, selecting a numeric domain, interpreting truthiness, and comparing equality invoke different rules. Explicit constructors can also differ from an operator's implicit conversion.",
    steps: [
      {
        title: "Start with the requested primitive",
        body: "Object conversion can consult Symbol.toPrimitive with a hint, then appropriate ordinary methods such as valueOf and toString. The hook must return a primitive. Addition requests primitive operands before choosing concatenation or numeric addition, while other operations can request a numeric or string conversion directly. These hooks can run arbitrary code and throw.",
      },
      {
        title: "Do not confuse truthiness with equality",
        body: "Boolean conversion does not ask an ordinary object's valueOf to decide truthiness. Empty arrays and boxed false values are truthy. Loose equality can convert operands through rules that differ from Boolean conversion, which is why an object can be truthy yet loosely compare equal to false. Write the conversion steps instead of inventing a general empty-object rule.",
      },
      {
        title: "Choose a sameness relation",
        body: "Strict equality, Object.is, and SameValueZero differ at important Number edges. Strict equality treats NaN as unequal to itself and signed zeros as equal. Object.is distinguishes signed zeros and recognizes NaN. Map and Set use SameValueZero, combining equal signed zeros with recognizable NaN keys.",
      },
      {
        title: "Make boundaries explicit",
        body: "Number('') becomes zero, parseInt can accept only a prefix, and mixed BigInt/Number arithmetic is generally rejected rather than silently unified. Explicit Number(bigint) conversion can lose precision even though arithmetic mixing throws. Parsing a business value therefore needs a domain policy, not just whichever built-in conversion happens to accept it.",
      },
    ],
    code: `const value = {\n  [Symbol.toPrimitive](hint) {\n    console.log('hint:', hint);\n    return hint === 'string' ? 'label' : 7;\n  }\n};\nconsole.log(value + 1);\nconsole.log(String(value));\nconsole.log(Boolean([]), [] == false);\nconsole.log(Object.is(NaN, NaN), new Set([NaN, NaN]).size);`,
    pitfalls: [
      "Equating truthiness with loose comparison to true.",
      "Assuming object-to-primitive conversion is passive.",
      "Replacing validation with Number(input).",
    ],
    practice:
      "For addition, template interpolation, a boolean condition, and loose equality, list which conversion protocol runs. Instrument Symbol.toPrimitive and prove which hooks execute and in what order.",
    challenge: {
      prompt: "Why can both expressions be true?",
      solution: `console.log(Boolean([])); // true\nconsole.log([] == false); // true`,
      explanation:
        "The condition-like conversion treats the array object as truthy. Loose equality follows another conversion path: false becomes 0, the array converts through a primitive empty string, and that string becomes 0. These are different algorithms, not inconsistent truthiness.",
    },
    quiz: {
      question: "Which equality relation do ordinary Map keys use?",
      choices: ["SameValueZero", "Object.is in every edge case", "String conversion"],
      answer: 0,
      explanation:
        "Map recognizes repeated NaN keys and treats signed zeros as the same key, following SameValueZero.",
    },
    sources: [
      {
        title: "MDN · Type coercion",
        url: "https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion",
      },
      {
        title: "ECMAScript · Abstract operations",
        url: "https://tc39.es/ecma262/#sec-abstract-operations",
      },
    ],
  }),
  js({
    slug: "numbers-and-bigint",
    title: "Number precision, BigInt & decimal domains",
    description:
      "Keep identifiers exact, validate integers, and define rounding instead of patching floating-point symptoms.",
    level: "Advanced",
    prerequisites: ["coercion-algorithms"],
    mental:
      "Number is binary floating-point with finite precision. BigInt represents integers without that fixed precision limit. Neither representation automatically supplies the decimal rounding and business semantics required by money, measurements, identifiers, or accounting.",
    steps: [
      {
        title: "Understand the representation",
        body: "Many decimal fractions cannot be represented exactly as a binary Number. Precision changes with magnitude, so Number.EPSILON is not a universal tolerance for every scale. NaN, infinities, subnormal magnitudes, and signed zero also have specified behavior. Choose comparison tolerances from the domain and error model.",
      },
      {
        title: "Preserve integers before they are rounded",
        body: "Safe integers occupy a bounded Number range. A database ID beyond it can already be corrupted when parsed as a Number. Keep exact IDs as strings or parse an explicitly supported BigInt representation. Converting a rounded Number to BigInt afterward cannot recover discarded information.",
      },
      {
        title: "Define decimal arithmetic policy",
        body: "Integer minor units can work for money when currency scale, overflow, division, and rounding are explicit. Some domains need decimal arithmetic libraries and a specified rounding mode. Multiplying by 100 and applying Math.round to an arbitrary floating-point input is not a complete financial parsing or accounting design.",
      },
      {
        title: "Make conversion and transport deliberate",
        body: "BigInt arithmetic does not freely mix with Number, division truncates toward zero, and default JSON.stringify rejects BigInt. Negative remainder is not automatically a positive modulo operation. Check numeric-string grammar and range instead of accepting prefixes, whitespace, or coercible objects accidentally.",
      },
    ],
    code: `console.log(0.1 + 0.2 === 0.3); // false\nconsole.log(Number.isSafeInteger(9007199254740992));\nconst id = BigInt('9007199254740993');\nconsole.log(id + 1n);\nconsole.log(7n / 2n); // integer division\nconsole.log(JSON.stringify({ id: id.toString() }));\nconsole.log(Number(''), parseInt('12px', 10));`,
    pitfalls: [
      "Applying one epsilon to every numeric scale.",
      "Parsing a long identifier as Number before converting to BigInt.",
      "Assuming BigInt supplies decimal fractions or automatic JSON transport.",
    ],
    practice:
      "Design an amount parser accepting a declared currency scale and exact decimal grammar. Test negative zero, excessive precision, enormous amounts, exponent notation, and rounding ties; state which inputs you reject.",
    challenge: {
      prompt: "Can BigInt repair a Number that was already rounded?",
      solution: `const fromText = BigInt('9007199254740993');\nconst fromNumber = BigInt(9007199254740993);\nconsole.log(fromText === fromNumber); // false`,
      explanation:
        "The Number literal is evaluated using binary floating-point before BigInt sees it. The exact text path retains the integer that the Number path has already rounded.",
    },
    quiz: {
      question: "What does BigInt division do with a fractional part?",
      choices: ["Truncates toward zero", "Returns a decimal BigInt", "Always throws"],
      answer: 0,
      explanation:
        "BigInt is an integer arithmetic domain, so its division result remains an integer.",
    },
    sources: [
      {
        title: "MDN · Numbers and strings",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Numbers_and_strings",
      },
      {
        title: "MDN · BigInt",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt",
      },
    ],
  }),
  js({
    slug: "strings-and-unicode",
    title: "Strings, Unicode & text boundaries",
    description: "Separate code units, code points, graphemes, normalization, and byte encoding.",
    level: "Advanced",
    prerequisites: ["primitives-and-typeof", "arrays-and-sparse-data"],
    mental:
      "A JavaScript string stores a sequence of UTF-16 code units. Users see text shaped from code points and grapheme clusters; network protocols transmit encoded bytes. A character count, a byte limit, and a safe truncation boundary can therefore require different algorithms.",
    steps: [
      {
        title: "Choose the unit you are measuring",
        body: "String length and indexed access operate on UTF-16 code units. The string iterator advances by Unicode code points, but a grapheme cluster such as a combining sequence or family emoji can contain several code points. Intl.Segmenter supplies grapheme-aware segmentation for appropriate use cases; it does not turn every text-processing task into the same count.",
      },
      {
        title: "Keep normalization separate from intent",
        body: "Visually similar text can have different code-point sequences. Unicode normalization can produce a selected canonical form, but it is not universal transliteration, confusable detection, or locale-sensitive identity policy. Store original user text where appropriate and define comparison rules for the actual domain.",
      },
      {
        title: "Distinguish string operations from encoding",
        body: "slice and substring have different index handling, and neither automatically preserves grapheme boundaries. TextEncoder produces UTF-8 bytes; TextDecoder with streaming state can handle a multi-byte character split across chunks. URI encoding, JSON escaping, HTML escaping, and Unicode normalization solve different problems and cannot substitute for each other.",
      },
      {
        title: "Handle international text deliberately",
        body: "Locale-aware collation and casing can differ from code-unit sorting or ASCII transformations. Regular-expression Unicode modes change what selected syntax means, but a code-point-aware pattern still need not correspond to grapheme clusters. Test bidirectional text, combining marks, malformed sequences, and storage byte limits rather than only Latin examples.",
      },
    ],
    code: `const text = 'e\\u0301';\nconsole.log(text.length, [...text].length);\nconst segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });\nconsole.log([...segmenter.segment(text)].length);\nconsole.log(text === 'é', text.normalize('NFC') === 'é');\nconsole.log(new TextEncoder().encode('é').length);`,
    pitfalls: [
      "Using string.length as every user-visible character count.",
      "Treating normalization as protection against all identifier confusables.",
      "Decoding each network chunk independently.",
    ],
    practice:
      "Specify a display-name field with separate grapheme and storage-byte limits. Preserve full clusters on truncation, and test combined accents, emoji sequences, RTL text, and multi-byte chunk boundaries.",
    challenge: {
      prompt: "Why are these lengths different?",
      solution: `const emoji = '😀';\nconsole.log(emoji.length); // 2 UTF-16 code units\nconsole.log([...emoji].length); // 1 code point\nconsole.log(new TextEncoder().encode(emoji).length); // 4 UTF-8 bytes`,
      explanation:
        "Each operation counts a different representation unit. Selecting a unit is part of the contract, not a cosmetic implementation choice.",
    },
    quiz: {
      question: "Does string iteration always produce user-perceived characters?",
      choices: ["No; it iterates code points", "Yes", "Only if length is even"],
      answer: 0,
      explanation:
        "A grapheme can span multiple code points, so code-point iteration alone is not grapheme segmentation.",
    },
    sources: [
      {
        title: "MDN · String",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String",
      },
      { title: "Unicode · Normalization", url: "https://unicode.org/reports/tr15/" },
    ],
  }),
  js({
    slug: "array-transformations",
    title: "Array algorithms, sorting & mutation",
    description:
      "Choose transforms with explicit order, identity, missing-value, and complexity contracts.",
    level: "Advanced",
    prerequisites: ["arrays-and-sparse-data", "functions-and-parameters"],
    mental:
      "Array methods encode different traversal, allocation, mutation, and early-exit behavior. Familiar names do not make them interchangeable, and a functional-looking pipeline can still mutate shared objects or repeatedly scan an expensive dataset.",
    steps: [
      {
        title: "Pick the operation matching the result",
        body: "map transforms entries; filter selects; find stops at a matching value; some and every answer predicates; reduce accumulates under an explicit initial state. Reduce without an initial value throws on an empty array. Distinguish a missing match from a matched undefined element when the domain permits both.",
      },
      {
        title: "Specify mutation and identity",
        body: "sort, reverse, splice, and fill mutate their receiver. Copying alternatives such as toSorted, toReversed, toSpliced, and with return a new array, but referenced element objects remain shared. Referential change of the outer array does not by itself make nested updates immutable.",
      },
      {
        title: "Write a valid comparison",
        body: "Default sort compares string representations rather than applying numeric order. A comparator needs coherent sign, equality, and ordering behavior; an inconsistent or stateful comparator is not a sound ordering relation. Modern specified array sorting is stable, but stability does not repair an invalid comparator or replace a deliberate locale collation policy.",
      },
      {
        title: "Account for work and traversal rules",
        body: "A find inside a map can become quadratic; building an index can reduce repeated lookup work. Methods differ in their treatment of absent indexes and mutations during traversal. Asynchronous callbacks are another contract: map produces promises when the callback is async, and filtering with an async predicate does not await boolean results.",
      },
    ],
    code: `const numbers = [10, 2, 1];\nconsole.log([...numbers].sort()); // string ordering\nconsole.log(numbers.toSorted((a, b) => a - b));\nconsole.log(numbers); // unchanged\nconst rows = [{ id: 1, score: 2 }, { id: 2, score: 2 }];\nconsole.log(rows.toSorted((a, b) => b.score - a.score).map(row => row.id));\nconsole.log([].reduce((sum, n) => sum + n, 0));`,
    pitfalls: [
      "Default sorting expected to be numeric.",
      "An async filter predicate that returns truthy promises.",
      "Calling a shallow copying method a deep immutable update.",
    ],
    practice:
      "Implement a stable ranked list with explicit tie breaking and no mutation of the input array. Test empty input, equal ranks, missing values, and an object shared by two lists. Measure a lookup-heavy pipeline before and after indexing.",
    challenge: {
      prompt: "What does an async filter predicate select?",
      solution: `const result = [1, 2, 3].filter(async n => n > 1);\nconsole.log(result); // [1, 2, 3]`,
      explanation:
        "filter observes each returned promise as a truthy object; it does not await a boolean. Evaluate predicates asynchronously first, then apply a synchronous selection to their outcomes.",
    },
    quiz: {
      question: "Does toSorted deep-copy each element object?",
      choices: ["No", "Yes", "Only for stable sorts"],
      answer: 0,
      explanation:
        "It creates another array. Existing object-valued elements retain their identities.",
    },
    sources: [
      {
        title: "MDN · Array",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
      },
    ],
  }),
  js({
    slug: "keyed-collections",
    title: "Map, Set & collection identity",
    description:
      "Design key spaces and set operations with the right equality, ordering, and ownership rules.",
    level: "Advanced",
    prerequisites: ["objects-and-enumeration", "coercion-algorithms"],
    mental:
      "A collection is a contract about keys, membership, order, and ownership. Map retains arbitrary key identities; a plain object's property keys are strings or symbols. Set membership uses a specified equality relation, not structural equality of object contents.",
    steps: [
      {
        title: "Choose the key domain",
        body: "Map accepts object keys without stringifying them and distinguishes separately created objects. Its insertion order is observable; updating an existing key does not simply move it to the end. Check has separately from get when an explicitly stored undefined value must be distinguished from a missing entry.",
      },
      {
        title: "Understand membership semantics",
        body: "Map keys and Set values use SameValueZero. Repeated NaN values are recognized and signed zeros are treated alike; separately allocated equal-looking objects remain distinct. Set deduplication therefore does not perform deep record equality. Define a stable domain key when deduplicating entities.",
      },
      {
        title: "Use set algebra intentionally",
        body: "Modern Set APIs include composition operations such as union and intersection. Check the target runtime and polyfill policy when using newer built-ins. Intersection of entity objects still uses identity, so two API responses containing equivalent records need normalization before set operations express the business meaning.",
      },
      {
        title: "Keep lifetime and capacity separate",
        body: "Map strongly retains keys and values and is iterable. Weak collections serve different ownership use cases and are not enumerable substitutes for bounded caches. A Map does not automatically supply eviction, TTL, tenant isolation, or a specified constant-time performance bound for every operation.",
      },
    ],
    code: `const first = { id: 7 };\nconst second = { id: 7 };\nconst map = new Map([[first, 'stored']]);\nconsole.log(map.get(first), map.get(second));\nmap.set('missing-value', undefined);\nconsole.log(map.has('missing-value'), map.get('missing-value'));\nconsole.log(new Set([NaN, NaN, 0, -0]).size);\nconsole.log([...new Set([1, 2]).intersection(new Set([2, 3]))]);`,
    pitfalls: [
      "Expecting object keys to compare by contents.",
      "Using get(...) === undefined as every existence test.",
      "Treating Map as an automatically bounded cache.",
    ],
    practice:
      "Deduplicate records from two requests by a stable entity key, define which version wins, and preserve an explicit output order. Compare that with identity-based Set behavior.",
    challenge: {
      prompt: "Does overwriting a Map value move its key to the end?",
      solution: `const map = new Map([['a', 1], ['b', 2]]);\nmap.set('a', 3);\nconsole.log([...map.keys()]); // ['a', 'b']`,
      explanation:
        "Updating the value of an existing key retains that key's position. Deleting and reinserting is a distinct sequence of operations.",
    },
    quiz: {
      question: "Can get alone distinguish a missing entry from a stored undefined?",
      choices: ["No; use has when that distinction matters", "Yes", "Only with string keys"],
      answer: 0,
      explanation: "Both reads can return undefined. Membership is a separate question.",
    },
    sources: [
      {
        title: "MDN · Keyed collections",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections",
      },
    ],
  }),
  js({
    slug: "function-call-semantics",
    title: "Call, apply, bind, new & lexical this",
    description:
      "Trace the receiver and constructor protocol instead of attaching this to a function's declaration location.",
    level: "Deep dive",
    prerequisites: ["functions-and-parameters", "objects-and-prototypes"],
    mental:
      "An ordinary function's this depends on the call protocol. An arrow captures lexical this. A bound function carries bound call information, and construction invokes a separate capability with different receiver rules.",
    steps: [
      {
        title: "Read the call expression",
        body: "A member call such as object.method() supplies a receiver. Extracting that function loses the member-call reference information. Parenthesizing a member expression does not always destroy the reference, whereas operations that produce only a value can. Strict standalone calls keep undefined this rather than substituting the global object.",
      },
      {
        title: "Use explicit call tools",
        body: "call passes an explicit this followed by arguments; apply consumes an array-like argument list; spread in a call consumes an iterable. bind creates another callable with bound this and leading arguments. Calling bind again does not replace an already bound this, though more arguments can be bound.",
      },
      {
        title: "Distinguish arrows and methods",
        body: "An arrow has lexical this and no ordinary constructor capability. Methods have home-object information used by super and are also not ordinary constructors. Passing a method as a callback may lose its receiver unless the API or wrapper restores it. A class-field arrow trades per-instance function allocation for an instance-bound closure.",
      },
      {
        title: "Separate construction from calling",
        body: "new uses the target's construction behavior and creates or obtains an instance through that protocol. A bound constructible target remains usable with new, but its bound this is not the constructed receiver. Returning an object from an ordinary constructor can replace the created instance. Use classes and factories deliberately rather than assuming every function supports both modes.",
      },
    ],
    code: `const owner = { name: 'Ada', read() { return this?.name; } };\nconst extracted = owner.read;\nconsole.log(owner.read(), extracted());\nconsole.log(extracted.call({ name: 'Grace' }));\nconst bound = extracted.bind({ name: 'Lin' });\nconsole.log(bound.call({ name: 'ignored' }));\nfunction Item(name) { this.name = name; }\nconst BoundItem = Item.bind({ name: 'unused' }, 'constructed');\nconsole.log(new BoundItem().name);`,
    pitfalls: [
      "Thinking this is determined by lexical nesting for every function.",
      "Expecting call to override a bound this.",
      "Using new with an arrow or an ordinary object method.",
    ],
    practice:
      "Create a receiver table for member calls, extracted calls, call/apply, bound calls, and construction. Include one strict function and one arrow, and explain each result from the actual call expression.",
    challenge: {
      prompt: "Which receiver does a bound function use when called with call?",
      solution: `function read() { return this.id; }\nconst bound = read.bind({ id: 'first' });\nconsole.log(bound.call({ id: 'second' })); // first`,
      explanation:
        "The bound callable retains its bound this for ordinary calls. call supplies a receiver to that wrapper, but the wrapper invokes its target using the original bound receiver.",
    },
    quiz: {
      question: "Does an arrow function get a new this from call?",
      choices: ["No; its this is lexical", "Yes", "Only in strict mode"],
      answer: 0,
      explanation: "call does not replace the lexical this captured by an arrow.",
    },
    sources: [
      {
        title: "MDN · this",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this",
      },
      {
        title: "MDN · bind",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind",
      },
    ],
  }),
  js({
    slug: "destructuring-and-spread",
    title: "Destructuring, defaults, rest & spread",
    description:
      "Follow evaluation, iterator consumption, property reads, defaults, and shallow copying precisely.",
    level: "Advanced",
    prerequisites: [
      "functions-and-parameters",
      "objects-and-enumeration",
      "arrays-and-sparse-data",
    ],
    mental:
      "Similar punctuation can invoke different protocols. Array destructuring consumes an iterable; object destructuring reads named properties; object rest copies selected enumerable own properties. Defaults are selected for undefined, not every missing-looking value.",
    steps: [
      {
        title: "Separate binding from assignment",
        body: "A declaration can introduce bindings through a pattern; an assignment pattern writes existing targets. Object assignment patterns often need parentheses to disambiguate them from a block. Renaming a property in a pattern changes the binding name, not the source object's key. Later defaults can observe earlier initialized bindings.",
      },
      {
        title: "Follow the iterator protocol",
        body: "Array destructuring uses iteration, so a Set or generator can participate while a non-iterable array-like object cannot automatically do so. Elisions still advance the iterator. Early completion can close an iterator, and rest consumes the remaining values, potentially without a bound if the iterator is infinite.",
      },
      {
        title: "Understand object reads and exclusions",
        body: "Object destructuring can read inherited properties through ordinary property lookup and can invoke accessors. Object rest instead copies the remaining enumerable own properties, including appropriate symbols. A default only handles undefined; nested destructuring can still throw when an intermediate value is null or undefined.",
      },
      {
        title: "Avoid false deep-copy assumptions",
        body: "Array spread follows iteration and object spread follows its property-copy protocol; neither supplies arbitrary deep cloning. Order determines which later property overwrites an earlier one. Spreading enormous argument lists into a function can exceed implementation limits, so an aggregate operation may need an iterative algorithm instead.",
      },
    ],
    code: `const input = { value: null, nested: { count: 1 } };\nconst { value = 7, nested: alias, ...rest } = input;\nconsole.log(value, rest);\nalias.count = 2;\nconsole.log(input.nested.count);\nconst [first, ...remaining] = new Set([3, 4, 5]);\nconsole.log(first, remaining);\nconst { missing = 'default' } = {};\nconsole.log(missing);`,
    pitfalls: [
      "Expecting null to trigger a destructuring default.",
      "Destructuring an array-like object without an iterator.",
      "Using rest on an unbounded iterable.",
    ],
    practice:
      "Destructure a generator with a finally block and inspect when it closes. Compare object property reads with object rest on inherited, symbolic, and accessor properties.",
    challenge: {
      prompt: "Which parts of this copy remain shared?",
      solution: `const source = { nested: { n: 1 } };\nconst copy = { ...source };\ncopy.nested.n = 2;\nconsole.log(source.nested.n); // 2`,
      explanation:
        "Only the outer object was copied. Its nested property still contains the same object-valued reference.",
    },
    quiz: {
      question: "What protocol does array destructuring use?",
      choices: ["Iteration", "Only numeric property lookup on any object", "JSON parsing"],
      answer: 0,
      explanation:
        "An array pattern consumes iterable values; that is different from ordinary object property destructuring.",
    },
    sources: [
      {
        title: "MDN · Destructuring",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring",
      },
    ],
  }),
  js({
    slug: "regex-and-backtracking",
    title: "Regular expressions, state & backtracking",
    description:
      "Build patterns with explicit Unicode, matching, escaping, state, and input-size assumptions.",
    level: "Deep dive",
    prerequisites: ["strings-and-unicode", "errors-and-completion"],
    mental:
      "A regular expression is a matching program with flags and, in some modes, mutable lastIndex state. Its apparent brevity does not guarantee linear runtime or a correct model of the language being parsed.",
    steps: [
      {
        title: "Define the matching contract",
        body: "Decide whether to search, validate the entire input, tokenize from an exact position, or extract repeated matches. Anchors, captures, greedy versus lazy quantifiers, lookarounds, and alternation affect that contract. Multiline anchoring and dot-all behavior are separate flags. Test negative cases rather than only strings that should match.",
      },
      {
        title: "Treat global and sticky patterns as stateful",
        body: "exec and test with global or sticky flags use and update lastIndex. Reusing one instance across inputs can therefore alternate outcomes unexpectedly. Sticky matching requires the match at the current index instead of searching farther ahead. Zero-length matches need deliberate advancement in manual loops to avoid non-progress.",
      },
      {
        title: "Choose Unicode and escaping intentionally",
        body: "Unicode-aware modes and property escapes change the character model; newer v-mode features have their own syntax and compatibility requirements. Build dynamic literal fragments with RegExp.escape where supported or a vetted equivalent for the exact context. Escaping a literal fragment is different from sanitizing an entire regular expression supplied by an untrusted user.",
      },
      {
        title: "Bound complexity and use parsers when needed",
        body: "Nested ambiguous quantifiers can create catastrophic backtracking on adversarial near-matches. Anchoring alone does not solve the complexity problem. Bound input sizes, avoid dangerous pattern shapes, or choose an appropriate engine/parser. HTML, arbitrary JSON, and nested language grammars deserve dedicated parsers rather than increasingly complex pattern folklore.",
      },
    ],
    code: `const pattern = /a/g;\nconsole.log(pattern.test('a'), pattern.lastIndex);\nconsole.log(pattern.test('a'), pattern.lastIndex);\npattern.lastIndex = 0;\nconsole.log(pattern.test('a'));\nconst words = [...'Ada 42 Lin'.matchAll(/(?<word>[A-Za-z]+)/g)];\nconsole.log(words.map(match => match.groups.word));\nconsole.log(/^\\p{Letter}+$/u.test('café'));`,
    pitfalls: [
      "Sharing a global RegExp without accounting for lastIndex.",
      "Testing a pathological pattern on unbounded untrusted input.",
      "Treating Unicode code points as full grapheme clusters.",
    ],
    practice:
      "Build a tokenizer with a sticky pattern and explicit progress checks. Test zero-length matches and invalid input, then review a validation pattern for ambiguous nested quantifiers without running a denial-of-service input on the UI thread.",
    challenge: {
      prompt: "Why do repeated tests with the same input differ?",
      solution: `const pattern = /x/g;\nconsole.log(pattern.test('x')); // true\nconsole.log(pattern.test('x')); // false\nconsole.log(pattern.test('x')); // true`,
      explanation:
        "A successful global test advances lastIndex. The next test starts there and fails; failure resets lastIndex, allowing the following test to match again.",
    },
    quiz: {
      question: "Does adding anchors guarantee a pattern cannot backtrack catastrophically?",
      choices: ["No", "Yes", "Only with the global flag"],
      answer: 0,
      explanation:
        "The internal ambiguity of the pattern can still cause excessive work on a near-match.",
    },
    sources: [
      {
        title: "MDN · Regular expressions guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions",
      },
      {
        title: "MDN · RegExp",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp",
      },
    ],
  }),
  js({
    slug: "dates-and-intl",
    title: "Dates, instants, Intl & calendar policy",
    description:
      "Stop mixing UTC instants, wall-clock schedules, calendar dates, durations, and locale formatting.",
    level: "Advanced",
    prerequisites: ["numbers-and-bigint", "strings-and-unicode"],
    mental:
      "A Date primarily represents an instant as a millisecond time value, not a stored named time zone or a birthday. Formatting selects a human representation; scheduling requires additional calendar and zone rules.",
    steps: [
      {
        title: "Name the domain before choosing storage",
        body: "An audit timestamp is an instant; a birthday is a calendar date; a weekly meeting is a recurrence in a time zone; a stopwatch measures elapsed duration. These domains require different data. Encoding all of them as midnight UTC loses meaning and can shift a displayed calendar day for another zone.",
      },
      {
        title: "Control parsing and units",
        body: "Date time values use milliseconds, while many APIs transport seconds. Invalid dates retain an invalid numeric time value and need explicit detection. Date-only ISO forms and date-time forms without an offset have different parsing semantics; nonstandard input formats should not be treated as portable. Prefer explicit contracts over parsing arbitrary display text.",
      },
      {
        title: "Handle calendar arithmetic as calendar arithmetic",
        body: "Adding 24 hours in milliseconds is an elapsed-duration operation, not always advancing one local calendar day. Daylight-saving transitions can create missing or repeated local times. Specify disambiguation and recurrence policy. Temporal separates important date/time domains where the target environment or selected polyfill supports it; do not assume universal native availability.",
      },
      {
        title: "Format and compare with explicit context",
        body: "Intl.DateTimeFormat accepts locale and timeZone inputs; Intl.NumberFormat and Collator cover other presentation domains. Formatting output is not a stable machine serialization format and should not be parsed back as an API protocol. Use explicit context during SSR and hydration so server and client defaults do not disagree.",
      },
    ],
    code: `const instant = new Date('2026-10-31T12:00:00Z');\nconsole.log(instant.toISOString());\nconst utc = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' });\nconsole.log(utc.format(instant));\nconsole.log(Number.isNaN(new Date('invalid').getTime()));\nconsole.log(typeof globalThis.Temporal); // feature availability, not a universal promise`,
    pitfalls: [
      "Mixing epoch seconds with milliseconds.",
      "Using locale-formatted text as a machine protocol.",
      "Treating every recurrence as a fixed millisecond increment.",
    ],
    practice:
      "Design a recurring 09:00 meeting and a birthday field. Specify their stored types, zone/calendar inputs, ambiguous-time behavior, and formatting. Test a daylight-saving boundary and a non-hour offset.",
    challenge: {
      prompt: "Does toISOString retain a named source time zone?",
      solution: `const value = new Date('2026-10-31T14:00:00+02:00');\nconsole.log(value.toISOString()); // 2026-10-31T12:00:00.000Z`,
      explanation:
        "The input offset identifies an instant. Date does not retain that original offset or a named zone as part of its stored time value; ISO serialization renders the instant in UTC.",
    },
    quiz: {
      question: "Is a birthday inherently a UTC instant?",
      choices: ["No; it is usually a calendar-date domain", "Yes", "Only outside daylight saving"],
      answer: 0,
      explanation:
        "Assigning an instant without a calendar/zone policy can change the user's intended date when displayed elsewhere.",
    },
    sources: [
      {
        title: "MDN · Date",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date",
      },
      {
        title: "MDN · Intl",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl",
      },
    ],
  }),
  js({
    slug: "json-and-serialization",
    title: "JSON, structured cloning & wire contracts",
    description: "Audit what serialization preserves, transforms, executes, omits, and rejects.",
    level: "Advanced",
    prerequisites: ["objects-and-enumeration", "numbers-and-bigint", "errors-and-completion"],
    mental:
      "A wire representation is a new contract, not a perfect snapshot of arbitrary JavaScript objects. JSON serialization, structured cloning, and ownership transfer each preserve a different set of values and behaviors.",
    steps: [
      {
        title: "Know JSON's value model",
        body: "JSON has strings, numbers, booleans, null, arrays, and objects with string keys. It does not directly express undefined, symbols, functions, cycles, or default BigInt values. stringify treats unsupported object properties differently from unsupported array elements, and non-finite Number values become null. Precision can already be lost when numeric JSON tokens are parsed as Number.",
      },
      {
        title: "Treat serialization as possible execution",
        body: "JSON.stringify can invoke getters and toJSON methods. It is not a side-effect-free inspector or a safe way to evaluate arbitrary objects. Replacers and revivers can implement a representation protocol, but both sides must agree on tags and validation. Never infer a privileged class or capability merely from an attacker-supplied type tag.",
      },
      {
        title: "Separate cloning and transfer",
        body: "structuredClone supports many built-in values and cyclic graphs, but it does not copy arbitrary functions, preserve every custom prototype, or establish a transport schema. Transferable buffers detach the sender instead of cloning their storage. JSON parse/stringify is therefore neither a universal deep clone nor a substitute for structured ownership.",
      },
      {
        title: "Version the application contract",
        body: "Build minimal DTOs, validate decoded input, and preserve identifiers and decimal values in intentional representations. Distinguish absent fields from explicit null. Cache keys based on naive serialization need care with key ordering and value loss; a compatibility and canonicalization policy is separate from pretty-printing.",
      },
    ],
    code: `const value = { missing: undefined, infinite: Infinity, list: [undefined, NaN] };\nconsole.log(JSON.stringify(value));\nconst cycle = { name: 'root' };\ncycle.self = cycle;\nconst copy = structuredClone(cycle);\nconsole.log(copy !== cycle, copy.self === copy);\nconsole.log(JSON.stringify({ id: 9007199254740993n.toString() }));`,
    pitfalls: [
      "Using JSON round trips as a universal clone.",
      "Logging arbitrary objects through stringify without considering getters or toJSON.",
      "Transporting exact long IDs as JSON numbers.",
    ],
    practice:
      "Specify a versioned DTO containing a long ID, a decimal amount, an optional field, and an instant. Test absent/null behavior and reject a malicious tagged object before it can become a privileged capability.",
    challenge: {
      prompt: "Why do object and array positions differ here?",
      solution: `console.log(JSON.stringify({ x: undefined })); // {}\nconsole.log(JSON.stringify([undefined])); // [null]`,
      explanation:
        "An unsupported object property's value causes that property to be omitted. An unsupported array position is represented as null to preserve the position in the JSON array.",
    },
    quiz: {
      question: "Can JSON.stringify invoke application code?",
      choices: ["Yes, through accessors and toJSON", "No", "Only when indentation is enabled"],
      answer: 0,
      explanation:
        "Serialization performs observable property operations and can call user-defined serialization hooks.",
    },
    sources: [
      {
        title: "MDN · JSON.stringify",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify",
      },
      {
        title: "MDN · Structured clone algorithm",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm",
      },
    ],
  }),
];
