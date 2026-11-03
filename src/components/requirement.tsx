"use client";

// Shared building blocks for the Requirement Submitted (clean success) page and the
// Requirement Summary (full collapsible workspace) page. Components return INNER content;
// <Collapsible> supplies the card + expand/collapse chrome.

import { useState } from "react";
import { useStore } from "@/lib/store";
import { directionById, BUSINESS_GOALS, APPROVER_PROFILES, MOODS, SECTION_CATEGORIES, SECTIONS } from "@/lib/data";
import { summarizeStakeholders } from "@/lib/recommend";
import { STATUS_LABEL, requirementSummary, designInsight, recommendedGroups, approvalSummary } from "@/lib/insight";
import { SitemapView } from "@/components/SitemapView";
import { DevicePreview } from "@/components/DevicePreview";
import { MiniMock } from "@/components/MiniMock";
import { photo, bgImage } from "@/lib/images";
import { IconCheck, IconClose, IconUsers, IconLock } from "@/components/icons";
import type { Requirement, Approver } from "@/lib/types";

export const fmtDate = (t: number) => new Date(t).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function nextStepText(status: Requirement["status"]): string {
  switch (status) {
    case "submitted": return "IR Plus ได้รับข้อมูลของคุณเรียบร้อยแล้ว ทีมงานจะตรวจสอบและติดต่อกลับภายใน 1–2 วันทำการ";
    case "in_review": return "ทีมงานกำลังตรวจสอบข้อมูล หากต้องการข้อมูลเพิ่มเติม เราจะติดต่อกลับทาง Email ที่แจ้งไว้";
    case "approved": return "IR Plus พร้อมเริ่มงานออกแบบแล้ว ทีมออกแบบจะติดต่อเพื่อนัดหมาย Project Kickoff";
    case "frozen": return "โครงการพร้อมเริ่มต้น ทีมออกแบบจะติดต่อเพื่อนัดหมาย Kickoff Meeting โดยเร็ว";
    case "change_request": return "ทีมงานต้องการข้อมูลเพิ่มเติมบางส่วน เราจะติดต่อกลับเพื่อขอรายละเอียดเพิ่มเติม";
    case "archived": return "โครงการนี้ถูกจัดเก็บแล้ว ติดต่อทีม IR Plus ได้หากต้องการดำเนินการต่อ";
    default: return "ข้อมูลถูกบันทึกเป็นฉบับร่าง";
  }
}

// ── Collapsible section card ──
export function Collapsible({ title, emoji, badge, defaultOpen = false, children }: { title: string; emoji?: string; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-ir-card border border-ir-border rounded-[20px] ir-shadow mb-4 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 md:px-6 py-4 text-left hover:bg-ir-bg/60 transition-colors">
        <span className="text-sm font-medium text-ir-t1 flex items-center gap-2">{emoji && <span>{emoji}</span>}{title}</span>
        <span className="flex items-center gap-2 text-xs text-ir-t3">{badge}<span className="text-[10px]">{open ? "▲" : "▼"}</span></span>
      </button>
      {open && <div className="px-5 md:px-6 pb-6 pt-1 border-t border-ir-border">{children}</div>}
    </div>
  );
}

// ── small helpers ──
export function Info({ k, v }: { k: string; v: string }) {
  return <div className="bg-ir-bg border border-ir-border rounded-lg px-3.5 py-2.5"><div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-0.5">{k}</div><div className="text-[13px] text-ir-t1">{v || "-"}</div></div>;
}

function Vcard({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="border border-ir-border rounded-xl p-3 bg-ir-card"><div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-2">{label}</div>{children}</div>;
}

// ── Lightweight preview summary (Submitted page) ──
export function LightPreviewSummary({ req }: { req: Requirement }) {
  const dir = directionById(req.selectedDirection);
  const moods = (req.selectedMoods || []).map((id) => MOODS.find((m) => m.id === id)).filter(Boolean) as { id: string; label: string; swatch: string }[];
  if (!dir) return null;
  return (
    <div className="grid sm:grid-cols-[200px_1fr] gap-4 items-center">
      <div className="aspect-[16/10] rounded-xl overflow-hidden border border-ir-border"><MiniMock colors={dir.colors} layout={dir.layout} /></div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-1">Website Direction</div>
        <div className="text-[15px] font-semibold text-ir-t1">{dir.label}</div>
        <div className="text-[12px] text-ir-t3 mb-3">{dir.tagline}</div>
        <div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-1.5">Mood &amp; Tone</div>
        <div className="flex flex-wrap gap-1.5">
          {moods.length ? moods.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 text-[11px] text-ir-t2 bg-ir-bg border border-ir-border rounded px-2 py-1"><span className="w-3 h-3 rounded" style={{ background: m.swatch }} />{m.label}</span>
          )) : <span className="text-[11px] text-ir-t3">—</span>}
        </div>
      </div>
    </div>
  );
}

// ── Project Information ──
export function ProjectInfo({ req }: { req: Requirement }) {
  return (
    <div className="grid md:grid-cols-2 gap-2.5 mt-3">
      <Info k="ชื่อผู้ติดต่อ" v={req.name} />
      <Info k="บริษัท" v={req.company} />
      <Info k="Email" v={req.email} />
      <Info k="โทรศัพท์" v={req.phone || "-"} />
      <Info k="Industry" v={req.industry} />
      <Info k="Company Type" v={req.companyType} />
      {req.projectType && <Info k="Website Type" v={req.projectType} />}
      <Info k="Submitted" v={fmtDate(req.createdAt)} />
    </div>
  );
}

// ── Website Direction ──
export function DirectionDetail({ req }: { req: Requirement }) {
  const dir = directionById(req.selectedDirection);
  if (!dir) return <p className="text-[12px] text-ir-t3 mt-3">ยังไม่ได้เลือก Direction</p>;
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 mt-3 items-start">
      <div className="aspect-[16/10] rounded-xl overflow-hidden border border-ir-border"><MiniMock colors={dir.colors} layout={dir.layout} /></div>
      <div className="space-y-2">
        <div><div className="text-[15px] font-semibold text-ir-t1">{dir.label}</div><div className="text-[12px] text-ir-t3">{dir.tagline}</div></div>
        <div className="flex items-start gap-2"><span className="text-[10px] uppercase tracking-wide text-ir-t3 w-24 shrink-0 mt-1">Mood &amp; Tone</span><span className="text-[12px] text-ir-t2">{dir.mood.join(" · ")}</span></div>
        <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-wide text-ir-t3 w-24 shrink-0">Color</span><div className="flex items-center gap-2"><PaletteRow colors={dir.colors} /><span className="text-[12px] text-ir-t2">{dir.palette}</span></div></div>
        <div className="flex items-start gap-2"><span className="text-[10px] uppercase tracking-wide text-ir-t3 w-24 shrink-0 mt-0.5">Layout</span><span className="text-[12px] text-ir-t2">{req.selectedLayout || dir.layout}</span></div>
      </div>
    </div>
  );
}
function PaletteRow({ colors }: { colors: string[] }) {
  return <div className="flex gap-1">{colors.map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-ir-border" style={{ background: c }} />)}</div>;
}

// ── Business Goals ──
export function GoalsDetail({ req }: { req: Requirement }) {
  if (!req.businessGoals.length) return <p className="text-[12px] text-ir-t3 mt-3">ยังไม่ได้เลือกเป้าหมาย</p>;
  return (
    <div className="space-y-2 mt-3">
      {req.businessGoals.map((g) => {
        const G = BUSINESS_GOALS.find((x) => x.id === g);
        return (
          <div key={g} className="flex items-start gap-2.5 bg-ir-bg border border-ir-border rounded-lg px-3 py-2">
            <span className="text-lg shrink-0">{G?.emoji}</span>
            <div><div className="text-[13px] font-medium text-ir-t1">{G?.label || g}</div>{G?.desc && <div className="text-[11px] text-ir-t3">{G.desc}</div>}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Structure (sitemap + sections by category) ──
export function StructureDetail({ req }: { req: Requirement }) {
  return (
    <div className="mt-3 space-y-4">
      <SitemapView sections={req.selectedSections} />
      <div className="space-y-3">
        {SECTION_CATEGORIES.map((cat) => {
          const items = SECTIONS.filter((s) => s.category === cat && req.selectedSections.includes(s.id));
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-1.5">{cat}</div>
              <div className="flex flex-wrap gap-1.5">{items.map((s) => <span key={s.id} className="text-[11px] text-ir-t2 bg-ir-bg border border-ir-border rounded px-2 py-1">{s.name}</span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Preview (interactive) ──
export function PreviewDetail({ req }: { req: Requirement }) {
  return <div className="mt-3"><DevicePreview directionId={req.selectedDirection} industry={req.industry} sections={req.selectedSections} company={req.company} /></div>;
}

// ── Snapshot gallery / visual cards ──
export function VisualGallery({ req }: { req: Requirement }) {
  const dir = directionById(req.selectedDirection);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
      {dir && (
        <Vcard label="Website Direction">
          <div className="aspect-[16/9] rounded-lg overflow-hidden border border-ir-border mb-2"><MiniMock colors={dir.colors} layout={dir.layout} /></div>
          <div className="text-[12px] font-medium text-ir-t1">{dir.label}</div>
        </Vcard>
      )}
      <Vcard label="Industry">
        <div className="aspect-[16/9] rounded-lg overflow-hidden border border-ir-border mb-2" style={{ background: bgImage(photo("hero", req.industry, 0, 360, 200), "linear-gradient(135deg,#151823,#3C404C)", 0.08), backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="text-[12px] text-ir-t1">{req.industry || "—"}</div>
      </Vcard>
      <Vcard label={`Sitemap · ${req.selectedSections.length} sections`}><SitemapView sections={req.selectedSections} compact /></Vcard>
    </div>
  );
}

// ── Requirement Intelligence (AI summary + insight + recommendations) ──
export function IntelligenceDetail({ req }: { req: Requirement }) {
  const summary = requirementSummary(req);
  const insight = designInsight(req);
  const groups = recommendedGroups(req);
  return (
    <div className="grid md:grid-cols-2 gap-5 mt-3">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-2">AI Summary</div>
        <div className="space-y-1">
          {summary.map((s) => <div key={s.label} className="flex items-baseline gap-2 text-[12px]"><span className="text-ir-t3 w-32 shrink-0">{s.label}</span><span className="text-ir-t1 font-medium">{s.value}</span></div>)}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-ir-t3 mb-2">Design Insight &amp; Recommendations</div>
        <ul className="space-y-1.5 mb-3">{insight.map((i, k) => <li key={k} className="text-[12px] text-ir-t2 flex gap-2"><span className="text-ir-accent-text mt-0.5"><IconCheck width={24} height={24} /></span>{i}</li>)}</ul>
        <div className="flex flex-wrap gap-1.5">{groups.map((g) => <span key={g} className="text-[10px] text-ir-accent-text bg-ir-accent/10 px-2 py-0.5 rounded">{g}</span>)}</div>
      </div>
    </div>
  );
}

// ── Stakeholders & Approval (uses store actions) ──
export function StakeholdersApproval({ req }: { req: Requirement }) {
  const approve = useStore((s) => s.approve);
  const createChangeRequest = useStore((s) => s.createChangeRequest);
  const setStatus = useStore((s) => s.setStatus);
  const frozen = req.status === "frozen";
  const approvedCount = req.approvers.filter((a) => a.status === "approved").length;
  const sum = summarizeStakeholders(req.stakeholders);

  return (
    <div className="mt-3 space-y-5">
      {req.stakeholders.length > 0 && (
        <div>
          <h4 className="text-[12px] font-medium mb-3 flex items-center gap-2"><IconUsers /> Multi-Stakeholder Summary ({req.stakeholders.length})</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <SumBox title="✅ เห็นตรงกัน" items={sum.agreements} tone="green" />
            <SumBox title="⚠️ เห็นต่างกัน" items={sum.conflicts} tone="amber" />
            <SumBox title="🔵 ต้องตัดสินใจ" items={sum.decisions} tone="blue" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1"><h4 className="text-[12px] font-medium flex items-center gap-2"><IconUsers /> Multi-Level Approval</h4><span className="text-[11px] text-ir-t3">{approvedCount}/{req.approvers.length} อนุมัติแล้ว</span></div>
        <p className="text-[11px] text-ir-t3 mb-3">ทุกระดับต้องอนุมัติ ก่อนเข้าสู่สถานะ Requirement Freeze</p>
        <div className="space-y-2.5">{req.approvers.map((a) => <ApproverRow key={a.id} a={a} frozen={frozen} onDecide={(d) => approve(req.id, a.id, d)} />)}</div>
        {frozen && (
          <div className="mt-4 flex items-center gap-2.5 bg-ir-accent/10 border border-ir-accent/30 rounded-xl px-4 py-3">
            <IconLock className="text-ir-accent-text" /><span className="text-[12px] text-ir-accent-text">Requirement ถูก Freeze แล้ว แก้ไขผ่าน Change Request เท่านั้น</span>
          </div>
        )}
      </div>

      {/* internal status management */}
      <div>
        <div className="flex items-center justify-between mb-2"><h4 className="text-[12px] font-medium">จัดการสถานะ <span className="text-ir-t3 font-normal">(Internal)</span></h4><span className="text-[11px] text-ir-t3">ปัจจุบัน: <span className="text-ir-accent-text font-medium">{STATUS_LABEL[req.status]}</span></span></div>
        <div className="flex flex-wrap gap-1.5">
          {(["draft", "in_review", "submitted", "approved", "frozen", "change_request", "archived"] as Requirement["status"][]).map((s) => (
            <button key={s} onClick={() => setStatus(req.id, s)} className={`text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${req.status === s ? "bg-ir-accent text-ir-on-accent border-ir-accent" : "bg-ir-card text-ir-t2 border-ir-border hover:border-ir-border-hi"}`}>{STATUS_LABEL[s]}</button>
          ))}
        </div>
      </div>

      {frozen && <ChangeRequest reqId={req.id} onSubmit={createChangeRequest} />}
    </div>
  );
}

function SumBox({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" | "blue" }) {
  const bg = tone === "green" ? "bg-ir-accent/8" : tone === "amber" ? "bg-amber-50" : "bg-blue-50";
  return (
    <div className={`rounded-xl p-3.5 ${bg}`}>
      <div className="text-[11px] font-medium mb-2">{title}</div>
      {items.length ? <ul className="space-y-1">{items.map((i, k) => <li key={k} className="text-[12px] text-ir-t2 leading-snug">{i}</li>)}</ul> : <p className="text-[12px] text-ir-t3">—</p>}
    </div>
  );
}

function ApproverRow({ a, frozen, onDecide }: { a: Approver; frozen: boolean; onDecide: (d: "approved" | "rejected") => void }) {
  const color = a.status === "approved" ? "bg-ir-accent text-white" : a.status === "rejected" ? "bg-ir-error text-white" : "bg-ir-card border border-ir-border text-ir-t3";
  const p = APPROVER_PROFILES[a.role];
  const statusText = a.status === "pending" ? "รอการอนุมัติ" : a.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ";
  const statusCls = a.status === "approved" ? "text-ir-accent-text" : a.status === "rejected" ? "text-ir-error" : "text-ir-t3";
  return (
    <div className="flex items-center gap-3 bg-ir-bg border border-ir-border rounded-xl px-4 py-3">
      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0 ${color}`}>{a.status === "approved" ? <IconCheck width={24} height={24} /> : a.status === "rejected" ? <IconClose width={24} height={24} /> : "○"}</span>
      <div className="flex-1 min-w-0"><div className="text-[13px] font-medium text-ir-t1">{p?.name || a.role}</div><div className="text-[11px] text-ir-t3 truncate">{p ? `${p.title} · ${p.department}` : a.role} · <span className={statusCls}>{statusText}</span></div></div>
      {a.status === "pending" && !frozen && (
        <div className="flex gap-1.5">
          <button onClick={() => onDecide("rejected")} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-ir-border text-ir-t2 hover:border-red-400 hover:text-red-500">ปฏิเสธ</button>
          <button onClick={() => onDecide("approved")} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-ir-accent text-ir-on-accent hover:bg-ir-accent-hi">อนุมัติ</button>
        </div>
      )}
    </div>
  );
}

function ChangeRequest({ reqId, onSubmit }: { reqId: string; onSubmit: (id: string, note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="border-t border-ir-border pt-4">
      <h4 className="text-[12px] font-medium mb-1">Change Request</h4>
      <p className="text-[11px] text-ir-t3 mb-3">สร้าง Change Request เพื่อแก้ไข รีเซ็ตการอนุมัติและสร้าง Version ใหม่</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[12px] px-4 py-2 rounded-lg border border-ir-border text-ir-t2 hover:border-ir-border-hi">+ สร้าง Change Request</button>
      ) : (
        <div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="อธิบายสิ่งที่ต้องการเปลี่ยนแปลง..." className="w-full border border-ir-border rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-ir-accent resize-y mb-3" />
          <div className="flex gap-2">
            <button onClick={() => { if (note.trim()) { onSubmit(reqId, note.trim()); setOpen(false); setNote(""); } }} className="text-[13px] font-semibold px-4 py-2 rounded-lg bg-ir-accent text-ir-on-accent hover:bg-ir-accent-hi transition-colors">ส่ง Change Request</button>
            <button onClick={() => setOpen(false)} className="text-[13px] px-4 py-2 rounded-lg border border-ir-border text-ir-t2">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activity / Version history ──
export function ActivityDetail({ req }: { req: Requirement }) {
  return (
    <div className="mt-3 space-y-5">
      {req.versions.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wide text-ir-t3 mb-3">Version History</h4>
          <div className="space-y-2">{[...req.versions].reverse().map((v) => (
            <div key={v.version} className="flex items-center gap-3 text-[13px]"><span className="bg-ir-accent/10 text-ir-accent-text text-[11px] px-2 py-0.5 rounded-md shrink-0">v{v.version}</span><span className="text-ir-t2 flex-1">{v.note}</span><span className="text-ir-t3 text-xs">{fmtDate(v.at)}</span></div>
          ))}</div>
        </div>
      )}
      <div>
        <h4 className="text-[11px] uppercase tracking-wide text-ir-t3 mb-3">Audit Log</h4>
        <div className="relative pl-1">{[...req.audit].reverse().map((e) => (
          <div key={e.id} className="flex items-start gap-3 mb-3 last:mb-0"><span className="w-2 h-2 rounded-full bg-ir-accent mt-1.5 shrink-0" /><div className="flex-1"><div className="text-[13px] text-ir-t1">{e.action} <span className="text-ir-t3">· {e.actor}</span></div>{e.detail && <div className="text-xs text-ir-t2 mt-0.5">{e.detail}</div>}<div className="text-[11px] text-ir-t3 mt-0.5">{fmtDate(e.at)}</div></div></div>
        ))}</div>
      </div>
    </div>
  );
}

export { approvalSummary };
