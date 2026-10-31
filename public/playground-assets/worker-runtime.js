"use strict";
(() => {
  // src/playground/format.ts
  function formatValue(value) {
    const seen = /* @__PURE__ */ new WeakSet();
    function inspect(item, depth) {
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
        const entries = Object.entries(descriptors).filter(([, d]) => d.enumerable).slice(0, 20);
        const values = entries.map(
          ([key, descriptor]) => `${Array.isArray(item) ? "" : JSON.stringify(key) + ":"}${"value" in descriptor ? inspect(descriptor.value, depth + 1) : "[Accessor]"}`
        );
        if (Object.keys(descriptors).filter((key) => descriptors[key].enumerable).length > entries.length)
          values.push("\u2026");
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

  // src/playground/worker-runtime.ts
  var host = globalThis;
  var nativeTimeout = globalThis.setTimeout.bind(globalThis);
  var nativeClearTimeout = globalThis.clearTimeout.bind(globalThis);
  var nativeInterval = globalThis.setInterval.bind(globalThis);
  var nativeClearInterval = globalThis.clearInterval.bind(globalThis);
  var nativeMicrotask = globalThis.queueMicrotask.bind(globalThis);
  var nativeThen = Promise.prototype.then;
  var send = host.postMessage.bind(host);
  host.onmessage = ({ data }) => {
    host.onmessage = null;
    const { runId, code, mode } = data;
    const start = performance.now();
    let sequence = 0;
    let frameId = 0;
    let sourceLine = null;
    let budget = 7e4;
    let ended = false;
    let scriptDone = false;
    let clockTime = 0;
    const frames = [];
    const timers = /* @__PURE__ */ new Map();
    const microtasks = /* @__PURE__ */ new Map();
    const reactions = /* @__PURE__ */ new Map();
    let callbackId = 0;
    const entries = /* @__PURE__ */ new Map();
    const originData = /* @__PURE__ */ new Map([
      ["product", { value: { price: 100 }, version: 1 }]
    ]);
    let originReads = 0;
    const snapshot = () => ({
      frames: frames.map((f) => ({ ...f })),
      timers: [...timers].map(([id, timer2]) => ({ id, ...timer2 })),
      microtasks: [...microtasks.values()],
      reactions: [...reactions.values()],
      cache: [...entries].map(([key, e]) => ({
        key,
        value: formatValue(e.value),
        expiresAt: e.expiresAt,
        fresh: e.expiresAt > clockTime
      })),
      clock: clockTime,
      origin: [...originData].map(([key, e]) => ({
        key,
        value: formatValue(e.value),
        version: e.version
      }))
    });
    function emit(kind, label, detail) {
      if (ended) return;
      if (sequence >= 1200)
        throw new Error(
          "Trace limit reached (1,200 events). Reduce the example or use fewer iterations."
        );
      const event = {
        sequence: sequence++,
        kind,
        label,
        detail,
        line: [
          "timer:start",
          "timer:end",
          "microtask:start",
          "microtask:end",
          "promise:run",
          "origin:resolve",
          "complete"
        ].includes(kind) ? null : sourceLine,
        time: performance.now() - start,
        snapshot: snapshot()
      };
      send({ channel: "uth-playground", runId, type: "event", event });
    }
    function fail(error) {
      if (ended) return;
      if (sequence < 1200) emit("error", formatValue(error));
      ended = true;
      send({ channel: "uth-playground", runId, type: "error", message: formatValue(error) });
    }
    function guard(line) {
      if (line) sourceLine = line;
      if (--budget <= 0)
        throw new Error("Instruction budget exceeded. Loops and recursion must be bounded.");
    }
    const trace = {
      guard,
      line(line) {
        guard(line);
        emit("statement", `Line ${line}`);
      },
      enter(name, line) {
        guard(line);
        const id = ++frameId;
        frames.push({ id, name, status: "running" });
        emit("call", `Enter ${name}`);
        return id;
      },
      exit(id) {
        const index = frames.findIndex((f) => f.id === id);
        const name = frames[index]?.name;
        if (index >= 0) frames.splice(index, 1);
        emit("return", `Return from ${name ?? "call"}`);
      },
      beforeAwait(value, line, id) {
        sourceLine = line;
        const f = frames.find((f2) => f2.id === id);
        if (f) f.status = "suspended";
        emit(
          "await",
          "Suspend at await",
          "The awaited value is passed through unchanged; native await schedules the continuation."
        );
        return value;
      },
      afterAwait(value, line, id) {
        sourceLine = line;
        const f = frames.find((f2) => f2.id === id);
        if (f) f.status = "running";
        emit("resume", "Resume after await");
        return value;
      }
    };
    const originalConsole = globalThis.console;
    globalThis.console = {
      ...originalConsole,
      ...Object.fromEntries(
        ["log", "info", "warn", "error", "debug"].map((level) => [
          level,
          (...args) => emit("console", args.map(formatValue).join(" "), level)
        ])
      )
    };
    function timer(callback, delay = 0, interval = false, args = []) {
      if (typeof callback !== "function")
        throw new TypeError("Use a function callback; string timers are disabled.");
      const ms = Number(delay) || 0;
      if (ms > 2e3) throw new Error("Use delays of at most 2,000ms in this bounded playground.");
      const id = ++callbackId;
      const invoke = () => {
        if (ended) return;
        if (!interval) timers.delete(id);
        emit("timer:start", `Timer #${id} callback`);
        try {
          callback(...args);
        } catch (error) {
          fail(error);
        } finally {
          emit("timer:end", `Timer #${id} returned`);
        }
      };
      const handle = interval ? nativeInterval(invoke, Math.max(0, ms)) : nativeTimeout(invoke, Math.max(0, ms));
      timers.set(id, { label: `${interval ? "interval" : "timeout"} #${id}`, delay: ms });
      handles.set(handle, id);
      emit(
        "timer:register",
        `Register timer #${id}`,
        `${ms}ms requested delay; actual firing time is host-controlled.`
      );
      return handle;
    }
    const handles = /* @__PURE__ */ new Map();
    globalThis.setTimeout = ((fn, delay, ...args) => timer(fn, delay, false, args));
    globalThis.setInterval = ((fn, delay, ...args) => timer(fn, delay, true, args));
    const clear = (handle) => {
      const id = handles.get(handle);
      if (id !== void 0) {
        timers.delete(id);
        handles.delete(handle);
        emit("timer:cancel", `Cancel timer #${id}`);
      }
      nativeClearTimeout(handle);
      nativeClearInterval(handle);
    };
    globalThis.clearTimeout = clear;
    globalThis.clearInterval = clear;
    globalThis.queueMicrotask = (fn) => {
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
    function tracedThen(onFulfilled, onRejected) {
      const id = ++callbackId;
      reactions.set(id, `reaction #${id}`);
      emit(
        "promise:subscribe",
        `Register promise reaction #${id}`,
        "Registration does not reveal whether this promise is settled or the reaction is already runnable."
      );
      const wrap = (fn, rejected) => (value) => {
        reactions.delete(id);
        emit("promise:run", `Run ${rejected ? "rejection" : "fulfillment"} reaction #${id}`);
        if (typeof fn !== "function") {
          if (rejected) throw value;
          return value;
        }
        return fn(value);
      };
      return nativeThen.call(this, wrap(onFulfilled, false), wrap(onRejected, true));
    }
    Object.defineProperty(Promise.prototype, "then", {
      value: tracedThen,
      configurable: true,
      writable: true
    });
    const cache = {
      get(key) {
        const item = entries.get(String(key));
        emit(
          "cache:read",
          `${item ? "Found" : "Missing"} cache entry: ${key}`,
          item ? "Freshness is decided by your algorithm; get returns stored entries including expired ones." : void 0
        );
        return item ? structuredClone(item) : void 0;
      },
      set(key, value, ttl) {
        if (!Number.isFinite(ttl) || ttl < 0)
          throw new Error("TTL must be a finite non-negative number of logical milliseconds.");
        if (entries.size >= 50 && !entries.has(String(key)))
          throw new Error("Teaching cache is limited to 50 keys.");
        entries.set(String(key), { value: structuredClone(value), expiresAt: clockTime + ttl });
        emit("cache:write", `Store ${key}`, `Expires at logical t=${clockTime + ttl}ms.`);
      },
      delete(key) {
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
      }
    };
    const origin = {
      read(key, delay = 20) {
        const item = structuredClone(originData.get(String(key)) ?? { value: null, version: 0 });
        originReads++;
        emit(
          "origin:read",
          `Origin read #${originReads}: ${key} v${item.version}`,
          "Value is captured now and delivered after the wall-clock delay."
        );
        return new Promise(
          (resolve) => globalThis.setTimeout(() => {
            emit("origin:resolve", `Deliver ${key} v${item.version}`);
            resolve(item.value);
          }, delay)
        );
      },
      write(key, value) {
        const previous = originData.get(String(key));
        originData.set(String(key), {
          value: structuredClone(value),
          version: (previous?.version ?? 0) + 1
        });
        emit(
          "origin:write",
          `Origin ${key} \u2192 v${(previous?.version ?? 0) + 1}`,
          "No cache invalidation is implicit."
        );
      }
    };
    const clock = {
      now: () => clockTime,
      advance(ms) {
        if (!Number.isFinite(ms) || ms < 0)
          throw new Error("Advance by a finite non-negative number of logical milliseconds.");
        clockTime += ms;
        emit("clock", `Logical clock \u2192 ${clockTime}ms`, "This does not fast-forward native timers.");
      }
    };
    const sleep = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));
    host.onunhandledrejection = (event) => {
      event.preventDefault();
      fail(event.reason);
    };
    emit(
      "start",
      mode === "cache" ? "Start editable cache program" : "Start native worker execution",
      "Isolated worker; logical instrumentation is not a complete engine call stack or queue inspector."
    );
    try {
      const execute = new Function(
        "__trace",
        "cache",
        "origin",
        "clock",
        "sleep",
        `"use strict"; return (async () => {
${code}
})();`
      );
      const result = execute(trace, cache, origin, clock, sleep);
      nativeThen.call(
        result,
        () => {
          scriptDone = true;
          emit("script:end", "Script body completed");
        },
        fail
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
            "No tracked host timers or explicit microtasks remain. Unsettled promises alone do not keep work running."
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
})();
