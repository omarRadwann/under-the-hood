/** Re-read before an edit instead of replacing storage with a stale React snapshot.
 * This is last-write-wins persistence, not a transaction across simultaneous tabs. */
export function updateStoredValue<T>({
  storage,
  key,
  parse,
  fallback,
  change,
  preferMemory = false,
}: {
  storage: Pick<Storage, "getItem" | "setItem"> | null;
  key: string;
  parse: (raw: string | null) => T;
  fallback: T;
  change: (previous: T) => T;
  preferMemory?: boolean;
}) {
  let previous = fallback;
  let storageError = storage === null;
  if (storage && !preferMemory) {
    try {
      previous = parse(storage.getItem(key));
    } catch {
      storageError = true;
    }
  }
  const value = change(previous);
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    storageError = true;
  }
  return { value, storageError };
}
