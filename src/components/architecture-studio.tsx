"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GitBranch, Layers, Scale } from "lucide-react";
import { getLesson } from "@/content";
import { CodeBlock } from "./code-block";

const scenarios = [
  {
    name: "Early SaaS",
    teams: "1 product team",
    title: "One team. A product still finding its shape.",
    constraints: [
      "Weekly changes across features",
      "Shared deployment is acceptable",
      "Limited platform staffing",
    ],
    choice: "A modular Next.js application",
    why: "Use one deployment with feature-oriented boundaries. Co-locate UI and use cases, keep the client boundary narrow, and use URL/local state before reaching for a global store. Fast cross-feature refactoring matters more than release independence.",
    structure:
      "app/ → feature public APIs → application/domain → adapters\nshared/ → tokens, accessible primitives, stable utilities",
    cost: "Shared build and release coordination remain. Enforce imports early so a single deployable does not become a single dependency tangle.",
    avoid:
      "Runtime microfrontends, a custom dependency container, and separate read/write infrastructure before a measured need.",
    next: "modular-monolith",
    scores: ["Low", "Low", "Easy", "One release"],
  },
  {
    name: "Growing product",
    teams: "3–5 product teams",
    title: "Several teams. One coherent product.",
    constraints: [
      "Feature ownership is becoming unclear",
      "Imports cross too many domains",
      "Coordinated releases still work",
    ],
    choice: "A modular application with owned feature packages",
    why: "Separate capabilities with public APIs, ownership, and import rules. Feature slices can organize code; hexagonal boundaries can isolate complex domain rules. These choices compose: code organization and dependency direction are different decisions.",
    structure:
      "apps/web → packages/projects, billing, reporting\npackages/ui → tokens and primitives\neach feature → domain + use cases + adapters + UI",
    cost: "Package and API governance add work. Shared releases still couple teams operationally; monitor whether that coupling actually delays delivery.",
    avoid:
      "A giant shared entity model or a global store that every team mutates. Do not adopt runtime distribution solely to fix unrestricted imports.",
    next: "feature-sliced-design",
    scores: ["Medium", "Low", "Good", "One release"],
  },
  {
    name: "Independent teams",
    teams: "6+ autonomous teams",
    title: "Independent releases are a real requirement.",
    constraints: [
      "Stable domain and route ownership",
      "Teams operate their own production slices",
      "Platform support is funded",
    ],
    choice: "Evaluate route-level microfrontends",
    why: "Independent deployment may justify runtime composition. Prefer clear route ownership to deeply interleaved remote widgets. Define shell contracts for identity, routing, design tokens, telemetry, compatibility, and partial failure before choosing a loader.",
    structure:
      "shell/ → routing + session capability + telemetry\n/billing/* → billing deployment\n/projects/* → projects deployment\ncontracts/ → small versioned integration APIs",
    cost: "Runtime compatibility, duplicated infrastructure, integration testing, and consistent UX all become ongoing responsibilities. Autonomy is constrained by any shared singleton or lockstep dependency.",
    avoid:
      "One shared mutable store across all remotes or claiming independence while every deployment still needs coordinated React and shell changes.",
    next: "microfrontends",
    scores: ["High", "High", "Costly", "Independent"],
  },
  {
    name: "Complex domain",
    teams: "Long-lived product",
    title: "Policy complexity and integrations dominate.",
    constraints: [
      "Multiple providers or offline storage",
      "Business rules change independently of UI",
      "Deterministic tests and replay matter",
    ],
    choice: "A modular app with ports and adapters",
    why: "Keep important policy in a functional core. Use semantic ports for capabilities and adapters for transport, storage, and vendors. Compose concrete dependencies at the boundary. This dependency structure works inside a single deployable; it does not require microservices.",
    structure:
      "UI → use cases → domain policy\n               ↓ semantic ports\nHTTP / IndexedDB / vendor adapters implement ports\ncomposition root selects concrete capabilities",
    cost: "Mapping, contracts, and composition increase code volume. Avoid layers that only forward arguments, and preserve visible transaction, consistency, and cancellation semantics.",
    avoid:
      "A universal generic repository or an interface for every function. Start with the volatile boundaries and policy that genuinely benefits from isolation.",
    next: "hexagonal-frontend",
    scores: ["Medium", "Low", "Good", "Flexible"],
  },
];

export function ArchitectureStudio() {
  const [selected, setSelected] = useState(0);
  const s = scenarios[selected];
  return (
    <>
      <div className="scenario-tabs" role="group" aria-label="Architecture scenarios">
        {scenarios.map((scenario, i) => (
          <button
            className={selected === i ? "selected" : ""}
            key={scenario.name}
            onClick={() => setSelected(i)}
          >
            <span className="mono">0{i + 1}</span>
            <strong>{scenario.name}</strong>
            <small>{scenario.teams}</small>
          </button>
        ))}
      </div>
      <div className="architecture-result">
        <div className="architecture-context">
          <span className="eyebrow">THE CONTEXT</span>
          <h2>{s.title}</h2>
          {s.constraints.map((c) => (
            <p key={c}>
              <Check size={15} />
              {c}
            </p>
          ))}
          <span className="tiny muted">
            Scenario-based guidance, not an objective scoring algorithm.
          </span>
        </div>
        <div className="architecture-recommendation">
          <span className="eyebrow accent">A REASONABLE STARTING POINT</span>
          <h2>{s.choice}</h2>
          <p>{s.why}</p>
          <div className="decision-metrics">
            {[
              "Coordination effort",
              "Runtime integration",
              "Cross-feature changes",
              "Deployment",
            ].map((label, i) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{s.scores[i]}</strong>
              </div>
            ))}
          </div>
          <CodeBlock code={s.structure} language="architecture" title="Dependency direction" />
          <div className="decision-note">
            <Scale size={18} />
            <div>
              <strong>The cost you accept</strong>
              <p>{s.cost}</p>
            </div>
          </div>
          <div className="decision-note warning">
            <GitBranch size={18} />
            <div>
              <strong>Watch for premature complexity</strong>
              <p>{s.avoid}</p>
            </div>
          </div>
          <Link className="text-link" href={`/learn/${s.next}`}>
            Read the full decision guide
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <div className="callout">
        <Layers size={20} />
        <div>
          <strong>These decisions are separate axes</strong>
          <p>
            Deployment topology (one app or microfrontends), organization (feature slices),
            dependency direction (ports and adapters), and state ownership can be combined. Choose
            each from its own constraints rather than treating them as competing brands.
          </p>
        </div>
      </div>
      <SolidLab />
    </>
  );
}

const principles = [
  {
    name: "Single Responsibility",
    letter: "S",
    slug: "solid-single-responsibility",
    before: `async function CheckoutButton() {\n  // UI, tax policy, vendor protocol, and reporting\n  // all have independent reasons to change.\n  const tax = region === 'X' ? total * .2 : total * .1;\n  await vendorSdk.charge({ total: total + tax });\n  analytics.track('purchase');\n  return <button>Pay</button>;\n}`,
    lesson:
      "Separate policy, orchestration, and presentation where ownership actually differs. Also, never initiate a payment as a side effect of rendering a component.",
  },
  {
    name: "Open/Closed",
    letter: "O",
    slug: "solid-open-closed",
    before: `function shipping(method, cart) {\n  if (method === 'standard') { /* policy A */ }\n  else if (method === 'express') { /* policy B */ }\n  // The same branching is duplicated in validation,\n  // UI labels, and checkout orchestration.\n}`,
    lesson:
      "Extract a stable policy extension point only when repeated variation justifies it. One short conditional is often clearer than an unnecessary registry.",
  },
  {
    name: "Liskov Substitution",
    letter: "L",
    slug: "solid-liskov",
    before: `interface Store {\n  save(doc: Document): Promise<void>;\n  read(id: string): Promise<Document | null>;\n}\n// Memory adapter promises immediate read-after-write.\n// Replica adapter may read stale data.\n// Identical types, incompatible behavioral promises.`,
    lesson:
      "Define and test consistency, accepted inputs, failures, and side effects. Structural type compatibility alone is not a behavioral contract.",
  },
  {
    name: "Interface Segregation",
    letter: "I",
    slug: "solid-interface-segregation",
    before: `interface AppService {\n  readProject(): Promise<Project>;\n  deleteTenant(): Promise<void>;\n  chargeCard(): Promise<void>;\n  exportAudit(): Promise<Blob>;\n}\n// A project card should not depend on all of this.`,
    lesson:
      "Let consumers depend on the semantic capability they need. Keep atomic operations cohesive rather than splitting them into unsafe low-level steps.",
  },
  {
    name: "Dependency Inversion",
    letter: "D",
    slug: "solid-dependency-inversion",
    before: `import vendorSdk from 'payment-vendor';\nasync function renewSubscription(account: Account) {\n  const due = account.expiresAt < new Date();\n  if (due) await vendorSdk.charge(account.vendorId);\n}\n// Policy depends directly on clock and vendor protocol.`,
    lesson:
      "Make important policy depend on explicit capabilities. A factory parameter or function is often enough; a container is optional infrastructure.",
  },
];
export function SolidLab() {
  const [active, setActive] = useState(0);
  const p = principles[active];
  const lesson = getLesson(p.slug)!;
  return (
    <section className="solid-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FROM PRINCIPLE TO REFACTOR</span>
          <h2>SOLID, without the ceremony.</h2>
        </div>
        <span className="pill">5 principles · practical examples</span>
      </div>
      <div className="solid-tabs" role="group" aria-label="SOLID principles">
        {principles.map((principle, i) => (
          <button
            onClick={() => setActive(i)}
            className={active === i ? "selected" : ""}
            key={principle.letter}
          >
            <b>{principle.letter}</b>
            <span>{principle.name}</span>
          </button>
        ))}
      </div>
      <div className="solid-code-grid">
        <CodeBlock code={p.before} title="The coupling to examine" />
        <CodeBlock code={lesson.code} title="A possible refactor" />
      </div>
      <div className="callout">
        <Scale size={20} />
        <div>
          <strong>{p.name}</strong>
          <p>{p.lesson}</p>
          <Link href={`/learn/${p.slug}`} className="text-link">
            Explore the contract, tradeoffs, and exercise
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
