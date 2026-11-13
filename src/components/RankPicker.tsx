"use client";
// ── RankPicker: pick and rank (production WRS #story DNA) ───────────────────────────
// Tap a card to pick it; the order you pick in is the rank (the first pick is #1, marked
// "★ สำคัญที่สุด"). Tap a picked card again to drop it; the ranks below move up.
// Re-rank by dragging a picked card toward another picked card: the nearest one is the
// target and every number updates live. Mouse: drag the card or its grip. Touch (any
// screen size): drag the grip (⋮⋮), so the card body still scrolls the page.
// Keyboard: Enter/Space picks or drops; ← / ↑ moves a picked card up a rank, → / ↓ down.
//   idle     — near-white, faint border, icon at 60%, grey title
//   picked   — lime tint, lime border + 2px glow, icon becomes a black numbered disc (pops)
//   #1       — lime ribbon on the top-right corner
//   lifted   — card follows the pointer, tilted and enlarged with a deep shadow; its slot
//              shows a dashed outline; other picked cards fade a little; a light buzz on
//              phones that support it
//   target   — dashed lime ring + "วางที่นี่" on the card it will take the place of
//   dropped  — the card glides back into its slot, glows once, a buzz, and a line under the
//              grid says what moved where (also read out by screen readers)
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type SVGProps } from "react";
import { DUR, EASE } from "@/lib/motion";
import { useDragAutoScroll } from "@/lib/useDragAutoScroll";

export type RankItem = { id: string; label: string; desc?: string; icon?: (p: SVGProps<SVGSVGElement>) => React.JSX.Element };

type Drag = { id: string; dx: number; dy: number; over: string | null };
// A light buzz on phones — only after a real tap (Chrome blocks it otherwise).
export const buzz = (ms: number) => {
  try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(ms); } catch { /* not supported */ }
};

export function RankPicker({
  items, selected: rawSelected, onChange, max, title = "เลือกและจัดลำดับความสำคัญ", hint = "การ์ดแรกที่กดคือลำดับที่ 1",
  cols = "sm:grid-cols-2", itemClassName,
}: {
  items: RankItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  title?: string;
  hint?: string;
  cols?: string;
  itemClassName?: (id: string, i: number) => string;
}) {
  // Only ids that are on the list count (a stale id in an old draft is ignored).
  const selected = rawSelected.filter((id) => items.some((it) => it.id === id));
  const limit = max ?? items.length;
  const full = selected.length >= limit;
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<{ id: string; x: number; y: number; lastX: number; lastY: number; moved: boolean; touchGrip: boolean; root: ParentNode } | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [flash, setFlash] = useState<string | null>(null);      // card that just landed
  const [moved, setMoved] = useState<string>("");               // "ย้าย … ไปลำดับที่ … แล้ว"
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const label = (id: string) => items.find((it) => it.id === id)?.label ?? id;
  // after any re-rank: glow the card once and say what happened
  const landed = (id: string, next: string[]) => {
    timers.current.forEach(clearTimeout);
    setFlash(id);
    setMoved(`ย้าย “${label(id)}” ไปลำดับที่ ${next.indexOf(id) + 1} แล้ว`);
    timers.current = [setTimeout(() => setFlash(null), 900), setTimeout(() => setMoved(""), 2600)];
  };

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (!full) onChange([...selected, id]);
  };
  // Move `id` to another card's rank (the cards in between shift by one).
  const moveTo = (list: string[], id: string, target: string) => {
    const next = list.filter((x) => x !== id);
    const j = list.indexOf(target);
    if (j < 0) return list;
    next.splice(j, 0, id);
    return next;
  };
  const shift = (id: string, by: number) => {
    const i = selected.indexOf(id), j = i + by;
    if (i < 0 || j < 0 || j >= selected.length) return;
    const next = [...selected];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    landed(id, next);
  };

  const auto = useDragAutoScroll();
  // The lifted card follows the pointer; near the top / bottom edge the page scrolls, and
  // the card's offset includes that scroll so it stays under the finger.
  const track = (clientX: number, clientY: number) => {
    const p = press.current;
    if (!p) return;
    p.lastX = clientX; p.lastY = clientY;
    const dx = clientX - p.x, dy = clientY - p.y + auto.offset();
    if (!p.moved && Math.hypot(dx, dy) < 6) return;
    if (!p.moved) buzz(8);
    p.moved = true;
    auto.move(clientY);
    // The drop target is the nearest other picked card — no need to land exactly on it.
    let over: string | null = null, best = Infinity;
    for (const id of selected) {
      if (id === p.id) continue;
      const r = p.root.querySelector<HTMLElement>(`[data-rank-id="${id}"]`)?.getBoundingClientRect();
      if (!r) continue;
      const d = Math.hypot(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2));
      if (d < best) { best = d; over = id; }
    }
    setDrag({ id: p.id, dx, dy, over });
  };
  const onDown = (e: ReactPointerEvent<HTMLElement>, id: string, fromGrip = false) => {
    if (e.button !== 0) return;
    const canDrag = selected.includes(id) && (e.pointerType === "mouse" || fromGrip);
    const root = e.currentTarget.closest("[data-rank-root]") ?? document;
    press.current = { id, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, touchGrip: fromGrip, root };
    if (canDrag) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      auto.begin(e.currentTarget, () => { const q = press.current; if (q?.moved) track(q.lastX, q.lastY); });
    }
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current;
    if (!p || !selected.includes(p.id) || !(e.pointerType === "mouse" || p.touchGrip)) return;
    track(e.clientX, e.clientY);
  };
  const onUp = () => {
    const p = press.current;
    press.current = null;
    auto.stop();
    if (!p) return;
    if (p.moved) {
      const el = cardRefs.current[p.id];
      if (el && drag && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.animate(
          [{ transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.04) rotate(1.5deg)` }, { transform: "none" }],
          { duration: DUR.base, easing: EASE.spring },
        );
      }
      if (drag?.over) {
        const next = moveTo(selected, p.id, drag.over);
        onChange(next);
        landed(p.id, next);
        buzz(14);
      }
      setDrag(null);
      return;
    }
    if (!p.touchGrip) toggle(p.id);
  };
  const onCancel = () => { press.current = null; auto.stop(); setDrag(null); };
  const onKey = (e: KeyboardEvent<HTMLElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(id); return; }
    if (!selected.includes(id)) return;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); shift(id, -1); }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); shift(id, 1); }
  };

  return (
    <div data-rank-root>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-semibold text-ir-t1">{title}</p>
          <p className="mt-0.5 text-caption text-ir-t3">{hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-ir-muted px-2.5 py-1 text-caption font-medium text-ir-t2 tabular-nums" role="status">
          เลือกแล้ว {selected.length}/{limit}
        </span>
      </div>

      <div className={`mt-3 grid gap-2.5 ${cols}`}>
        {items.map((it, i) => {
          const order = drag?.over ? moveTo(selected, drag.id, drag.over) : selected;
          const rank = order.indexOf(it.id) + 1;
          const on = rank > 0;
          const dim = full && !on;
          const dragging = drag?.id === it.id;
          const target = drag?.over === it.id;
          const resting = !!drag && on && !dragging && !target;
          const Icon = it.icon;
          return (
            // The slot: while its card is lifted it shows where the card came from.
            <div key={it.id} className={`relative flex min-w-0 rounded-xl ${dragging ? "border-2 border-dashed border-ir-select/70 bg-primary-50/50" : ""} ${itemClassName?.(it.id, i) ?? ""}`}>
            <div
              ref={(el) => { cardRefs.current[it.id] = el; }}
              role="button"
              data-rank-id={it.id}
              tabIndex={dim ? -1 : 0}
              aria-pressed={on}
              aria-disabled={dim || undefined}
              aria-label={`${it.label}${on ? ` ลำดับที่ ${rank}` : ""}`}
              onPointerDown={(e) => !dim && onDown(e, it.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onCancel}
              onKeyDown={(e) => !dim && onKey(e, it.id)}
              style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.04) rotate(1.5deg)` } : undefined}
              className={[
                "rk-card group relative flex min-h-[80px] w-full select-none items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none",
                "focus-ring",
                dragging ? "z-30 cursor-grabbing shadow-e4 ring-2 ring-ir-select" : "transition-[background-color,border-color,box-shadow,opacity,transform] duration-fast",
                resting ? "opacity-70" : "",
                flash === it.id ? "rk-landed" : "",
                on
                  ? `cursor-grab border-ir-select bg-primary-50 shadow-selected ${e2(dragging)}`
                  : dim
                    ? "cursor-not-allowed border-ir-border-soft bg-ir-card-idle opacity-45"
                    : "cursor-pointer border-ir-border-soft bg-ir-card-idle hover:border-ir-select-soft hover:bg-white active:scale-[0.99]",
                target ? "outline-2 outline-dashed outline-offset-2 outline-ir-select" : "",
              ].join(" ")}
            >
              {target && <span className="rk-drop-hint pointer-events-none absolute -top-3 left-4 z-10 rounded-full bg-ir-dark px-2.5 py-0.5 text-caption font-semibold text-ir-accent">วางที่นี่</span>}
              {on ? (
                <span key={rank} className="rk-no grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-body font-bold text-white">{rank}</span>
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center opacity-60">{Icon && <Icon width={24} height={24} className="text-ir-t1" />}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-body font-semibold leading-snug ${on ? "text-ir-t1" : "text-ir-t2"}`}>{it.label}</span>
                {it.desc && <span className={`mt-0.5 block text-caption leading-snug ${on ? "text-ir-t2" : "text-ir-t3"}`}>{it.desc}</span>}
              </span>
              {on && (
                <>
                {/* Drag handle — every screen size; on touch this is where a drag starts. */}
                <span
                  aria-hidden="true"
                  onPointerDown={(e) => { e.stopPropagation(); onDown(e, it.id, true); }}
                  className={`grid h-12 w-10 shrink-0 cursor-grab touch-none place-items-center rounded-md text-ir-t2 transition-colors hover:bg-black/[0.05] active:bg-black/[0.07] ${rank === 1 ? "mt-4" : ""}`}
                >
                  <svg width={14} height={20} viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" /><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
                </span>
                </>
              )}
              {rank === 1 && (
                <span className="rk-first absolute -right-px -top-px inline-flex items-center gap-1 rounded-tr-md rounded-bl-sm bg-ir-accent py-1 pl-2.5 pr-3.5 text-caption font-semibold text-ir-on-accent">★ สำคัญที่สุด</span>
              )}
            </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 flex min-h-8 items-center justify-center text-center text-small text-ir-t3" aria-live="polite">
        {moved ? (
          <span key={moved} className="rk-moved inline-flex items-center gap-1.5 rounded-full bg-ir-accent-soft px-3 py-1 font-semibold text-ir-t1">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ir-accent-text"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
            {moved}
          </span>
        ) : full && limit < items.length
          ? `เลือกครบ ${limit} แล้ว · กดการ์ดที่เลือกไว้เพื่อเอาออกก่อน ถ้าต้องการเปลี่ยน`
          : selected.length > 1 ? "ลากที่ ⋮⋮ เพื่อสลับลำดับ" : ""}
      </p>
    </div>
  );
}

// A picked card that isn't being dragged can still lift a hair on hover.
const e2 = (dragging: boolean) => (dragging ? "" : "hover:-translate-y-px");
