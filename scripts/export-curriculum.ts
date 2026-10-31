import { writeFile } from "node:fs/promises";
import { lessons, getTrackLessons } from "../src/content";
import { tracks } from "../src/lib/types";
import { jsStages, jsPathSlugs, jsCoverage, jsApiFamilies } from "../src/content/javascript-path";

const lines = [
  "# Curriculum index",
  "",
  `${lessons.length} lessons across ${tracks.length} tracks. Each lesson includes a mental model, mechanism, code, pitfalls, practice, a quiz, and references. Architecture and pattern lessons also include explicit tradeoffs.`,
  "",
];
for (const track of tracks) {
  lines.push(`## ${track.name}`, "", track.description, "");
  for (const lesson of getTrackLessons(track.id)) {
    lines.push(`- **${lesson.title}** — ${lesson.description} Route: \`/learn/${lesson.slug}\`.`);
    if (lesson.invariant)
      lines.push(
        `  - Invariant: ${lesson.invariant}`,
        `  - Prerequisites: ${lesson.prerequisites?.join(", ")}.`,
      );
  }
  lines.push("");
}
const pathLines = [
  "# JavaScript coverage and mastery path",
  "",
  `${jsPathSlugs.length} language/runtime chapters in ${jsStages.length} stages. The project contains ${lessons.length} lessons overall. The path includes every lesson in the JavaScript and async tracks exactly once.`,
  "",
  "This is an explicit curriculum map. It covers the major language and standard-library families and essential host integration, while linking method-level specification and compatibility details. It is not a claim that every platform API or experimental proposal has its own chapter.",
  "",
];
for (const [index, stage] of jsStages.entries()) {
  pathLines.push(
    `## ${index + 1}. ${stage.name}`,
    "",
    stage.focus,
    "",
    `Mastery: ${stage.outcome}`,
    "",
  );
  for (const slug of stage.slugs) {
    const item = lessons.find((l) => l.slug === slug)!;
    pathLines.push(
      `- **${item.title}** — \`/learn/${slug}\` · ${item.level} · ${item.execution ?? "conceptual/reference"} context`,
    );
  }
  pathLines.push("", `Stage project: ${stage.capstone}`, "");
}
pathLines.push("## Language-guide crosswalk", "");
for (const area of jsCoverage)
  pathLines.push(
    `- **${area.topic}**: ${area.slugs.join(", ")}. [Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/${area.reference}).`,
  );
pathLines.push("", "## Built-in and platform reference families", "");
for (const family of jsApiFamilies)
  pathLines.push(
    `### ${family.name}`,
    "",
    family.apis.join(" · "),
    "",
    family.note,
    `Related chapter: \`/learn/${family.chapter}\`.`,
    "",
  );
pathLines.push(
  "## Evidence and limits",
  "",
  `${lessons.filter((lesson) => lesson.execution === "worker").length} canonical lesson programs run directly in the worker playground. Each has a reviewed expected-output fixture and a native uninstrumented comparison. Multi-file ESM projects, Node examples, browser DOM integration, and application fragments state their separate execution requirements. The event-dispatch lab uses real DOM callbacks to distinguish trusted input from nested programmatic dispatch. Engine internals, host APIs, standards proposals, and newer built-ins are labeled by their actual contract rather than universalized.`,
  "",
  "Use VERIFICATION.md for current checks and REFERENCE-CHECK.json for point-in-time link status. Self-assessed completion is not an automated certification.",
  "",
);
const nativeProjects = new Set([
  "modules-and-bundlers",
  "module-linking-and-cycles",
  "node-event-loop",
  "streams-and-backpressure",
]);
const controlledContracts = new Set([
  "cancellation-and-races",
  "multi-tenant-security",
  "ssrf-and-secrets",
  "cache-invalidation",
  "server-actions",
]);
const exampleLines = [
  "# Example verification matrix",
  "",
  "Generated from the canonical lesson registry. Parsing checks syntax, not application behavior. Worker checks compare the displayed program with reviewed expected output and an uninstrumented strict async execution. Node projects execute their named files. PostgreSQL checks use PGlite's real PostgreSQL engine for successful and rejected transfers; this does not establish multi-connection isolation. Controlled tests supply deterministic dependencies to the displayed functions. Other integration fragments still require their stated host/application dependencies.",
  "",
  "Browser verification and exact release evidence are recorded in VERIFICATION.md. Challenge answers are syntax-checked when code, while explanation answers are rendered as prose. References and conceptual models require semantic review in addition to automated checks.",
  "",
  "| Lesson | Execution context | Files | Declared output | Automated example evidence |",
  "| --- | --- | ---: | --- | --- |",
  ...lessons.map((lesson) => {
    const evidence =
      lesson.execution === "worker"
        ? "Native + instrumented output fixture"
        : nativeProjects.has(lesson.slug)
          ? "Real Node project execution"
          : lesson.slug === "transactions-and-isolation"
            ? "PostgreSQL transfer/rollback cases"
            : controlledContracts.has(lesson.slug)
              ? "Controlled dependency contract"
              : ["javascript", "typescript", "json"].includes(lesson.language)
                ? "Syntax/JSON; host integration required"
                : "Reference review; host integration required";
    return `| [${lesson.title}](https://omarradwann.github.io/under-the-hood/learn/${lesson.slug}/) | ${lesson.execution} | ${1 + (lesson.files?.length ?? 0)} | ${lesson.output ? "Yes" : "Not asserted"} | ${evidence} |`;
  }),
  "",
];
Promise.all([
  writeFile("CURRICULUM.md", lines.join("\n"), "utf8"),
  writeFile("JAVASCRIPT-COVERAGE.md", pathLines.join("\n"), "utf8"),
  writeFile("EXAMPLE-VERIFICATION.md", exampleLines.join("\n"), "utf8"),
])
  .then(() => console.log(`Exported ${lessons.length} lessons.`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
