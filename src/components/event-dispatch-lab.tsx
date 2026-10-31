"use client";
import { useEffect, useRef, useState } from "react";

export function EventDispatchLab() {
  const parent = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0);
  const recording = useRef<string[]>([]);
  const append = useRef<(text: string, run: number) => void>(() => {});
  const [rows, setRows] = useState<string[]>([]);
  const [mode, setMode] = useState("No dispatch recorded");
  useEffect(() => {
    const ancestor = parent.current,
      button = target.current;
    if (!ancestor || !button) return;
    const owner = new AbortController();
    const runs = new WeakMap<Event, number>();
    let alive = true;
    function add(text: string, run: number) {
      if (!alive || run !== sequence.current) return;
      recording.current = [...recording.current, text].slice(-20);
      setRows(recording.current);
    }
    append.current = add;
    function observe(event: Event, label: string) {
      const run = runs.get(event);
      if (run === undefined) return;
      const phase = event.eventPhase;
      add(label + " · phase " + phase, run);
      // Capture primitive observations now; currentTarget is not stable after dispatch.
      queueMicrotask(() => add("microtask from " + label, run));
    }
    ancestor.addEventListener(
      "click",
      (event) => {
        const run = ++sequence.current;
        runs.set(event, run);
        recording.current = [];
        setMode(event.isTrusted ? "Browser-generated click" : "Programmatic click");
        observe(event, "capture");
      },
      { capture: true, signal: owner.signal },
    );
    button.addEventListener("click", (event) => observe(event, "target"), { signal: owner.signal });
    ancestor.addEventListener("click", (event) => observe(event, "bubble"), {
      signal: owner.signal,
    });
    return () => {
      alive = false;
      owner.abort();
      sequence.current++;
    };
  }, []);
  return (
    <div className="lab event-dispatch-lab">
      <div className="lab-top">
        <span className="eyebrow">DOM CALLBACK CHECKPOINTS</span>
        <span className="lab-label">Real browser events · not a queue simulator</span>
      </div>
      <p>
        Compare a browser-generated interaction with a nested synchronous dispatch. Only this lab's
        listeners and explicit microtasks are recorded.
      </p>
      <div className="event-dispatch-controls">
        <div ref={parent} className="event-ancestor">
          <span className="eyebrow">PARENT · CAPTURE / BUBBLE</span>
          <button ref={target} className="button primary small" type="button">
            Click the actual event target
          </button>
        </div>
        <button
          type="button"
          className="button small"
          onClick={() => {
            target.current?.click();
            append.current("caller returned from click()", sequence.current);
          }}
        >
          Run button.click() inside this handler
        </button>
        <button
          type="button"
          className="button small"
          onClick={() => {
            sequence.current++;
            recording.current = [];
            setRows([]);
            setMode("No dispatch recorded");
          }}
        >
          Clear event recording
        </button>
      </div>
      <div className="event-dispatch-evidence">
        <strong>{mode}</strong>
        <ol aria-label="Observed event dispatch order" aria-live="polite">
          {rows.map((row, index) => (
            <li key={index}>
              <span className="mono">{String(index + 1).padStart(2, "0")}</span>
              {row}
            </li>
          ))}
        </ol>
        {!rows.length && (
          <p>
            Choose one path. The native target uses the browser's actual interaction path; the
            separate control keeps its JavaScript handler active while it calls click().
          </p>
        )}
      </div>
      <div className="lab-explanation">
        <div>
          <strong>Which execution context is still active?</strong>
          <p>
            The programmatic caller remains on the stack, so its returned log precedes queued
            listener microtasks. With a browser-generated click, host cleanup can perform
            checkpoints between listeners. Framework bookkeeping may add other jobs; this is a
            bounded observation of your current browser.
          </p>
          <p>
            Capture is phase 1, the target is phase 2, and bubbling through this parent is phase 3.
            isTrusted describes dispatch provenance here; it is not an authorization check.
          </p>
        </div>
      </div>
    </div>
  );
}
