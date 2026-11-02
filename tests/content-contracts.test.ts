import test from "node:test";
import assert from "node:assert/strict";
import * as Babel from "@babel/standalone";
import { mkdtemp, writeFile, unlink, rmdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import { lessons, getLesson } from "../src/content";
import { presets, lessonPlaygrounds } from "../src/playground/presets";
import type { NodePath } from "@babel/traverse";
import type { CallExpression } from "@babel/types";

test("React hook examples are inside component/custom-hook functions, not module initialization", () => {
  for (const lesson of lessons.filter((lesson) => lesson.track === "react")) {
    for (const file of [{ code: lesson.code }, ...(lesson.files ?? [])]) {
      Babel.transform(file.code, {
        filename: "example.tsx",
        presets: ["typescript", ["react", { runtime: "classic" }]],
        plugins: [
          ({ types }) => ({
            visitor: {
              CallExpression(path: NodePath<CallExpression>) {
                const callee = path.node.callee;
                const name = types.isIdentifier(callee)
                  ? callee.name
                  : types.isMemberExpression(callee) && types.isIdentifier(callee.property)
                    ? callee.property.name
                    : "";
                if (/^use[A-Z]/.test(name))
                  assert.ok(
                    path.getFunctionParent(),
                    lesson.slug + ": " + name + " at module scope",
                  );
              },
            },
          }),
        ],
      });
    }
  }
});
const run = promisify(execFile);

function compileExample(slug: string) {
  return Babel.transform(getLesson(slug)!.code, {
    filename: "example.ts",
    presets: ["typescript"],
    plugins: ["transform-modules-commonjs"],
  })!.code!;
}

test("the Server Action selects named fields, rejects duplicates, and invalidates only after an authorized write", async () => {
  const writes: unknown[] = [];
  const tags: string[] = [];
  let denied = false;
  const rename = new Function(
    "exports",
    "requireSession",
    "RenameProjectSchema",
    "projectCommands",
    "updateTag",
    compileExample("server-actions") + "\nreturn exports.renameProject;",
  )(
    {},
    async () => ({ user: { id: "actor" } }),
    { parse: (value: unknown) => value },
    {
      renameAuthorized: async (value: unknown) => {
        if (denied) throw new Error("Denied");
        writes.push(value);
      },
    },
    (tag: string) => tags.push(tag),
  );
  const form = new FormData();
  form.set("id", "p1");
  form.set("name", "Renamed");
  form.set("$ACTION_ID_metadata", "ignore");
  await rename(form);
  assert.deepEqual(writes, [{ actorId: "actor", id: "p1", name: "Renamed" }]);
  assert.deepEqual(tags, ["project:p1"]);
  form.append("id", "another");
  await assert.rejects(rename(form), /Expected one/);
  form.set("id", "p1");
  denied = true;
  await assert.rejects(rename(form), /Denied/);
  assert.equal(writes.length, 1);
  assert.equal(tags.length, 1);
});

test("tenant cache keys preserve dimension boundaries", () => {
  const key = new Function(compileExample("multi-tenant-security") + "\nreturn projectCacheKey;")();
  const pairs = [
    ["a:b", "c"],
    ["a", "b:c"],
    ["", ":"],
    [":", ""],
    ['a"b', "c\\d"],
  ];
  assert.equal(new Set(pairs.map(([tenantId, id]) => key({ tenantId }, id))).size, pairs.length);
});

test("the SSRF example refuses redirects and unbounded IDs before calling fetch", async () => {
  const calls: { url: URL; options: RequestInit }[] = [];
  const env: Record<string, string> = { API_TOKEN: "test-token" };
  const get = new Function(
    "require",
    "exports",
    "process",
    "fetch",
    compileExample("ssrf-and-secrets") + "\nreturn exports.getProduct;",
  )(
    () => ({}),
    {},
    { env },
    async (url: URL, options: RequestInit) => {
      calls.push({ url, options });
      return { ok: true };
    },
  );
  await get("product_1");
  assert.equal(calls[0].url.href, "https://trusted-api.example.com/products/product_1");
  assert.equal(calls[0].options.redirect, "error");
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  for (const id of ["../admin", "https://evil.test", "x".repeat(129), ""])
    await assert.rejects(get(id), /Invalid ID/);
  delete env.API_TOKEN;
  await assert.rejects(get("product_2"), /not configured/);
  assert.equal(calls.length, 1);
});

test("single-flight shares in-flight work and releases failed and fulfilled entries", async () => {
  const coalesce = new Function(compileExample("cache-invalidation") + "\nreturn singleFlight;")();
  let count = 0;
  let release!: (value: number) => void;
  const gate = new Promise<number>((resolve) => {
    release = resolve;
  });
  const first = coalesce("a", () => {
    count++;
    return gate;
  });
  assert.equal(
    coalesce("a", () => {
      throw new Error("duplicate");
    }),
    first,
  );
  await Promise.resolve();
  assert.equal(count, 1);
  release(7);
  assert.equal(await first, 7);
  await assert.rejects(
    coalesce("a", () => {
      throw new Error("sync failure");
    }),
    /sync failure/,
  );
  assert.equal(await coalesce("a", async () => 9), 9);
});

test("the PostgreSQL transfer rolls back missing/underfunded accounts and commits both sides", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "CREATE TABLE accounts (id text PRIMARY KEY, balance integer NOT NULL CHECK (balance >= 0));",
    );
    const code = getLesson("transactions-and-isolation")!.code;
    await db.exec("INSERT INTO accounts VALUES ('A', 200);");
    await assert.rejects(db.exec(code), /Credit account missing/);
    await db.exec("ROLLBACK;");
    assert.deepEqual((await db.query("SELECT * FROM accounts ORDER BY id")).rows, [
      { id: "A", balance: 200 },
    ]);
    await db.exec(
      "INSERT INTO accounts VALUES ('B', 0); UPDATE accounts SET balance = 50 WHERE id = 'A';",
    );
    await assert.rejects(db.exec(code), /Debit rejected/);
    await db.exec("ROLLBACK;");
    assert.deepEqual((await db.query("SELECT balance FROM accounts ORDER BY id")).rows, [
      { balance: 50 },
      { balance: 0 },
    ]);
    await db.exec("UPDATE accounts SET balance = 200 WHERE id = 'A';");
    await db.exec(code);
    assert.deepEqual((await db.query("SELECT balance FROM accounts ORDER BY id")).rows, [
      { balance: 100 },
      { balance: 100 },
    ]);
  } finally {
    await db.close();
  }
});

test("every JavaScript/TypeScript file and coded answer parses in its declared boundary", () => {
  for (const lesson of lessons) {
    assert.ok(lesson.execution, lesson.slug);
    const examples = [
      { name: lesson.filename ?? "example.tsx", language: lesson.language, code: lesson.code },
      ...(lesson.files ?? []),
    ];
    if (lesson.challenge && lesson.challenge.kind !== "explanation")
      examples.push({
        name: "answer.tsx",
        language: "javascript",
        code: lesson.challenge.solution,
      });
    for (const example of examples) {
      if (example.language === "json")
        assert.doesNotThrow(() => JSON.parse(example.code), lesson.slug);
      if (!["javascript", "typescript"].includes(example.language)) continue;
      assert.doesNotThrow(
        () =>
          Babel.transform(example.code, {
            filename: example.name.endsWith(".cjs") ? "example.cts" : "example.tsx",
            sourceType: example.name.endsWith(".cjs") ? "script" : "module",
            presets: ["typescript", ["react", { runtime: "classic" }]],
            parserOpts: { allowAwaitOutsideFunction: true },
          }),
        lesson.slug + " / " + example.name,
      );
    }
  }
});
test("every worker lesson opens its exact displayed example", () => {
  for (const lesson of lessons.filter((lesson) => lesson.execution === "worker")) {
    const target = lessonPlaygrounds[lesson.slug];
    assert.ok(target, lesson.slug);
    assert.equal(
      presets.find((preset) => preset.id === target.preset)?.source,
      lesson.code,
      lesson.slug,
    );
    assert.ok(lesson.output, lesson.slug);
  }
});

async function runProject(slug: string, input?: string) {
  const lesson = getLesson(slug)!;
  assert.ok(lesson.filename);
  const dir = await mkdtemp(join(tmpdir(), "uth-content-"));
  const files = [{ name: lesson.filename, code: lesson.code }, ...(lesson.files ?? [])];
  const created: string[] = [];
  try {
    for (const file of files) {
      assert.match(file.name, /^[a-zA-Z0-9._-]+$/);
      await writeFile(join(dir, file.name), file.code);
      created.push(file.name);
    }
    if (input !== undefined) {
      await writeFile(join(dir, "events.ndjson"), input);
      created.push("events.ndjson", "events.ndjson.gz");
    }
    const result = await run(process.execPath, [join(dir, lesson.filename)], {
      cwd: dir,
      timeout: 5000,
    });
    const restored =
      input === undefined
        ? undefined
        : gunzipSync(await readFile(join(dir, "events.ndjson.gz"))).toString();
    return { stdout: result.stdout.trim().replaceAll("\r\n", "\n"), restored };
  } finally {
    // Only explicitly created files are removed; no recursive computed-path deletion.
    for (const name of created) await unlink(join(dir, name)).catch(() => {});
    await rmdir(dir);
  }
}
test("displayed ESM projects execute real live bindings and both safe/unsafe cycles", async () => {
  for (const slug of ["modules-and-bundlers", "module-linking-and-cycles"])
    assert.equal((await runProject(slug)).stdout, getLesson(slug)!.output, slug);
});
test("the CommonJS I/O example and real compression pipeline work in Node", async () => {
  assert.equal((await runProject("node-event-loop")).stdout, "immediate\ntimer");
  const input = '{"event":1}\n{"event":2}\n';
  assert.equal((await runProject("streams-and-backpressure", input)).restored, input);
});

test("the displayed AsyncLocalStorage pattern propagates request identity and restores caller context", async () => {
  const records: { requestId: string }[] = [];
  const context = await new Function(
    "require",
    "exports",
    "doWork",
    "logger",
    "return (async()=>{" + compileExample("async-context") + ";return context;})()",
  )(
    createRequire(import.meta.url),
    {},
    async () => {
      await Promise.resolve();
    },
    { info: (value: { requestId: string }) => records.push(value) },
  );
  assert.deepEqual(records, [{ requestId: "r1" }]);
  assert.equal(context.getStore(), undefined);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = context.run({ requestId: "first" }, async () => {
    await gate;
    return context.getStore().requestId;
  });
  const second = context.run({ requestId: "second" }, async () => {
    await Promise.resolve();
    return context.getStore().requestId;
  });
  assert.equal(await second, "second");
  release();
  assert.equal(await first, "first");
  assert.equal(context.getStore(), undefined);
  context.disable();
});

test("the shared-memory lesson executes real Atomics operations under its documented Node alternative", () => {
  const values: unknown[] = [];
  new Function("console", getLesson("shared-memory-and-atomics")!.code)({
    log: (value: unknown) => values.push(value),
  });
  assert.deepEqual(values, [1]);
});
test("the cancellation example guards its synchronous commit across reordered responses", async () => {
  const code = Babel.transform(getLesson("cancellation-and-races")!.code, {
    filename: "example.ts",
    presets: ["typescript"],
  })!.code!;
  const commits: string[] = [];
  const gates = new Map<string, { promise: Promise<unknown>; resolve: (value: unknown) => void }>();
  for (const key of ["old", "new"]) {
    let resolve!: (value: unknown) => void;
    const promise = new Promise<unknown>((done) => {
      resolve = done;
    });
    gates.set(key, { promise, resolve });
  }
  const fetch = async (url: string) => ({
    ok: true,
    json: () => gates.get(new URL(url, "https://example.test").searchParams.get("q")!)!.promise,
  });
  const create = new Function("fetch", code + "\n;return createSearch;")(fetch);
  const search = create((value: string) => commits.push(value));
  const older = search("old", new AbortController().signal);
  const newer = search("new", new AbortController().signal);
  gates.get("new")!.resolve("new");
  await newer;
  gates.get("old")!.resolve("old");
  await older;
  assert.deepEqual(commits, ["new"]);
});
