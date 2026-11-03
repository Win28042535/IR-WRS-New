"use client";
import { useState, useEffect, useRef } from "react";
import { useProjectContext } from "@/hooks/useProjectContext";
import { getContextualExplanation, getCapabilities } from "@/lib/aiEngine";
import type { ConfidenceFactor } from "@/lib/aiEngine";

// ── Milestone definitions ────────────────────────────────────────────────

const MILESTONES = [
  { level: "low",      idx: 0, label: "เริ่มต้น"       },
  { level: "medium",   idx: 1, label: "กำลังดีขึ้น"    },
  { level: "high",     idx: 2, label: "เกือบสมบูรณ์"   },
  { level: "complete", idx: 3, label: "พร้อมส่ง"        },
] as const;

const LEVEL_IDX: Record<string, number> = {
  low: 0, medium: 1, high: 2, complete: 3,
};

// ── Chip (shown in dark header) ──────────────────────────────────────────

export default function ConfidenceScore({ className = "" }: { className?: string }) {
  const { confidence } = useProjectContext();
  const { score, level, levelLabel, topMissing, breakdown } = confidence;
  const [open, setOpen] = useState(false);
  const milestoneIdx = LEVEL_IDX[level] ?? 0;

  const prevRef  = useRef<ConfidenceFactor[]>(breakdown);
  const gainTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [recentGain, setRecentGain] = useState<{
    label: string; points: number; why: string;
  } | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.length > 0) {
      const newlyEarned = breakdown.find(
        f => f.earned && !prev.find(p => p.label === f.label && p.earned)
      );
      if (newlyEarned) {
        clearTimeout(gainTimer.current);
        setRecentGain({ label: newlyEarned.label, points: newlyEarned.points, why: newlyEarned.why });
        gainTimer.current = setTimeout(() => setRecentGain(null), 8000);
      }
    }
    prevRef.current = breakdown;
  }, [breakdown]);

  useEffect(() => () => clearTimeout(gainTimer.current), []);

  const isComplete = level === "complete";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={[
          "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 -mx-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-accent/50",
          recentGain
            ? "bg-ir-accent/[0.10] hover:bg-ir-accent/[0.15]"
            : "hover:bg-white/[0.06]",
          className,
        ].join(" ")}
        aria-label={`AI Readiness ${score}/100 – เปิดรายละเอียด`}
      >
        {/* Milestone dots */}
        <div className="flex items-center gap-[3.5px] shrink-0" aria-hidden>
          {MILESTONES.map((_, i) => (
            <span
              key={i}
              className={[
                "block rounded-full transition-all duration-500",
                i < milestoneIdx  ? "w-2 h-2 bg-ir-accent"
                : i === milestoneIdx ? "w-2.5 h-2.5 bg-ir-accent/80"
                : "w-1.5 h-1.5 bg-white/20",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-[11px] font-semibold text-ir-t2">AI Readiness</span>
            <span
              className={[
                "text-[11px] font-semibold",
                isComplete ? "text-emerald-400" : "text-ir-accent",
              ].join(" ")}
            >
              {levelLabel}
            </span>
          </div>
          <div className="mt-[3px] leading-none">
            {recentGain ? (
              <span className="text-[10px] font-semibold text-ir-accent">
                ✦ {recentGain.label}
              </span>
            ) : isComplete ? (
              <span className="text-[10px] font-medium text-emerald-400/80">พร้อมส่งให้ทีมแล้ว</span>
            ) : topMissing[0] ? (
              <span className="text-[10px] text-ir-t3 truncate max-w-[130px] block">
                ต่อไป: {topMissing[0]}
              </span>
            ) : null}
          </div>
        </div>

        {recentGain && (
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-[3px] rounded-full bg-ir-accent/15 text-ir-accent leading-none">
            +{recentGain.points}
          </span>
        )}
      </button>

      {open && (
        <ConfidencePanel
          score={score}
          level={level}
          levelLabel={levelLabel}
          breakdown={breakdown}
          recentGain={recentGain}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────

interface PanelProps {
  score: number;
  level: string;
  levelLabel: string;
  breakdown: ConfidenceFactor[];
  recentGain: { label: string; points: number; why: string } | null;
  onClose: () => void;
}

function ConfidencePanel({ score, level, levelLabel, breakdown, recentGain, onClose }: PanelProps) {
  const earned  = breakdown.filter(f => f.earned);
  const missing = breakdown.filter(f => !f.earned).sort((a, b) => b.points - a.points);
  const milestoneIdx  = LEVEL_IDX[level] ?? 0;
  const explanation   = getContextualExplanation(breakdown, score);
  const { unlocked, locked } = getCapabilities(level);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        className="conf-backdrop-in absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="ปิด"
        tabIndex={-1}
      />

      {/* Sheet light background */}
      <div
        className="conf-sheet-in relative bg-[#F7F8FA] rounded-t-[22px] max-h-[90vh] flex flex-col w-full sm:max-w-[480px] sm:mx-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="AI Readiness รายละเอียด"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 pb-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3">
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 leading-tight">AI Readiness</h2>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                ยิ่งให้ข้อมูลมาก AI ยิ่งทำงานแทนคุณได้มากขึ้น
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0 mt-0.5"
              aria-label="ปิด"
            >
              <svg width="24" height="24" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ── Recently gained green celebration banner ── */}
          {recentGain && (
            <div className="conf-gain-in mx-5 mb-3 rounded-[14px] bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
              <span className="text-emerald-500 text-[16px] shrink-0 leading-none mt-0.5" aria-hidden>✦</span>
              <div>
                <p className="text-[12px] font-semibold text-emerald-800 leading-tight">
                  {recentGain.label} เพิ่มขึ้นแล้ว
                </p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5 leading-snug">
                  {recentGain.why}
                </p>
              </div>
            </div>
          )}

          {/* ── Journey track ── */}
          <div className="mx-5 mb-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
            {/* Track */}
            <div className="relative flex items-start justify-between mb-1">
              {/* Background line */}
              <div
                className="absolute top-[14px] h-0.5 bg-gray-100 z-0"
                style={{ left: "14px", right: "14px" }}
                aria-hidden
              />
              {/* Filled line */}
              <div
                className="absolute top-[14px] h-0.5 bg-ir-accent z-0 transition-all duration-700"
                style={{
                  left: "14px",
                  width: milestoneIdx === 0
                    ? "0%"
                    : `calc(${(milestoneIdx / 3) * 100}% - ${milestoneIdx === 3 ? 28 : 14}px)`,
                }}
                aria-hidden
              />
              {MILESTONES.map((m, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-2" style={{ width: "28px" }}>
                  {/* Node — sized so its border-box interior (24px minus the 2px border on
                      each side) exactly matches the 24px floor the checkmark icon renders at,
                      so the glyph fits without spilling past the circle's edge. */}
                  <div
                    className={[
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                      i < milestoneIdx
                        ? "bg-ir-accent border-ir-accent"
                        : i === milestoneIdx
                        ? "bg-white border-ir-accent shadow-sm"
                        : "bg-white border-gray-200",
                    ].join(" ")}
                  >
                    {i < milestoneIdx ? (
                      <svg width="24" height="24" viewBox="0 0 9 9" fill="none" aria-hidden>
                        <path d="M1.5 4.5L3.5 7L7.5 2" stroke="white" strokeWidth="1.4"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : i === milestoneIdx ? (
                      <div className="w-2 h-2 rounded-full bg-ir-accent" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {/* Labels below track */}
            <div className="flex justify-between mt-0" aria-hidden>
              {MILESTONES.map((m, i) => (
                <span
                  key={i}
                  className={[
                    "text-[10px] font-medium leading-tight text-center",
                    i <= milestoneIdx ? "text-gray-600" : "text-gray-300",
                  ].join(" ")}
                  style={{ width: "60px", marginLeft: i === 0 ? "-20px" : i === 3 ? "-20px" : "-10px" }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Score + explanation */}
            <div className="mt-4 pt-3.5 border-t border-gray-100">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-[22px] font-bold text-gray-900 tabular-nums leading-none">{score}</span>
                <span className="text-[12px] text-gray-300 leading-none">/&nbsp;100</span>
                <span
                  className={[
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none ml-0.5",
                    level === "complete"
                      ? "bg-emerald-50 text-emerald-600"
                      : level === "high"
                      ? "bg-[#AACC00]/10 text-[#5A7A00]"
                      : level === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {levelLabel}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">{explanation}</p>
            </div>
          </div>

          {/* ── Capabilities ── */}
          <div className="px-5 mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
              {unlocked.length > 0 ? "AI ทำอะไรได้แล้ว" : "AI จะทำอะไรได้เมื่อข้อมูลครบ"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[...unlocked, ...locked].map((cap, i) => {
                const isUnlocked = i < unlocked.length;
                return (
                  <div
                    key={cap.label}
                    className={[
                      "rounded-xl border px-3 py-2.5 flex items-start gap-2",
                      isUnlocked
                        ? "bg-white border-gray-100 shadow-sm"
                        : "bg-gray-50 border-gray-100",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        isUnlocked ? "bg-ir-accent" : "bg-gray-200",
                      ].join(" ")}
                    >
                      {isUnlocked ? (
                        <svg width="24" height="24" viewBox="0 0 9 9" fill="none" aria-hidden>
                          <path d="M1.5 4.5L3.5 7L7.5 2" stroke="white" strokeWidth="1.4"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <rect x="1.5" y="3.8" width="5" height="3.7" rx="0.8" stroke="#9CA3AF" strokeWidth="0.9" />
                          <path d="M3 3.8V2.8a1 1 0 012 0v1" stroke="#9CA3AF" strokeWidth="0.9"
                            strokeLinecap="round" fill="none" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold leading-tight ${isUnlocked ? "text-gray-800" : "text-gray-300"}`}>
                        {cap.label}
                      </p>
                      <p className={`text-[10px] leading-snug mt-0.5 ${isUnlocked ? "text-gray-400" : "text-gray-300"}`}>
                        {cap.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Missing what would help ── */}
          {missing.length > 0 && (
            <div className="px-5 mb-4">
              <div className="flex items-baseline justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  เพิ่มเพื่อให้ AI ทำงานดีขึ้น
                </p>
                {missing.length > 5 && (
                  <span className="text-[11px] text-gray-300 font-medium">
                    +{missing.length - 5} อื่นๆ
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {missing.slice(0, 5).map((f, i) => (
                  <MissingCard key={f.label} factor={f} isPriority={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* ── Earned what AI already knows ── */}
          {earned.length > 0 && (
            <div className="px-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
                AI รู้แล้ว ({earned.length}/{breakdown.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {earned.map(f => (
                  <span
                    key={f.label}
                    className="flex items-center gap-1 rounded-full bg-white border border-gray-100 px-2.5 py-1 text-[11px] text-gray-600 shadow-sm"
                  >
                    <svg width="24" height="24" viewBox="0 0 8 8" fill="none" className="text-emerald-500 shrink-0" aria-hidden>
                      <path d="M1 4L3 6.5L7 1.5" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Missing factor card ───────────────────────────────────────────────────

function MissingCard({ factor, isPriority }: { factor: ConfidenceFactor; isPriority: boolean }) {
  return (
    <div
      className={[
        "rounded-[14px] border px-4 py-3.5",
        isPriority
          ? "bg-white border-gray-100 shadow-sm"
          : "bg-gray-50/60 border-gray-100/80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {isPriority && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-ir-accent mt-0.5" aria-hidden />
          )}
          <span className="text-[13px] font-semibold text-gray-800 leading-tight">{factor.label}</span>
          {isPriority && (
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#AACC00]/10 text-[#4A6600] leading-none">
              แนะนำต่อไป
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] font-medium text-gray-300 mt-0.5">
          +{factor.points} pts
        </span>
      </div>

      <p className="text-[11px] text-gray-400 leading-snug mb-2.5">{factor.why}</p>

      <div className="flex items-center gap-1.5">
        <svg width="24" height="24" viewBox="0 0 12 12" fill="none" className="text-ir-accent shrink-0" aria-hidden>
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] font-semibold text-[#4A6600]">{factor.action}</p>
      </div>
    </div>
  );
}
