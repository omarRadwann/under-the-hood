"use client";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Box,
  Braces,
  Check,
  Circle,
  Database,
  Globe,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Server,
  SkipForward,
  Trash2,
  Zap,
} from "lucide-react";
import { cacheTransition, initialCache, lifecycle, loopCode, loopFrames } from "@/lib/simulations";
import type { Lesson } from "@/lib/types";
import { CodeBlock } from "./code-block";
import { EngineLab } from "./engine-lab";
import { StateMachineLab } from "./state-machine-lab";

function Controls({
  step,
  count,
  running,
  onPlay,
  onNext,
  onReset,
}: {
  step: number;
  count: number;
  running: boolean;
  onPlay: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  return (
    <div className="lab-controls">
      <button className="button small primary" onClick={onPlay}>
        {running ? <Pause size={14} /> : <Play size={14} />}
        {running ? "Pause" : step === count - 1 ? "Replay" : "Play"}
      </button>
      <button className="button small" onClick={onNext} disabled={step === count - 1}>
        <SkipForward size={14} />
        Step
      </button>
      <button className="icon-button" onClick={onReset} aria-label="Reset simulation">
        <RotateCcw size={15} />
      </button>
      <span className="mono muted step-count">
        {String(step).padStart(2, "0")} / {String(count - 1).padStart(2, "0")}
      </span>
    </div>
  );
}
function usePlayback(count: number, interval = 1400) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (step >= count - 1) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), interval);
    return () => clearTimeout(timer);
  }, [running, count, interval, step]);
  return {
    step,
    setStep,
    running,
    play: () => {
      if (step === count - 1) setStep(0);
      setRunning((r) => !r);
    },
    next: () => {
      setRunning(false);
      setStep((s) => Math.min(count - 1, s + 1));
    },
    reset: () => {
      setRunning(false);
      setStep(0);
    },
  };
}
export function EventLoopLab({ compact = false }: { compact?: boolean }) {
  const p = usePlayback(loopFrames.length);
  const f = loopFrames[p.step];
  return (
    <div className={`lab event-lab ${compact ? "compact" : ""}`}>
      <div className="lab-top">
        <span className="eyebrow">
          <span className="live-dot" />
          INTERACTIVE RUNTIME
        </span>
        <span className="lab-label">Browser · deterministic trace</span>
      </div>
      <div className="runtime-grid">
        <div className="runtime-source">
          <CodeBlock
            code={loopCode.join("\n")}
            language="javascript"
            title="event-loop.js"
            activeLine={f.line}
          />
          <div className="console">
            <span className="eyebrow">CONSOLE OUTPUT</span>
            <div className="console-values" aria-label="Console output">
              {f.output.length ? (
                f.output.map((v, i) => (
                  <span key={i}>
                    <span className="muted">›</span> {v}
                  </span>
                ))
              ) : (
                <span className="muted">Waiting for execution…</span>
              )}
            </div>
          </div>
        </div>
        <div className="runtime-engine">
          <div className="queue-row">
            <Queue title="Call stack" items={f.stack} color="yellow" empty="Stack is empty" />
            <Queue title="Web APIs" items={f.web} color="blue" empty="No pending timers" />
          </div>
          <div className="loop-connector">
            <span />
            <span className="loop-wheel">↻</span>
            <span />
            <small>EVENT LOOP</small>
          </div>
          <Queue
            title="Microtask queue"
            items={f.micro}
            color="purple"
            empty="No queued microtasks"
            horizontal
          />
          <Queue
            title="Task queue · timer source"
            items={f.tasks}
            color="green"
            empty="No eligible timer callback"
            horizontal
          />
        </div>
      </div>
      <div className="lab-explanation">
        <div className="frame-number">{String(p.step).padStart(2, "0")}</div>
        <div>
          <strong>{f.title}</strong>
          <p>{f.detail}</p>
        </div>
      </div>
      <Controls
        step={p.step}
        count={loopFrames.length}
        running={p.running}
        onPlay={p.play}
        onNext={p.next}
        onReset={p.reset}
      />
    </div>
  );
}
function Queue({
  title,
  items,
  color,
  empty,
  horizontal,
}: {
  title: string;
  items: string[];
  color: string;
  empty: string;
  horizontal?: boolean;
}) {
  return (
    <div className={`queue ${color} ${horizontal ? "horizontal" : ""}`}>
      <div className="queue-title">
        <span className="queue-indicator" />
        {title}
        <span className="queue-size">{items.length}</span>
      </div>
      <div className="queue-items">
        {items.length ? (
          items.map((item, i) => (
            <div className="queue-item" key={i}>
              {item}
            </div>
          ))
        ) : (
          <div className="queue-empty">{empty}</div>
        )}
      </div>
    </div>
  );
}
export function CacheLab() {
  const [state, setState] = useState(initialCache);
  const [ttl, setTtl] = useState(15);
  const fresh = state.cached !== null && state.now - state.writtenAt < ttl;
  const stale = state.cached !== null && state.cached !== state.source;
  return (
    <div className="lab">
      <LabHeading label="CACHE CONSISTENCY LAB" detail="Cache-aside · logical clock" />
      <div className="cache-settings">
        <label>
          TTL{" "}
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
          />
          <strong>{ttl}s</strong>
        </label>
        <span className="mono">
          Clock <b>t = {state.now}s</b>
        </span>
      </div>
      <div className="node-pipeline">
        <div className="system-node">
          <Globe />
          <small>CLIENT</small>
          <strong>{state.requests} reads</strong>
        </div>
        <ArrowRight className="pipeline-arrow" />
        <div className={`system-node ${fresh ? "active" : ""}`}>
          <Database />
          <small>SHARED CACHE</small>
          <strong>{state.cached === null ? "Empty" : `Version ${state.cached}`}</strong>
          <span className={`status ${stale ? "warning" : ""}`}>
            {state.cached === null
              ? "MISS"
              : !fresh
                ? "EXPIRED"
                : stale
                  ? "FRESH TTL · OLD DATA"
                  : "FRESH"}
          </span>
        </div>
        <ArrowRight className="pipeline-arrow" />
        <div className="system-node">
          <Server />
          <small>ORIGIN</small>
          <strong>Version {state.source}</strong>
        </div>
      </div>
      <div className="lab-actions">
        <button
          className="button primary small"
          onClick={() => setState((s) => cacheTransition(s, "read", ttl))}
        >
          Read resource
        </button>
        <button
          className="button small"
          onClick={() => setState((s) => cacheTransition(s, "write", ttl))}
        >
          Update origin
        </button>
        <button
          className="button small"
          onClick={() => setState((s) => cacheTransition(s, "tick", ttl))}
        >
          Advance 5s
        </button>
        <button
          className="button small"
          onClick={() => setState((s) => cacheTransition(s, "invalidate", ttl))}
        >
          Invalidate
        </button>
        <button
          className="icon-button"
          aria-label="Reset cache"
          onClick={() => setState(initialCache)}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="lab-explanation">
        <Database size={20} />
        <div>
          <strong>A fresh TTL does not guarantee current data</strong>
          <p>
            Read once, update the origin, then read again before expiry. This model uses blocking
            refill on expiry; it does not simulate stale-while-revalidate.
          </p>
        </div>
      </div>
      <div className="trace-log">
        {state.log.map((line, i) => (
          <p key={i}>
            <span>{i === 0 ? "→" : "·"}</span>
            {line}
          </p>
        ))}
        <footer>
          Hit rate: {state.requests ? Math.round((state.hits / state.requests) * 100) : 0}% ·{" "}
          {state.hits} hits / {state.requests} reads
        </footer>
      </div>
    </div>
  );
}
export function ReactLab() {
  const [live, setLive] = useState(false);
  const [committed, setCommitted] = useState<number | null>(null);
  const [candidate, setCandidate] = useState(0);
  const [phase, setPhase] = useState(-1);
  const [mode, setMode] = useState("mount");
  const [log, setLog] = useState<string[]>(["Mount the component to begin."]);
  function begin(kind: string) {
    setMode(kind);
    setPhase(0);
    setLive(true);
    setCandidate(kind === "mount" ? 0 : (committed ?? 0) + 1);
    setLog((l) =>
      [kind.toUpperCase() + ": candidate work scheduled; DOM unchanged.", ...l].slice(0, 7),
    );
  }
  function next() {
    const n = Math.min(5, phase + 1);
    setPhase(n);
    if (n === 3) setCommitted(candidate);
    setLog((l) => [lifecycle[n].title + ": " + mode + " trace.", ...l].slice(0, 7));
  }
  function discard() {
    setPhase(-1);
    if (committed === null) setLive(false);
    setLog((l) =>
      [
        "DISCARD: candidate abandoned. No DOM mutation or effect setup from this render.",
        ...l,
      ].slice(0, 7),
    );
  }
  function unmount() {
    setLive(false);
    setCommitted(null);
    setPhase(-1);
    setCandidate(0);
    setLog((l) =>
      ["UNMOUNT: refs detached; relevant effects clean up; local state discarded.", ...l].slice(
        0,
        7,
      ),
    );
  }
  return (
    <div className="lab">
      <LabHeading label="REACT LIFECYCLE EXPLORER" detail="Conceptual production trace" />
      <div className="react-preview">
        <div>
          <span className="eyebrow">COMMITTED DOM · CHANGES AT COMMIT</span>
          <div className={"component-box " + (committed !== null ? "mounted" : "")}>
            <Braces size={22} />
            <strong>
              {committed !== null
                ? "<Counter count={" + committed + "} />"
                : "No committed instance"}
            </strong>
            <span>
              {phase >= 0 && phase < 3
                ? "Candidate count: " + candidate + " · not committed"
                : committed !== null
                  ? "Current committed snapshot"
                  : "Mount to schedule a candidate"}
            </span>
          </div>
        </div>
        <div className="lab-actions">
          <button className="button small primary" disabled={live} onClick={() => begin("mount")}>
            Mount
          </button>
          <button
            className="button small"
            disabled={committed === null || (phase >= 0 && phase < 5)}
            onClick={() => begin("update")}
          >
            Update state
          </button>
          <button className="button small" disabled={committed === null} onClick={unmount}>
            Unmount
          </button>
        </div>
      </div>
      <div className="phase-grid">
        {lifecycle.map((item, i) => (
          <div
            className={"phase " + (i === phase ? "active" : "") + (i < phase ? " done" : "")}
            key={item.title}
          >
            <span>{i < phase ? <Check size={14} /> : String(i + 1).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
          </div>
        ))}
      </div>
      <div className="lab-explanation">
        <Zap size={20} />
        <div>
          <strong>{phase >= 0 ? lifecycle[phase].title : "No active render"}</strong>
          <p>
            {phase >= 0
              ? lifecycle[phase].body
              : "Rendering computes a candidate. Only committing changes the DOM. Discard candidate work before commit to inspect that distinction."}
          </p>
        </div>
      </div>
      <div className="lab-actions">
        <button
          className="button small primary"
          disabled={!live || phase < 0 || phase >= 5}
          onClick={next}
        >
          <SkipForward size={14} />
          Next phase
        </button>
        <button className="button small" disabled={phase < 0 || phase >= 3} onClick={discard}>
          Discard candidate
        </button>
        <span className="muted tiny">Detailed scheduler/ref/effect internals are simplified.</span>
      </div>
      <div className="trace-log">
        {log.map((l, i) => (
          <p key={i}>
            <span>›</span>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
export function MemoryLab() {
  const [linked, setLinked] = useState(true);
  const [closure, setClosure] = useState(true);
  const [collected, setCollected] = useState(false);
  const reachable = linked || closure;
  return (
    <div className="lab">
      <LabHeading label="REACHABILITY EXPLORER" detail="Conceptual heap model" />
      <div className="memory-grid">
        <div className="memory-root">
          <span className="eyebrow">GC ROOTS</span>
          <button
            className={`reference ${linked ? "connected" : ""}`}
            disabled={collected}
            aria-pressed={linked}
            onClick={() => {
              setLinked(!linked);
              setCollected(false);
            }}
          >
            <Box size={18} />
            <span>
              Application reference
              <small>{linked ? "Connected to data" : "Reference removed"}</small>
            </span>
            <span>{linked ? "●" : "○"}</span>
          </button>
          <button
            className={`reference ${closure ? "connected" : ""}`}
            disabled={collected}
            aria-pressed={closure}
            onClick={() => {
              setClosure(!closure);
              setCollected(false);
            }}
          >
            <Braces size={18} />
            <span>
              Listener → closure
              <small>{closure ? "Retains lexical binding" : "Listener cleaned up"}</small>
            </span>
            <span>{closure ? "●" : "○"}</span>
          </button>
        </div>
        <div
          className={`heap-object ${collected ? "collected" : reachable ? "reachable" : "unreachable"}`}
        >
          <Database size={34} />
          <strong>{collected ? "Reclaimed in this model" : "Large data object"}</strong>
          <span>
            {collected
              ? "No live reference path"
              : reachable
                ? "Reachable · kept alive"
                : "Unreachable · eligible for collection"}
          </span>
          <small>objects ↔ nested references</small>
        </div>
      </div>
      <div className="lab-actions">
        <button
          className="button small primary"
          onClick={() => {
            if (!reachable) setCollected(true);
          }}
          disabled={reachable || collected}
        >
          <Trash2 size={14} />
          Simulate collection
        </button>
        <button
          className="button small"
          onClick={() => {
            setLinked(true);
            setClosure(true);
            setCollected(false);
          }}
        >
          Allocate new object
        </button>
      </div>
      <div className="lab-explanation">
        <Box size={20} />
        <div>
          <strong>
            {reachable
              ? "At least one retaining path remains"
              : collected
                ? "The graph can be reclaimed"
                : "Eligibility is not collection timing"}
          </strong>
          <p>
            Toggle both references. Removing the direct reference is insufficient while a listener
            closure retains the binding. Real collectors choose their own timing; this button is a
            teaching control, not a GC API.
          </p>
        </div>
      </div>
    </div>
  );
}

const networkSteps = [
  {
    title: "Browser",
    body: "The client constructs a request. Cookies, fetch credentials, and policy determine what may be sent.",
  },
  {
    title: "DNS & connection",
    body: "Resolve the host and establish or reuse transport. This conceptual path assumes HTTPS over TCP; HTTP/3 uses QUIC instead.",
  },
  {
    title: "CDN / proxy",
    body: "A shared cache may respond or forward the request. Private responses must not leak into an unsafe shared cache.",
  },
  {
    title: "Application",
    body: "Validate the request, authenticate identity, authorize the resource, and enforce deadlines.",
  },
  {
    title: "Database",
    body: "Execute a scoped query or transaction. Protect invariants where concurrent requests meet.",
  },
  {
    title: "Response",
    body: "Headers arrive, then the body is consumed. HTTP error statuses require explicit handling; JSON parsing is separate.",
  },
];
const authSteps = [
  {
    title: "Verify identity",
    body: "A maintained auth implementation verifies credentials or an OIDC flow. This simulation creates no real accounts or credentials.",
  },
  {
    title: "Issue session",
    body: "Generate a fresh session credential after verification. Rotate identity to avoid fixation.",
  },
  {
    title: "Browser cookie",
    body: "Use an appropriate HttpOnly, Secure, SameSite cookie. These attributes serve different purposes.",
  },
  {
    title: "Verify request",
    body: "The server checks the session's integrity or store record, expiration, and revocation.",
  },
  {
    title: "Authorize resource",
    body: "A valid identity still needs permission for this tenant, resource, and operation.",
  },
  {
    title: "Access or deny",
    body: "A revoked session or viewer attempting an edit is denied. UI controls are never the authority.",
  },
];
export function PipelineLab({ auth = false }: { auth?: boolean }) {
  const steps = auth ? authSteps : networkSteps;
  const p = usePlayback(steps.length);
  const [role, setRole] = useState("editor");
  const [revoked, setRevoked] = useState(false);
  const denied = auth && p.step === 5 && (role === "viewer" || revoked);
  return (
    <div className="lab">
      <LabHeading
        label={auth ? "SESSION & POLICY EXPLORER" : "REQUEST JOURNEY"}
        detail={auth ? "Simulated identity · edit operation" : "Simplified cold request · HTTPS"}
      />
      {auth && (
        <div className="lab-actions">
          <label className="select-label">
            Role{" "}
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={revoked}
              onChange={(e) => setRevoked(e.target.checked)}
            />
            Session revoked
          </label>
        </div>
      )}
      <div className="pipeline-grid">
        {steps.map((s, i) => (
          <button
            key={s.title}
            className={`pipeline-stage ${p.step === i ? "active" : ""} ${i < p.step ? "done" : ""}`}
            onClick={() => {
              p.setStep(i);
            }}
          >
            <span>
              {i < p.step ? (
                <Check size={18} />
              ) : auth ? (
                <LockKeyhole size={18} />
              ) : i === 4 ? (
                <Database size={18} />
              ) : (
                <Globe size={18} />
              )}
            </span>
            <small>{String(i + 1).padStart(2, "0")}</small>
            <strong>{s.title}</strong>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div className={`lab-explanation ${denied ? "denied" : ""}`}>
        <span className="frame-number">{String(p.step + 1).padStart(2, "0")}</span>
        <div>
          <strong>
            {p.step === 5 && auth
              ? denied
                ? "Access denied"
                : "Edit authorized in this model"
              : steps[p.step].title}
          </strong>
          <p>
            {denied
              ? revoked
                ? "The session has been revoked. Identity verification fails; the request cannot edit this resource."
                : "The session is valid, but a viewer lacks edit permission. Authentication does not imply authorization."
              : steps[p.step].body}
          </p>
        </div>
      </div>
      <Controls
        step={p.step}
        count={steps.length}
        running={p.running}
        onPlay={p.play}
        onNext={p.next}
        onReset={p.reset}
      />
    </div>
  );
}
export function StreamingLab() {
  const [time, setTime] = useState(0);
  const [failure, setFailure] = useState(false);
  const regions = [
    { title: "Static shell", at: 0, detail: "Navigation and heading", width: "70%" },
    { title: "Cached catalog", at: 200, detail: "Shared public content", width: "90%" },
    { title: "Personal basket", at: 700, detail: "Session-specific runtime data", width: "55%" },
    { title: "Recommendations", at: 1400, detail: "Slow independent dependency", width: "80%" },
  ];
  return (
    <div className="lab">
      <LabHeading label="STREAMING REVEAL LAB" detail="Illustrative latency · not a benchmark" />
      <div className="stream-settings">
        <label>
          Simulated response time <strong className="mono">{time} ms</strong>
          <input
            type="range"
            min="0"
            max="1600"
            step="100"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={failure} onChange={(e) => setFailure(e.target.checked)} />
          Fail recommendations
        </label>
      </div>
      <div className="stream-grid">
        {regions.map((r, i) => (
          <div className={`stream-region ${time >= r.at ? "revealed" : ""}`} key={r.title}>
            <div>
              <span className="eyebrow">
                {String(i + 1).padStart(2, "0")} · {r.at}ms
              </span>
              {time >= r.at ? <Check size={14} /> : <Circle size={14} />}
            </div>
            <strong>{r.title}</strong>
            <small>{r.detail}</small>
            {time >= r.at ? (
              failure && i === 3 ? (
                <p className="stream-error">Unavailable · other regions stay visible</p>
              ) : (
                <div className="revealed-content">
                  <span style={{ width: r.width }} />
                  <span />
                  <span />
                </div>
              )
            ) : (
              <div className="skeleton-content">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="lab-explanation">
        <Zap size={20} />
        <div>
          <strong>Independent boundaries, independent outcomes</strong>
          <p>
            Move the clock. A shell can reveal before runtime regions, and an optional dependency
            can fail locally. Real streaming also depends on data initiation, framework
            configuration, and proxy buffering.
          </p>
        </div>
      </div>
    </div>
  );
}
export function FlowLab({ lesson }: { lesson: Lesson }) {
  const [selected, setSelected] = useState(0);
  return (
    <div className="lab">
      <LabHeading label="MECHANISM EXPLORER" detail="Select a stage to inspect the contract" />
      <div className="flow-stages">
        {lesson.steps.map((step, i) => (
          <button
            className={`flow-stage ${selected === i ? "active" : ""}`}
            key={step.title}
            onClick={() => setSelected(i)}
          >
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            {i !== lesson.steps.length - 1 && <ArrowDown size={16} />}
          </button>
        ))}
      </div>
      <div className="lab-explanation">
        <Braces size={20} />
        <div>
          <strong>{lesson.steps[selected].title}</strong>
          <p>{lesson.steps[selected].body}</p>
        </div>
      </div>
      <div className="lab-actions">
        <button
          className="button small"
          onClick={() => setSelected((s) => (s + 1) % lesson.steps.length)}
        >
          Next stage
          <ArrowRight size={14} />
        </button>
        <span className="tiny muted">
          A conceptual model for this lesson; not a runtime emulator.
        </span>
      </div>
    </div>
  );
}
export function Lab({ lesson }: { lesson: Lesson }) {
  switch (lesson.lab) {
    case "engine":
      return <EngineLab />;
    case "event-loop":
      return <EventLoopLab />;
    case "memory":
      return <MemoryLab />;
    case "react":
      return <ReactLab />;
    case "network":
      return <PipelineLab />;
    case "auth":
      return <PipelineLab auth />;
    case "cache":
      return <CacheLab />;
    case "streaming":
      return <StreamingLab />;
    case "machine":
      return <StateMachineLab />;
    default:
      return <FlowLab lesson={lesson} />;
  }
}
function LabHeading({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="lab-top">
      <span className="eyebrow">
        <span className="live-dot" />
        {label}
      </span>
      <span className="lab-label">{detail}</span>
    </div>
  );
}
