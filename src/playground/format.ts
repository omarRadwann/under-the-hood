const mapEntries = Map.prototype.entries;
const setValues = Set.prototype.values;
const dateTime = Date.prototype.getTime;
const dateISO = Date.prototype.toISOString;

/** Keep emitted fields inside the parent's validated message boundary. */
export function runtimeText(value: string) {
  return value.length > 5000 ? value.slice(0, 4999) + "…" : value;
}

/** Bounded snapshots without invoking ordinary getters, custom iterators, or toJSON.
 * Proxy reflection traps can still run; this observer is not a security boundary. */
export function formatValue(value: unknown): string {
  const seen = new WeakSet<object>();
  function inspect(item: unknown, depth: number): string {
    if (typeof item === "string") return JSON.stringify(item.slice(0, 1800));
    if (item === null) return "null";
    if (typeof item === "bigint") return `${item}n`;
    if (Object.is(item, -0)) return "-0";
    if (typeof item !== "object" && typeof item !== "function") return String(item);
    if (seen.has(item)) return "[Circular]";
    seen.add(item);
    try {
      if (depth >= 3) return Array.isArray(item) ? "[Array]" : "[Object]";
      const descriptors = Object.getOwnPropertyDescriptors(item);
      if (typeof item === "function")
        return `[Function ${typeof descriptors.name?.value === "string" ? descriptors.name.value : "anonymous"}]`;
      if (item instanceof Error) {
        let name = "Error";
        let prototype: object | null = item;
        for (let level = 0; prototype && level < 8; level++) {
          const candidate = Object.getOwnPropertyDescriptor(prototype, "name");
          if (candidate && typeof candidate.value === "string") {
            name = candidate.value;
            break;
          }
          prototype = Object.getPrototypeOf(prototype);
        }
        return `${name}: ${typeof descriptors.message?.value === "string" ? descriptors.message.value : ""}`;
      }
      if (item instanceof Date)
        return Number.isNaN(dateTime.call(item))
          ? "Invalid Date"
          : `Date(${JSON.stringify(dateISO.call(item))})`;
      if (item instanceof Map || item instanceof Set) {
        const map = item instanceof Map;
        const iterator = map
          ? mapEntries.call(item as Map<unknown, unknown>)
          : setValues.call(item as Set<unknown>);
        const entries: string[] = [];
        for (let index = 0; index <= 20; index++) {
          const next = iterator.next();
          if (next.done) break;
          if (index === 20) {
            entries.push("…");
            break;
          }
          entries.push(
            map
              ? `${inspect(next.value[0], depth + 1)} => ${inspect(next.value[1], depth + 1)}`
              : inspect(next.value, depth + 1),
          );
        }
        return `${map ? "Map" : "Set"} {${entries.join(",")}}`;
      }
      if (item instanceof WeakMap) return "WeakMap {<entries not enumerable>}";
      if (item instanceof WeakSet) return "WeakSet {<entries not enumerable>}";
      const ownValue = (descriptor: PropertyDescriptor) =>
        "value" in descriptor ? inspect(descriptor.value, depth + 1) : "[Accessor]";
      const properties = (entries: readonly (readonly [PropertyKey, PropertyDescriptor])[]) => {
        const values = entries
          .slice(0, 20)
          .map(
            ([key, descriptor]) =>
              `${typeof key === "symbol" ? "[" + String(key) + "]" : JSON.stringify(key)}:${ownValue(descriptor)}`,
          );
        if (entries.length > 20) values.push("…");
        return `{${values.join(",")}}`;
      };
      const entries = Reflect.ownKeys(descriptors).flatMap((key) => {
        const descriptor = Reflect.get(descriptors, key) as PropertyDescriptor;
        return descriptor.enumerable ? [[key, descriptor] as const] : [];
      });
      if (Array.isArray(item)) {
        const length = descriptors.length.value as number;
        const values = Array.from({ length: Math.min(length, 20) }, (_, index) =>
          descriptors[index] ? ownValue(descriptors[index]) : "<empty>",
        );
        if (length > 20) values.push("…");
        const extras = entries.filter(
          ([key]) =>
            typeof key !== "string" || !(/^(0|[1-9]\d*)$/.test(key) && Number(key) < length),
        );
        return `[${values.join(",")}]${extras.length ? " " + properties(extras) : ""}`;
      }
      return properties(entries);
    } finally {
      seen.delete(item);
    }
  }
  try {
    return (typeof value === "string" ? value : inspect(value, 0)).slice(0, 1800);
  } catch {
    return "[Value could not be inspected]";
  }
}
