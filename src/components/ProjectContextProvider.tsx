"use client";
import { createContext, useMemo, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { buildProjectContext, type ProjectContext } from "@/lib/projectContext";

// Shared context when the Provider is present, all children share one computed value
// and a single Zustand subscription instead of N independent ones.
export const ProjectCtx = createContext<ProjectContext | null>(null);

export function ProjectContextProvider({ children }: { children: ReactNode }) {
  const draft        = useStore(s => s.draft);
  const requirements = useStore(s => s.requirements);
  const ctx = useMemo(
    () => buildProjectContext(draft ?? {}, requirements),
    [draft, requirements],
  );
  return <ProjectCtx.Provider value={ctx}>{children}</ProjectCtx.Provider>;
}
