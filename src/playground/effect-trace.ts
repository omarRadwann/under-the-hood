import type { EffectCallback } from "react";

/** Observe valid cleanup functions while preserving React's own validation of other returns. */
export function observeEffect(
  effect: EffectCallback,
  setup: () => void,
  cleanup: () => void,
): EffectCallback {
  return () => {
    setup();
    const result = effect();
    return typeof result === "function"
      ? () => {
          cleanup();
          result();
        }
      : result;
  };
}
