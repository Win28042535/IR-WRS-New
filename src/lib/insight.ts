// Requirement Intelligence auto-summarise what the client selected so sales / design /
// PM understand intent at a glance without re-reading the whole questionnaire.

import type { Requirement, RequirementStatus } from "./types";
import { directionById } from "./data";

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
    { label: "Recommended Layout", value: r.selectedLayout || dir?.layout || "-" },
    { label: "Selected Sections", value: `${r.selectedSections.length} Sections` },
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
