import { formatValue as format, runtimeText } from "./format";
import * as ActualReact from "react";
import { createRoot, type Root } from "react-dom/client";
import type { RuntimeEvent } from "./types";

declare global {
  interface Window {
    __uthBoot: (
      runId: string,
      strict: boolean,
    ) => {
      React: typeof ActualReact;
      trace: ReturnType<typeof makeTrace>;
      mount: (component: ActualReact.ComponentType) => void;
    };
  }
}

function makeTrace(runId: string) {
  let sequence = 0;
  let frameId = 0;
  let line: number | null = null;
  let budget = 60000;
  let deadline = performance.now() + 500;
  const frames: { id: number; name: string; status: "running" | "suspended" }[] = [];
  const started = performance.now();
  function emit(kind: string, label: string, detail?: string) {
    if (sequence >= 1200) return;
    const event: RuntimeEvent = {
      sequence: sequence++,
      kind,
      label: runtimeText(label),
      // Host lifecycle observations do not have a trustworthy JavaScript source location.
      line:
        (kind.startsWith("react:") && kind !== "react:render") ||
        kind === "interaction" ||
        kind === "error"
          ? null
          : line,
      time: performance.now() - started,
      detail: detail === undefined ? undefined : runtimeText(detail),
      snapshot: {
        frames: frames.map((f) => ({ ...f, name: runtimeText(f.name) })),
        timers: [],
        microtasks: [],
        reactions: [],
        cache: [],
        clock: 0,
        origin: [],
      },
    };
    parent.postMessage({ channel: "uth-playground", runId, type: "event", event }, "*");
  }
  function renew() {
    budget = 60000;
    deadline = performance.now() + 500;
  }
  function guard(nextLine?: number) {
    if (nextLine) line = nextLine;
    if (--budget <= 0 || performance.now() > deadline)
      throw new Error("Synchronous execution budget exceeded. Keep loops and recursion bounded.");
  }
  return {
    emit,
    renew,
    guard,
    line(next: number, id: number | null) {
      line = next;
      const frame = frames.find((frame) => frame.id === id);
      if (frame?.status === "suspended") {
        renew();
        frame.status = "running";
        emit("resume", "Resume after rejected await");
      }
      guard();
    },
    enter(name: string, next: number, component: boolean) {
      if (!frames.some((f) => f.status === "running")) renew();
      line = next;
      guard();
      const id = ++frameId;
      frames.push({ id, name, status: "running" });
      emit(component ? "react:render" : "call", component ? `Render ${name}` : `Enter ${name}`);
      return id;
    },
    exit(id: number) {
      const i = frames.findIndex((f) => f.id === id);
      if (i >= 0) frames.splice(i, 1);
    },
    beforeAwait(value: unknown, next: number, id: number | null) {
      line = next;
      const f = frames.find((f) => f.id === id);
      if (f) f.status = "suspended";
      emit("await", "Suspend at await");
      return value;
    },
    afterAwait(value: unknown, next: number, id: number | null) {
      renew();
      line = next;
      const f = frames.find((f) => f.id === id);
      if (f) f.status = "running";
      emit("resume", "Resume after await");
      return value;
    },
    owner() {
      return frames.at(-1)?.name ?? "component";
    },
    error(error: unknown) {
      emit("error", format(error));
      parent.postMessage(
        { channel: "uth-playground", runId, type: "error", message: format(error) },
        "*",
      );
    },
  };
}

window.__uthBoot = (runId, strict) => {
  const trace = makeTrace(runId);
  let root: Root | null = null;
  function wrapEffect(effect: ActualReact.EffectCallback, kind: string) {
    const owner = trace.owner();
    return () => {
      trace.renew();
      trace.emit(
        `react:${kind}`,
        `${kind === "layout" ? "Layout" : "Passive"} effect setup · ${owner}`,
      );
      const cleanup = effect();
      return typeof cleanup === "function"
        ? () => {
            trace.renew();
            trace.emit("react:cleanup", `Effect cleanup · ${owner}`);
            cleanup();
          }
        : undefined;
    };
  }
  const React = {
    ...ActualReact,
    useEffect: (effect: ActualReact.EffectCallback, deps?: ActualReact.DependencyList) =>
      ActualReact.useEffect(wrapEffect(effect, "effect"), deps),
    useLayoutEffect: (effect: ActualReact.EffectCallback, deps?: ActualReact.DependencyList) =>
      ActualReact.useLayoutEffect(wrapEffect(effect, "layout"), deps),
  };
  for (const level of ["log", "info", "warn", "error", "debug"] as const)
    console[level] = (...values: unknown[]) =>
      trace.emit("console", values.map(format).join(" "), level);
  window.addEventListener("error", (event) => {
    event.preventDefault();
    trace.error(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
    trace.error(event.reason);
  });
  document.addEventListener(
    "click",
    (event) => {
      trace.renew();
      const target = (event.target as Element)?.closest("button,a,input");
      if (target?.tagName === "A") event.preventDefault();
      if (target)
        trace.emit(
          "interaction",
          `Click: ${(target.textContent || target.getAttribute("aria-label") || target.tagName).slice(0, 90)}`,
        );
    },
    true,
  );
  document.addEventListener("input", () => trace.renew(), true);
  window.addEventListener("message", (event) => {
    if (
      event.source !== parent ||
      event.data?.channel !== "uth-control" ||
      event.data?.runId !== runId
    )
      return;
    if (event.data.action === "unmount") {
      trace.renew();
      root?.unmount();
      root = null;
      trace.emit("react:unmount", "Root unmounted");
    }
  });
  const element = document.getElementById("root")!;
  new MutationObserver((records) =>
    trace.emit(
      "react:dom",
      `${records.length} DOM mutation record${records.length === 1 ? "" : "s"}`,
      element.textContent?.slice(0, 1000) || "Empty DOM",
    ),
  ).observe(element, { subtree: true, childList: true, attributes: true, characterData: true });
  trace.emit(
    "start",
    "React 19.3 development runtime ready",
    strict
      ? "Strict Mode enabled. Development probes can repeat render/effect work."
      : "Strict Mode disabled for this run. Actual render calls and commits are recorded separately.",
  );
  return {
    React,
    trace,
    mount(component) {
      if (typeof component !== "function" && (typeof component !== "object" || component === null))
        throw new Error("Export a default React component, or define a function named App.");
      root = createRoot(element, {
        onUncaughtError: (error) => trace.error(error),
        onCaughtError: (error) =>
          trace.emit("react:caught", "Error boundary handled a render failure", format(error)),
        onRecoverableError: (error) =>
          trace.emit("react:recoverable", "Recoverable React error", format(error)),
      });
      const app = ActualReact.createElement(component);
      const profiled = ActualReact.createElement(
        ActualReact.Profiler,
        {
          id: "Playground",
          onRender: (_id, phase, actualDuration, _base, _start, commitTime) =>
            trace.emit(
              "react:commit",
              `${phase} commit`,
              `${actualDuration.toFixed(2)}ms render work · commit timestamp ${commitTime.toFixed(2)}ms. Instrumentation and development overhead apply.`,
            ),
        },
        app,
      );
      root.render(
        strict ? ActualReact.createElement(ActualReact.StrictMode, null, profiled) : profiled,
      );
      parent.postMessage({ channel: "uth-playground", runId, type: "ready" }, "*");
    },
  };
};
