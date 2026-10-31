import release from "../../package.json";
import { assetPath } from "../lib/assets";

/** Public runtime filenames are stable; a release key avoids reusing an older cached runtime. */
export function runtimeAssetPath(file: "worker-sandbox.html" | "react-runtime.js") {
  return assetPath(`/playground-assets/${file}`) + "?v=" + encodeURIComponent(release.version);
}
