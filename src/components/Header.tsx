"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStartFlow } from "@/lib/useStartFlow";

export function Header() {
  const pathname = usePathname();
  return (
    // Page-colored bar with no rule line (production WRS) — the step pill below carries the
    // separation, so a border here would just be a second horizontal line.
    <header className="h-14 sticky top-0 z-50 bg-ir-bg/85 backdrop-blur-md flex items-center justify-between gap-3 px-5 lg:px-7">
      <Link href="/" className="flex min-h-11 min-w-0 items-center gap-3 group rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/irplus-logo.jpg" alt="IR PLUS by efin" width={32} height={32} className="rounded-lg shrink-0" />
        <div className="min-w-0 border-l border-ir-border pl-3 leading-none">
          <div className="truncate text-ir-t1 text-[14px] font-semibold tracking-[-0.01em]">Website Requirement System</div>
          <div className="text-ir-t3 text-[12px] mt-1">IR Plus by efin</div>
        </div>
      </Link>
      {/* Homepage only: the start (or resume) action stays one tap away while reading. */}
      {pathname === "/" && <HeaderStart />}
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
      className="shrink-0 inline-flex h-11 items-center rounded-full bg-ir-dark px-5 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50"
    >
      {flow.inProgress ? "ทำต่อ" : "เริ่มเลย"}
    </button>
  );
}
