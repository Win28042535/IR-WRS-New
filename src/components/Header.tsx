"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="h-14 ir-frost sticky top-0 z-50 border-b border-black/[0.08] flex items-center justify-between px-5 md:px-6">
      <Link href="/" className="flex items-center gap-3 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irplus-logo.jpg" alt="IR PLUS by efin" width={36} height={36} className="rounded-lg" />
        <div className="border-l border-black/10 pl-3 leading-none">
          <div className="text-ir-t1 text-[13px] font-semibold">Website Requirement System</div>
          <div className="text-ir-t3 text-[11px] mt-0.5">IR PLUS</div>
        </div>
      </Link>
    </header>
  );
}
