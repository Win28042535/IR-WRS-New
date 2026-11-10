// ── Core domain types for IR Plus WRS ──

export type FlowType = "flow1" | "flow2";

// Sales-created project (intake) → assigned to a client flow.
export interface Project {
  id: string;            // PRJ-xxxxxx
  company: string;
  industry: string;
  companyType: string;
  pkg: string;           // package
  projectType: string;
  listedStatus: string;  // IPO / Listed (SET/mai) / Non-listed
  flow: FlowType;        // assigned client flow
  clientName?: string;
  clientEmail?: string;
  createdAt: number;
  status: "intake" | "invited" | "in_progress" | "submitted";
  requirementId?: string; // linked Requirement once client submits
}

export type DeviceMode = "desktop" | "tablet" | "mobile";

export type RequirementStatus =
  | "draft"
  | "collecting"      // multi-stakeholder collecting input
  | "submitted"       // pending approval
  | "in_review"
  | "approved"        // all approved, not yet frozen
  | "frozen"          // approved by all levels → locked
  | "change_request"  // reopened for changes
  | "archived";       // closed / parked

export interface ReferenceItem {
  id: string;
  category: "industry" | "competitor" | "trend" | "favorite";
  type: "url" | "image";
  value: string;        // url or data-uri / filename
  label?: string;
  note?: string;         // customer's own comment on why they picked this one
}

export interface SelectionRule {
  min: number;
  max: number;
}

export interface Direction {
  id: string;
  label: string;
  badge: string;
  tagline: string;
  desc: string;
  mood: string[];
  palette: string;
  colors: string[];
  layout: string;
  sections: string[];
  bestFor: string[];
  bg: string;           // css gradient
  tags: string[];       // hashtags
}

export interface SectionDef {
  id: string;
  name: string;
  category: string;
  desc: string;
  popular?: boolean;
  businessPurpose?: string;
  example?: string;
  icon?: string;
}

export interface BusinessGoalDef {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  impact: string;
  comps: string[];
  hidden?: boolean;     // kept for corporate-site projects; not offered in the IR flow
}

// Smart Discovery Quiz (Flow 2)
export interface QuizQuestion {
  id: string;
  topic: string;                // short heading shown above the question, e.g. "บุคลิกแบรนด์"
  question: string;
  axis: keyof DesignProfile;   // which profile dimension this informs
  optionA: QuizOption;
  optionB: QuizOption;
}
export interface QuizOption {
  label: string;
  desc: string;
  value: number;        // contribution to axis (-1 .. +1 scale via weight)
  preview: string;      // visual hint (gradient)
  mock: string;         // ExploreMock id drawn for this choice, e.g. "q1-a"
}

// Accumulated design profile (-100..100 per axis)
export interface DesignProfile {
  toneCorporate: number;   // + corporate / - modern
  contrastDark: number;    // + dark / - light
  densityData: number;     // + data-heavy / - storytelling
  energyBold: number;      // + bold / - minimal
}

export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  email: string;
  // their individual input
  preferredDirection?: string;
  priorities: string[];     // selected goal ids
  comment?: string;
  submittedAt?: number;
}

export type StakeholderRole =
  | "Project Owner"
  | "Marketing"
  | "IR Team"
  | "Department Manager"
  | "Executive"
  | "CEO";

export interface Approver {
  id: string;
  role: StakeholderRole;
  name: string;
  status: "pending" | "approved" | "rejected";
  decidedAt?: number;
  note?: string;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail?: string;
}

export type NotebookCategory = "insight" | "recommendation" | "reasoning" | "gap";

export interface NotebookEntry {
  id: string;
  at: number;
  step: number;
  category: NotebookCategory;
  title: string;
  body: string;
  tags: string[];
  source: "ai" | "system";
}

export type TimelineEventType =
  | "company"
  | "industry"
  | "goal"
  | "quiz"
  | "direction"
  | "section"
  | "layout"
  | "submitted";

export interface TimelineEntry {
  id: string;
  at: number;
  step: number;
  type: TimelineEventType;
  decision: string;   // what was decided
  reasoning: string;  // why AI-generated context
}

export interface RequirementVersion {
  version: number;
  at: number;
  snapshot: Partial<Requirement>;
  note: string;
}

export interface Requirement {
  id: string;            // IRP-xxxxxx
  flow: FlowType;
  flowStep?: number;     // last step reached in the client flow, restored after a reload
  quizPicks?: { questionId: string; letter: "A" | "B" }[]; // Explore answers, in question order
  status: RequirementStatus;
  projectId?: string;    // links back to the Sales-created Project
  createdAt: number;
  updatedAt: number;

  // contact / company
  name: string;
  company: string;
  website?: string;
  email: string;
  phone: string;
  industry: string;
  companyType: string;
  projectType: string;

  // audience who the IR site speaks to (shapes tone, data density, IA)
  // UI presents these as one flat multi-select — no separate "pick primary
  // first" step — but the first audience picked is still tracked as
  // primaryAudience under the hood since downstream AI logic (tone, section
  // priority, density) is written against a single "main" audience.
  primaryAudience?: string;      // audience id
  secondaryAudiences?: string[]; // audience ids

  // corporate identity — does the company have existing brand guidelines
  // (logo, colors, fonts) it wants the AI to reference while designing?
  hasCorporateIdentity?: "yes" | "no" | ""; // "" = not yet answered

  // design decisions
  selectedMoods: string[];
  selectedDirection: string;     // direction id
  directionLabel: string;
  businessGoals: string[];
  selectedLayout: string;
  selectedSections: string[];
  references: ReferenceItem[];
  note: string;
  comments: string;
  designProfile?: DesignProfile;
  timeline: TimelineEntry[];
  notebook: NotebookEntry[];

  // collaboration & governance
  stakeholders: Stakeholder[];
  approvers: Approver[];
  audit: AuditEntry[];
  versions: RequirementVersion[];
  frozenAt?: number;
}
