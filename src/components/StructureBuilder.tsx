"use client";
// ── Structure step: pick + order homepage sections (production WRS #story DNA) ──────
//   recommendation bar — "มีชุดเนื้อหาที่แนะนำจากคำตอบก่อนหน้า" + "✦ ใช้คำแนะนำ"; pressing it fills
//                         the outline with the recommended set, then the bar folds away
//   sources (left)     — every optional section; "แนะนำ" tag on the recommended ones; the
//                         "+" disc turns into the black rank number once the section is in
//   outline (right)    — "ลำดับเนื้อหาบนเว็บไซต์" n/max: dashed empty slots, filled rows (bold,
//                         black number, ✕ to remove), Header / Hero / Footer fixed by the system
//   flight             — adding a section sends a white pill (lime number + name) from its
//                         row into the next empty slot; the row pops in as it lands
// Reorder the outline by dragging a row (mouse: the row; touch: the grip) or with ↑ / ↓.
// Data: draft.selectedSections, header + hero first and footer last, unchanged shape.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  GOAL_SECTIONS, LEADING_REQUIRED_IDS, REQUIRED_SECTION_IDS, RULES, SECTIONS, TRAILING_REQUIRED_IDS,
  audienceById, directionById, sectionById,
} from "@/lib/data";
import { profileToDirection, rankDirections } from "@/lib/recommend";
import { buzz } from "@/components/RankPicker";
import type { Requirement } from "@/lib/types";

const MAX_OPT = RULES.sections.max - REQUIRED_SECTION_IDS.length;
const MIN_OPT = Math.max(1, RULES.sections.min - REQUIRED_SECTION_IDS.length);
const shortName = (id: string) => (sectionById(id)?.name ?? id).split(" / ")[0];
const FLIGHT_MS = 560;

type Flight = { key: number; from: DOMRect; to: DOMRect; n: number; title: string };

export function StructureBuilder({ draft, updateDraft }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void }) {
  // The Direction is picked from the answers; make sure one is set even if Explore was skipped.
  const ranked = rankDirections(draft.industry, draft.companyType, draft.businessGoals);
  const ai = draft.designProfile ? profileToDirection(draft.designProfile) : null;
  const bestId = ai?.direction.id || ranked[0]?.id;
  useEffect(() => {
    if (!draft.selectedDirection && bestId) {
      const d = directionById(bestId);
      updateDraft({ selectedDirection: bestId, directionLabel: d?.label || "", selectedLayout: d?.layout || "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestId]);

  const all: string[] = draft.selectedSections ?? [];
  const optional = all.filter((id) => !REQUIRED_SECTION_IDS.includes(id));
  const full = optional.length >= MAX_OPT;
  const commit = (next: string[]) => updateDraft({ selectedSections: [...LEADING_REQUIRED_IDS, ...next, ...TRAILING_REQUIRED_IDS] });

  // Keep the fixed rows in place (older drafts may not have them yet).
  useEffect(() => {
    const ok = LEADING_REQUIRED_IDS.every((id, i) => all[i] === id) && TRAILING_REQUIRED_IDS.every((id, i) => all[all.length - TRAILING_REQUIRED_IDS.length + i] === id);
    if (!ok) commit(optional);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── What to recommend: goals first, then what the primary audience looks for, then the
  // Direction's own sections; ordered for the page by what the audiences need first.
  const aud = audienceById(draft.primaryAudience ?? "");
  const goalSuggested: string[] = (draft.businessGoals ?? []).flatMap((g: string) => GOAL_SECTIONS[g] ?? []);
  const dirSuggested: string[] = directionById(draft.selectedDirection)?.sections ?? [];
  const audienceOrder: string[] = [draft.primaryAudience ?? "", ...(draft.secondaryAudiences ?? [])].flatMap((a: string) => audienceById(a)?.prioritizes ?? []);
  const pageRank = (id: string) => {
    const a = audienceOrder.indexOf(id);
    if (a >= 0) return a;
    const g = goalSuggested.indexOf(id);
    if (g >= 0) return 100 + g;
    return 200 + SECTIONS.findIndex((s) => s.id === id);
  };
  const recSet = new Set([...goalSuggested, ...(aud?.prioritizes ?? []), ...dirSuggested.slice(0, 6)].filter((id) => !REQUIRED_SECTION_IDS.includes(id) && sectionById(id)));
  const recList = [...recSet].sort((a, b) => pageRank(a) - pageRank(b)).slice(0, MAX_OPT);
  const sources = SECTIONS.filter((s) => !REQUIRED_SECTION_IDS.includes(s.id))
    .map((s) => s.id)
    .sort((a, b) => (recSet.has(a) === recSet.has(b) ? (recSet.has(a) ? pageRank(a) - pageRank(b) : 0) : recSet.has(a) ? -1 : 1));
  const recMissing = recList.filter((id) => !optional.includes(id));
  const [recGone, setRecGone] = useState(false);
  const [recPress, setRecPress] = useState(false);
  const showRec = !recGone && recMissing.length > 0 && optional.length < MAX_OPT;

  // ── Flights + the rows they land in ──
  const srcRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const slotRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [landing, setLanding] = useState<Record<string, number>>({}); // id → delay (ms) before it pops in
  const flightKey = useRef(0);
  const reduce = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const launch = (ids: string[], startIndex: number) => {
    if (reduce) return;
    const next: Flight[] = [];
    const land: Record<string, number> = {};
    ids.forEach((id, k) => {
      const from = srcRefs.current[id]?.getBoundingClientRect();
      const to = slotRefs.current[startIndex + k]?.getBoundingClientRect();
      if (!from || !to) return;
      next.push({ key: ++flightKey.current, from, to, n: startIndex + k + 1, title: shortName(id) });
      land[id] = FLIGHT_MS - 80 + k * 90;
    });
    if (next.length) setFlights((f) => [...f, ...next]);
    setLanding((l) => ({ ...l, ...land }));
    setTimeout(() => setLanding((l) => { const c = { ...l }; ids.forEach((id) => delete c[id]); return c; }), FLIGHT_MS + ids.length * 90 + 400);
  };

  const add = (id: string) => {
    if (optional.includes(id) || full) return;
    launch([id], optional.length);
    commit([...optional, id]);
  };
  const remove = (id: string) => commit(optional.filter((x) => x !== id));
  const toggleSource = (id: string) => (optional.includes(id) ? remove(id) : add(id));
  const applyRec = () => {
    setRecPress(true);
    setTimeout(() => setRecPress(false), 180);
    const toAdd = recMissing.slice(0, MAX_OPT - optional.length);
    launch(toAdd, optional.length);
    commit([...optional, ...toAdd]);
    setTimeout(() => setRecGone(true), 260);
  };
  const move = (id: string, to: number) => {
    const from = optional.indexOf(id);
    if (from < 0 || to < 0 || to >= optional.length || from === to) return;
    const next = [...optional];
    next.splice(from, 1);
    next.splice(to, 0, id);
    commit(next);
  };

  // ── Drag to reorder rows in the outline ──
  // While a row is lifted, the rows between its old and new place slide aside (by one row
  // step) so the gap shows exactly where it will land. Centres are measured at pick-up so
  // the sliding rows never move the target under the pointer.
  const [drag, setDrag] = useState<{ id: string; dy: number; over: number; step: number } | null>(null);
  const press = useRef<{ id: string; y: number; moved: boolean; centres: number[]; step: number } | null>(null);
  const rowById = useRef<Record<string, HTMLLIElement | null>>({});
  const flip = useRef<{ id: string; top: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [movedMsg, setMovedMsg] = useState("");
  const msgTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => msgTimers.current.forEach(clearTimeout), []);
  const confirmMove = (id: string, to: number) => {
    msgTimers.current.forEach(clearTimeout);
    setFlash(id);
    setMovedMsg(`ย้าย “${shortName(id)}” ไปลำดับที่ ${to + 1} แล้ว`);
    msgTimers.current = [setTimeout(() => setFlash(null), 900), setTimeout(() => setMovedMsg(""), 2600)];
    buzz(14);
  };
  // the dropped row glides from where it was let go into its new slot
  useLayoutEffect(() => {
    const f = flip.current;
    if (!f) return;
    flip.current = null;
    const el = rowById.current[f.id];
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const delta = f.top - el.getBoundingClientRect().top;
    el.animate([{ transform: `translateY(${delta}px) scale(1.03) rotate(0.6deg)` }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
  });
  const rowDown = (e: ReactPointerEvent<HTMLElement>, id: string, grip = false) => {
    if (e.button !== 0 || (e.pointerType !== "mouse" && !grip)) return;
    if ((e.target as HTMLElement).closest("button")) return; // ✕ is a click, not a drag
    const rects = optional.map((_, i) => slotRefs.current[i]?.getBoundingClientRect());
    const centres = rects.map((r) => (r ? r.top + r.height / 2 : 0));
    const step = rects[1] && rects[0] ? rects[1].top - rects[0].top : (rects[0]?.height ?? 44) + 6;
    press.current = { id, y: e.clientY, moved: false, centres, step };
    { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } }
  };
  const rowMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current;
    if (!p) return;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.abs(dy) < 5) return;
    if (!p.moved) { buzz(8); }
    p.moved = true;
    // target = the slot (as laid out at pick-up) whose centre is nearest the lifted row
    const from = optional.indexOf(p.id);
    const y = p.centres[from] + dy;
    let over = from, best = Infinity;
    p.centres.forEach((c, i) => { const d = Math.abs(y - c); if (d < best) { best = d; over = i; } });
    setDrag({ id: p.id, dy, over, step: p.step });
  };
  const rowUp = () => {
    const p = press.current;
    press.current = null;
    if (p?.moved && drag) {
      const el = rowById.current[p.id];
      if (el) flip.current = { id: p.id, top: el.getBoundingClientRect().top };
      if (drag.over !== optional.indexOf(p.id)) { move(p.id, drag.over); confirmMove(p.id, drag.over); }
    }
    setDrag(null);
  };
  const rowKey = (e: KeyboardEvent<HTMLElement>, id: string) => {
    const i = optional.indexOf(id);
    if (e.key === "ArrowUp" && i > 0) { e.preventDefault(); move(id, i - 1); confirmMove(id, i - 1); }
    if (e.key === "ArrowDown" && i < optional.length - 1) { e.preventDefault(); move(id, i + 1); confirmMove(id, i + 1); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(id); }
  };

  return (
    <div>
      {/* recommendation bar */}
      <div className={`sb-rec grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showRec ? "mb-5 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0"}`} aria-hidden={!showRec}>
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-[#F4F5F1] p-3 sm:flex-nowrap">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ir-accent text-[16px] text-ir-on-accent">✦</span>
            <div className="min-w-0 flex-1 text-[14px] leading-snug">
              <p className="font-semibold text-ir-t1">มีชุดเนื้อหาที่แนะนำจากคำตอบก่อนหน้า</p>
              <p className="mt-0.5 text-[13px] text-ir-t3">อิงจากกลุ่มเป้าหมายและเป้าหมายที่คุณจัดลำดับไว้ · {recList.length} เรื่อง</p>
            </div>
            <button
              type="button"
              tabIndex={showRec ? 0 : -1}
              onClick={applyRec}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ir-dark px-4 text-[13px] font-semibold text-white transition-transform duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 ${recPress ? "scale-[0.93]" : ""}`}
            >
              ✦ ใช้คำแนะนำ
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5">
        {/* sources */}
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-2">
          {sources.map((id) => {
            const n = optional.indexOf(id) + 1;
            const used = n > 0;
            const dim = full && !used;
            return (
              <button
                key={id}
                type="button"
                ref={(el) => { srcRefs.current[id] = el; }}
                onClick={() => toggleSource(id)}
                disabled={dim}
                aria-pressed={used}
                title={sectionById(id)?.desc}
                className={`flex min-h-[52px] items-center gap-2.5 rounded-[14px] border px-3.5 py-2.5 text-left text-[15px] transition-[background-color,border-color,opacity,transform] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40 ${
                  used ? "border-ir-select bg-primary-50" : dim ? "cursor-not-allowed border-[#ECECEA] bg-[#FCFCFB] opacity-45" : "border-[#ECECEA] bg-[#FCFCFB] hover:border-ir-select-soft hover:bg-white"
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-semibold text-ir-t1">{shortName(id)}</span>
                {recSet.has(id) && <span className="shrink-0 rounded-full bg-[#EEF4C2] px-2 py-0.5 text-[13px] font-semibold text-ir-accent-text">แนะนำ</span>}
                <span key={used ? `n${n}` : "plus"} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[13px] font-bold ${used ? "rk-no bg-ir-dark text-white" : "bg-ir-muted text-[16px] font-normal text-ir-t3"}`}>{used ? n : "+"}</span>
              </button>
            );
          })}
        </div>

        {/* outline */}
        <div className="rounded-[22px] bg-[#F3F4F0] p-2.5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
            <p className="text-[15px] font-semibold text-ir-t1">ลำดับเนื้อหาบนเว็บไซต์</p>
            <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[13px] text-ir-t2 tabular-nums" role="status">{optional.length}/{MAX_OPT}</span>
          </div>
          <FixedRow label="เมนูหลัก · ส่วนเปิดหน้าเว็บ" />
          <ol className="my-1.5 grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {Array.from({ length: MAX_OPT }, (_, i) => {
              const id = optional[i];
              if (!id) {
                return (
                  <li key={`empty-${i}`} ref={(el) => { slotRefs.current[i] = el; }} className="flex min-h-11 items-center gap-2 rounded-[10px] border border-dashed border-[#DCDFD6] px-2 text-[14px] text-[#B4B8AE]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[#CFD2C9] font-mono text-[13px]">{i + 1}</span>
                    ว่าง
                  </li>
                );
              }
              const dragging = drag?.id === id;
              const delay = landing[id];
              // rows between the lifted row's old and new place slide aside by one step
              const from = drag ? optional.indexOf(drag.id) : -1;
              const shift = !drag || dragging ? 0
                : from < drag.over && i > from && i <= drag.over ? -1
                : from > drag.over && i >= drag.over && i < from ? 1 : 0;
              // the number each row will have if dropped now
              const shownNo = !drag ? i + 1 : dragging ? drag.over + 1 : i + 1 + shift;
              return (
                <li
                  key={id}
                  ref={(el) => { slotRefs.current[i] = el; rowById.current[id] = el; }}
                  tabIndex={0}
                  aria-label={`${i + 1}. ${shortName(id)} · ใช้ลูกศรขึ้นลงเพื่อเลื่อนลำดับ`}
                  onPointerDown={(e) => rowDown(e, id)}
                  onPointerMove={rowMove}
                  onPointerUp={rowUp}
                  onPointerCancel={() => { press.current = null; setDrag(null); }}
                  onKeyDown={(e) => rowKey(e, id)}
                  style={{
                    ...(dragging ? { transform: `translateY(${drag!.dy}px) scale(1.03) rotate(0.6deg)` } : shift ? { transform: `translateY(${shift * drag!.step}px)` } : null),
                    ...(delay !== undefined ? { animationDelay: `${delay}ms` } : null),
                  }}
                  className={[
                    "relative flex min-h-11 select-none items-center gap-2 rounded-[10px] bg-white pl-2 pr-1 text-[14.5px] font-bold text-ir-t1 outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40",
                    dragging ? "z-10 cursor-grabbing shadow-[0_18px_36px_rgba(23,25,22,0.22)] ring-2 ring-ir-select" : "cursor-grab",
                    drag && !dragging ? "transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" : "",
                    flash === id ? "rk-landed" : "",
                    delay !== undefined ? "sb-land" : "",
                  ].join(" ")}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[13px] ${dragging ? "bg-ir-accent text-ir-on-accent" : "bg-ir-dark text-white"}`}>{shownNo}</span>
                  <span className="min-w-0 flex-1 truncate">{shortName(id)}</span>
                  {/* drag handle — every screen size; on touch this is where a drag starts */}
                  <span
                    aria-hidden="true"
                    onPointerDown={(e) => { e.stopPropagation(); rowDown(e, id, true); }}
                    className="grid h-11 w-10 shrink-0 cursor-grab touch-none place-items-center rounded-[10px] text-ir-t2 hover:bg-black/[0.05] active:bg-black/[0.07]"
                  >
                    <svg width={12} height={18} viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" /><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    aria-label={`เอา ${shortName(id)} ออก`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#A3A79F] transition-colors hover:bg-[#FFF0EE] hover:text-ir-error focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40"
                  >
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg>
                  </button>
                </li>
              );
            })}
          </ol>
          <FixedRow label="ส่วนท้ายเว็บ" />
          <p className="flex min-h-8 items-center px-1.5 pt-2 text-[14px] font-semibold text-ir-t1" aria-live="polite">
            {movedMsg && (
              <span key={movedMsg} className="rk-moved inline-flex items-center gap-1.5 rounded-full bg-ir-accent-soft px-3 py-1">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ir-accent-text"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
                {movedMsg}
              </span>
            )}
          </p>
          <p className="px-1.5 pb-1 pt-1 text-[14px] text-ir-t3">
            {optional.length < MIN_OPT ? `เลือกอย่างน้อย ${MIN_OPT} เรื่อง · ` : optional.length > 1 ? "ลากที่ ⋮⋮ เพื่อเลื่อนลำดับ · " : null}
            เมนู ส่วนเปิดหน้า และส่วนท้าย ระบบจัดให้
          </p>
        </div>
      </div>

      <FlightLayer flights={flights} onDone={(key) => setFlights((f) => f.filter((x) => x.key !== key))} />
    </div>
  );
}

const FixedRow = ({ label }: { label: string }) => (
  <div className="flex min-h-10 items-center gap-2 rounded-[10px] bg-white/55 px-2 text-[13.5px] font-medium text-ir-t3">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[13px]" aria-hidden="true">
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    <span className="pr-2 text-[13px]">ระบบจัดให้</span>
  </div>
);

// White pill (lime number + name) flying from the source row to its slot.
function FlightLayer({ flights, onDone }: { flights: Flight[]; onDone: (key: number) => void }) {
  if (typeof document === "undefined" || flights.length === 0) return null;
  return createPortal(<>{flights.map((f, k) => <FlightPill key={f.key} f={f} delay={k * 90} onDone={onDone} />)}</>, document.body);
}
function FlightPill({ f, delay, onDone }: { f: Flight; delay: number; onDone: (key: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const x0 = f.from.left + 8, y0 = f.from.top + f.from.height / 2 - 18;
    const x1 = f.to.left + 4, y1 = f.to.top + f.to.height / 2 - 18;
    const midX = (x0 + x1) / 2, midY = Math.min(y0, y1) - 40; // a gentle arc
    const anim = el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(0.9)`, opacity: 0 },
      { transform: `translate(${midX}px, ${midY}px) scale(1.04)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x1}px, ${y1}px) scale(1)`, opacity: 1, offset: 0.9 },
      { transform: `translate(${x1}px, ${y1}px) scale(1)`, opacity: 0 },
    ], { duration: FLIGHT_MS, delay, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" });
    anim.onfinish = () => onDone(f.key);
    return () => anim.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[9998] flex items-center gap-2 whitespace-nowrap rounded-full border border-[#E3E5DF] bg-white py-1.5 pl-1.5 pr-3.5 opacity-0 shadow-[0_14px_30px_rgba(23,25,22,0.16)]">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ir-accent font-mono text-[13px] font-semibold text-ir-on-accent">{f.n}</span>
      <span className="text-[13px] font-semibold text-[#252823]">{f.title}</span>
    </div>
  );
}

export const STRUCTURE_MIN_OPTIONAL = MIN_OPT;
