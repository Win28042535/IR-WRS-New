// AI Memory Engine learns from past requirements, personalizes future flows.
// Pure function: no React, no Zustand, no side-effects.
import type { Requirement } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MemoryItem {
  value: string;
  count: number;
  pct: number;    // 0-1, fraction of past projects where this appeared
}

export interface UserMemory {
  projectCount: number;
  hasMemory:    boolean;

  // Most frequent single-value fields
  topIndustry:       MemoryItem | null;
  topCompanyType:    MemoryItem | null;
  topProjectType:    MemoryItem | null;
  topDirection:      MemoryItem | null;   // direction id
  topDirectionLabel: MemoryItem | null;   // direction readable label
  topLayout:         MemoryItem | null;

  // Items appearing in ≥ 40% of past projects
  frequentMoods:    MemoryItem[];
  frequentGoals:    MemoryItem[];
  frequentSections: MemoryItem[];

  // Auto-fill payload for new flows.
  // Only stable identity fields (industry, companyType, projectType) when
  // they appear consistently across ≥ 2 projects. Never stylistic choices.
  prefill:      Partial<Requirement>;
  prefillCount: number;

  // Pre-built guide messages drop directly into AI Journey Guide
  messages: {
    welcomeBack:   string;  // personalized greeting on return visit
    industryHint:  string;  // "ส่วนใหญ่คุณทำสำหรับ Listed Company ยังใช่ไหม?"
    directionHint: string;  // "มักเลือก Premium Corporate ลองดูอีกครั้งไหม?"
    prefillNotice: string;  // "ระบบเติมข้อมูล 3 รายการจากโปรเจกต์ก่อนให้แล้ว"
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function topValue(vals: string[]): MemoryItem | null {
  const filtered = vals.filter(Boolean);
  if (!filtered.length) return null;
  const counts: Record<string, number> = {};
  filtered.forEach(v => { counts[v] = (counts[v] ?? 0) + 1; });
  const [value, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return { value, count, pct: count / filtered.length };
}

function frequentAcross(arrs: string[][], n: number, threshold = 0.4): MemoryItem[] {
  const counts: Record<string, number> = {};
  arrs.forEach(arr => new Set(arr).forEach(v => { counts[v] = (counts[v] ?? 0) + 1; }));
  return Object.entries(counts)
    .filter(([, c]) => c / n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count, pct: count / n }));
}

// ── Builder ───────────────────────────────────────────────────────────────────

const EMPTY_MESSAGES = { welcomeBack: "", industryHint: "", directionHint: "", prefillNotice: "" };

export const EMPTY_MEMORY: UserMemory = {
  projectCount: 0,
  hasMemory: false,
  topIndustry: null, topCompanyType: null, topProjectType: null,
  topDirection: null, topDirectionLabel: null, topLayout: null,
  frequentMoods: [], frequentGoals: [], frequentSections: [],
  prefill: {}, prefillCount: 0,
  messages: EMPTY_MESSAGES,
};

export function buildUserMemory(requirements: Requirement[]): UserMemory {
  const n = requirements.length;
  if (!n) return EMPTY_MEMORY;

  // ── Frequency analysis ──
  const topIndustry       = topValue(requirements.map(r => r.industry));
  const topCompanyType    = topValue(requirements.map(r => r.companyType));
  const topProjectType    = topValue(requirements.map(r => r.projectType));
  const topDirection      = topValue(requirements.map(r => r.selectedDirection));
  const topDirectionLabel = topValue(requirements.map(r => r.directionLabel));
  const topLayout         = topValue(requirements.map(r => r.selectedLayout));

  const frequentMoods    = frequentAcross(requirements.map(r => r.selectedMoods),    n);
  const frequentGoals    = frequentAcross(requirements.map(r => r.businessGoals),    n);
  const frequentSections = frequentAcross(requirements.map(r => r.selectedSections), n);

  // ── Prefill (stable identity fields, ≥ 2 consistent projects) ──
  const PREFILL_MIN = 2;
  const prefill: Partial<Requirement> = {};
  if (topIndustry    && topIndustry.count    >= PREFILL_MIN) prefill.industry    = topIndustry.value;
  if (topCompanyType && topCompanyType.count >= PREFILL_MIN) prefill.companyType = topCompanyType.value;
  if (topProjectType && topProjectType.count >= PREFILL_MIN) prefill.projectType = topProjectType.value;
  const prefillCount = Object.keys(prefill).length;

  // ── Guide messages ──
  const dLabel = topDirectionLabel?.value ?? topDirection?.value ?? "";

  // Welcome back most informative available variant
  let welcomeBack: string;
  if (prefillCount >= 2) {
    welcomeBack = `ยินดีต้อนรับกลับครับ ระบบเติมข้อมูลจาก ${n} โปรเจกต์ก่อนให้แล้ว`;
  } else if (dLabel && (topDirection?.count ?? 0) >= 2) {
    welcomeBack = `ยินดีต้อนรับกลับครับ ระบบจำได้ว่าคุณชอบ ${dLabel}`;
  } else if (n >= 2) {
    welcomeBack = `ยินดีต้อนรับกลับครับ นี่คือโปรเจกต์ที่ ${n + 1} กับ IR Plus`;
  } else {
    welcomeBack = "ยินดีต้อนรับกลับครับ ระบบจำโปรเจกต์ก่อนหน้าได้แล้ว";
  }

  const industryHint = topIndustry && topIndustry.count >= 2
    ? `ส่วนใหญ่คุณทำเว็บสำหรับ ${topIndustry.value} ยังใช่อยู่ไหมครับ?`
    : "";

  const directionHint = dLabel && (topDirection?.count ?? 0) >= 2
    ? `โปรเจกต์ก่อนๆ คุณมักเลือก ${dLabel} ลองดูอีกครั้งไหมครับ?`
    : "";

  const prefillNotice = prefillCount > 0
    ? `ระบบเติมข้อมูล${prefillCount > 1 ? ` ${prefillCount} รายการ` : ""}จากโปรเจกต์ก่อนให้แล้ว ตรวจสอบและแก้ไขได้`
    : "";

  return {
    projectCount: n,
    hasMemory: true,
    topIndustry, topCompanyType, topProjectType,
    topDirection, topDirectionLabel, topLayout,
    frequentMoods, frequentGoals, frequentSections,
    prefill, prefillCount,
    messages: { welcomeBack, industryHint, directionHint, prefillNotice },
  };
}
