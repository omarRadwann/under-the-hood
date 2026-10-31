import type { Lesson, TrackId, LabKind } from "@/lib/types";

type Input = Omit<Lesson, "track" | "language" | "level" | "minutes" | "lab" | "sources"> &
  Partial<Pick<Lesson, "language" | "level" | "minutes" | "lab" | "sources">>;
const docs: Record<TrackId, { title: string; url: string }> = {
  javascript: {
    title: "MDN · JavaScript guide",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  },
  async: {
    title: "MDN · JavaScript execution model",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model",
  },
  react: { title: "React · Learn", url: "https://react.dev/learn" },
  nextjs: { title: "Next.js · App Router documentation", url: "https://nextjs.org/docs/app" },
  network: { title: "MDN · HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP" },
  security: { title: "OWASP · Cheat Sheet Series", url: "https://cheatsheetseries.owasp.org/" },
  data: { title: "PostgreSQL · Documentation", url: "https://www.postgresql.org/docs/current/" },
  engineering: { title: "web.dev · Learn performance", url: "https://web.dev/learn/performance" },
  architecture: {
    title: "Martin Fowler · Architecture",
    url: "https://martinfowler.com/architecture/",
  },
  patterns: { title: "Martin Fowler · Refactoring", url: "https://refactoring.com/" },
};
const specificReferences: Record<string, { title: string; url: string }[]> = {
  "solid-liskov": [
    {
      title: "Liskov & Wing · A Behavioral Notion of Subtyping (1994)",
      url: "https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf",
    },
  ],
  "command-and-cqrs": [
    { title: "Martin Fowler · CQRS", url: "https://martinfowler.com/bliki/CQRS.html" },
  ],
  "solid-single-responsibility": [
    {
      title: "Robert C. Martin · The Single Responsibility Principle",
      url: "https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html",
    },
  ],
  "cache-invalidation": [
    {
      title: "AWS Builders' Library · Caching challenges and strategies",
      url: "https://aws.amazon.com/builders-library/caching-challenges-and-strategies/",
    },
  ],
  "events-and-outbox": [
    {
      title: "AWS Prescriptive Guidance · Transactional outbox",
      url: "https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html",
    },
  ],
  "testing-strategy": [
    {
      title: "Testing Library · Guiding principles",
      url: "https://testing-library.com/docs/guiding-principles/",
    },
  ],
  "indexes-and-query-plans": [
    {
      title: "PostgreSQL · Using EXPLAIN",
      url: "https://www.postgresql.org/docs/current/using-explain.html",
    },
  ],
  "state-machines": [
    {
      title: "Stately · State machines",
      url: "https://stately.ai/docs/state-machines-and-statecharts",
    },
  ],
  "feature-sliced-design": [
    {
      title: "Feature-Sliced Design · Overview",
      url: "https://feature-sliced.design/docs/get-started/overview",
    },
  ],
  "solid-dependency-inversion": [
    {
      title: "Alistair Cockburn · Ports and adapters",
      url: "https://alistair.cockburn.us/hexagonal-architecture/",
    },
  ],
  "compound-and-headless-components": [
    {
      title: "React · Sharing state between components",
      url: "https://react.dev/learn/sharing-state-between-components",
    },
    { title: "WAI · ARIA Authoring Practices", url: "https://www.w3.org/WAI/ARIA/apg/" },
  ],
};
export function lesson(track: TrackId, input: Input): Lesson {
  return {
    track,
    language: "typescript",
    level: "Advanced",
    minutes: 12 + input.steps.length * 2,
    lab: "flow" as LabKind,
    sources: specificReferences[input.slug] ?? [docs[track]],
    ...input,
  };
}
