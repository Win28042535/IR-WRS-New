"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Requirement,
  FlowType,
  Stakeholder,
  AuditEntry,
  StakeholderRole,
  Project,
  TimelineEntry,
  TimelineEventType,
  NotebookEntry,
  NotebookCategory,
} from "./types";
import { APPROVAL_LEVELS } from "./data";
import { buildUserMemory } from "./aiMemory";
import { upsertRequirement } from "./supabaseRepo";

// ── id helpers ──
function refId() {
  return "IRP-" + Math.floor(100000 + Math.random() * 900000).toString();
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyDraft(flow: FlowType): Requirement {
  const now = Date.now();
  return {
    id: refId(),
    flow,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    name: "",
    company: "",
    website: "",
    email: "",
    phone: "",
    industry: "",
    companyType: "",
    projectType: "",
    primaryAudience: "",
    secondaryAudiences: [],
    hasCorporateIdentity: "",
    selectedMoods: [],
    selectedDirection: "",
    directionLabel: "",
    businessGoals: [],
    selectedLayout: "",
    selectedSections: [],
    references: [],
    note: "",
    comments: "",
    stakeholders: [],
    approvers: [],
    audit: [],
    versions: [],
    timeline: [],
    notebook: [],
  };
}

interface StoreState {
  draft: Requirement | null;
  requirements: Requirement[];
  projects: Project[];

  createProject: (p: Omit<Project, "id" | "createdAt" | "status">) => string;
  startFlow: (flow: FlowType) => void;
  updateDraft: (patch: Partial<Requirement>) => void;
  addAudit: (actor: string, action: string, detail?: string) => void;
  addTimelineEntry: (entry: Omit<TimelineEntry, "id" | "at">) => void;
  addNotebookEntry: (entry: Omit<NotebookEntry, "id" | "at">) => void;
  addStakeholder: (s: Omit<Stakeholder, "id" | "submittedAt">) => void;
  submit: () => string | null;

  getRequirement: (id: string) => Requirement | undefined;
  approve: (reqId: string, approverId: string, decision: "approved" | "rejected", note?: string) => void;
  freeze: (reqId: string) => void;
  createChangeRequest: (reqId: string, note: string) => void;
  setStatus: (reqId: string, status: Requirement["status"]) => void;
  logAction: (reqId: string, actor: string, action: string, detail?: string) => void;
  hydrateFromRemote: (reqs: Requirement[]) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      draft: null,
      requirements: [],
      projects: [],

      createProject: (p) => {
        const id = "PRJ-" + Math.floor(100000 + Math.random() * 900000).toString();
        const project: Project = { ...p, id, createdAt: Date.now(), status: "invited" };
        set((st) => ({ projects: [project, ...st.projects] }));
        return id;
      },

      startFlow: (flow) => {
        const mem = buildUserMemory(get().requirements);
        const base = emptyDraft(flow);
        set({ draft: mem.prefillCount > 0 ? { ...base, ...mem.prefill } : base });
      },

      updateDraft: (patch) =>
        set((st) =>
          st.draft
            ? { draft: { ...st.draft, ...patch, updatedAt: Date.now() } }
            : st
        ),

      addAudit: (actor, action, detail) =>
        set((st) => {
          if (!st.draft) return st;
          const entry: AuditEntry = { id: uid(), at: Date.now(), actor, action, detail };
          return { draft: { ...st.draft, audit: [...st.draft.audit, entry] } };
        }),

      addTimelineEntry: (entry) =>
        set((st) => {
          if (!st.draft) return st;
          const tl = st.draft.timeline ?? [];
          // Replace existing entry of same type+step (idempotent updates)
          const filtered = tl.filter((e) => !(e.type === entry.type && e.step === entry.step));
          const newEntry: TimelineEntry = { ...entry, id: uid(), at: Date.now() };
          return { draft: { ...st.draft, timeline: [...filtered, newEntry] } };
        }),

      addNotebookEntry: (entry) =>
        set((st) => {
          if (!st.draft) return st;
          const nb = st.draft.notebook ?? [];
          // Replace existing entry of same category+step+title (idempotent)
          const filtered = nb.filter((e) => !(e.category === entry.category && e.step === entry.step && e.title === entry.title));
          const newEntry: NotebookEntry = { ...entry, id: uid(), at: Date.now() };
          return { draft: { ...st.draft, notebook: [...filtered, newEntry] } };
        }),

      addStakeholder: (s) =>
        set((st) => {
          if (!st.draft) return st;
          const stake: Stakeholder = { ...s, id: uid(), submittedAt: Date.now() };
          return {
            draft: {
              ...st.draft,
              status: "collecting",
              stakeholders: [...st.draft.stakeholders, stake],
            },
          };
        }),

      submit: () => {
        const st = get();
        if (!st.draft) return null;
        const now = Date.now();
        // build approver chain from approval levels
        const approvers = APPROVAL_LEVELS.map((role: StakeholderRole) => ({
          id: uid(),
          role,
          name: role,
          status: "pending" as const,
        }));
        const audit: AuditEntry[] = [
          ...st.draft.audit,
          { id: uid(), at: now, actor: st.draft.name || "Client", action: "Requirement Submitted" },
        ];
        const submitted: Requirement = {
          ...st.draft,
          status: "submitted",
          updatedAt: now,
          approvers,
          audit,
          versions: [
            { version: 1, at: now, snapshot: { ...st.draft }, note: "Initial submission" },
          ],
        };
        set({
          requirements: [submitted, ...st.requirements.filter((r) => r.id !== submitted.id)],
          draft: null,
        });
        void upsertRequirement(submitted); // fire-and-forget → Supabase when configured (no-op otherwise)
        return submitted.id;
      },

      getRequirement: (id) => get().requirements.find((r) => r.id === id),

      approve: (reqId, approverId, decision, note) => {
        set((st) => ({
          requirements: st.requirements.map((r) => {
            if (r.id !== reqId) return r;
            const approvers = r.approvers.map((a) =>
              a.id === approverId
                ? { ...a, status: decision, decidedAt: Date.now(), note }
                : a
            );
            const allApproved = approvers.every((a) => a.status === "approved");
            const actor = approvers.find((a) => a.id === approverId)?.role || "Approver";
            const audit = [
              ...r.audit,
              {
                id: uid(),
                at: Date.now(),
                actor,
                action: decision === "approved" ? "Approved" : "Rejected",
                detail: note,
              },
            ];
            return {
              ...r,
              approvers,
              audit,
              status: allApproved ? "frozen" : "in_review",
              frozenAt: allApproved ? Date.now() : r.frozenAt,
            };
          }),
        }));
        const r = get().requirements.find((x) => x.id === reqId);
        if (r) void upsertRequirement(r);
      },

      freeze: (reqId) => {
        set((st) => ({
          requirements: st.requirements.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: "frozen",
                  frozenAt: Date.now(),
                  audit: [
                    ...r.audit,
                    { id: uid(), at: Date.now(), actor: "System", action: "Requirement Frozen" },
                  ],
                }
              : r
          ),
        }));
        const r = get().requirements.find((x) => x.id === reqId);
        if (r) void upsertRequirement(r);
      },

      setStatus: (reqId, status) => {
        set((st) => ({
          requirements: st.requirements.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status,
                  updatedAt: Date.now(),
                  frozenAt: status === "frozen" ? (r.frozenAt ?? Date.now()) : r.frozenAt,
                  audit: [
                    ...r.audit,
                    { id: uid(), at: Date.now(), actor: "Internal", action: `Status → ${status}` },
                  ],
                }
              : r
          ),
        }));
        const r = get().requirements.find((x) => x.id === reqId);
        if (r) void upsertRequirement(r); // sync to Supabase when configured
      },

      createChangeRequest: (reqId, note) => {
        set((st) => ({
          requirements: st.requirements.map((r) => {
            if (r.id !== reqId) return r;
            const nextV = r.versions.length + 1;
            return {
              ...r,
              status: "change_request",
              frozenAt: undefined,
              approvers: r.approvers.map((a) => ({ ...a, status: "pending" as const, decidedAt: undefined })),
              versions: [...r.versions, { version: nextV, at: Date.now(), snapshot: {}, note }],
              audit: [
                ...r.audit,
                { id: uid(), at: Date.now(), actor: "Client", action: `Change Request (v${nextV})`, detail: note },
              ],
            };
          }),
        }));
        const r = get().requirements.find((x) => x.id === reqId);
        if (r) void upsertRequirement(r);
      },

      logAction: (reqId, actor, action, detail) => {
        set((st) => ({
          requirements: st.requirements.map((r) =>
            r.id === reqId
              ? { ...r, updatedAt: Date.now(), audit: [...r.audit, { id: uid(), at: Date.now(), actor, action, detail }] }
              : r
          ),
        }));
        const r = get().requirements.find((x) => x.id === reqId);
        if (r) void upsertRequirement(r);
      },

      hydrateFromRemote: (reqs) => set({ requirements: reqs }),
    }),
    { name: "irp-wrs-store" }
  )
);
