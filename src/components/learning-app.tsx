"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { version as releaseVersion } from "../../package.json";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Layers3,
  LayoutGrid,
  Lightbulb,
  Menu,
  Network,
  Search,
  Settings2,
  Terminal,
  X,
} from "lucide-react";
import { getLesson, getTrackLessons, lessons, totalMinutes } from "@/content";
import { tracks, type Lesson, type TrackId } from "@/lib/types";
import { useStudy, type Study } from "@/lib/study";
import { ArchitectureStudio } from "./architecture-studio";
import { CodeBlock } from "./code-block";
import { CodeProject } from "./code-project";
import { FailureCase } from "./failure-case";
import { EventLoopLab, Lab } from "./labs";
import { playgroundUrl } from "@/playground/presets";
import { JavaScriptPath } from "./javascript-path";
import { jsPathSlugs, jsStages } from "@/content/javascript-path";
import { exercises } from "@/content/training";

const TrainingStudio = dynamic(() => import("./training-studio"), {
  ssr: false,
  loading: () => <p className="muted">Loading the training studio…</p>,
});

const InterviewHub = dynamic(() => import("./interview-hub"), {
  ssr: false,
  loading: () => <p className="muted">Loading your interview workspace…</p>,
});

const Playground = dynamic(() => import("./playground"), {
  ssr: false,
  loading: () => <p className="muted">Loading the execution workbench…</p>,
});

type View =
  | "overview"
  | "javascript"
  | "library"
  | "labs"
  | "playground"
  | "practice"
  | "interview"
  | "architecture"
  | "saved"
  | "progress"
  | "glossary"
  | "lesson";
const nav = [
  { id: "overview", href: "/", label: "Overview", icon: LayoutGrid },
  { id: "javascript", href: "/javascript", label: "JavaScript mastery", icon: GraduationCap },
  { id: "library", href: "/library", label: "Knowledge map", icon: Network },
  { id: "labs", href: "/labs", label: "Interactive labs", icon: FlaskConical },
  { id: "playground", href: "/playground", label: "Code playground", icon: Terminal },
  { id: "practice", href: "/practice", label: "Training studio", icon: CheckCircle2 },
  { id: "interview", href: "/interview", label: "Interview sprint", icon: Clock3 },
  { id: "architecture", href: "/architecture", label: "Architecture studio", icon: GitBranch },
];
export function LearningApp({ view, slug }: { view: View; slug?: string }) {
  const studyState = useStudy();
  const { study, toggle } = studyState;
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const current = slug ? getLesson(slug) : undefined;
  const track = tracks.find((t) => t.id === current?.track);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const closeOnDesktop = () => {
      if (!mobile.matches) setMobileOpen(false);
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = sidebarRef.current;
    const focusable = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>("a[href],button:not(:disabled)") ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const controls = focusable();
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      menuRef.current?.focus();
    };
  }, [mobileOpen]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (slug && studyState.ready) studyState.visit(slug);
  }, [slug, studyState.ready]); // visit only when hydration and slug change
  const percent = Math.round((study.completed.length / lessons.length) * 100);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="workspace-navigation"
        aria-label="Workspace navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) setMobileOpen(false);
        }}
      >
        <button
          className="icon-button drawer-close"
          aria-label="Close navigation drawer"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
        <Link href="/" className="brand" aria-label="Under the Hood home">
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          <span>
            under the hood<span className="brand-dot">.</span>
            <small>THE ENGINEERING FIELD GUIDE</small>
          </span>
        </Link>
        <div className="edition">
          <span className="live-dot" />
          SENIOR EDITION<span className="mono">v{releaseVersion}</span>
        </div>
        <nav aria-label="Main navigation">
          <span className="nav-heading">WORKSPACE</span>
          {nav.map((item) => (
            <Link
              className={`nav-item ${view === item.id ? "active" : ""}`}
              href={item.href}
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.id === "labs" && <span className="nav-count">{labSlugs.length}</span>}
              {view === item.id && <span className="active-dot" />}
            </Link>
          ))}
          <div className="nav-divider" />
          <span className="nav-heading">EXPLORE THE STACK</span>
          {tracks.map((t) => (
            <Link
              href={`/library?track=${t.id}`}
              key={t.id}
              className={`track-nav ${current?.track === t.id ? "current" : ""}`}
            >
              <span className="track-mini" style={{ color: t.color }}>
                {t.symbol}
              </span>
              <span>{t.short}</span>
              <ChevronRight size={12} />
            </Link>
          ))}
          <div className="nav-divider" />
          <Link className={`nav-item ${view === "saved" ? "active" : ""}`} href="/saved">
            <Bookmark size={17} />
            <span>Saved lessons</span>
            <span className="nav-count">{study.saved.length}</span>
          </Link>
          <Link className={`nav-item ${view === "glossary" ? "active" : ""}`} href="/glossary">
            <BookOpen size={17} />
            <span>Glossary</span>
          </Link>
        </nav>
        <Link className="sidebar-progress" href="/progress">
          <div>
            <GraduationCap size={17} />
            <span>Your learning path</span>
            <ArrowUpRight size={14} />
          </div>
          <p>
            <strong>{study.completed.length}</strong> / {lessons.length} lessons completed
          </p>
          <div className="progress-track">
            <span style={{ width: `${percent}%` }} />
          </div>
          <small>Understanding is built, one layer at a time.</small>
        </Link>
        <div className="sidebar-footer">
          <span className="avatar">Y</span>
          <div>
            <strong>Your workspace</strong>
            <span>Progress stored on this browser</span>
          </div>
          <Settings2 size={15} />
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="workspace-navigation"
              ref={menuRef}
            >
              <Menu size={20} />
            </button>
            <Layers3 size={16} />
            <span>Field guide</span>
            <ChevronRight size={13} />
            <strong>
              {current
                ? track?.short
                : view === "overview"
                  ? "Overview"
                  : view === "library"
                    ? "Knowledge map"
                    : view === "architecture"
                      ? "Architecture studio"
                      : view === "labs"
                        ? "Interactive labs"
                        : view === "playground"
                          ? "Code playground"
                          : view === "interview"
                            ? "Interview sprint"
                            : view === "practice"
                              ? "Training studio"
                              : view === "javascript"
                                ? "JavaScript mastery"
                                : view === "progress"
                                  ? "Learning path"
                                  : view === "saved"
                                    ? "Saved lessons"
                                    : "Glossary"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              aria-label="Search the curriculum"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Search anything…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-divider" />
            <a
              href="https://github.com/vercel/next.js"
              target="_blank"
              rel="noreferrer"
              className="version-link"
            >
              Next.js 16.4
              <ArrowUpRight size={12} />
            </a>
          </div>
        </header>
        <main id="main" className={`main-content ${view === "lesson" ? "lesson-content" : ""}`}>
          {studyState.storageError && (
            <div className="storage-warning" role="status">
              Browser storage is unavailable. Your work remains in this session; export notes before
              closing.
            </div>
          )}
          {view === "overview" && <Overview study={study} />}
          {view === "javascript" && <JavaScriptPath study={study} />}
          {view === "library" && (
            <Suspense fallback={<p className="muted">Loading the knowledge map…</p>}>
              <Library study={study} toggleSaved={(slug) => toggle("saved", slug)} />
            </Suspense>
          )}
          {view === "labs" && <LabsView />}
          {view === "interview" && (
            <Suspense fallback={<p>Loading your interview preparation…</p>}>
              <InterviewHub />
            </Suspense>
          )}
          {view === "practice" && (
            <Suspense fallback={<p>Loading your exercises…</p>}>
              <TrainingStudio />
            </Suspense>
          )}
          {view === "playground" && (
            <Suspense fallback={<p>Loading your experiment…</p>}>
              <Playground />
            </Suspense>
          )}
          {view === "architecture" && (
            <>
              <PageIntro
                eyebrow="DECISIONS BEFORE DIRECTORIES"
                title="Architecture is a tradeoff."
                description="Explore constraints, compare costs, and choose boundaries deliberately. Then refactor the implementation with concrete SOLID examples."
              />
              <ArchitectureStudio />
            </>
          )}
          {view === "saved" && (
            <>
              <PageIntro
                eyebrow="YOUR REFERENCE SHELF"
                title="Keep the useful things close."
                description="Lessons you have bookmarked, ready for your next design review or debugging session."
              />
              <LessonList
                items={lessons.filter((l) => study.saved.includes(l.slug))}
                study={study}
                toggleSaved={(s) => toggle("saved", s)}
                empty="No saved lessons yet. Use the bookmark control on any lesson to add it here."
              />
            </>
          )}
          {view === "progress" && <ProgressView study={study} reset={studyState.reset} />}
          {view === "glossary" && <Glossary />}
          {view === "lesson" && current && (
            <LessonView
              key={current.slug}
              lesson={current}
              study={study}
              toggle={toggle}
              setNote={studyState.setNote}
            />
          )}
        </main>
        <footer className="main-footer">
          <span>
            <span className="live-dot" />
            Built for understanding. Designed for depth.
          </span>
          <span>
            JavaScript · React 19.3 · Next.js 16.4<span className="footer-separator">/</span>
            {lessons.length} lessons, always at your pace.
          </span>
        </footer>
      </div>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow accent">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Overview({ study }: { study: Study }) {
  const resume = getLesson(study.lastLesson ?? "language-and-hosts")!;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="live-dot" />
            FOR ENGINEERS WHO ASK WHY
            <ArrowUpRight size={12} />
          </div>
          <h1>
            Beyond the syntax.
            <br />
            <span>Into the system.</span>
          </h1>
          <p>
            The interactive field guide to what happens under the hood.
            <br className="desktop-break" /> From the JavaScript engine to your architecture
            decisions.
          </p>
          <div className="hero-actions">
            <Link href={`/learn/${resume.slug}`} className="button primary">
              {study.lastLesson ? "Continue exploring" : "Start with JavaScript"}
              <ArrowRight size={16} />
            </Link>
            <Link href="/library" className="button ghost">
              View the knowledge map
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{lessons.length}</strong>
              <small>in-depth lessons</small>
            </div>
            <div>
              <strong>10</strong>
              <small>connected tracks</small>
            </div>
            <div>
              <strong>9</strong>
              <small>interactive lab models</small>
            </div>
            <div>
              <strong>{Math.round(totalMinutes / 60)}h</strong>
              <small>estimated study & practice</small>
            </div>
          </div>
        </div>
        <StackIllustration />
      </section>
      <div className="philosophy-bar">
        <span>
          <Lightbulb size={16} />
          Mental models over memorization.
        </span>
        <span>
          <GitBranch size={16} />
          Tradeoffs over silver bullets.
        </span>
        <span>
          <Terminal size={16} />
          Mechanisms you can inspect.
        </span>
      </div>
      <section className="featured-section">
        <div className="js-home-banner">
          <span className="js-banner-mark">JS</span>
          <div>
            <span className="eyebrow js-gold">START HERE · THE LANGUAGE COMES FIRST</span>
            <h2>From your first line to the engine behind it.</h2>
            <p>
              {jsPathSlugs.length} connected chapters. Six stages. Worked examples, edge-case
              challenges, and runnable experiments.
            </p>
          </div>
          <Link href="/javascript" className="button small primary">
            Explore JavaScript
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <PlaygroundBanner />
        <div className="interview-home-link">
          <Clock3 size={24} />
          <div>
            <span className="eyebrow">THE TECHNICAL ROUND</span>
            <strong>Turn understanding into an answer you can defend.</strong>
            <p>Eight coding patterns, a timed mock, and a role-aligned preparation sprint.</p>
          </div>
          <Link href="/interview">
            Start interview sprint <ArrowRight size={16} />
          </Link>
        </div>
        <div className="training-home-link">
          <CheckCircle2 size={20} />
          <div>
            <strong>Build evidence for your understanding.</strong>
            <span>
              12 repair exercises · 46 behavioral checks · a competency map across every track
            </span>
          </div>
          <Link href="/practice">
            Enter training studio
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow">DON’T JUST READ IT. TRACE IT.</span>
            <h2>A runtime you can reason about.</h2>
          </div>
          <Link className="text-link" href="/labs">
            All interactive labs
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="feature-intro">
          <span className="topic-label js-label">JS</span>
          <div>
            <h3>The event loop, made visible</h3>
            <p>Watch the stack, queues, and host timers change as each line executes.</p>
          </div>
          <Link href="/learn/event-loop" className="button small">
            Open full lesson
            <ArrowRight size={14} />
          </Link>
        </div>
        <EventLoopLab compact />
      </section>
      <section className="tracks-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BUILD THE COMPLETE MENTAL MODEL</span>
            <h2>One stack. Every layer connected.</h2>
          </div>
          <Link className="text-link" href="/library">
            Explore all {lessons.length} lessons
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="track-cards">
          {tracks.map((t, i) => {
            const count = getTrackLessons(t.id).length;
            const completed = getTrackLessons(t.id).filter((l) =>
              study.completed.includes(l.slug),
            ).length;
            return (
              <Link
                className="track-card"
                href={`/library?track=${t.id}`}
                key={t.id}
                style={{ "--track-color": t.color } as React.CSSProperties}
              >
                <div className="track-card-top">
                  <span className="track-symbol">{t.symbol}</span>
                  <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                  <ArrowUpRight size={17} />
                </div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <div className="track-card-bottom">
                  <span>{count} lessons</span>
                  <span>
                    {completed ? `${completed}/${count} explored` : "Explore track"}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="architecture-banner">
        <div className="architecture-banner-icon">
          <GitBranch size={36} />
        </div>
        <div>
          <span className="eyebrow accent">ENGINEERING JUDGMENT, MADE EXPLICIT</span>
          <h2>
            Know when to use the pattern.
            <br />
            And when to leave it out.
          </h2>
          <p>
            Architecture scenarios, concrete SOLID refactors, and the costs behind every choice.
          </p>
        </div>
        <Link href="/architecture" className="button primary">
          Enter architecture studio
          <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}

function StackIllustration() {
  return (
    <div className="stack-art" aria-label="Connected layers: language, UI, framework, and systems">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-label top">A SYSTEM, NOT A BLACK BOX</div>
      <svg viewBox="0 0 450 360" className="stack-svg" role="img">
        <title>The web engineering stack</title>
        <defs>
          <linearGradient id="stack-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#daca8b" stopOpacity=".18" />
            <stop offset="1" stopColor="#a6be98" stopOpacity=".04" />
          </linearGradient>
        </defs>
        <path d="M225 40 L395 130 L225 220 L55 130 Z" fill="url(#stack-grad)" stroke="#8c8157" />
        <path
          d="M55 130 L55 154 L225 244 L395 154 L395 130 M225 220 V244"
          fill="#181a16"
          stroke="#57533f"
        />
        <path
          d="M55 181 L225 271 L395 181 L395 205 L225 295 L55 205 Z"
          fill="#151a1b"
          stroke="#39545c"
        />
        <path
          d="M55 231 L225 321 L395 231 L395 255 L225 345 L55 255 Z"
          fill="#171818"
          stroke="#444a47"
        />
        <path
          d="M55 181 L225 91 L395 181 L225 271 Z"
          fill="#172126"
          fillOpacity=".64"
          stroke="#436270"
        />
        <path
          d="M55 231 L225 141 L395 231 L225 321 Z"
          fill="#1b201b"
          fillOpacity=".75"
          stroke="#4f6250"
        />
        <path
          d="M225 40 L395 130 L225 220 L55 130 Z"
          fill="#1d211b"
          fillOpacity=".86"
          stroke="#9f9568"
        />
        <path
          d="M150 120 L225 80 L300 120 L225 160 Z"
          fill="#d8cc8e"
          fillOpacity=".12"
          stroke="#b0a366"
          strokeDasharray="3 4"
        />
        <text
          x="225"
          y="129"
          textAnchor="middle"
          fill="#e2d499"
          fontSize="34"
          fontWeight="700"
          fontFamily="monospace"
        >
          JS
        </text>
        <path d="M225 160 V187" stroke="#c9be88" strokeDasharray="3 4" />
        <circle cx="225" cy="190" r="3" fill="#d6cb91" />
        <path d="M65 115 H20 V79" stroke="#737454" fill="none" />
        <circle cx="65" cy="115" r="3" fill="#d1c582" />
        <path d="M385 180 H425 V157" stroke="#507484" fill="none" />
        <circle cx="385" cy="180" r="3" fill="#8ab9c9" />
        <path d="M70 260 H20 V290" stroke="#537556" fill="none" />
        <circle cx="70" cy="260" r="3" fill="#a0c693" />
      </svg>
      <span className="art-tag tag-js">
        <b>01</b>Language & runtime
      </span>
      <span className="art-tag tag-react">
        <b>02</b>React & rendering
      </span>
      <span className="art-tag tag-next">
        <b>03</b>Framework & systems
      </span>
      <div className="art-status">
        <span className="live-dot" />
        ALL LAYERS CONNECTED<span>↗</span>
      </div>
    </div>
  );
}

function PlaygroundBanner() {
  return (
    <div className="playground-banner">
      <div>
        <span className="eyebrow accent">REAL EXECUTION · EDITABLE SOURCE</span>
        <h2>Turn an assumption into an experiment.</h2>
        <p>
          Change native scheduling, mount a React tree, or rewrite a caching policy. Inspect the
          trace your code produces.
        </p>
      </div>
      <Link className="button primary small" href="/playground">
        <Terminal size={16} />
        Open code playground
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
function Library({ study, toggleSaved }: { study: Study; toggleSaved: (slug: string) => void }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<TrackId | "all">("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("list");
  const [deepOnly, setDeepOnly] = useState(false);
  useEffect(() => {
    const value = searchParams.get("track");
    setFilter(tracks.some((t) => t.id === value) ? (value as TrackId) : "all");
  }, [searchParams]);
  const filtered = lessons.filter(
    (l) =>
      (filter === "all" || l.track === filter) &&
      (!deepOnly || l.level === "Deep dive") &&
      `${l.title} ${l.description} ${l.mental} ${l.pitfalls.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function changeTrack(id: TrackId | "all") {
    setFilter(id);
    const u = new URL(window.location.href);
    if (id === "all") u.searchParams.delete("track");
    else u.searchParams.set("track", id);
    window.history.replaceState(null, "", u);
  }
  return (
    <>
      <PageIntro
        eyebrow="THE CONNECTED ENGINEERING CURRICULUM"
        title="See the whole system."
        description={`${lessons.length} lessons across ${tracks.length} tracks. Follow the sequence, inspect an advanced boundary, or find the mechanism behind the production problem in front of you.`}
      />
      <div className="library-toolbar">
        <div className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a concept, mechanism, or failure mode…"
            aria-label="Filter lessons"
          />
          {query && (
            <button className="icon-button" onClick={() => setQuery("")} aria-label="Clear filter">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="segmented">
          <button
            aria-pressed={mode === "list"}
            className={mode === "list" ? "selected" : ""}
            onClick={() => setMode("list")}
          >
            <BookOpen size={15} />
            Curriculum
          </button>
          <button
            aria-pressed={mode === "map"}
            className={mode === "map" ? "selected" : ""}
            onClick={() => setMode("map")}
          >
            <Network size={15} />
            System map
          </button>
        </div>
      </div>
      {mode === "map" && <KnowledgeGraph selected={filter} onSelect={changeTrack} />}
      <div className="filter-chips" role="group" aria-label="Filter by track">
        <button
          aria-pressed={filter === "all"}
          onClick={() => changeTrack("all")}
          className={filter === "all" ? "selected" : ""}
        >
          All tracks<span>{lessons.length}</span>
        </button>
        {tracks.map((t) => (
          <button
            aria-pressed={filter === t.id}
            className={filter === t.id ? "selected" : ""}
            onClick={() => changeTrack(t.id)}
            key={t.id}
          >
            <span className="chip-dot" style={{ background: t.color }} />
            {t.short}
          </button>
        ))}
      </div>
      <div className="depth-filter">
        <label>
          <input
            type="checkbox"
            checked={deepOnly}
            onChange={(e) => setDeepOnly(e.target.checked)}
          />
          <span>
            Deep dives only <strong>{lessons.filter((l) => l.level === "Deep dive").length}</strong>
          </span>
        </label>
        <p>
          Focus on language internals, hard failure cases, speculative rendering, deployment skew,
          and distributed ownership. Follow prerequisite links and test the contract through its
          examples.
        </p>
      </div>
      <div className="results-heading">
        <span>
          {filtered.length} lessons
          <span className="muted">
            {" "}
            ·{" "}
            {filter === "all"
              ? "All engineering tracks"
              : tracks.find((t) => t.id === filter)?.name}
          </span>
        </span>
        <span className="tiny muted">Concept → mechanism → code → judgment</span>
      </div>
      <LessonList
        items={filtered}
        study={study}
        toggleSaved={toggleSaved}
        empty="No concepts match this filter. Try a broader term or choose all tracks."
      />
    </>
  );
}

function LessonList({
  items,
  study,
  toggleSaved,
  empty,
}: {
  items: Lesson[];
  study: Study;
  toggleSaved: (slug: string) => void;
  empty: string;
}) {
  return items.length ? (
    <div className="lesson-list">
      {items.map((l, i) => {
        const t = tracks.find((t) => t.id === l.track)!;
        return (
          <div className="lesson-row" key={l.slug}>
            <span className="lesson-row-index mono">
              {study.completed.includes(l.slug) ? (
                <CheckCircle2 size={17} className="accent" />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <span className="lesson-row-symbol" style={{ color: t.color }}>
              {t.symbol}
            </span>
            <Link href={`/learn/${l.slug}`} className="lesson-row-main">
              <h3>{l.title}</h3>
              <p>{l.description}</p>
              {l.invariant && <span className="boundary-badge">ADVANCED BOUNDARY</span>}
              <span className="mobile-track-label">{t.short}</span>
            </Link>
            <span className="lesson-track-label" style={{ color: t.color }}>
              {t.short}
            </span>
            <span className="lesson-duration">
              <Clock3 size={12} />
              {l.minutes} min
            </span>
            <button
              className={`icon-button bookmark-button ${study.saved.includes(l.slug) ? "saved" : ""}`}
              aria-label={`${study.saved.includes(l.slug) ? "Unsave" : "Save"} ${l.title}`}
              aria-pressed={study.saved.includes(l.slug)}
              onClick={() => toggleSaved(l.slug)}
            >
              <Bookmark size={16} fill={study.saved.includes(l.slug) ? "currentColor" : "none"} />
            </button>
            <Link
              href={`/learn/${l.slug}`}
              className="icon-button row-open"
              aria-label={`Open ${l.title}`}
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="empty-state">
      <Bookmark size={28} />
      <h2>Room for your next discovery.</h2>
      <p>{empty}</p>
      <Link href="/library" className="button primary small">
        Explore the curriculum
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
function KnowledgeGraph({
  selected,
  onSelect,
}: {
  selected: TrackId | "all";
  onSelect: (id: TrackId | "all") => void;
}) {
  const [detail, setDetail] = useState(0);
  const nodes = tracks.map((t, i) => ({
    ...t,
    x: 420 + Math.cos((i / 10) * Math.PI * 2 - Math.PI / 2) * 300,
    y: 235 + Math.sin((i / 10) * Math.PI * 2 - Math.PI / 2) * 175,
  }));
  return (
    <div className="knowledge-graph">
      <div className="graph-canvas">
        <svg viewBox="0 0 840 470" role="img" aria-label="Connected engineering tracks">
          <defs>
            <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r=".7" fill="#343833" />
            </pattern>
          </defs>
          <rect width="840" height="470" fill="url(#dots)" />
          {nodes.map((n, i) => (
            <g key={n.id}>
              <path
                d={`M420 235 Q${(420 + n.x) / 2} 235 ${n.x} ${n.y}`}
                stroke={selected === n.id ? n.color : "#40453e"}
                fill="none"
                strokeDasharray={i % 2 ? "4 5" : undefined}
              />
              <line
                x1={n.x}
                y1={n.y}
                x2={nodes[(i + 1) % nodes.length].x}
                y2={nodes[(i + 1) % nodes.length].y}
                stroke="#2b302b"
              />
            </g>
          ))}
          <circle cx="420" cy="235" r="48" fill="#21271e" stroke="#9cae81" />
          <text x="420" y="231" textAnchor="middle" fill="#d8e5bd" fontSize="15" fontWeight="600">
            The web
          </text>
          <text x="420" y="249" textAnchor="middle" fill="#a3ac99" fontSize="11">
            engineering stack
          </text>
          {nodes.map((n, i) => (
            <g
              key={n.id}
              className="graph-node"
              tabIndex={0}
              role="button"
              aria-label={`Explore ${n.name}`}
              onClick={() => {
                onSelect(n.id);
                setDetail(i);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(n.id);
                  setDetail(i);
                }
              }}
            >
              <rect
                x={n.x - 79}
                y={n.y - 23}
                width="158"
                height="46"
                rx="8"
                fill={selected === n.id ? "#2b3225" : "#191d19"}
                stroke={selected === n.id ? n.color : "#41483f"}
              />
              <circle cx={n.x - 61} cy={n.y} r="3" fill={n.color} />
              <text x={n.x + 5} y={n.y + 4} fill="#d8ddd2" textAnchor="middle" fontSize="12">
                {n.short}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="graph-detail">
        <span className="eyebrow accent">SELECT A BOUNDARY</span>
        <h3>{tracks[detail].name}</h3>
        <p>{tracks[detail].description}</p>
        <span className="tiny muted">
          Select a node to filter the curriculum below. Lines show conceptual relationships, not
          strict prerequisites.
        </span>
      </div>
    </div>
  );
}

const labSlugs = [
  "event-loop",
  "callback-boundaries-and-microtasks",
  "javascript-engine",
  "memory-and-garbage-collection",
  "render-and-commit",
  "request-journey",
  "sessions-and-authentication",
  "nextjs-caching",
  "streaming-boundaries",
  "state-machines",
];
function LabsView() {
  const [selected, setSelected] = useState("event-loop");
  const l = getLesson(selected)!;
  return (
    <>
      <PageIntro
        eyebrow="MAKE THE INVISIBLE INSPECTABLE"
        title="Learn it by changing it."
        description={`${labSlugs.length} interactive labs. Inspect a model or observe real browser event dispatch; test which boundary explains the result.`}
      />
      <PlaygroundBanner />
      <div className="lab-workspace">
        <div className="lab-selector">
          {labSlugs.map((slug, i) => {
            const item = getLesson(slug)!;
            return (
              <button
                key={slug}
                aria-pressed={selected === slug}
                className={selected === slug ? "selected" : ""}
                onClick={() => setSelected(slug)}
              >
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{tracks.find((t) => t.id === item.track)?.short}</small>
                </div>
                <ChevronRight size={15} />
              </button>
            );
          })}
        </div>
        <div className="lab-main">
          <div className="section-heading">
            <div>
              <h2>{l.title}</h2>
              <p>{l.description}</p>
            </div>
            <Link href={`/learn/${l.slug}`} className="text-link">
              Full lesson
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <Lab key={l.slug} lesson={l} />
          <div className="callout">
            <Lightbulb size={20} />
            <div>
              <strong>Turn observation into an explanation</strong>
              <p>{l.practice}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LessonView({
  lesson,
  study,
  toggle,
  setNote,
}: {
  lesson: Lesson;
  study: Study;
  toggle: (field: "completed" | "saved", slug: string) => void;
  setNote: (slug: string, value: string) => void;
}) {
  const [tab, setTab] = useState("learn");
  const t = tracks.find((t) => t.id === lesson.track)!;
  const inJSPath = jsPathSlugs.includes(lesson.slug);
  const sequence = inJSPath ? jsPathSlugs.map((slug) => getLesson(slug)!) : lessons;
  const index = sequence.findIndex((l) => l.slug === lesson.slug);
  const next = sequence[index + 1];
  const previous = sequence[index - 1];
  const jsStage = inJSPath
    ? jsStages.find((stage) => stage.slugs.includes(lesson.slug))
    : undefined;
  const completed = study.completed.includes(lesson.slug);
  const saved = study.saved.includes(lesson.slug);
  const showLearn = tab === "learn";
  const showPractice = tab === "learn" || tab === "practice";
  return (
    <>
      <div className="lesson-header">
        <Link href={`/library?track=${lesson.track}`} className="back-link">
          <ArrowLeft size={14} />
          {t.name}
        </Link>
        <div className="lesson-meta">
          <span className="topic-label" style={{ color: t.color }}>
            {t.symbol}
          </span>
          <span>{lesson.level}</span>
          <span>·</span>
          <Clock3 size={13} />
          <span>{lesson.minutes} min estimated study</span>
        </div>
        <h1>{lesson.title}</h1>
        <p>{lesson.description}</p>
        <div className="lesson-header-actions">
          <button
            className={`button small ${completed ? "completed-button" : "primary"}`}
            onClick={() => toggle("completed", lesson.slug)}
          >
            <CheckCircle2 size={15} />
            {completed ? "Completed · undo" : "Mark complete"}
          </button>
          <button
            className={`button small ${saved ? "is-saved" : ""}`}
            onClick={() => toggle("saved", lesson.slug)}
            aria-pressed={saved}
          >
            <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save lesson"}
          </button>
          <span className="tiny muted">
            {inJSPath ? "JavaScript chapter" : "Lesson"} {index + 1} of {sequence.length}
          </span>
        </div>
      </div>
      <div className="lesson-tabs" role="group" aria-label="Lesson views">
        {[
          ["learn", "The deep dive", BookOpen],
          ["lab", "Interactive lab", FlaskConical],
          ["practice", "Code & practice", Terminal],
          ["notes", "Your notes", FileText],
        ].map(([id, label, Icon]) => {
          const I = Icon as typeof BookOpen;
          return (
            <button
              key={id as string}
              onClick={() => setTab(id as string)}
              className={tab === id ? "selected" : ""}
            >
              <I size={15} />
              {label as string}
            </button>
          );
        })}
      </div>
      <div className="lesson-layout">
        {jsStage && (
          <div className="js-lesson-trail">
            <Link href="/javascript">JS mastery path</Link>
            <span>→</span>
            <span>{jsStage.short}</span>
            {playgroundUrl(lesson.slug) && (
              <Link href={playgroundUrl(lesson.slug)!}>
                Run this chapter
                <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        )}
        <article className="lesson-article">
          {showLearn && (
            <>
              <section id="mental-model" className="article-section">
                <span className="eyebrow accent">01 / THE MENTAL MODEL</span>
                <h2>A model you can reason with.</h2>
                <div className="mental-model">
                  <Lightbulb size={21} />
                  <p>{lesson.mental}</p>
                </div>
                {lesson.invariant && (
                  <div className="lesson-invariant">
                    <span className="eyebrow accent">THE INVARIANT TO PROTECT</span>
                    <p>{lesson.invariant}</p>
                  </div>
                )}
                {Boolean(lesson.prerequisites?.length) && (
                  <div className="prerequisite-links">
                    <span>Connect the prerequisites</span>
                    {lesson.prerequisites!.map((slug) => (
                      <Link key={slug} href={`/learn/${slug}`}>
                        {getLesson(slug)?.title}
                        <ArrowUpRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
              <section id="mechanism" className="article-section">
                <span className="eyebrow accent">02 / BEHIND THE SCENES</span>
                <h2>Follow the mechanism.</h2>
                <div className="mechanism-steps">
                  {lesson.steps.map((s, i) => (
                    <div className="mechanism-step" key={s.title}>
                      <span className="mechanism-index">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {(showLearn || tab === "lab") && (
            <section id="interactive" className="article-section">
              <span className="eyebrow accent">03 / INSPECT THE MODEL</span>
              <h2>Make the behavior visible.</h2>
              {playgroundUrl(lesson.slug) && (
                <Link
                  className="button small playground-lesson-link"
                  href={playgroundUrl(lesson.slug)!}
                >
                  <Terminal size={15} />
                  Edit & run a live experiment
                  <ArrowUpRight size={14} />
                </Link>
              )}
              <Lab lesson={lesson} />
            </section>
          )}
          {showPractice && (
            <>
              <section id="code" className="article-section">
                <span className="eyebrow accent">04 / CONCRETE EXAMPLE</span>
                <h2>Connect the idea to code.</h2>
                {lesson.execution && (
                  <div className="example-environment">
                    <span className="eyebrow">EXECUTION CONTEXT</span>
                    <strong>
                      {lesson.execution === "worker"
                        ? "Self-contained worker example"
                        : lesson.execution === "browser"
                          ? "Browser DOM environment required"
                          : lesson.execution === "node"
                            ? "Node.js environment required"
                            : "Separate files / integration example"}
                    </strong>
                    {lesson.execution === "worker" && (
                      <Link className="text-link" href={playgroundUrl(lesson.slug)!}>
                        Edit & run this example
                        <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>
                )}
                {lesson.context && <p className="example-note">{lesson.context}</p>}
                {lesson.files ? (
                  <CodeProject
                    key={lesson.slug}
                    files={[
                      {
                        name: lesson.filename ?? "entry.mjs",
                        language: lesson.language,
                        code: lesson.code,
                      },
                      ...lesson.files,
                    ]}
                  />
                ) : (
                  <CodeBlock
                    code={lesson.code}
                    language={lesson.language}
                    title={
                      lesson.filename ??
                      `${lesson.slug}.${lesson.language === "typescript" ? "tsx" : lesson.language === "javascript" ? "js" : lesson.language === "sql" ? "sql" : lesson.language === "json" ? "json" : "txt"}`
                    }
                  />
                )}
                {lesson.output && (
                  <div className="expected-output">
                    <span className="eyebrow">
                      {lesson.files ? "EXPECTED PROJECT OUTPUT" : "EXPECTED OUTPUT"}
                    </span>
                    <pre>{lesson.output}</pre>
                  </div>
                )}
                {lesson.execution === "reference" && !lesson.context && (
                  <p className="example-note">
                    Examples isolate the mechanism. Names such as db, schemas, services, and domain
                    types represent application dependencies; these snippets are reference examples
                    rather than a runnable server implementation.
                  </p>
                )}
                {lesson.challenge && (
                  <div className="js-challenge">
                    <span className="eyebrow js-gold">PREDICT BEFORE YOU REVEAL</span>
                    <h3>{lesson.challenge.prompt}</h3>
                    <details>
                      <summary>
                        Reveal the worked answer
                        <ChevronRight size={15} />
                      </summary>
                      {lesson.challenge.kind === "explanation" ? (
                        <p className="worked-answer">{lesson.challenge.solution}</p>
                      ) : (
                        <CodeBlock
                          code={lesson.challenge.solution}
                          language="javascript"
                          title="worked-answer.js"
                        />
                      )}
                      <p>{lesson.challenge.explanation}</p>
                    </details>
                  </div>
                )}
              </section>
              <section id="pitfalls" className="article-section">
                <span className="eyebrow accent">05 / THE PRODUCTION REVIEW</span>
                <h2>Where experienced teams get caught.</h2>
                <div className="pitfall-list">
                  {lesson.pitfalls.map((p, i) => (
                    <div key={p}>
                      <span className="mono">0{i + 1}</span>
                      <p>{p}</p>
                    </div>
                  ))}
                </div>
                {lesson.decision && (
                  <div className="decision-guide">
                    <div>
                      <span className="decision-label positive">USE WHEN</span>
                      <p>{lesson.decision.use}</p>
                    </div>
                    <div>
                      <span className="decision-label warning">RECONSIDER WHEN</span>
                      <p>{lesson.decision.avoid}</p>
                    </div>
                    <div>
                      <span className="decision-label">THE TRADEOFF</span>
                      <p>{lesson.decision.tradeoff}</p>
                    </div>
                  </div>
                )}
              </section>
              <FailureCase key={lesson.slug} slug={lesson.slug} />
              <section id="practice" className="article-section">
                <span className="eyebrow accent">06 / APPLY YOUR JUDGMENT</span>
                <h2>Go from explanation to evidence.</h2>
                <div className="practice-card">
                  <Terminal size={22} />
                  <div>
                    <h3>A practical investigation</h3>
                    <p>{lesson.practice}</p>
                    <small>
                      Before you finish: state the invariant, list the failure cases, and explain
                      what your evidence does—and does not—prove.
                    </small>
                  </div>
                </div>
                <Quiz key={lesson.slug} lesson={lesson} />
                {exercises.some((exercise) => exercise.lessons.includes(lesson.slug)) && (
                  <div className="lesson-training-link">
                    <span className="eyebrow accent">TEST THE CONTRACT</span>
                    <h3>Repair it. Run it. Explain it.</h3>
                    {exercises
                      .filter((exercise) => exercise.lessons.includes(lesson.slug))
                      .map((exercise) => (
                        <Link key={exercise.id} href={"/practice?exercise=" + exercise.id}>
                          {exercise.title}
                          <span>{exercise.checks.length} behavioral checks</span>
                          <ArrowRight size={15} />
                        </Link>
                      ))}
                  </div>
                )}
              </section>
              <section id="sources" className="article-section sources-section">
                <span className="eyebrow">REFERENCES & FURTHER READING</span>
                {lesson.sources.map((s) => (
                  <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>
                    <BookOpen size={15} />
                    <span>{s.title}</span>
                    <ExternalLink size={13} />
                  </a>
                ))}
              </section>
            </>
          )}
          {tab === "notes" && (
            <section className="article-section">
              <span className="eyebrow accent">BUILD YOUR OWN FIELD NOTES</span>
              <h2>Capture the reasoning.</h2>
              <p className="muted">
                Saved locally in this browser. Record your mental model, an unresolved question, or
                a decision from your own codebase.
              </p>
              <textarea
                className="notes-editor"
                value={study.notes[lesson.slug] ?? ""}
                onChange={(e) => setNote(lesson.slug, e.target.value)}
                placeholder="What surprised you? Where would this change a decision in your system?"
                aria-label="Lesson notes"
                maxLength={20000}
              />
              <div className="notes-footer">
                <span className="tiny muted">
                  {(study.notes[lesson.slug] ?? "").length} / 20,000 characters · saved
                  automatically when storage is available
                </span>
                <button className="button small" onClick={() => downloadNotes(study)}>
                  <Download size={14} />
                  Export all notes
                </button>
              </div>
            </section>
          )}
          <div className="lesson-completion">
            <div>
              <CheckCircle2 size={24} />
              <div>
                <strong>
                  {completed ? "One more layer understood." : "Can you explain the mechanism?"}
                </strong>
                <p>
                  {completed
                    ? "Your progress is saved on this browser."
                    : "Mark complete when you can reason about the behavior and its limits."}
                </p>
              </div>
            </div>
            <button
              className={`button small ${completed ? "" : "primary"}`}
              onClick={() => toggle("completed", lesson.slug)}
            >
              {completed ? "Undo completion" : "Mark as complete"}
              <Check size={14} />
            </button>
          </div>
          <div className="lesson-pagination">
            {previous ? (
              <Link href={`/learn/${previous.slug}`}>
                <span>
                  <ArrowLeft size={14} />
                  PREVIOUS LESSON
                </span>
                <strong>{previous.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/learn/${next.slug}`}>
                <span>
                  NEXT LESSON
                  <ArrowRight size={14} />
                </span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <Link href="/progress">
                <span>
                  YOUR LEARNING PATH
                  <ArrowRight size={14} />
                </span>
                <strong>Review your progress</strong>
              </Link>
            )}
          </div>
        </article>
        <aside className="lesson-aside">
          <span className="eyebrow">IN THIS LESSON</span>
          {[
            ["mental-model", "The mental model"],
            ["mechanism", "Behind the scenes"],
            ["interactive", "Interactive model"],
            ["code", "Concrete example"],
            ["pitfalls", "Production review"],
            ["practice", "Apply your judgment"],
            ["sources", "Primary sources"],
          ].map(([id, label], i) => (
            <button
              key={id}
              onClick={() => {
                setTab("learn");
                setTimeout(
                  () =>
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  30,
                );
              }}
            >
              <span className="mono">0{i + 1}</span>
              {label}
            </button>
          ))}
          <div className="aside-divider" />
          <div className="aside-tip">
            <Lightbulb size={19} />
            <strong>Learn like an engineer.</strong>
            <p>Predict first. Run the model. Explain the gap. Test the real system.</p>
          </div>
          <div className="aside-progress">
            <span className="eyebrow">TRACK PROGRESS</span>
            <p>
              {study.completed.filter((s) => getLesson(s)?.track === lesson.track).length} /{" "}
              {getTrackLessons(lesson.track).length} lessons complete
            </p>
            <div className="progress-track">
              <span
                style={{
                  width: `${(study.completed.filter((s) => getLesson(s)?.track === lesson.track).length / getTrackLessons(lesson.track).length) * 100}%`,
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
function Quiz({ lesson }: { lesson: Lesson }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const q = lesson.quiz;
  const correct = selected === q.answer;
  return (
    <div className="quiz">
      <span className="eyebrow">
        <CircleHelp size={14} />
        CHECK YOUR MENTAL MODEL
      </span>
      <h3>{q.question}</h3>
      <div className="quiz-options">
        {q.choices.map((c, i) => (
          <label
            className={`${selected === i ? "selected" : ""} ${submitted && i === q.answer ? "correct" : ""} ${submitted && selected === i && !correct ? "incorrect" : ""}`}
            key={c}
          >
            <input
              type="radio"
              name={`quiz-${lesson.slug}`}
              checked={selected === i}
              onChange={() => {
                setSelected(i);
                setSubmitted(false);
              }}
            />
            <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
            <span>{c}</span>
            {submitted && i === q.answer && <CheckCircle2 size={17} />}
          </label>
        ))}
      </div>
      <button
        className="button small primary"
        disabled={selected === null}
        onClick={() => setSubmitted(true)}
      >
        Check explanation
        <ArrowRight size={14} />
      </button>
      {submitted && (
        <div className={`quiz-feedback ${correct ? "correct" : ""}`} role="status">
          <strong>
            {correct ? "That is the right model." : "There is an important distinction."}
          </strong>
          <p>{q.explanation}</p>
        </div>
      )}
    </div>
  );
}
function ProgressView({ study, reset }: { study: Study; reset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageIntro
        eyebrow="UNDERSTANDING IS CUMULATIVE"
        title="Your path through the layers."
        description="Follow the curriculum from language mechanics to system decisions, or choose the track closest to the problem you are solving."
      />
      <div className="progress-summary">
        <div>
          <strong>
            {study.completed.length}
            <small> / {lessons.length}</small>
          </strong>
          <span>lessons completed</span>
        </div>
        <div>
          <strong>{study.saved.length}</strong>
          <span>lessons bookmarked</span>
        </div>
        <div>
          <strong>{Object.values(study.notes).filter(Boolean).length}</strong>
          <span>lessons with field notes</span>
        </div>
        <button className="button small" onClick={() => downloadNotes(study)}>
          <Download size={15} />
          Export notes & progress
        </button>
      </div>
      <div className="learning-path">
        {tracks.map((t, i) => {
          const items = getTrackLessons(t.id);
          const done = items.filter((l) => study.completed.includes(l.slug)).length;
          const next = items.find((l) => !study.completed.includes(l.slug)) ?? items[0];
          return (
            <div className="path-track" key={t.id}>
              <span className="path-index" style={{ color: t.color }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{t.name}</h2>
                <p>{t.description}</p>
                <div className="progress-track">
                  <span style={{ width: `${(done / items.length) * 100}%`, background: t.color }} />
                </div>
                <small>
                  {done} of {items.length} complete · {items.reduce((sum, l) => sum + l.minutes, 0)}{" "}
                  estimated study minutes
                </small>
              </div>
              <Link href={`/learn/${next.slug}`} className="button small">
                {done === items.length ? "Revisit" : done ? "Continue" : "Start track"}
                <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>
      <div className="progress-management">
        <p>
          Progress and notes are stored locally in this browser; they do not sync between devices.
        </p>
        {confirm ? (
          <div className="lab-actions">
            <span>Clear completed lessons, bookmarks, and all notes?</span>
            <button
              className="button small danger"
              onClick={() => {
                reset();
                setConfirm(false);
              }}
            >
              Clear local learning data
            </button>
            <button className="button small" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="text-link muted" onClick={() => setConfirm(true)}>
            Reset local learning data
          </button>
        )}
      </div>
    </>
  );
}
function downloadNotes(study: Study) {
  const text = [
    "# Under the Hood — Field notes",
    "",
    `Completed: ${study.completed.length}/${lessons.length}`,
    "",
    ...lessons
      .filter(
        (l) =>
          study.notes[l.slug] || study.completed.includes(l.slug) || study.saved.includes(l.slug),
      )
      .flatMap((l) => [
        `## ${l.title}`,
        `Completed: ${study.completed.includes(l.slug) ? "yes" : "no"} · Saved: ${study.saved.includes(l.slug) ? "yes" : "no"}`,
        "",
        study.notes[l.slug] ?? "",
        "",
      ]),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "under-the-hood-field-notes.md";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const glossary = [
  [
    "Fencing token",
    "A monotonically ordered ownership token that a protected resource checks to reject stale owners.",
    "leases-and-fencing",
  ],
  [
    "Thenable assimilation",
    "The promise-resolution procedure that adopts the eventual result of an object with a callable then property.",
    "promise-assimilation",
  ],
  [
    "Deployment skew",
    "The coexistence of clients, servers, assets, and representations from different release versions.",
    "deployment-cache-coherence",
  ],
  [
    "Grapheme cluster",
    "A text-segmentation unit approximating a user-perceived character; it can contain multiple code points.",
    "unicode-locale-and-time",
  ],
  [
    "Architecture fitness function",
    "An automated check that preserves a meaningful architectural constraint as a system changes.",
    "architecture-fitness-functions",
  ],
  [
    "Saga",
    "A durable workflow of local transactions and domain-specific compensating actions across authorities.",
    "sagas-and-compensation",
  ],
  [
    "Inline cache",
    "Engine feedback and specialization associated with an operation site, such as a repeated property access.",
    "shapes-and-inline-caches",
  ],
  [
    "Variance",
    "How assignability between generic types relates to assignability between their type arguments.",
    "typescript-variance",
  ],
  [
    "Hydration mismatch",
    "A disagreement between server output and the client's initial expected tree under hydration.",
    "hydration-and-ids",
  ],
  [
    "Head-of-line blocking",
    "A dependency on earlier delivery or processing that delays otherwise independent work.",
    "http-multiplexing",
  ],
  [
    "Agent",
    "A JavaScript execution unit with its own execution context stack and job processing; a worker can run a separate agent.",
    "event-loop",
  ],
  [
    "Backpressure",
    "A consumer's signal that upstream production should slow or pause to keep queues and memory bounded.",
    "streams-and-backpressure",
  ],
  [
    "Closure",
    "A function with access to the lexical environment in which it was created, including retained mutable bindings.",
    "scope-and-closures",
  ],
  [
    "Consistency",
    "The allowed relationships between writes and the observations made by readers, across time and replicas.",
    "consistency-models",
  ],
  [
    "Dependency inversion",
    "High-level policy depends on semantic contracts instead of being shaped directly by infrastructure details.",
    "solid-dependency-inversion",
  ],
  [
    "Hydration",
    "Connecting browser React behavior to an initial matching server-rendered tree.",
    "react-server-components",
  ],
  [
    "Idempotency",
    "Repeating the same intended operation has the same intended effect; identical response bytes are not required.",
    "retries-and-idempotency",
  ],
  [
    "Invalidation",
    "A process that expires or removes a cached representation after its correctness or freshness assumptions change.",
    "cache-invalidation",
  ],
  [
    "Microtask checkpoint",
    "A host-defined point where the microtask queue drains, including additional microtasks enqueued while draining.",
    "event-loop",
  ],
  [
    "Port",
    "An application-owned capability contract implemented by infrastructure adapters.",
    "hexagonal-frontend",
  ],
  [
    "Read-your-writes",
    "A consistency guarantee that a session can observe its own completed writes on following reads.",
    "consistency-models",
  ],
  [
    "Reconciliation",
    "Matching a new React element tree with previous identities to preserve state and determine host changes.",
    "render-and-commit",
  ],
  [
    "Server Component",
    "A component evaluated in a server environment whose result is serialized through React's server-component protocol.",
    "react-server-components",
  ],
  [
    "Single-flight",
    "Coalescing simultaneous loads for one key into a shared in-flight operation within a stated scope.",
    "cache-invalidation",
  ],
  [
    "Temporal dead zone",
    "The period in a lexical scope when a binding exists but remains uninitialized and cannot be read.",
    "hoisting-and-tdz",
  ],
  [
    "Tearing",
    "An inconsistent UI where different subscribers observe different external-store versions in one view.",
    "external-stores",
  ],
  [
    "Transaction",
    "A database unit with atomicity and an explicitly chosen isolation contract; not a universal protection against every anomaly.",
    "transactions-and-isolation",
  ],
  [
    "Transition",
    "A React scheduling classification for non-urgent candidate UI updates; it does not create another JavaScript thread.",
    "concurrent-rendering",
  ],
];
function Glossary() {
  const [q, setQ] = useState("");
  const filtered = glossary.filter(([term, def]) =>
    `${term} ${def}`.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <>
      <PageIntro
        eyebrow="PRECISE WORDS, CLEARER REASONING"
        title="A shared engineering vocabulary."
        description="Concise definitions for mechanisms that are often confused. Follow each term into its full lesson."
      />
      <div className="inline-search">
        <Search size={17} />
        <input
          placeholder="Search terms…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search glossary"
        />
      </div>
      <div className="glossary-list">
        {filtered.map(([term, definition, slug]) => (
          <Link href={`/learn/${slug}`} key={term}>
            <h2>{term}</h2>
            <p>{definition}</p>
            <ArrowUpRight size={17} />
          </Link>
        ))}
        {!filtered.length && <p className="empty-state">No terms match this search.</p>}
      </div>
    </>
  );
}
function SearchDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const results = query.trim()
    ? lessons
        .filter((l) =>
          `${l.title} ${l.description} ${l.mental} ${l.pitfalls.join(" ")} ${tracks.find((t) => t.id === l.track)?.name}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 12)
    : [
        "event-loop",
        "render-and-commit",
        "nextjs-caching",
        "hexagonal-frontend",
        "solid-dependency-inversion",
      ].map((s) => getLesson(s)!);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    document.getElementById(`search-result-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  return (
    <dialog
      className="search-dialog"
      aria-label="Search curriculum"
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      onKeyDown={(e) => {
        const fromInput = e.target === input.current;
        const anchor = e.target instanceof Element ? e.target.closest(".search-results a") : null;
        // Native buttons/links keep their own Enter behavior.
        if (!fromInput && !anchor) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!results.length) return;
          const current = results.findIndex((_, index) => anchor?.id === `search-result-${index}`);
          const next = fromInput
            ? e.key === "ArrowDown"
              ? 0
              : results.length - 1
            : e.key === "ArrowDown"
              ? Math.min(results.length - 1, current + 1)
              : current - 1;
          if (next < 0) input.current?.focus();
          else {
            setSelected(next);
            document.getElementById(`search-result-${next}`)?.focus();
          }
        }
        if (e.key === "Enter" && fromInput) {
          e.preventDefault();
          if (results[selected]) document.getElementById(`search-result-${selected}`)?.click();
        }
      }}
    >
      <div className="search-dialog-inner">
        <div className="search-input-wrap">
          <Search size={21} />
          <input
            ref={input}
            autoFocus
            placeholder="Search the engineering field guide…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            aria-label="Search the curriculum"
          />
          <button className="icon-button" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>
        <span className="search-group-label eyebrow" role="status" aria-live="polite">
          {query.trim() ? `${results.length} MATCHING LESSONS` : "START WITH A DEEP DIVE"}
        </span>
        <div className="search-results">
          {results.map((l, i) => (
            <Link
              id={`search-result-${i}`}
              key={l.slug}
              href={`/learn/${l.slug}`}
              className={i === selected ? "selected" : ""}
              onClick={onClose}
              onMouseEnter={() => setSelected(i)}
              onFocus={() => setSelected(i)}
            >
              <span
                className="search-result-symbol"
                style={{ color: tracks.find((t) => t.id === l.track)?.color }}
              >
                {tracks.find((t) => t.id === l.track)?.symbol}
              </span>
              <div>
                <strong>{l.title}</strong>
                <p>{l.description}</p>
              </div>
              <ArrowUpRight size={15} />
            </Link>
          ))}
          {!results.length && (
            <p className="search-empty">
              No lessons found. Try “cache”, “SOLID”, “race”, or “architecture”.
            </p>
          )}
        </div>
        <div className="search-dialog-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open lesson
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </dialog>
  );
}
