"use client";
// ── Structure step: pick + order homepage sections (production WRS #story DNA) ──────
//   recommendation — first visit fills the outline with the top recommended sections (≤5);
//                         a note says so, with "กลับไปใช้ค่าแนะนำ" once they edit it
//   sources (left)     — "แนะนำสำหรับคุณ" (the top picks, no extra tag) then "เพิ่มได้"; the
//                         "+" disc turns into the black rank number once the section is in
//   outline (right)    — "หน้าแรก · เรียงจากบนลงล่าง" n/max: dashed empty slots, filled rows (bold,
//                         black number, ✕ to remove), Header / Hero / Footer fixed by the system
//   flight             — adding a section sends a white pill (lime number + name) from its
//                         row into the next empty slot; the row pops in as it lands
// Reorder the outline by dragging a row (mouse: the row; touch: the grip) or with ↑ / ↓.
// Data: draft.selectedSections, header + hero first and footer last, unchanged shape.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  BUSINESS_GOALS, GOAL_SECTIONS, LEADING_REQUIRED_IDS, REQUIRED_SECTION_IDS, RETIRED_SECTION_IDS, RULES, SECTIONS, SECTION_BLURB, TRAILING_REQUIRED_IDS,
  audienceById, directionById, sectionById,
} from "@/lib/data";
import { profileToDirection, rankDirections } from "@/lib/recommend";
import { buzz } from "@/components/RankPicker";
import type { Requirement } from "@/lib/types";
import { DUR, EASE } from "@/lib/motion";
import { useDragAutoScroll } from "@/lib/useDragAutoScroll";
import { onScrollShowBar } from "@/lib/useScrollBar";

// The AI proposes REC_MAX sections; the client can add up to MAX_OPT in all (header, hero and
// footer not counted). A cap again, but a roomy one, shown as "n / 8".
const MAX_OPT = 8;
const MIN_OPT = Math.max(1, RULES.sections.min - REQUIRED_SECTION_IDS.length);
const shortName = (id: string) => (sectionById(id)?.name ?? id).split(" / ")[0];
const FLIGHT_MS = 560;
// how many sections the AI proposes
const REC_MAX = 5;

type Flight = { key: number; from: DOMRect; to: DOMRect; n: number; title: string };

// ── What to recommend: goals first, then what the primary audience looks for, then the
// Direction's own sections; ordered for the page by what the audiences need first. Each
// pick carries a short reason, so the client can see the AI's proposal is about *them*
// (user test #1: they never noticed there was a recommendation at all).
export function homepageRecommendation(draft: Requirement): { list: string[]; reasons: Record<string, string> } {
  const aud = audienceById(draft.primaryAudience ?? "");
  const goalIds: string[] = draft.businessGoals ?? [];
  const goalSuggested: string[] = goalIds.flatMap((g) => GOAL_SECTIONS[g] ?? []);
  const dir = directionById(draft.selectedDirection);
  const dirSuggested: string[] = dir?.sections ?? [];
  const audienceOrder: string[] = [draft.primaryAudience ?? "", ...(draft.secondaryAudiences ?? [])].flatMap((a: string) => audienceById(a)?.prioritizes ?? []);
  const pageRank = (id: string) => {
    const a = audienceOrder.indexOf(id);
    if (a >= 0) return a;
    const g = goalSuggested.indexOf(id);
    if (g >= 0) return 100 + g;
    return 200 + SECTIONS.findIndex((s) => s.id === id);
  };
  const pool = [...goalSuggested, ...(aud?.prioritizes ?? []), ...dirSuggested.slice(0, 6)]
    .filter((id) => !REQUIRED_SECTION_IDS.includes(id) && !RETIRED_SECTION_IDS.includes(id) && sectionById(id));
  // Only the top few — tagging every candidate (9–10) read as "pick all of these".
  const list = [...new Set(pool)].sort((a, b) => pageRank(a) - pageRank(b)).slice(0, REC_MAX);
  const reasons: Record<string, string> = {};
  for (const id of list) {
    const goal = goalIds.find((g) => (GOAL_SECTIONS[g] ?? []).includes(id));
    if (aud?.prioritizes?.includes(id)) reasons[id] = `ผู้อ่านหลักคือ ${aud.label}`;
    else if (goal) reasons[id] = `ตอบเป้าหมาย “${BUSINESS_GOALS.find((b) => b.id === goal)?.label ?? goal}”`;
    else if (dir) reasons[id] = `เข้ากับแนวทาง ${dir.label}`;
  }
  return { list, reasons };
}
/** The outline is still exactly the recommended set, in the recommended order. */
export function isRecommendedHomepage(draft: Requirement) {
  const list = homepageRecommendation(draft).list;
  const optional = (draft.selectedSections ?? []).filter((id) => !REQUIRED_SECTION_IDS.includes(id) && !RETIRED_SECTION_IDS.includes(id));
  return list.length > 0 && list.length === optional.length && list.every((id, i) => optional[i] === id);
}

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
  const optional = all.filter((id) => !REQUIRED_SECTION_IDS.includes(id) && !RETIRED_SECTION_IDS.includes(id));
  const full = optional.length >= MAX_OPT;
  const commit = (next: string[]) => updateDraft({ selectedSections: [...LEADING_REQUIRED_IDS, ...next, ...TRAILING_REQUIRED_IDS] });

  const { list: recList, reasons } = homepageRecommendation(draft);
  const recSet = new Set(recList);
  // what can still be added: AI picks that were removed first, then the rest
  const addable = [...recList, ...SECTIONS.map((s) => s.id).filter((id) => !recSet.has(id))]
    .filter((id) => !REQUIRED_SECTION_IDS.includes(id) && !RETIRED_SECTION_IDS.includes(id) && !optional.includes(id));
  const isRecommended = isRecommendedHomepage(draft);

  // First visit: start from the recommended homepage instead of an empty outline, so the
  // client edits a proposal rather than building it piece by piece. Done once per draft
  // (structurePrefilled), so clearing it later is respected. Also keeps the fixed rows in
  // place and drops retired sections from older drafts.
  useEffect(() => {
    const fill = !draft.structurePrefilled && optional.length === 0 && recList.length > 0;
    const next = [...LEADING_REQUIRED_IDS, ...(fill ? recList : optional), ...TRAILING_REQUIRED_IDS];
    const same = next.length === all.length && next.every((id, i) => all[i] === id);
    if (!same || !draft.structurePrefilled) updateDraft({ selectedSections: next, structurePrefilled: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const resetToRec = () => commit(recList);
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
  const press = useRef<{ id: string; y: number; lastY: number; moved: boolean; centres: number[]; step: number } | null>(null);
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
    el.animate([{ transform: `translateY(${delta}px) scale(1.03) rotate(0.6deg)` }, { transform: "none" }], { duration: DUR.base, easing: EASE.spring });
  });
  const auto = useDragAutoScroll();
  const rowDown = (e: ReactPointerEvent<HTMLElement>, id: string, grip = false) => {
    if (e.button !== 0 || (e.pointerType !== "mouse" && !grip)) return;
    if ((e.target as HTMLElement).closest("button")) return; // ✕ is a click, not a drag
    const rects = optional.map((_, i) => slotRefs.current[i]?.getBoundingClientRect());
    const centres = rects.map((r) => (r ? r.top + r.height / 2 : 0));
    const step = rects[1] && rects[0] ? rects[1].top - rects[0].top : (rects[0]?.height ?? 44) + 6;
    press.current = { id, y: e.clientY, lastY: e.clientY, moved: false, centres, step };
    { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } }
    auto.begin(e.currentTarget, () => { if (press.current?.moved) trackRow(press.current.lastY); });
  };
  // Centres were measured at pick-up, so the page scroll since then is added to dy: the row
  // stays under the finger and the target is still found in pick-up coordinates.
  const trackRow = (clientY: number) => {
    const p = press.current;
    if (!p) return;
    p.lastY = clientY;
    const dy = clientY - p.y + auto.offset();
    if (!p.moved && Math.abs(dy) < 5) return;
    if (!p.moved) { buzz(8); }
    p.moved = true;
    auto.move(clientY);
    // target = the slot (as laid out at pick-up) whose centre is nearest the lifted row
    const from = optional.indexOf(p.id);
    const y = p.centres[from] + dy;
    let over = from, best = Infinity;
    p.centres.forEach((c, i) => { const d = Math.abs(y - c); if (d < best) { best = d; over = i; } });
    setDrag({ id: p.id, dy, over, step: p.step });
  };
  const rowMove = (e: ReactPointerEvent<HTMLElement>) => trackRow(e.clientY);
  const rowUp = () => {
    const p = press.current;
    press.current = null;
    auto.stop();
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

  // Why these: the reader + top goal the proposal is built on, said once in the result card
  // (instead of a reason under every row).
  const basis = [
    audienceById(draft.primaryAudience ?? "")?.label && `ผู้อ่านหลัก: ${audienceById(draft.primaryAudience ?? "")?.label}`,
    draft.businessGoals?.[0] && `เป้าหมายแรก: ${BUSINESS_GOALS.find((b) => b.id === draft.businessGoals?.[0])?.label ?? ""}`,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Result first, customising second (user feedback): the AI's homepage is a dark card
          that reads first — left on desktop, top on phones — and the picks are a quiet
          "เพิ่มส่วนอื่น" list beside / below it. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-6">
        {/* ── result: the homepage outline ── */}
        <section aria-label="หน้าแรกของคุณ" onScroll={onScrollShowBar} className="rounded-2xl bg-ir-dark p-3 text-white shadow-e3 sm:p-4 ir-scroll ir-scroll-dark lg:sticky lg:top-4 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain">
          <div className="flex items-start gap-3 px-1 pb-3 pt-1">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ir-accent text-body text-ir-on-accent">✦</span>
            <div className="min-w-0 flex-1">
              <p className="text-lead font-semibold leading-snug">
                {isRecommended ? "หน้าแรกที่ AI จัดให้คุณ" : optional.length === 0 ? "หน้าแรกของคุณ (ยังว่าง)" : "หน้าแรกของคุณ · ปรับจากที่ AI จัดให้"}
              </p>
              <p className="mt-0.5 text-small leading-snug text-white/70">
                {isRecommended
                  ? <>เรียงจากบนลงล่าง{basis ? ` · ${basis}` : ""} · เห็นด้วยกด “ใช้หน้าแรกนี้” ได้เลย</>
                  : optional.length === 0
                    ? `เลือกจากรายการ “เพิ่มส่วนอื่น” อย่างน้อย ${MIN_OPT} ส่วน`
                    : "เรียงจากบนลงล่าง · ลากที่ ⋮⋮ เพื่อสลับลำดับ"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-1 pb-3">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-caption font-semibold tabular-nums" role="status">{optional.length} / {MAX_OPT} ส่วน</span>
            <span className="flex-1" />
            {!isRecommended && recList.length > 0 && (
              <button type="button" onClick={resetToRec}
                className="inline-flex h-9 items-center rounded-full bg-white px-3 text-caption font-semibold text-ir-t1 transition-colors hover:bg-ir-accent focus-ring">
                ✦ กลับไปใช้ที่ AI จัดให้
              </button>
            )}
            {optional.length > 0 && (
              <button type="button" onClick={() => commit([])}
                className="inline-flex h-9 items-center rounded-full px-3 text-caption font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-ring">
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <FixedRow label="เมนูด้านบน · ส่วนเปิดหน้าเว็บ" hint="เมนูด้านบนทีมจัดให้ตามเนื้อหาทั้งเว็บ" />
          <ol className="my-1.5 grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {/* the filled rows, then ONE dashed "next" slot — no row of empty slots to fill
                (user test SCGP: "5/5" read as a quota) */}
            {Array.from({ length: optional.length + 1 }, (_, i) => {
              const id = optional[i];
              if (!id) {
                return (
                  <li key="next-slot" ref={(el) => { slotRefs.current[i] = el; }} className="flex min-h-11 items-center gap-2 rounded-md border border-dashed border-white/25 px-2 text-small text-white/60">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-white/35 text-caption">+</span>
                    {optional.length === 0 ? "ยังไม่มีส่วน · เลือกจากรายการ “เพิ่มส่วนอื่น”" : "เพิ่มส่วนอื่นได้จากรายการ “เพิ่มส่วนอื่น”"}
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
                  onPointerCancel={() => { press.current = null; auto.stop(); setDrag(null); }}
                  onKeyDown={(e) => rowKey(e, id)}
                  style={{
                    ...(dragging ? { transform: `translateY(${drag!.dy}px) scale(1.03) rotate(0.6deg)` } : shift ? { transform: `translateY(${shift * drag!.step}px)` } : null),
                    ...(delay !== undefined ? { animationDelay: `${delay}ms` } : null),
                  }}
                  className={[
                    "relative flex min-h-[52px] select-none items-center gap-2 rounded-md bg-white py-1.5 pl-0.5 pr-1 text-ir-t1 outline-none focus-ring",
                    dragging ? "z-10 cursor-grabbing shadow-e4 ring-2 ring-ir-accent" : "cursor-grab",
                    drag && !dragging ? "transition-transform duration-fast ease-out" : "",
                    flash === id ? "rk-landed" : "",
                    delay !== undefined ? "sb-land" : "",
                  ].join(" ")}
                >
                  {/* drag handle — leading edge, where people look for it (user test AOT); every screen size; on touch this is where a drag starts */}
                  <span
                    aria-hidden="true"
                    onPointerDown={(e) => { e.stopPropagation(); rowDown(e, id, true); }}
                    className="grid h-11 w-8 -mr-1 shrink-0 cursor-grab touch-none place-items-center rounded-sm text-ir-t2 hover:bg-black/[0.05] active:bg-black/[0.07]"
                  >
                    <svg width={12} height={18} viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.6" /><circle cx="10" cy="4" r="1.6" /><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="4" cy="16" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg>
                  </span>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-caption font-bold ${dragging ? "bg-ir-accent text-ir-on-accent" : "bg-ir-dark text-white"}`}>{shownNo}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-bold leading-snug">{shortName(id)}</span>
                    {SECTION_BLURB[id] && <span className="block text-caption leading-snug text-ir-t3">{SECTION_BLURB[id]}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    aria-label={`เอา ${shortName(id)} ออก`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ir-disabled transition-colors hover:bg-ir-error-soft hover:text-ir-error focus-ring"
                  >
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg>
                  </button>
                </li>
              );
            })}
          </ol>
          <FixedRow label="ส่วนท้ายเว็บ" />
          <p className="flex min-h-8 items-center px-1 pt-2 text-small font-semibold text-ir-t1" aria-live="polite">
            {movedMsg && (
              <span key={movedMsg} className="rk-moved inline-flex items-center gap-1.5 rounded-full bg-ir-accent px-3 py-1 text-ir-on-accent">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
                {movedMsg}
              </span>
            )}
          </p>
          <p className="px-1 pb-1 text-caption text-white/55">
            {optional.length < MIN_OPT ? `เลือกอย่างน้อย ${MIN_OPT} ส่วน · ` : null}
            เมนู ส่วนเปิดหน้า และส่วนท้าย ระบบจัดให้
          </p>
        </section>

        {/* ── add more: only what isn't on the homepage yet. The AI's picks are already in
            the result card (edit or remove them there), so this list is just "what else can
            go on it" — white cards with a clear "+ เพิ่ม", up to MAX_OPT sections in all.
            A removed AI pick comes back here with its "✦ AI แนะนำ" tag. */}
        <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-2">
          <div className="px-1 pb-1">
            <p className="text-lead font-semibold text-ir-t1">เพิ่มส่วนอื่นในหน้าแรก <span className="text-body font-normal text-ir-t3">(ถ้าต้องการ)</span></p>
            <p className="mt-0.5 text-small text-ir-t2">
              {full ? `ครบ ${MAX_OPT} ส่วนแล้ว · เอาส่วนอื่นออกจากหน้าแรกก่อน ถ้าต้องการเปลี่ยน` : `กด “เพิ่ม” เพื่อใส่ในหน้าแรก · ได้สูงสุด ${MAX_OPT} ส่วน`}
            </p>
          </div>
          {addable.length === 0 && <p className="px-1 text-small text-ir-t3">ใส่ครบทุกส่วนแล้ว</p>}
          {addable.map((id) => (
            <button
              key={id}
              type="button"
              ref={(el) => { srcRefs.current[id] = el; }}
              onClick={() => add(id)}
              disabled={full}
              title={reasons[id] ? `AI แนะนำ เพราะ${reasons[id]}` : undefined}
              className={`group flex min-h-[60px] items-center gap-3 rounded-lg border bg-white px-3.5 py-2.5 text-left transition-[border-color,box-shadow,opacity,transform] duration-fast focus-ring ${
                full ? "cursor-not-allowed border-ir-border-soft opacity-45" : "border-ir-border shadow-e1 hover:-translate-y-px hover:border-ir-border-hi hover:shadow-e2 active:translate-y-0 active:scale-[0.98]"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-small font-semibold text-ir-t1">{shortName(id)}</span>
                  {recSet.has(id) && <span className="rounded-full bg-primary-50 px-2 py-px text-caption font-semibold text-ir-accent-text">✦ AI แนะนำ</span>}
                </span>
                {SECTION_BLURB[id] && <span className="mt-0.5 block text-caption leading-snug text-ir-t3">{SECTION_BLURB[id]}</span>}
              </span>
              <span aria-hidden="true" className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-caption font-semibold transition-colors ${full ? "bg-ir-muted text-ir-t3" : "bg-ir-dark text-white group-hover:bg-ir-accent group-hover:text-ir-on-accent"}`}>
                <svg width={12} height={12} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
                เพิ่ม
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* หมายเหตุ — replaces the old "CTA หรือ Section อื่นๆ" pick: a free note for anything
          else they want, without having to name a section type or format */}
      <div className="mt-6">
        <label htmlFor="structure-note" className="flex items-baseline gap-2">
          <span className="text-body font-semibold text-ir-t1">หมายเหตุ</span>
          <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
        </label>
        <p className="mt-0.5 text-small text-ir-t3">มีอะไรอยากได้เพิ่มบนหน้าแรก หรืออยากบอกทีม เขียนไว้ได้เลย</p>
        <textarea
          id="structure-note"
          rows={3}
          value={draft.structureNote ?? ""}
          onChange={(e) => updateDraft({ structureNote: e.target.value })}
          placeholder="รายละเอียดเพิ่มเติม เช่น อยากมีส่วนสมัครรับข่าวสาร IR หรือเน้นวิดีโอสรุปผลประกอบการ"
          className="mt-2 w-full resize-y rounded-md border border-ir-border bg-white px-3.5 py-3 text-body leading-relaxed outline-none transition-colors focus:border-ir-accent"
        />
      </div>

      <FlightLayer flights={flights} onDone={(key) => setFlights((f) => f.filter((x) => x.key !== key))} />
    </div>
  );
}

// System-made rows (menu + opening, footer) on the dark result card: present but muted.
const FixedRow = ({ label, hint }: { label: string; hint?: string }) => (
  <div className="flex min-h-10 items-center gap-2 rounded-md bg-white/[0.07] px-2 py-1.5 text-small font-medium text-white/65">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-caption" aria-hidden="true">
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block leading-snug">{label}</span>
      {hint && <span className="block text-caption font-normal leading-snug">{hint}</span>}
    </span>
    <span className="pr-2 text-caption">ระบบจัดให้</span>
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
    ], { duration: FLIGHT_MS, delay, easing: EASE.out, fill: "both" });
    anim.onfinish = () => onDone(f.key);
    return () => anim.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[9998] flex items-center gap-2 whitespace-nowrap rounded-full border border-ir-border-soft bg-white py-1.5 pl-1.5 pr-3.5 opacity-0 shadow-e3">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ir-accent font-mono text-caption font-semibold text-ir-on-accent">{f.n}</span>
      <span className="text-caption font-semibold text-ir-t1">{f.title}</span>
    </div>
  );
}

export const STRUCTURE_MIN_OPTIONAL = MIN_OPT;
