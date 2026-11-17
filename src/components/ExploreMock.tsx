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

// ── q1 · brand personality — redrawn after user tests (CBG: "ข้อ 1 ดูคล้ายกันเกินไป",
// CPALL paused here). The pair now differs at thumbnail size before any detail is read:
//   Approachable — warm, light, everything rounded; people, a speech bubble, pastel cards
//                  with friendly questions.
//   Formal       — a full-width deep-navy band with a gold rule, square corners, a strict
//                  facts table in numbers. ───────────────────────────────────────────────
const Person = ({ cx, cy, s, skin, shirt }: { cx: number; cy: number; s: number; skin: string; shirt: string }) => (
  <g>
    <path d={`M${cx - s} ${cy + s * 2.3} Q${cx - s} ${cy + s * 0.9} ${cx} ${cy + s * 0.9} Q${cx + s} ${cy + s * 0.9} ${cx + s} ${cy + s * 2.3} Z`} fill={shirt} />
    <circle cx={cx} cy={cy} r={s * 0.62} fill={skin} />
  </g>
);

const ApproachableHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <rect x={col(0)} y={112} width={232} height={36} rx={18} fill={t.soft} />
    <Txt x={col(0) + 116} y={136} size={15} weight={600} fill={t.accent} anchor="middle">สวัสดีนักลงทุนทุกคน 👋</Txt>
    <Txt x={col(0)} y={210} size={50} weight={700} fill={t.ink}>ลงทุนไปด้วยกัน</Txt>
    <Txt x={col(0)} y={270} size={50} weight={700} fill={t.accent}>เข้าใจง่ายทุกขั้นตอน</Txt>
    <Lines x={col(0)} y={300} w={span(5) - 40} n={2} t={t} />
    <Btn x={col(0)} y={344} w={span(2) + 30} label="เริ่มต้นที่นี่" t={t} />
    <Btn x={col(2) + 44} y={344} w={span(2)} label="ถามทีม IR" t={t} ghost />
    {/* people, in a warm round blob */}
    <circle cx={col(9) + 10} cy={262} r={170} fill={t.soft} />
    <Person cx={col(8) + 10} cy={238} s={46} skin="#F2C3A0" shirt="#F06B3A" />
    <Person cx={col(9) + 60} cy={208} s={54} skin="#D9A27E" shirt="#2BB39A" />
    <Person cx={col(10) + 60} cy={248} s={44} skin="#EFC9A9" shirt="#8A6CF0" />
    {/* speech bubble */}
    <rect x={col(7) + 10} y={104} width={250} height={52} rx={26} fill="#FFFFFF" stroke={t.line} strokeWidth={2} />
    <path d={`M${col(8)} 154 l14 22 l8 -22 Z`} fill="#FFFFFF" />
    <Txt x={col(7) + 135} y={137} size={17} weight={600} fill={t.ink} anchor="middle">มีคำถาม? ทักเราได้เลย</Txt>
    {/* pastel question cards */}
    {([["ปันผลจ่ายเมื่อไหร่?", "#FFE3D3"], ["งบล่าสุด อ่านง่าย ๆ", "#D7F3EC"], ["คุยกับทีม IR", "#E7E0FF"]] as const).map(([s2, bg], i) => (
      <g key={s2}>
        <rect x={col(i * 4)} y={460} width={span(4)} height={168} rx={32} fill={bg} />
        <circle cx={col(i * 4) + 52} cy={512} r={26} fill="#FFFFFF" />
        <Txt x={col(i * 4) + 52} y={521} size={24} weight={700} fill={t.accent} anchor="middle">{["฿", "📊", "💬"][i]}</Txt>
        <Txt x={col(i * 4) + 28} y={578} size={22} weight={700} fill={t.ink}>{s2}</Txt>
        <rect x={col(i * 4) + 28} y={596} width={span(4) - 120} height={8} rx={4} fill="rgba(42,33,24,0.12)" />
      </g>
    ))}
  </>
);

const GOLD = "#B8963E";
const FormalHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    {/* full-width navy band */}
    <rect x={0} y={96} width={W} height={300} fill={t.ink} />
    <Txt x={col(0)} y={156} size={14} weight={600} fill={GOLD} ls={4}>CORPORATE · ESTABLISHED 1998</Txt>
    <rect x={col(0)} y={172} width={80} height={3} fill={GOLD} />
    <Txt x={col(0)} y={244} size={46} weight={700} fill="#FFFFFF">มุ่งมั่นสร้างคุณค่า</Txt>
    <Txt x={col(0)} y={300} size={46} weight={700} fill="#FFFFFF">อย่างมั่นคงและโปร่งใส</Txt>
    <rect x={col(0)} y={330} width={span(3)} height={44} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} />
    <Txt x={col(0) + span(3) / 2} y={358} size={15} weight={600} fill="#FFFFFF" anchor="middle">รายงานประจำปี 2568</Txt>
    {/* strict facts table */}
    <line x1={col(0)} y1={436} x2={col(11) + span(1)} y2={436} stroke={t.ink} strokeWidth={3} />
    {[["ทุนจดทะเบียน", "12,000", "ล้านบาท"], ["รายได้รวม", "28,560", "ล้านบาท"], ["อันดับ CG", "5", "ดาว"], ["ปันผล/หุ้น", "1.40", "บาท"]].map(([k, v, u], i) => (
      <g key={k}>
        <Txt x={col(i * 3)} y={478} size={15} fill={t.muted}>{k}</Txt>
        <Txt x={col(i * 3)} y={540} size={44} weight={700} fill={t.ink}>{v}</Txt>
        <Txt x={col(i * 3)} y={572} size={14} fill={t.muted}>{u}</Txt>
        {i > 0 && <line x1={col(i * 3) - 12} y1={456} x2={col(i * 3) - 12} y2={588} stroke={t.line} />}
      </g>
    ))}
    <line x1={col(0)} y1={608} x2={col(11) + span(1)} y2={608} stroke={t.line} />
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

// ── q4 · density — redrawn after user tests (CPALL paused here). One message and a lot
// of air, vs a full dashboard where every inch carries a number. ────────────────────────
const SpaciousHome = ({ t }: { t: Theme; id: string }) => (
  <>
    <Header t={t} />
    <Txt x={W / 2} y={262} size={14} weight={600} fill={t.accent} anchor="middle" ls={2}>COMPANY PROFILE</Txt>
    <Txt x={W / 2} y={340} size={60} weight={700} fill={t.ink} anchor="middle">สร้างคุณค่าที่ยั่งยืน</Txt>
    <rect x={W / 2 - 180} y={372} width={360} height={8} rx={4} fill={t.line} />
    <Btn x={W / 2 - 84} y={420} w={168} label="รู้จักเรา" t={t} />
    {/* one quiet number, far below */}
    <Txt x={W / 2} y={590} size={15} fill={t.muted} anchor="middle">รายได้ปี 2568  ·  28,560 ล้านบาท</Txt>
  </>
);

const DenseHome = ({ t }: { t: Theme }) => {
  const tile = (x: number, y: number, w: number, h: number) => <rect x={x} y={y} width={w} height={h} rx={Math.min(t.r, 8)} fill={t.surface} />;
  return (
    <>
      <Header t={t} />
      {/* market strip */}
      <rect x={col(0)} y={92} width={span(12)} height={34} rx={6} fill={t.ink} />
      {["SET 1,420.75 ▲0.6%", "ABC 42.75 ▲3.0%", "Vol 12.4M", "P/E 13.3x", "Mkt Cap 86,400 ลบ."].map((s2, i) => (
        <Txt key={s2} x={col(0) + 16 + i * 212} y={114} size={13} weight={600} fill={i === 1 ? "#7FB2FF" : "#FFFFFF"}>{s2}</Txt>
      ))}
      {/* 6 KPI tiles */}
      {[["รายได้", "28,560"], ["EBITDA", "6,890"], ["กำไรสุทธิ", "4,120"], ["ROE", "12.4%"], ["EPS", "3.21"], ["ปันผล", "1.40"]].map(([k, v], i) => (
        <g key={k}>
          {tile(col(i * 2), 136, span(2), 82)}
          <Txt x={col(i * 2) + 12} y={160} size={12} fill={t.muted}>{k}</Txt>
          <Txt x={col(i * 2) + 12} y={194} size={22} weight={700} fill={t.ink}>{v}</Txt>
          <Txt x={col(i * 2) + 12} y={210} size={11} fill={t.accent}>▲ {[18, 9, 12, 2, 7, 5][i]}%</Txt>
        </g>
      ))}
      {/* chart + table + calendar */}
      {tile(col(0), 228, span(5), 186)}
      <Txt x={col(0) + 14} y={252} size={14} weight={600} fill={t.ink}>รายได้รายไตรมาส</Txt>
      {[0.4, 0.5, 0.46, 0.62, 0.58, 0.7, 0.75, 0.9].map((b, i) => (
        <rect key={i} x={col(0) + 18 + i * 52} y={400 - 130 * b} width={34} height={130 * b} rx={3} fill={i === 7 ? t.accent : t.soft} />
      ))}
      {tile(col(5), 228, span(4), 186)}
      <Txt x={col(5) + 14} y={252} size={14} weight={600} fill={t.ink}>งบการเงินโดยย่อ</Txt>
      {Array.from({ length: 6 }, (_, k) => (
        <g key={k}>
          <rect x={col(5) + 14} y={268 + k * 24} width={120} height={7} rx={3} fill={t.line} />
          <rect x={col(5) + span(4) - 84} y={268 + k * 24} width={70} height={7} rx={3} fill={t.muted} opacity={0.5} />
        </g>
      ))}
      {tile(col(9), 228, span(3), 186)}
      <Txt x={col(9) + 14} y={252} size={14} weight={600} fill={t.ink}>ปฏิทินนักลงทุน</Txt>
      {["12 พ.ย. งบ Q3", "28 พ.ย. Opp Day", "5 ธ.ค. ปันผล", "20 ธ.ค. AGM"].map((s2, k) => (
        <Txt key={s2} x={col(9) + 14} y={282 + k * 32} size={13} fill={t.muted}>{s2}</Txt>
      ))}
      {/* row of lists */}
      {["ข่าวล่าสุด", "เอกสารดาวน์โหลด", "ผู้ถือหุ้นรายใหญ่", "การนำเสนอ"].map((s2, i) => (
        <g key={s2}>
          {tile(col(i * 3), 424, span(3), 204)}
          <Txt x={col(i * 3) + 14} y={448} size={14} weight={600} fill={t.ink}>{s2}</Txt>
          {Array.from({ length: 5 }, (_, k) => (
            <g key={k}>
              <rect x={col(i * 3) + 14} y={464 + k * 30} width={22} height={22} rx={4} fill={t.soft} />
              <rect x={col(i * 3) + 44} y={468 + k * 30} width={span(3) - 70} height={6} rx={3} fill={t.line} />
              <rect x={col(i * 3) + 44} y={479 + k * 30} width={(span(3) - 70) * 0.55} height={6} rx={3} fill={t.line} />
            </g>
          ))}
        </g>
      ))}
    </>
  );
};

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
