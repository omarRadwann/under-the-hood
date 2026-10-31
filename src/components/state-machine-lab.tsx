"use client";
import { useReducer } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { initialUpload, uploadTransition } from "@/lib/simulations";

export function StateMachineLab() {
  const [state, dispatch] = useReducer(uploadTransition, initialUpload);
  const states = [
    { id: "idle", label: "Idle", x: 95, y: 70 },
    { id: "uploading", label: "Uploading", x: 310, y: 70 },
    { id: "success", label: "Success", x: 535, y: 35 },
    { id: "failed", label: "Failed", x: 535, y: 120 },
    { id: "cancelled", label: "Cancelled", x: 310, y: 185 },
  ];
  return (
    <div className="lab">
      <div className="lab-top">
        <span className="eyebrow">
          <span className="live-dot" />
          WORKFLOW & STALE-EVENT LAB
        </span>
        <span className="lab-label">Pure transitions · simulated effects</span>
      </div>
      <div className="machine-graph">
        <svg
          viewBox="0 0 640 245"
          role="img"
          aria-label={`Upload state machine. Current state: ${state.status}`}
        >
          <defs>
            <marker
              id="machine-arrow"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6" fill="#718d50" />
            </marker>
          </defs>
          <path
            d="M157 70 H246 M374 65 L471 35 M374 80 L471 120 M310 96 V159"
            fill="none"
            stroke="#6b894c"
            strokeWidth="1.5"
            markerEnd="url(#machine-arrow)"
          />
          <path
            d="M248 185 H190 V96 M474 120 H420 V221 H160 V96"
            fill="none"
            stroke="#405d2e"
            strokeDasharray="4 5"
            markerEnd="url(#machine-arrow)"
          />
          <text x="199" y="58">
            START
          </text>
          <text x="411" y="37">
            SUCCESS
          </text>
          <text x="411" y="107">
            FAIL
          </text>
          <text x="322" y="138">
            CANCEL
          </text>
          {states.map((s) => (
            <g key={s.id} className={state.status === s.id ? "machine-current" : ""}>
              <rect x={s.x - 62} y={s.y - 25} width="124" height="50" rx="7" />
              <circle cx={s.x - 42} cy={s.y} r="3" />
              <text x={s.x + 7} y={s.y + 4} textAnchor="middle">
                {s.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="machine-state">
        <span className="eyebrow">CURRENT SNAPSHOT</span>
        <code>{`{ status: '${state.status}', activeId: ${state.activeId ?? "null"} }`}</code>
      </div>
      <div className="lab-actions">
        <button
          className="button primary small"
          disabled={state.status === "uploading"}
          onClick={() => dispatch({ type: "start" })}
        >
          Start #{state.nextId}
        </button>
        <button
          className="button small"
          disabled={state.status !== "uploading"}
          onClick={() => dispatch({ type: "success", id: state.activeId! })}
        >
          Resolve active
        </button>
        <button
          className="button small"
          disabled={state.status !== "uploading"}
          onClick={() => dispatch({ type: "fail", id: state.activeId! })}
        >
          Fail active
        </button>
        <button
          className="button small"
          disabled={state.status !== "uploading"}
          onClick={() => dispatch({ type: "cancel" })}
        >
          Cancel
        </button>
        <button
          className="button small"
          disabled={state.nextId < 3}
          onClick={() => dispatch({ type: "success", id: state.nextId - 2 })}
        >
          Late success #{Math.max(1, state.nextId - 2)}
        </button>
        <button
          className="icon-button"
          aria-label="Reset workflow"
          onClick={() => dispatch({ type: "reset" })}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="lab-explanation">
        <ArrowRight size={20} />
        <div>
          <strong>State and operation identity must both match</strong>
          <p>
            Start #1, cancel it, then start #2. Deliver the late success from #1. The transition
            rejects obsolete intent and keeps #2 active. This model has no real network or durable
            job runner.
          </p>
        </div>
      </div>
      <div className="trace-log">
        {state.log.map((line, i) => (
          <p key={i}>
            <span>›</span>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
