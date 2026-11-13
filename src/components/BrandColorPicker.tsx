"use client";
// ── "ใช้ชุดสีเดิม": read the colours off their current website, let them confirm the main one ──
// Shown under the CI choice when they keep their existing colours. One tap reads the site
// in "เว็บไซต์ปัจจุบัน" (via /api/brand-colors); the swatches that come back are theirs to
// confirm (tap = สีหลัก), and a colour can also be added by hand when the site can't be read.
import { useState } from "react";
import type { Requirement } from "@/lib/types";

type Status = "idle" | "loading" | "error";

export function BrandColorPicker({ draft, updateDraft }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [manual, setManual] = useState("#");
  const colors = draft.brandColors ?? [];
  const site = (draft.website ?? "").trim();

  const read = async () => {
    if (!site || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/brand-colors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: site }) });
      const data = await res.json();
      const found: string[] = [...(data.colors ?? []), ...(data.neutrals ?? [])];
      if (!res.ok || !found.length) { setStatus("error"); return; }
      updateDraft({ brandColors: found.slice(0, 8), brandPrimary: data.colors?.[0] ?? found[0], brandFonts: data.fonts ?? [] });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const addManual = () => {
    const hex = manual.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex) || colors.includes(hex)) return;
    updateDraft({ brandColors: [...colors, hex], brandPrimary: draft.brandPrimary || hex });
    setManual("#");
  };
  const removeColor = (hex: string) => {
    const next = colors.filter((c) => c !== hex);
    updateDraft({ brandColors: next, brandPrimary: draft.brandPrimary === hex ? next[0] ?? "" : draft.brandPrimary });
  };

  return (
    <div className="mt-4 rounded-[18px] border border-ir-border bg-ir-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ir-t1">สีจากเว็บไซต์ปัจจุบัน</p>
          <p className="mt-0.5 text-[13px] text-ir-t3">
            {site ? `อ่านสีและฟอนต์จาก ${site.replace(/^https?:\/\//, "")}` : "ใส่ลิงก์เว็บไซต์ปัจจุบันด้านบนก่อน แล้วกดดึงสี"}
          </p>
        </div>
        <button
          type="button"
          onClick={read}
          disabled={!site || status === "loading"}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ir-dark px-4 text-[14px] font-semibold text-white transition-[background-color,scale,opacity] duration-200 hover:bg-neutral-800 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "กำลังอ่านสี…" : colors.length ? "ดึงสีอีกครั้ง" : "ดึงสีจากเว็บไซต์"}
        </button>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-3 text-[14px] text-ir-t2">อ่านสีจากเว็บไซต์นี้ไม่ได้ ใส่รหัสสีเองด้านล่างได้</p>
      )}

      {colors.length > 0 && (
        <>
          <p className="mt-4 text-[13px] text-ir-t3">กดเลือกสีหลักของแบรนด์</p>
          <div role="radiogroup" aria-label="สีหลักของแบรนด์" className="mt-2 flex flex-wrap gap-2.5">
            {colors.map((hex) => {
              const main = draft.brandPrimary === hex;
              return (
                <div key={hex} className="group relative">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={main}
                    aria-label={`${hex}${main ? " สีหลัก" : ""}`}
                    onClick={() => updateDraft({ brandPrimary: hex })}
                    className={`flex w-[76px] flex-col items-stretch rounded-[14px] border bg-white p-1.5 text-left transition-[border-color,box-shadow,scale] duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40 ${
                      main ? "border-ir-select shadow-[0_0_0_2px_rgba(215,224,39,0.22)]" : "border-ir-border hover:border-ir-select-soft"
                    }`}
                  >
                    <span className="block h-12 rounded-[10px] ring-1 ring-inset ring-black/10" style={{ background: hex }} />
                    <span className="mt-1 block font-mono text-[11px] text-ir-t2">{hex}</span>
                  </button>
                  {main && <span className="rk-first pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ir-accent px-2 py-0.5 text-[11px] font-semibold text-ir-on-accent">สีหลัก</span>}
                  <button
                    type="button"
                    onClick={() => removeColor(hex)}
                    aria-label={`เอา ${hex} ออก`}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-ir-t3 shadow ring-1 ring-ir-border opacity-100 transition-opacity hover:text-ir-error md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <svg width={10} height={10} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
          {(draft.brandFonts?.length ?? 0) > 0 && (
            <p className="mt-3 text-[13px] text-ir-t3">ฟอนต์ที่พบ: <span className="font-medium text-ir-t2">{draft.brandFonts!.join(", ")}</span></p>
          )}
        </>
      )}

      {/* add a colour by hand */}
      <div className="mt-4 flex items-center gap-2">
        <input
          type="color"
          aria-label="เลือกสีเอง"
          value={/^#[0-9a-fA-F]{6}$/.test(manual) ? manual : "#000000"}
          onChange={(e) => setManual(e.target.value.toUpperCase())}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-[10px] border border-ir-border bg-white p-1"
        />
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
          aria-label="รหัสสี"
          placeholder="#1C4CA0"
          maxLength={7}
          className="h-10 w-[120px] rounded-full border border-ir-border bg-white px-4 font-mono text-[14px] uppercase text-ir-t1 outline-none focus:border-ir-select focus:ring-3 focus:ring-ir-ring/30"
        />
        <button
          type="button"
          onClick={addManual}
          disabled={!/^#[0-9a-fA-F]{6}$/.test(manual)}
          className="inline-flex h-10 items-center rounded-full border border-ir-border-hi bg-white px-4 text-[14px] font-semibold text-ir-t1 transition-[border-color,scale,opacity] hover:border-ir-t1 active:scale-[0.96] disabled:opacity-40"
        >
          เพิ่มสี
        </button>
      </div>
    </div>
  );
}
