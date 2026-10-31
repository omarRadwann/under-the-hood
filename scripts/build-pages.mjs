import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository && !repository.endsWith(".github.io") ? `/${repository}` : "");
if (basePath && !/^\/[a-zA-Z0-9._-]+$/.test(basePath))
  throw new Error(
    "NEXT_PUBLIC_BASE_PATH must be empty or one repository path, such as /under-the-hood",
  );
const env = { ...process.env, GITHUB_PAGES: "true", NEXT_PUBLIC_BASE_PATH: basePath };
for (const args of [
  ["scripts/build-playground.mjs"],
  ["node_modules/next/dist/bin/next", "build"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit", windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
  "out/release.json",
  JSON.stringify(
    {
      version: pkg.version,
      revision: process.env.GITHUB_SHA ?? "local-preview",
      routes: Object.keys(manifest.routes).filter(
        (route) => !["/_not-found", "/_global-error"].includes(route),
      ),
    },
    null,
    2,
  ) + "\n",
);
console.log(`Static export ready in out/ (base path: ${basePath || "/"}).`);
