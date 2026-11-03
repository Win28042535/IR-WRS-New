"use client";
import { useState, useEffect } from "react";
import { useProjectContext, type ProjectContext } from "@/hooks/useProjectContext";
import { getNextSteps } from "@/lib/projectContext";

// ── Headline ──────────────────────────────────────────────────────────────────
// One sentence that tells the user what they've achieved and where they're headed.
// Always confidence-building: what's done > what's left.

function buildHeadline(ctx: ProjectContext, fromStep: number): string {
  const dir  = ctx.directionLabel || ctx.selectedDirection;
  const n    = ctx.selectedSections.length;
  const sc   = ctx.confidence.score;
  const slvl = ctx.confidence.levelLabel;
  const co   = ctx.company;
  const ind  = ctx.industry;

  if (fromStep === 1) {
    if (dir && ind)  return `${dir} · ${ind} ไปเลือกโครงสร้างต่อได้เลยครับ`;
    if (dir)         return `${dir} ไปเลือกโครงสร้างต่อได้เลยครับ`;
    if (co)          return `รู้จัก ${co} แล้ว ไปเลือกโครงสร้างต่อได้เลยครับ`;
    return "เริ่มต้นได้ดีมาก ไปเลือกโครงสร้างต่อได้เลยครับ";
  }

  if (fromStep === 2) {
    if (n >= 5 && dir) return `${dir} · ${n} Sections พร้อมแล้ว ดู Preview ได้เลยครับ`;
    if (n >= 5)        return `${n} Sections + Layout พร้อมแล้ว ดู Preview เว็บได้เลยครับ`;
    if (dir)           return `${dir} เลือกแล้ว กำหนด Sections ต่อแล้วดู Preview ได้เลยครับ`;
    return "โครงสร้างกำลังเป็นรูปร่าง ดู Preview เพื่อปรับแต่งได้เลยครับ";
  }

  if (fromStep === 3) {
    return sc >= 80
      ? `Confidence ${sc}% · ${slvl} เกือบส่งได้แล้วครับ กรอกข้อมูลติดต่อแล้วยืนยัน`
      : `Confidence ${sc}% กรอกข้อมูลสุดท้ายแล้วส่งได้เลยครับ`;
  }

  if (fromStep === 4) {
    return sc >= 80
      ? `Confidence ${sc}% · ${slvl} ตรวจสอบครั้งสุดท้ายแล้วส่งได้เลยครับ`
      : `Confidence ${sc}% ตรวจสอบและยืนยันก่อนส่งให้ทีม IR Plus`;
  }

  // Generic fallback
  if (dir && ind) return `${dir} · ${ind} ดำเนินต่อได้เลยครับ`;
  return "AI สรุปสิ่งที่รู้จนถึงตอนนี้";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  fromStep?: number;
  nextStepsFrom?: number;
  autocollapseMs?: number;
  defaultOpen?: boolean;
  className?: string;
}

export default function AIReflection({ fromStep = 0, nextStepsFrom, autocollapseMs, defaultOpen = false, className = "" }: Props) {
  const ctx = useProjectContext();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!autocollapseMs) return;
    const t = setTimeout(() => setOpen(false), autocollapseMs);
    return () => clearTimeout(t);
  }, [autocollapseMs]);

  const headline  = buildHeadline(ctx, fromStep);
  const nextSteps = getNextSteps(ctx, nextStepsFrom ?? fromStep);

  const hasDetail =
    ctx.knownFacts.length > 0 ||
    ctx.decisions.length > 0 ||
    nextSteps.length > 0;

  return (
    <div className={`rounded-[18px] bg-ir-dark overflow-hidden ir-fade ${className}`}>

      {/* ── Header: always visible headline ── */}
      <button
        onClick={() => hasDetail && setOpen(v => !v)}
        className={[
          "w-full flex items-start justify-between px-4 pt-4 pb-3 text-left",
          hasDetail ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-ir-accent text-[11px] select-none" aria-hidden>◎</span>
            <span className="text-[10px] font-semibold text-white/40 tracking-wider uppercase leading-none">
              AI สรุปความคืบหน้า
            </span>
          </div>
          <p className="text-[13px] text-white/90 leading-snug font-medium pr-4">
            {headline}
          </p>
        </div>

        {/* Chevron only when there's detail to toggle */}
        {hasDetail && (
          <svg
            width="20" height="20" viewBox="0 0 14 14" fill="none" aria-hidden
            className={`text-white/30 transition-transform duration-200 shrink-0 mt-0.5 ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 5L7 9.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── Detail: pill rows (collapsible) ── */}
      {open && hasDetail && (
        <>
          <div className="h-px bg-white/[0.06] mx-4" />
          <div className="px-4 pt-3 pb-4 space-y-3">
            {ctx.knownFacts.length > 0 && (
              <PillRow label="เรารู้แล้ว" items={ctx.knownFacts} variant="neutral" />
            )}
            {ctx.decisions.length > 0 && (
              <PillRow label="ตัดสินใจแล้ว" items={ctx.decisions} variant="accent" />
            )}
            {nextSteps.length > 0 && (
              <PillRow label="ถัดไป" items={nextSteps} variant="next" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── PillRow ───────────────────────────────────────────────────────────────────

type PillVariant = "neutral" | "accent" | "next";

function PillRow({ label, items, variant }: { label: string; items: string[]; variant: PillVariant }) {
  const labelCls: Record<PillVariant, string> = {
    accent:  "text-ir-accent",
    next:    "text-white/35",
    neutral: "text-white/50",
  };

  const pillCls: Record<PillVariant, string> = {
    accent:  "bg-ir-accent text-ir-on-accent",
    next:    "border border-white/15 text-white/40",
    neutral: "bg-white/10 text-white/60",
  };

  return (
    <div>
      <p className={`text-[11px] font-semibold mb-1.5 ${labelCls[variant]}`}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span
            key={item}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${pillCls[variant]}`}
          >
            {variant === "next" ? `→ ${item}` : item}
          </span>
        ))}
      </div>
    </div>
  );
}
