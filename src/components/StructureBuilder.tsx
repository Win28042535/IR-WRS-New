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
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  GOAL_SECTIONS, LEADING_REQUIRED_IDS, REQUIRED_SECTION_IDS, RULES, SECTIONS, TRAILING_REQUIRED_IDS,
  audienceById, directionById, sectionById,
} from "@/lib/data";
import { profileToDirection, rankDirections } from "@/lib/recommend";
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
  const [drag, setDrag] = useState<{ id: string; dy: number; over: number } | null>(null);
  const press = useRef<{ id: string; y: number; moved: boolean } | null>(null);
  const rowDown = (e: ReactPointerEvent<HTMLElement>, id: string, grip = false) => {
    if (e.button !== 0 || (e.pointerType !== "mouse" && !grip)) return;
    if ((e.target as HTMLElement).closest("button")) return; // ✕ is a click, not a drag
    press.current = { id, y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const rowMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = press.current;
    if (!p) return;
    const dy = e.clientY - p.y;
    if (!p.moved && Math.abs(dy) < 5) return;
    p.moved = true;
    // target index = the filled row whose vertical middle is nearest the pointer
    let over = optional.indexOf(p.id), best = Infinity;
    optional.forEach((_, i) => {
      const r = slotRefs.current[i]?.getBoundingClientRect();
      if (!r) return;
      const d = Math.abs(e.clientY - (r.top + r.height / 2));
      if (d < best) { best = d; over = i; }
    });
    setDrag({ id: p.id, dy, over });
  };
  const rowUp = () => {
    const p = press.current;
    press.current = null;
    if (p?.moved && drag) move(p.id, drag.over);
    setDrag(null);
  };
  const rowKey = (e: KeyboardEvent<HTMLElement>, id: string) => {
    const i = optional.indexOf(id);
    if (e.key === "ArrowUp") { e.preventDefault(); move(id, i - 1); }
    if (e.key === "ArrowDown") { e.preventDefault(); move(id, i + 1); }
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5">
        {/* sources */}
        <div className="grid content-start gap-2">
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
                {recSet.has(id) && <span className="shrink-0 rounded-full bg-[#EEF4C2] px-2 py-0.5 text-[12px] font-semibold text-ir-accent-text">แนะนำ</span>}
                <span key={used ? `n${n}` : "plus"} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[12px] font-bold ${used ? "rk-no bg-ir-dark text-white" : "bg-ir-muted text-[16px] font-normal text-ir-t3"}`}>{used ? n : "+"}</span>
              </button>
            );
          })}
        </div>

        {/* outline */}
        <div className="rounded-[22px] bg-[#F3F4F0] p-2.5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
            <p className="text-[15px] font-semibold text-ir-t1">ลำดับเนื้อหาบนเว็บไซต์</p>
            <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[12px] text-ir-t2 tabular-nums" role="status">{optional.length}/{MAX_OPT}</span>
          </div>
          <FixedRow label={`${shortName("header")} · ${shortName("hero")}`} />
          <ol className="my-1.5 grid gap-1.5">
            {Array.from({ length: MAX_OPT }, (_, i) => {
              const id = optional[i];
              if (!id) {
                return (
                  <li key={`empty-${i}`} ref={(el) => { slotRefs.current[i] = el; }} className="flex min-h-11 items-center gap-2 rounded-[10px] border border-dashed border-[#DCDFD6] px-2 text-[14px] text-[#B4B8AE]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[#CFD2C9] font-mono text-[12px]">{i + 1}</span>
                    ว่าง
                  </li>
                );
              }
              const dragging = drag?.id === id;
              const target = drag && !dragging && drag.over === i;
              const delay = landing[id];
              return (
                <li
                  key={id}
                  ref={(el) => { slotRefs.current[i] = el; }}
                  tabIndex={0}
                  aria-label={`${i + 1}. ${shortName(id)} · ใช้ลูกศรขึ้นลงเพื่อเลื่อนลำดับ`}
                  onPointerDown={(e) => rowDown(e, id)}
                  onPointerMove={rowMove}
                  onPointerUp={rowUp}
                  onPointerCancel={() => { press.current = null; setDrag(null); }}
                  onKeyDown={(e) => rowKey(e, id)}
                  style={{ ...(dragging ? { transform: `translateY(${drag!.dy}px) scale(1.02)` } : null), ...(delay !== undefined ? { animationDelay: `${delay}ms` } : null) }}
                  className={[
                    "flex min-h-11 select-none items-center gap-2 rounded-[10px] bg-white pl-2 pr-1 text-[14.5px] font-bold text-ir-t1 outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40",
                    dragging ? "relative z-10 cursor-grabbing shadow-[0_14px_30px_rgba(23,25,22,0.16)]" : "cursor-grab",
                    target ? "outline-2 outline-dashed outline-offset-1 outline-ir-select" : "",
                    delay !== undefined ? "sb-land" : "",
                  ].join(" ")}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-[12px] text-white">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{shortName(id)}</span>
                  <span
                    aria-hidden="true"
                    onPointerDown={(e) => { e.stopPropagation(); rowDown(e, id, true); }}
                    className="grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center text-ir-t3"
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
          <FixedRow label={shortName("footer")} />
          <p className="px-1.5 pb-1 pt-2.5 text-[13px] text-ir-t3">
            {optional.length < MIN_OPT ? `เลือกอย่างน้อย ${MIN_OPT} เรื่อง` : optional.length > 1 ? "ลากเพื่อสลับลำดับ · Header, Hero และ Footer ระบบจัดให้" : "Header, Hero และ Footer ระบบจัดให้"}
          </p>
        </div>
      </div>

      <FlightLayer flights={flights} onDone={(key) => setFlights((f) => f.filter((x) => x.key !== key))} />
    </div>
  );
}

const FixedRow = ({ label }: { label: string }) => (
  <div className="flex min-h-10 items-center gap-2 rounded-[10px] bg-white/55 px-2 text-[13.5px] font-medium text-ir-t3">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[12px]" aria-hidden="true">
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    <span className="pr-2 text-[12px]">ระบบจัดให้</span>
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
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ir-accent font-mono text-[12px] font-semibold text-ir-on-accent">{f.n}</span>
      <span className="text-[13px] font-semibold text-[#252823]">{f.title}</span>
    </div>
  );
}

export const STRUCTURE_MIN_OPTIONAL = MIN_OPT;
