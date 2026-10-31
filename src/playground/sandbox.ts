import { assetPath } from "../lib/assets";

/** Opaque-origin document. Only the bundled runtime and nonce-bearing inline scripts may run. */
export function reactSandboxDocument(
  code: string,
  runId: string,
  strict: boolean,
  origin: string,
): string {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const safe = (value: string) => value.replace(/<\/script/gi, (match) => "<\\/" + match.slice(2));
  const runtimeUrl = `${origin}${assetPath("/playground-assets/react-runtime.js")}`;
  const policy = `default-src 'none'; script-src 'nonce-${nonce}' ${runtimeUrl}; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; frame-src 'none'`;
  const boot = `const __uthRuntime = window.__uthBoot(${JSON.stringify(runId)}, ${strict}); const React = __uthRuntime.React; const __trace = __uthRuntime.trace; let __uthApp; try { ${code}\n; __uthRuntime.mount(typeof __uthApp !== 'undefined' ? __uthApp : typeof App !== 'undefined' ? App : undefined); } catch(error) { __trace.error(error); }`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:23px;background:#131a11;color:#e3ecd9;font:14px/1.7 system-ui,sans-serif}h1,h2,h3{font-weight:550;line-height:1.3}h2{font-size:23px;margin:0 0 18px}p{color:#b5c7a5}button{font:inherit;background:#d2dfa0;color:#1a2512;border:1px solid #d2dfa0;border-radius:5px;padding:8px 12px;cursor:pointer;margin:0 8px 12px 0}input,select,textarea{font:inherit;color:#dae8c9;border:1px solid #6e8b54;background:#1e2c17;border-radius:4px;padding:7px 9px;max-width:100%}label{display:flex;align-items:center;gap:12px;margin:12px 0}:focus-visible{outline:2px solid #f0e8a7;outline-offset:3px}code,pre{font-family:monospace}pre{white-space:pre-wrap}button:disabled{opacity:.4}section{max-width:100%}</style></head><body><div id="root"></div><script nonce="${nonce}" src="${runtimeUrl}"></script><script nonce="${nonce}">${safe(boot)}</script></body></html>`;
}
