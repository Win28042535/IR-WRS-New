// ── Explore quiz mocks ──
// Flat UI illustrations of an IR website, one per quiz choice (q1-a … q5-b). Simple enough
// to judge at a glance, and each A/B pair differs only in the one thing its question asks.
//
// Every mock shows the SAME page: บริษัท ABC's IR homepage (หน้าหลักนักลงทุนสัมพันธ์), with
// the widgets a real one carries: share price, latest news, investor calendar, financial
// highlights and published documents (layouts after the IR Plus widget demos v2 / v3).
// Internal review 18 Nov 2026: the earlier "ข้อมูลสำคัญทางการเงิน" page didn't read as
// believable to people who know IR work. The figures are the same in every mock (IR and
// SAMPLE_FIN below); only the treatment changes: tone, colour, story vs data, density,
// expression.
//
// Drawn inline (not as <img src=".svg">) so the text uses the page's IBM Plex Sans Thai —
// an SVG loaded as an image can't reach page fonts and would fall back per device.
//
// Shared construction: 1200×677 canvas (16:9), 72px margins, 12 columns of 66px with 24px
// gutters (column i starts at x = 72 + 90·i, an n-column span is 90·n − 24 wide).

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
  accent: string; onAccent: string; soft: string; up: string; r: number; btnR: number;
};

const LIGHT: Theme = {
  bg: "#FFFFFF", surface: "#F3F5F8", ink: "#0F1B2D", muted: "#6B7685", line: "#E3E7ED",
  accent: "#2459D6", onAccent: "#FFFFFF", soft: "#DCE6FA", up: "#168A4E", r: 12, btnR: 8,
};
const DARK: Theme = {
  bg: "#0B1424", surface: "#16223A", ink: "#F3F6FB", muted: "#9AA6BA", line: "#24324D",
  accent: "#4C82FF", onAccent: "#FFFFFF", soft: "#1E3260", up: "#3DD68C", r: 12, btnR: 8,
};
// q1 Approachable — warm and rounded, but still a listed company's site: one muted accent.
const WARM: Theme = {
  bg: "#FBF8F4", surface: "#F3ECE4", ink: "#2A2420", muted: "#776B60", line: "#E8DED3",
  accent: "#B85A32", onAccent: "#FFFFFF", soft: "#EADBCD", up: "#2F7D4F", r: 20, btnR: 999,
};
const FORMAL: Theme = { // q1 Formal — navy, square, restrained
  bg: "#FFFFFF", surface: "#F2F4F7", ink: "#0B1F3A", muted: "#5F6B7A", line: "#D9DEE5",
  accent: "#0B1F3A", onAccent: "#FFFFFF", soft: "#E3E8EF", up: "#168A4E", r: 0, btnR: 0,
};
const GOLD = "#B8963E";

// ── the one IR homepage every mock shows ───────────────────────────────────
const S = SAMPLE_FIN;
const IR = {
  company: "บริษัท ABC จำกัด (มหาชน)",
  ticker: "SET : ABC",
  price: "27.75",
  change: "+0.25 (+0.91%)",
  vol: "ปริมาณ 1.25 ล้านหุ้น",
  val: "มูลค่า 34.62 ล้านบาท",
  asOf: "ข้อมูล ณ 18 พ.ย. 2568 16:30 น.",
  news: [
    ["14 พ.ย. 2568", "แจ้งผลการดำเนินงานไตรมาส 3/2568"],
    ["12 พ.ย. 2568", "กำหนดวันจ่ายเงินปันผลระหว่างกาล"],
    ["5 พ.ย. 2568", "เชิญร่วมงาน Opportunity Day Q3/2568"],
    ["28 ต.ค. 2568", "สรุปมติที่ประชุมคณะกรรมการบริษัท"],
  ],
  cal: [
    ["28", "พ.ย.", "Opportunity Day Q3/2568"],
    ["5", "ธ.ค.", "วันจ่ายเงินปันผลระหว่างกาล"],
    ["25", "ก.พ.", "ประกาศงบการเงินปี 2568"],
  ],
  docs: ["แบบ 56-1 One Report 2567", "งบการเงิน ไตรมาส 3/2568", "เอกสารนำเสนอ Q3/2568", "คำอธิบายและการวิเคราะห์ (MD&A)"],
  holders: [
    ["บริษัท ABC โฮลดิ้ง จำกัด", "38.52%"],
    ["บริษัท ไทยเอ็นวีดีอาร์ จำกัด", "8.14%"],
    ["สำนักงานประกันสังคม", "4.36%"],
    ["กองทุนรวมหุ้นระยะยาว ABC", "2.71%"],
  ],
  highlights: [
    { k: "รายได้รวม", v: S.revenue, u: "ล้านบาท", d: S.revenueGrowth },
    { k: "กำไรสุทธิ", v: S.netProfit, u: "ล้านบาท", d: S.profitGrowth },
    { k: "กำไรต่อหุ้น", v: S.eps, u: "บาท", d: "+0.34" },
    { k: "เงินปันผล", v: S.dividend, u: "บาท/หุ้น", d: "+0.15" },
  ],
  ratios: [["อัตรากำไรสุทธิ", S.netMargin], ["ROE", S.roe], ["D/E (เท่า)", S.de], ["P/E (เท่า)", S.pe]],
};

// ── primitives ─────────────────────────────────────────────────────────────
const Txt = ({ x, y, size, weight = 400, fill, children, anchor, ls, opacity }: {
  x: number; y: number; size: number; weight?: number; fill: string; children: ReactNode;
  anchor?: "start" | "middle" | "end"; ls?: number; opacity?: number;
}) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} letterSpacing={ls} opacity={opacity}>
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

const Card = ({ x, y, w, h, t }: { x: number; y: number; w: number; h: number; t: Theme }) => (
  <rect x={x} y={y} width={w} height={h} rx={t.r} fill={t.surface} />
);

/** Widget heading with a "ดูทั้งหมด" link on the right. */
const WTitle = ({ x, y, w, label, t, size = 18 }: { x: number; y: number; w: number; label: string; t: Theme; size?: number }) => (
  <>
    <Txt x={x} y={y} size={size} weight={600} fill={t.ink}>{label}</Txt>
    <Txt x={x + w} y={y} size={13} weight={600} fill={t.accent} anchor="end">ดูทั้งหมด</Txt>
  </>
);

/** Five years of revenue, the last bar in the accent colour. */
const Bars = ({ x, y, w, h, t, labels = true, gap = 0.45 }: { x: number; y: number; w: number; h: number; t: Theme; labels?: boolean; gap?: number }) => {
  const slot = w / S.revenueTrend.length;
  const bw = slot * (1 - gap);
  return (
    <>
      {S.revenueTrend.map((b, i) => (
        <g key={i}>
          <rect x={x + i * slot + (slot - bw) / 2} y={y + h * (1 - b)} width={bw} height={h * b} rx={Math.min(t.r, 6)} fill={i === S.revenueTrend.length - 1 ? t.accent : t.soft} />
          {labels && <Txt x={x + i * slot + slot / 2} y={y + h + 20} size={12} fill={t.muted} anchor="middle">{S.trendYears[i]}</Txt>}
        </g>
      ))}
    </>
  );
};

/** One trading day of the share price, as a line. */
const SPARK = [0.55, 0.5, 0.58, 0.52, 0.62, 0.6, 0.7, 0.66, 0.74, 0.8];
const Spark = ({ x, y, w, h, t }: { x: number; y: number; w: number; h: number; t: Theme }) => {
  const pts = SPARK.map((v, i) => `${x + (w * i) / (SPARK.length - 1)},${y + h * (1 - v)}`).join(" ");
  return (
    <>
      <polyline points={`${x},${y + h} ${pts} ${x + w},${y + h}`} fill={t.up} opacity={0.1} stroke="none" />
      <polyline points={pts} fill="none" stroke={t.up} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </>
  );
};

const DocIcon = ({ x, y, t, s = 1 }: { x: number; y: number; t: Theme; s?: number }) => (
  <g>
    <rect x={x} y={y} width={26 * s} height={32 * s} rx={4} fill={t.soft} />
    <Txt x={x + 13 * s} y={y + 21 * s} size={9 * s} weight={700} fill={t.accent} anchor="middle">PDF</Txt>
  </g>
);

/** Site header: logo, the IR menu (หน้าหลัก is the page shown), TH / EN. */
const NAV = ["หน้าหลัก", "ข้อมูลทางการเงิน", "ข้อมูลผู้ถือหุ้น", "เอกสารเผยแพร่", "ข่าวสาร"];
const Header = ({ t, onDark = false }: { t: Theme; onDark?: boolean }) => {
  const ink = onDark ? "#FFFFFF" : t.ink;
  const muted = onDark ? "rgba(255,255,255,0.72)" : t.muted;
  return (
    <g>
      <rect x={col(0)} y={26} width={28} height={28} rx={Math.min(t.r, 8)} fill={onDark ? "#FFFFFF" : t.accent} />
      <Txt x={col(0) + 40} y={46} size={18} weight={700} fill={ink}>{S.company}</Txt>
      {NAV.map((n, i) => {
        const cx = 430 + i * 124;
        const on = i === 0;
        return (
          <g key={n}>
            <Txt x={cx} y={46} size={14} weight={on ? 700 : 400} fill={on ? ink : muted} anchor="middle">{n}</Txt>
            {on && <rect x={cx - 24} y={58} width={48} height={3} rx={1.5} fill={onDark ? "#FFFFFF" : t.accent} />}
          </g>
        );
      })}
      <Txt x={RIGHT} y={46} size={14} weight={600} fill={ink} anchor="end">TH <tspan fill={muted} fontWeight={400}>| EN</tspan></Txt>
      {!onDark && <line x1={col(0)} y1={80} x2={RIGHT} y2={80} stroke={t.line} />}
    </g>
  );
};

const Frame = ({ t, children, label }: { t: Theme; children: ReactNode; label: string }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={label} style={{ fontFamily: FONT, display: "block" }} preserveAspectRatio="xMidYMid slice">
    <rect width={W} height={H} fill={t.bg} />
    {children}
  </svg>
);

// ── shared widgets ─────────────────────────────────────────────────────────
/** Share-price widget, 280px tall. */
const StockCard = ({ x, y, w, t }: { x: number; y: number; w: number; t: Theme }) => (
  <>
    <Card x={x} y={y} w={w} h={280} t={t} />
    <Txt x={x + 24} y={y + 38} size={18} weight={600} fill={t.ink}>ราคาหลักทรัพย์</Txt>
    <Txt x={x + w - 24} y={y + 38} size={13} weight={600} fill={t.muted} anchor="end">{IR.ticker}</Txt>
    <Txt x={x + 24} y={y + 110} size={52} weight={700} fill={t.ink}>{IR.price} <tspan fontSize={18} fontWeight={500} fill={t.muted}>บาท</tspan></Txt>
    <Txt x={x + 24} y={y + 144} size={17} weight={600} fill={t.up}>▲ {IR.change}</Txt>
    <line x1={x + 24} y1={y + 170} x2={x + w - 24} y2={y + 170} stroke={t.line} />
    <Txt x={x + 24} y={y + 200} size={14} fill={t.muted}>{IR.vol}</Txt>
    <Txt x={x + 24} y={y + 226} size={14} fill={t.muted}>{IR.val}</Txt>
    <Txt x={x + 24} y={y + 258} size={12} fill={t.muted} opacity={0.8}>{IR.asOf}</Txt>
  </>
);

const NewsCard = ({ x, y, w, t, n = 3 }: { x: number; y: number; w: number; t: Theme; n?: number }) => (
  <>
    <Card x={x} y={y} w={w} h={280} t={t} />
    <WTitle x={x + 24} y={y + 38} w={w - 48} label="ข่าวสารล่าสุด" t={t} />
    {IR.news.slice(0, n).map(([d, title], i) => (
      <g key={title}>
        <Txt x={x + 24} y={y + 82 + i * 66} size={13} fill={t.muted}>{d}</Txt>
        <Txt x={x + 24} y={y + 106 + i * 66} size={15} weight={500} fill={t.ink}>{title}</Txt>
        {i < n - 1 && <line x1={x + 24} y1={y + 124 + i * 66} x2={x + w - 24} y2={y + 124 + i * 66} stroke={t.line} />}
      </g>
    ))}
  </>
);

const DocsCard = ({ x, y, w, t, n = 3 }: { x: number; y: number; w: number; t: Theme; n?: number }) => (
  <>
    <Card x={x} y={y} w={w} h={280} t={t} />
    <WTitle x={x + 24} y={y + 38} w={w - 48} label="เอกสารเผยแพร่" t={t} />
    {IR.docs.slice(0, n).map((d, i) => (
      <g key={d}>
        <DocIcon x={x + 24} y={y + 66 + i * 66} t={t} />
        <Txt x={x + 64} y={y + 82 + i * 66} size={15} weight={500} fill={t.ink}>{d}</Txt>
        <Txt x={x + 64} y={y + 102 + i * 66} size={12} fill={t.muted}>ดาวน์โหลด PDF</Txt>
      </g>
    ))}
  </>
);

// ── q2 · light vs dark — the same homepage in both palettes ─────────────────
const StandardHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={140} size={14} weight={600} fill={t.accent} ls={0.5}>{IR.company}</Txt>
    <Txt x={col(0)} y={198} size={46} weight={700} fill={t.ink}>นักลงทุนสัมพันธ์</Txt>
    <Lines x={col(0)} y={226} w={span(5) - 30} n={2} t={t} />
    <Btn x={col(0)} y={272} w={180} label="ข้อมูลทางการเงิน" t={t} />
    <Btn x={col(0) + 196} y={272} w={150} label="ติดต่อ IR" t={t} ghost />
    <Pic x={col(6)} y={104} w={span(6)} h={224} t={t} id={`${id}-p`} />
    <StockCard x={col(0)} y={352} w={span(4)} t={t} />
    <NewsCard x={col(4)} y={352} w={span(4)} t={t} />
    <DocsCard x={col(8)} y={352} w={span(4)} t={t} />
  </>
);

// ── q1 · brand personality — tone of voice on the same homepage ─────────────
//   Approachable — warm, rounded, the figures said in a sentence each.
//   Formal       — a deep-navy band with a gold rule, square corners, figures in tables.
const ApproachableHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <rect x={col(0)} y={112} width={172} height={34} rx={17} fill={t.surface} />
    <Txt x={col(0) + 86} y={135} size={15} weight={600} fill={t.accent} anchor="middle">นักลงทุนสัมพันธ์</Txt>
    <Txt x={col(0)} y={206} size={42} weight={700} fill={t.ink}>ข้อมูลสำหรับผู้ถือหุ้น</Txt>
    <Txt x={col(0)} y={260} size={42} weight={700} fill={t.accent}>อ่านง่าย ครบในที่เดียว</Txt>
    <Lines x={col(0)} y={290} w={span(5) - 40} n={2} t={t} />
    <Btn x={col(0)} y={344} w={200} label="ดูผลประกอบการ" t={t} />
    <Btn x={col(0) + 216} y={344} w={150} label="ถามทีม IR" t={t} ghost />
    <Pic x={col(7)} y={104} w={span(5)} h={300} t={t} r={28} id={`${id}-p`} />
    {[
      ["ราคาหุ้นวันนี้", IR.price, "บาท", "สูงขึ้น 0.25 บาทจากเมื่อวาน", true],
      [`กำไรปี ${S.year}`, S.netProfit, "ล้านบาท", `เพิ่มขึ้น ${S.profitGrowth.slice(1)} จากปีก่อน`, true],
      ["เงินปันผล", S.dividend, "บาท/หุ้น", `จ่ายวันที่ 5 ธ.ค. ${S.year}`, false],
    ].map(([k, v, u, say, up], i) => (
      <g key={k as string}>
        <rect x={col(i * 4)} y={444} width={span(4)} height={184} rx={t.r} fill={t.surface} />
        <circle cx={col(i * 4) + 46} cy={490} r={20} fill="none" stroke={t.accent} strokeWidth={2.5} />
        {up
          ? <path d={`M${col(i * 4) + 38} 496 l8 -10 l8 10`} fill="none" stroke={t.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          : <rect x={col(i * 4) + 37} y={482} width={18} height={16} rx={3} fill="none" stroke={t.accent} strokeWidth={2.5} />}
        <Txt x={col(i * 4) + 80} y={496} size={17} weight={600} fill={t.muted}>{k}</Txt>
        <Txt x={col(i * 4) + 26} y={562} size={36} weight={700} fill={t.ink}>{v} <tspan fontSize={18} fontWeight={500} fill={t.muted}>{u}</tspan></Txt>
        <Txt x={col(i * 4) + 26} y={598} size={17} fill={t.accent}>{say}</Txt>
      </g>
    ))}
  </>
);

const FormalHome = ({ t }: { t: Theme; id: string }) => {
  const rows = [
    ["รายได้รวม", "22,870", "24,200", S.revenue],
    ["กำไรสุทธิ", "3,180", "3,680", S.netProfit],
    ["กำไรต่อหุ้น (บาท)", "2.48", "2.87", S.eps],
    ["ROE (%)", "11.2", "11.6", "12.4"],
  ];
  const valX = [470, 574, 678];
  return (
    <>
      <Header t={t} />
      <rect x={0} y={81} width={W} height={283} fill={t.ink} />
      <Txt x={col(0)} y={140} size={14} weight={600} fill={GOLD} ls={4}>INVESTOR RELATIONS</Txt>
      <rect x={col(0)} y={156} width={80} height={3} fill={GOLD} />
      <Txt x={col(0)} y={224} size={46} weight={700} fill="#FFFFFF">นักลงทุนสัมพันธ์</Txt>
      <Txt x={col(0)} y={264} size={20} fill="#FFFFFF" opacity={0.8}>{IR.company}</Txt>
      {/* share price as a table, inside the band */}
      <rect x={col(7)} y={116} width={span(5)} height={216} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} />
      <Txt x={col(7) + 24} y={148} size={14} weight={600} fill={GOLD} ls={0.5}>{`ราคาหลักทรัพย์  ${IR.ticker}`}</Txt>
      {[["ราคาล่าสุด (บาท)", IR.price], ["เปลี่ยนแปลง", IR.change], ["ปริมาณ (หุ้น)", "1,248,500"], ["มูลค่า (บาท)", "34,620,875"]].map(([k, v], i) => (
        <g key={k}>
          <line x1={col(7) + 24} y1={164 + i * 40} x2={RIGHT - 24} y2={164 + i * 40} stroke="#FFFFFF" strokeOpacity={0.18} />
          <Txt x={col(7) + 24} y={190 + i * 40} size={15} fill="#FFFFFF" opacity={0.75}>{k}</Txt>
          <Txt x={RIGHT - 24} y={190 + i * 40} size={15} weight={600} fill="#FFFFFF" anchor="end">{v}</Txt>
        </g>
      ))}
      {/* financial highlights table */}
      <Txt x={col(0)} y={414} size={20} weight={700} fill={t.ink}>ข้อมูลสำคัญทางการเงิน</Txt>
      <line x1={col(0)} y1={430} x2={col(6) + span(1)} y2={430} stroke={t.ink} strokeWidth={3} />
      <Txt x={col(0)} y={458} size={13} fill={t.muted}>(หน่วย: ล้านบาท)</Txt>
      {["2566", "2567", S.year].map((y, i) => <Txt key={y} x={valX[i]} y={458} size={13} weight={600} fill={t.muted} anchor="end">{y}</Txt>)}
      {rows.map(([k, ...vals], r) => (
        <g key={k}>
          <line x1={col(0)} y1={470 + r * 40} x2={col(6) + span(1)} y2={470 + r * 40} stroke={t.line} />
          <Txt x={col(0)} y={496 + r * 40} size={15} fill={t.ink}>{k}</Txt>
          {vals.map((v, i) => <Txt key={i} x={valX[i]} y={496 + r * 40} size={15} weight={i === 2 ? 700 : 400} fill={t.ink} anchor="end">{v}</Txt>)}
        </g>
      ))}
      {/* documents */}
      <Txt x={col(8)} y={414} size={20} weight={700} fill={t.ink}>เอกสารเผยแพร่</Txt>
      <line x1={col(8)} y1={430} x2={RIGHT} y2={430} stroke={t.ink} strokeWidth={3} />
      {IR.docs.map((d, i) => (
        <g key={d}>
          <Txt x={col(8)} y={470 + i * 44} size={15} fill={t.ink}>{d}</Txt>
          <Txt x={RIGHT} y={470 + i * 44} size={13} weight={600} fill={t.muted} anchor="end">PDF</Txt>
          <line x1={col(8)} y1={486 + i * 44} x2={RIGHT} y2={486 + i * 44} stroke={t.line} />
        </g>
      ))}
    </>
  );
};

// ── q3 · how the company is introduced — a story first vs the numbers first ─────
const StoryHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Pic x={col(0)} y={104} w={span(6)} h={340} t={t} id={`${id}-p`} />
    <Txt x={col(6) + 24} y={142} size={14} weight={600} fill={t.accent} ls={0.5}>สารจากประธานกรรมการ</Txt>
    <Txt x={col(6) + 24} y={196} size={36} weight={700} fill={t.ink}>30 ปีแห่งการเติบโต</Txt>
    <Txt x={col(6) + 24} y={242} size={36} weight={700} fill={t.ink}>ไปพร้อมกับผู้ถือหุ้น</Txt>
    <Lines x={col(6) + 24} y={276} w={span(6) - 24} n={4} t={t} gap={18} />
    <Txt x={col(6) + 24} y={378} size={15} fill={t.muted}>ประธานกรรมการบริษัท</Txt>
    <Txt x={col(6) + 24} y={424} size={16} weight={600} fill={t.accent}>อ่านสารฉบับเต็ม  →</Txt>
    <Txt x={col(0)} y={490} size={14} weight={600} fill={t.accent} ls={0.5}>ประวัติบริษัท</Txt>
    <line x1={col(0)} y1={520} x2={RIGHT} y2={520} stroke={t.line} strokeWidth={2} />
    {[["2538", "ก่อตั้งบริษัท"], ["2547", "เข้าจดทะเบียนใน SET"], ["2560", "ขยายธุรกิจสู่ภูมิภาค"], [S.year, `รายได้ ${S.revenue} ล้านบาท`]].map(([y, s], i) => (
      <g key={y}>
        <circle cx={col(i * 3) + 8} cy={520} r={8} fill={i === 3 ? t.accent : t.bg} stroke={t.accent} strokeWidth={3} />
        <Txt x={col(i * 3)} y={566} size={22} weight={700} fill={t.ink}>{y}</Txt>
        <Txt x={col(i * 3)} y={596} size={16} fill={t.muted}>{s}</Txt>
      </g>
    ))}
  </>
);

const DataHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    {/* share price with today's line */}
    <Card x={col(0)} y={100} w={span(5)} h={204} t={t} />
    <Txt x={col(0) + 24} y={134} size={14} weight={600} fill={t.muted}>{IR.ticker}</Txt>
    <Txt x={col(0) + 24} y={190} size={46} weight={700} fill={t.ink}>{IR.price}</Txt>
    <Txt x={col(0) + 24} y={224} size={16} weight={600} fill={t.up}>▲ {IR.change}</Txt>
    <Txt x={col(0) + 24} y={282} size={12} fill={t.muted}>{IR.asOf}</Txt>
    <Spark x={col(0) + 210} y={128} w={span(5) - 234} h={112} t={t} />
    {/* highlights */}
    <Card x={col(5)} y={100} w={span(7)} h={204} t={t} />
    <WTitle x={col(5) + 24} y={134} w={span(7) - 48} label={`ข้อมูลสำคัญทางการเงิน ปี ${S.year}`} t={t} size={16} />
    {IR.highlights.map((m, i) => {
      const cw = (span(7) - 48) / 4;
      const x = col(5) + 24 + i * cw;
      return (
        <g key={m.k}>
          {i > 0 && <line x1={x - 12} y1={160} x2={x - 12} y2={276} stroke={t.line} />}
          <Txt x={x} y={180} size={13} fill={t.muted}>{m.k}</Txt>
          <Txt x={x} y={222} size={28} weight={700} fill={t.ink}>{m.v}</Txt>
          <Txt x={x} y={246} size={12} fill={t.muted}>{m.u}</Txt>
          <Txt x={x} y={270} size={13} weight={600} fill={t.up}>▲ {m.d}</Txt>
        </g>
      );
    })}
    {/* revenue chart + ratios */}
    <Card x={col(0)} y={328} w={span(7)} h={304} t={t} />
    <Txt x={col(0) + 24} y={364} size={16} weight={600} fill={t.ink}>รายได้รวม 5 ปีย้อนหลัง (ล้านบาท)</Txt>
    <Bars x={col(0) + 32} y={388} w={span(7) - 64} h={190} t={t} />
    <Card x={col(7)} y={328} w={span(5)} h={304} t={t} />
    <Txt x={col(7) + 24} y={364} size={16} weight={600} fill={t.ink}>อัตราส่วนทางการเงิน</Txt>
    {IR.ratios.map(([k, v], i) => (
      <g key={k}>
        <line x1={col(7) + 24} y1={388 + i * 56} x2={RIGHT - 24} y2={388 + i * 56} stroke={t.line} />
        <Txt x={col(7) + 24} y={422 + i * 56} size={16} fill={t.muted}>{k}</Txt>
        <Txt x={RIGHT - 24} y={422 + i * 56} size={16} weight={600} fill={t.ink} anchor="end">{v}</Txt>
      </g>
    ))}
  </>
);

// ── q4 · how much on one page — three things and air vs every widget on one screen ─
const SpaciousHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={W / 2} y={184} size={15} weight={600} fill={t.accent} anchor="middle" ls={0.5}>{IR.company}</Txt>
    <Txt x={W / 2} y={254} size={54} weight={700} fill={t.ink} anchor="middle">นักลงทุนสัมพันธ์</Txt>
    <rect x={W / 2 - 220} y={284} width={440} height={8} rx={4} fill={t.line} />
    {[0, 4, 8].map((c) => <line key={c} x1={col(c)} y1={392} x2={col(c) + span(3)} y2={392} stroke={t.ink} strokeOpacity={0.8} strokeWidth={2} />)}
    <Txt x={col(0)} y={428} size={14} fill={t.muted}>{`ราคาหุ้น  ${IR.ticker}`}</Txt>
    <Txt x={col(0)} y={484} size={40} weight={700} fill={t.ink}>{IR.price} <tspan fontSize={16} fontWeight={500} fill={t.muted}>บาท</tspan></Txt>
    <Txt x={col(0)} y={516} size={15} weight={600} fill={t.up}>▲ {IR.change}</Txt>
    <Txt x={col(4)} y={428} size={14} fill={t.muted}>ข่าวล่าสุด</Txt>
    <Txt x={col(4)} y={472} size={20} weight={600} fill={t.ink}>แจ้งผลการดำเนินงาน</Txt>
    <Txt x={col(4)} y={500} size={20} weight={600} fill={t.ink}>ไตรมาส 3/2568</Txt>
    <Txt x={col(4)} y={530} size={14} fill={t.muted}>{IR.news[0][0]}</Txt>
    <Txt x={col(8)} y={428} size={14} fill={t.muted}>เอกสารล่าสุด</Txt>
    <Txt x={col(8)} y={472} size={20} weight={600} fill={t.ink}>แบบ 56-1 One Report</Txt>
    <Txt x={col(8)} y={500} size={20} weight={600} fill={t.ink}>ปี 2567</Txt>
    <Txt x={col(8)} y={530} size={14} fill={t.muted}>PDF · 12.4 MB</Txt>
    {[0, 4, 8].map((c) => <Txt key={c} x={col(c)} y={590} size={15} weight={600} fill={t.accent}>ดูทั้งหมด  →</Txt>)}
  </>
);

const DenseHome = ({ t }: { t: Theme; id: string }) => {
  const tile = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} rx={Math.min(t.r, 10)} fill={t.surface} />;
  const w4 = span(4);
  return (
    <>
      <Header t={t} />
      {/* share price strip */}
      {tile(col(0), 96, span(12), 56)}
      <Txt x={col(0) + 18} y={130} size={14} weight={700} fill={t.ink}>{IR.ticker}</Txt>
      <Txt x={col(0) + 112} y={132} size={24} weight={700} fill={t.ink}>{IR.price}</Txt>
      <Txt x={col(0) + 192} y={130} size={14} weight={600} fill={t.up}>▲ {IR.change}</Txt>
      {["เปิด 27.50", "สูงสุด 27.90", "ต่ำสุด 27.25", IR.vol, IR.val].map((s, i) => (
        <Txt key={s} x={[440, 540, 652, 762, 930][i]} y={130} size={13} fill={t.muted}>{s}</Txt>
      ))}
      {/* row 2: news · revenue · calendar */}
      {tile(col(0), 168, w4, 216)}
      <WTitle x={col(0) + 18} y={196} w={w4 - 36} label="ข่าวสารล่าสุด" t={t} size={15} />
      {IR.news.map(([d, title], i) => (
        <g key={title}>
          <Txt x={col(0) + 18} y={226 + i * 40} size={11} fill={t.muted}>{d}</Txt>
          <Txt x={col(0) + 18} y={243 + i * 40} size={13} fill={t.ink}>{title}</Txt>
        </g>
      ))}
      {tile(col(4), 168, w4, 216)}
      <Txt x={col(4) + 18} y={196} size={15} weight={600} fill={t.ink}>รายได้รวม 5 ปี (ล้านบาท)</Txt>
      <Bars x={col(4) + 24} y={214} w={w4 - 48} h={124} t={t} />
      {tile(col(8), 168, w4, 216)}
      <WTitle x={col(8) + 18} y={196} w={w4 - 36} label="ปฏิทินนักลงทุน" t={t} size={15} />
      {IR.cal.map(([d, m, s], i) => (
        <g key={s}>
          <rect x={col(8) + 18} y={214 + i * 54} width={44} height={44} rx={6} fill={t.bg} />
          <Txt x={col(8) + 40} y={234 + i * 54} size={16} weight={700} fill={t.accent} anchor="middle">{d}</Txt>
          <Txt x={col(8) + 40} y={250 + i * 54} size={10} fill={t.muted} anchor="middle">{m}</Txt>
          <Txt x={col(8) + 74} y={241 + i * 54} size={13} fill={t.ink}>{s}</Txt>
        </g>
      ))}
      {/* row 3: highlights · shareholders · documents */}
      {tile(col(0), 400, w4, 232)}
      <Txt x={col(0) + 18} y={428} size={15} weight={600} fill={t.ink}>{`ข้อมูลสำคัญทางการเงิน ${S.year}`}</Txt>
      {IR.highlights.map((m, i) => {
        const x = col(0) + 18 + (i % 2) * ((w4 - 36) / 2);
        const y = 462 + Math.floor(i / 2) * 82;
        return (
          <g key={m.k}>
            <Txt x={x} y={y} size={12} fill={t.muted}>{m.k}</Txt>
            <Txt x={x} y={y + 30} size={22} weight={700} fill={t.ink}>{m.v}</Txt>
            <Txt x={x} y={y + 50} size={11} fill={t.up}>▲ {m.d}</Txt>
          </g>
        );
      })}
      {tile(col(4), 400, w4, 232)}
      <WTitle x={col(4) + 18} y={428} w={w4 - 36} label="ผู้ถือหุ้นรายใหญ่" t={t} size={15} />
      {IR.holders.map(([n, p], i) => (
        <g key={n}>
          <Txt x={col(4) + 18} y={466 + i * 42} size={13} fill={t.ink}>{n}</Txt>
          <Txt x={col(4) + w4 - 18} y={466 + i * 42} size={13} weight={600} fill={t.ink} anchor="end">{p}</Txt>
          <rect x={col(4) + 18} y={474 + i * 42} width={w4 - 36} height={4} rx={2} fill={t.line} />
          <rect x={col(4) + 18} y={474 + i * 42} width={(w4 - 36) * parseFloat(p) / 40} height={4} rx={2} fill={t.accent} />
        </g>
      ))}
      {tile(col(8), 400, w4, 232)}
      <WTitle x={col(8) + 18} y={428} w={w4 - 36} label="เอกสารเผยแพร่" t={t} size={15} />
      {IR.docs.map((d, i) => (
        <g key={d}>
          <DocIcon x={col(8) + 18} y={448 + i * 44} t={t} s={0.8} />
          <Txt x={col(8) + 48} y={468 + i * 44} size={13} fill={t.ink}>{d}</Txt>
        </g>
      ))}
    </>
  );
};

// ── q5 · how much the page stands out — quiet vs full-frame image and big type ─────
const SubtleHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={176} size={15} fill={t.muted}>{IR.company}</Txt>
    <Txt x={col(0)} y={228} size={38} weight={600} fill={t.ink}>นักลงทุนสัมพันธ์</Txt>
    <Lines x={col(0)} y={260} w={span(6)} n={2} t={t} gap={18} />
    <Txt x={col(0)} y={340} size={16} weight={600} fill={t.accent}>ข้อมูลทางการเงิน  →</Txt>
    <Pic x={col(8)} y={128} w={span(4)} h={220} t={t} id={`${id}-p`} />
    <line x1={col(0)} y1={420} x2={RIGHT} y2={420} stroke={t.line} />
    <Txt x={col(0)} y={458} size={14} fill={t.muted}>ราคาหุ้น</Txt>
    <Txt x={col(0)} y={494} size={24} weight={600} fill={t.ink}>{IR.price} บาท</Txt>
    <Txt x={col(0)} y={522} size={14} fill={t.up}>▲ {IR.change}</Txt>
    <Txt x={col(3)} y={458} size={14} fill={t.muted}>ข่าวล่าสุด</Txt>
    <Txt x={col(3)} y={492} size={15} fill={t.ink}>แจ้งผลการดำเนินงาน Q3/2568</Txt>
    <Txt x={col(3)} y={520} size={14} fill={t.muted}>{IR.news[0][0]}</Txt>
    <Txt x={col(6)} y={458} size={14} fill={t.muted}>ปฏิทินนักลงทุน</Txt>
    <Txt x={col(6)} y={492} size={15} fill={t.ink}>Opportunity Day Q3/2568</Txt>
    <Txt x={col(6)} y={520} size={14} fill={t.muted}>28 พ.ย. 2568</Txt>
    <Txt x={col(9)} y={458} size={14} fill={t.muted}>เอกสารล่าสุด</Txt>
    <Txt x={col(9)} y={492} size={15} fill={t.ink}>แบบ 56-1 One Report 2567</Txt>
    <Txt x={col(9)} y={520} size={14} fill={t.muted}>PDF · 12.4 MB</Txt>
    {[3, 6, 9].map((c) => <line key={c} x1={col(c) - 12} y1={440} x2={col(c) - 12} y2={530} stroke={t.line} />)}
  </>
);

// Motion is implied by the layout, not animated: a photo filling the frame, slide dots and
// a ticker cut off at both edges as if it were running past. Light like the other mocks
// (internal review 18 Nov 2026): the photo fades to white on the left under the headline.
const TICKER = [`ABC ${IR.price} ▲ ${IR.change}`, `ปันผล ${S.dividend} บาท/หุ้น`, "Opportunity Day 28 พ.ย.", `รายได้ ${S.revenue} ล้านบาท`];

const ExpressiveHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Pic x={0} y={0} w={W} h={606} t={t} r={0} id={`${id}-p`} />
    <defs>
      <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={t.bg} stopOpacity={0.97} />
        <stop offset="0.42" stopColor={t.bg} stopOpacity={0.85} />
        <stop offset="0.72" stopColor={t.bg} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={W} height={606} fill={`url(#${id}-g)`} />
    <rect x={0} y={0} width={W} height={81} fill={t.bg} opacity={0.9} />
    <Header t={t} />
    <Txt x={col(0) - 4} y={248} size={104} weight={800} fill={t.ink} ls={-2}>เติบโต</Txt>
    <Txt x={col(0) - 4} y={366} size={104} weight={800} fill={t.accent} ls={-2}>อย่างมั่นคง</Txt>
    <Txt x={col(0)} y={424} size={20} fill={t.muted}>{`รายได้ปี ${S.year} ${S.revenue} ล้านบาท เพิ่มขึ้น ${S.revenueGrowth.slice(1)}`}</Txt>
    <Btn x={col(0)} y={456} w={200} h={48} label="ดูผลประกอบการ" t={{ ...t, btnR: 24 }} />
    {[[0, 64], [84, 24], [116, 24]].map(([dx, w], i) => (
      <rect key={dx} x={col(0) + dx} y={548} width={w} height={6} rx={3} fill={i === 0 ? t.ink : t.line} />
    ))}
    <rect x={0} y={606} width={W} height={71} fill={t.accent} />
    {[...TICKER, TICKER[0]].map((s, i) => (
      <g key={i}>
        <circle cx={i * 330 - 150} cy={643} r={4} fill="#FFFFFF" opacity={0.6} />
        <Txt x={i * 330 - 132} y={650} size={20} weight={700} fill="#FFFFFF" opacity={i % 2 ? 0.75 : 1}>{s}</Txt>
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
  "q3-b": { label: "เน้นข้อมูล", bg: LIGHT, draw: (id) => <DataHome t={LIGHT} id={id} /> },
  "q4-a": { label: "เน้นพื้นที่ว่าง", bg: LIGHT, draw: (id) => <SpaciousHome t={LIGHT} id={id} /> },
  "q4-b": { label: "ข้อมูลแน่น", bg: LIGHT, draw: (id) => <DenseHome t={LIGHT} id={id} /> },
  "q5-a": { label: "เรียบ", bg: LIGHT, draw: (id) => <SubtleHome t={LIGHT} id={id} /> },
  "q5-b": { label: "โดดเด่น", bg: LIGHT, draw: (id) => <ExpressiveHome t={LIGHT} id={id} /> },
};

/** Mock for a quiz choice, e.g. id "q2-a". Fills its box at 16:9. */
export function ExploreMock({ id }: { id: string }) {
  const m = MOCKS[id];
  if (!m) return null;
  return <Frame t={m.bg} label={`ตัวอย่างหน้าหลักนักลงทุนสัมพันธ์แบบ${m.label}`}>{m.draw(`em-${id}`)}</Frame>;
}
