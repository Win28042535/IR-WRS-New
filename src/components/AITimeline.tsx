"use client";

import { useState } from "react";
import { LumaChip } from "./AIMascot";
import type { LumaType } from "./AIMascot";
import type { TimelineEntry, TimelineEventType } from "@/lib/types";

interface Props {
  entries: TimelineEntry[];
  className?: string;
  defaultExpanded?: boolean;
}

const TYPE_META: Record<TimelineEventType, { label: string; color: string }> = {
  company:   { label: "Company",   color: "#4A90D9" },
  industry:  { label: "Industry",  color: "#7B68EE" },
  goal:      { label: "Goal",       color: "#E67E22" },
  quiz:      { label: "Style",      color: "#9B59B6" },
  direction: { label: "Direction",  color: "#AACC00" },
  section:   { label: "Sections",   color: "#1ABC9C" },
  layout:    { label: "Layout",     color: "#3498DB" },
  submitted: { label: "Submitted",  color: "#AACC00" },
};

const TYPE_LUMA: Record<TimelineEventType, LumaType> = {
  company:   "tip",
  industry:  "tip",
  goal:      "recommendation",
  quiz:      "reasoning",
  direction: "insight",
  section:   "tip",
  layout:    "recommendation",
  submitted: "celebrate",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function AITimeline({ entries, className = "", defaultExpanded = false }: Props) {
  const [open, setOpen] = useState(defaultExpanded);

  const sorted = [...entries].sort((a, b) => a.at - b.at);

  if (sorted.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-ir-border overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold text-ir-accent/80 tracking-widest uppercase">AI Timeline</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(170,204,0,0.12)", color: "#AACC00" }}
          >
            {sorted.length} decision{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span
          className="text-[10px] text-ir-t3 transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* Entries */}
      {open && (
        <div className="px-4 pb-4">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[15px] top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(170,204,0,0.3), rgba(170,204,0,0.05))" }}
            />

            <div className="flex flex-col gap-3 pt-1">
              {sorted.map((entry, i) => {
                const meta = TYPE_META[entry.type] ?? TYPE_META.company;
                const isLast = i === sorted.length - 1;
                return (
                  <div key={entry.id} className="flex gap-3 items-start relative ai-timeline-entry-in" style={{ animationDelay: `${i * 40}ms` }}>
                    {/* Squircle icon bubble */}
                    <div
                      className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 z-10"
                      style={{
                        background: `${meta.color}18`,
                        border: `1px solid ${meta.color}40`,
                        boxShadow: isLast ? `0 0 0 3px ${meta.color}15` : undefined,
                      }}
                    >
                      <LumaChip type={TYPE_LUMA[entry.type]} size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="text-[9px] font-semibold tracking-widest uppercase"
                          style={{ color: meta.color, opacity: 0.8 }}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[9px] text-ir-t3 opacity-50">{formatTime(entry.at)}</span>
                      </div>
                      {/* Decision */}
                      <p className="text-[12.5px] font-semibold text-ir-t1 leading-snug mb-1">
                        {entry.decision}
                      </p>
                      {/* Reasoning */}
                      <p className="text-[11px] text-ir-t3 leading-relaxed">
                        {entry.reasoning}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
