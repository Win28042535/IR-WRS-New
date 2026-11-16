"use client";
// Back-to-top button, shared by every long page. It appears once the page has scrolled
// `threshold` px and takes you back smoothly (instantly with reduced motion).
// Pages that scroll an inner panel (flow2 from md up) pass it as `scrollRef`; the window is
// always watched too, so the same button works on phones where the window scrolls.
// On phones it sits above the sticky bottom bars (homepage CTA, step Back/Next) and above
// any bottom dock a step opens (--wrs-bottom-dock).
import { useEffect, useState, type RefObject } from "react";
import { IconArrowRight } from "./icons";

export function BackToTop({ scrollRef, threshold = 700 }: { scrollRef?: RefObject<HTMLElement | null>; threshold?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const panel = scrollRef?.current ?? null;
    const onScroll = () => setShow(Math.max(window.scrollY, panel?.scrollTop ?? 0) > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    panel?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      panel?.removeEventListener("scroll", onScroll);
    };
  }, [scrollRef, threshold]);
  const toTop = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const panel = scrollRef?.current;
    if (panel && panel.scrollTop > 0) panel.scrollTo({ top: 0, behavior });
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior });
  };
  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="กลับขึ้นด้านบน"
      title="กลับขึ้นด้านบน"
      inert={!show}
      className={`fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-md:bottom-[calc(5.75rem+var(--wrs-bottom-dock,0px)+env(safe-area-inset-bottom,0px))] z-40 grid h-12 w-12 place-items-center rounded-full bg-ir-dark text-ir-accent shadow-e3 transition-[opacity,transform,background-color] duration-fast hover:bg-neutral-800 focus-ring motion-reduce:transition-none print:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <IconArrowRight width={24} height={24} className="-rotate-90" />
    </button>
  );
}
