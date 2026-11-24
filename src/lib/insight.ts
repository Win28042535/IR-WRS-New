// Requirement Intelligence auto-summarise what the client selected so sales / design /
// PM understand intent at a glance without re-reading the whole questionnaire.

import { noteWithLinks } from "@/lib/noteLinks";
import { SOURCE_LABEL, chosenThaiFont } from "./fontCatalog";
import type { Requirement, RequirementStatus } from "./types";
import { audienceIsSuggested, directionById, goalsAreSuggested, keepsCi, siteHostOf } from "./data";
import { isRecommendedHomepage } from "@/components/StructureBuilder";

/** Which steps the client accepted exactly as suggested, so the team can tell an answer the
 *  client chose from one they clicked through. */
export function acceptedSuggestions(r: Requirement): string {
  const kept = [
    audienceIsSuggested(r) && "กลุ่มผู้อ่าน",
    goalsAreSuggested(r) && "เป้าหมาย",
    isRecommendedHomepage(r) && "หน้าแรก",
  ].filter(Boolean);
  if (kept.length === 3) return "รับตามที่แนะนำทุกข้อ (กลุ่มผู้อ่าน · เป้าหมาย · หน้าแรก)";
  return kept.length ? `รับตามที่แนะนำ: ${kept.join(" · ")} · ข้ออื่นลูกค้าปรับเอง` : "ลูกค้าปรับเองทุกข้อ";
}

const IR_SECTIONS = ["financial", "ir-info", "reports", "ir-calendar", "shareholder-info"];
const ESG_SECTIONS: string[] = [];

export const STATUS_LABEL: Record<RequirementStatus, string> = {
  draft: "Draft",
  collecting: "Collecting Input",
  submitted: "Pending Approval",
  in_review: "In Review",
  approved: "Approved",
  frozen: "Frozen",
  change_request: "Change Request",
  archived: "Archived",
};

export function approvalSummary(r: Requirement): string {
  if (r.status === "frozen") return "อนุมัติครบทุกระดับ (Frozen)";
  if (!r.approvers.length) return STATUS_LABEL[r.status];
  const ok = r.approvers.filter((a) => a.status === "approved").length;
  const pendingRole = r.approvers.find((a) => a.status === "pending")?.role;
  return `${ok}/${r.approvers.length} อนุมัติ${pendingRole ? ` · รอ ${pendingRole}` : ""}`;
}

export function requirementSummary(r: Requirement): { label: string; value: string }[] {
  const dir = directionById(r.selectedDirection);
  return [
    { label: "Industry", value: r.industry || "-" },
    { label: "Company Type", value: r.companyType || "-" },
    { label: "Preferred Style", value: dir?.label || r.directionLabel || "-" },
    ...((r.coDeciders ?? []).length ? [{ label: "Co-deciders", value: (r.coDeciders ?? []).map((p) => [p.name, p.position].filter(Boolean).join(" · ")).join(" / ") }] : []),
    { label: "Colours", value: !keepsCi(r) ? ["ใช้ CI ใหม่", noteWithLinks(r.ciNote, r.noteLinks?.ci)].filter(Boolean).join(" · ") : [`ชุดสีเดิม · จาก ${siteHostOf(r.website)}`, noteWithLinks(r.ciKeepNote, r.noteLinks?.ciKeep)].filter(Boolean).join(" · ") },
    ...(!keepsCi(r) && (r.ciAssets ?? []).length ? [{ label: "CI Attachments", value: `${(r.ciAssets ?? []).length} รายการ · ส่วนที่ไม่ได้แนบ ทีมเสนอให้` }] : []),
    { label: "Thai Font", value: (() => { const t = chosenThaiFont(r); return t.source === "website" ? SOURCE_LABEL.website : `${t.family} (${SOURCE_LABEL[t.source]})${r.fontInterest ? ` · ลูกค้าสนใจ ${r.fontInterest}` : ""}`; })() },
    { label: "Recommended Layout", value: r.selectedLayout || dir?.layout || "-" },
    { label: "Selected Sections", value: `${r.selectedSections.length} Sections` },
    { label: "Suggested Answers", value: acceptedSuggestions(r) },
    ...(noteWithLinks(r.structureNote, r.noteLinks?.structure) ? [{ label: "Homepage Note", value: noteWithLinks(r.structureNote, r.noteLinks?.structure) }] : []),
    ...(noteWithLinks(r.inspirationNote, r.noteLinks?.inspiration) ? [{ label: "Inspiration Note", value: noteWithLinks(r.inspirationNote, r.noteLinks?.inspiration) }] : []),
    { label: "Approval Status", value: approvalSummary(r) },
  ];
}

export function designInsight(r: Requirement): string[] {
  const ins: string[] = [];
  const goals = r.businessGoals || [];
  const sec = r.selectedSections || [];
  const dir = r.selectedDirection;

  if (goals.includes("credibility")) ins.push("เน้นภาพลักษณ์องค์กรและความน่าเชื่อถือ");
  if (goals.includes("ir") || sec.some((s) => IR_SECTIONS.includes(s))) ins.push("ให้ความสำคัญกับข้อมูลนักลงทุนสัมพันธ์ (IR)");
  if (goals.includes("esg") || sec.some((s) => ESG_SECTIONS.includes(s))) ins.push("ใส่ใจการสื่อสารด้าน ESG / ความยั่งยืน");
  if (goals.includes("lead")) ins.push("มุ่งเป้า Lead Generation ต้องการ CTA และ Conversion ชัดเจน");
  if (goals.includes("digital") || dir === "modern-tech") ins.push("มีแนวโน้มชอบดีไซน์ Modern / Tech-forward");

  if (["premium-corporate", "growth-oriented"].includes(dir)) ins.push("เลือกแนวทาง Corporate / Institutional มากกว่า Creative");
  if (r.designProfile) {
    const p = r.designProfile;
    if (p.densityData > 30) ins.push("ต้องการนำเสนอด้วยข้อมูล/ตัวเลขเป็นหลัก (Data-driven)");
    if (p.contrastDark > 30) ins.push("ชอบโทนสีเข้ม หนักแน่น");
    else if (p.contrastDark < -30) ins.push("ชอบโทนสว่าง โปร่ง สบายตา");
  }
  if (!ins.length) ins.push("ยังไม่มีสัญญาณชัดเจน แนะนำเก็บข้อมูลเพิ่มผ่าน Smart Quiz");
  return ins;
}

// Suggested Design Direction groups that best fit this requirement.
export function recommendedGroups(r: Requirement): string[] {
  const g = new Set<string>();
  const goals = r.businessGoals || [];
  const dir = r.selectedDirection;
  if (["premium-corporate"].includes(dir) || goals.includes("credibility")) { g.add("Modern Corporate"); g.add("Premium Institutional"); }
  if (["growth-oriented"].includes(dir) || goals.includes("ir")) { g.add("Data-driven & Investor-focused"); g.add("Modern Corporate"); }
  if (dir === "modern-tech" || goals.includes("digital")) g.add("Modern & Innovative");
  if (dir === "esg-focused" || goals.includes("esg")) g.add("Friendly & Accessible");
  if (!g.size) g.add("Modern Corporate");
  return [...g];
}
