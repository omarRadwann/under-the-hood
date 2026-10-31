"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Search,
  Terminal,
} from "lucide-react";
import { getLesson } from "@/content";
import { jsStages, jsPathSlugs, jsCoverage, jsApiFamilies } from "@/content/javascript-path";
import type { Study } from "@/lib/study";
import { playgroundUrl, presets } from "@/playground/presets";

export function JavaScriptPath({ study }: { study: Study }) {
  const [view, setView] = useState("path");
  const [stage, setStage] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([jsStages[0].id]);
  const complete = jsPathSlugs.filter((slug) => study.completed.includes(slug)).length;
  const next = jsPathSlugs.find((slug) => !study.completed.includes(slug)) ?? jsPathSlugs[0];
  const runtimeCount = presets.filter((p) => p.mode === "event-loop").length;
  const matchingStages = jsStages
    .filter((s) => stage === "all" || s.id === stage)
    .map((s) => ({
      ...s,
      items: s.slugs
        .map((slug) => getLesson(slug)!)
        .filter((l) =>
          `${l.title} ${l.description} ${l.mental}`.toLowerCase().includes(query.toLowerCase()),
        ),
    }))
    .filter((s) => s.items.length);
  return (
    <section className="js-course">
      <header className="js-course-hero">
        <div>
          <span className="eyebrow js-gold">THE LANGUAGE COMES FIRST</span>
          <h1>
            JavaScript.
            <br />
            <span>
              From first line
              <br />
              to first principles.
            </span>
          </h1>
          <p>
            A deliberate route from zero to expert reasoning. Learn the mechanism, predict the edge
            case, run the code, and prove the contract.
          </p>
          <div className="js-hero-actions">
            <Link className="button primary" href={`/learn/${next}`}>
              {complete ? "Continue the path" : "Start from zero"}
              <ArrowRight size={16} />
            </Link>
            <Link className="button ghost" href="/playground?mode=event-loop">
              Run an experiment
              <Terminal size={16} />
            </Link>
          </div>
        </div>
        <div className="js-course-insignia">
          <div className="js-large-mark">
            JS<span>LANGUAGE / RUNTIME / JUDGMENT</span>
          </div>
          <div className="js-course-stats">
            <div>
              <strong>{jsPathSlugs.length}</strong>
              <span>connected chapters</span>
            </div>
            <div>
              <strong>{runtimeCount}</strong>
              <span>runnable experiments</span>
            </div>
            <div>
              <strong>{jsStages.length}</strong>
              <span>stages of mastery</span>
            </div>
            <div>
              <strong>
                {complete}
                <small> / {jsPathSlugs.length}</small>
              </strong>
              <span>marked complete</span>
            </div>
          </div>
          <div
            className="js-total-progress"
            role="progressbar"
            aria-label="JavaScript path progress"
            aria-valuemin={0}
            aria-valuemax={jsPathSlugs.length}
            aria-valuenow={complete}
          >
            <i style={{ width: `${(complete / jsPathSlugs.length) * 100}%` }} />
          </div>
        </div>
      </header>
      <div className="js-course-tabs" role="group" aria-label="JavaScript course views">
        {[
          ["path", "Learning path"],
          ["coverage", "Coverage map"],
          ["reference", "Built-in reference families"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className={view === id ? "selected" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "path" && (
        <>
          <div className="js-roadmap" aria-label="Six stages from foundations to production">
            {jsStages.map((s, i) => (
              <button
                key={s.id}
                aria-pressed={stage === s.id}
                onClick={() => {
                  setStage(s.id);
                  setExpanded((v) => (v.includes(s.id) ? v : [...v, s.id]));
                }}
                className={stage === s.id ? "selected" : ""}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{s.short}</strong>
                <small>{s.slugs.length} chapters</small>
              </button>
            ))}
          </div>
          <div className="js-path-tools">
            <button
              className={`button small ${stage === "all" ? "primary" : ""}`}
              aria-pressed={stage === "all"}
              onClick={() => setStage("all")}
            >
              All six stages
            </button>
            <div className="inline-search">
              <Search size={16} />
              <input
                aria-label="Search JavaScript path"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a mechanism, built-in, or edge case…"
              />
            </div>
            <span>Predict → execute → explain → apply</span>
          </div>
          <div className="js-stage-list">
            {matchingStages.map((s) => {
              const index = jsStages.findIndex((item) => item.id === s.id);
              const done = s.slugs.filter((slug) => study.completed.includes(slug)).length;
              const open = expanded.includes(s.id) || query.length > 0 || stage !== "all";
              return (
                <section className="js-stage" id={`stage-${s.id}`} key={s.id}>
                  <div className="js-stage-heading">
                    <span className="js-stage-number">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <span className="eyebrow js-gold">{s.short}</span>
                      <h2>{s.name}</h2>
                      <p>{s.focus}</p>
                    </div>
                    <span className="js-stage-completion">
                      {done} / {s.slugs.length}
                      <small>complete</small>
                    </span>
                  </div>
                  <div className="js-stage-contract">
                    <strong>YOU CAN EXPLAIN</strong>
                    <p>{s.outcome}</p>
                  </div>
                  <ol className="js-chapter-list">
                    {s.items.slice(0, open ? undefined : 3).map((l) => (
                      <li key={l.slug}>
                        <span
                          className={`js-chapter-state ${study.completed.includes(l.slug) ? "done" : ""}`}
                        >
                          {study.completed.includes(l.slug) ? (
                            <Check size={14} />
                          ) : (
                            String(s.slugs.indexOf(l.slug) + 1).padStart(2, "0")
                          )}
                        </span>
                        <Link href={`/learn/${l.slug}`}>
                          <strong>{l.title}</strong>
                          <span>{l.description}</span>
                        </Link>
                        <span className="js-chapter-level">
                          {l.level}
                          <small>{l.minutes} min</small>
                        </span>
                        {playgroundUrl(l.slug) && (
                          <Link
                            className="js-run-link"
                            href={playgroundUrl(l.slug)!}
                            aria-label={`Run ${l.title}`}
                          >
                            <Code2 size={16} />
                          </Link>
                        )}
                        <Link
                          className="js-chapter-open"
                          href={`/learn/${l.slug}`}
                          aria-label={`Read ${l.title}`}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                  {!query && stage === "all" && (
                    <button
                      className="js-stage-toggle"
                      aria-expanded={open}
                      onClick={() =>
                        setExpanded((v) =>
                          v.includes(s.id) ? v.filter((id) => id !== s.id) : [...v, s.id],
                        )
                      }
                    >
                      {open ? "Collapse chapters" : `Show all ${s.slugs.length} chapters`}
                      <ChevronDown
                        size={15}
                        style={{ transform: open ? "rotate(180deg)" : undefined }}
                      />
                    </button>
                  )}
                  <details className="js-capstone">
                    <summary>
                      Stage {index + 1} mastery project
                      <ArrowRight size={14} />
                    </summary>
                    <p>{s.capstone}</p>
                    <small>
                      Completion is self-assessed: preserve the invariant, demonstrate the failure
                      case, and explain the evidence.
                    </small>
                  </details>
                </section>
              );
            })}
          </div>
          {!matchingStages.length && (
            <div className="empty-state">
              <h2>No matching JavaScript chapters.</h2>
              <p>Try a broader term or select all stages.</p>
              <button
                className="button small"
                onClick={() => {
                  setQuery("");
                  setStage("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <div className="js-course-context">
            <strong>Continue into the rest of the system.</strong>
            <p>
              The language path connects to React scheduling, Next.js boundaries, auth, caching,
              architecture, SOLID, testing, and production engineering in the wider curriculum.
            </p>
            <Link className="text-link" href="/library">
              Explore the complete curriculum
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </>
      )}
      {view === "coverage" && (
        <div className="js-coverage">
          <div className="js-section-intro">
            <span className="eyebrow js-gold">MAKE THE SCOPE INSPECTABLE</span>
            <h2>Every major language family has a place.</h2>
            <p>
              This crosswalk maps language-guide families to concrete chapters. Language semantics,
              engine choices, and host APIs stay distinct; method-level contracts and compatibility
              link into the reference.
            </p>
          </div>
          {jsCoverage.map((area, i) => (
            <article className="js-coverage-row" key={area.topic}>
              <div>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <h3>{area.topic}</h3>
                <a
                  href={`https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/${area.reference}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Guide reference
                  <ArrowUpRight size={12} />
                </a>
              </div>
              <div>
                {area.slugs.map((slug) => (
                  <Link key={slug} href={`/learn/${slug}`}>
                    {getLesson(slug)!.title}
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {view === "reference" && (
        <div className="js-reference">
          <div className="js-section-intro">
            <span className="eyebrow js-gold">CONTRACTS OVER API MEMORIZATION</span>
            <h2>The standard library, organized.</h2>
            <p>
              Use a family to find its mental model, then consult the exact API's compatibility and
              specification. Newer APIs, proposals, host extensions, and universally deployed
              language features have different status.
            </p>
            <a
              className="text-link"
              href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference"
              target="_blank"
              rel="noreferrer"
            >
              Open the full language reference
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="js-api-grid">
            {jsApiFamilies.map((family) => (
              <details key={family.name} className="js-api-family">
                <summary>
                  <span>{family.name}</span>
                  <ChevronDown size={17} />
                </summary>
                <ul>
                  {family.apis.map((api) => (
                    <li key={api}>{api}</li>
                  ))}
                </ul>
                <p>{family.note}</p>
                <Link className="text-link" href={`/learn/${family.chapter}`}>
                  Study the contract
                  <ArrowUpRight size={14} />
                </Link>
              </details>
            ))}
          </div>
          <div className="js-scope-note">
            <strong>Scope and versions</strong>
            <p>
              The course covers the core language, standard-library families, execution model, and
              essential browser/Node integration. It does not pretend every platform API or
              experimental proposal is a universal language guarantee. WebAssembly, browser
              graphics/media APIs, and provider-specific services remain adjacent specializations.
              Temporal and other newer features are checked against target availability.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
