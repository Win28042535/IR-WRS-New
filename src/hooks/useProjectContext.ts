import { useContext, useMemo } from "react";
import { useStore } from "@/lib/store";
import { buildProjectContext, type ProjectContext } from "@/lib/projectContext";
import { ProjectCtx } from "@/components/ProjectContextProvider";

export { type ProjectContext } from "@/lib/projectContext";

export function useProjectContext(): ProjectContext {
  const ctxValue     = useContext(ProjectCtx);
  const draft        = useStore(s => s.draft);
  const requirements = useStore(s => s.requirements);
  // When a ProjectContextProvider wraps the tree, use its single shared computation.
  // Fall back to local useMemo for components rendered outside the provider.
  return useMemo(
    () => ctxValue ?? buildProjectContext(draft ?? {}, requirements),
    [ctxValue, draft, requirements],
  );
}
