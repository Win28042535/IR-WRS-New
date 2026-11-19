"use client";
// One loading style for the whole app (audit 19 Nov 2026): a ring that spins in the
// current text colour, and a page loader built from it (mascot, title with pulsing dots,
// an optional line, the ring). Under reduced motion the ring and dots stand still.
//   Spinner      — inside buttons and small places (size 16 / 18 / 20 …)
//   PageLoader   — a page or panel that isn't ready yet
//   (overlay)    — PageLoader with `overlay`: full screen above the page
import { useEffect, useRef, type KeyboardEvent } from "react";
import { AIMascot } from "@/components/AIMascot";

export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  const w = size >= 24 ? 3 : 2;
  return (
    <span
      aria-hidden="true"
      className={`loader-ring inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, borderWidth: w, borderStyle: "solid", borderColor: "color-mix(in srgb, currentColor 22%, transparent)", borderTopColor: "currentColor" }}
    />
  );
}

export function PageLoader({
  title,
  message,
  overlay = false,
  onSkip,
}: {
  title: string;
  message?: string;
  /** full screen above the page (e.g. between Inspiration and the summary) */
  overlay?: boolean;
  /** overlay only: a tap / click / Enter / Esc ends it early */
  onSkip?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (overlay) ref.current?.focus(); }, [overlay]);
  const onKeyDown = (e: KeyboardEvent) => {
    if (onSkip && (e.key === "Enter" || e.key === " " || e.key === "Escape")) { e.preventDefault(); onSkip(); }
  };
  const body = (
    <div className="flex max-w-[320px] flex-col items-center gap-3 px-6 text-center">
      <AIMascot mood="insight" size={44} />
      <p className="mt-1 text-title font-semibold text-ir-t1">
        {title}<span className="loading-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
      </p>
      {message && <p className="text-body leading-relaxed text-ir-t2">{message}</p>}
      <Spinner size={28} className="mt-2 text-ir-accent-text" />
    </div>
  );
  if (!overlay) {
    return <div role="status" aria-live="polite" className="flex min-h-[60vh] items-center justify-center py-16">{body}</div>;
  }
  return (
    <div ref={ref} role="status" aria-live="polite" tabIndex={-1} onClick={onSkip} onKeyDown={onKeyDown}
      className={`sheet-backdrop fixed inset-0 z-[10003] grid place-items-center bg-ir-bg/92 outline-none backdrop-blur-sm ${onSkip ? "cursor-pointer" : ""}`}>
      {body}
    </div>
  );
}
