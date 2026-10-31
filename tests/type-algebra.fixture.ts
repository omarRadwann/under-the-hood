// Compiled by the production TypeScript check; negative cases must remain errors.
type Item<T> = T extends readonly (infer U)[] ? U : T;
type IsAllText<T> = [T] extends [string] ? true : false;
const mixed: Item<string[] | number> = 7;
const allText: IsAllText<string | number> = false;
function read<T, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}
const mode: "dark" = read({ mode: "dark" } as const, "mode");
// @ts-expect-error A nonexistent key is rejected at the static boundary.
read({ mode: "dark" }, "missing");
// @ts-expect-error Whole-union checking does not distribute to produce true.
const invalid: IsAllText<string | number> = true;
void mixed;
void allText;
void mode;
void invalid;
