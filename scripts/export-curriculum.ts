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
  "Forty added chapters include worked edge-case challenges, solutions, practice investigations, explicit execution contexts, and at least four mechanism stages. Thirty-six new chapter programs run directly in the worker playground. Module/package and browser DOM examples state their separate execution requirements. A lazy-iterator-helper experiment adds a runnable cleanup investigation. Engine internals, host APIs, standards proposals, and newer built-ins are labeled by their actual contract rather than universalized.",
  "",
  "Use VERIFICATION.md for current checks and REFERENCE-CHECK.json for point-in-time link status. Self-assessed completion is not an automated certification.",
  "",
);
Promise.all([
  writeFile("CURRICULUM.md", lines.join("\n"), "utf8"),
  writeFile("JAVASCRIPT-COVERAGE.md", pathLines.join("\n"), "utf8"),
])
  .then(() => console.log(`Exported ${lessons.length} lessons.`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
