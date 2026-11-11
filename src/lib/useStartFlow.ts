"use client";
// Starting vs resuming the client flow, shared by the homepage and the header.
// `startFlow` replaces the draft, so a client with work in progress is offered "ทำต่อ"
// first; starting over is a separate, explicit action.
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { FLOW_STEPS } from "@/lib/data";

const noop = () => () => {};

export function useStartFlow() {
  const router = useRouter();
  const draft = useStore((s) => s.draft);
  const startFlow = useStore((s) => s.startFlow);
  const updateDraft = useStore((s) => s.updateDraft);
  // The draft comes from localStorage, which the server render can't see — only trust it
  // after mount so the first client render matches the server HTML.
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const inProgress =
    mounted && !!draft && draft.status === "draft" && (Boolean(draft.company?.trim()) || (draft.flowStep ?? 1) > 1);
  const step = Math.min(Math.max(draft?.flowStep ?? 1, 1), FLOW_STEPS.length);

  return {
    inProgress,
    step,
    stepName: FLOW_STEPS[step - 1],
    company: draft?.company?.trim() || "",
    resume: () => router.push("/flow2"),
    startNew: () => {
      startFlow("flow2");
      router.push("/flow2");
    },
    /** Start with the first answer already given on the homepage. */
    startWith: (company: string) => {
      startFlow("flow2");
      updateDraft({ company: company.trim() });
      router.push("/flow2");
    },
  };
}
