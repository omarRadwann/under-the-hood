"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  ExternalLink,
  Play,
  RotateCcw,
  Square,
  Target,
} from "lucide-react";
import {
  interviewQuestions,
  codingDrills,
  sprintSessions,
  mockStages,
  commandStages,
} from "@/content/interview";
import { exercises } from "@/content/training";
import { getLesson } from "@/content";
import { updateStoredValue } from "@/lib/local-state";
import {
  INTERVIEW_KEY,
  blankInterview,
  blockIds,
  calendarDay,
  nextThursday,
  daysUntil,
  parseInterview,
  remainingSeconds,
  type InterviewState,
  type Rehearsal,
} from "@/lib/interview";

type Tab = "plan" | "coding" | "rehearse" | "role";
const tabs: { id: Tab; label: string; detail: string }[] = [
  { id: "plan", label: "Your sprint", detail: "Three focused sessions" },
  { id: "coding", label: "Coding & mock", detail: "Solve under time pressure" },
  {
    id: "rehearse",
    label: "Explain it",
    detail: `${interviewQuestions.length} senior discussions`,
  },
  { id: "role", label: "Bask role lens", detail: "Form → API → database" },
];
const scoreLabels = [
  "Cannot explain yet",
  "Partial / needed prompts",
  "Clear mechanism + edge cases",
  "Defended tradeoffs + verification",
];
const timeText = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function InterviewHub() {
  const params = useSearchParams();
  const [state, setState] = useState<InterviewState>(blankInterview);
  const stateRef = useRef(state),
    dirty = useRef(false);
  const [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<Tab>("plan"),
    [group, setGroup] = useState("All"),
    [weakOnly, setWeakOnly] = useState(false);
  const [questionId, setQuestionId] = useState(interviewQuestions[0].id),
    [guideId, setGuideId] = useState<string | null>(null);
  const [drillId, setDrillId] = useState(codingDrills[0].id),
    [timerMode, setTimerMode] = useState<"coding" | "mock">("coding");
  const [deadline, setDeadline] = useState<number | null>(null),
    [remaining, setRemaining] = useState(codingDrills[0].minutes * 60);
  const deadlineRef = useRef<number | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  function changeDeadline(value: number | null) {
    deadlineRef.current = value;
    setDeadline(value);
  }
  const [command, setCommand] = useState(0);
  useEffect(() => {
    const day = calendarDay(new Date());
    setToday(day);
    function load() {
      if (dirty.current) return;
      try {
        const next = parseInterview(localStorage.getItem(INTERVIEW_KEY));
        if (!next.target) next.target = nextThursday(calendarDay(new Date()));
        stateRef.current = next;
        setState(next);
      } catch {
        setStorageError(true);
        const next = { ...blankInterview(), target: nextThursday(day) };
        stateRef.current = next;
        setState(next);
      }
    }
    function receive(event: StorageEvent) {
      if (event.key === INTERVIEW_KEY || event.key === null) load();
    }
    load();
    setReady(true);
    window.addEventListener("storage", receive);
    const clock = window.setInterval(() => setToday(calendarDay(new Date())), 60000);
    return () => {
      window.removeEventListener("storage", receive);
      window.clearInterval(clock);
    };
  }, []);
  useEffect(() => {
    const id = params.get("question");
    if (id && interviewQuestions.some((question) => question.id === id)) {
      setQuestionId(id);
      setGroup("All");
      setTab("rehearse");
    }
  }, [params]);
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      if (deadlineRef.current !== deadline) return;
      const left = remainingSeconds(deadline, Date.now());
      setRemaining(left);
      if (left === 0) changeDeadline(null);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline]);
  function update(change: (previous: InterviewState) => InterviewState) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {}
    const result = updateStoredValue({
      storage,
      key: INTERVIEW_KEY,
      parse: parseInterview,
      fallback: stateRef.current,
      preferMemory: dirty.current,
      change: (previous) => {
        const next = change(previous);
        if (!next.target && stateRef.current.target) next.target = stateRef.current.target;
        return next;
      },
    });
    dirty.current = result.storageError;
    stateRef.current = result.value;
    setState(result.value);
    setStorageError(result.storageError);
  }
  function answer(id: string, patch: Partial<Rehearsal>) {
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
    setTab("rehearse");
  }
  function exportNotes() {
    const link = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(stateRef.current, null, 2)], { type: "application/json" }),
    );
    link.href = url;
    link.download = `interview-prep-${today}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const selectedDrill = codingDrills.find((drill) => drill.id === drillId)!;
  const selectedExercise = exercises.find((exercise) => exercise.id === drillId)!;
  const duration = (timerMode === "mock" ? 60 : selectedDrill.minutes) * 60;
  const elapsed = Math.max(0, duration - remaining);
  let boundary = 0;
  const activeStage = mockStages.findIndex((stage) => {
    boundary += stage.minutes * 60;
    return elapsed < boundary;
  });
  const filtered = interviewQuestions.filter(
    (question) =>
      (group === "All" || question.group === group) &&
      (!weakOnly || (state.answers[question.id]?.score ?? 0) < 2),
  );
  const current = filtered.find((question) => question.id === questionId) ?? filtered[0];
  const response = current ? state.answers[current.id] : undefined;
  useEffect(() => {
    if (tab === "rehearse" && document.activeElement === document.body)
      questionHeading.current?.focus();
  }, [current?.id, tab]);
  const rated = Object.values(state.answers).filter((answer) => answer.score !== undefined).length;
  const revisit = interviewQuestions.filter(
    (question) => (state.answers[question.id]?.score ?? 0) < 2,
  ).length;
  const days = daysUntil(today, state.target);
  function resetTimer(nextId = drillId, nextMode = timerMode) {
    changeDeadline(null);
    setRemaining(
      (nextMode === "mock" ? 60 : codingDrills.find((drill) => drill.id === nextId)!.minutes) * 60,
    );
  }

  return (
    <div className="interview-hub">
      <section className="interview-hero">
        <div>
          <span className="eyebrow">
            <Target size={14} /> THE TECHNICAL ROUND
          </span>
          <h1>
            Make your reasoning
            <br />
            <em>impossible to miss.</em>
          </h1>
          <p>
            A focused senior frontend sprint for Bask Health: solve unfamiliar problems, explain the
            mechanism, and defend the path from a form to a safe commit.
          </p>
          <div className="interview-role-tags">
            <span>JavaScript + TypeScript</span>
            <span>React + Next.js</span>
            <span>Live problem solving</span>
            <span>End-to-end ownership</span>
          </div>
        </div>
        <div className="interview-target-card">
          <span className="eyebrow">YOUR NEXT INTERVIEW</span>
          <strong>
            {ready && state.target
              ? new Intl.DateTimeFormat("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                }).format(new Date(state.target + "T12:00:00Z"))
              : "Set your target"}
          </strong>
          <p>
            {days === null
              ? "Choose a target date below."
              : days > 0
                ? `${days} calendar days to go. Work through the core sessions; repeat the parts you cannot yet explain.`
                : days === 0
                  ? "Interview day. Use the short warm-up, then stop cramming."
                  : "This target date has passed. Update it to plan another round."}
          </p>
          <label>
            Interview date
            <input
              type="date"
              min="2020-01-01"
              max="2099-12-31"
              value={state.target}
              disabled={!ready}
              onChange={(event) => {
                const target = event.target.value;
                if (target) update((previous) => ({ ...previous, target }));
              }}
            />
          </label>
          <label>
            Daily study budget
            <select
              value={state.budget}
              disabled={!ready}
              onChange={(event) =>
                update((previous) => ({
                  ...previous,
                  budget: Number(event.target.value) as InterviewState["budget"],
                }))
              }
            >
              <option value="120">2 hours · core plan</option>
              <option value="180">3 hours · add a timed drill</option>
              <option value="240">4 hours · drill + explanation review</option>
            </select>
          </label>
          <small>
            Dates use your browser’s local calendar. Adjust the date to match your invitation.
          </small>
        </div>
      </section>
      <div className="interview-evidence-strip">
        <div>
          <strong>8</strong>
          <span>coding patterns · 32 checks</span>
        </div>
        <div>
          <strong>{interviewQuestions.length}</strong>
          <span>scenario-based discussions</span>
        </div>
        <div>
          <strong>
            {state.completed.length}/{blockIds.length}
          </strong>
          <span>core blocks practiced</span>
        </div>
        <div>
          <strong>
            {rated}/{interviewQuestions.length}
          </strong>
          <span>answers self-reviewed</span>
        </div>
      </div>
      <div className="interview-workspace-note">
        <span>
          Local workspace · your notes stay in this browser · self-review is separate from
          executable checks
        </span>
        <button className="text-link" disabled={!ready} onClick={exportNotes}>
          <Download size={14} /> Export prep notes
        </button>
      </div>
      {storageError && (
        <p className="storage-warning" role="status">
          Saving is unavailable. Keep this page open and export your notes; current edits remain in
          this session.
        </p>
      )}
      <div className="interview-tabs" role="group" aria-label="Interview workspace">
        {tabs.map((item) => (
          <button key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </button>
        ))}
      </div>
      {!ready ? (
        <p role="status">Loading your preparation workspace…</p>
      ) : (
        <>
          {tab === "plan" && (
            <div className="interview-plan">
              <div className="interview-section-heading">
                <div>
                  <span className="eyebrow">PRIORITY BEFORE COVERAGE</span>
                  <h2>Three sessions. Evidence you can explain.</h2>
                </div>
                <p>
                  Each core session is 120 minutes. For {state.budget} minutes,{" "}
                  {state.budget === 120
                    ? "finish the core and log what needs another attempt."
                    : state.budget === 180
                      ? "add one timed coding drill and a short debrief."
                      : "add a timed drill, then revisit weak answers and a second mock segment."}
                </p>
              </div>
              {days !== null && days < 3 && (
                <div className="interview-callout">
                  <strong>
                    {days <= 0
                      ? "Use the interview-day warm-up."
                      : "Compress the plan deliberately."}
                  </strong>
                  <p>
                    {days <= 0
                      ? "Review your mistake log, explain one familiar solution, check the call setup, and leave time to rest."
                      : "You have fewer than three calendar days. Prioritize pair sum/sliding window, the query-race explanation, one end-to-end design, and a mock. Skip optional extensions first."}
                  </p>
                </div>
              )}
              {sprintSessions.map((session, index) => (
                <section className="interview-session" key={session.id}>
                  <header>
                    <span className="interview-session-number">0{index + 1}</span>
                    <div>
                      <span className="eyebrow">SESSION {index + 1} · 120 MIN CORE</span>
                      <h3>{session.title}</h3>
                      <p>{session.outcome}</p>
                    </div>
                  </header>
                  <div className="interview-blocks">
                    {session.blocks.map((block) => {
                      const id = session.id + "/" + block.id;
                      return (
                        <div className="interview-block" key={id}>
                          <label className="interview-block-check">
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
                            <span>{block.minutes} min</span>
                          </label>
                          <div>
                            <strong>{block.title}</strong>
                            <p>{block.detail}</p>
                            <div className="interview-block-links">
                              {block.id === "mock" && (
                                <button
                                  disabled={deadline !== null && timerMode !== "mock"}
                                  onClick={() => {
                                    if (timerMode !== "mock") {
                                      setTimerMode("mock");
                                      resetTimer(drillId, "mock");
                                    }
                                    setTab("coding");
                                  }}
                                >
                                  Open the 60-minute mock <ArrowRight size={13} />
                                </button>
                              )}
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
                                  Rehearse the explanation <ArrowRight size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <footer>
                    <strong>Optional extension</strong>
                    {session.extra.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </footer>
                </section>
              ))}
              <section className="interview-callout">
                <span className="eyebrow">INTERVIEW-DAY WARM-UP · 30 MIN</span>
                <h3>Retrieve. Do not restart the curriculum.</h3>
                <p>
                  10 min: explain a familiar solution without notes. 10 min: revisit your mistake
                  log and two ownership stories. 10 min: check the call/editor setup, prepare
                  questions, and pause before the interview. This is a suggested study routine, not
                  a prediction of the interview format.
                </p>
              </section>
            </div>
          )}
          {tab === "coding" && (
            <div className="interview-coding">
              <div className="interview-section-heading">
                <div>
                  <span className="eyebrow">THINK ALOUD, THEN TYPE</span>
                  <h2>A solution needs an argument.</h2>
                </div>
                <p>
                  Clarify → trace → choose an invariant → implement → test → explain complexity. The
                  runner checks cases; you defend the reasoning.
                </p>
              </div>
              <div className="interview-coding-layout">
                <div className="interview-drill-list">
                  {codingDrills.map((drill) => (
                    <button
                      key={drill.id}
                      disabled={deadline !== null}
                      aria-pressed={drillId === drill.id}
                      onClick={() => {
                        setDrillId(drill.id);
                        resetTimer(drill.id);
                      }}
                    >
                      <span>{drill.pattern}</span>
                      <strong>
                        {exercises.find((exercise) => exercise.id === drill.id)!.title}
                      </strong>
                      <small>{drill.minutes} min</small>
                    </button>
                  ))}
                </div>
                <div className="interview-round">
                  <div className="interview-timer-heading">
                    <label>
                      Practice format
                      <select
                        value={timerMode}
                        disabled={deadline !== null}
                        onChange={(event) => {
                          const mode = event.target.value as "coding" | "mock";
                          setTimerMode(mode);
                          resetTimer(drillId, mode);
                        }}
                      >
                        <option value="coding">Timed coding · {selectedDrill.minutes} min</option>
                        <option value="mock">Full practice mock · 60 min</option>
                      </select>
                    </label>
                    <span
                      className="interview-timer"
                      role="timer"
                      aria-live="off"
                      aria-label="Remaining practice time"
                    >
                      {timeText(remaining)}
                    </span>
                  </div>
                  <progress max={duration} value={elapsed} aria-label="Practice time elapsed" />
                  <div className="lab-actions">
                    <button
                      className="button primary small"
                      onClick={() => {
                        if (deadline !== null) {
                          setRemaining(remainingSeconds(deadline, Date.now()));
                          changeDeadline(null);
                        } else {
                          const left = remaining === 0 ? duration : remaining;
                          setRemaining(left);
                          changeDeadline(Date.now() + left * 1000);
                        }
                      }}
                    >
                      {deadline !== null ? (
                        <>
                          <Square size={14} /> Pause
                        </>
                      ) : (
                        <>
                          <Play size={14} /> {remaining === 0 ? "Start again" : "Start timer"}
                        </>
                      )}
                    </button>
                    <button className="button small" onClick={() => resetTimer()}>
                      <RotateCcw size={14} /> Reset timer
                    </button>
                  </div>
                  <p className="interview-timer-status" role="status">
                    {remaining === 0
                      ? "Time ended. Finish the thought, then review the evidence."
                      : deadline !== null
                        ? "Timer running. Open the coding bench in another tab; keep this page open."
                        : "Ready or paused. Hints and references are optional assistance, not independent evidence."}
                  </p>
                  <span className="eyebrow">{selectedDrill.pattern.toUpperCase()}</span>
                  <h3>{selectedExercise.title}</h3>
                  <p>{selectedExercise.contract}</p>
                  <div className="interview-invariant">
                    <strong>What to defend</strong>
                    <p>{selectedDrill.focus}</p>
                  </div>
                  <Link
                    className="button primary"
                    href={"/practice?exercise=" + drillId}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open coding bench in a new tab <ArrowUpRight size={15} />
                  </Link>
                  {timerMode === "mock" && (
                    <div className="interview-mock-stages">
                      {mockStages.map((stage, index) => (
                        <div
                          key={stage.title}
                          className={
                            index === (activeStage < 0 ? mockStages.length - 1 : activeStage)
                              ? "active"
                              : ""
                          }
                        >
                          <span>{stage.minutes}m</span>
                          <div>
                            <strong>{stage.title}</strong>
                            <p>{stage.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <details>
                    <summary>Debrief the round</summary>
                    <ul>
                      <li>Did I clarify the contract and trace a counterexample before coding?</li>
                      <li>Can I state the invariant and defend time/space complexity?</li>
                      <li>
                        Did I test empty, duplicate, boundary, and failure cases without mutating
                        caller data?
                      </li>
                      <li>Which step needed a hint? What new case will I try tomorrow?</li>
                    </ul>
                  </details>
                  <label className="interview-notes-label">
                    Your mistake log
                    <textarea
                      rows={5}
                      maxLength={6000}
                      placeholder="The assumption I missed → a counterexample → the corrected invariant → how I will retest it"
                      value={state.retrospective}
                      onChange={(event) =>
                        update((previous) => ({ ...previous, retrospective: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
          {tab === "rehearse" && (
            <div className="interview-rehearsal">
              <div className="interview-section-heading">
                <div>
                  <span className="eyebrow">RETRIEVAL BEFORE RECOGNITION</span>
                  <h2>Say it clearly. Defend the follow-up.</h2>
                </div>
                <p>
                  Take 3–5 minutes per prompt. Speak first, write a short outline, then compare the
                  guide. These are authored practice scenarios, not confirmed Bask interview
                  questions.
                </p>
              </div>
              <div className="interview-filters">
                <label>
                  Discussion area
                  <select
                    value={group}
                    onChange={(event) => {
                      setGroup(event.target.value);
                      setGuideId(null);
                    }}
                  >
                    {["All", ...new Set(interviewQuestions.map((question) => question.group))].map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="interview-weak-toggle">
                  <input
                    type="checkbox"
                    checked={weakOnly}
                    onChange={(event) => setWeakOnly(event.target.checked)}
                  />{" "}
                  Needs review ({revisit})
                </label>
                {current && (
                  <a className="text-link" href="#interview-answer-outline">
                    Jump to your answer
                  </a>
                )}
                <span>{filtered.length} prompts</span>
              </div>
              <div className="interview-answer-layout">
                <nav aria-label="Interview discussion prompts" className="interview-question-list">
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
                          ? "Not rated"
                          : `Self-rating ${state.answers[question.id].score}/3`}
                      </span>
                    </button>
                  ))}
                </nav>
                {current ? (
                  <article className="interview-answer" key={current.id}>
                    <span className="eyebrow">{current.group}</span>
                    <h3 ref={questionHeading} tabIndex={-1}>
                      {current.title}
                    </h3>
                    <p className="interview-question-prompt">{current.prompt}</p>
                    <label className="interview-notes-label">
                      Your answer outline
                      <textarea
                        id="interview-answer-outline"
                        rows={6}
                        maxLength={6000}
                        value={response?.text ?? ""}
                        onChange={(event) => answer(current.id, { text: event.target.value })}
                        placeholder="Mechanism → concrete example → edge case → tradeoff → verification"
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
                      <small className="interview-assisted">
                        Guide consulted · try the next attempt without it
                      </small>
                    )}
                    {guideId === current.id && (
                      <div className="interview-discussion-guide">
                        <h4>A strong discussion should establish</h4>
                        <ol>
                          {current.guide.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ol>
                        <h4>Follow-up pressure</h4>
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
                    <fieldset className="interview-self-rating">
                      <legend>Rate the explanation you actually gave</legend>
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
                    <div className="interview-study-links">
                      <span className="eyebrow">CLOSE THE GAP</span>
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
                  <p className="interview-empty">
                    No prompts match this filter. Clear “Needs review” to revisit the full
                    discussion bank.
                  </p>
                )}
              </div>
            </div>
          )}
          {tab === "role" && (
            <div className="interview-role">
              <div className="interview-section-heading">
                <div>
                  <span className="eyebrow">BASK HEALTH · ROLE-ALIGNED PRACTICE</span>
                  <h2>Follow one feature all the way through.</h2>
                </div>
                <p>
                  The provided posting combines frontend depth with product ownership and backend
                  boundaries. The plan below is our preparation inference; the interview invitation
                  determines the actual format and permitted tools.
                </p>
              </div>
              <div className="interview-role-summary">
                <div>
                  <h3>What the posting makes relevant</h3>
                  <p>
                    React, Next.js, TypeScript, JavaScript, and Tailwind; typed API and SQL/ORM
                    boundaries; serverless deployment; accessible, reliable product experiences;
                    clear communication and accountable AI-assisted delivery.
                  </p>
                  <a
                    href="https://jobs.bask.health/careers/53FE701745"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the public role <ExternalLink size={14} />
                  </a>
                  <small>
                    The description mentions Prisma and the requirements also mention Drizzle.
                    Prepare the data/transaction concepts; confirm team-specific choices in the
                    interview.
                  </small>
                </div>
                <div>
                  <span className="eyebrow">YOUR PRACTICE BRIEF</span>
                  <h3>Reschedule an appointment in a multi-tenant dashboard.</h3>
                  <p>
                    Use invented records. Clarify who can act, the slot invariant, the UI states,
                    acceptable staleness, concurrent requests, and recovery after an uncertain
                    response. State assumptions instead of inventing medical or regulatory
                    guarantees.
                  </p>
                </div>
              </div>
              <div
                className="interview-command-map"
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
              <article className="interview-boundary-detail">
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
                  production booking service.
                </small>
              </article>
              <div className="interview-role-prompts">
                {["system-booking", "api-trust", "system-cache", "own-ai"].map((id) => {
                  const question = interviewQuestions.find((item) => item.id === id)!;
                  return (
                    <button key={id} onClick={() => openQuestion(id)}>
                      <CheckCircle2 size={18} />
                      <strong>{question.title}</strong>
                      <ArrowRight size={16} />
                    </button>
                  );
                })}
              </div>
              <div className="interview-callout">
                <h3>Prepare questions that reveal engineering judgment.</h3>
                <ul>
                  <li>What does strong ownership look like in the first month?</li>
                  <li>
                    Which frontend reliability, performance, or accessibility problem is most costly
                    today?
                  </li>
                  <li>How are tenant boundaries and data-changing operations verified?</li>
                  <li>
                    How does the team review AI-assisted changes and validate them with users?
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
      <p className="interview-footnote">
        Timers are session-only; keep this page open and use a new tab for coding. Practiced blocks
        and explanation ratings are your own records. Behavioral checks cover listed cases; they do
        not certify interview readiness. Keep examples anonymized and follow the interviewer’s tool
        policy.
      </p>
    </div>
  );
}
