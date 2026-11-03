// ── AI Design Blueprint ──
// Derives a structured, downstream-AI-consumable specification from the draft.
// Single source of truth for both the living Blueprint panel and the finale review.

import type { Requirement } from "./types";
import {
  directionById, sectionById, audienceById, BUSINESS_GOALS, IR_AUDIENCES,
} from "./data";

export type BlueprintBlockId =
  | "context"
  | "objectives"
  | "direction"
  | "architecture"
  | "references";

export type BlockStatus = "empty" | "partial" | "complete";

export interface BlueprintField {
  label: string;
  value: string;
}

export interface BlueprintBlock {
  id: BlueprintBlockId;
  label: string;      // Thai label
  en: string;         // English caption
  phase: number;      // step that authors this block (1-5)
  status: BlockStatus;
  summary: string;    // one-line human summary
  fields: BlueprintField[];
}

function goalLabel(id: string): string {
  return BUSINESS_GOALS.find((g) => g.id === id)?.label ?? id;
}

// ── Context (Phase 1 · Understand) ──
function contextBlock(d: Requirement): BlueprintBlock {
  const audiences = [d.primaryAudience, ...(d.secondaryAudiences ?? [])]
    .filter(Boolean)
    .map((id) => audienceById(id as string)?.label ?? id)
    .filter(Boolean) as string[];

  const fields: BlueprintField[] = [];
  if (d.company) fields.push({ label: "องค์กร", value: d.company });
  if (d.industry) fields.push({ label: "อุตสาหกรรม", value: d.industry });
  if (d.companyType) fields.push({ label: "ประเภท", value: d.companyType });
  if (audiences.length) fields.push({ label: "กลุ่มเป้าหมาย", value: audiences.join(", ") });

  const hasCore = !!d.company && !!d.primaryAudience;
  const status: BlockStatus = hasCore ? "complete" : d.company ? "partial" : "empty";

  return {
    id: "context", label: "บริบทองค์กร", en: "Context", phase: 1, status,
    summary: d.company
      ? `${d.company}${d.primaryAudience ? ` · สื่อสารกับ${audienceById(d.primaryAudience)?.label ?? ""}` : ""}`
      : "ยังไม่ได้ระบุองค์กร",
    fields,
  };
}

// ── Objectives (Phase 2 · Define) ──
function objectivesBlock(d: Requirement): BlueprintBlock {
  const goals = (d.businessGoals ?? []).map(goalLabel);
  const status: BlockStatus = goals.length >= 2 ? "complete" : goals.length ? "partial" : "empty";
  return {
    id: "objectives", label: "เป้าหมาย", en: "Objectives", phase: 2, status,
    summary: goals.length ? `${goals.length} เป้าหมายหลัก` : "ยังไม่ได้กำหนดเป้าหมาย",
    fields: goals.map((g, i) => ({ label: `#${i + 1}`, value: g })),
  };
}

// ── Design Direction (Phase 3 · Explore) ──
function directionBlock(d: Requirement): BlueprintBlock {
  const dir = directionById(d.selectedDirection);
  const fields: BlueprintField[] = [];
  if (dir) {
    fields.push({ label: "แนวทาง", value: dir.label });
    fields.push({ label: "โทนสี", value: dir.palette });
    if (dir.layout) fields.push({ label: "เลย์เอาต์", value: dir.layout });
  }
  const status: BlockStatus = dir ? "complete" : "empty";
  return {
    id: "direction", label: "แนวทางดีไซน์", en: "Design Direction", phase: 3, status,
    summary: dir ? `${dir.label} · ${dir.palette}` : "รอผลจาก Explore",
    fields,
  };
}

// ── Information Architecture (Phase 4 · Structure) ──
function architectureBlock(d: Requirement): BlueprintBlock {
  const sections = (d.selectedSections ?? []);
  const names = sections.map((id) => sectionById(id)?.name ?? id);
  const status: BlockStatus = sections.length >= 4 ? "complete" : sections.length ? "partial" : "empty";
  return {
    id: "architecture", label: "โครงสร้างเว็บไซต์", en: "Information Architecture", phase: 4, status,
    summary: sections.length ? `${sections.length} Sections` : "ยังไม่ได้เลือก Section",
    fields: names.map((n, i) => ({ label: `${i + 1}`, value: n })),
  };
}

// ── References (Phase 5 · Specify) ──
function referencesBlock(d: Requirement): BlueprintBlock {
  const refs = d.references ?? [];
  const urls = refs.filter((r) => r.type === "url").length;
  const imgs = refs.filter((r) => r.type === "image").length;
  const status: BlockStatus = refs.length ? "complete" : "empty";
  const parts: string[] = [];
  if (urls) parts.push(`${urls} ลิงก์`);
  if (imgs) parts.push(`${imgs} รูป`);
  return {
    id: "references", label: "แรงบันดาลใจ", en: "References", phase: 6, status,
    summary: parts.length ? parts.join(" · ") : "ยังไม่ได้แนบอ้างอิง",
    fields: [
      ...(urls ? [{ label: "ลิงก์", value: `${urls} รายการ` }] : []),
      ...(imgs ? [{ label: "รูปภาพ", value: `${imgs} รายการ` }] : []),
    ],
  };
}

export function buildBlueprint(d: Requirement | null): BlueprintBlock[] {
  if (!d) return [];
  return [
    contextBlock(d),
    objectivesBlock(d),
    directionBlock(d),
    architectureBlock(d),
    referencesBlock(d),
  ];
}

// Completeness 0-100 references are optional (weighted lower).
export function blueprintCompleteness(d: Requirement | null): number {
  if (!d) return 0;
  const blocks = buildBlueprint(d);
  const weights: Record<BlueprintBlockId, number> = {
    context: 25, objectives: 20, direction: 25, architecture: 20, references: 10,
  };
  let score = 0;
  for (const b of blocks) {
    const w = weights[b.id];
    if (b.status === "complete") score += w;
    else if (b.status === "partial") score += w * 0.5;
  }
  return Math.round(score);
}

export { IR_AUDIENCES };
