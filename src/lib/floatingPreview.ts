"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

// Mobile-only "floating preview" — a small, visual confirmation (not just a checkmark+text
// toast) that appears near the bottom of the screen whenever an action produces something
// concrete: a section added to the structure, a website/image added to references, etc.
// Auto-dismisses on its own; callers never need to manage a timer themselves. One shared
// instance is mounted once (see FloatingPreviewToast in flow2/page.tsx) so every step can
// trigger it without owning its own copy of the show/hide/timer logic.
interface Preview {
  id: string;
  swatch: ReactNode;
  label: string;
  sub?: string;
  leaving: boolean;
}

interface FloatingPreviewState {
  preview: Preview | null;
  show: (swatch: ReactNode, label: string, sub?: string) => void;
}

let leaveTimer: ReturnType<typeof setTimeout> | undefined;
let clearTimer: ReturnType<typeof setTimeout> | undefined;

export const useFloatingPreview = create<FloatingPreviewState>((set) => ({
  preview: null,
  show: (swatch, label, sub) => {
    clearTimeout(leaveTimer);
    clearTimeout(clearTimer);
    const id = Math.random().toString(36).slice(2);
    set({ preview: { id, swatch, label, sub, leaving: false } });
    leaveTimer = setTimeout(() => {
      set((s) => (s.preview?.id === id ? { preview: { ...s.preview, leaving: true } } : s));
    }, 1550);
    clearTimer = setTimeout(() => {
      set((s) => (s.preview?.id === id ? { preview: null } : s));
    }, 1800);
  },
}));
