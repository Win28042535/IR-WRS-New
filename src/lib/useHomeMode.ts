"use client";
// Homepage view mode, shared by the header and the landing.
//   "full" — the whole homepage (hero, example, steps, FAQ, contact, closing banner)
//   "hero" — the hero alone, as a single-screen CTA into the flow (for user tests)
// Picked with the switch on the homepage and remembered in this browser. A link with
// ?mode=hero or ?mode=full opens that mode directly (and remembers it).
import { useSyncExternalStore } from "react";

export type HomeMode = "full" | "hero";

const KEY = "wrs-home-mode";
const EVENT = "wrs-home-mode";

function read(): HomeMode {
  try {
    const q = new URLSearchParams(window.location.search).get("mode");
    if (q === "hero" || q === "full") return q;
    return localStorage.getItem(KEY) === "hero" ? "hero" : "full";
  } catch {
    return "full";
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
  if (mode === "hero") url.searchParams.set("mode", "hero");
  else url.searchParams.delete("mode");
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export function useHomeMode(): HomeMode {
  return useSyncExternalStore(subscribe, read, () => "full");
}
