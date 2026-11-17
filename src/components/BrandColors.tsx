"use client";
// ── Brand colours (step 1, under "ใช้ชุดสีเดิม") ─────────────────────────────────────
// Up to three colours: หลัก / รอง / เสริม. Each is a swatch (opens the native colour picker)
// plus a hex field, so a client can paste the code from their CI guide or just pick by eye.
// Optional: left empty, the team takes the colours from their current site or logo.
// Stored as brandColors (in slot order, blanks dropped) and brandPrimary (the first).
// User test #1: BTS chose "ใช้ชุดสีเดิม" but the summary still showed the Direction's navy &
// gold — their red was nowhere. This is where their real colours come from.
import { useState } from "react";
import type { Requirement } from "@/lib/types";

const SLOTS = [
  { label: "สีหลัก", hint: "สีที่เห็นมากที่สุดในโลโก้" },
  { label: "สีรอง", hint: "ถ้ามี" },
  { label: "สีเสริม", hint: "ถ้ามี" },
];
const HEX = /^#?[0-9a-f]{6}$/i;
const norm = (v: string) => (v.startsWith("#") ? v : `#${v}`).toUpperCase();

export function BrandColorInput({ draft, updateDraft }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void }) {
  // Local text per slot so a half-typed hex isn't thrown away; only valid codes are saved.
  const saved = draft.brandColors ?? [];
  const [text, setText] = useState<string[]>(() => SLOTS.map((_, i) => saved[i] ?? ""));
  const save = (next: string[]) => {
    const colors = next.filter((v) => HEX.test(v)).map(norm);
    updateDraft({ brandColors: colors, brandPrimary: colors[0] ?? "" });
  };
  const set = (i: number, v: string) => {
    const next = text.map((t, j) => (j === i ? v.trim() : t));
    setText(next);
    save(next);
  };

  return (
    <div className="mt-3 rounded-xl border border-ir-border bg-ir-card p-4">
      <p className="text-body font-semibold text-ir-t1">สีของแบรนด์ <span className="font-normal text-small text-ir-t3">(ไม่บังคับ)</span></p>
      <p className="mt-0.5 text-small text-ir-t3">ใส่รหัสสีจากคู่มือ CI หรือกดที่ช่องสีเพื่อเลือก · ถ้าไม่ทราบ เว้นไว้ได้ ทีมจะดึงจากเว็บไซต์หรือโลโก้ปัจจุบัน</p>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {SLOTS.map((s, i) => {
          const valid = HEX.test(text[i]);
          const id = `brand-color-${i}`;
          return (
            <div key={s.label} className="min-w-0">
              <label htmlFor={id} className="text-small font-semibold text-ir-t1">{s.label} <span className="font-normal text-ir-t3">· {s.hint}</span></label>
              <div className="mt-1.5 flex items-center gap-2">
                {/* swatch = native colour picker */}
                <label className="relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md border border-ir-border focus-within:ring-3 focus-within:ring-ir-ring/40"
                  style={valid ? { background: norm(text[i]) } : undefined} title={`เลือก${s.label}`}>
                  {!valid && <span aria-hidden className="text-lead text-ir-t3">+</span>}
                  <input type="color" aria-label={`เลือก${s.label}`} value={valid ? norm(text[i]).toLowerCase() : "#cccccc"}
                    onChange={(e) => set(i, e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                </label>
                <input id={id} value={text[i]} onChange={(e) => set(i, e.target.value)} placeholder="#RRGGBB" maxLength={7} spellCheck={false}
                  className={`h-11 min-w-0 flex-1 rounded-md border px-3 font-mono text-body uppercase outline-none transition-colors focus:border-ir-accent ${text[i] && !valid ? "border-ir-error" : "border-ir-border"}`} />
                {text[i] && (
                  <button type="button" onClick={() => set(i, "")} aria-label={`ล้าง${s.label}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ir-t3 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring">✕</button>
                )}
              </div>
              {text[i] && !valid && <p className="mt-1 text-caption text-ir-error">ใส่รหัสสี 6 หลัก เช่น #E31E24</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
