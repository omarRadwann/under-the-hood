export type LabKind =
  | "engine"
  | "event-loop"
  | "memory"
  | "react"
  | "network"
  | "auth"
  | "cache"
  | "streaming"
  | "machine"
  | "flow";
export type TrackId =
  | "javascript"
  | "async"
  | "react"
  | "nextjs"
  | "network"
  | "security"
  | "data"
  | "engineering"
  | "architecture"
  | "patterns";

export interface Step {
  title: string;
  body: string;
}
export interface Lesson {
  slug: string;
  track: TrackId;
  title: string;
  description: string;
  minutes: number;
  level: "Foundations" | "Advanced" | "Deep dive";
  lab: LabKind;
  mental: string;
  steps: Step[];
  code: string;
  language: string;
  output?: string;
  pitfalls: string[];
  practice: string;
  quiz: { question: string; choices: string[]; answer: number; explanation: string };
  sources: { title: string; url: string }[];
  decision?: { use: string; avoid: string; tradeoff: string };
  invariant?: string;
  prerequisites?: string[];
  execution?: "worker" | "browser" | "node" | "reference";
  challenge?: { prompt: string; solution: string; explanation: string };
}

export const tracks: {
  id: TrackId;
  name: string;
  short: string;
  description: string;
  color: string;
  symbol: string;
}[] = [
  {
    id: "javascript",
    name: "JavaScript internals",
    short: "JavaScript",
    description:
      "From first expressions to object protocols, memory, and engine optimization. Build a complete language model.",
    color: "#e8c96b",
    symbol: "JS",
  },
  {
    id: "async",
    name: "Async & the runtime",
    short: "Async & runtime",
    description: "Trace the stack, follow the queues, and make concurrency predictable.",
    color: "#b1a1f5",
    symbol: "↻",
  },
  {
    id: "react",
    name: "React under the hood",
    short: "React",
    description: "Rendering, identity, scheduling, and the lifecycle of a reactive interface.",
    color: "#7ac8e3",
    symbol: "⚛",
  },
  {
    id: "nextjs",
    name: "The Next.js architecture",
    short: "Next.js",
    description: "Move confidently across server boundaries, streaming, routing, and caching.",
    color: "#dfdfdf",
    symbol: "N",
  },
  {
    id: "network",
    name: "Browser ↔ server",
    short: "Browser & network",
    description: "Follow a request through the layers that connect your frontend and backend.",
    color: "#8cbda4",
    symbol: "⇄",
  },
  {
    id: "security",
    name: "Identity & security",
    short: "Auth & security",
    description: "Build trust boundaries with sessions, authorization, and threat models.",
    color: "#e5a486",
    symbol: "⌘",
  },
  {
    id: "data",
    name: "Data & distributed systems",
    short: "Data & caching",
    description: "Reason about consistency, persistence, invalidation, and failure.",
    color: "#a5c78a",
    symbol: "▤",
  },
  {
    id: "engineering",
    name: "Production engineering",
    short: "Production",
    description: "Turn good code into resilient, observable, accessible software.",
    color: "#d5a1c3",
    symbol: "◇",
  },
  {
    id: "architecture",
    name: "Frontend architecture",
    short: "Architecture",
    description:
      "Choose boundaries, ownership, state placement, and deployment models deliberately.",
    color: "#90b8df",
    symbol: "⌗",
  },
  {
    id: "patterns",
    name: "Patterns & SOLID",
    short: "Patterns & SOLID",
    description:
      "Refactor around variation, dependencies, and contracts with concrete production examples.",
    color: "#c4b08b",
    symbol: "⊞",
  },
];
