import { formatValue as format, runtimeText } from "./format";
import type { RuntimeEvent, RuntimePacket, TraceSnapshot } from "./types";

const host = globalThis as unknown as {
  postMessage: (message: RuntimePacket) => void;
  onmessage: ((event: MessageEvent) => void) | null;
  onunhandledrejection: ((event: PromiseRejectionEvent) => void) | null;
};
const nativeTimeout = globalThis.setTimeout.bind(globalThis);
const nativeClearTimeout = globalThis.clearTimeout.bind(globalThis);
const nativeInterval = globalThis.setInterval.bind(globalThis);
const nativeClearInterval = globalThis.clearInterval.bind(globalThis);
const nativeMicrotask = globalThis.queueMicrotask.bind(globalThis);
const nativeThen = Promise.prototype.then;
const send = host.postMessage.bind(host);

host.onmessage = ({ data }: MessageEvent<{ runId: string; code: string; mode: string }>) => {
  host.onmessage = null;
  const { runId, code, mode } = data;
  const start = performance.now();
  let sequence = 0;
  let frameId = 0;
  let sourceLine: number | null = null;
  let budget = 70000;
  let ended = false;
  let scriptDone = false;
  let clockTime = 0;
  const frames: TraceSnapshot["frames"] = [];
  const timers = new Map<number, { label: string; delay: number }>();
  const microtasks = new Map<number, string>();
  const reactions = new Map<number, string>();
  let callbackId = 0;
  const entries = new Map<string, { value: unknown; expiresAt: number }>();
  const originData = new Map<string, { value: unknown; version: number }>([
    ["product", { value: { price: 100 }, version: 1 }],
  ]);
  let originReads = 0;
  const snapshot = (): TraceSnapshot => ({
    frames: frames.map((f) => ({ ...f, name: runtimeText(f.name) })),
    timers: [...timers].map(([id, timer]) => ({ id, ...timer })),
    microtasks: [...microtasks.values()],
    reactions: [...reactions.values()],
    cache: [...entries].map(([key, e]) => ({
      key: runtimeText(key),
      value: format(e.value),
      expiresAt: e.expiresAt,
      fresh: e.expiresAt > clockTime,
    })),
    clock: clockTime,
    origin: [...originData].map(([key, e]) => ({
      key: runtimeText(key),
      value: format(e.value),
      version: e.version,
    })),
  });
  function emit(kind: string, label: string, detail?: string) {
    if (ended) return;
    if (sequence >= 1200)
      throw new Error(
        "Trace limit reached (1,200 events). Reduce the example or use fewer iterations.",
      );
    const event: RuntimeEvent = {
      sequence: sequence++,
      kind,
      label: runtimeText(label),
      detail: detail === undefined ? undefined : runtimeText(detail),
      line: [
        "timer:start",
        "timer:end",
        "microtask:start",
        "microtask:end",
        "promise:run",
        "origin:resolve",
        "complete",
      ].includes(kind)
        ? null
        : sourceLine,
      time: performance.now() - start,
      snapshot: snapshot(),
    };
    send({ channel: "uth-playground", runId, type: "event", event });
  }
  function fail(error: unknown) {
    if (ended) return;
    if (sequence < 1200) emit("error", format(error));
    ended = true;
    send({ channel: "uth-playground", runId, type: "error", message: format(error) });
  }
  function guard(line?: number) {
    if (line) sourceLine = line;
    if (--budget <= 0)
      throw new Error("Instruction budget exceeded. Loops and recursion must be bounded.");
  }
  const trace = {
    guard,
    line(line: number, id: number | null) {
      guard(line);
      const frame = frames.find((frame) => frame.id === id);
      // Rejection skips afterAwait; catch/finally still resume native execution.
      if (frame?.status === "suspended") {
        frame.status = "running";
        emit("resume", "Resume at authored continuation");
      }
      emit("statement", `Line ${line}`);
    },
    enter(name: string, line: number) {
      guard(line);
      const id = ++frameId;
      frames.push({ id, name, status: "running" });
      emit("call", `Enter ${name}`);
      return id;
    },
    exit(id: number) {
      const index = frames.findIndex((f) => f.id === id);
      const name = frames[index]?.name;
      if (index >= 0) frames.splice(index, 1);
      emit("return", `Return from ${name ?? "call"}`);
    },
    beforeAwait(value: unknown, line: number, id: number | null, kind?: string) {
      sourceLine = line;
      const f = frames.find((f) => f.id === id);
      if (f) f.status = "suspended";
      emit(
        "await",
        kind === "iteration" ? "Enter async iteration boundary" : "Suspend at await",
        "The value is passed through unchanged; native await and iterator protocols own continuation scheduling.",
      );
      return value;
    },
    afterAwait(value: unknown, line: number, id: number | null, kind?: string) {
      sourceLine = line;
      const f = frames.find((f) => f.id === id);
      if (f) f.status = "running";
      emit("resume", kind === "iteration" ? "Resume for-await body" : "Resume after await");
      return value;
    },
  };
  const originalConsole = globalThis.console;
  globalThis.console = {
    ...originalConsole,
    ...Object.fromEntries(
      ["log", "info", "warn", "error", "debug"].map((level) => [
        level,
        (...args: unknown[]) => emit("console", args.map(format).join(" "), level),
      ]),
    ),
  };
  function timer(
    callback: (...args: unknown[]) => unknown,
    delay = 0,
    interval = false,
    args: unknown[] = [],
  ) {
    if (typeof callback !== "function")
      throw new TypeError("Use a function callback; string timers are disabled.");
    // HTML's numeric conversion rejects BigInt, including a BigInt primitive
    // produced by an object's conversion hook. Number(...) would accept it.
    const ms = Math.max(0, +delay || 0);
    if (ms > 2000) throw new Error("Use delays of at most 2,000ms in this bounded playground.");
    const id = ++callbackId;
    const invoke = () => {
      if (ended) return;
      if (!interval) {
        timers.delete(id);
        handles.delete(handle);
      }
      emit("timer:start", `Timer #${id} callback`);
      try {
        callback.apply(globalThis, args);
      } catch (error) {
        fail(error);
      } finally {
        emit("timer:end", `Timer #${id} returned`);
      }
    };
    const handle = interval
      ? nativeInterval(invoke, Math.max(0, ms))
      : nativeTimeout(invoke, Math.max(0, ms));
    timers.set(id, { label: `${interval ? "interval" : "timeout"} #${id}`, delay: ms });
    handles.set(handle, id);
    emit(
      "timer:register",
      `Register timer #${id}`,
      `${ms}ms requested delay; actual firing time is host-controlled.`,
    );
    return handle;
  }
  const handles = new Map<ReturnType<typeof setTimeout>, number>();
  globalThis.setTimeout = ((
    fn: (...args: unknown[]) => unknown,
    delay?: number,
    ...args: unknown[]
  ) => timer(fn, delay, false, args)) as typeof setTimeout;
  globalThis.setInterval = ((
    fn: (...args: unknown[]) => unknown,
    delay?: number,
    ...args: unknown[]
  ) => timer(fn, delay, true, args)) as typeof setInterval;
  const clear = (handle: ReturnType<typeof setTimeout>) => {
    const id = handles.get(handle);
    if (id !== undefined) {
      timers.delete(id);
      handles.delete(handle);
      emit("timer:cancel", `Cancel timer #${id}`);
    }
    nativeClearTimeout(handle);
    nativeClearInterval(handle);
  };
  globalThis.clearTimeout = clear as typeof clearTimeout;
  globalThis.clearInterval = clear as typeof clearInterval;
  globalThis.queueMicrotask = (fn) => {
    if (typeof fn !== "function")
      throw new TypeError("queueMicrotask requires a function callback.");
    const id = ++callbackId;
    microtasks.set(id, `microtask #${id}`);
    emit("microtask:queue", `Enqueue microtask #${id}`);
    nativeMicrotask(() => {
      if (ended) return;
      microtasks.delete(id);
      emit("microtask:start", `Run microtask #${id}`);
      try {
        fn();
      } catch (error) {
        fail(error);
      } finally {
        emit("microtask:end", `Microtask #${id} returned`);
      }
    });
  };
  function tracedThen(
    this: Promise<unknown>,
    onFulfilled?: ((value: unknown) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) {
    const id = ++callbackId;
    const wrap =
      (fn: ((value: unknown) => unknown) | null | undefined, rejected: boolean) =>
      (value: unknown) => {
        reactions.delete(id);
        emit("promise:run", `Run ${rejected ? "rejection" : "fulfillment"} reaction #${id}`);
        if (typeof fn !== "function") {
          if (rejected) throw value;
          return value;
        }
        return fn(value);
      };
    // Brand/species checks may throw; record only a successful native subscription.
    const result = nativeThen.call(this, wrap(onFulfilled, false), wrap(onRejected, true));
    reactions.set(id, `reaction #${id}`);
    emit(
      "promise:subscribe",
      `Register promise reaction #${id}`,
      "Registration does not reveal whether this promise is settled or the reaction is already runnable.",
    );
    return result;
  }
  Object.defineProperty(Promise.prototype, "then", {
    value: tracedThen,
    configurable: true,
    writable: true,
  });
  const cache = {
    get(key: string) {
      const item = entries.get(String(key));
      emit(
        "cache:read",
        `${item ? "Found" : "Missing"} cache entry: ${key}`,
        item
          ? "Freshness is decided by your algorithm; get returns stored entries including expired ones."
          : undefined,
      );
      return item ? structuredClone(item) : undefined;
    },
    set(key: string, value: unknown, ttl: number) {
      if (!Number.isFinite(ttl) || ttl < 0)
        throw new Error("TTL must be a finite non-negative number of logical milliseconds.");
      if (!Number.isFinite(clockTime + ttl))
        throw new RangeError("Cache expiry exceeds the logical clock range.");
      if (entries.size >= 50 && !entries.has(String(key)))
        throw new Error("Teaching cache is limited to 50 keys.");
      entries.set(String(key), { value: structuredClone(value), expiresAt: clockTime + ttl });
      emit("cache:write", `Store ${key}`, `Expires at logical t=${clockTime + ttl}ms.`);
    },
    delete(key: string) {
      const result = entries.delete(String(key));
      emit("cache:invalidate", `Invalidate ${key}`);
      return result;
    },
    clear() {
      entries.clear();
      emit("cache:invalidate", "Clear cache");
    },
    entries() {
      return structuredClone([...entries]);
    },
  };
  const origin = {
    read(key: string, delay = 20) {
      const item = structuredClone(originData.get(String(key)) ?? { value: null, version: 0 });
      originReads++;
      emit(
        "origin:read",
        `Origin read #${originReads}: ${key} v${item.version}`,
        "Value is captured now and delivered after the wall-clock delay.",
      );
      return new Promise((resolve) =>
        globalThis.setTimeout(() => {
          emit("origin:resolve", `Deliver ${key} v${item.version}`);
          resolve(item.value);
        }, delay),
      );
    },
    write(key: string, value: unknown) {
      const previous = originData.get(String(key));
      originData.set(String(key), {
        value: structuredClone(value),
        version: (previous?.version ?? 0) + 1,
      });
      emit(
        "origin:write",
        `Origin ${key} → v${(previous?.version ?? 0) + 1}`,
        "No cache invalidation is implicit.",
      );
    },
  };
  const clock = {
    now: () => clockTime,
    advance(ms: number) {
      if (!Number.isFinite(ms) || ms < 0)
        throw new Error("Advance by a finite non-negative number of logical milliseconds.");
      if (!Number.isFinite(clockTime + ms))
        throw new RangeError("Advance exceeds the logical clock range.");
      clockTime += ms;
      emit("clock", `Logical clock → ${clockTime}ms`, "This does not fast-forward native timers.");
    },
  };
  const sleep = (ms: number) => new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
  host.onunhandledrejection = (event) => {
    event.preventDefault();
    fail(event.reason);
  };
  emit(
    "start",
    mode === "cache" ? "Start editable cache program" : "Start native worker execution",
    "Isolated worker; logical instrumentation is not a complete engine call stack or queue inspector.",
  );
  try {
    const execute = new Function(
      "__trace",
      "cache",
      "origin",
      "clock",
      "sleep",
      `"use strict"; return (async () => {\n${code}\n})();`,
    );
    const result = execute(trace, cache, origin, clock, sleep) as Promise<unknown>;
    nativeThen.call(
      result,
      () => {
        scriptDone = true;
        emit("script:end", "Script body completed");
      },
      fail,
    );
  } catch (error) {
    fail(error);
  }
  let idleSince = 0;
  const poll = () => {
    if (ended) return;
    const idle = scriptDone && timers.size === 0 && microtasks.size === 0;
    if (idle) {
      idleSince ||= performance.now();
      if (performance.now() - idleSince > 60) {
        emit(
          "done",
          "Execution settled",
          "No tracked host timers or explicit microtasks remain. Unsettled promises alone do not keep work running.",
        );
        ended = true;
        send({ channel: "uth-playground", runId, type: "done" });
        return;
      }
    } else idleSince = 0;
    nativeTimeout(poll, 20);
  };
  nativeTimeout(poll, 20);
};
