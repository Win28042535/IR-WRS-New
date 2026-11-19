"use client";
// Homepage view mode, shared by the header and the landing.
//   "full" — the whole homepage (hero, example, steps, FAQ, contact, closing banner)
//   "hero" — the hero alone, as a single-screen CTA into the flow (for user tests)
// This phase covers the IR site only, so the homepage is locked to "hero" (decided 19 Nov
// 2026). The full-page sections stay in the code, hidden, for a later phase that collects
// requirements for more site types (e.g. corporate sites): set FULL_HOME_ENABLED to true to
// bring back the switch and the remembered choice. Until then only a team link with
// ?mode=full opens the full page; nothing on the page leads there.
import { useSyncExternalStore } from "react";

export type HomeMode = "full" | "hero";

/** Off this phase: no mode switch, no remembered "full". */
export const FULL_HOME_ENABLED = false;

const KEY = "wrs-home-mode";
const EVENT = "wrs-home-mode";

function read(): HomeMode {
  try {
    const q = new URLSearchParams(window.location.search).get("mode");
    if (q === "hero" || q === "full") return q;
    if (!FULL_HOME_ENABLED) return "hero";
    return localStorage.getItem(KEY) === "full" ? "full" : "hero";
  } catch {
    return "hero";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    window.removeEventListener("popstate", cb);
  };
}

export function setHomeMode(mode: HomeMode) {
  try { localStorage.setItem(KEY, mode); } catch { /* private mode: URL still carries it */ }
  // Keep the address in step so a copied link opens the same view.
  const url = new URL(window.location.href);
  if (mode === "full") url.searchParams.set("mode", "full");
  else url.searchParams.delete("mode");
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export function useHomeMode(): HomeMode {
  return useSyncExternalStore(subscribe, read, () => "hero");
}
