"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { nextStepText, fmtDate } from "@/components/requirement";
import { IconCheck, IconPalette } from "@/components/icons";
import { LumaLoader, LumaChip } from "@/components/AIMascot";
import { directionById } from "@/lib/data";
import { DesignDNACard } from "@/components/DesignDNA";

// ── Requirement Submitted clean success/confirmation page only ──
export default function SubmittedPage() {
  const params = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  const requirements = useStore((s) => s.requirements);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <LumaLoader />;

  const req = requirements.find((r) => r.id === params.id);
  if (!req) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="flex items-center justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
            <rect x="3" y="3" width="42" height="42" rx="11" fill="#A0A3AB" fillOpacity="0.1" />
            <rect x="3" y="3" width="42" height="42" rx="11" stroke="#A0A3AB" strokeOpacity="0.28" strokeWidth="1.5" />
            <line x1="17" y1="17" x2="31" y2="31" stroke="#A0A3AB" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="31" y1="17" x2="17" y2="31" stroke="#A0A3AB" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-title font-medium text-ir-t2 mb-2">ไม่พบ Requirement</h2>
        <Link href="/" className="text-ir-accent-text text-body underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const frozen = req.status === "frozen";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* success header */}
      {/* overflow-clip, not hidden: hidden would capture the scroll-motion view() timelines inside. */}
      <div className="bg-ir-card border border-ir-border rounded-3xl overflow-clip shadow-e1 mb-6">
        <div className="relative text-center px-8 py-10 bg-ir-dark">
          {/* LUMA squircle success badge — scales down on narrow screens instead of
              staying a fixed 80px, which read as oversized relative to the card on mobile */}
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5">
            <div className="absolute inset-0 rounded-md sm:rounded-xl bg-ir-accent/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md sm:rounded-xl bg-ir-accent flex items-center justify-center" style={{ boxShadow: "0 0 0 6px rgba(215,224,39,0.15)" }}>
              <IconCheck width={22} height={22} className="text-ir-on-accent sm:w-8 sm:h-8" />
            </div>
          </div>
          <h1 className="text-white text-heading font-semibold mb-2">
            {frozen ? "โครงการพร้อมเริ่มต้นแล้ว 🚀" : "ส่งข้อมูลสำเร็จแล้ว!"}
          </h1>
          <p className="text-white/80 text-lead max-w-sm mx-auto mb-1 leading-relaxed">
            IR Plus ได้รับข้อมูลของคุณเรียบร้อยแล้ว
          </p>
          <p className="text-white/70 text-body max-w-xs mx-auto mb-6">
            ทีมงานจะติดต่อกลับภายใน 1–2 วันทำการ
          </p>
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/15 rounded-full pl-3.5 pr-4 py-1.5">
            <span className="text-small text-white/70">หมายเลขอ้างอิง</span>
            <span className="font-mono text-white font-medium tracking-wider text-body">{req.id}</span>
          </div>
        </div>

        {/* info */}
        <div className="p-6 md:p-8">
          <div className="sc-reveal grid sm:grid-cols-2 gap-2.5 mb-5">
            <Field k="บริษัท / องค์กร" v={req.company || "-"} />
            <Field k="ผู้ติดต่อ" v={req.name || "-"} />
            <Field k="วันที่ส่ง" v={fmtDate(req.createdAt)} />
            <Field k="ประเภทโครงการ" v={req.projectType || "Corporate Website"} />
          </div>

          {/* What happens next: who, when, how — in plain words */}
          <div className="sc-reveal rounded-xl border border-ir-select-soft bg-primary-50 px-5 py-5 mb-6">
            <div className="flex items-center gap-2.5">
              <LumaChip type="celebrate" size={16} />
              <h2 className="text-lead font-semibold text-ir-t1">สิ่งที่จะเกิดขึ้นต่อจากนี้</h2>
            </div>
            <p className="mt-1 text-body text-ir-t2 leading-relaxed">{nextStepText(req.status)}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["ใครจะติดต่อ", "ผู้ดูแลโครงการจากทีม IR Plus"],
                ["เมื่อไร", "ภายใน 1–2 วันทำการ"],
                ["ทางไหน", req.phone || req.email ? [req.phone, req.email].filter(Boolean).join(" · ") : "ข้อมูลติดต่อที่ให้ไว้"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md bg-white px-4 py-3">
                  <dt className="text-small text-ir-t3">{k}</dt>
                  <dd className="mt-0.5 text-body font-semibold text-ir-t1 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The client's Design DNA, the same card they reviewed before sending */}
          <DesignDNACard req={req} className="sc-reveal mb-6" />

          {/* Moodboard notification based on real direction data from quiz */}
          {(() => {
            const dir = directionById(req.selectedDirection);
            const colors = dir?.colors ?? [];
            return (
              <div className="sc-reveal rounded-xl border border-ir-border bg-ir-bg overflow-hidden">
                {/* Color palette strip actual colors from quiz-derived direction */}
                {colors.length > 0 && (
                  <div className="flex h-2">
                    {colors.map((c, i) => (
                      <div key={i} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                )}
                <div className="px-4 py-4 flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-ir-muted text-ir-t2 grid place-items-center"><IconPalette width={24} height={24} /></div>
                  <div className="flex-1">
                    <div className="text-body font-semibold text-ir-t1 mb-1">
                      Moodboard จะถูกจัดทำและส่งให้ทางอีเมล
                    </div>
                    <p className="text-body text-ir-t2 leading-relaxed">
                      ทีม IR Plus จะนำ Direction{dir ? ` "${dir.label}"` : ""} · Palette
                      {colors.length > 0 && ` (${dir?.palette ?? ""})`} · และ Sections ที่คุณเลือก
                      มาจัดทำ Moodboard พร้อมส่งไปที่{" "}
                      <span className="text-ir-accent-text font-medium">{req.email || "อีเมลของคุณ"}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* actions — keep a copy (browser print → PDF), or go home */}
      <div className="no-print flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => window.print()} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ir-dark px-8 text-lead font-semibold text-white transition-[background-color,scale] hover:bg-neutral-800 active:scale-[0.98] sm:w-auto">
          บันทึกสรุปเป็น PDF
        </button>
        <Link href="/" className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ir-muted px-8 text-lead font-medium text-ir-t1 transition-colors hover:bg-ir-border sm:w-auto">
          กลับหน้าหลัก
        </Link>
      </div>
      <div className="text-center mt-4">
        <p className="text-ir-t3 text-body">มีคำถาม? ติดต่อทีม IR Plus ได้ที่ <span className="text-ir-accent-text">hello@irplus.co.th</span></p>
      </div>
    </div>
  );
}

function Field({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-ir-bg border border-ir-border rounded-sm px-3.5 py-2.5">
      <div className="text-small uppercase tracking-wide text-ir-t3 mb-0.5">{k}</div>
      <div className={`text-body font-medium ${accent ? "text-ir-accent-text" : "text-ir-t1"}`}>{v || "-"}</div>
    </div>
  );
}
