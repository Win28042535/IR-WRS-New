"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { DevicePreview } from "./DevicePreview";
import { useProjectContext } from "@/hooks/useProjectContext";
import { useStore } from "@/lib/store";
import { useSectionFx } from "@/lib/sectionFx";
import { useFloatingPreview } from "@/lib/floatingPreview";
import { sectionById, LEADING_REQUIRED_IDS, TRAILING_REQUIRED_IDS } from "@/lib/data";
import { IconClose } from "./icons";

// ── Panel store (session-scoped, no persist) ──────────────────────────────────
type PanelTab = "sections";

interface PreviewPanelStore {
  open: boolean;
  width: number;
  fullscreen: boolean;
  tab: PanelTab;
  currentStep: number;
  wsCollapsed: boolean;
  // True once the customer has manually toggled the workspace this session — once set,
  // step-driven auto-collapse/auto-open logic must stop overriding their choice.
  wsUserOverride: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
  setWidth: (v: number) => void;
  setFullscreen: (v: boolean) => void;
  setTab: (v: PanelTab) => void;
  setCurrentStep: (n: number) => void;
  toggleWsCollapsed: () => void;
  setWsCollapsed: (v: boolean) => void;
  setWsCollapsedAuto: (v: boolean) => void;
}

export const usePreviewPanel = create<PreviewPanelStore>((set) => ({
  open: true,
  width: 360,
  fullscreen: false,
  tab: "sections",
  currentStep: 1,
  wsCollapsed: true,
  wsUserOverride: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (v) => set({ open: v }),
  setWidth: (v) => set({ width: Math.max(280, Math.min(580, v)) }),
  setFullscreen: (v) => set({ fullscreen: v }),
  setTab: (v) => set({ tab: v }),
  setCurrentStep: (n) => set({ currentStep: n }),
  // Manual toggle (user clicked the divider/dock) — marks the preference as sticky.
  toggleWsCollapsed: () => set((s) => ({ wsCollapsed: !s.wsCollapsed, wsUserOverride: true })),
  setWsCollapsed: (v) => set({ wsCollapsed: v, wsUserOverride: true }),
  // Step-driven default — never marks an override, so it keeps applying until the user acts.
  setWsCollapsedAuto: (v) => set((s) => (s.wsUserOverride ? {} : { wsCollapsed: v })),
}));

// ── Theme tokens ──────────────────────────────────────────────────────────────
// Two visual registers: DARK (compact sidebar) and LIGHT (dominant workspace).
// All sub-components receive the resolved theme so colors stay consistent.

interface PanelTheme {
  outerBg: string;
  outerBorder: string;
  outerRound: string;
  headerBg: string;
  headerBorder: string;
  actionBase: string;
  actionHover: string;
  actionActive: string;
  divider: string;
  listItemBase: string;
  listItemDragging: string;
  listItemTarget: string;
  lockedItemBase: string;
  text1: string;
  text2: string;
  text3: string;
  dragIcon: string;
  progressBg: string;
  progressFill: string;
  emptyBg: string;
  libBg: string;
  libBorder: string;
  libTabActive: string;
  libTabInactive: string;
  libItemBase: string;
  libItemActive: string;
  libItemText: string;
  libItemMeta: string;
  collapseText: string;
  collapseHover: string;
}

const DARK: PanelTheme = {
  outerBg: "#151823",
  outerBorder: "border-white/[0.06]",
  outerRound: "rounded-lg",
  headerBg: "",
  headerBorder: "border-white/[0.07]",
  actionBase: "text-white/40",
  actionHover: "hover:text-white hover:bg-white/[0.08]",
  actionActive: "active:text-white active:bg-white/[0.08]",
  divider: "bg-white/[0.06]",
  listItemBase: "border-transparent bg-white/[0.04] hover:bg-white/[0.06]",
  listItemDragging: "opacity-90 scale-[1.02] -translate-y-0.5 shadow-e4 border-ir-accent/40 bg-white/[0.07] z-10",
  listItemTarget: "border-ir-accent/50 bg-ir-accent/[0.07]",
  lockedItemBase: "border-transparent bg-white/[0.02]",
  text1: "text-white/80",
  text2: "text-white/45",
  text3: "text-white/25",
  dragIcon: "text-white/20",
  progressBg: "bg-white/[0.06]",
  progressFill: "rgba(188,196,22,0.7)",
  emptyBg: "rgba(188,196,22,0.08)",
  libBg: "#151823",
  libBorder: "border-white/[0.07]",
  libTabActive: "bg-white/[0.1] text-white",
  libTabInactive: "text-white/35 hover:text-white/65",
  libItemBase: "bg-white/[0.03] border-transparent hover:bg-white/[0.07] hover:border-white/[0.07]",
  libItemActive: "bg-ir-accent/[0.07] border-ir-accent/30",
  libItemText: "text-white/75",
  libItemMeta: "text-white/28",
  collapseText: "text-white/40 hover:text-white/70",
  collapseHover: "text-ir-accent",
};

const LIGHT: PanelTheme = {
  outerBg: "#F2F4F8",
  outerBorder: "border-ir-border",
  outerRound: "rounded-xl",
  headerBg: "bg-white/80",
  headerBorder: "border-ir-border/60",
  actionBase: "text-ir-t3",
  actionHover: "hover:text-ir-t1 hover:bg-ir-border",
  actionActive: "active:text-ir-t1 active:bg-ir-border",
  divider: "bg-ir-border",
  listItemBase: "border-ir-border/50 bg-ir-card hover:bg-ir-bg",
  listItemDragging: "opacity-95 scale-[1.02] -translate-y-0.5 shadow-e4 border-ir-accent/40 bg-ir-card z-10",
  listItemTarget: "border-ir-accent/50 bg-ir-accent/[0.05]",
  lockedItemBase: "border-transparent bg-ir-t1/[0.025]",
  text1: "text-ir-t1",
  text2: "text-ir-t2",
  text3: "text-ir-t3",
  dragIcon: "text-ir-t3/50",
  progressBg: "bg-ir-border",
  progressFill: "rgba(188,196,22,0.8)",
  emptyBg: "rgba(188,196,22,0.08)",
  libBg: "#FFFFFF",
  libBorder: "border-ir-border",
  libTabActive: "bg-ir-dark text-white",
  libTabInactive: "text-ir-t3 hover:text-ir-t1",
  libItemBase: "bg-transparent border-transparent hover:bg-ir-bg hover:border-ir-border/50",
  libItemActive: "bg-ir-accent/[0.06] border-ir-accent/30",
  libItemText: "text-ir-t1",
  libItemMeta: "text-ir-t3",
  collapseText: "text-ir-t3 hover:text-ir-t1",
  collapseHover: "text-ir-accent",
};

// ── Local icons ───────────────────────────────────────────────────────────────
function IconChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5.5 3.5L9 7L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M8.5 3.5L5 7L8.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
// Thin drag-handle grip, not a semantic pictogram — forcing a literal square would distort
// it, so it keeps its 10:16 aspect ratio and scales up proportionally until its shorter
// dimension (width) reaches the 20px system-wide icon floor (10×16 → 20×32).
function IconGrip() {
  return (
    <svg width="20" height="32" viewBox="0 0 10 16" fill="none">
      <circle cx="3" cy="4" r="1.2" fill="currentColor" />
      <circle cx="7" cy="4" r="1.2" fill="currentColor" />
      <circle cx="3" cy="8" r="1.2" fill="currentColor" />
      <circle cx="7" cy="8" r="1.2" fill="currentColor" />
      <circle cx="3" cy="12" r="1.2" fill="currentColor" />
      <circle cx="7" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}



// ── Main exported component ───────────────────────────────────────────────────
// dominant=true  → panel is flex-1 (fills remaining workspace), light surface
// dominant=false → panel is fixed-width sidebar, dark surface (original)
export function PreviewPanel({ hidden = false, dominant = false, embedded = false, flush = false }: { hidden?: boolean; dominant?: boolean; embedded?: boolean; flush?: boolean }) {
  const { open, width, fullscreen, tab, toggle, setWidth, setFullscreen } =
    usePreviewPanel();
  const ctx = useProjectContext();
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const theme = dominant ? LIGHT : DARK;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, setFullscreen]);

  // Drag resize only applies to non-dominant (sidebar) mode
  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (dominant) return;
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
      setIsDragging(true);
    },
    [width, dominant]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = dragStartX.current - e.clientX;
      setWidth(dragStartWidth.current + delta);
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, setWidth]);

  if (hidden) return null;

  // Sizing strategy:
  // dominant + open  → flex-1 min-w-0 (fills workspace)
  // dominant + closed → 44px collapsed strip
  // sidebar  + any   → fixed pixel width from store
  const panelPx = open ? width : 44;
  const cssTransition = isDragging ? "none" : "width var(--motion-base) var(--motion-ease-out)";

  const outerClass = embedded
    ? "flex flex-col h-full w-full relative"
    : dominant && open
      ? "hidden lg:flex flex-1 min-w-0 sticky top-6 self-start relative"
      : "hidden lg:block shrink-0 sticky top-6 self-start relative";

  const outerStyle: React.CSSProperties = embedded
    ? {}
    : dominant && open
      ? { height: "calc(100vh - 3rem)" }
      : dominant
        ? { width: 44, height: "calc(100vh - 3rem)" }
        : { width: panelPx, height: "calc(100vh - 3rem)", transition: cssTransition, userSelect: isDragging ? "none" : undefined };

  return (
    <>
      <div className={outerClass} style={outerStyle as React.CSSProperties}>
        {/* Drag handle sidebar mode only */}
        {!dominant && open && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[7px] z-10 cursor-ew-resize flex items-center justify-center group"
            onMouseDown={onResizeMouseDown}
            aria-label="Resize preview panel"
          >
            <div className="w-full h-full rounded-l-lg group-hover:bg-ir-accent/20 transition-colors duration-instant" />
            <div className="absolute text-white/15 group-hover:text-ir-accent/60 transition-colors duration-instant pointer-events-none">
              <IconGrip />
            </div>
          </div>
        )}

        <div
          className={`h-full flex flex-col overflow-hidden ${flush ? "border-l" : `border ${theme.outerRound}`} ${theme.outerBorder}`}
          style={{ background: theme.outerBg, marginLeft: (!dominant && !embedded && open) ? 7 : 0 }}
        >
          {open ? (
            <OpenPanel
              tab={tab}
              setFullscreen={setFullscreen}
              toggle={toggle}
              ctx={ctx}
              theme={theme}
              dominant={dominant}
              embedded={embedded}
            />
          ) : (
            <CollapsedStrip toggle={toggle} theme={theme} />
          )}
        </div>
      </div>

      {mounted && fullscreen && createPortal(
        <FullscreenOverlay ctx={ctx} onClose={() => setFullscreen(false)} />,
        document.body
      )}
    </>
  );
}

// ── Open panel ────────────────────────────────────────────────────────────────
function OpenPanel({
  tab, setFullscreen, toggle, ctx, theme, dominant, embedded,
}: {
  tab: PanelTab;
  setFullscreen: (v: boolean) => void;
  toggle: () => void;
  ctx: ReturnType<typeof useProjectContext>;
  theme: PanelTheme;
  dominant: boolean;
  embedded: boolean;
}) {
  const toggleWsCollapsed = usePreviewPanel((s) => s.toggleWsCollapsed);

  return (
    <>
      {/* Header compact toolbar, 32px */}
      <div
        className={`shrink-0 flex items-center px-3 border-b ${theme.headerBorder} ${theme.headerBg}`}
        style={{ height: 32 }}
      >
        {/* Panel title. This was previously rendered as a filled "tab" pill, but there has
            only ever been one tab — a static label styled as a switchable control read as
            a tab bar with a missing sibling. It's a heading now, and the section count +
            drag hint live one level down (see SectionWorkspace) so the three read as a
            clear title → count → hint hierarchy instead of three equal-weight lines. */}
        <h2 className={`flex-1 min-w-0 text-small font-semibold tracking-tight truncate ${theme.text1}`}>
          โครงสร้างเว็บไซต์
        </h2>

        {/* Right controls: Collapse */}
        <div className="flex items-center gap-px shrink-0 ml-1">
          {/* On mobile the bottom sheet's own handle is the single open/close control
              (tap it to toggle), so this desktop-style chevron would be a second,
              differently-shaped way to do the same thing — hidden below md. */}
          {embedded && (
            <button
              onClick={toggleWsCollapsed}
              className={`hidden md:flex w-6 h-6 items-center justify-center rounded-sm transition-colors duration-instant ${theme.actionBase} ${theme.actionHover} ${theme.actionActive}`}
              title="ซ่อน Workspace"
            >
              <IconChevronRight />
            </button>
          )}
          {!embedded && (
            <button
              onClick={toggle}
              className={`w-6 h-6 flex items-center justify-center rounded-sm transition-colors duration-instant ${theme.actionBase} ${theme.actionHover} ${theme.actionActive}`}
              title="ซ่อน"
            >
              <IconChevronRight />
            </button>
          )}
        </div>
      </div>

      {/* Tab content keyed so React remounts on switch, triggering wrs-tab-enter fade */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div key={tab} className="flex-1 min-h-0 flex flex-col wrs-tab-enter">
          {tab === "sections" && (
            <SectionWorkspace sections={ctx.selectedSections} theme={theme} />
          )}
        </div>
      </div>
    </>
  );
}


// ── Collapsed strip ───────────────────────────────────────────────────────────
function CollapsedStrip({ toggle, theme }: { toggle: () => void; theme: PanelTheme }) {
  return (
    <button
      onClick={toggle}
      className={`w-full h-full flex flex-col items-center py-4 gap-2 transition-colors duration-fast group ${theme.collapseText}`}
      title="เปิด Preview"
    >
      <IconChevronLeft className={`transition-colors group-hover:${theme.collapseHover}`} />
      <span
        className="text-small font-semibold tracking-widest transition-colors"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        PREVIEW
      </span>
    </button>
  );
}

// ── Section workspace ─────────────────────────────────────────────────────────
// ── Sections tab — review + reorder the chosen site structure. ───────────────
// Drag a row (by its grip) up or down to change the page order; the new order is
// written straight back to the draft. Adding/removing sections still belongs to the
// questionnaire flow — this surface only browses, previews, and reorders.
// Header/Hero pin to the very front of `sections` and Footer pins to the very back (the
// Structure step backfills and normalizes them there) — everything in between is the user's
// own, freely reorderable. Which rows count as locked is derived from the row's own id
// (matched against LEADING_REQUIRED_IDS / TRAILING_REQUIRED_IDS) rather than a hardcoded
// count, so this degrades gracefully — nothing gets wrongly locked — for any caller whose
// `sections` doesn't (yet) carry the full fixed set in the expected slots.
function lockBounds(sections: string[]) {
  let leadingLockEnd = 0;
  while (leadingLockEnd < sections.length && LEADING_REQUIRED_IDS.includes(sections[leadingLockEnd])) leadingLockEnd++;
  let trailingLockStart = sections.length;
  while (trailingLockStart > leadingLockEnd && TRAILING_REQUIRED_IDS.includes(sections[trailingLockStart - 1])) trailingLockStart--;
  return { leadingLockEnd, trailingLockStart };
}

function SectionWorkspace({ sections, theme }: { sections: string[]; theme: PanelTheme }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updateDraft = useStore((s) => s.updateDraft);
  const landedIds = useSectionFx((s) => s.landedIds);
  const removingIds = useSectionFx((s) => s.removingIds);
  const pendingIds = useSectionFx((s) => s.pendingIds);
  const inboundFlight = useSectionFx((s) => s.flight?.direction === "add");

  // Auto-open the first optional row once, the first time the list actually has one — so the
  // expand-to-preview affordance gets discovered instead of every row looking equally inert.
  // Fires only once per mount; a user who collapses it back isn't fought on the next render.
  const autoExpandedRef = useRef(false);
  useEffect(() => {
    if (autoExpandedRef.current) return;
    const { leadingLockEnd, trailingLockStart } = lockBounds(sections);
    const firstOptionalId = sections.find((_, i) => i >= leadingLockEnd && i < trailingLockStart);
    if (firstOptionalId) {
      setExpandedId(firstOptionalId);
      autoExpandedRef.current = true;
    }
  }, [sections]);

  // Drag-to-reorder state. dragIndex/overIndex drive the visual feedback (re-render on
  // change); the refs mirror them so the drop handler always reads the latest value even
  // if drop fires in the same tick as the preceding move (state updates inside React event
  // handlers don't apply synchronously, so a state-only read here would see stale nulls on
  // a fast drag). Driven by Pointer Events (not native HTML5 drag-and-drop) specifically so
  // this works with touch — `draggable`/dragstart/dragover never fire from touch input on
  // mobile browsers, which made reordering silently impossible on a phone before this.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});

  // Id of the row that just settled into a new position — reuses the exact same
  // "settle + accent glow" look (`wrs-row-landed`) a freshly-added row gets, so a reorder
  // and an add read as the same kind of confirmation. Its position number also pops
  // (`wrs-counter-pop`), and mobile gets the same floating-preview toast every other
  // structure-list action already uses.
  const [reorderedId, setReorderedId] = useState<string | null>(null);
  const reorderedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reorderedTimer.current), []);

  // While dragging, every row between the dragged item's origin and the current hover
  // target slides out of the way by the dragged row's own height — a live preview of the
  // reorder rather than just a static insertion line, so the list reads as an actual
  // sortable canvas instead of a place you drop things onto blindly.
  const ROW_GAP = 4; // matches the list's `space-y-1`
  const draggedRowHeight = dragIndex !== null
    ? rowRefs.current[sections[dragIndex]]?.getBoundingClientRect().height ?? 0
    : 0;
  const getShiftPx = (i: number) => {
    if (dragIndex === null || overIndex === null || i === dragIndex || draggedRowHeight === 0) return 0;
    const shift = draggedRowHeight + ROW_GAP;
    if (dragIndex < overIndex && i > dragIndex && i <= overIndex) return -shift; // dragging down: make room above the target
    if (dragIndex > overIndex && i < dragIndex && i >= overIndex) return shift;  // dragging up: make room below the target
    return 0;
  };

  // Bounds of the freely-reorderable zone — a valid source/target index must land at or
  // after `leadingLockEnd` and stay below `trailingLockStart`.
  const { leadingLockEnd, trailingLockStart } = lockBounds(sections);

  const commitReorder = (from: number, to: number) => {
    if (from === to || from < leadingLockEnd || to < leadingLockEnd || from >= trailingLockStart || to >= trailingLockStart) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateDraft({ selectedSections: next });

    setReorderedId(moved);
    clearTimeout(reorderedTimer.current);
    reorderedTimer.current = setTimeout(() => setReorderedId(null), 450);

    const sec = sectionById(moved);
    useFloatingPreview.getState().show(
      <span className="text-body leading-none">{sec?.icon ?? "📄"}</span>,
      `ย้าย ${sec?.name?.split(" / ")[0] ?? moved} แล้ว`,
      `อันดับที่ ${to + 1}`
    );
  };

  // Which row index a given pointer Y position is currently over — hit-tests actual row
  // rects rather than dividing by a uniform row height, since an expanded row is taller.
  const indexAtClientY = (clientY: number) => {
    for (let idx = 0; idx < sections.length; idx++) {
      const el = rowRefs.current[sections[idx]];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return idx;
    }
    return sections.length - 1;
  };

  const beginRowDrag = (e: React.PointerEvent, i: number) => {
    if (i < leadingLockEnd || i >= trailingLockStart) return; // fixed structure — not draggable
    if (pendingIds.has(sections[i])) return; // still mid insert-animation, not draggable yet
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragPointerIdRef.current = e.pointerId;
    dragIndexRef.current = i;
    setDragIndex(i);
    overIndexRef.current = i;
    setOverIndex(i);
  };
  const moveRowDrag = (e: React.PointerEvent) => {
    if (dragIndexRef.current === null || dragPointerIdRef.current !== e.pointerId) return;
    // Clamp the drop target to the reorderable zone — an optional row can reorder among its
    // own kind, but never land in front of Header/Hero or behind Footer.
    const next = Math.max(leadingLockEnd, Math.min(trailingLockStart - 1, indexAtClientY(e.clientY)));
    if (overIndexRef.current !== next) { overIndexRef.current = next; setOverIndex(next); }
  };
  const endRowDrag = () => {
    if (dragIndexRef.current !== null && overIndexRef.current !== null) {
      commitReorder(dragIndexRef.current, overIndexRef.current);
    }
    dragPointerIdRef.current = null;
    dragIndexRef.current = null;
    overIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {/* Header — the panel title lives in the toolbar above; this level carries the
          count (the one number worth scanning) and the hint. Three distinct weights so
          the eye lands on the count first, then the hint, instead of three similar
          10-11px lines reading as one grey block. Counts every row including the locked
          Header/Hero/Footer — unlike the mobile collapsed-bar summary (which has no rows
          in view to anchor against), this header sits directly above the visible list, so
          the number should match what's actually shown there rather than only the
          user-added portion. */}
      <div className="shrink-0 px-2.5 pt-2.5 pb-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-lead font-semibold leading-none tabular-nums ${theme.text1}`}>
            {sections.length}
          </span>
          <span className={`text-small font-medium leading-none ${theme.text2}`}>Section</span>
        </div>
        <p className={`text-small mt-1.5 leading-relaxed ${theme.text3}`}>
          ลากขึ้น-ลงเพื่อจัดลำดับหน้า · เพิ่ม/ลบได้จากขั้นตอนคำถาม
        </p>
      </div>

      {/* Divider */}
      <div className={`shrink-0 h-px mx-2.5 ${theme.divider}`} />

      {/* List — drag to reorder, expand to preview content. Gets a soft, transient accent
          wash while a ghost is inbound from the picker, so the destination reads as "about
          to receive something" before the item actually lands. */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 transition-colors duration-fast ${inboundFlight ? "wrs-list-inbound" : ""}`}>
        {sections.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center py-6 px-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: theme.emptyBg }}
            >
              <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3" width="14" height="2.5" rx="1.25" fill="rgba(188,196,22,0.45)" />
                <rect x="2" y="7.5" width="10" height="2.5" rx="1.25" fill="rgba(188,196,22,0.25)" />
                <rect x="2" y="12" width="12" height="2.5" rx="1.25" fill="rgba(188,196,22,0.25)" />
              </svg>
            </div>
            <p className={`text-small leading-relaxed ${theme.text3}`}>
              ยังไม่มี Section<br />เลือกได้จากขั้นตอนคำถาม
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((id, i) => {
              const sec = sectionById(id);
              // Section names are authored as "English / ไทย". Splitting them lets the two
              // halves carry different weights — previously the whole string rendered at one
              // weight, so the name, its translation, the index and the category all read as
              // the same tier and there was no obvious place for the eye to land first.
              const fullName = sec?.name ?? id;
              const slashAt = fullName.indexOf(" / ");
              const primaryName = slashAt === -1 ? fullName : fullName.slice(0, slashAt);
              const secondaryName = slashAt === -1 ? "" : fullName.slice(slashAt + 3);
              const expanded = expandedId === id;
              const isDragging = dragIndex === i;
              const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
              const isLanded = landedIds.has(id);
              const isRemoving = removingIds.has(id);
              // Newly-added row: stays invisible until its ghost actually lands, so the
              // hand-off reads as "the ghost became this row" rather than the row popping in
              // on its own while a duplicate ghost is still mid-flight.
              const isPending = pendingIds.has(id);
              const isLocked = i < leadingLockEnd || i >= trailingLockStart;
              // Which edge of this row the insertion line lands on — above, if the
              // dragged row is coming from further down the list; below otherwise.
              const insertAtTop = isOver && dragIndex !== null && dragIndex > i;
              const insertAtBottom = isOver && dragIndex !== null && dragIndex < i;
              const shiftPx = getShiftPx(i);

              // Fixed structure — shown so the full page order stays visible, but with every
              // interaction stripped: no grip, no drag, no expand-to-preview, no hover state.
              // A lock icon replaces the chevron as the only trailing mark, and the row sits
              // on a barely-there tint instead of the interactive rows' card-like surface, so
              // it reads as inert information rather than another choice.
              if (isLocked) {
                return (
                  <div
                    key={id}
                    ref={(el) => { rowRefs.current[id] = el; }}
                    data-section-row={id}
                    className={`relative rounded-sm border cursor-default ${theme.lockedItemBase}`}
                  >
                    <div className="w-full flex items-center gap-1.5 px-2 py-2">
                      <span className={`text-small w-5 shrink-0 text-right tabular-nums select-none ${theme.text3}`}>
                        {i + 1}
                      </span>
                      {sec?.icon && <span className="text-body leading-none shrink-0 opacity-70">{sec.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="truncate leading-tight">
                          <span className={`text-small font-medium ${theme.text2}`}>{primaryName}</span>
                          {secondaryName && (
                            <span className={`ml-1.5 text-small font-normal ${theme.text3}`}>{secondaryName}</span>
                          )}
                        </p>
                        {sec?.category && (
                          <p className={`text-small mt-1 uppercase tracking-wider leading-none ${theme.text3}`}>
                            {sec.category}
                          </p>
                        )}
                      </div>
                      {/* Same glyph as the shared `IconLock`, rendered raw at 18px — `icons.tsx`
                          enforces a 24px floor on every icon it exports, and this row's trailing
                          mark is a deliberate 18px exception to match the row's compact scale. */}
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className={`shrink-0 ${theme.text3}`}>
                        <rect x="3.5" y="7" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={id}
                  ref={(el) => { rowRefs.current[id] = el; }}
                  data-section-row={id}
                  style={!isDragging && shiftPx !== 0 ? { transform: `translateY(${shiftPx}px)` } : undefined}
                  className={`relative rounded-sm border transition-all duration-instant ${theme.listItemBase} ${
                    isDragging ? theme.listItemDragging : ""
                  } ${isOver ? theme.listItemTarget : ""} ${
                    isLanded || reorderedId === id ? "wrs-row-landed" : ""
                  } ${isRemoving ? "wrs-row-removing" : ""} ${
                    isPending ? "opacity-0 scale-95 pointer-events-none" : ""
                  }`}
                >
                  {/* Insertion indicator — a precise line at the exact edge the row will drop to */}
                  {(insertAtTop || insertAtBottom) && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1 right-1 h-[2.5px] rounded-full bg-ir-accent pointer-events-none"
                      style={{
                        [insertAtTop ? "top" : "bottom"]: "-3px",
                        boxShadow: "0 0 6px rgba(188,196,22,0.65)",
                      }}
                    />
                  )}
                  <div className="w-full flex items-center gap-1.5 px-2 py-2">
                    {/* Drag handle — stretched to the row's full height (not just a small
                        square) so there's a much larger, easier-to-land-on target to grab,
                        hover chip, accent-tinted while active. Pointer Events (not native
                        HTML5 drag-and-drop) so this works via touch, not just mouse. */}
                    <span
                      className={`shrink-0 self-stretch -my-2 -ml-1 flex items-center justify-center w-8 rounded-sm cursor-grab active:cursor-grabbing touch-none select-none wrs-no-callout transition-colors ${
                        isDragging ? "bg-ir-accent/20 text-ir-accent" : `${theme.text2} hover:bg-ir-accent/10 hover:text-ir-accent`
                      }`}
                      aria-label="ลากเพื่อจัดลำดับ"
                      title="ลากเพื่อจัดลำดับ"
                      onPointerDown={(e) => beginRowDrag(e, i)}
                      onPointerMove={moveRowDrag}
                      onPointerUp={endRowDrag}
                      onPointerCancel={endRowDrag}
                    >
                      <IconGrip />
                    </span>
                    <button
                      onClick={() => setExpandedId(expanded ? null : id)}
                      className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
                    >
                      <span className={`text-small w-5 shrink-0 text-right tabular-nums select-none ${theme.text3} ${reorderedId === id ? "wrs-counter-pop" : ""}`}>
                        {i + 1}
                      </span>
                      {sec?.icon && <span className="text-body leading-none shrink-0">{sec.icon}</span>}
                      <div className="flex-1 min-w-0">
                        {/* Primary: the section name. Secondary: its Thai gloss, same line
                            but lighter. Tertiary: the category, as a small uppercase meta
                            label that clearly reads as a tag rather than more of the name. */}
                        <p className="truncate leading-tight">
                          <span className={`text-small font-semibold ${theme.text1}`}>{primaryName}</span>
                          {secondaryName && (
                            <span className={`ml-1.5 text-small font-normal ${theme.text3}`}>{secondaryName}</span>
                          )}
                        </p>
                        {sec?.category && (
                          <p className={`text-small mt-1 uppercase tracking-wider leading-none ${theme.text3}`}>
                            {sec.category}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 transition-transform duration-instant ${theme.text3}`} style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
                        <svg width="18" height="18" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </button>
                  </div>
                  {expanded && (sec?.businessPurpose || sec?.desc) && (
                    <div className="px-2.5 pb-2.5 -mt-0.5">
                      <p className={`text-small leading-relaxed ${theme.text2}`}>
                        {sec?.businessPurpose ?? sec?.desc}
                      </p>
                      {sec?.example && (
                        <p className={`text-small mt-1 leading-relaxed ${theme.text3}`}>
                          ตัวอย่าง: {sec.example}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fullscreen overlay device switching lives here only ─────────────────────
function FullscreenOverlay({ ctx, onClose }: { ctx: ReturnType<typeof useProjectContext>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#0C0E15" }}>
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ir-live ir-live-dot" />
          <span className="text-body font-semibold text-white/70">Live Preview</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors duration-instant text-body"
        >
          <IconClose width={24} height={24} />
          <span>ปิด</span>
          <kbd className="text-white/25 text-small ml-1 font-mono">ESC</kbd>
        </button>
      </div>

      {/* DevicePreview owns device switching in fullscreen */}
      <div className="flex-1 overflow-auto py-6 px-6">
        <DevicePreview
          directionId={ctx.selectedDirection}
          industry={ctx.industry}
          sections={ctx.selectedSections}
          company={ctx.company}
          moods={ctx.selectedMoods}
          layout={ctx.selectedLayout}
        />
      </div>
    </div>
  );
}
