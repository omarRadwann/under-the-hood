import { readFile } from "node:fs/promises";

const base = process.env.APP_URL ?? "http://localhost:3000";
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const frameworkErrorRoutes = new Set(["/_not-found", "/_global-error"]);
const routes = Object.keys(manifest.routes).filter((route) => !frameworkErrorRoutes.has(route));
const failures = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < routes.length) {
      const route = routes[cursor++];
      const response = await fetch(new URL(route, base));
      await response.arrayBuffer();
      if (response.status !== 200) failures.push({ route, status: response.status });
    }
  }),
);
const missing = await fetch(new URL("/learn/this-lesson-does-not-exist", base));
if (missing.status !== 404) failures.push({ route: "unknown lesson", status: missing.status });
console.log(
  JSON.stringify({ checked: routes.length, unknownLesson: missing.status, failures }, null, 2),
);
if (failures.length) process.exitCode = 1;
