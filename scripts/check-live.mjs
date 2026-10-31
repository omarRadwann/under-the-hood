const base = new URL(process.env.APP_URL ?? "http://localhost:3001/under-the-hood/");
if (!base.pathname.endsWith("/")) base.pathname += "/";
const expectedRevision = process.env.EXPECTED_REVISION;
let release;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const url = new URL("release.json", base);
    if (expectedRevision) url.searchParams.set("revision", expectedRevision);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (response.ok) {
      const candidate = await response.json();
      if (!expectedRevision || candidate.revision === expectedRevision) {
        release = candidate;
        break;
      }
    }
  } catch {
    /* A just-published artifact can take time to become visible. */
  }
  if (attempt < 11) await new Promise((resolve) => setTimeout(resolve, 5000));
}
if (!release || !Array.isArray(release.routes) || !release.routes.length)
  throw new Error("The expected release manifest did not become available.");
const failures = [];
let cursor = 0;
async function status(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      await response.body?.cancel();
      return response.status;
    } catch (error) {
      if (attempt === 1) return String(error);
    }
  }
}
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < release.routes.length) {
      const route = release.routes[cursor++];
      if (
        typeof route !== "string" ||
        !/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9]+)?$/.test(route)
      )
        throw new Error("Invalid exported route");
      const url = new URL(
        route.slice(1) + (route !== "/" && !route.split("/").at(-1).includes(".") ? "/" : ""),
        base,
      );
      const result = await status(url);
      if (result !== 200) failures.push({ route, status: result });
    }
  }),
);
const unknownLesson = await status(new URL("learn/this-lesson-does-not-exist/", base));
if (unknownLesson !== 404) failures.push({ route: "unknown lesson", status: unknownLesson });
console.log(
  JSON.stringify(
    {
      site: base.href,
      version: release.version,
      revision: release.revision,
      checkedRoutes: release.routes.length,
      unknownLesson,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
