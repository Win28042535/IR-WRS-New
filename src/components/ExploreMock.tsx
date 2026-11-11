// ── Explore quiz mocks ──
// Flat UI illustrations of an IR homepage, one per quiz choice (q1-a … q5-b). They replace
// the photographic renders: simple enough to judge at a glance, and each A/B pair differs
// only in the one thing its question asks about.
//
// Drawn inline (not as <img src=".svg">) so the text uses the page's IBM Plex Sans Thai —
// an SVG loaded as an image can't reach page fonts and would fall back per device.
//
// Shared construction: 1200×677 canvas (same 16:9 frame as the photos), 72px margins,
// 12 columns of 66px with 24px gutters (column i starts at x = 72 + 90·i, an n-column
// span is 90·n − 24 wide), vertical rhythm in 8px steps.

import type { ReactNode } from "react";

const W = 1200;
const H = 677;
const col = (i: number) => 72 + 90 * i;
const span = (n: number) => 90 * n - 24;
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
const WARM: Theme = { // q1 Approachable — warm, rounded, friendly
  bg: "#FFFAF4", surface: "#FFF1E3", ink: "#2A2118", muted: "#7D6E60", line: "#F1E2D2",
  accent: "#F06B3A", onAccent: "#FFFFFF", soft: "#FFDCC6", r: 28, btnR: 999,
};
const FORMAL: Theme = { // q1 Formal — navy, square, restrained
  bg: "#FFFFFF", surface: "#F2F4F7", ink: "#0B1F3A", muted: "#5F6B7A", line: "#D9DEE5",
  accent: "#0B1F3A", onAccent: "#FFFFFF", soft: "#E3E8EF", r: 0, btnR: 0,
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

/** Site header: logo, four nav items, contact button. Identical in every mock. */
// Nav labels are centred on even 112px steps so the gaps read evenly whatever each
// label's length.
const Header = ({ t, nav = ["เกี่ยวกับเรา", "นักลงทุน", "ความยั่งยืน", "ข่าวสาร"] }: { t: Theme; nav?: string[] }) => (
  <g>
    <rect x={col(0)} y={26} width={28} height={28} rx={Math.min(t.r, 8)} fill={t.accent} />
    <Txt x={col(0) + 40} y={46} size={18} weight={700} fill={t.ink}>บริษัท ABC</Txt>
    {nav.map((n, i) => (
      <Txt key={n} x={col(6) + 20 + i * 112} y={46} size={14} fill={t.muted} anchor="middle">{n}</Txt>
    ))}
    <Btn x={col(11) - 42} y={20} w={span(1) + 42} h={40} label="ติดต่อ" t={t} />
    <line x1={col(0)} y1={80} x2={col(11) + span(1)} y2={80} stroke={t.line} />
  </g>
);

const Frame = ({ t, children, label }: { t: Theme; children: ReactNode; label: string }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={label} style={{ fontFamily: FONT, display: "block" }} preserveAspectRatio="xMidYMid slice">
    <rect width={W} height={H} fill={t.bg} />
    {children}
  </svg>
);

// ── shared homepage (q2): hero left, image right, three cards ───────────────
const StandardHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={136} size={14} weight={600} fill={t.accent} ls={1}>INVESTOR RELATIONS</Txt>
    <Txt x={col(0)} y={200} size={50} weight={700} fill={t.ink}>สร้างการเติบโต</Txt>
    <Txt x={col(0)} y={262} size={50} weight={700} fill={t.ink}>อย่างยั่งยืน</Txt>
    <Lines x={col(0)} y={296} w={span(5)} n={2} t={t} />
    <Btn x={col(0)} y={344} w={span(2) + 20} label="ข้อมูลนักลงทุน" t={t} />
    <Btn x={col(2) + 34} y={344} w={span(2)} label="รายงานประจำปี" t={t} ghost />
    <Pic x={col(6) + 24} y={112} w={span(6) - 24} h={300} t={t} id={`${id}-p`} />
    {[0, 4, 8].map((c, i) => (
      <g key={c}>
        <rect x={col(c)} y={452} width={span(4)} height={168} rx={t.r} fill={t.surface} />
        <rect x={col(c) + 24} y={476} width={36} height={36} rx={Math.min(t.r, 10)} fill={t.soft} />
        <Txt x={col(c) + 24} y={548} size={20} weight={600} fill={t.ink}>{["ข้อมูลทางการเงิน", "ราคาหลักทรัพย์", "ปฏิทินนักลงทุน"][i]}</Txt>
        <Lines x={col(c) + 24} y={568} w={span(4) - 48} n={2} t={t} gap={14} h={7} />
      </g>
    ))}
  </>
);

// ── q1 · brand personality — same visual style as the other mocks; the two answers
// differ in composition and in what the page talks about. Approachable: one big round
// image, floating question bubbles, a chat card and FAQ. Formal: a strict grid, a
// full-width image band, a company-facts table and a numbered index. ───────────────
const ApproachableHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <rect x={col(0)} y={112} width={168} height={32} rx={16} fill={t.soft} />
    <Txt x={col(0) + 84} y={133} size={14} weight={600} fill={t.accent} anchor="middle">สวัสดีนักลงทุน</Txt>
    <Txt x={col(0)} y={206} size={48} weight={700} fill={t.ink}>มาเติบโต</Txt>
    <Txt x={col(0)} y={266} size={48} weight={700} fill={t.ink}>ไปด้วยกันนะ</Txt>
    <Lines x={col(0)} y={292} w={span(5) - 40} n={2} t={t} />
    <Btn x={col(0)} y={336} w={span(2) + 30} label="คุยกับทีม IR" t={t} />
    {/* one big round image */}
    <Pic x={col(7) + 30} y={104} w={316} h={316} t={t} r={158} id={`${id}-p`} />
    {/* questions people actually ask, floating over the image */}
    {([["ปันผลจ่ายเมื่อไหร่?", col(6) - 20, 300, 228], ["ดูงบล่าสุดได้ที่ไหน?", col(9) + 30, 186, 232]] as const).map(([s, x, y, w]) => (
      <g key={s}>
        <rect x={x} y={y} width={w} height={48} rx={24} fill={t.bg} stroke={t.line} strokeWidth={2} />
        <circle cx={x + 26} cy={y + 24} r={12} fill={t.soft} />
        <Txt x={x + 26} y={y + 29} size={14} weight={700} fill={t.accent} anchor="middle">?</Txt>
        <Txt x={x + 48} y={y + 30} size={16} weight={600} fill={t.ink}>{s}</Txt>
      </g>
    ))}
    {/* chat card */}
    <rect x={col(0)} y={452} width={span(7)} height={176} rx={t.r} fill={t.surface} />
    <Txt x={col(0) + 28} y={490} size={18} weight={700} fill={t.ink}>คุยกับทีม IR</Txt>
    <rect x={col(0) + 28} y={506} width={250} height={34} rx={17} fill={t.bg} />
    <rect x={col(0) + 46} y={519} width={200} height={8} rx={4} fill={t.line} />
    <rect x={col(4) + 10} y={548} width={200} height={34} rx={17} fill={t.accent} />
    <rect x={col(4) + 28} y={561} width={150} height={8} rx={4} fill="rgba(255,255,255,0.6)" />
    <rect x={col(0) + 28} y={590} width={span(7) - 104} height={26} rx={13} fill={t.bg} />
    <circle cx={col(0) + span(7) - 50} cy={603} r={16} fill={t.accent} />
    {/* FAQ card */}
    <rect x={col(7)} y={452} width={span(5)} height={176} rx={t.r} fill={t.surface} />
    <Txt x={col(7) + 28} y={490} size={18} weight={700} fill={t.ink}>คำถามที่พบบ่อย</Txt>
    {[0, 1, 2].map((k) => (
      <g key={k}>
        <rect x={col(7) + 28} y={506 + k * 40} width={span(5) - 56} height={32} rx={16} fill={t.bg} />
        <rect x={col(7) + 46} y={518 + k * 40} width={[190, 150, 170][k]} height={8} rx={4} fill={t.line} />
        <Txt x={col(7) + span(5) - 48} y={528 + k * 40} size={18} weight={700} fill={t.accent} anchor="middle">+</Txt>
      </g>
    ))}
  </>
);

const FormalHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={130} size={13} weight={600} fill={t.muted} ls={3}>CORPORATE · SINCE 1998</Txt>
    <line x1={col(0)} y1={146} x2={col(0) + 64} y2={146} stroke={t.ink} strokeWidth={2} />
    <Txt x={col(0)} y={200} size={42} weight={700} fill={t.ink}>มุ่งมั่นสร้างคุณค่าอย่างมั่นคง</Txt>
    <Btn x={col(9)} y={164} w={span(3)} label="รายงานประจำปี 2568" t={t} />
    {/* full-width image band */}
    <Pic x={col(0)} y={236} w={span(12)} h={168} t={t} r={0} id={`${id}-p`} />
    {/* company facts table */}
    <Txt x={col(0)} y={448} size={16} weight={700} fill={t.ink} ls={0.5}>ข้อมูลบริษัท</Txt>
    <line x1={col(0)} y1={464} x2={col(0) + span(7)} y2={464} stroke={t.ink} strokeWidth={2} />
    {[["ก่อตั้ง", "พ.ศ. 2541"], ["ตลาดหลักทรัพย์", "SET · หมวดพลังงาน"], ["ทุนจดทะเบียน", "12,000 ล้านบาท"], ["ผู้สอบบัญชี", "บริษัท XYZ จำกัด"]].map(([k, v], i) => (
      <g key={k}>
        <Txt x={col(0)} y={494 + i * 40} size={15} fill={t.muted}>{k}</Txt>
        <Txt x={col(3)} y={494 + i * 40} size={15} weight={600} fill={t.ink}>{v}</Txt>
        <line x1={col(0)} y1={506 + i * 40} x2={col(0) + span(7)} y2={506 + i * 40} stroke={t.line} />
      </g>
    ))}
    {/* numbered index */}
    <Txt x={col(8)} y={448} size={16} weight={700} fill={t.ink} ls={0.5}>สารบัญ</Txt>
    <line x1={col(8)} y1={464} x2={col(11) + span(1)} y2={464} stroke={t.ink} strokeWidth={2} />
    {["01  ผลประกอบการ", "02  ธรรมาภิบาล", "03  ความยั่งยืน", "04  เอกสารเผยแพร่"].map((s, i) => (
      <g key={s}>
        <Txt x={col(8)} y={494 + i * 40} size={15} weight={600} fill={t.ink}>{s}</Txt>
        <Txt x={col(11) + span(1)} y={494 + i * 40} size={15} fill={t.muted} anchor="end">→</Txt>
        <line x1={col(8)} y1={506 + i * 40} x2={col(11) + span(1)} y2={506 + i * 40} stroke={t.line} />
      </g>
    ))}
  </>
);

// ── q3 · how content is delivered — same topic, story vs data ───────────────
const StoryHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Pic x={col(0)} y={112} w={span(7)} h={312} t={t} id={`${id}-p`} />
    <Txt x={col(7) + 24} y={146} size={14} weight={600} fill={t.accent} ls={1}>เรื่องราวของเรา</Txt>
    <Txt x={col(7) + 24} y={200} size={38} weight={700} fill={t.ink}>จากโรงงานเล็กๆ</Txt>
    <Txt x={col(7) + 24} y={248} size={38} weight={700} fill={t.ink}>สู่ผู้นำในภูมิภาค</Txt>
    <Lines x={col(7) + 24} y={282} w={span(5) - 24} n={5} t={t} gap={18} />
    <line x1={col(0)} y1={520} x2={col(11) + span(1)} y2={520} stroke={t.line} strokeWidth={2} />
    {[["1998", "ก่อตั้งบริษัท"], ["2005", "เข้าตลาด SET"], ["2015", "ขยายสู่ภูมิภาค"], ["2026", "Net Zero"]].map(([y, s], i) => (
      <g key={y}>
        <circle cx={col(i * 3) + 8} cy={520} r={8} fill={i === 3 ? t.accent : t.bg} stroke={t.accent} strokeWidth={3} />
        <Txt x={col(i * 3)} y={566} size={22} weight={700} fill={t.ink}>{y}</Txt>
        <Txt x={col(i * 3)} y={594} size={15} fill={t.muted}>{s}</Txt>
      </g>
    ))}
  </>
);

const DataHome = ({ t }: { t: Theme }) => {
  const bars = [0.42, 0.55, 0.63, 0.74, 0.92];
  return (
    <>
      <Header t={t} />
      <Txt x={col(0)} y={140} size={14} weight={600} fill={t.accent} ls={1}>ภาพรวมบริษัท</Txt>
      {[["รายได้รวม", "28,560", "ล้านบาท"], ["เติบโต", "+18%", "เทียบปีก่อน"], ["โครงการ", "128", "โครงการ"]].map(([k, v, u], i) => (
        <g key={k}>
          <rect x={col(i * 3)} y={160} width={span(3)} height={128} rx={t.r} fill={t.surface} />
          <Txt x={col(i * 3) + 20} y={192} size={14} fill={t.muted}>{k}</Txt>
          <Txt x={col(i * 3) + 20} y={248} size={40} weight={700} fill={i === 1 ? t.accent : t.ink}>{v}</Txt>
          <Txt x={col(i * 3) + 20} y={274} size={13} fill={t.muted}>{u}</Txt>
        </g>
      ))}
      <rect x={col(9)} y={160} width={span(3)} height={128} rx={t.r} fill={t.accent} />
      <Txt x={col(9) + 20} y={192} size={14} fill={t.onAccent} >ราคาหุ้น SET</Txt>
      <Txt x={col(9) + 20} y={248} size={40} weight={700} fill={t.onAccent}>42.75</Txt>
      <Txt x={col(9) + 20} y={274} size={13} fill={t.onAccent}>▲ 1.25 (3.0%)</Txt>
      <rect x={col(0)} y={312} width={span(7)} height={308} rx={t.r} fill={t.surface} />
      <Txt x={col(0) + 24} y={348} size={18} weight={600} fill={t.ink}>รายได้ 5 ปีย้อนหลัง</Txt>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={col(0) + 48 + i * 104} y={588 - 200 * b} width={56} height={200 * b} rx={Math.min(t.r, 6)} fill={i === 4 ? t.accent : t.soft} />
          <Txt x={col(0) + 76 + i * 104} y={610} size={13} fill={t.muted} anchor="middle">{2022 + i}</Txt>
        </g>
      ))}
      <rect x={col(7) + 24} y={312} width={span(5) - 24} height={308} rx={t.r} fill={t.surface} />
      <Txt x={col(7) + 48} y={348} size={18} weight={600} fill={t.ink}>ข้อมูลสำคัญ</Txt>
      {[["EBITDA", "6,890"], ["ROE", "12.4%"], ["EPS", "3.21"], ["ปันผล/หุ้น", "1.40"], ["P/E", "13.3x"]].map(([k, v], i) => (
        <g key={k}>
          <line x1={col(7) + 48} y1={372 + i * 48} x2={col(11) + span(1) - 24} y2={372 + i * 48} stroke={t.line} />
          <Txt x={col(7) + 48} y={402 + i * 48} size={16} fill={t.muted}>{k}</Txt>
          <Txt x={col(11) + span(1) - 24} y={402 + i * 48} size={16} weight={600} fill={t.ink} anchor="end">{v}</Txt>
        </g>
      ))}
    </>
  );
};

// ── q4 · density — one message vs everything at once ────────────────────────
const SpaciousHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={W / 2} y={208} size={14} weight={600} fill={t.accent} anchor="middle" ls={1}>COMPANY PROFILE</Txt>
    <Txt x={W / 2} y={272} size={52} weight={700} fill={t.ink} anchor="middle">สร้างคุณค่าที่ยั่งยืน</Txt>
    <rect x={col(4)} y={300} width={span(4)} height={8} rx={4} fill={t.line} />
    <rect x={col(4) + 60} y={318} width={span(4) - 120} height={8} rx={4} fill={t.line} />
    <Btn x={W / 2 - 84} y={358} w={168} label="รู้จักเรา" t={t} />
    <Pic x={col(2)} y={460} w={span(8)} h={217} t={t} r={t.r} id={`${id}-p`} />
  </>
);

const DenseHome = ({ t }: { t: Theme }) => (
  <>
    <Header t={t} />
    {/* market strip */}
    <rect x={col(0)} y={96} width={span(12)} height={40} rx={Math.min(t.r, 8)} fill={t.surface} />
    {["SET 1,420.75 ▲0.6%", "ABC 42.75 ▲3.0%", "Vol 12.4M", "Mkt Cap 86,400 ลบ."].map((s, i) => (
      <Txt key={s} x={col(0) + 20 + i * 262} y={122} size={14} weight={600} fill={i === 1 ? t.accent : t.ink}>{s}</Txt>
    ))}
    {/* row 1 */}
    <rect x={col(0)} y={152} width={span(6)} height={220} rx={t.r} fill={t.surface} />
    <Txt x={col(0) + 20} y={184} size={16} weight={600} fill={t.ink}>ผลการดำเนินงาน</Txt>
    <path d={`M${col(0) + 20} ${340} L${col(1) + 30} 310 L${col(2) + 40} 318 L${col(3) + 40} 276 L${col(4) + 40} 262 L${col(5) + 40} 214`} fill="none" stroke={t.accent} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    {/* three KPI tiles across the 6-column half: (516 − 2×12) / 3 = 164 wide */}
    {[["รายได้", "28,560"], ["EBITDA", "6,890"], ["ROE", "12.4%"]].map(([k, v], i) => (
      <g key={k}>
        <rect x={col(6) + i * 176} y={152} width={164} height={104} rx={t.r} fill={t.surface} />
        <Txt x={col(6) + 16 + i * 176} y={180} size={13} fill={t.muted}>{k}</Txt>
        <Txt x={col(6) + 16 + i * 176} y={222} size={24} weight={700} fill={t.ink}>{v}</Txt>
        <Txt x={col(6) + 16 + i * 176} y={244} size={12} fill={t.accent}>▲ 18%</Txt>
      </g>
    ))}
    <rect x={col(6)} y={268} width={span(6)} height={104} rx={t.r} fill={t.surface} />
    <Txt x={col(6) + 20} y={298} size={16} weight={600} fill={t.ink}>ปฏิทินนักลงทุน</Txt>
    {["12 พ.ย. ประกาศงบ Q3", "28 พ.ย. Opportunity Day"].map((s, i) => (
      <Txt key={s} x={col(6) + 20} y={326 + i * 26} size={14} fill={t.muted}>{s}</Txt>
    ))}
    {/* row 2 */}
    {[["ข่าวล่าสุด", 3], ["เอกสารดาวน์โหลด", 3], ["ผู้ถือหุ้นรายใหญ่", 3]].map(([s, n], i) => (
      <g key={s as string}>
        <rect x={col(i * 4)} y={388} width={span(4)} height={232} rx={t.r} fill={t.surface} />
        <Txt x={col(i * 4) + 20} y={420} size={16} weight={600} fill={t.ink}>{s}</Txt>
        {Array.from({ length: n as number }, (_, k) => (
          <g key={k}>
            <rect x={col(i * 4) + 20} y={440 + k * 56} width={40} height={40} rx={Math.min(t.r, 8)} fill={t.soft} />
            <rect x={col(i * 4) + 72} y={446 + k * 56} width={span(4) - 112} height={8} rx={4} fill={t.line} />
            <rect x={col(i * 4) + 72} y={464 + k * 56} width={(span(4) - 112) * 0.6} height={8} rx={4} fill={t.line} />
          </g>
        ))}
      </g>
    ))}
  </>
);

// ── q5 · expression — same palette; a near-empty quiet page vs image and type that
// fill the frame and move ──────────────────────────────────────────────────────
const SubtleHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={208} size={16} weight={500} fill={t.muted} ls={0.5}>บริษัท ABC จำกัด (มหาชน)</Txt>
    <Txt x={col(0)} y={264} size={40} weight={600} fill={t.ink}>ดำเนินธุรกิจอย่างรับผิดชอบ</Txt>
    <Lines x={col(0)} y={296} w={span(5) - 24} n={2} t={t} gap={18} />
    <Txt x={col(0)} y={370} size={16} weight={600} fill={t.accent}>อ่านเพิ่มเติม  →</Txt>
    <Pic x={col(7) + 24} y={160} w={span(5) - 24} h={260} t={t} id={`${id}-p`} />
    <line x1={col(0)} y1={484} x2={col(11) + span(1)} y2={484} stroke={t.line} />
    {["เกี่ยวกับเรา", "ข้อมูลนักลงทุน", "การกำกับดูแล"].map((s, i) => (
      <g key={s}>
        <Txt x={col(i * 4)} y={530} size={18} weight={600} fill={t.ink}>{s}</Txt>
        <Lines x={col(i * 4)} y={552} w={span(4) - 48} n={2} t={t} gap={16} />
      </g>
    ))}
  </>
);

// Motion is implied by the layout, not animated: a slanted image bleeding off the edges,
// slide dots and a ticker cut off at both edges as if it were running past. The
// headline sits on white, clear of the image.
const TICKER = ["ผลประกอบการ Q3 เติบโต 18%", "ประกาศจ่ายปันผล 1.40 บาท", "Opportunity Day 28 พ.ย.", "ABC 42.75 ▲3.0%"];

const ExpressiveHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    {/* image bleeds off the top-right and bottom, cut on a slant */}
    <clipPath id={`${id}-cut`}><path d={`M${col(7) + 20} 82 L${W} 82 L${W} 606 L${col(5) + 20} 606 Z`} /></clipPath>
    <g clipPath={`url(#${id}-cut)`}>
      <Pic x={col(5)} y={82} w={W - col(5)} h={524} t={t} r={0} id={`${id}-p`} />
    </g>
    <Header t={t} />
    <Txt x={col(0) - 4} y={236} size={112} weight={800} fill={t.ink} ls={-3}>เติบโต</Txt>
    <Txt x={col(0) - 4} y={364} size={112} weight={800} fill={t.accent} ls={-3}>ไปด้วยกัน</Txt>
    <Txt x={col(0)} y={424} size={18} fill={t.muted}>สร้างผลตอบแทนให้ผู้ถือหุ้นอย่างต่อเนื่อง</Txt>
    {/* slide dots: the current slide is the long one */}
    {[[0, 64], [84, 24], [116, 24]].map(([dx, w], i) => (
      <rect key={dx} x={col(0) + dx} y={486} width={w} height={6} rx={3} fill={i === 0 ? t.ink : t.line} />
    ))}
    <circle cx={col(4) + 20} cy={524} r={62} fill={t.accent} />
    <Txt x={col(4) + 20} y={538} size={36} weight={700} fill={t.onAccent} anchor="middle">→</Txt>
    {/* news ticker cut off at both edges */}
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
  return <Frame t={m.bg} label={`ตัวอย่างหน้าเว็บแบบ${m.label}`}>{m.draw(`em-${id}`)}</Frame>;
}
