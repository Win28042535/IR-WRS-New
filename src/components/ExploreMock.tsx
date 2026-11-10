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
const FONT = "var(--font-plex), 'IBM Plex Sans Thai', 'Leelawadee UI', Tahoma, sans-serif";

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

// ── q1 · brand personality — same layout, different character ───────────────
const PersonalityHome = ({ t, formal, id }: { t: Theme; formal: boolean; id: string }) => (
  <>
    <Header t={t} />
    {formal ? (
      <>
        <Txt x={col(0)} y={136} size={13} weight={600} fill={t.muted} ls={3}>CORPORATE · SINCE 1998</Txt>
        <line x1={col(0)} y1={152} x2={col(0) + 64} y2={152} stroke={t.ink} strokeWidth={2} />
        <Txt x={col(0)} y={214} size={48} weight={700} fill={t.ink}>มุ่งมั่นสร้างคุณค่า</Txt>
        <Txt x={col(0)} y={274} size={48} weight={700} fill={t.ink}>อย่างมั่นคง</Txt>
      </>
    ) : (
      <>
        <rect x={col(0)} y={112} width={168} height={32} rx={16} fill={t.soft} />
        <Txt x={col(0) + 84} y={133} size={14} weight={600} fill={t.accent} anchor="middle">สวัสดีนักลงทุน</Txt>
        <Txt x={col(0)} y={214} size={48} weight={700} fill={t.ink}>มาเติบโต</Txt>
        <Txt x={col(0)} y={274} size={48} weight={700} fill={t.ink}>ไปด้วยกันนะ</Txt>
      </>
    )}
    <Lines x={col(0)} y={304} w={span(5)} n={2} t={t} />
    <Btn x={col(0)} y={352} w={span(2) + 20} label={formal ? "ข้อมูลนักลงทุน" : "เริ่มทำความรู้จัก"} t={t} />
    {formal ? (
      <Pic x={col(6) + 24} y={112} w={span(6) - 24} h={300} t={t} id={`${id}-p`} />
    ) : (
      <g>
        <circle cx={col(9) + 10} cy={262} r={150} fill={t.soft} />
        <circle cx={col(11) + 24} cy={148} r={40} fill={t.accent} opacity={0.85} />
        <circle cx={col(7)} cy={380} r={26} fill="#FFC56B" />
        <Pic x={col(7) + 10} y={150} w={span(4) - 20} h={224} t={t} r={110} id={`${id}-p`} />
      </g>
    )}
    {formal
      ? ["01 — ผลประกอบการ", "02 — ธรรมาภิบาล", "03 — ความยั่งยืน"].map((s, i) => (
          <g key={s}>
            <line x1={col(i * 4)} y1={460} x2={col(i * 4) + span(4)} y2={460} stroke={t.ink} strokeWidth={2} />
            <Txt x={col(i * 4)} y={500} size={18} weight={700} fill={t.ink} ls={0.5}>{s}</Txt>
            <Lines x={col(i * 4)} y={524} w={span(4) - 24} n={3} t={t} gap={16} />
          </g>
        ))
      : ["ผลประกอบการ", "เป้าหมายของเรา", "คุยกับทีม IR"].map((s, i) => (
          <g key={s}>
            <rect x={col(i * 4)} y={452} width={span(4)} height={168} rx={t.r} fill={t.surface} />
            <circle cx={col(i * 4) + 46} cy={498} r={22} fill={t.soft} />
            <Txt x={col(i * 4) + 24} y={556} size={20} weight={600} fill={t.ink}>{s}</Txt>
            <Lines x={col(i * 4) + 24} y={574} w={span(4) - 48} n={2} t={t} gap={14} h={7} />
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

// ── q5 · expression — calm vs bold with motion cues ─────────────────────────
const SubtleHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={col(0)} y={176} size={14} fill={t.muted}>บริษัท ABC จำกัด (มหาชน)</Txt>
    <Txt x={col(0)} y={226} size={36} weight={600} fill={t.ink}>ดำเนินธุรกิจอย่างรับผิดชอบ</Txt>
    <Lines x={col(0)} y={256} w={span(5)} n={3} t={t} gap={18} />
    <Txt x={col(0)} y={344} size={15} weight={600} fill={t.accent}>อ่านเพิ่มเติม  →</Txt>
    <Pic x={col(6) + 24} y={136} w={span(6) - 24} h={240} t={t} id={`${id}-p`} />
    <line x1={col(0)} y1={436} x2={col(11) + span(1)} y2={436} stroke={t.line} />
    {["เกี่ยวกับเรา", "ข้อมูลนักลงทุน", "การกำกับดูแล"].map((s, i) => (
      <g key={s}>
        <Txt x={col(i * 4)} y={480} size={18} weight={600} fill={t.ink}>{s}</Txt>
        <Lines x={col(i * 4)} y={504} w={span(4) - 24} n={3} t={t} gap={16} />
      </g>
    ))}
  </>
);

const ExpressiveHome = ({ t, id }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    {/* image breaks out of the grid at an angle */}
    <clipPath id={`${id}-cut`}><path d={`M${col(6)} 96 L${W} 96 L${W} 520 L${col(5)} 560 Z`} /></clipPath>
    <g clipPath={`url(#${id}-cut)`}>
      <Pic x={col(5)} y={96} w={W - col(5)} h={470} t={t} r={0} id={`${id}-p`} />
    </g>
    <rect x={col(4) + 40} y={410} width={150} height={150} rx={75} fill={t.accent} />
    <Txt x={col(4) + 115} y={494} size={36} weight={700} fill={t.onAccent} anchor="middle">→</Txt>
    <Txt x={col(0)} y={232} size={104} weight={800} fill={t.ink} ls={-3}>กล้า</Txt>
    <Txt x={col(0)} y={344} size={104} weight={800} fill={t.accent} ls={-3}>เปลี่ยน</Txt>
    <Txt x={col(0)} y={400} size={18} fill={t.muted}>พลังงานแห่งอนาคต เริ่มที่วันนี้</Txt>
    {/* motion cues: progress dots, scroll hint, speed lines */}
    {[0, 60, 92].map((dx, i) => (
      <rect key={dx} x={col(0) + dx} y={452} width={i === 0 ? 48 : 20} height={6} rx={3} fill={i === 0 ? t.ink : t.line} />
    ))}
    <Txt x={col(0)} y={612} size={13} weight={600} fill={t.muted} ls={3}>SCROLL ↓</Txt>
    {[0, 1, 2].map((i) => (
      <line key={i} x1={col(8) - 40 + i * 24} y1={600 + i * 10} x2={col(11) + span(1) - i * 30} y2={600 + i * 10} stroke={t.accent} strokeWidth={3} strokeLinecap="round" opacity={0.6 - i * 0.15} />
    ))}
  </>
);

// ── registry ─────────────────────────────────────────────────────────────────
const MOCKS: Record<string, { label: string; draw: (id: string) => ReactNode; bg: Theme }> = {
  "q1-a": { label: "เข้าถึงง่าย", bg: WARM, draw: (id) => <PersonalityHome t={WARM} formal={false} id={id} /> },
  "q1-b": { label: "เป็นทางการ", bg: FORMAL, draw: (id) => <PersonalityHome t={FORMAL} formal id={id} /> },
  "q2-a": { label: "สว่าง", bg: LIGHT, draw: (id) => <StandardHome t={LIGHT} id={id} /> },
  "q2-b": { label: "เข้ม", bg: DARK, draw: (id) => <StandardHome t={DARK} id={id} /> },
  "q3-a": { label: "เล่าเรื่อง", bg: LIGHT, draw: (id) => <StoryHome t={LIGHT} id={id} /> },
  "q3-b": { label: "เน้นข้อมูล", bg: LIGHT, draw: () => <DataHome t={LIGHT} /> },
  "q4-a": { label: "โล่ง", bg: LIGHT, draw: (id) => <SpaciousHome t={LIGHT} id={id} /> },
  "q4-b": { label: "ข้อมูลแน่น", bg: LIGHT, draw: () => <DenseHome t={LIGHT} /> },
  "q5-a": { label: "เรียบ / สุขุม", bg: LIGHT, draw: (id) => <SubtleHome t={LIGHT} id={id} /> },
  "q5-b": { label: "โดดเด่น", bg: LIGHT, draw: (id) => <ExpressiveHome t={LIGHT} id={id} /> },
};

export const EXPLORE_MOCK_IDS = Object.keys(MOCKS);

/** Mock for a quiz choice, e.g. id "q2-a". Fills its box at 16:9. */
export function ExploreMock({ id }: { id: string }) {
  const m = MOCKS[id];
  if (!m) return null;
  return <Frame t={m.bg} label={`ตัวอย่างหน้าเว็บแบบ${m.label}`}>{m.draw(`em-${id}`)}</Frame>;
}
