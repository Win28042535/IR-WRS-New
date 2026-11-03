"use client";

import { create } from "zustand";

// Ephemeral, session-only UI state that coordinates the "flying card" feedback when a
// section is added/removed on the Structure step (S3 in flow2/page.tsx is the picker/source,
// SectionWorkspace in PreviewPanel.tsx is the destination list). Not part of the saved
// draft — purely drives animation, so it never persists and never touches business logic.
interface Flight {
  id: string;
  direction: "add" | "remove";
  fromRect: DOMRect;
  // "remove" flights already know where they're going (the picker card never moves or
  // unmounts), so GhostFlightLayer can animate immediately with no polling. "add" flights
  // leave this unset — the destination row doesn't exist until the list re-renders.
  toRect?: DOMRect;
}

interface SectionFxState {
  flight: Flight | null;
  pendingIds: Set<string>;   // add: destination row stays hidden until its ghost lands
  landedIds: Set<string>;    // brief glow right after a ghost arrives (row, or picker card)
  removingIds: Set<string>;  // row fading out of the workspace before it's actually removed
  flyToStructure: (id: string, fromRect: DOMRect) => void;
  flyToPicker: (id: string, fromRect: DOMRect, toRect: DOMRect) => void;
  startRemove: (id: string) => void; // fallback: just fade the row, no ghost (target not found)
  land: (id: string) => void;
  clearLanded: (id: string) => void;
  clearPending: (id: string) => void;
  clearRemoving: (id: string) => void;
}

export const useSectionFx = create<SectionFxState>((set) => ({
  flight: null,
  pendingIds: new Set(),
  landedIds: new Set(),
  removingIds: new Set(),

  flyToStructure: (id, fromRect) => set((s) => ({
    flight: { id, direction: "add", fromRect },
    pendingIds: new Set(s.pendingIds).add(id),
  })),

  flyToPicker: (id, fromRect, toRect) => set((s) => ({
    flight: { id, direction: "remove", fromRect, toRect },
    removingIds: new Set(s.removingIds).add(id),
  })),

  startRemove: (id) => set((s) => ({ removingIds: new Set(s.removingIds).add(id) })),

  land: (id) => set((s) => {
    const pendingIds = new Set(s.pendingIds);
    pendingIds.delete(id);
    return { flight: null, pendingIds, landedIds: new Set(s.landedIds).add(id) };
  }),

  clearLanded: (id) => set((s) => {
    if (!s.landedIds.has(id)) return s;
    const next = new Set(s.landedIds);
    next.delete(id);
    return { landedIds: next };
  }),

  clearPending: (id) => set((s) => {
    if (!s.pendingIds.has(id)) return s;
    const next = new Set(s.pendingIds);
    next.delete(id);
    return { pendingIds: next };
  }),

  clearRemoving: (id) => set((s) => {
    if (!s.removingIds.has(id)) return s;
    const next = new Set(s.removingIds);
    next.delete(id);
    return { removingIds: next };
  }),
}));
