"use client";
// Saves the summary sheet as PDF or PNG straight away (no print dialog). The button reports
// the result itself: spinner + "กำลังบันทึก…", then a check + "บันทึกแล้ว" for a few seconds.
// `source` is the draft (deliver step) or the submitted requirement (page after sending);
// `refNo` is given only after sending, and is stamped at the foot of the file.
import { useEffect, useRef, useState } from "react";
import { IconCheck } from "@/components/icons";
import { Spinner } from "@/components/Loader";
import { BODY_FONT, sheetData } from "@/lib/sheetData";
import { chosenThaiFont, previewFamily } from "@/lib/fontCatalog";
import { useGoogleFont } from "@/lib/useGoogleFont";
import type { SheetView } from "@/lib/moodboardExport";

// `view` = which summary view the file draws (the one on screen): document or moodboard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SaveSheetButton({ source, kind, refNo, view = "doc", className = "" }: { source: any; kind: "pdf" | "png"; refNo?: string; view?: SheetView; className?: string }) {
  // a font picked from the catalog has to be loaded on this page too, or the sheet falls back
  const pick = chosenThaiFont(source);
  useGoogleFont(pick.source === "selected" ? previewFamily(pick.family) : undefined, [400, 500, 600, 700]);
  useGoogleFont(BODY_FONT, [400, 600]); // the moodboard's body font, drawn into the file
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const name = kind === "pdf" ? "PDF" : "PNG";
  const save = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      const { saveMoodboard } = await import("@/lib/moodboardExport");
      await saveMoodboard({ ...sheetData(source), refNo }, kind, view);
      setState("done");
    } catch {
      setState("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 3000);
  };
  const label = state === "busy" ? "กำลังบันทึก…" : state === "done" ? "บันทึกแล้ว" : state === "error" ? "บันทึกไม่สำเร็จ ลองอีกครั้ง" : `บันทึก ${name}`;
  return (
    <button type="button" onClick={save} aria-busy={state === "busy"} aria-live="polite"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 ${className} text-body font-semibold transition-colors focus-ring ${
        state === "done" ? "border-ir-select bg-primary-50 text-ir-t1"
          : state === "error" ? "border-red-300 bg-red-50 text-red-700"
          : "border-ir-border bg-white text-ir-t1 hover:border-ir-border-hi"
      } ${state === "busy" ? "cursor-wait" : ""}`}>
      {state === "busy" ? (
        <Spinner size={18} />
      ) : state === "done" ? (
        <IconCheck width={18} height={18} className="text-ir-accent-text" />
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
      )}
      {label}
    </button>
  );
}
