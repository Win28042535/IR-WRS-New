"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStartFlow } from "@/lib/useStartFlow";

// The homepage's three sections a visitor may want before starting. On other pages the
// links lead back to the homepage at that section.
const NAV = [
  { id: "steps", label: "วิธีการทำงาน" },
  { id: "example", label: "ตัวอย่างที่จะได้รับ" },
  { id: "contact", label: "ติดต่อทีม" },
];

export function Header() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close the phone menu on Escape / outside tap / route change
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  const href = (id: string) => (home ? `#${id}` : `/#${id}`);

  return (
    // Page-colored bar with no rule line (production WRS) — the step pill below carries the
    // separation, so a border here would just be a second horizontal line.
    <header ref={menuRef} className="h-14 sticky top-0 z-50 bg-ir-bg/85 backdrop-blur-md flex items-center justify-between gap-3 px-5 lg:px-7">
      <Link href="/" className="flex min-h-11 min-w-0 items-center gap-3 group rounded-lg -ml-1.5 px-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irplus-logo.jpg" alt="IR PLUS by efin" width={32} height={32} className="rounded-lg shrink-0" />
        {/* Narrow phones show the logo only, so the menu and start buttons fit. */}
        <div className="min-w-0 border-l border-ir-border pl-3 leading-none max-[479px]:hidden">
          <div className="truncate text-ir-t1 text-[14px] font-semibold tracking-[-0.01em]">Website Requirement System</div>
          <div className="text-ir-t3 text-[13px] mt-1">IR Plus by efin</div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        {/* md and up: the three sections as plain links */}
        <nav aria-label="เมนูหลัก" className="hidden items-center md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={href(n.id)}
              className="inline-flex min-h-11 items-center rounded-full px-3.5 text-[15px] font-medium text-ir-t1 underline-offset-[6px] decoration-ir-select decoration-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* phones: one menu button opening the same three, as large rows */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/70 text-ir-t1 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 md:hidden"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>

        {home && <HeaderStart />}
      </div>

      {open && (
        <nav id="site-menu" aria-label="เมนูหลัก" className="absolute inset-x-0 top-14 border-b border-black/[0.06] bg-ir-bg/95 px-4 pb-4 pt-2 shadow-[0_18px_30px_-20px_rgba(20,22,19,0.35)] backdrop-blur-md md:hidden">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={href(n.id)}
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center justify-between rounded-[14px] px-4 text-[18px] font-semibold text-ir-t1 active:bg-white"
            >
              {n.label}
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ir-t3"><path d="M9 6l6 6-6 6" /></svg>
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeaderStart() {
  const flow = useStartFlow();
  // Starting begins with the company-name field on the homepage, so the header takes you
  // there rather than opening an empty step 1.
  const start = () => {
    const field = document.getElementById("company-input");
    if (!field) return flow.startNew();
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus({ preventScroll: true });
  };
  return (
    <button
      type="button"
      onClick={flow.inProgress ? flow.resume : start}
      className="inline-flex h-11 items-center rounded-full bg-ir-dark px-4 sm:px-5 text-[15px] font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50"
    >
      {flow.inProgress ? "ทำต่อ" : "เริ่มเลย"}
    </button>
  );
}
