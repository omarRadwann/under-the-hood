import type { Step } from "@/lib/types";
export const technicalNotes: Record<string, Step[]> = {
  "functions-and-parameters": [
    {
      title: "Arguments and arity without legacy assumptions",
      body: "Rest is a real array; arguments is a separate array-like object in ordinary functions. Simple parameters in legacy sloppy functions can have mapped argument/parameter aliasing, while strict functions and non-simple parameter lists use different behavior. Modules are strict, and arrows inherit an outer arguments binding. Function.length counts parameters before the first default and excludes rest; it is metadata, not proof that a caller supplied valid inputs.",
    },
  ],
  "operators-and-precedence": [
    {
      title: "Keep the complete operator vocabulary in view",
      body: "The reference also includes delete, in, instanceof, typeof, void, new, await, yield, shifts, bitwise operations, the conditional operator, assignment families, and comma expressions. delete concerns properties rather than removing lexical declarations; in observes inherited presence; instanceof follows a customizable object protocol. These operators connect to the object, construction, and async chapters rather than being interchangeable syntax shortcuts.",
    },
  ],
  "strings-and-unicode": [
    {
      title: "Lone surrogates and context-specific encoding",
      body: "JavaScript strings can contain unpaired surrogate code units. Newer isWellFormed and toWellFormed APIs make that distinction explicit where supported. Different encoders can reject malformed input or replace invalid sequences, so specify the policy at the byte boundary. Tagged templates receive structured literal information and do not automatically sanitize SQL, HTML, URLs, or shell input.",
    },
  ],
  "array-transformations": [
    {
      title: "Group records under an explicit key protocol",
      body: "Object.groupBy returns groups on a null-prototype object and uses property-key semantics, while Map.groupBy retains arbitrary key identities. Their inputs follow iteration, which matters for sparse arrays and one-shot iterables. New findLast/findLastIndex and copying methods also have precise presence, order, and compatibility contracts. Choose from the key domain and traversal needs rather than treating every method as another map variant.",
    },
  ],
  "symbols-and-protocols": [
    {
      title: "Audit the less obvious well-known hooks",
      body: "Symbol.match, matchAll, replace, search, and split affect string-protocol consumers; Symbol.isConcatSpreadable affects selected concatenation behavior; Symbol.toStringTag affects a diagnostic tag. Some built-in operations consult species construction rules, with method-specific differences. Symbol.unscopables relates to legacy with behavior rather than ordinary module lexical scope. A hook changes its specified protocol, not every similar-looking operation.",
    },
  ],
  "resource-ownership": [
    {
      title: "Disposable stacks and dynamic acquisition",
      body: "Where supported, DisposableStack and AsyncDisposableStack manage dynamically acquired resources and deferred cleanup. use, adopt, and defer express different ownership adapters; move transfers pending cleanup ownership into another stack. Reverse disposal order and multiple-error handling are part of the contract. A syntax transform does not necessarily install the stack constructors or SuppressedError behavior.",
    },
  ],
  "module-linking-and-cycles": [
    {
      title: "Namespaces, re-exports, and import attributes",
      body: "Default exports, named exports, namespace imports, re-exports, and star exports have different binding and conflict rules. Exporting a binding differs from exporting the current result of an expression. Import attributes can select a supported module type such as JSON under host rules; a bundler may transform that boundary. URL identity, import maps, and package conditions are host resolution contracts, not one universal filesystem algorithm.",
    },
  ],
  "numbers-and-bigint": [
    {
      title: "Bit patterns versus mathematical integers",
      body: "Number bitwise operators coerce through 32-bit integer representations, and shift counts have their own masking behavior. Unsigned right shift produces a Number representing a 32-bit result, not a general exact conversion for large identifiers. BigInt bitwise operations use a different integer domain and do not support unsigned right shift. Use DataView and a declared wire width for binary parsing rather than operator folklore.",
    },
  ],
  "language-and-hosts": [
    {
      title: "Core language, legacy behavior, and proposals",
      body: "Strict mode restricts older constructs and changes selected failures; classic browser scripts can expose web-compatibility behavior that does not apply to modules. Annex B and engine extensions need their intended context. A Stage proposal, an experimental flag, a type declaration, and a broadly deployed standardized feature have different status. The reference index names newer families while requiring compatibility checks rather than treating all of them as universally available.",
    },
  ],
};
