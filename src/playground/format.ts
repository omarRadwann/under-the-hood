/** Snapshot ordinary own data without invoking getters or toJSON. Proxy traps can still run. */
export function formatValue(value: unknown): string {
  const seen = new WeakSet<object>();
  function inspect(item: unknown, depth: number): string {
    if (typeof item === "string") return JSON.stringify(item.slice(0, 1800));
    if (item === null) return "null";
    if (typeof item === "bigint") return `${item}n`;
    if (typeof item !== "object" && typeof item !== "function") return String(item);
    if (seen.has(item)) return "[Circular]";
    seen.add(item);
    try {
      if (depth >= 3) return Array.isArray(item) ? "[Array]" : "[Object]";
      const descriptors = Object.getOwnPropertyDescriptors(item);
      if (typeof item === "function")
        return `[Function ${typeof descriptors.name?.value === "string" ? descriptors.name.value : "anonymous"}]`;
      if (item instanceof Error)
        return `${Object.getPrototypeOf(item) === TypeError.prototype ? "TypeError" : "Error"}: ${typeof descriptors.message?.value === "string" ? descriptors.message.value : ""}`;
      const entries = Object.entries(descriptors)
        .filter(([, d]) => d.enumerable)
        .slice(0, 20);
      const values = entries.map(
        ([key, descriptor]) =>
          `${Array.isArray(item) ? "" : JSON.stringify(key) + ":"}${"value" in descriptor ? inspect(descriptor.value, depth + 1) : "[Accessor]"}`,
      );
      if (
        Object.keys(descriptors).filter((key) => descriptors[key].enumerable).length >
        entries.length
      )
        values.push("…");
      return Array.isArray(item) ? `[${values.join(",")}]` : `{${values.join(",")}}`;
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
