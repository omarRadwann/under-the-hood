"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Database,
  Download,
  FlaskConical,
  Info,
  Pause,
  Play,
  RotateCcw,
  Square,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { presets } from "@/playground/presets";
import {
  MAX_EVENTS,
  MAX_RUN_MS,
  MAX_SOURCE_LENGTH,
  type PlaygroundMode,
  type RuntimeEvent,
  type RuntimePacket,
  type TraceSnapshot,
} from "@/playground/types";
import { reactSandboxDocument } from "@/playground/sandbox";
import { createWorkerSandbox } from "@/playground/worker-sandbox";
import { SourceEditor } from "./source-editor";
import { isRuntimeEvent } from "@/playground/validate";

const emptySnapshot: TraceSnapshot = {
  frames: [],
  timers: [],
  microtasks: [],
  reactions: [],
  cache: [],
  clock: 0,
  origin: [],
};
const modes: { id: PlaygroundMode; label: string; detail: string }[] = [
  { id: "event-loop", label: "JavaScript runtime", detail: "Native callbacks & continuations" },
  { id: "react", label: "React rendering", detail: "A real mounted React tree" },
  { id: "cache", label: "Caching algorithms", detail: "Editable policy, observable store" },
];
type Status = "idle" | "compiling" | "running" | "ready" | "complete" | "stopped" | "error";

export default function Playground() {
  const params = useSearchParams();
  const requestedMode = params.get("mode");
  const mode: PlaygroundMode = modes.some((m) => m.id === requestedMode)
    ? (requestedMode as PlaygroundMode)
    : "event-loop";
  const preset =
    presets.find((p) => p.mode === mode && p.id === params.get("preset")) ??
    presets.find((p) => p.mode === mode)!;
  const draftKey = `uth.playground.v1.${mode}.${preset.id}`;
  const [source, setSource] = useState(preset.source);
  const [loadedKey, setLoadedKey] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [executedSource, setExecutedSource] = useState<string | null>(null);
  const [frameDocument, setFrameDocument] = useState<string | null>(null);
  const [strict, setStrict] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [plainEditor, setPlainEditor] = useState(false);
  const [executedStrict, setExecutedStrict] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [filter, setFilter] = useState("meaningful");
  const [copied, setCopied] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);
  const worker = useRef<ReturnType<typeof createWorkerSandbox> | null>(null);
  const activeRun = useRef<string | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<RuntimeEvent[]>([]);
  const raf = useRef<number | null>(null);
  const seenCount = useRef(0);
  const flush = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    const batch = pending.current.splice(0);
    if (batch.length) setEvents((current) => [...current, ...batch].slice(0, MAX_EVENTS));
  }, []);
  const destroy = useCallback(() => {
    activeRun.current = null;
    worker.current?.terminate();
    worker.current = null;
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);
  const stop = useCallback(() => {
    flush();
    destroy();
    setFrameDocument(null);
    setStatus("stopped");
    setReplaying(false);
  }, [destroy, flush]);
  const accept = useCallback(
    (packet: RuntimePacket) => {
      if (!packet || packet.channel !== "uth-playground" || packet.runId !== activeRun.current)
        return;
      if (
        packet.type === "event" &&
        isRuntimeEvent(packet.event) &&
        seenCount.current < MAX_EVENTS
      ) {
        pending.current.push(packet.event);
        seenCount.current++;
        if (raf.current === null) raf.current = requestAnimationFrame(flush);
      }
      if (packet.type === "done" || packet.type === "error") {
        flush();
        if (watchdog.current) clearTimeout(watchdog.current);
        if (packet.type === "error") {
          setError(String(packet.message ?? "Runtime error").slice(0, 5000));
          setStatus("error");
        } else setStatus("complete");
        worker.current?.terminate();
        worker.current = null;
      }
      if (packet.type === "ready") {
        if (watchdog.current) clearTimeout(watchdog.current);
        setStatus("ready");
      }
    },
    [flush],
  );
  useEffect(() => {
    const onMessage = (event: MessageEvent<RuntimePacket>) => {
      if (event.source === iframe.current?.contentWindow) accept(event.data);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [accept]);
  useEffect(() => {
    destroy();
    setFrameDocument(null);
    setEvents([]);
    pending.current = [];
    seenCount.current = 0;
    setError(null);
    setStatus("idle");
    setExecutedSource(null);
    setCursor(null);
    setReplaying(false);
    try {
      const saved = localStorage.getItem(draftKey);
      setSource(saved !== null && saved.length <= MAX_SOURCE_LENGTH ? saved : preset.source);
    } catch {
      setSource(preset.source);
      setStorageError(true);
    }
    setLoadedKey(draftKey);
  }, [draftKey, destroy, preset.source]);
  useEffect(() => {
    if (loadedKey !== draftKey) return;
    // Sources are bounded to 40KB. Save immediately so navigation cannot cancel a pending draft.
    try {
      localStorage.setItem(draftKey, source);
    } catch {
      setStorageError(true);
    }
  }, [source, loadedKey, draftKey]);
  useEffect(
    () => () => {
      destroy();
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [destroy],
  );

  const run = useCallback(async () => {
    if (loadedKey !== draftKey) return;
    destroy();
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    pending.current = [];
    seenCount.current = 0;
    const runId = crypto.randomUUID();
    activeRun.current = runId;
    setFrameDocument(null);
    setEvents([]);
    setCursor(null);
    setReplaying(false);
    setError(null);
    setExecutedSource(null);
    setStatus("compiling");
    try {
      const { compileExample } = await import("@/playground/compiler");
      const code = compileExample(source, mode);
      if (activeRun.current !== runId) return;
      setExecutedSource(source);
      setExecutedStrict(strict);
      setStatus("running");
      watchdog.current = setTimeout(() => {
        if (activeRun.current !== runId) return;
        flush();
        destroy();
        setFrameDocument(null);
        setError(
          `Run exceeded ${MAX_RUN_MS / 1000}s. Its worker/document was stopped. Reduce delays or bound the work.`,
        );
        setStatus("error");
      }, MAX_RUN_MS);
      if (mode === "react")
        setFrameDocument(reactSandboxDocument(code, runId, strict, window.location.origin));
      else {
        const runtime = createWorkerSandbox(accept, (message) => {
          if (activeRun.current !== runId) return;
          setError(message);
          setStatus("error");
          destroy();
        });
        worker.current = runtime;
        runtime.postMessage({ runId, code, mode });
      }
    } catch (caught) {
      if (activeRun.current !== runId) return;
      setError(caught instanceof Error ? caught.message : String(caught));
      setStatus("error");
      destroy();
    }
  }, [source, mode, strict, accept, destroy, flush, loadedKey, draftKey]);
  useEffect(() => {
    if (!autoRun || loadedKey !== draftKey) return;
    const timer = setTimeout(() => {
      void run();
    }, 750);
    return () => clearTimeout(timer);
  }, [source, strict, autoRun, loadedKey, draftKey, run]);
  useEffect(() => {
    if (!replaying || !events.length) return;
    const next = Math.min(events.length - 1, (cursor ?? 0) + 1);
    const timer = setTimeout(() => {
      setCursor(next);
      if (next === events.length - 1) setReplaying(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [replaying, cursor, events.length]);
  const index = cursor ?? Math.max(0, events.length - 1);
  const event = events[index];
  const snapshot = event?.snapshot ?? emptySnapshot;
  const visibleEvents = events.slice(0, index + 1);
  const logs = visibleEvents.filter((e) => e.kind === "console");
  const selectedMode = modes.find((m) => m.id === mode)!;
  const changed =
    executedSource !== null &&
    (source !== executedSource || (mode === "react" && strict !== executedStrict));
  function navigate(nextMode: PlaygroundMode, nextPreset?: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    if (nextPreset) url.searchParams.set("preset", nextPreset);
    else url.searchParams.delete("preset");
    window.history.replaceState(null, "", url);
  }
  function step(delta: number) {
    setReplaying(false);
    setCursor(Math.max(0, Math.min(events.length - 1, index + delta)));
  }
  function downloadTrace() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            mode,
            preset: preset.id,
            strictMode: mode === "react" ? executedStrict : undefined,
            source: executedSource,
            events,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `under-the-hood-${mode}-trace.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }
  const displayed = events
    .map((e, i) => ({ ...e, index: i }))
    .filter(
      (e) =>
        filter === "all" || (filter === "console" ? e.kind === "console" : e.kind !== "statement"),
    )
    .slice(-240);
  return (
    <section className="playground">
      <div className="playground-intro">
        <div>
          <span className="eyebrow accent">THE EXECUTION WORKBENCH</span>
          <h1>
            Change the code.
            <br />
            <span>Inspect the consequence.</span>
          </h1>
          <p>
            Run real examples. Follow the evidence. Build a mental model that survives a code
            review.
          </p>
        </div>
        <span className="playground-version">
          <span className="live-dot" />
          Local execution · no external packages in examples
        </span>
      </div>
      <div className="playground-modes" role="group" aria-label="Playground mode">
        {modes.map((m) => (
          <button
            key={m.id}
            aria-pressed={m.id === mode}
            className={m.id === mode ? "selected" : ""}
            onClick={() => navigate(m.id)}
          >
            <span>{m.id === "react" ? "⚛" : m.id === "cache" ? "▤" : "JS"}</span>
            <div>
              <strong>{m.label}</strong>
              <small>{m.detail}</small>
            </div>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="playground-toolbar">
        <label>
          Experiment
          <select
            aria-label="Choose an experiment"
            value={preset.id}
            onChange={(e) => navigate(mode, e.target.value)}
          >
            {mode === "event-loop" ? (
              <>
                {[false, true].map((course) => (
                  <optgroup
                    key={String(course)}
                    label={course ? "JavaScript course chapters" : "Runtime investigations"}
                  >
                    {presets
                      .filter((p) => p.mode === mode && p.id.startsWith("js-") === course)
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </>
            ) : (
              presets
                .filter((p) => p.mode === mode)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))
            )}
          </select>
        </label>
        <div className="playground-toolbar-options">
          {mode === "react" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={strict}
                onChange={(e) => setStrict(e.target.checked)}
              />
              Strict Mode
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
            />
            Run on edit
          </label>
          <button
            className="button small primary"
            onClick={() => void run()}
            disabled={status === "compiling" || loadedKey !== draftKey}
          >
            <Play size={14} />
            {status === "compiling" ? "Compiling…" : "Run code"}
            <kbd>Ctrl ↵</kbd>
          </button>
          <button
            className="icon-button"
            onClick={stop}
            aria-label="Stop execution"
            disabled={!["running", "ready", "compiling"].includes(status)}
          >
            <Square size={15} />
          </button>
        </div>
      </div>
      <div className="experiment-description">
        <strong>{preset.name}</strong>
        <p>{preset.description}</p>
        <span>{preset.concept}</span>
      </div>
      <div className="playground-grid">
        <div className="playground-source">
          <div className="editor-heading">
            <span>
              <Code2 size={15} />
              {mode === "react" ? "App.tsx" : mode === "cache" ? "cache-policy.ts" : "runtime.ts"}
            </span>
            <div>
              <span className="draft-label">
                {storageError ? "Session draft" : "Draft saved locally"}
              </span>
              <button
                className="icon-button"
                aria-label="Copy playground source"
                onClick={() => void copy()}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                className="icon-button"
                aria-label="Reset starter code"
                onClick={() => {
                  setSource(preset.source);
                  setError(null);
                }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          {plainEditor ? (
            <textarea
              className="plain-source-editor"
              aria-label="Playground code editor"
              value={source}
              onChange={(e) => setSource(e.target.value.slice(0, MAX_SOURCE_LENGTH))}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void run();
                }
              }}
              spellCheck={false}
            />
          ) : (
            <SourceEditor
              key={draftKey}
              value={source}
              onChange={(value) => setSource(value.slice(0, MAX_SOURCE_LENGTH))}
              onRun={() => void run()}
              activeLine={!changed ? (event?.line ?? null) : null}
            />
          )}
          <div className="editor-footer">
            <span>
              {source.split("\n").length} lines · TypeScript /{" "}
              {mode === "react" ? "TSX" : "JavaScript"}
            </span>
            <button onClick={() => setPlainEditor((v) => !v)}>
              {plainEditor ? "Use syntax editor" : "Use plain text editor"}
            </button>
          </div>
          <div className="execution-status" role="status">
            <span className={`status-dot status-${status}`} />
            <strong>
              {status === "idle"
                ? "Ready to run"
                : status === "ready"
                  ? "React mounted · interact with the preview"
                  : status === "complete"
                    ? "Execution settled"
                    : status === "error"
                      ? "Run needs attention"
                      : status === "stopped"
                        ? "Runtime stopped"
                        : status === "compiling"
                          ? "Loading compiler / compiling source"
                          : "Executing edited source"}
            </strong>
            {changed && <span className="source-changed">Source changed · run again</span>}
          </div>
          {error && (
            <div className="playground-error" role="alert">
              <TriangleAlert size={18} />
              <div>
                <strong>Execution error</strong>
                <pre>{error}</pre>
                <p>
                  The editor remains available. Fix the source or reset the starter, then run again.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="playground-output">
          {mode === "react" ? (
            <>
              <div className="output-heading">
                <span className="eyebrow">LIVE REACT PREVIEW</span>
                <button
                  className="text-link"
                  disabled={!frameDocument}
                  onClick={() =>
                    iframe.current?.contentWindow?.postMessage(
                      { channel: "uth-control", runId: activeRun.current, action: "unmount" },
                      "*",
                    )
                  }
                >
                  Unmount root
                </button>
              </div>
              <div className="react-sandbox">
                {frameDocument ? (
                  <iframe
                    ref={iframe}
                    title="Live React playground preview"
                    sandbox="allow-scripts"
                    srcDoc={frameDocument}
                  />
                ) : (
                  <div className="playground-empty">
                    <FlaskConical size={28} />
                    <strong>Mount your first experiment.</strong>
                    <p>Run the code, then use the real controls rendered here.</p>
                  </div>
                )}
              </div>
              <ReactObservations events={visibleEvents} />
            </>
          ) : mode === "cache" ? (
            <CacheObservations snapshot={snapshot} events={visibleEvents} />
          ) : (
            <RuntimeObservations snapshot={snapshot} />
          )}
          <div className="playground-console">
            <div className="output-heading">
              <span>
                <Terminal size={14} />
                CONSOLE
              </span>
              <span>{logs.length} messages</span>
            </div>
            <div className="playground-console-lines" aria-label="Playground console output">
              {logs.length ? (
                logs.map((log) => (
                  <p
                    className={
                      log.detail === "error" ? "log-error" : log.detail === "warn" ? "log-warn" : ""
                    }
                    key={log.sequence}
                  >
                    <span>{log.time.toFixed(1)}</span>
                    <code>{log.label}</code>
                  </p>
                ))
              ) : (
                <p className="console-placeholder">Your program’s console output appears here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="trace-workbench">
        <div className="trace-toolbar">
          <div>
            <span className="eyebrow accent">RECORDED EXECUTION</span>
            <h2>
              {cursor === null ? "Follow the live evidence." : "Replay an observed snapshot."}
            </h2>
          </div>
          <div>
            <button className="button small" disabled={!events.length} onClick={downloadTrace}>
              <Download size={14} />
              Export trace
            </button>
            <button
              className="button small"
              disabled={!events.length}
              onClick={() => {
                setCursor(null);
                setReplaying(false);
              }}
            >
              Follow latest
            </button>
          </div>
        </div>
        <div className="trace-scrubber">
          <button
            className="icon-button"
            disabled={!events.length || index === 0}
            aria-label="Previous recorded event"
            onClick={() => step(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className="button small"
            disabled={!events.length}
            onClick={() => {
              if (cursor === null || index === events.length - 1) setCursor(0);
              setReplaying((v) => !v);
            }}
          >
            {replaying ? <Pause size={13} /> : <Play size={13} />}Replay
          </button>
          <input
            type="range"
            aria-label="Recorded event position"
            min="0"
            max={Math.max(0, events.length - 1)}
            value={events.length ? index : 0}
            disabled={!events.length}
            onChange={(e) => {
              setReplaying(false);
              setCursor(Number(e.target.value));
            }}
          />
          <button
            className="icon-button"
            disabled={!events.length || index === events.length - 1}
            aria-label="Next recorded event"
            onClick={() => step(1)}
          >
            <ArrowRight size={16} />
          </button>
          <span className="mono">
            {events.length ? index + 1 : 0} / {events.length}
          </span>
        </div>
        <p className="replay-note">
          Replay changes the displayed recording. It does not pause or rewind the running JavaScript
          engine{mode === "react" ? " or the live React preview" : ""}.
        </p>
        {event && (
          <div className="selected-event">
            <span className={`event-kind kind-${event.kind.split(":")[0]}`}>{event.kind}</span>
            <div>
              <strong>{event.label}</strong>
              {event.detail && <p>{event.detail}</p>}
            </div>
            <span className="mono">
              {event.line ? `L${event.line} · ` : ""}
              {event.time.toFixed(2)}ms
            </span>
          </div>
        )}
        <div className="trace-filter">
          <span>
            {events.length} captured events · showing at most the last 240 matching events
          </span>
          <label>
            Show
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter execution events"
            >
              <option value="meaningful">Meaningful events</option>
              <option value="all">All, including statements</option>
              <option value="console">Console only</option>
            </select>
          </label>
        </div>
        <div className="event-list" aria-label="Execution timeline">
          {displayed.length ? (
            displayed.map((e) => (
              <button
                key={e.sequence}
                aria-pressed={e.index === index}
                className={e.index === index ? "selected" : ""}
                onClick={() => {
                  setCursor(e.index);
                  setReplaying(false);
                }}
              >
                <span className="event-sequence">{String(e.index + 1).padStart(3, "0")}</span>
                <span className={`event-kind kind-${e.kind.split(":")[0]}`}>{e.kind}</span>
                <span className="event-label">{e.label}</span>
                <span className="event-line">{e.line ? `L${e.line}` : "—"}</span>
                <time>{e.time.toFixed(1)}ms</time>
              </button>
            ))
          ) : (
            <div className="empty-trace">
              Run the example to capture execution. Edit a value or an algorithm and compare the
              result.
            </div>
          )}
        </div>
      </div>
      <details className="playground-contract">
        <summary>
          <Info size={16} />
          Execution contract & supported APIs
        </summary>
        <div>
          <p>
            <strong>{selectedMode.label}.</strong>{" "}
            {mode === "react"
              ? "Runs locally bundled React 19.3 development code in an opaque-origin iframe. Import from react or use React. Export a default component or define App. Strict Mode is optional. Named function components, Profiler commits, effects, and DOM mutations are instrumented; this is not a Fiber inspector or performance benchmark."
              : mode === "cache"
                ? "Runs your algorithm in a fresh worker. cache.get(key) returns an entry, even if expired; your code owns the freshness decision. cache.set(key, value, ttlMs), cache.delete(key), cache.clear(), origin.read(key, delayMs), origin.write(key, value), clock.now(), clock.advance(ms), and sleep(ms) are available. The logical clock does not advance native timers."
                : "Runs native worker JavaScript. console, Promise, async/await, setTimeout, setInterval, clearTimeout, clearInterval, and queueMicrotask work. DOM, requestAnimationFrame, Node APIs, arbitrary imports, and network access are unavailable. Worker scheduling is distinct from browser rendering and Node phases."}
          </p>
          <p>
            Top-level await is supported in worker modes. Examples are limited to{" "}
            {MAX_SOURCE_LENGTH.toLocaleString()} characters, {MAX_EVENTS.toLocaleString()} trace
            events, and {MAX_RUN_MS / 1000}s per worker run or React startup. Instrumented
            loops/recursion have a budget. Instrumentation adds overhead and does not expose every
            engine-internal job. Registered reactions may never become runnable. A new run creates a
            fresh environment; drafts are local to this browser. Generators execute natively;
            suspended generator frames are omitted from the logical call-lifetime panel. Function
            entries mark body execution; parameter initialization precedes that marker.
          </p>
          <p>
            React remains interactive after mounting. Stop removes the runtime; Unmount root asks
            React to perform its lifecycle cleanup. Standalone instrumentation does not implement a
            general security boundary for hostile code or make timing measurements representative of
            production.
          </p>
        </div>
      </details>
    </section>
  );
}
function RuntimeObservations({ snapshot }: { snapshot: TraceSnapshot }) {
  return (
    <div className="runtime-observations">
      <div className="output-heading">
        <span className="eyebrow">OBSERVED RUNTIME</span>
        <span>logical call lifetimes</span>
      </div>
      <ObservationBox
        title="Instrumented calls"
        items={snapshot.frames.map((f) => `${f.name} · ${f.status}`)}
        empty="No instrumented function is active"
        color="yellow"
      />
      <div className="observation-grid">
        <ObservationBox
          title="Explicit microtasks"
          items={snapshot.microtasks}
          empty="None scheduled through queueMicrotask"
          color="purple"
        />
        <ObservationBox
          title="Host timers"
          items={snapshot.timers.map((t) => `${t.label} · ${t.delay}ms`)}
          empty="No tracked timers"
          color="blue"
        />
      </div>
      <ObservationBox
        title="Registered promise reactions"
        items={snapshot.reactions}
        empty="No uninvoked tracked reactions"
        color="green"
      />
      <p className="observation-note">
        Reaction registration is observable; settlement and the browser’s private queue are not
        fully exposed. These are logical lifetimes, not a complete native stack.
      </p>
    </div>
  );
}
function ObservationBox({
  title,
  items,
  empty,
  color,
}: {
  title: string;
  items: string[];
  empty: string;
  color: string;
}) {
  return (
    <div className={`observation-box ${color}`}>
      <div>
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      <ul>
        {items.length ? (
          items.slice(-9).map((item, i) => <li key={i}>{item}</li>)
        ) : (
          <li className="empty">{empty}</li>
        )}
      </ul>
      {items.length > 9 && (
        <small>{items.length - 9} earlier entries omitted from this panel</small>
      )}
    </div>
  );
}
function ReactObservations({ events }: { events: RuntimeEvent[] }) {
  const renders = events.filter((e) => e.kind === "react:render");
  const commits = events.filter((e) => e.kind === "react:commit");
  const effects = events.filter((e) => ["react:effect", "react:layout"].includes(e.kind));
  const counts = new Map<string, number>();
  for (const e of renders)
    counts.set(
      e.label.replace(/^Render /, ""),
      (counts.get(e.label.replace(/^Render /, "")) ?? 0) + 1,
    );
  return (
    <div className="react-observations">
      <div className="observed-metrics">
        <div>
          <strong>{renders.length}</strong>
          <span>render entries</span>
        </div>
        <div>
          <strong>{commits.length}</strong>
          <span>Profiler commits</span>
        </div>
        <div>
          <strong>{effects.length}</strong>
          <span>effect setups</span>
        </div>
      </div>
      <div className="render-counts">
        {counts.size ? (
          [...counts].map(([name, count]) => (
            <div key={name}>
              <span>{name}</span>
              <span className="render-bar">
                <i style={{ width: `${(count / Math.max(...counts.values())) * 100}%` }} />
              </span>
              <b>{count}</b>
            </div>
          ))
        ) : (
          <p>Named component entries will appear after the first render.</p>
        )}
      </div>
      <p className="observation-note">
        Counts summarize instrumented named function components. Class renders and library internals
        are not counted. The live preview remains current while the recording is scrubbed.
      </p>
    </div>
  );
}
function CacheObservations({
  snapshot,
  events,
}: {
  snapshot: TraceSnapshot;
  events: RuntimeEvent[];
}) {
  return (
    <div className="cache-observations">
      <div className="output-heading">
        <span className="eyebrow">OBSERVED STORE & ORIGIN</span>
        <span>logical t = {snapshot.clock}ms</span>
      </div>
      <div className="observed-metrics">
        <div>
          <strong>{events.filter((e) => e.kind === "cache:read").length}</strong>
          <span>cache reads</span>
        </div>
        <div>
          <strong>{events.filter((e) => e.kind === "origin:read").length}</strong>
          <span>origin requests</span>
        </div>
        <div>
          <strong>{snapshot.cache.length}</strong>
          <span>stored entries</span>
        </div>
      </div>
      <div className="cache-entry-list">
        <h3>
          <Database size={15} />
          Cache entries
        </h3>
        {snapshot.cache.length ? (
          snapshot.cache.map((e) => (
            <div className={`cache-entry ${e.fresh ? "fresh" : "expired"}`} key={e.key}>
              <div>
                <strong>{e.key}</strong>
                <span>{e.fresh ? "TTL fresh" : "Expired"}</span>
              </div>
              <code>{e.value}</code>
              <small>expires at logical {e.expiresAt}ms</small>
            </div>
          ))
        ) : (
          <p className="observation-note">Cache is empty at this recorded event.</p>
        )}
        <h3>Authoritative origin</h3>
        {snapshot.origin.map((e) => (
          <div className="origin-entry" key={e.key}>
            <strong>
              {e.key}
              <span>v{e.version}</span>
            </strong>
            <code>{e.value}</code>
          </div>
        ))}
      </div>
      <p className="observation-note">
        An entry can have a fresh TTL and still differ from the origin. The panel shows the store
        produced by your executed algorithm, not a built-in Next.js cache.
      </p>
    </div>
  );
}
