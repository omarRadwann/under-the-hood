import { assetPath } from "../lib/assets";
import type { RuntimePacket } from "./types";

/** An opaque frame supplies a CSP to its blob worker, including on static hosts. */
export function createWorkerSandbox(
  onPacket: (packet: RuntimePacket) => void,
  onError: (message: string) => void,
) {
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.title = "Isolated JavaScript worker host";
  frame.setAttribute("sandbox", "allow-scripts");
  frame.src = assetPath("/playground-assets/worker-sandbox.html");
  let ready = false;
  let ended = false;
  let queued: unknown;
  const onMessage = (event: MessageEvent) => {
    if (ended || event.source !== frame.contentWindow) return;
    if (event.data?.channel === "uth-worker-host") {
      if (event.data.type === "ready") {
        ready = true;
        if (queued) frame.contentWindow?.postMessage(queued, "*");
        queued = undefined;
      } else if (event.data.type === "error") {
        onError(String(event.data.message ?? "Worker failed to start").slice(0, 5000));
      }
    } else onPacket(event.data);
  };
  window.addEventListener("message", onMessage);
  document.body.appendChild(frame);
  return {
    postMessage(message: unknown) {
      if (ended) return;
      if (ready) frame.contentWindow?.postMessage(message, "*");
      else queued = message;
    },
    terminate() {
      ended = true;
      queued = undefined;
      window.removeEventListener("message", onMessage);
      frame.remove();
    },
  };
}
