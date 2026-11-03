"use client";

import Link from "next/link";

export function Header() {
  return (
    // Page-colored bar with no rule line (production WRS) — the step pill below carries the
    // separation, so a border here would just be a second horizontal line.
    <header className="h-14 sticky top-0 z-50 bg-ir-bg/85 backdrop-blur-md flex items-center justify-between px-5 lg:px-7">
      <Link href="/" className="flex items-center gap-3 group rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irplus-logo.jpg" alt="IR PLUS by efin" width={32} height={32} className="rounded-lg" />
        <div className="border-l border-ir-border pl-3 leading-none">
          <div className="text-ir-t1 text-[14px] font-semibold tracking-[-0.01em]">Website Requirement System</div>
          <div className="text-ir-t3 text-[12px] mt-1">IR Plus by efin</div>
        </div>
      </Link>
    </header>
  );
}
