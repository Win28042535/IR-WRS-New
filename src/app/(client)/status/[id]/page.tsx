"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { nextStepText, fmtDate } from "@/components/requirement";
import { IconCheck } from "@/components/icons";
import { LumaChip } from "@/components/AIMascot";
import { PageLoader } from "@/components/Loader";
import { CONTACT_DAYS } from "@/lib/data";
import { BackToTop } from "@/components/BackToTop";
import { SaveSheetButton } from "@/components/SaveSheetButton";

// ── Requirement Submitted clean success/confirmation page only ──
export default function SubmittedPage() {
  const params = useParams<{ id: string }>();
  const [mounted, setMounted] = useState(false);
  const requirements = useStore((s) => s.requirements);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <PageLoader title="กำลังเตรียมข้อมูล" />;

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
      <BackToTop threshold={600} />
      {/* success header */}
      {/* overflow-clip, not hidden: hidden would capture the scroll-motion view() timelines inside. */}
      <div className="bg-ir-card border border-ir-border rounded-3xl overflow-clip shadow-e1 mb-6">
        <div className="relative text-center px-8 py-10 bg-ir-dark">
          {/* LUMA squircle success badge — scales down on narrow screens instead of
              staying a fixed 80px, which read as oversized relative to the card on mobile */}
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5">
            <div className="absolute inset-0 rounded-md sm:rounded-xl bg-ir-accent/20 motion-safe:animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-md sm:rounded-xl bg-ir-accent flex items-center justify-center" style={{ boxShadow: "0 0 0 6px rgba(215,224,39,0.15)" }}>
              <IconCheck width={22} height={22} className="text-ir-on-accent sm:w-8 sm:h-8" />
            </div>
          </div>
          <h1 className="text-white text-heading font-semibold mb-2">
            {frozen ? "โครงการพร้อมเริ่มต้นแล้ว 🚀" : "ส่งข้อมูลสำเร็จแล้ว!"}
          </h1>
          <p className="text-white/80 text-lead max-w-sm mx-auto mb-6 leading-relaxed">
            ทีมจะติดต่อกลับภายใน {CONTACT_DAYS}
          </p>
          <CopyRef id={req.id} />
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
            {req.status !== "submitted" && <p className="mt-1 text-body text-ir-t2 leading-relaxed">{nextStepText(req.status)}</p>}
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["ใครจะติดต่อ", "ผู้ดูแลโครงการจากทีม IR Plus"],
                ["เมื่อไร", `ภายใน ${CONTACT_DAYS}`],
                ["ทางไหน", (() => { const ways = req.callbackOk !== true ? [req.email] : [req.phone, req.lineId && `LINE ${req.lineId}`, req.email]; return ways.filter(Boolean).join(" · ") || "ข้อมูลติดต่อที่ให้ไว้"; })()],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md bg-white px-4 py-3">
                  <dt className="text-small text-ir-t3">{k}</dt>
                  <dd className="mt-0.5 text-body font-semibold text-ir-t1 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

        </div>
      </div>

      {/* actions — keep a copy of the summary sheet (stamped with the reference number and
          the download time), or go home */}
      {/* phones: the two save buttons side by side, home below; from sm up all in one row */}
      <div className="no-print flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
          <SaveSheetButton source={req} kind="pdf" refNo={req.id} className="w-full sm:w-auto" />
          <SaveSheetButton source={req} kind="png" refNo={req.id} className="w-full sm:w-auto" />
        </div>
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

// The reference number as a button: a tap copies it (a check + "คัดลอกแล้ว" for 2 s).
// Where the clipboard is blocked, the number is selected so it can be copied by hand.
function CopyRef({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const numRef = useRef<HTMLSpanElement>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = numRef.current;
      if (el) { const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); }
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={`คัดลอกหมายเลขอ้างอิง ${id}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-3.5 pr-3 transition-colors hover:bg-white/[0.14] focus-ring">
      <span className="text-small text-white/70">หมายเลขอ้างอิง</span>
      <span ref={numRef} className="font-mono text-body font-medium tracking-wider text-white">{id}</span>
      <span aria-live="polite" className={`inline-flex items-center gap-1 text-small font-medium ${copied ? "text-ir-accent" : "text-white/70"}`}>
        {copied ? (
          <><IconCheck width={16} height={16} />คัดลอกแล้ว</>
        ) : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        )}
      </span>
    </button>
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
