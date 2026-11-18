// ── Explore quiz mocks ──
// Flat UI illustrations of an IR page, one per quiz choice (q1-a … q5-b). They replace
// the photographic renders: simple enough to judge at a glance, and each A/B pair differs
// only in the one thing its question asks about.
//
// Every mock shows the SAME page — บริษัท ABC's "ข้อมูลสำคัญทางการเงิน" under the
// นักลงทุน menu, with the same figures (FIN below). Only the treatment changes: tone,
// colour, story vs data, density, expression. So a client compares how one page could
// look, never two different pages (user test feedback: A and B read as different menus).
//
// Drawn inline (not as <img src=".svg">) so the text uses the page's IBM Plex Sans Thai —
// an SVG loaded as an image can't reach page fonts and would fall back per device.
//
// Shared construction: 1200×677 canvas (same 16:9 frame as the photos), 72px margins,
// 12 columns of 66px with 24px gutters (column i starts at x = 72 + 90·i, an n-column
// span is 90·n − 24 wide), vertical rhythm in 8px steps.

import type { ReactNode } from "react";
import { SAMPLE_FIN } from "@/lib/data";

const W = 1200;
const H = 677;
const col = (i: number) => 72 + 90 * i;
const span = (n: number) => 90 * n - 24;
const RIGHT = col(11) + span(1);
const FONT = "var(--font-plex), 'IBM Plex Sans Thai', 'Leelawadee UI', sans-serif";

type Theme = {
  bg: string; surface: string; ink: string; muted: string; line: string;
  accent: string; onAccent: string; soft: string; r: number; btnR: number;
};

const LIGHT: Theme = {
  bg: "#FFFFFF", surface: "#F3F5F8", ink: "#0F1B2D", muted: "#6B7685", line: "#E3E7ED",
  accent: "#2459D6", onAccent: "#FFFFFF", soft: "#DCE6FA", r: 12, btnR: 8,
};
const DARK: Theme = {
  bg: "#0B1424", surface: "#16223A", ink: "#F3F6FB", muted: "#9AA6BA", line: "#24324D",
  accent: "#4C82FF", onAccent: "#FFFFFF", soft: "#1E3260", r: 12, btnR: 8,
};
// q1 Approachable — warm and rounded, but a corporate site: one muted accent, no
// illustrations or emoji (user feedback: the earlier version read as too playful).
const WARM: Theme = {
  bg: "#FBF8F4", surface: "#F3ECE4", ink: "#2A2420", muted: "#776B60", line: "#E8DED3",
  accent: "#B85A32", onAccent: "#FFFFFF", soft: "#EADBCD", r: 20, btnR: 999,
};
const FORMAL: Theme = { // q1 Formal — navy, square, restrained
  bg: "#FFFFFF", surface: "#F2F4F7", ink: "#0B1F3A", muted: "#5F6B7A", line: "#D9DEE5",
  accent: "#0B1F3A", onAccent: "#FFFFFF", soft: "#E3E8EF", r: 0, btnR: 0,
};
const GOLD = "#B8963E";

// ── the one page every mock shows ───────────────────────────────────────────
// Figures come from SAMPLE_FIN (shared with the Deliver summary's samples).
const S = SAMPLE_FIN;
const FIN = {
  eyebrow: "นักลงทุนสัมพันธ์",
  title: "ข้อมูลสำคัญทางการเงิน",
  year: `ปี ${S.year}`,
  kpis: [
    { k: "รายได้รวม", v: S.revenue, u: "ล้านบาท", d: S.revenueGrowth },
    { k: "กำไรสุทธิ", v: S.netProfit, u: "ล้านบาท", d: S.profitGrowth },
    { k: "ROE", v: S.roe, u: `ปี ${S.year}`, d: "+0.8" },
    { k: "ปันผล/หุ้น", v: S.dividend, u: "บาท", d: "+0.15" },
  ],
  bars: S.revenueTrend,
  years: S.trendYears,
  ratios: [["อัตรากำไรสุทธิ", S.netMargin], ["EPS (บาท)", S.eps], ["D/E (เท่า)", S.de], ["P/E (เท่า)", S.pe]],
  links: ["งบการเงิน", "รายงานประจำปี", "ปฏิทินนักลงทุน"],
};

// ── primitives ─────────────────────────────────────────────────────────────
const Txt = ({ x, y, size, weight = 400, fill, children, anchor, ls }: {
  x: number; y: number; size: number; weight?: number; fill: string; children: ReactNode;
  anchor?: "start" | "middle" | "end"; ls?: number;
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} letterSpacing={ls}>
    {children}
  </text>
);

/** Grey text placeholder lines — copy that's there but not the point. */
const Lines = ({ x, y, w, n, t, gap = 16, h = 8 }: { x: number; y: number; w: number; n: number; t: Theme; gap?: number; h?: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? w * 0.62 : w} height={h} rx={h / 2} fill={t.line} />
    ))}
  </>
);

/** Image slot — a soft two-tone landscape instead of a photo. */
const Pic = ({ x, y, w, h, t, r = t.r, id }: { x: number; y: number; w: number; h: number; t: Theme; r?: number; id: string }) => (
  <g>
    <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={r} /></clipPath>
    <g clipPath={`url(#${id})`}>
      <rect x={x} y={y} width={w} height={h} fill={t.soft} />
      <circle cx={x + w * 0.74} cy={y + h * 0.3} r={Math.min(w, h) * 0.11} fill={t.bg} opacity={0.75} />
      <path d={`M${x} ${y + h * 0.78} L${x + w * 0.3} ${y + h * 0.48} L${x + w * 0.52} ${y + h * 0.68} L${x + w * 0.72} ${y + h * 0.5} L${x + w} ${y + h * 0.74} V${y + h} H${x} Z`} fill={t.accent} opacity={0.35} />
      <path d={`M${x} ${y + h * 0.9} L${x + w * 0.4} ${y + h * 0.66} L${x + w} ${y + h * 0.92} V${y + h} H${x} Z`} fill={t.accent} opacity={0.55} />
    </g>
  </g>
);

const Btn = ({ x, y, w, label, t, ghost = false, h = 44 }: { x: number; y: number; w: number; label: string; t: Theme; ghost?: boolean; h?: number }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={Math.min(t.btnR, h / 2)} fill={ghost ? "none" : t.accent} stroke={ghost ? t.ink : "none"} strokeOpacity={0.25} />
    <Txt x={x + w / 2} y={y + h / 2 + 5} size={15} weight={600} fill={ghost ? t.ink : t.onAccent} anchor="middle">{label}</Txt>
  </g>
);

/** Five years of revenue, the last bar in the accent colour. */
const Bars = ({ x, y, w, h, t, labels = true, gap = 0.45 }: { x: number; y: number; w: number; h: number; t: Theme; labels?: boolean; gap?: number }) => {
  const slot = w / FIN.bars.length;
  const bw = slot * (1 - gap);
  return (
    <>
      {FIN.bars.map((b, i) => (
        <g key={i}>
          <rect x={x + i * slot + (slot - bw) / 2} y={y + h * (1 - b)} width={bw} height={h * b} rx={Math.min(t.r, 6)} fill={i === FIN.bars.length - 1 ? t.accent : t.soft} />
          {labels && <Txt x={x + i * slot + slot / 2} y={y + h + 22} size={13} fill={t.muted} anchor="middle">{FIN.years[i]}</Txt>}
        </g>
      ))}
    </>
  );
};

/** Site header: logo, four nav items (นักลงทุน is the page shown), contact button. */
// Nav labels are centred on even 112px steps so the gaps read evenly whatever each
// label's length.
const NAV = ["เกี่ยวกับเรา", "นักลงทุน", "ความยั่งยืน", "ข่าวสาร"];
const Header = ({ t, onBand = false }: { t: Theme; onBand?: boolean }) => (
  <g>
    <rect x={col(0)} y={26} width={28} height={28} rx={Math.min(t.r, 8)} fill={t.accent} />
    <Txt x={col(0) + 40} y={46} size={18} weight={700} fill={t.ink}>{S.company}</Txt>
    {NAV.map((n, i) => {
      const cx = col(6) + 20 + i * 112;
      const on = n === "นักลงทุน";
      return (
        <g key={n}>
          <Txt x={cx} y={46} size={14} weight={on ? 700 : 400} fill={on ? t.ink : t.muted} anchor="middle">{n}</Txt>
          {on && <rect x={cx - 26} y={58} width={52} height={3} rx={1.5} fill={onBand ? GOLD : t.accent} />}
        </g>
      );
    })}
    <Btn x={col(11) - 42} y={20} w={span(1) + 42} h={40} label="ติดต่อ" t={t} />
    <line x1={col(0)} y1={80} x2={RIGHT} y2={80} stroke={t.line} />
  </g>
);

const Frame = ({ t, children, label }: { t: Theme; children: ReactNode; label: string }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={label} style={{ fontFamily: FONT, display: "block" }} preserveAspectRatio="xMidYMid slice">
    <rect width={W} height={H} fill={t.bg} />
    {children}
  </svg>
);

// ── q2 · light vs dark — the same page in both palettes ─────────────────────
const StandardHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={132} size={14} weight={600} fill={t.accent} ls={1}>{FIN.eyebrow}</Txt>
    <Txt x={col(0)} y={184} size={42} weight={700} fill={t.ink}>{FIN.title}</Txt>
    <Txt x={col(0)} y={218} size={18} fill={t.muted}>ผลการดำเนินงาน{FIN.year}</Txt>
    {FIN.kpis.map((m, i) => (
      <g key={m.k}>
        <rect x={col(i * 3)} y={248} width={span(3)} height={128} rx={t.r} fill={t.surface} />
        <Txt x={col(i * 3) + 20} y={280} size={14} fill={t.muted}>{m.k}</Txt>
        <Txt x={col(i * 3) + 20} y={330} size={36} weight={700} fill={t.ink}>{m.v}</Txt>
        <Txt x={col(i * 3) + 20} y={358} size={13} fill={t.muted}>{m.u}</Txt>
      </g>
    ))}
    <rect x={col(0)} y={400} width={span(7)} height={232} rx={t.r} fill={t.surface} />
    <Txt x={col(0) + 24} y={436} size={18} weight={600} fill={t.ink}>รายได้ 5 ปีย้อนหลัง</Txt>
    <Bars x={col(0) + 32} y={456} w={span(7) - 64} h={136} t={t} />
    {FIN.links.map((l, i) => (
      <g key={l}>
        <rect x={col(7) + 24} y={400 + i * 80} width={span(5) - 24} height={68} rx={t.r} fill={t.surface} />
        <Txt x={col(7) + 48} y={440 + i * 80} size={18} weight={600} fill={t.ink}>{l}</Txt>
        <Txt x={RIGHT - 24} y={441 + i * 80} size={20} weight={600} fill={t.accent} anchor="end">→</Txt>
      </g>
    ))}
  </>
);

// ── q1 · brand personality — tone of voice on the same page ─────────────────
//   Approachable — warm, rounded, plain-language headline, each figure explained in a
//                  sentence ("เพิ่มขึ้น 18% จากปีก่อน" — from SAMPLE_FIN), a photo of the company.
//   Formal       — a full-width deep-navy band with a gold rule, square corners, a strict
//                  facts table in numbers.
const ApproachableHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <rect x={col(0)} y={112} width={172} height={34} rx={17} fill={t.surface} />
    <Txt x={col(0) + 86} y={135} size={15} weight={600} fill={t.accent} anchor="middle">{FIN.eyebrow}</Txt>
    <Txt x={col(0)} y={206} size={44} weight={700} fill={t.ink}>ผลการดำเนินงาน{FIN.year}</Txt>
    <Txt x={col(0)} y={262} size={44} weight={700} fill={t.accent}>สรุปให้อ่านเข้าใจง่าย</Txt>
    <Lines x={col(0)} y={292} w={span(5) - 40} n={2} t={t} />
    <Btn x={col(0)} y={344} w={span(2) + 30} label="ดูงบการเงิน" t={t} />
    <Btn x={col(2) + 44} y={344} w={span(2) + 10} label="ติดต่อทีม IR" t={t} ghost />
    <Pic x={col(7)} y={104} w={span(5)} h={300} t={t} r={28} id={`${id}-p`} />
    {[
      [FIN.kpis[0], `เพิ่มขึ้น ${S.revenueGrowth.slice(1)} จากปีก่อน`],
      [FIN.kpis[1], `เพิ่มขึ้น ${S.profitGrowth.slice(1)} จากปีก่อน`],
      [FIN.kpis[3], "จ่ายปันผลวันที่ 5 ธ.ค."],
    ].map(([m, say], i) => {
      const k = m as (typeof FIN.kpis)[number];
      return (
        <g key={k.k}>
          <rect x={col(i * 4)} y={444} width={span(4)} height={184} rx={t.r} fill={t.surface} />
          <circle cx={col(i * 4) + 46} cy={490} r={20} fill="none" stroke={t.accent} strokeWidth={2.5} />
          <path d={`M${col(i * 4) + 38} 496 l8 -10 l8 10`} fill="none" stroke={t.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <Txt x={col(i * 4) + 80} y={496} size={17} weight={600} fill={t.muted}>{k.k}</Txt>
          <Txt x={col(i * 4) + 26} y={562} size={36} weight={700} fill={t.ink}>{k.v} <tspan fontSize={18} fontWeight={500} fill={t.muted}>{k.u}</tspan></Txt>
          <Txt x={col(i * 4) + 26} y={598} size={17} fill={t.accent}>{say as string}</Txt>
        </g>
      );
    })}
  </>
);

const FormalHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    {/* full-width navy band */}
    <rect x={0} y={96} width={W} height={300} fill={t.ink} />
    <Txt x={col(0)} y={156} size={14} weight={600} fill={GOLD} ls={4}>{`INVESTOR RELATIONS · ${S.year}`}</Txt>
    <rect x={col(0)} y={172} width={80} height={3} fill={GOLD} />
    <Txt x={col(0)} y={244} size={46} weight={700} fill="#FFFFFF">{FIN.title}</Txt>
    <Txt x={col(0)} y={290} size={20} fill="#FFFFFF" >{`งบการเงินรวม สำหรับปีสิ้นสุด 31 ธันวาคม ${S.year}`}</Txt>
    <rect x={col(0)} y={322} width={span(3)} height={44} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} />
    <Txt x={col(0) + span(3) / 2} y={350} size={15} weight={600} fill="#FFFFFF" anchor="middle">{`รายงานประจำปี ${S.year}`}</Txt>
    {/* strict facts table */}
    <line x1={col(0)} y1={436} x2={RIGHT} y2={436} stroke={t.ink} strokeWidth={3} />
    {FIN.kpis.map((m, i) => (
      <g key={m.k}>
        <Txt x={col(i * 3)} y={478} size={15} fill={t.muted}>{m.k}</Txt>
        <Txt x={col(i * 3)} y={540} size={44} weight={700} fill={t.ink}>{m.v}</Txt>
        <Txt x={col(i * 3)} y={572} size={14} fill={t.muted}>{m.u}</Txt>
        {i > 0 && <line x1={col(i * 3) - 12} y1={456} x2={col(i * 3) - 12} y2={588} stroke={t.line} />}
      </g>
    ))}
    <line x1={col(0)} y1={608} x2={RIGHT} y2={608} stroke={t.line} />
  </>
);

// ── q3 · how content is delivered — the same results, told vs tabulated ─────
const StoryHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Pic x={col(0)} y={112} w={span(6)} h={320} t={t} id={`${id}-p`} />
    <Txt x={col(6) + 24} y={146} size={14} weight={600} fill={t.accent} ls={1}>{FIN.title}{FIN.year}</Txt>
    <Txt x={col(6) + 24} y={200} size={38} weight={700} fill={t.ink}>{`รายได้เติบโต ${S.revenueGrowth.slice(1)}`}</Txt>
    <Txt x={col(6) + 24} y={248} size={38} weight={700} fill={t.ink}>จากการขยายสู่ภูมิภาค</Txt>
    <Lines x={col(6) + 24} y={282} w={span(6) - 24} n={4} t={t} gap={18} />
    <Txt x={col(6) + 24} y={400} size={16} weight={600} fill={t.accent}>อ่านเรื่องราวทั้งหมด  →</Txt>
    <line x1={col(0)} y1={500} x2={RIGHT} y2={500} stroke={t.line} strokeWidth={2} />
    {[["2564", "เริ่มฟื้นตัว"], ["2565", "เปิดโรงงานใหม่"], ["2567", "ขยายสู่ภูมิภาค"], [S.year, `รายได้ ${S.revenue} ล้านบาท`]].map(([y, s], i) => (
      <g key={y}>
        <circle cx={col(i * 3) + 8} cy={500} r={8} fill={i === 3 ? t.accent : t.bg} stroke={t.accent} strokeWidth={3} />
        <Txt x={col(i * 3)} y={548} size={22} weight={700} fill={t.ink}>{y}</Txt>
        <Txt x={col(i * 3)} y={578} size={16} fill={t.muted}>{s}</Txt>
      </g>
    ))}
  </>
);

const DataHome = ({ t }: { t: Theme }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={128} size={14} weight={600} fill={t.accent} ls={1}>{FIN.eyebrow}</Txt>
    <Txt x={col(0)} y={168} size={30} weight={700} fill={t.ink}>{FIN.title}{FIN.year}</Txt>
    {FIN.kpis.map((m, i) => (
      <g key={m.k}>
        <rect x={col(i * 3)} y={192} width={span(3)} height={112} rx={t.r} fill={t.surface} />
        <Txt x={col(i * 3) + 20} y={222} size={14} fill={t.muted}>{m.k}</Txt>
        <Txt x={col(i * 3) + 20} y={268} size={34} weight={700} fill={t.ink}>{m.v}</Txt>
        <Txt x={col(i * 3) + 20} y={290} size={13} fill={t.accent}>▲ {m.d}</Txt>
      </g>
    ))}
    <rect x={col(0)} y={328} width={span(7)} height={300} rx={t.r} fill={t.surface} />
    <Txt x={col(0) + 24} y={364} size={18} weight={600} fill={t.ink}>รายได้ 5 ปีย้อนหลัง (ล้านบาท)</Txt>
    <Bars x={col(0) + 32} y={392} w={span(7) - 64} h={180} t={t} />
    <rect x={col(7) + 24} y={328} width={span(5) - 24} height={300} rx={t.r} fill={t.surface} />
    <Txt x={col(7) + 48} y={364} size={18} weight={600} fill={t.ink}>อัตราส่วนทางการเงิน</Txt>
    {FIN.ratios.map(([k, v], i) => (
      <g key={k}>
        <line x1={col(7) + 48} y1={388 + i * 56} x2={RIGHT - 24} y2={388 + i * 56} stroke={t.line} />
        <Txt x={col(7) + 48} y={422 + i * 56} size={17} fill={t.muted}>{k}</Txt>
        <Txt x={RIGHT - 24} y={422 + i * 56} size={17} weight={600} fill={t.ink} anchor="end">{v}</Txt>
      </g>
    ))}
  </>
);

// ── q4 · density — the same page with one figure and a lot of air, vs most of the
// figures on one screen (kept believable: four tiles, three panels, generous gaps). ─────
const SpaciousHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={W / 2} y={176} size={15} weight={600} fill={t.accent} anchor="middle" ls={1}>{FIN.title}{FIN.year}</Txt>
    <Txt x={W / 2} y={232} size={22} fill={t.muted} anchor="middle">รายได้รวม</Txt>
    <Txt x={W / 2} y={348} size={112} weight={700} fill={t.ink} anchor="middle" ls={-2}>{S.revenue}</Txt>
    <Txt x={W / 2} y={396} size={20} fill={t.muted} anchor="middle">{`ล้านบาท  ·  เพิ่มขึ้น ${S.revenueGrowth.slice(1)} จากปีก่อน`}</Txt>
    <Bars x={W / 2 - 150} y={440} w={300} h={80} t={t} labels={false} gap={0.4} />
    <Btn x={W / 2 - 92} y={560} w={184} label="ดูงบการเงิน" t={t} />
  </>
);

const DenseHome = ({ t }: { t: Theme }) => {
  const tile = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} rx={Math.min(t.r, 10)} fill={t.surface} />;
  return (
    <>
      <Header t={t} />
      <Txt x={col(0)} y={124} size={24} weight={700} fill={t.ink}>{FIN.title}{FIN.year}</Txt>
      {/* 4 KPI tiles */}
      {FIN.kpis.map((m, i) => (
        <g key={m.k}>
          {tile(col(i * 3), 144, span(3), 96)}
          <Txt x={col(i * 3) + 18} y={172} size={14} fill={t.muted}>{m.k}</Txt>
          <Txt x={col(i * 3) + 18} y={212} size={28} weight={700} fill={t.ink}>{m.v}</Txt>
          <Txt x={col(i * 3) + span(3) - 18} y={212} size={13} fill={t.accent} anchor="end">▲ {m.d}</Txt>
        </g>
      ))}
      {/* chart + ratios + calendar */}
      {tile(col(0), 264, span(6), 224)}
      <Txt x={col(0) + 18} y={294} size={16} weight={600} fill={t.ink}>รายได้ 5 ปีย้อนหลัง</Txt>
      <Bars x={col(0) + 24} y={316} w={span(6) - 48} h={124} t={t} />
      {tile(col(6), 264, span(3), 224)}
      <Txt x={col(6) + 18} y={294} size={16} weight={600} fill={t.ink}>อัตราส่วนสำคัญ</Txt>
      {FIN.ratios.map(([k, v], i) => (
        <g key={k}>
          <Txt x={col(6) + 18} y={334 + i * 38} size={14} fill={t.muted}>{k}</Txt>
          <Txt x={col(6) + span(3) - 18} y={334 + i * 38} size={14} weight={600} fill={t.ink} anchor="end">{v}</Txt>
        </g>
      ))}
      {tile(col(9), 264, span(3), 224)}
      <Txt x={col(9) + 18} y={294} size={16} weight={600} fill={t.ink}>ปฏิทินนักลงทุน</Txt>
      {["12 พ.ย.  ประกาศงบ Q3", "28 พ.ย.  Opportunity Day", "5 ธ.ค.  จ่ายปันผล"].map((s2, k) => (
        <Txt key={s2} x={col(9) + 18} y={334 + k * 38} size={14} fill={t.muted}>{s2}</Txt>
      ))}
      {/* documents */}
      {tile(col(0), 512, span(12), 116)}
      <Txt x={col(0) + 18} y={542} size={16} weight={600} fill={t.ink}>เอกสารดาวน์โหลด</Txt>
      {FIN.links.map((l, i) => (
        <g key={l}>
          <rect x={col(i * 4) + 18} y={562} width={36} height={44} rx={6} fill={t.soft} />
          <Txt x={col(i * 4) + 66} y={590} size={15} fill={t.ink}>{l} {S.year}</Txt>
        </g>
      ))}
    </>
  );
};

// ── q5 · expression — same palette and figures; a quiet page vs type and image that
// fill the frame and move ───────────────────────────────────────────────────────
const SubtleHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={192} size={16} weight={500} fill={t.muted} ls={0.5}>{FIN.title}{FIN.year}</Txt>
    <Txt x={col(0)} y={248} size={40} weight={600} fill={t.ink}>ผลการดำเนินงานที่มั่นคง</Txt>
    <Lines x={col(0)} y={280} w={span(5) - 24} n={2} t={t} gap={18} />
    <Txt x={col(0)} y={356} size={16} weight={600} fill={t.accent}>ดูงบการเงิน  →</Txt>
    <Pic x={col(7) + 24} y={144} w={span(5) - 24} h={260} t={t} id={`${id}-p`} />
    <line x1={col(0)} y1={468} x2={RIGHT} y2={468} stroke={t.line} />
    {FIN.kpis.map((m, i) => (
      <g key={m.k}>
        <Txt x={col(i * 3)} y={512} size={15} fill={t.muted}>{m.k}</Txt>
        <Txt x={col(i * 3)} y={556} size={30} weight={600} fill={t.ink}>{m.v}</Txt>
        <Txt x={col(i * 3)} y={584} size={14} fill={t.muted}>{m.u}</Txt>
      </g>
    ))}
  </>
);

// Motion is implied by the layout, not animated: a slanted image bleeding off the edges,
// slide dots and a ticker cut off at both edges as if it were running past. The
// headline sits on white, clear of the image.
const TICKER = [`รายได้ ${S.revenue} ล้านบาท ▲${S.revenueGrowth.slice(1)}`, `กำไรสุทธิ ${S.netProfit} ล้านบาท`, `ปันผล ${S.dividend} บาท/หุ้น`, `ROE ${S.roe}`];

const ExpressiveHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    {/* image bleeds off the top-right and bottom, cut on a slant */}
    <clipPath id={`${id}-cut`}><path d={`M${col(7) + 20} 82 L${W} 82 L${W} 606 L${col(5) + 20} 606 Z`} /></clipPath>
    <g clipPath={`url(#${id}-cut)`}>
      <Pic x={col(5)} y={82} w={W - col(5)} h={524} t={t} r={0} id={`${id}-p`} />
    </g>
    <Header t={t} />
    <Txt x={col(0) - 4} y={236} size={112} weight={800} fill={t.ink} ls={-3}>รายได้</Txt>
    <Txt x={col(0) - 4} y={364} size={112} weight={800} fill={t.accent} >{`โต ${S.revenueGrowth.slice(1)}`}</Txt>
    <Txt x={col(0)} y={424} size={18} fill={t.muted}>{FIN.title}{FIN.year}  ·  {S.revenue} ล้านบาท</Txt>
    {/* slide dots: the current slide is the long one */}
    {[[0, 64], [84, 24], [116, 24]].map(([dx, w], i) => (
      <rect key={dx} x={col(0) + dx} y={486} width={w} height={6} rx={3} fill={i === 0 ? t.ink : t.line} />
    ))}
    <circle cx={col(4) + 20} cy={524} r={62} fill={t.accent} />
    <Txt x={col(4) + 20} y={538} size={36} weight={700} fill={t.onAccent} anchor="middle">→</Txt>
    {/* figures ticker cut off at both edges */}
    <rect x={0} y={606} width={W} height={71} fill={t.ink} />
    {[...TICKER, TICKER[0]].map((s, i) => (
      <g key={i}>
        <circle cx={i * 300 - 130} cy={643} r={4} fill={t.soft} />
        <Txt x={i * 300 - 112} y={650} size={20} weight={700} fill={i % 2 ? t.soft : t.onAccent}>{s}</Txt>
      </g>
    ))}
  </>
);

// ── registry ─────────────────────────────────────────────────────────────────
const MOCKS: Record<string, { label: string; draw: (id: string) => ReactNode; bg: Theme }> = {
  "q1-a": { label: "เข้าถึงง่าย", bg: WARM, draw: (id) => <ApproachableHome t={WARM} id={id} /> },
  "q1-b": { label: "เป็นทางการ", bg: FORMAL, draw: (id) => <FormalHome t={FORMAL} id={id} /> },
  "q2-a": { label: "สว่าง", bg: LIGHT, draw: (id) => <StandardHome t={LIGHT} id={id} /> },
  "q2-b": { label: "เข้ม", bg: DARK, draw: (id) => <StandardHome t={DARK} id={id} /> },
  "q3-a": { label: "เล่าเรื่อง", bg: LIGHT, draw: (id) => <StoryHome t={LIGHT} id={id} /> },
  "q3-b": { label: "เน้นข้อมูล", bg: LIGHT, draw: () => <DataHome t={LIGHT} /> },
  "q4-a": { label: "โล่ง", bg: LIGHT, draw: (id) => <SpaciousHome t={LIGHT} id={id} /> },
  "q4-b": { label: "ข้อมูลแน่น", bg: LIGHT, draw: () => <DenseHome t={LIGHT} /> },
  "q5-a": { label: "เรียบ / สุขุม", bg: LIGHT, draw: (id) => <SubtleHome t={LIGHT} id={id} /> },
  "q5-b": { label: "โดดเด่น", bg: LIGHT, draw: (id) => <ExpressiveHome t={LIGHT} id={id} /> },
};

/** Mock for a quiz choice, e.g. id "q2-a". Fills its box at 16:9. */
export function ExploreMock({ id }: { id: string }) {
  const m = MOCKS[id];
  if (!m) return null;
  return <Frame t={m.bg} label={`ตัวอย่างหน้าข้อมูลสำคัญทางการเงินแบบ${m.label}`}>{m.draw(`em-${id}`)}</Frame>;
}
