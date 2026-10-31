"use client";
import { useState } from "react";
import { ArrowRight, Cpu, RotateCcw } from "lucide-react";

const stages = [
  {
    name: "Source",
    detail:
      "The program arrives as text. The language defines observable semantics, not this particular implementation pipeline.",
    artifact: "function add(a, b) { return a + b; }",
  },
  {
    name: "Parse",
    detail:
      "Check grammar and establish syntactic structure and lexical scope relationships. Engines can parse portions lazily.",
    artifact: "FunctionDeclaration → Parameters(a, b) → Return(BinaryExpression '+')",
  },
  {
    name: "Bytecode",
    detail:
      "A representative interpreter executes a compact internal instruction form. Actual opcodes and compilation tiers are engine-specific.",
    artifact: "Load a → Load b → Add → Return  // illustrative, not literal V8 bytecode",
  },
  {
    name: "Feedback",
    detail:
      "Record observed behavior at operations and call sites. Input types and object shapes can inform specialization, but hotness heuristics are not language guarantees.",
    artifact: "Observation at +: number × number → numeric addition",
  },
  {
    name: "Optimize",
    detail:
      "An optimizing tier may generate specialized machine code with guards. Compilation can cost more than it saves on a cold path.",
    artifact: "Guard assumptions → specialized operation → return result",
  },
  {
    name: "Recover",
    detail:
      "When an assumption fails, recover correct language behavior through generic handling or deoptimization. A type change does not always force one exact implementation path.",
    artifact: "Guard miss → recover general semantics → update feedback",
  },
];
export function EngineLab() {
  const [stage, setStage] = useState(0);
  const [optimized, setOptimized] = useState(false);
  const [changed, setChanged] = useState(false);
  const [log, setLog] = useState<string[]>([
    "Choose a stage or advance through this abstract engine pipeline.",
  ]);
  function specialize() {
    setOptimized(true);
    setChanged(false);
    setStage(4);
    setLog((l) =>
      [
        "Model: specialize for observed numeric inputs. No real engine hotness threshold is implied.",
        ...l,
      ].slice(0, 5),
    );
  }
  function unexpected() {
    setChanged(true);
    setStage(optimized ? 5 : 3);
    setOptimized(false);
    setLog((l) =>
      [
        "Observed string input. Correct result is concatenation; the model falls back to general handling.",
        ...l,
      ].slice(0, 5),
    );
  }
  return (
    <div className="lab">
      <div className="lab-top">
        <span className="eyebrow">
          <span className="live-dot" />
          ENGINE PIPELINE EXPLORER
        </span>
        <span className="lab-label">Abstract tiering model · not a profiler</span>
      </div>
      <div className="engine-stages">
        {stages.map((s, i) => (
          <button className={stage === i ? "active" : ""} onClick={() => setStage(i)} key={s.name}>
            <span className="mono">0{i + 1}</span>
            <Cpu size={17} />
            <strong>{s.name}</strong>
          </button>
        ))}
      </div>
      <div className="engine-artifact">
        <span className="eyebrow">INTERNAL REPRESENTATION · ILLUSTRATIVE</span>
        <code>
          {stage === 3 && changed
            ? "Observed + inputs now include string × number → concatenation"
            : stages[stage].artifact}
        </code>
      </div>
      <div className="lab-explanation">
        <Cpu size={21} />
        <div>
          <strong>{stages[stage].name}</strong>
          <p>{stages[stage].detail}</p>
        </div>
      </div>
      <div className="lab-actions">
        <button
          className="button small primary"
          onClick={() => setStage((s) => (s + 1) % stages.length)}
        >
          Next stage
          <ArrowRight size={14} />
        </button>
        <button className="button small" onClick={specialize}>
          Model numeric specialization
        </button>
        <button className="button small" onClick={unexpected}>
          Pass a string
        </button>
        <button
          className="icon-button"
          aria-label="Reset engine model"
          onClick={() => {
            setStage(0);
            setOptimized(false);
            setChanged(false);
            setLog(["Model reset. No specialization assumed."]);
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <div className="engine-result">
        <span>
          Model state: <b>{optimized ? "specialized numeric path" : "general execution"}</b>
        </span>
        <span className="mono">{changed ? 'add("total: ", 1) → "total: 1"' : "add(2, 3) → 5"}</span>
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
