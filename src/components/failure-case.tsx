"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { caseStudies } from "@/content/case-studies";

export function FailureCase({ slug }: { slug: string }) {
  const c = caseStudies[slug];
  const [step, setStep] = useState(0);
  if (!c) return null;
  return (
    <section className="article-section failure-case" id="case-study">
      <span className="eyebrow accent">SENIOR INVESTIGATION / A FAILURE UNDER INTERLEAVING</span>
      <h2>{c.title}</h2>
      <p className="case-context">{c.context}</p>
      <div className="case-invariant">
        <ShieldCheck size={19} />
        <div>
          <span className="eyebrow">THE INVARIANT</span>
          <p>{c.invariant}</p>
        </div>
      </div>
      <div className="case-timeline">
        <div className="case-timeline-tabs" role="group" aria-label="Failure timeline">
          {c.timeline.map((item, i) => (
            <button
              onClick={() => setStep(i)}
              className={step === i ? "selected" : ""}
              key={item.actor + i}
            >
              <span className="mono">t{i}</span>
              <strong>{item.actor}</strong>
            </button>
          ))}
        </div>
        <div className="case-frame">
          <span className="eyebrow">{c.timeline[step].actor}</span>
          <p>{c.timeline[step].event}</p>
          <code>{c.timeline[step].state}</code>
        </div>
        <div className="case-controls">
          <button
            className="icon-button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            aria-label="Previous timeline event"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="mono">
            {step + 1} / {c.timeline.length}
          </span>
          <button
            className="button small"
            disabled={step === c.timeline.length - 1}
            onClick={() => setStep((s) => s + 1)}
          >
            Next event
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <h3 className="case-subheading">Compare the corrective designs.</h3>
      <div className="comparison-scroll">
        <table className="case-table">
          <thead>
            <tr>
              <th>Approach</th>
              <th>Where it fits</th>
              <th>Cost / limit</th>
            </tr>
          </thead>
          <tbody>
            {c.alternatives.map((a) => (
              <tr key={a.approach}>
                <th>{a.approach}</th>
                <td>{a.fits}</td>
                <td>{a.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="case-evidence">
        <div>
          <span className="eyebrow">HOW TO VERIFY THE INVARIANT</span>
          <p>{c.verification}</p>
        </div>
        <div>
          <span className="eyebrow">WHAT TO OBSERVE IN PRODUCTION</span>
          <p>{c.signals}</p>
        </div>
      </div>
    </section>
  );
}
