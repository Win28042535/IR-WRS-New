"use client";

import { useState } from "react";
import { LumaChip } from "./AIMascot";
import type { LumaType } from "./AIMascot";
import type { NotebookEntry, NotebookCategory } from "@/lib/types";

interface Props {
  entries: NotebookEntry[];
  className?: string;
  defaultExpanded?: boolean;
}

type FilterTab = "all" | NotebookCategory;

const CAT_META: Record<NotebookCategory, { icon: string; label: string; color: string; bg: string }> = {
  insight:        { icon: "◉", label: "Business Insight",    color: "#4A90D9", bg: "rgba(74,144,217,0.10)" },
  recommendation: { icon: "✦", label: "AI Recommendation",  color: "#AACC00", bg: "rgba(170,204,0,0.10)"  },
  reasoning:      { icon: "◈", label: "Design Reasoning",   color: "#9B59B6", bg: "rgba(155,89,182,0.10)" },
  gap:            { icon: "△", label: "Requirement Gap",     color: "#E67E22", bg: "rgba(230,126,34,0.10)" },
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",            label: "All" },
  { key: "insight",        label: "Insights" },
  { key: "recommendation", label: "Recs" },
  { key: "reasoning",      label: "Reasoning" },
  { key: "gap",            label: "Gaps" },
];

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function AINotebook({ entries, className = "", defaultExpanded = false }: Props) {
  const [open, setOpen] = useState(defaultExpanded);
  const [filter, setFilter] = useState<FilterTab>("all");

  const sorted = [...entries].sort((a, b) => a.at - b.at);
  const visible = filter === "all" ? sorted : sorted.filter((e) => e.category === filter);

  const counts: Record<NotebookCategory, number> = { insight: 0, recommendation: 0, reasoning: 0, gap: 0 };
  for (const e of sorted) counts[e.category]++;

  const gapCount = counts.gap;

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
          <span className="text-[11px] font-semibold text-ir-accent-text/80 tracking-widest uppercase">AI Notebook</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: "rgba(170,204,0,0.12)", color: "#AACC00" }}
          >
            {sorted.length} note{sorted.length !== 1 ? "s" : ""}
          </span>
          {gapCount > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(230,126,34,0.12)", color: "#E67E22" }}
            >
              {gapCount} gap{gapCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span
          className="text-[10px] text-ir-t3 transition-transform duration-200"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-ir-border/40">
          {/* Filter tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto">
            {TABS.map((tab) => {
              const active = filter === tab.key;
              const cnt = tab.key === "all" ? sorted.length : counts[tab.key as NotebookCategory];
              if (tab.key !== "all" && cnt === 0) return null;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFilter(tab.key); }}
                  className="shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
                  style={active
                    ? { background: "rgba(170,204,0,0.15)", color: "#AACC00", border: "1px solid rgba(170,204,0,0.3)" }
                    : { background: "transparent", color: "var(--ir-t3)", border: "1px solid transparent" }
                  }
                >
                  {tab.label}{tab.key !== "all" && cnt > 0 ? ` ${cnt}` : ""}
                </button>
              );
            })}
          </div>

          {/* Entries */}
          <div className="px-4 pb-4 flex flex-col gap-2.5">
            {visible.length === 0 && (
              <p className="text-[11px] text-ir-t3 text-center py-3">No {filter} entries yet</p>
            )}
            {visible.map((entry, i) => {
              const meta = CAT_META[entry.category];
              return (
                <div
                  key={entry.id}
                  className="rounded-xl p-3 ai-notebook-entry-in"
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.color}25`,
                    animationDelay: `${i * 35}ms`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <LumaChip type={entry.category as LumaType} size={12} />
                      <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: meta.color, opacity: 0.85 }}>
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-ir-t3 opacity-50 shrink-0">{formatTime(entry.at)}</span>
                  </div>

                  {/* Title */}
                  <p className="text-[12.5px] font-semibold text-ir-t1 leading-snug mb-1">{entry.title}</p>

                  {/* Body */}
                  <p className="text-[11px] text-ir-t3 leading-relaxed">{entry.body}</p>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: `${meta.color}15`, color: meta.color, opacity: 0.8 }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
