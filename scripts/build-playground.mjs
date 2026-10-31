import { build } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await mkdir("public/playground-assets", { recursive: true });
await Promise.all([
  build({
    entryPoints: ["src/playground/worker-runtime.ts"],
    outfile: "public/playground-assets/worker-runtime.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2022",
    minify: false,
  }),
  build({
    entryPoints: ["src/playground/react-runtime.ts"],
    outfile: "public/playground-assets/react-runtime.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2022",
    define: { "process.env.NODE_ENV": '"development"' },
    minify: true,
    legalComments: "eof",
  }),
]);
// Blob workers inherit this opaque document's CSP. GitHub Pages cannot set custom headers.
const workerSource = await readFile("public/playground-assets/worker-runtime.js", "utf8");
const hostScript = `"use strict";let started=false;addEventListener("message",(event)=>{if(event.source!==parent||started)return;started=true;try{const url=URL.createObjectURL(new Blob([${JSON.stringify(workerSource).replaceAll("<", "\\u003c")}],{type:"text/javascript"}));const worker=new Worker(url);URL.revokeObjectURL(url);worker.onmessage=(message)=>parent.postMessage(message.data,"*");worker.onerror=()=>parent.postMessage({channel:"uth-worker-host",type:"error",message:"Isolated worker failed to start"},"*");worker.postMessage(event.data);}catch(error){parent.postMessage({channel:"uth-worker-host",type:"error",message:String(error)},"*");}});parent.postMessage({channel:"uth-worker-host",type:"ready"},"*");`;
const hash = createHash("sha256").update(hostScript).digest("base64");
const policy = `default-src 'none'; script-src 'sha256-${hash}' 'unsafe-eval'; worker-src blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'`;
await writeFile(
  "public/playground-assets/worker-sandbox.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><title>Isolated worker host</title></head><body><script>${hostScript}</script></body></html>`,
);
await copyFile("node_modules/react/LICENSE", "public/playground-assets/REACT-LICENSE.txt");
await copyFile("node_modules/react-dom/LICENSE", "public/playground-assets/REACT-DOM-LICENSE.txt");
console.log("Built local worker and React playground runtimes.");
