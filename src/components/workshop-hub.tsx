"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Download } from "lucide-react";
import {
  discussionQuestions,
  codingDrills,
  learningTracks,
  commandStages,
} from "@/content/workshop";
import { exercises } from "@/content/training";
import { getLesson } from "@/content";
import { updateStoredValue } from "@/lib/local-state";
import {
  WORKSHOP_KEY,
  blankWorkshop,
  blockIds,
  parseWorkshop,
  readWorkshop,
  isWorkshopStorageKey,
  type WorkshopState,
  type Reflection,
} from "@/lib/workshop";

type View = "tracks" | "coding" | "discussions" | "design";
const views: { id: View; label: string; detail: string }[] = [
  { id: "tracks", label: "Learning tracks", detail: "Connect concepts to evidence" },
  { id: "coding", label: "Coding patterns", detail: "Implement and test a contract" },
  { id: "discussions", label: "Explain mechanisms", detail: "Reason through 25 scenarios" },
  { id: "design", label: "System design", detail: "Follow a feature across boundaries" },
];
const scoreLabels = [
  "Needs more reasoning",
  "Partial explanation / used prompts",
  "Clear mechanism + edge cases",
  "Defended tradeoffs + verification",
];

export default function WorkshopHub() {
  const params = useSearchParams();
  const [state, setState] = useState<WorkshopState>(blankWorkshop);
  const stateRef = useRef(state),
    dirty = useRef(false);
  const [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [view, setView] = useState<View>("tracks"),
    [group, setGroup] = useState("All"),
    [weakOnly, setWeakOnly] = useState(false);
  const [questionId, setQuestionId] = useState(discussionQuestions[0].id),
    [guideId, setGuideId] = useState<string | null>(null);
  const [drillId, setDrillId] = useState(codingDrills[0].id),
    [command, setCommand] = useState(0);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    function load() {
      if (dirty.current) return;
      try {
        const next = readWorkshop(localStorage);
        stateRef.current = next;
        setState(next);
      } catch {
        setStorageError(true);
      }
    }
    function receive(event: StorageEvent) {
      if (isWorkshopStorageKey(event.key)) load();
    }
    load();
    setReady(true);
    window.addEventListener("storage", receive);
    return () => window.removeEventListener("storage", receive);
  }, []);
  useEffect(() => {
    const id = params.get("question");
    if (id && discussionQuestions.some((question) => question.id === id)) {
      setQuestionId(id);
      setGroup("All");
      setView("discussions");
    }
  }, [params]);
  function update(change: (previous: WorkshopState) => WorkshopState) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {}
    const result = updateStoredValue({
      storage,
      key: WORKSHOP_KEY,
      parse: (raw) => (raw === null && storage ? readWorkshop(storage) : parseWorkshop(raw)),
      fallback: stateRef.current,
      preferMemory: dirty.current,
      change,
    });
    dirty.current = result.storageError;
    stateRef.current = result.value;
    setState(result.value);
    setStorageError(result.storageError);
  }
  function answer(id: string, patch: Partial<Reflection>) {
    update((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        [id]: { ...(previous.answers[id] ?? { text: "", consulted: false }), ...patch },
      },
    }));
  }
  function openQuestion(id: string) {
    setQuestionId(id);
    setGroup("All");
    setWeakOnly(false);
    setGuideId(null);
    setView("discussions");
  }
  function exportNotes() {
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(stateRef.current, null, 2)], { type: "application/json" }),
    );
    link.href = url;
    link.download = "engineering-workshop-notes.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const selectedDrill = codingDrills.find((drill) => drill.id === drillId)!;
  const selectedExercise = exercises.find((exercise) => exercise.id === drillId)!;
  const filtered = discussionQuestions.filter(
    (question) =>
      (group === "All" || question.group === group) &&
      (!weakOnly || (state.answers[question.id]?.score ?? 0) < 2),
  );
  const current = filtered.find((question) => question.id === questionId) ?? filtered[0];
  const response = current ? state.answers[current.id] : undefined;
  const rated = Object.values(state.answers).filter((answer) => answer.score !== undefined).length;
  const revisit = discussionQuestions.filter(
    (question) => (state.answers[question.id]?.score ?? 0) < 2,
  ).length;
  useEffect(() => {
    if (view === "discussions" && document.activeElement === document.body)
      questionHeading.current?.focus();
  }, [current?.id, view]);

  return (
    <div className="workshop-hub">
      <section className="workshop-hero">
        <div>
          <span className="eyebrow">
            <BookOpen size={14} /> THE ENGINEERING WORKSHOP
          </span>
          <h1>
            Understand the mechanism.
            <br />
            <em>Prove it in practice.</em>
          </h1>
          <p>
            Implement algorithms, examine frontend contracts, and follow a feature across system
            boundaries. A public learning workspace for developers who want to reason beyond the
            happy path.
          </p>
          <div className="workshop-topic-tags">
            <span>JavaScript + TypeScript</span>
            <span>React + Next.js</span>
            <span>Algorithms + data structures</span>
            <span>Architecture + reliability</span>
          </div>
        </div>
        <aside className="workshop-method">
          <span className="eyebrow">A REPEATABLE LEARNING LOOP</span>
          <ol>
            <li>
              <strong>State the contract</strong>
              <span>Inputs, outputs, ownership, and assumptions.</span>
            </li>
            <li>
              <strong>Try an implementation</strong>
              <span>Choose a structure and explain its invariant.</span>
            </li>
            <li>
              <strong>Inspect the evidence</strong>
              <span>Run checks and trace a failing case.</span>
            </li>
            <li>
              <strong>Explain the tradeoff</strong>
              <span>Compare cost, failure modes, and verification.</span>
            </li>
          </ol>
        </aside>
      </section>
      <div className="workshop-evidence-strip">
        <div>
          <strong>{codingDrills.length}</strong>
          <span>coding patterns · 32 checks</span>
        </div>
        <div>
          <strong>{discussionQuestions.length}</strong>
          <span>technical discussion guides</span>
        </div>
        <div>
          <strong>
            {state.completed.length}/{blockIds.length}
          </strong>
          <span>learning blocks practiced</span>
        </div>
        <div>
          <strong>
            {rated}/{discussionQuestions.length}
          </strong>
          <span>explanations self-reviewed</span>
        </div>
      </div>
      <div className="workshop-workspace-note">
        <span>Local learning notes · executable checks and self-review are separate evidence</span>
        <button className="text-link" disabled={!ready} onClick={exportNotes}>
          <Download size={14} /> Export learning notes
        </button>
      </div>
      {storageError && (
        <p className="storage-warning" role="status">
          Saving is unavailable. Keep this page open and export your notes; current edits remain in
          this session.
        </p>
      )}
      <div className="workshop-tabs" role="group" aria-label="Workshop views">
        {views.map((item) => (
          <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </div>
      {!ready ? (
        <p role="status">Loading your learning workspace…</p>
      ) : (
        <>
          {view === "tracks" && (
            <div className="workshop-tracks">
              <div className="workshop-section-heading">
                <div>
                  <span className="eyebrow">LEARN THROUGH CONTRACTS</span>
                  <h2>Choose a track. Build your evidence.</h2>
                </div>
                <p>
                  Follow a track or choose an individual exercise. Mark a block when you have
                  practiced it, then revisit the parts you cannot yet explain.
                </p>
              </div>
              {learningTracks.map((track, index) => (
                <section className="workshop-track" key={track.id}>
                  <header>
                    <span className="workshop-track-number">0{index + 1}</span>
                    <div>
                      <span className="eyebrow">LEARNING TRACK</span>
                      <h3>{track.title}</h3>
                      <p>{track.outcome}</p>
                    </div>
                  </header>
                  <div>
                    {track.blocks.map((block) => {
                      const id = track.id + "/" + block.id;
                      return (
                        <div className="workshop-block" key={id}>
                          <label className="workshop-block-check">
                            <input
                              type="checkbox"
                              aria-label={"Practiced: " + block.title}
                              checked={state.completed.includes(id)}
                              onChange={() =>
                                update((previous) => ({
                                  ...previous,
                                  completed: previous.completed.includes(id)
                                    ? previous.completed.filter((value) => value !== id)
                                    : [...previous.completed, id],
                                }))
                              }
                            />
                            <span>Practiced</span>
                          </label>
                          <div>
                            <strong>{block.title}</strong>
                            <p>{block.detail}</p>
                            <div className="workshop-block-links">
                              {"exercise" in block && (
                                <Link
                                  href={"/practice?exercise=" + block.exercise}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open coding bench <ArrowUpRight size={13} />
                                </Link>
                              )}
                              {"question" in block && (
                                <button onClick={() => openQuestion(block.question!)}>
                                  Explore the explanation <ArrowRight size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <footer>
                    <strong>Explore further</strong>
                    {track.extra.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </footer>
                </section>
              ))}
            </div>
          )}
          {view === "coding" && (
            <div className="workshop-coding">
              <div className="workshop-section-heading">
                <div>
                  <span className="eyebrow">STRUCTURE BEFORE SYNTAX</span>
                  <h2>A solution needs an argument.</h2>
                </div>
                <p>
                  Clarify the input domain, trace an example, explain an invariant, and test the
                  implementation. Defend complexity separately from the listed checks.
                </p>
              </div>
              <div className="workshop-coding-layout">
                <nav className="workshop-drill-list" aria-label="Coding patterns">
                  {codingDrills.map((drill) => (
                    <button
                      key={drill.id}
                      aria-pressed={drillId === drill.id}
                      onClick={() => setDrillId(drill.id)}
                    >
                      <span>{drill.pattern}</span>
                      <strong>
                        {exercises.find((exercise) => exercise.id === drill.id)!.title}
                      </strong>
                    </button>
                  ))}
                </nav>
                <article className="workshop-problem">
                  <span className="eyebrow">{selectedDrill.pattern.toUpperCase()}</span>
                  <h3>{selectedExercise.title}</h3>
                  <p>{selectedExercise.contract}</p>
                  <div className="workshop-invariant">
                    <strong>What to explain</strong>
                    <p>{selectedDrill.focus}</p>
                  </div>
                  <Link
                    className="button primary"
                    href={"/practice?exercise=" + drillId}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open the coding bench <ArrowUpRight size={15} />
                  </Link>
                  <details>
                    <summary>Review your reasoning</summary>
                    <ul>
                      <li>Which invariant makes the algorithm correct?</li>
                      <li>What does the straightforward alternative cost?</li>
                      <li>Which empty, duplicate, boundary, or failure case exposes a defect?</li>
                      <li>
                        Does the implementation preserve the caller's data and resource ownership?
                      </li>
                      <li>What have the checks established, and what remains unverified?</li>
                    </ul>
                  </details>
                  <label className="workshop-notes-label">
                    Your learning log
                    <textarea
                      rows={6}
                      maxLength={6000}
                      value={state.retrospective}
                      placeholder="An assumption → a counterexample → the corrected invariant → further evidence"
                      onChange={(event) =>
                        update((previous) => ({ ...previous, retrospective: event.target.value }))
                      }
                    />
                  </label>
                </article>
              </div>
            </div>
          )}
          {view === "discussions" && (
            <div className="workshop-discussions">
              <div className="workshop-section-heading">
                <div>
                  <span className="eyebrow">EXPLANATION IS PART OF THE WORK</span>
                  <h2>Explain the cause. Defend the decision.</h2>
                </div>
                <p>
                  Write your own reasoning before revealing the guide. Use follow-up questions to
                  examine assumptions, counterexamples, tradeoffs, and production evidence.
                </p>
              </div>
              <div className="workshop-filters">
                <label>
                  Discussion area
                  <select
                    value={group}
                    onChange={(event) => {
                      setGroup(event.target.value);
                      setGuideId(null);
                    }}
                  >
                    {["All", ...new Set(discussionQuestions.map((question) => question.group))].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="workshop-weak-toggle">
                  <input
                    type="checkbox"
                    checked={weakOnly}
                    onChange={(event) => setWeakOnly(event.target.checked)}
                  />{" "}
                  Needs review ({revisit})
                </label>
                {current && (
                  <a className="text-link" href="#workshop-answer-outline">
                    Jump to your explanation
                  </a>
                )}
                <span>{filtered.length} scenarios</span>
              </div>
              <div className="workshop-answer-layout">
                <nav aria-label="Technical discussion scenarios" className="workshop-question-list">
                  {filtered.map((question) => (
                    <button
                      key={question.id}
                      aria-pressed={current?.id === question.id}
                      onClick={() => {
                        setQuestionId(question.id);
                        setGuideId(null);
                      }}
                    >
                      <small>{question.group}</small>
                      <strong>{question.title}</strong>
                      <span>
                        {state.answers[question.id]?.score === undefined
                          ? "Not reviewed"
                          : `Self-rating ${state.answers[question.id].score}/3`}
                      </span>
                    </button>
                  ))}
                </nav>
                {current ? (
                  <article className="workshop-answer" key={current.id}>
                    <span className="eyebrow">{current.group}</span>
                    <h3 ref={questionHeading} tabIndex={-1}>
                      {current.title}
                    </h3>
                    <p className="workshop-question-prompt">{current.prompt}</p>
                    <label className="workshop-notes-label">
                      Your explanation
                      <textarea
                        id="workshop-answer-outline"
                        rows={6}
                        maxLength={6000}
                        value={response?.text ?? ""}
                        onChange={(event) => answer(current.id, { text: event.target.value })}
                        placeholder="Mechanism → example → edge case → tradeoff → verification"
                      />
                    </label>
                    <button
                      className="button small"
                      aria-expanded={guideId === current.id}
                      onClick={() => {
                        if (guideId === current.id) setGuideId(null);
                        else {
                          setGuideId(current.id);
                          answer(current.id, { consulted: true });
                        }
                      }}
                    >
                      {guideId === current.id ? "Hide discussion guide" : "Reveal discussion guide"}
                    </button>
                    {response?.consulted && (
                      <small className="workshop-assisted">
                        Guide consulted · revisit the reasoning independently
                      </small>
                    )}
                    {guideId === current.id && (
                      <div className="workshop-discussion-guide">
                        <h4>Establish the mechanism</h4>
                        <ol>
                          {current.guide.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ol>
                        <h4>Explore the follow-up</h4>
                        <ul>
                          {current.followUps.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                        <h4>Claims to challenge</h4>
                        <ul>
                          {current.traps.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <fieldset className="workshop-self-rating">
                      <legend>Reflect on the explanation you gave</legend>
                      {scoreLabels.map((label, index) => (
                        <label key={label}>
                          <input
                            type="radio"
                            name={"score-" + current.id}
                            checked={response?.score === index}
                            onChange={() => answer(current.id, { score: index })}
                          />
                          <span>{index}</span>
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <div className="workshop-study-links">
                      <span className="eyebrow">INVESTIGATE THE DETAILS</span>
                      {current.lessons.map((slug) => (
                        <Link key={slug} href={"/learn/" + slug}>
                          {getLesson(slug)!.title}
                          <ArrowUpRight size={13} />
                        </Link>
                      ))}
                      {current.exercise && (
                        <Link href={"/practice?exercise=" + current.exercise}>
                          Run the related repair exercise <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </article>
                ) : (
                  <p className="workshop-empty">
                    No scenarios match this filter. Clear “Needs review” to explore the complete
                    collection.
                  </p>
                )}
              </div>
            </div>
          )}
          {view === "design" && (
            <div className="workshop-design">
              <div className="workshop-section-heading">
                <div>
                  <span className="eyebrow">OWN THE BOUNDARIES</span>
                  <h2>Follow one feature all the way through.</h2>
                </div>
                <p>
                  Trace a versioned project update across a multi-tenant application. Identify the
                  owner, failure mode, and required evidence at each boundary.
                </p>
              </div>
              <div className="workshop-design-summary">
                <section>
                  <h3>Start with the invariant</h3>
                  <p>
                    Define who may act, which resource they may change, the accepted version, the
                    returned representation, and the recovery path for an uncertain outcome.
                  </p>
                </section>
                <section>
                  <h3>Preserve ownership across layers</h3>
                  <p>
                    A browser draft, a typed transport, a server authorization decision, and a
                    database commit have distinct responsibilities. A convenient API does not erase
                    those boundaries.
                  </p>
                </section>
              </div>
              <div
                className="workshop-command-map"
                role="group"
                aria-label="Feature ownership boundaries"
              >
                {commandStages.map((stage, index) => (
                  <button
                    key={stage.title}
                    aria-pressed={command === index}
                    onClick={() => setCommand(index)}
                  >
                    <span>0{index + 1}</span>
                    <strong>{stage.title}</strong>
                    {index < commandStages.length - 1 && <ArrowRight size={14} />}
                  </button>
                ))}
              </div>
              <article className="workshop-boundary-detail">
                <span className="eyebrow">
                  BOUNDARY {command + 1} / {commandStages.length}
                </span>
                <h3>{commandStages[command].title}</h3>
                <div>
                  <section>
                    <h4>The contract</h4>
                    <p>{commandStages[command].contract}</p>
                  </section>
                  <section>
                    <h4>A failure to design for</h4>
                    <p>{commandStages[command].failure}</p>
                  </section>
                  <section>
                    <h4>Evidence to produce</h4>
                    <p>{commandStages[command].evidence}</p>
                  </section>
                </div>
                <small>
                  Conceptual design walkthrough. This static learning site does not execute a
                  production backend.
                </small>
              </article>
              <div className="workshop-design-prompts">
                {["system-booking", "api-trust", "system-cache", "own-ai"].map((id) => {
                  const question = discussionQuestions.find((item) => item.id === id)!;
                  return (
                    <button key={id} onClick={() => openQuestion(id)}>
                      <CheckCircle2 size={18} />
                      <strong>{question.title}</strong>
                      <ArrowRight size={16} />
                    </button>
                  );
                })}
              </div>
              <div className="workshop-callout">
                <h3>Review the design</h3>
                <ul>
                  <li>Which user flow and invariant matter most?</li>
                  <li>Where are authorization and representation scope enforced?</li>
                  <li>How are failures, duplicate requests, and obsolete results handled?</li>
                  <li>
                    Which real integration checks and production signals would validate the design?
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
      <p className="workshop-footnote">
        Practice flags and self-ratings are personal learning records. Behavioral checks cover
        listed cases; reflection is not certification. Notes stay in your browser and can be
        exported.
      </p>
    </div>
  );
}
