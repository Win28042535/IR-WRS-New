"use client";
// ── RankPicker: pick and rank (production WRS #story DNA) ───────────────────────────
// Tap a card to pick it; the order you pick in is the rank (the first pick is #1, marked
// "★ สำคัญที่สุด"). Tap a picked card again to drop it; the ranks below move up. Drag a
// picked card onto another picked card to swap their ranks: with a mouse, drag the card
// itself; on touch, drag the grip (⋮⋮) so the page still scrolls under your thumb.
// Keyboard: Enter/Space picks or drops; on a picked card, ← / ↑ moves it up one rank and
// → / ↓ moves it down.
//   idle    — near-white, faint border, icon at 60%, grey title
//   picked  — lime tint, lime border + 2px glow, icon becomes a black numbered disc (pops)
//   #1      — lime ribbon on the top-right corner
//   drag    — lifted (scale, shadow), follows the pointer; the card under it gets a dashed ring
import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type SVGProps } from "react";

export type RankItem = { id: string; label: string; desc?: string; icon?: (p: SVGProps<SVGSVGElement>) => React.JSX.Element };

type Drag = { id: string; dx: number; dy: number; over: string | null };

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
  const press = useRef<{ id: string; x: number; y: number; moved: boolean; touchGrip: boolean } | null>(null);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (!full) onChange([...selected, id]);
  };
  const swap = (a: string, b: string) => {
    const next = [...selected];
    const i = next.indexOf(a), j = next.indexOf(b);
    if (i < 0 || j < 0) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const shift = (id: string, by: number) => {
    const i = selected.indexOf(id), j = i + by;
    if (i < 0 || j < 0 || j >= selected.length) return;
    swap(id, selected[j]);
  };

  const onDown = (e: ReactPointerEvent<HTMLElement>, id: string, fromGrip = false) => {
    if (e.button !== 0) return;
    const canDrag = selected.includes(id) && (e.pointerType === "mouse" || fromGrip);
    press.current = { id, x: e.clientX, y: e.clientY, moved: false, touchGrip: fromGrip };
    if (canDrag) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current;
    if (!p || !selected.includes(p.id) || !(e.pointerType === "mouse" || p.touchGrip)) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.moved && Math.hypot(dx, dy) < 6) return;
    p.moved = true;
    const under = document.elementsFromPoint(e.clientX, e.clientY)
      .map((el) => (el as HTMLElement).closest?.("[data-rank-id]") as HTMLElement | null)
      .find((el) => el && el.dataset.rankId !== p.id && selected.includes(el.dataset.rankId!));
    setDrag({ id: p.id, dx, dy, over: under?.dataset.rankId ?? null });
  };
  const onUp = () => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.moved) { if (drag?.over) swap(p.id, drag.over); setDrag(null); return; }
    if (!p.touchGrip) toggle(p.id);
  };
  const onCancel = () => { press.current = null; setDrag(null); };
  const onKey = (e: KeyboardEvent<HTMLElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(id); return; }
    if (!selected.includes(id)) return;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); shift(id, -1); }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); shift(id, 1); }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ir-t1">{title}</p>
          <p className="mt-0.5 text-[13px] text-ir-t3">{hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-ir-muted px-2.5 py-1 text-[13px] font-medium text-ir-t2 tabular-nums" role="status">
          เลือกแล้ว {selected.length}/{limit}
        </span>
      </div>

      <div className={`mt-3 grid gap-2.5 ${cols}`}>
        {items.map((it, i) => {
          const rank = selected.indexOf(it.id) + 1;
          const on = rank > 0;
          const dim = full && !on;
          const dragging = drag?.id === it.id;
          const target = drag?.over === it.id;
          const Icon = it.icon;
          return (
            <div
              key={it.id}
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
              style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.03)` } : undefined}
              className={[
                "rk-card group relative flex min-h-[80px] select-none items-center gap-3 rounded-[18px] border px-3.5 py-3 text-left outline-none",
                "focus-visible:ring-3 focus-visible:ring-ir-ring/50",
                dragging ? "z-20 cursor-grabbing shadow-[0_22px_44px_-18px_rgba(20,22,19,0.35)]" : "transition-[background-color,border-color,box-shadow,opacity,transform] duration-200",
                on
                  ? `cursor-grab border-ir-select bg-primary-50 shadow-[0_0_0_2px_rgba(215,224,39,0.22)] ${e2(dragging)}`
                  : dim
                    ? "cursor-not-allowed border-[#ECECEA] bg-[#FCFCFB] opacity-45"
                    : "cursor-pointer border-[#ECECEA] bg-[#FCFCFB] hover:border-ir-select-soft hover:bg-white active:scale-[0.99]",
                target ? "outline-2 outline-dashed outline-offset-2 outline-ir-select" : "",
                itemClassName?.(it.id, i) ?? "",
              ].join(" ")}
            >
              {on ? (
                <span key={rank} className="rk-no grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-[15px] font-bold text-white">{rank}</span>
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center opacity-60">{Icon && <Icon width={24} height={24} className="text-ir-t1" />}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-[15.5px] font-semibold leading-snug ${on ? "text-ir-t1" : "text-ir-t2"}`}>{it.label}</span>
                {it.desc && <span className={`mt-0.5 block text-[13px] leading-snug ${on ? "text-ir-t2" : "text-ir-t3"}`}>{it.desc}</span>}
              </span>
              {on && (
                // Touch drag handle: the card body scrolls the page, the grip drags.
                <span
                  aria-hidden="true"
                  onPointerDown={(e) => { e.stopPropagation(); onDown(e, it.id, true); }}
                  className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-[10px] text-ir-t3 hover:bg-black/[0.04]"
                >
                  <svg width={14} height={20} viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" /><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
                </span>
              )}
              {rank === 1 && (
                <span className="rk-first absolute -right-px -top-px inline-flex items-center gap-1 rounded-[0_18px_0_12px] bg-ir-accent py-1 pl-2.5 pr-3.5 text-[12px] font-semibold text-ir-on-accent">★ สำคัญที่สุด</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 min-h-5 text-center text-[13px] text-ir-t3" aria-live="polite">
        {full && limit < items.length
          ? `เลือกครบ ${limit} แล้ว · กดการ์ดที่เลือกไว้เพื่อเอาออกก่อน ถ้าต้องการเปลี่ยน`
          : selected.length > 1 ? "ลากการ์ดที่เลือกไว้เพื่อสลับลำดับ" : ""}
      </p>
    </div>
  );
}

// A picked card that isn't being dragged can still lift a hair on hover.
const e2 = (dragging: boolean) => (dragging ? "" : "hover:-translate-y-px");
