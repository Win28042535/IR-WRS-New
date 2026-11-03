"use client";

import { type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { IconCheck, IconArrowRight } from "@/components/icons";
import type { FlowType } from "@/lib/types";

const FLOW2 = {
  id: "flow2" as FlowType,
  title: "สร้าง Requirement เว็บไซต์ IR ที่เหมาะกับคุณ",
  desc: "ตอบคำถามเกี่ยวกับองค์กร เพื่อให้ AI วิเคราะห์และสร้าง Requirement",
  benefits: [
    "Smart Discovery Quiz ถามเฉพาะสิ่งที่จำเป็น",
    "AI วิเคราะห์บริบทองค์กรและแนะนำ Direction",
    "สร้าง Requirement Summary พร้อมส่งทีม",
  ],
};

// Compact reassurance strip — each point is a short label the user scans, not reads.
// Green reserved for one point so the row reads as varied, not a brand-color wash.
const BENEFITS = [
  { title: "เข้าใจตรงกันตั้งแต่ต้น", color: "#5B7FDE" },
  { title: "เห็นภาพก่อนออกแบบจริง", color: "#E0A23B" },
  { title: "ลดการแก้ไขที่ไม่จำเป็น", color: "#D9765B" },
  { title: "ส่งมอบได้เร็วและแม่นยำ", color: "#AACC00" },
];

// ── Benefit icons four distinct purposes, each takes its own color ──
function IconBullseye({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" width={24} height={24} aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.25" />
      <circle cx="9" cy="9" r="4"   stroke={color} strokeWidth="1.25" />
      <circle cx="9" cy="9" r="1.5" fill={color} />
    </svg>
  );
}
function IconMonitor({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" width={24} height={24} aria-hidden="true">
      <rect x="1" y="2.5" width="16" height="10.5" rx="1.75" stroke={color} strokeWidth="1.25" />
      <path d="M6.5 15.5h5M9 13v2.5" stroke={color} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="9" cy="7.75" r="2.25" stroke={color} strokeWidth="1.1" />
      <circle cx="9" cy="7.75" r="0.9" fill={color} />
    </svg>
  );
}
function IconApprove({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" width={24} height={24} aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.25" />
      <path d="M5.5 9.25l2.25 2.25L12.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLightning({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" width={24} height={24} aria-hidden="true">
      <path d="M10.25 2L3.5 9.75H8.5L6.5 16 14.5 8h-5L10.25 2Z"
        stroke={color} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

const BENEFIT_ICONS = [IconBullseye, IconMonitor, IconApprove, IconLightning];

// ── Homepage illustration: Moodboard summary (primary) + AI guide (secondary) ──
// A clean bento-style summary board the actual artifact the flow produces is the
// dominant visual. Colors are varied (navy, sky, amber, coral) rather than all-green, so
// the palette reads like a real design summary, not a brand-color wash. A small AI guide
// chip sits secondary, bottom-right, hinting at guidance without competing for attention.
function GuidedPathIllustration() {
  return (
    <svg viewBox="0 0 480 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">

      {/* Page background neutral */}
      <rect width={480} height={260} fill="#F4F5F7" />

      {/* ── LEFT COLUMN (x=16, w=152) ── */}

      {/* A1: Personality — dark tile, top half */}
      <rect x={16} y={16} width={152} height={108} rx={14} fill="#1B1E27" />
      <rect x={30} y={32} width={58} height={5} rx={2.5} fill="#FFF" fillOpacity={0.35} />
      <rect x={30} y={47} width={116} height={9} rx={4} fill="#FFF" fillOpacity={0.9} />
      <rect x={30} y={62} width={92} height={9} rx={4} fill="#FFF" fillOpacity={0.9} />
      <rect x={30} y={77} width={68} height={9} rx={4} fill="#FFF" fillOpacity={0.9} />
      <circle cx={36} cy={111} r={6} fill="#AACC00" />
      <circle cx={52} cy={111} r={6} fill="#5B7FDE" />
      <circle cx={68} cy={111} r={6} fill="#E0A23B" />
      <circle cx={84} cy={111} r={6} fill="#D9765B" />

      {/* A2: Palette — light tile, bottom half */}
      <rect x={16} y={132} width={152} height={112} rx={14} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <rect x={30} y={148} width={48} height={5} rx={2.5} fill="#8A8F99" />
      {/* 5 colour swatches — uniform circles, evenly spaced */}
      <circle cx={40} cy={174} r={10} fill="#5B7FDE" />
      <circle cx={63} cy={174} r={10} fill="#E0A23B" />
      <circle cx={86} cy={174} r={10} fill="#D9765B" />
      <circle cx={109} cy={174} r={10} fill="#7BAE7F" />
      <circle cx={132} cy={174} r={10} fill="#AACC00" />
      <rect x={30} y={198} width={80} height={7} rx={3} fill="#1B1E27" fillOpacity={0.72} />
      <rect x={30} y={211} width={56} height={5} rx={2.5} fill="#1B1E27" fillOpacity={0.2} />

      {/* ── MIDDLE COLUMN (x=176, w=152) ── */}

      {/* B1: Direction tile */}
      <rect x={176} y={16} width={152} height={72} rx={14} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <rect x={192} y={30} width={56} height={5} rx={2.5} fill="#8A8F99" />
      <rect x={192} y={44} width={100} height={9} rx={4} fill="#1B1E27" fillOpacity={0.8} />
      <rect x={192} y={58} width={72} height={6} rx={3} fill="#1B1E27" fillOpacity={0.22} />

      {/* B2: Tone tile */}
      <rect x={176} y={96} width={152} height={68} rx={14} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <rect x={192} y={110} width={48} height={5} rx={2.5} fill="#8A8F99" />
      <rect x={192} y={122} width={58} height={20} rx={10} fill="#EDEFF3" />
      <rect x={258} y={122} width={50} height={20} rx={10} fill="#EDEFF3" />

      {/* B3: Sections row tile */}
      <rect x={176} y={172} width={152} height={72} rx={14} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <rect x={192} y={186} width={64} height={5} rx={2.5} fill="#8A8F99" />
      <rect x={192} y={200} width={46} height={18} rx={9} fill="#EDEFF3" />
      <rect x={246} y={200} width={46} height={18} rx={9} fill="#EDEFF3" />
      <rect x={300} y={200} width={16} height={18} rx={8} fill="#EDEFF3" />

      {/* ── RIGHT COLUMN (x=336, w=128) ── */}

      {/* C1: Font specimen tile */}
      <rect x={336} y={16} width={128} height={100} rx={14} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <rect x={352} y={30} width={36} height={5} rx={2.5} fill="#8A8F99" />
      <text x={352} y={88} fontSize="38" fontWeight="600" fill="#2B2F3A" fontFamily="system-ui, sans-serif">Aa</text>

      {/* C2: Audience + Count tiles side-by-side */}
      <rect x={336} y={124} width={58} height={48} rx={12} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <circle cx={365} cy={141} r={10} fill="#EDEFF3" />
      <rect x={344} y={157} width={40} height={4} rx={2} fill="#8A8F99" />

      <rect x={402} y={124} width={62} height={48} rx={12} fill="#FFFFFF" stroke="#E6E7EA" strokeWidth={1} />
      <text x={413} y={149} fontSize="20" fontWeight="700" fill="#5B7FDE" fontFamily="system-ui, sans-serif">9</text>
      <rect x={430} y={136} width={22} height={4} rx={2} fill="#8A8F99" />
      <rect x={430} y={144} width={16} height={4} rx={2} fill="#8A8F99" />

      {/* C3: AI Guide tile */}
      <rect x={336} y={180} width={128} height={64} rx={14} fill="#AACC00" fillOpacity={0.08} stroke="#AACC00" strokeOpacity={0.25} strokeWidth={1} />
      <rect x={352} y={193} width={26} height={26} rx={8} fill="#AACC00" />
      <circle cx={360} cy={205} r={1.8} fill="#1B1E27" fillOpacity={0.7} />
      <circle cx={369} cy={205} r={1.8} fill="#1B1E27" fillOpacity={0.7} />
      <path d="M 358 212 Q 364.5 216 371 212" stroke="#1B1E27" strokeWidth={1.3} fill="none"
        strokeLinecap="round" strokeOpacity={0.55} />
      <rect x={388} y={196} width={58} height={6} rx={3} fill="#2B3A00" fillOpacity={0.45} />
      <rect x={388} y={208} width={42} height={5} rx={2.5} fill="#2B3A00" fillOpacity={0.25} />

    </svg>
  );
}

export default function Landing() {
  const router = useRouter();
  const startFlow = useStore((s) => s.startFlow);

  const begin = (flow: FlowType) => {
    startFlow(flow);
    router.push(`/${flow}`);
  };

  return (
    <div className="max-w-xl lg:max-w-5xl mx-auto px-5 sm:px-6 py-6 md:py-10 lg:py-8 xl:py-10">

      {/* ── Hero — condensed on mobile/tablet so the CTA below still lands in the
           first screen; full-size from lg up where there's room to spare ── */}
      <div className="text-center mb-4 md:mb-8 lg:mb-7 ir-fade-up" style={{ animationDelay: "0ms" }}>
        <span className="hidden md:inline-flex items-center gap-2 bg-ir-accent/10 text-ir-accent text-xs px-3 py-1.5 rounded-full mb-4">
          IR Plus · Website Requirement System
        </span>
        <h1 className="text-[20px] md:text-[28px] font-semibold text-ir-t1 mb-1.5 md:mb-3 leading-tight" style={{ textWrap: "balance" } as CSSProperties}>
          กำหนด Requirement เว็บไซต์ IR ที่ตรงกับองค์กรของคุณ
        </h1>
        <p className="hidden md:block text-[16px] text-ir-t2 leading-relaxed">
          ตอบคำถามสั้นๆ AI จะวิเคราะห์และสรุป Requirement สำหรับส่งทีม IR Plus
        </p>
      </div>

      {/* ── Main card: Flow 2 horizontal split on large screens so the full card
           fits without scrolling on 1440–1920px displays. Below md the moodboard
           preview stays (it is what makes the card feel like a design tool) but is
           reduced to a compact band and the hero/content are tightened so the CTA
           still lands within the first screen without scrolling. ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => begin(FLOW2.id)}
        onKeyDown={(e) => e.key === "Enter" && begin(FLOW2.id)}
        aria-label={FLOW2.title}
        className={[
          "group cursor-pointer rounded-2xl md:rounded-[22px] overflow-hidden",
          "bg-ir-card border border-ir-border",
          "ir-shadow hover:ir-shadow-lg",
          "transition-[transform,box-shadow] duration-300",
          "hover:-translate-y-1 hover:border-ir-accent/40",
          "flex flex-col lg:flex-row lg:items-stretch",
          "ir-fade-up",
        ].join(" ")}
        style={{ animationDelay: "80ms" }}
      >
        {/* Moodboard preview — compact band on mobile (the SVG's own #F4F5F7 canvas
            matches this container so the letterboxing blends seamlessly), taller on
            tablet, full-height side panel on desktop. */}
        <div
          className="relative h-[124px] md:h-[220px] lg:h-auto lg:w-[42%] overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-ir-border"
          style={{ background: "#F4F5F7" }}
        >
          <GuidedPathIllustration />
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8 flex flex-col flex-1 lg:justify-center">
          <h2 className="text-[17px] md:text-[24px] font-semibold text-ir-t1 leading-snug mb-1.5 md:mb-2" style={{ textWrap: "balance" } as CSSProperties}>
            {FLOW2.title}
          </h2>
          <p className="text-[13px] md:text-[15px] text-ir-t2 leading-relaxed mb-3 md:mb-5">
            {FLOW2.desc}
          </p>

          <ul className="hidden sm:block space-y-2 mb-6">
            {FLOW2.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-[14px] text-ir-t1">
                <span className="w-[18px] h-[18px] rounded-full bg-ir-accent/15 text-ir-accent-text flex items-center justify-center shrink-0">
                  <IconCheck width={9} height={9} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* Primary action — full-width pill on mobile (maximum discoverability,
              no ambiguity about the next step), auto-width anchored bottom-left
              from sm up where the card has room to spare. */}
          <div className="mt-auto pt-3 sm:pt-4 border-t border-ir-border">
            <span
              className={[
                "flex sm:inline-flex items-center justify-center gap-2",
                "rounded-full pl-5 pr-4 py-2.5",
                "bg-ir-accent text-ir-on-accent",
                "text-[14px] font-semibold",
                "shadow-[0_2px_10px_rgba(170,204,0,0.32)]",
                "transition-all duration-300",
                "group-hover:shadow-[0_4px_16px_rgba(170,204,0,0.42)] group-hover:-translate-y-0.5",
              ].join(" ")}
            >
              เริ่มต้นกำหนด Requirement
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <IconArrowRight width={13} height={13} />
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Why section — light reassurance strip, secondary to the CTA ── */}
      <div className="mt-6 md:mt-10 lg:mt-9 ir-fade-up" style={{ animationDelay: "160ms" }}>
        <p className="text-center text-[13px] font-medium text-ir-t3 mb-4">
          ทำไมต้องกำหนด Requirement ก่อนเริ่มออกแบบ
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3">
          {BENEFITS.map((b, i) => {
            const Icon = BENEFIT_ICONS[i];
            return (
              <div
                key={b.title}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border bg-ir-card"
                style={{ borderColor: "var(--color-ir-border)" }}
              >
                <Icon color={b.color} />
                <span className="text-[13px] font-medium text-ir-t2 whitespace-nowrap">
                  {b.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
