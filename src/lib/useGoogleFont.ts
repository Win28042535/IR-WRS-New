"use client";
import { useEffect } from "react";

// ── Loading ──
// One stylesheet per family+weights, added once. Whole families are requested (Thai +
// Latin subsets via unicode-range) — never a `text=` subset, so nothing the client types
// is sent to Google.
export function loadGoogleFont(family: string, weights: number[] = [400, 600]) {
  if (typeof document === "undefined") return;
  const w = [...new Set(weights)].sort((a, b) => a - b);
  const id = `gf-${family.replace(/\s+/g, "-")}-${w.join("-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${w.join(";")}&display=swap`;
  document.head.appendChild(link);
}
export function useGoogleFont(family: string | undefined, weights?: number[]) {
  const key = weights?.join(",");
  useEffect(() => {
    if (family) loadGoogleFont(family, weights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family, key]);
}
