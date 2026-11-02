"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FlaskConical,
  Play,
  RotateCcw,
  Square,
  TriangleAlert,
} from "lucide-react";
import { exercises, reviewDomains } from "@/content/training";
import { getLesson, getTrackLessons, lessons } from "@/content";
import { tracks } from "@/lib/types";
import { updateStoredValue } from "@/lib/local-state";
import {
  CHECK_MARKER,
  parseCheck,
  parseTraining,
  sourceFingerprint,
  trainingHarness,
  type CheckResult,
  type TrainingRecord,
} from "@/lib/training";
import { createWorkerSandbox } from "@/playground/worker-sandbox";
import { isRuntimeEvent } from "@/playground/validate";
import { MAX_EVENTS, MAX_RUN_MS, MAX_SOURCE_LENGTH, type RuntimeEvent } from "@/playground/types";
import { SourceEditor } from "./source-editor";
import { CodeBlock } from "./code-block";

const recordKey = "uth.training.records.v1";
type Status = "idle" | "compiling" | "running" | "complete" | "error" | "stopped";
export default function TrainingStudio() {
  const params = useSearchParams();
  const exercise = exercises.find((item) => item.id === params.get("exercise")) ?? exercises[0];
  const [view, setView] = useState<"bench" | "map">("bench");
  const [domain, setDomain] = useState("All");
  const [source, setSource] = useState(exercise.starter);
  const [prediction, setPrediction] = useState("");
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const [loadedId, setLoadedId] = useState("");
  const [plain, setPlain] = useState(false);
  const [records, setRecords] = useState<Record<string, TrainingRecord>>({});
  const recordState = useRef(records);
  const unpersistedRecords = useRef(false);
  const [storageError, setStorageError] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [executed, setExecuted] = useState<string | null>(null);
  const runtime = useRef<ReturnType<typeof createWorkerSandbox> | null>(null);
  const active = useRef<string | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRuntime = useCallback(() => {
    active.current = null;
    runtime.current?.terminate();
    runtime.current = null;
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = null;
  }, []);
  useEffect(() => {
    function receive() {
      if (unpersistedRecords.current) return;
      try {
        const latest = parseTraining(localStorage.getItem(recordKey), exercises);
        recordState.current = latest;
        setRecords(latest);
      } catch {
        setStorageError(true);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === recordKey || event.key === null) receive();
    }
    receive();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    stopRuntime();
    setStatus("idle");
    setError("");
    setResults([]);
    setEvents([]);
    setExecuted(null);
    setSelectedEvent(null);
    let draft;
    try {
      draft = JSON.parse(localStorage.getItem("uth.training.draft.v1." + exercise.id) ?? "null");
    } catch {
      /* Malformed drafts use the original challenge. */
    }
    setSource(
      typeof draft?.source === "string" && draft.source.length <= MAX_SOURCE_LENGTH
        ? draft.source
        : exercise.starter,
    );
    setPrediction(typeof draft?.prediction === "string" ? draft.prediction.slice(0, 2000) : "");
    setRevealed(draft?.revealed === true);
    setLoadedId(exercise.id);
  }, [exercise.id, exercise.starter, stopRuntime]);
  useEffect(() => {
    if (loadedId !== exercise.id) return;
    try {
      localStorage.setItem(
        "uth.training.draft.v1." + exercise.id,
        JSON.stringify({ source, prediction, revealed }),
      );
    } catch {
      setStorageError(true);
    }
  }, [source, prediction, revealed, loadedId, exercise.id]);
  useEffect(() => () => stopRuntime(), [stopRuntime]);
  const run = useCallback(async () => {
    if (loadedId !== exercise.id) return;
    stopRuntime();
    const runId = crypto.randomUUID();
    active.current = runId;
    setStatus("compiling");
    setError("");
    setResults([]);
    setEvents([]);
    setSelectedEvent(null);
    setExecuted(source);
    const found = new Map<number, CheckResult>();
    let eventCount = 0;
    try {
      const { compileExample } = await import("@/playground/compiler");
      const code = compileExample(source, "event-loop") + trainingHarness(exercise);
      if (active.current !== runId) return;
      setStatus("running");
      watchdog.current = setTimeout(() => {
        if (active.current !== runId) return;
        stopRuntime();
        setStatus("error");
        setError("Execution exceeded 3.5 seconds. Bound the work or fix an unresolved operation.");
      }, MAX_RUN_MS);
      const worker = createWorkerSandbox(
        (packet) => {
          if (
            !packet ||
            active.current !== runId ||
            packet.channel !== "uth-playground" ||
            packet.runId !== runId
          )
            return;
          if (
            packet.type === "event" &&
            isRuntimeEvent(packet.event) &&
            eventCount++ < MAX_EVENTS
          ) {
            const event = packet.event;
            const result =
              event.kind === "console" ? parseCheck(event.label, exercise.checks.length) : null;
            if (result && !found.has(result.index)) {
              found.set(result.index, result);
              setResults([...found.values()].sort((a, b) => a.index - b.index));
            } else if (!event.label.startsWith(CHECK_MARKER))
              setEvents((previous) => [...previous, event].slice(-MAX_EVENTS));
          }
          if (packet.type === "error") {
            stopRuntime();
            setStatus("error");
            setError(String(packet.message ?? "Execution failed").slice(0, 3000));
          }
          if (packet.type === "done") {
            stopRuntime();
            if (found.size !== exercise.checks.length) {
              setStatus("error");
              setError(
                "The program ended before every check reported. Check missing functions and unfinished work.",
              );
              return;
            }
            setStatus("complete");
            const passed = [...found.values()].filter((result) => result.passed).length;
            let storage: Storage | null = null;
            try {
              storage = localStorage;
            } catch {
              /* Keep results in the session. */
            }
            const saved = updateStoredValue({
              storage,
              key: recordKey,
              parse: (raw) => parseTraining(raw, exercises),
              fallback: recordState.current,
              preferMemory: unpersistedRecords.current,
              change: (previous) => ({
                ...previous,
                [exercise.id]: {
                  runs: Math.min((previous[exercise.id]?.runs ?? 0) + 1, 1_000_000),
                  best: Math.max(previous[exercise.id]?.best ?? 0, passed),
                  total: exercise.checks.length,
                  fingerprint: sourceFingerprint(source),
                  passed,
                  solutionViewed:
                    revealedRef.current || previous[exercise.id]?.solutionViewed === true,
                },
              }),
            });
            unpersistedRecords.current = saved.storageError;
            recordState.current = saved.value;
            setRecords(saved.value);
            if (saved.storageError) setStorageError(true);
          }
        },
        (message) => {
          if (active.current !== runId) return;
          stopRuntime();
          setStatus("error");
          setError(message);
        },
      );
      runtime.current = worker;
      worker.postMessage({ runId, code, mode: "event-loop" });
    } catch (caught) {
      if (active.current !== runId) return;
      stopRuntime();
      setStatus("error");
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }, [exercise, loadedId, source, revealed, stopRuntime]);
  const passed = results.filter((result) => result.passed).length;
  const busy = status === "running" || status === "compiling";
  const changed = executed !== null && source !== executed;
  const evidence = events.filter((event) =>
    [
      "call",
      "return",
      "await",
      "resume",
      "console",
      "timer:register",
      "timer:start",
      "promise:run",
      "error",
      "done",
    ].includes(event.kind),
  );
  const selected = events.find((event) => event.sequence === selectedEvent) ?? events.at(-1);
  const line =
    !changed && selected?.line && selected.line <= source.split("\n").length ? selected.line : null;
  const solved = Object.values(records).filter((record) => record.best === record.total).length;
  const visible = exercises.filter((item) => domain === "All" || item.domain === domain);
  function choose(id: string) {
    if (id === exercise.id) return;
    stopRuntime();
    const url = new URL(window.location.href);
    url.searchParams.set("exercise", id);
    window.history.replaceState(null, "", url);
  }
  return (
    <div className="training-studio">
      <header className="training-hero">
        <div>
          <span className="eyebrow accent">THE PROOF IS IN THE BEHAVIOR</span>
          <h1>
            Turn knowledge
            <br />
            into <em>engineering judgment.</em>
          </h1>
          <p>
            Predict the failure. Repair the implementation. Inspect what actually happened. Then
            explain the boundary your evidence establishes.
          </p>
        </div>
        <div className="training-metrics">
          <div>
            <strong>{exercises.length}</strong>
            <span>repair exercises</span>
          </div>
          <div>
            <strong>{exercises.reduce((sum, item) => sum + item.checks.length, 0)}</strong>
            <span>behavioral checks</span>
          </div>
          <div>
            <strong>
              {solved}
              <small> / {exercises.length}</small>
            </strong>
            <span>passed all checks at least once</span>
          </div>
        </div>
      </header>
      {storageError && (
        <p className="storage-warning" role="status">
          Browser storage is unavailable. Keep a copy of your source; this session can still run
          exercises.
        </p>
      )}
      <div className="training-tabs" role="group" aria-label="Training views">
        <button aria-pressed={view === "bench"} onClick={() => setView("bench")}>
          Practice bench <span>{exercises.length}</span>
        </button>
        <button aria-pressed={view === "map"} onClick={() => setView("map")}>
          Competency map <span>{lessons.length} lessons</span>
        </button>
      </div>
      {view === "map" ? (
        <div className="competency-map">
          <div className="training-map-intro">
            <span className="eyebrow">CONNECT THE ENTIRE CURRICULUM</span>
            <h2>Read → predict → build → defend.</h2>
            <p>
              Each domain has a contract, evidence to produce, and a failure scenario to
              investigate. All {lessons.length} lessons appear below. Coverage is explicit; a passed
              exercise establishes its listed checks, while design reviews require your own system
              evidence.
            </p>
          </div>
          {reviewDomains.map((domain) => {
            const track = tracks.find((track) => track.id === domain.track)!;
            const items = getTrackLessons(track.id);
            return (
              <article
                className="competency-card"
                key={track.id}
                style={{ "--domain-color": track.color } as React.CSSProperties}
              >
                <div className="competency-heading">
                  <span>{track.symbol}</span>
                  <h3>{track.name}</h3>
                  <small>{items.length} lessons</small>
                </div>
                <h4>Protect this invariant</h4>
                <p>{domain.invariant}</p>
                <h4>Produce evidence</h4>
                <p>{domain.evidence}</p>
                <div className="competency-failure">
                  <strong>Stress the boundary</strong>
                  <p>{domain.failure}</p>
                </div>
                <details>
                  <summary>Explore all {items.length} lessons</summary>
                  <ul>
                    {items.map((item) => (
                      <li key={item.slug}>
                        <Link href={"/learn/" + item.slug}>
                          {item.title}
                          <ArrowRight size={13} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="training-method" aria-label="Practice workflow">
            <span>
              01 <strong>Predict</strong>
            </span>
            <ArrowRight size={15} />
            <span>
              02 <strong>Implement</strong>
            </span>
            <ArrowRight size={15} />
            <span>
              03 <strong>Test & inspect</strong>
            </span>
            <ArrowRight size={15} />
            <span>
              04 <strong>Explain</strong>
            </span>
          </div>
          <div className="training-layout">
            <aside className="exercise-catalog" aria-label="Exercise catalogue">
              <label htmlFor="exercise-domain">Choose a domain</label>
              <select
                id="exercise-domain"
                value={domain}
                onChange={(event) => {
                  const next = event.target.value;
                  setDomain(next);
                  if (next !== "All" && exercise.domain !== next)
                    choose(exercises.find((item) => item.domain === next)!.id);
                }}
              >
                {[
                  "All",
                  "JavaScript",
                  "Async",
                  "React contracts",
                  "Caching",
                  "Problem solving",
                ].map((domain) => (
                  <option key={domain}>{domain}</option>
                ))}
              </select>
              <div className="exercise-mobile-select">
                <label htmlFor="exercise-choice">Choose an exercise</label>
                <select
                  id="exercise-choice"
                  value={exercise.id}
                  onChange={(event) => choose(event.target.value)}
                >
                  {!visible.some((item) => item.id === exercise.id) && (
                    <option value={exercise.id}>{exercise.title}</option>
                  )}
                  {visible.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
              {visible.map((item, index) => (
                <button
                  className="exercise-picker"
                  aria-pressed={item.id === exercise.id}
                  key={item.id}
                  onClick={() => choose(item.id)}
                >
                  <span className="exercise-number">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <small>
                      {item.domain} · {item.difficulty}
                    </small>
                    <strong>{item.title}</strong>
                    <em>
                      {records[item.id]
                        ? records[item.id].best + " / " + item.checks.length + " best"
                        : item.checks.length + " behavioral checks"}
                      {records[item.id]?.solutionViewed ? " · reference viewed" : ""}
                    </em>
                  </span>
                  {records[item.id]?.best === item.checks.length ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Circle size={14} />
                  )}
                </button>
              ))}
              <p className="training-local-note">
                Drafts and results stay in this browser. Reference-assisted runs remain labeled.
                These checks support practice; they are not a certification.
              </p>
            </aside>
            <section className="exercise-workspace" aria-label="Current exercise" key={exercise.id}>
              <div className="exercise-brief">
                <span className="eyebrow accent">
                  {exercise.domain} / {exercise.difficulty}
                </span>
                <h2>{exercise.title}</h2>
                <p>{exercise.brief}</p>
                <div className="exercise-contract">
                  <strong>THE CONTRACT</strong>
                  <p>{exercise.contract}</p>
                </div>
                <label htmlFor="training-prediction">
                  Predict before running <small>optional, saved with this draft</small>
                </label>
                <p className="muted">{exercise.prediction}</p>
                <textarea
                  id="training-prediction"
                  value={prediction}
                  maxLength={2000}
                  onChange={(event) => setPrediction(event.target.value)}
                  placeholder="Which check will fail first, and which invariant explains it?"
                  rows={2}
                />
                <details>
                  <summary>Get a reasoning hint</summary>
                  <p>{exercise.hint}</p>
                </details>
              </div>
              <div className="training-editor">
                <div className="training-editor-toolbar">
                  <span>implementation.ts</span>
                  <div>
                    <button
                      className="button small"
                      onClick={() => {
                        stopRuntime();
                        setStatus("idle");
                        setSource(exercise.starter);
                        setResults([]);
                        setEvents([]);
                        setExecuted(null);
                        setError("");
                      }}
                    >
                      <RotateCcw size={13} />
                      Reset code
                    </button>
                    <button
                      className="button small"
                      disabled={!busy}
                      onClick={() => {
                        stopRuntime();
                        setStatus("stopped");
                      }}
                    >
                      <Square size={12} />
                      Stop
                    </button>
                    <button
                      className="button primary small"
                      disabled={busy || loadedId !== exercise.id}
                      onClick={() => void run()}
                    >
                      <Play size={13} />
                      {busy ? "Running…" : "Run checks"}
                    </button>
                  </div>
                </div>
                {plain ? (
                  <textarea
                    className="plain-source-editor"
                    aria-label="Training code editor"
                    value={source}
                    maxLength={MAX_SOURCE_LENGTH}
                    onChange={(event) => setSource(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                        event.preventDefault();
                        void run();
                      }
                    }}
                    spellCheck={false}
                  />
                ) : (
                  <SourceEditor
                    key={exercise.id}
                    value={source}
                    onChange={(value) => setSource(value.slice(0, MAX_SOURCE_LENGTH))}
                    onRun={() => void run()}
                    activeLine={line}
                    label="Training code editor"
                  />
                )}
                <div className="training-editor-footer">
                  <span>{source.split("\n").length} lines · Ctrl/Cmd Enter to run</span>
                  <button onClick={() => setPlain((value) => !value)}>
                    {plain ? "Use syntax editor" : "Use plain text editor"}
                  </button>
                </div>
                <p className="training-type-note">
                  Types are erased here. Behavioral checks verify execution; use TypeScript's
                  compiler to verify type relationships.
                </p>
              </div>
              <section className="training-results" aria-label="Behavioral results">
                <div className="training-result-heading">
                  <FlaskConical size={20} />
                  <div>
                    <h3>
                      {status === "complete"
                        ? passed + " / " + exercise.checks.length + " behavioral checks passed"
                        : status === "error"
                          ? "Execution needs attention"
                          : busy
                            ? "Testing your implementation…"
                            : "Make the contract observable."}
                    </h3>
                    <p role="status">
                      {changed
                        ? "Source changed. Run again to verify this version."
                        : status === "complete"
                          ? passed === exercise.checks.length
                            ? "All listed checks passed. Now explain why the contract holds."
                            : "Inspect the failed check, form a hypothesis, and repair the cause."
                          : status === "stopped"
                            ? "Run stopped. Displayed checks may be partial; run again to verify the full contract."
                            : "Checks run your edited code in a fresh isolated worker."}
                    </p>
                  </div>
                </div>
                {error && (
                  <pre className="training-error" role="alert">
                    {error}
                  </pre>
                )}
                <ol className="training-check-list">
                  {exercise.checks.map((check, index) => {
                    const result = results.find((result) => result.index === index);
                    return (
                      <li
                        className={result ? (result.passed ? "passed" : "failed") : ""}
                        key={check.name}
                      >
                        {result ? (
                          result.passed ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <TriangleAlert size={17} />
                          )
                        ) : (
                          <Circle size={16} />
                        )}
                        <div>
                          <strong>{check.name}</strong>
                          {result?.error && <p>{result.error}</p>}
                        </div>
                        <small>{result ? (result.passed ? "PASS" : "FAIL") : "WAITING"}</small>
                      </li>
                    );
                  })}
                </ol>
                <details>
                  <summary>Inspect the behavioral checks</summary>
                  {exercise.checks.map((check) => (
                    <div key={check.name}>
                      <h4>{check.name}</h4>
                      <CodeBlock code={check.body} language="javascript" title="check.js" />
                    </div>
                  ))}
                </details>
              </section>
              <section className="training-evidence" aria-label="Recorded runtime evidence">
                <span className="eyebrow">OBSERVE THE EXECUTED PROGRAM</span>
                <h3>Connect the check to the mechanism.</h3>
                <div className="evidence-pipeline">
                  <span>Edited source</span>
                  <ArrowRight size={16} />
                  <span>Native worker</span>
                  <ArrowRight size={16} />
                  <span>{results.length} outcomes</span>
                </div>
                <div className="training-snapshot">
                  <div>
                    <strong>{selected?.snapshot?.frames.length ?? 0}</strong>
                    <span>logical call lifetimes</span>
                  </div>
                  <div>
                    <strong>{selected?.snapshot?.timers.length ?? 0}</strong>
                    <span>tracked host timers</span>
                  </div>
                  <div>
                    <strong>{selected?.snapshot?.microtasks.length ?? 0}</strong>
                    <span>explicit microtasks</span>
                  </div>
                </div>
                <div className="training-frame-chips">
                  {selected?.snapshot?.frames.map((frame) => (
                    <span key={frame.id}>
                      {frame.name}
                      <small>{frame.status}</small>
                    </span>
                  ))}
                </div>
                <p className="muted">
                  Select recorded evidence to highlight its source line. Instrumentation records
                  public boundaries; it does not expose private engine queues or React Fiber. React
                  contract exercises test plain JavaScript state protocols; the React playground
                  mounts real components.
                </p>
                <div className="training-trace" aria-label="Training execution trace">
                  {evidence.length ? (
                    evidence.slice(-60).map((event) => (
                      <button
                        key={event.sequence}
                        aria-pressed={selected?.sequence === event.sequence}
                        onClick={() => setSelectedEvent(event.sequence)}
                      >
                        <small>{event.kind}</small>
                        <span>{event.label}</span>
                        <em>{event.line ? "L" + event.line : "host"}</em>
                      </button>
                    ))
                  ) : (
                    <p>
                      Run an implementation to inspect calls, continuations, and timer activity.
                    </p>
                  )}
                </div>
              </section>
              <section className="training-explain">
                <span className="eyebrow">CLOSE THE REASONING LOOP</span>
                <h3>Defend your solution.</h3>
                <p>
                  Which invariant makes the implementation correct? Which schedule or input would
                  falsify it? What remains unverified in a real browser, React tree, or distributed
                  deployment?
                </p>
                <div className="training-related">
                  {exercise.lessons.map((slug) => (
                    <Link key={slug} href={"/learn/" + slug}>
                      {getLesson(slug)!.title}
                      <ArrowRight size={13} />
                    </Link>
                  ))}
                </div>
                <details
                  onToggle={(event) => {
                    if (event.currentTarget.open) setRevealed(true);
                  }}
                >
                  <summary>Review the reference solution & reasoning</summary>
                  <p>{exercise.reasoning}</p>
                  <CodeBlock code={exercise.solution} language="javascript" title="reference.js" />
                  <button
                    className="button small"
                    disabled={busy}
                    onClick={() => {
                      setSource(exercise.solution);
                      setRevealed(true);
                    }}
                  >
                    Load reference into editor
                  </button>
                </details>
                {revealed && (
                  <p className="training-assistance">
                    Reference viewed. A passing run still verifies behavior; independent recall
                    needs another attempt without the reference.
                  </p>
                )}
              </section>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
