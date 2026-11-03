import { DIRECTIONS, LAYOUTS } from "./data";
import type { LayoutDef } from "./data";
import type { Direction, DesignProfile, QuizOption } from "./types";

// ── Intelligent Layout Recommendation (Branding & Realistic Preview) ──
// Ranks layouts by industry fit + selected business goals, returns them with a score.
export interface RankedLayout {
  layout: LayoutDef;
  score: number;
  reason: string;
}
export function recommendLayouts(
  industry: string,
  goals: string[] = [],
  selectedTags: string[] = []
): RankedLayout[] {
  const goalTag: Record<string, string> = {
    ir: "#InvestorRelations",
    esg: "#ESG",
    digital: "#TechForward",
    credibility: "#Premium",
    awareness: "#Storytelling",
    product: "#Modern",
  };
  const wantTags = new Set([...selectedTags, ...goals.map((g) => goalTag[g]).filter(Boolean)]);

  return LAYOUTS.map((layout) => {
    let score = 0;
    const reasons: string[] = [];
    if (layout.bestForIndustry.includes(industry)) {
      score += 4;
      reasons.push(`เหมาะกับ ${industry}`);
    }
    const tagHits = layout.tags.filter((t) => wantTags.has(t)).length;
    if (tagHits) {
      score += tagHits * 2;
      reasons.push("ตรงกับเป้าหมายธุรกิจ");
    }
    return { layout, score, reason: reasons.join(" · ") || "ทางเลือกที่น่าสนใจ" };
  }).sort((a, b) => b.score - a.score);
}

// ── Direction ranking from business discovery (Flow 2) ──
export function rankDirections(
  industry: string,
  companyType: string,
  goals: string[]
): Direction[] {
  const score: Record<string, number> = {};
  DIRECTIONS.forEach((d) => (score[d.id] = 0));

  DIRECTIONS.forEach((d) => {
    if (d.bestFor.includes(industry)) score[d.id] += 3;
  });
  if (companyType.includes("Listed") || companyType.includes("SET")) {
    score["premium-corporate"] += 2;
    score["growth-oriented"] += 2;
  }
  if (companyType.includes("Government")) {
    score["esg-focused"] += 2;
    score["premium-corporate"] += 1;
  }
  if (goals.includes("ir")) {
    score["premium-corporate"] += 2;
    score["growth-oriented"] += 2;
  }
  if (goals.includes("esg")) score["esg-focused"] += 3;
  if (goals.includes("digital")) score["modern-tech"] += 2;
  if (goals.includes("credibility")) score["premium-corporate"] += 2;
  if (goals.includes("lead")) score["growth-oriented"] += 2;
  if (goals.includes("product")) score["modern-tech"] += 1;

  return [...DIRECTIONS].sort((a, b) => score[b.id] - score[a.id]);
}

// ── Smart Discovery Quiz → Design Profile → Direction (UX #1) ──
const EMPTY_PROFILE: DesignProfile = {
  toneCorporate: 0,
  contrastDark: 0,
  densityData: 0,
  energyBold: 0,
};

export function buildProfile(
  answers: { axis: keyof DesignProfile; option: QuizOption }[]
): DesignProfile {
  const p: DesignProfile = { ...EMPTY_PROFILE };
  const counts: Record<string, number> = {};
  answers.forEach(({ axis, option }) => {
    p[axis] += option.value;
    counts[axis] = (counts[axis] || 0) + 1;
  });
  // normalise to -100..100
  (Object.keys(p) as (keyof DesignProfile)[]).forEach((k) => {
    const n = counts[k] || 1;
    p[k] = Math.round((p[k] / n) * 100);
  });
  return p;
}

// ideal axis fingerprint per direction (-100..100)
const DIRECTION_FINGERPRINTS: Record<string, DesignProfile> = {
  "premium-corporate": { toneCorporate: 90, contrastDark: 40, densityData: 20, energyBold: -20 },
  "esg-focused": { toneCorporate: 20, contrastDark: -30, densityData: -60, energyBold: -10 },
  "modern-tech": { toneCorporate: -70, contrastDark: 20, densityData: 30, energyBold: 40 },
  "growth-oriented": { toneCorporate: 30, contrastDark: 80, densityData: 90, energyBold: 80 },
};

// every direction with its match %, closest first
export function rankProfileDirections(p: DesignProfile): { direction: Direction; confidence: number }[] {
  return DIRECTIONS.map((d) => {
    const f = DIRECTION_FINGERPRINTS[d.id];
    const dist = Math.sqrt(
      (f.toneCorporate - p.toneCorporate) ** 2 +
        (f.contrastDark - p.contrastDark) ** 2 +
        (f.densityData - p.densityData) ** 2 +
        (f.energyBold - p.energyBold) ** 2
    );
    // max distance ~ sqrt(4*200^2)=400 → confidence. No floor: a 40% minimum used to tie
    // every weak match at the same figure, so the ranking on the result screen read as noise.
    return { direction: d, confidence: Math.max(0, Math.round(100 - (dist / 400) * 100)) };
  }).sort((a, b) => b.confidence - a.confidence);
}

// map profile to the closest direction
export function profileToDirection(p: DesignProfile): {
  direction: Direction;
  confidence: number;
} {
  return rankProfileDirections(p)[0];
}

// ── Recommended sections by direction + industry (UX #9) ──
export function recommendedSections(directionId: string): string[] {
  const d = DIRECTIONS.find((x) => x.id === directionId);
  return d ? d.sections : ["hero", "about", "services", "contact"];
}

// ── Multi-stakeholder agreement summary (UX #2) ──
export function summarizeStakeholders(
  stakeholders: { preferredDirection?: string; priorities: string[] }[]
): { agreements: string[]; conflicts: string[]; decisions: string[] } {
  const agreements: string[] = [];
  const conflicts: string[] = [];
  const decisions: string[] = [];

  const dirs = stakeholders.map((s) => s.preferredDirection).filter(Boolean) as string[];
  const uniqueDirs = [...new Set(dirs)];
  if (uniqueDirs.length === 1 && dirs.length > 1) {
    agreements.push(`ทุกคนเลือก Direction เดียวกัน: ${uniqueDirs[0]}`);
  } else if (uniqueDirs.length > 1) {
    conflicts.push(`Direction ไม่ตรงกัน: ${uniqueDirs.join(", ")}`);
    decisions.push("ต้องตัดสินใจเลือก Direction หลักร่วมกัน");
  }

  // priority frequency
  const freq: Record<string, number> = {};
  stakeholders.forEach((s) => s.priorities.forEach((p) => (freq[p] = (freq[p] || 0) + 1)));
  const shared = Object.entries(freq).filter(([, c]) => c >= Math.max(2, Math.ceil(stakeholders.length / 2)));
  const single = Object.entries(freq).filter(([, c]) => c === 1);
  shared.forEach(([g]) => agreements.push(`Priority ที่เห็นตรงกัน: ${g}`));
  if (single.length > 2) decisions.push(`มี ${single.length} priorities ที่มีแค่คนเดียวเสนอ ควรพิจารณาร่วมกัน`);

  return { agreements, conflicts, decisions };
}
