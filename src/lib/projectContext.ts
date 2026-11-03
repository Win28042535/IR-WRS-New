// Project Context Engine single source of derived truth for all AI features.
// Pure function: no React, no Zustand, no side-effects.
import type { Requirement, DesignProfile } from "./types";
import { BUSINESS_GOALS } from "./data";
import { buildUserMemory, type UserMemory } from "./aiMemory";
import {
  getConfidenceScore,
  getIndustryContextMessage,
  getMoodGuidance,
  getDirectionGuidance,
  getSectionGuidance,
  getBusinessGoalGuidance,
  type ConfidenceResult,
} from "./aiEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectReadiness {
  hasIdentity:   boolean;   // company + industry
  hasMood:       boolean;   // ≥ 2 moods
  hasDirection:  boolean;   // direction selected
  hasGoals:      boolean;   // ≥ 1 business goal
  hasStructure:  boolean;   // ≥ 3 sections
  hasContact:    boolean;   // name + email
}

export interface ProjectSummaries {
  identity:   string;   // "ABC Co. · Finance & Banking"
  direction:  string;   // "Premium Corporate · Professional & Clean"
  goals:      string;   // "IR, Brand Trust, Lead Gen"
  structure:  string;   // "12 sections selected"
}

export interface ProjectGuidance {
  industry:     string;
  mood:         string;
  direction:    string;
  section:      string;
  businessGoal: string;
}

export type ProjectStage = "discovery" | "direction" | "structure" | "confirm";

export interface ProjectContext {
  // ─── Identity ───
  company:     string;
  industry:    string;
  companyType: string;
  projectType: string;
  website:     string;
  name:        string;
  email:       string;

  // ─── Direction ───
  selectedMoods:     string[];
  selectedDirection: string;
  directionLabel:    string;
  selectedLayout:    string;

  // ─── Structure ───
  selectedSections: string[];
  businessGoals:    string[];

  // ─── Design profile (quiz output) ───
  designProfile: Partial<DesignProfile>;

  // ─── Completeness ───
  confidence:    ConfidenceResult;
  missingFields: string[];          // top missing action labels

  // ─── Readiness signals ───
  readiness: ProjectReadiness;

  // ─── Current journey stage ───
  currentStage: ProjectStage;

  // ─── Narrative arrays (for AIReflection pill rows) ───
  knownFacts: string[];   // context the system has established "เรารู้แล้ว"
  decisions:  string[];   // explicit choices the user made "ตัดสินใจแล้ว"

  // ─── Human-readable summaries ───
  summaries: ProjectSummaries;

  // ─── AI guidance strings ───
  guidance: ProjectGuidance;

  // ─── AI prompt context block ───
  // Formatted multiline string for AI features to use as a preamble.
  // Example usage: `${ctx.aiPrompt}\n\nคำถาม: ...`
  aiPrompt: string;

  // ─── Memory (past project patterns) ───
  // Always available EMPTY_MEMORY when no prior requirements exist.
  // Future AI features: use ctx.memory.prefill, ctx.memory.topDirection, etc.
  memory: UserMemory;
}

// ── Step-dependent next steps (not stored in context depends on UI step) ─────
// fromStep mirrors the AIReflection prop: 1=identity done, 2=structure done, 3=preview done, 4=confirm
export function getNextSteps(ctx: ProjectContext, fromStep: number): string[] {
  const steps: string[] = [];
  if (!ctx.selectedMoods.length      && fromStep >= 2) steps.push("Mood & Tone");
  if (!ctx.selectedDirection         && fromStep >= 2) steps.push("Direction");
  if (!ctx.selectedSections.length   && fromStep >= 3) steps.push("Website Sections");
  if (!ctx.selectedLayout            && fromStep >= 3) steps.push("Layout Style");
  if ((!ctx.name || !ctx.email)      && fromStep >= 4) steps.push("ข้อมูลติดต่อ");
  return steps;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildProjectContext(
  draft: Partial<Requirement>,
  requirements: Requirement[] = [],
): ProjectContext {
  // ── Raw fields ──
  const company     = draft.company?.trim()     ?? "";
  const industry    = draft.industry            ?? "";
  const companyType = draft.companyType         ?? "";
  const projectType = draft.projectType         ?? "";
  const website     = draft.website?.trim()     ?? "";
  const name        = draft.name?.trim()        ?? "";
  const email       = draft.email?.trim()       ?? "";

  const selectedMoods     = draft.selectedMoods     ?? [];
  const selectedDirection = draft.selectedDirection  ?? "";
  const directionLabel    = draft.directionLabel     ?? "";
  const selectedLayout    = draft.selectedLayout     ?? "";
  const selectedSections  = draft.selectedSections   ?? [];
  const businessGoals     = draft.businessGoals      ?? [];
  const designProfile     = draft.designProfile      ?? {};

  // ── Completeness ──
  const confidence   = getConfidenceScore(draft);
  const missingFields = confidence.breakdown
    .filter(f => !f.earned)
    .map(f => f.action);

  // ── Readiness ──
  const readiness: ProjectReadiness = {
    hasIdentity:  !!(company && industry),
    hasMood:      selectedMoods.length >= 2,
    hasDirection: !!selectedDirection,
    hasGoals:     businessGoals.length >= 1,
    hasStructure: selectedSections.length >= 3,
    hasContact:   !!(name && email),
  };

  // ── Stage ──
  const currentStage: ProjectStage = !readiness.hasIdentity ? "discovery"
    : !readiness.hasDirection ? "direction"
    : !readiness.hasStructure ? "structure"
    : "confirm";

  // ── Narrative arrays ──
  const knownFacts: string[] = [];
  if (company)     knownFacts.push(company);
  if (industry)    knownFacts.push(industry);
  if (projectType) knownFacts.push(projectType);
  if (companyType) knownFacts.push(companyType);
  if (website)     knownFacts.push("มีเว็บไซต์เดิม");

  const decisions: string[] = [];
  if (selectedMoods.length)
    decisions.push(selectedMoods.length <= 2 ? selectedMoods.join(" · ") : `${selectedMoods.length} Moods`);
  if (selectedDirection && directionLabel)
    decisions.push(`Direction · ${directionLabel}`);
  if (selectedLayout)
    decisions.push(`Layout · ${selectedLayout}`);
  if (selectedSections.length)
    decisions.push(`${selectedSections.length} Sections`);
  if (businessGoals.length) {
    const goalLabels = businessGoals
      .slice(0, 2)
      .map(id => BUSINESS_GOALS.find(g => g.id === id)?.label ?? id);
    const overflow = businessGoals.length > 2 ? ` +${businessGoals.length - 2}` : "";
    decisions.push(goalLabels.join(" · ") + overflow);
  }
  const refCount = (draft.references ?? []).length;
  if (refCount) decisions.push(`${refCount} References`);

  // ── Summaries ──
  const identitySummary = [company, industry]
    .filter(Boolean).join(" · ") || "ยังไม่ได้ระบุข้อมูลบริษัท";

  const directionSummary = [
    directionLabel || selectedDirection,
    ...selectedMoods,
  ].filter(Boolean).join(" · ") || "ยังไม่ได้เลือก Direction";

  const goalsSummary = businessGoals.length
    ? businessGoals.join(", ")
    : "ยังไม่ได้เลือก Business Goals";

  const structureSummary = selectedSections.length
    ? `${selectedSections.length} sections`
    : "ยังไม่ได้เลือก Sections";

  const summaries: ProjectSummaries = {
    identity:  identitySummary,
    direction: directionSummary,
    goals:     goalsSummary,
    structure: structureSummary,
  };

  // ── Guidance (reuse existing pure functions no duplication) ──
  const guidance: ProjectGuidance = {
    industry:     getIndustryContextMessage(industry, projectType),
    mood:         getMoodGuidance(industry),
    direction:    getDirectionGuidance(industry, selectedMoods),
    section:      getSectionGuidance(selectedDirection, industry),
    businessGoal: getBusinessGoalGuidance(industry, projectType),
  };

  // ── AI prompt block ──
  // Terse context lines for AI features. Only include non-empty fields.
  const promptLines: string[] = [];

  if (company) {
    const meta = [companyType, industry, projectType].filter(Boolean).join(" · ");
    promptLines.push(`บริษัท: ${company}${meta ? ` · ${meta}` : ""}`);
  }

  if (directionLabel || selectedDirection) {
    const moodPart = selectedMoods.length ? ` · ${selectedMoods.join(", ")}` : "";
    promptLines.push(`Direction: ${directionLabel || selectedDirection}${moodPart}`);
  }

  if (businessGoals.length) {
    promptLines.push(`Goals: ${businessGoals.join(", ")}`);
  }

  if (selectedSections.length) {
    const preview = selectedSections.slice(0, 4).join(", ");
    const more    = selectedSections.length > 4 ? ` (+${selectedSections.length - 4})` : "";
    promptLines.push(`Structure: ${preview}${more}`);
  }

  promptLines.push(`Confidence: ${confidence.score}/100 · ${confidence.levelLabel}`);

  const aiPrompt = promptLines.join("\n");

  const memory = buildUserMemory(requirements);

  return {
    company, industry, companyType, projectType, website, name, email,
    selectedMoods, selectedDirection, directionLabel, selectedLayout,
    selectedSections, businessGoals, designProfile,
    confidence, missingFields,
    readiness, currentStage,
    knownFacts, decisions,
    summaries, guidance, aiPrompt,
    memory,
  };
}
