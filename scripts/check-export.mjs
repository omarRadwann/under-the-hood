import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository && !repository.endsWith(".github.io") ? `/${repository}` : "");
const root = resolve("out");
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(root);
const failures = new Set();
let links = 0;
for (const file of files.filter((path) => [".html", ".css"].includes(extname(path)))) {
  const source = await readFile(file, "utf8");
  const refs =
    extname(file) === ".css"
      ? [...source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map((m) => m[1])
      : [...source.matchAll(/<[^>]+\s(?:href|src)="[^"]+"[^>]*>/g)]
          .filter((m) => !/rel="(?:preconnect|dns-prefetch)"/.test(m[0]))
          .map((m) => m[0].match(/(?:href|src)="([^"]+)"/)[1]);
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
    const url = new URL(
      ref.replaceAll("&amp;", "&"),
      "https://example.test" + basePath + file.slice(root.length).replaceAll("\\", "/"),
    );
    if (url.pathname !== basePath && !url.pathname.startsWith(basePath + "/")) {
      failures.add(`Unprefixed local URL: ${ref}`);
      continue;
    }
    const path = resolve(
      root,
      "." + decodeURIComponent(url.pathname.slice(basePath.length) || "/"),
    );
    const candidate = extname(path) ? path : resolve(path, "index.html");
    try {
      if (!(await stat(candidate)).isFile()) failures.add(`Missing target: ${ref}`);
    } catch {
      failures.add(`Missing target: ${ref}`);
    }
    links++;
  }
}
for (const required of [
  ".nojekyll",
  "404.html",
  "javascript/index.html",
  "playground/index.html",
  "playground-assets/worker-sandbox.html",
  "playground-assets/react-runtime.js",
]) {
  try {
    await stat(resolve(root, required));
  } catch {
    failures.add(`Missing required export: ${required}`);
  }
}
console.log(
  JSON.stringify(
    { files: files.length, localLinks: links, basePath, failures: [...failures] },
    null,
    2,
  ),
);
if (failures.size) process.exitCode = 1;
