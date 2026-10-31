import { parentPort } from "node:worker_threads";
import { formatValue } from "../src/playground/format.ts";
const lines = [];
const nativeTimeout = setTimeout;
console.log =
  console.info =
  console.warn =
  console.error =
    (...values) => lines.push(values.map(formatValue).join(" "));
process.on("unhandledRejection", (error) => parentPort.postMessage({ error: String(error) }));
parentPort.once("message", async ({ code }) => {
  try {
    // Same documented strict async entry, with no tracing, Promise hooks, or loop transforms.
    await new Function('"use strict";return (async()=>{\n' + code + "\n})()")();
    await new Promise((resolve) => nativeTimeout(resolve, 80));
    parentPort.postMessage({ lines });
  } catch (error) {
    parentPort.postMessage({ error: String(error) });
  }
});
