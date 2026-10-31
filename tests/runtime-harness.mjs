import { parentPort } from "node:worker_threads";
globalThis.postMessage = (value) => parentPort.postMessage(value);
process.on("unhandledRejection", (reason) =>
  globalThis.onunhandledrejection?.({ reason, preventDefault() {} }),
);
await import("../public/playground-assets/worker-runtime.js");
parentPort.on("message", (data) => globalThis.onmessage?.({ data }));
