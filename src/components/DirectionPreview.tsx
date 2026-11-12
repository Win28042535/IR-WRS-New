// ── Direction preview — the hi-fi overview on the Deliver step ──
// One picture of the customer's IR homepage, assembled from everything they chose:
// Direction colors, the Direction's font pairing (Typography), a photo from its Visual
// Style set, the sections they picked (nav), and the 5 Explore answers for layout:
//   q1 approachable → rounded, round photo, question bubble, chat button
//      formal       → square corners, framed photo, numbered section titles
//   q2 light / dark page
//   q3 story → milestones timeline · data → KPI cards (+ chart when dense)
//   q4 dense → stock bar on top, tighter hero, an extra news/chart module
//   q5 expressive → huge headline + slanted bleeding photo · subtle → calm split hero
// Drawn as inline SVG (like ExploreMock) so it scales cleanly and exports to PNG.
// Shown in a browser frame with the same page on a phone, overlapping, bottom right.

import { useId, type ReactNode } from "react";
import { VISUAL_STYLES, unsplashUrl } from "@/lib/data";
import { FONT_PAIRINGS, DEFAULT_PAIRING, fontStack } from "@/lib/fonts";

type Picks = Partial<Record<"q1" | "q2" | "q3" | "q4" | "q5", "A" | "B">>;

const W = 1200;
const H = 677;
const PW = 1280; // page design width inside the browser frame
const PH = 770;
const BODY = "var(--font-plex), 'IBM Plex Sans Thai', 'Leelawadee UI', sans-serif";

// Short Thai nav labels for the sections a customer can pick.
const NAV_LABEL: Record<string, string> = {
  about: "เกี่ยวกับเรา", history: "ประวัติ", "chairman-message": "สารประธาน", board: "ผู้บริหาร",
  "ir-calendar": "ปฏิทิน IR", reports: "เอกสาร", financial: "ข้อมูลการเงิน", "ir-info": "ราคาหุ้น",
  "shareholder-info": "ผู้ถือหุ้น", analyst: "บทวิเคราะห์", sustainability: "ความยั่งยืน",
  governance: "บรรษัทภิบาล", contact: "ติดต่อ IR",
};
const DEFAULT_NAV = ["ข้อมูลการเงิน", "ราคาหุ้น", "เอกสาร", "ความยั่งยืน", "ข่าวสาร"];

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;
const isLight = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
};

type Look = {
  light: boolean; bg: string; band: string; card: string; ink: string; head: string; body: string;
  muted: string; line: string; accent: string; onAccent: string; second: string; up: string;
  r: number; btnR: number; tint: string;
};

function makeLook(colors: string[], light: boolean, approachable: boolean): Look {
  const [primary, second, hint] = colors;
  const shape = approachable ? { r: 20, btnR: 999 } : { r: 4, btnR: 4 };
  if (light) {
    return {
      light, bg: "#FFFFFF", band: hint && hint.toUpperCase() !== "#FFFFFF" ? hint : "#F5F6F8", card: "#FFFFFF",
      ink: "#111827", head: primary, body: "#4B5563", muted: "#6B7280", line: "#E5E7EB",
      accent: primary, onAccent: "#FFFFFF", second: isLight(second) ? primary : second, up: "#15803D",
      tint: alpha(primary, 0.08), ...shape,
    };
  }
  return {
    light, bg: primary, band: "rgba(255,255,255,0.045)", card: "rgba(255,255,255,0.07)",
    ink: "#F9FAFB", head: "#FFFFFF", body: "rgba(255,255,255,0.78)", muted: "rgba(255,255,255,0.58)",
    line: "rgba(255,255,255,0.14)", accent: second, onAccent: primary, second, up: "#86EFAC",
    tint: alpha(second, 0.16), ...shape,
  };
}

// The company name as a site logo: "บริษัท … จำกัด (มหาชน)" / "… PCL" trimmed to the brand,
// capped so it never runs into the nav; the mark shows its first letter.
const DEFAULT_BRAND = "ABC Group";
function brandOf(company?: string, max = 22) {
  let n = (company ?? "").trim()
    .replace(/^บริษัท\s*/, "")
    .replace(/\s*จำกัด\s*(\(มหาชน\))?\s*$/, "")
    .replace(/\s*(public company limited|pcl\.?|co\.,?\s*ltd\.?)\s*$/i, "")
    .trim();
  if (!n) n = DEFAULT_BRAND;
  const name = [...n].length > max ? [...n].slice(0, max - 1).join("") + "…" : n;
  // Skip Thai leading vowels (เ แ โ ใ ไ) so the mark shows a consonant.
  const first = [...n].find((c) => !/[เ-ไ\s]/.test(c)) ?? "A";
  return { name, initial: first.toUpperCase() };
}

// ── primitives ──────────────────────────────────────────────────────────────
const T = ({ x, y, s, w = 400, f, fam = BODY, a, ls, children }: {
  x: number; y: number; s: number; w?: number; f: string; fam?: string; a?: "start" | "middle" | "end"; ls?: number; children: ReactNode;
}) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={f} textAnchor={a} letterSpacing={ls} style={{ fontFamily: fam }}>{children}</text>
);

const Photo = ({ id, x, y, w, h, r = 0, src, clip }: { id: string; x: number; y: number; w: number; h: number; r?: number; src: string; clip?: string }) => (
  <g>
    <clipPath id={id}>{clip ? <path d={clip} /> : <rect x={x} y={y} width={w} height={h} rx={r} />}</clipPath>
    <rect x={x} y={y} width={w} height={h} fill="#C9CED6" clipPath={`url(#${id})`} />
    <image href={src} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
  </g>
);

const Button = ({ x, y, w, h = 46, label, k, ghost }: { x: number; y: number; w: number; h?: number; label: string; k: Look; ghost?: boolean }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={Math.min(k.btnR, h / 2)} fill={ghost ? "none" : k.accent}
      stroke={ghost ? (k.light ? k.line : "rgba(255,255,255,0.35)") : "none"} strokeWidth={1.5} />
    <T x={x + w / 2} y={y + h / 2 + 5} s={15} w={600} f={ghost ? k.ink : k.onAccent} a="middle">{label}</T>
  </g>
);

const Spark = ({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) => {
  const pts = [0.62, 0.7, 0.55, 0.6, 0.42, 0.48, 0.3, 0.34, 0.12];
  return <path d={pts.map((p, i) => `${i ? "L" : "M"}${x + (w * i) / (pts.length - 1)} ${y + h * p}`).join(" ")} fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
};

/** White quote card — sits over photos, so it stays light in both modes. */
const StockCard = ({ x, y, k, num, r }: { x: number; y: number; k: Look; num: string; r: number }) => (
  <g>
    <rect x={x} y={y} width={214} height={84} rx={Math.min(r, 16)} fill="#FFFFFF" />
    <T x={x + 18} y={y + 28} s={12} w={600} f="#6B7280" ls={1}>ABC · SET</T>
    <T x={x + 18} y={y + 62} s={28} w={700} f="#111827" fam={num}>42.75</T>
    <T x={x + 108} y={y + 62} s={13} w={700} f="#15803D">▲ 3.0%</T>
    <Spark x={x + 150} y={y + 22} w={48} h={22} c={k.light ? k.accent : "#15803D"} />
  </g>
);

const MILESTONES = [
  ["2541", "ก่อตั้งบริษัท", "เริ่มธุรกิจในประเทศ"],
  ["2548", "เข้าจดทะเบียน SET", "ระดมทุนเพื่อขยายกิจการ"],
  ["2558", "ขยายสู่ภูมิภาค", "ดำเนินงานใน 5 ประเทศ"],
  ["2568", "เป้าหมาย Net Zero", "ลดการปล่อยคาร์บอน 40%"],
];
const KPIS = [
  ["รายได้รวม", "28,560", "ล้านบาท", "▲ 18.2%"],
  ["กำไรสุทธิ", "4,215", "ล้านบาท", "▲ 12.6%"],
  ["อัตราปันผล", "4.8%", "ต่อปี", "▲ 0.4 pp"],
  ["ROE", "12.4%", "ปี 2568", "▲ 1.1 pp"],
];
const NEWS = [
  ["12 พ.ย. 68", "ประกาศงบการเงินไตรมาส 3/2568"],
  ["28 ต.ค. 68", "เชิญร่วมงาน Opportunity Day"],
  ["15 ต.ค. 68", "ได้รับการประเมิน CGR 5 ดาว"],
];

// ── the page (1280 wide) ────────────────────────────────────────────────────
function Page({ id, k, picks, nav, head, num, photos, brand }: {
  id: string; k: Look; picks: Picks; nav: string[]; head: string; num: string; photos: string[]; brand: { name: string; initial: string };
}) {
  const approachable = picks.q1 === "A";
  const story = picks.q3 === "A";
  const dense = picks.q4 === "B";
  const expressive = picks.q5 === "A"; // q5: A = expressive, B = subtle

  let y = 0;
  const bar = dense ? 34 : 0;
  const heroTop = bar + 76;
  const heroH = dense ? 300 : 356;
  const low = heroTop + heroH;

  return (
    <>
      <rect width={PW} height={PH} fill={k.bg} />

      {/* q4 dense — live stock bar */}
      {dense && (
        <g>
          <rect width={PW} height={bar} fill={k.light ? k.band : "rgba(0,0,0,0.22)"} />
          <T x={48} y={22} s={13} w={700} f={k.ink}>ABC  42.75</T>
          <T x={140} y={22} s={13} w={700} f={k.up}>▲ 1.25 (+3.0%)</T>
          <T x={300} y={22} s={13} f={k.body}>SET 1,420.75  ▲ 0.6%</T>
          <T x={480} y={22} s={13} f={k.body}>มูลค่าตลาด 86,400 ลบ.</T>
          <T x={PW - 48} y={22} s={13} f={k.muted} a="end">ข้อมูล ณ 16:30 น.  ·  TH | EN</T>
        </g>
      )}

      {/* header */}
      {(() => { y = bar; return null; })()}
      <rect x={48} y={y + 22} width={32} height={32} rx={approachable ? 10 : 3} fill={k.accent} />
      <T x={64} y={y + 45} s={18} w={700} f={k.onAccent} fam={num} a="middle">{brand.initial}</T>
      <T x={92} y={y + 36} s={17} w={700} f={k.ink}>{brand.name}</T>
      <T x={92} y={y + 54} s={11} f={k.muted}>นักลงทุนสัมพันธ์</T>
      {nav.slice(0, 5).map((n, i) => {
        const cx = 520 + i * 112;
        return (
          <g key={n}>
            {i === 0 && approachable && <rect x={cx - 52} y={y + 22} width={104} height={32} rx={16} fill={k.tint} />}
            <T x={cx} y={y + 43} s={14} w={i === 0 ? 600 : 400} f={i === 0 ? k.ink : k.body} a="middle">{n}</T>
            {i === 0 && !approachable && <rect x={cx - 26} y={y + 74} width={52} height={2} fill={k.accent} />}
          </g>
        );
      })}
      <Button x={PW - 48 - 132} y={y + 18} w={132} h={40} label="ติดต่อ IR" k={k} />
      <line x1={0} y1={y + 76} x2={PW} y2={y + 76} stroke={k.line} />

      {/* hero */}
      {expressive ? (
        <g>
          <Photo id={`${id}-hero`} x={640} y={heroTop} w={PW - 640} h={heroH} src={photos[0]}
            clip={`M${dense ? 800 : 780} ${heroTop} L${PW} ${heroTop} L${PW} ${heroTop + heroH} L${dense ? 690 : 660} ${heroTop + heroH} Z`} />
          <T x={44} y={heroTop + (dense ? 108 : 128)} s={dense ? 84 : 100} w={700} f={k.head} fam={head} ls={-2}>เติบโต</T>
          <T x={44} y={heroTop + (dense ? 196 : 232)} s={dense ? 84 : 100} w={700} f={k.second} fam={head} ls={-2}>ไปด้วยกัน</T>
          <T x={48} y={heroTop + (dense ? 238 : 282)} s={17} f={k.body}>สร้างผลตอบแทนให้ผู้ถือหุ้นอย่างต่อเนื่อง</T>
          {[[0, 44], [56, 16], [80, 16]].map(([dx, w], i) => (
            <rect key={dx} x={48 + dx} y={heroTop + (dense ? 266 : 314)} width={w} height={5} rx={2.5} fill={i === 0 ? k.ink : k.line} />
          ))}
          <circle cx={420} cy={heroTop + (dense ? 262 : 310)} r={30} fill={k.accent} />
          <T x={420} y={heroTop + (dense ? 270 : 318)} s={22} w={700} f={k.onAccent} a="middle">→</T>
          <StockCard x={PW - 48 - 214} y={heroTop + heroH - 108} k={k} num={num} r={k.r} />
        </g>
      ) : (
        <g>
          {(() => { y = heroTop + (dense ? 40 : 56); return null; })()}
          {approachable ? (
            <g>
              <rect x={48} y={y} width={148} height={30} rx={15} fill={k.tint} />
              <T x={122} y={y + 20} s={13} w={600} f={k.light ? k.accent : k.second} a="middle">สวัสดีนักลงทุน</T>
            </g>
          ) : (
            <g>
              <T x={48} y={y + 16} s={12} w={600} f={k.muted} ls={3}>INVESTOR RELATIONS</T>
              <rect x={48} y={y + 28} width={40} height={2} fill={k.accent} />
            </g>
          )}
          <T x={46} y={y + (dense ? 84 : 96)} s={dense ? 44 : 54} w={700} f={k.head} fam={head}>สร้างการเติบโต</T>
          <T x={46} y={y + (dense ? 138 : 162)} s={dense ? 44 : 54} w={700} f={k.second} fam={head}>อย่างยั่งยืน</T>
          <T x={48} y={y + (dense ? 174 : 206)} s={16} f={k.body}>ข้อมูลผลประกอบการ เอกสารเผยแพร่ และกิจกรรมนักลงทุน</T>
          {!dense && <T x={48} y={y + 232} s={16} f={k.body}>ครบในที่เดียว อัปเดตทุกไตรมาส</T>}
          <Button x={48} y={y + (dense ? 196 : 258)} w={232} label="ดาวน์โหลดรายงานประจำปี" k={k} />
          <Button x={292} y={y + (dense ? 196 : 258)} w={140} label="ดูราคาหุ้น" k={k} ghost />
          {approachable ? (
            <g>
              {(() => {
                const r = dense ? 124 : 148, cx = 960, cy = heroTop + heroH / 2 + 4;
                return (
                  <>
                    <Photo id={`${id}-hero`} x={cx - r} y={cy - r} w={r * 2} h={r * 2} r={r} src={photos[0]} />
                    <g>
                      <rect x={cx - r - 120} y={cy + r - 62} width={252} height={52} rx={26} fill="#FFFFFF" stroke="#E5E7EB" />
                      <circle cx={cx - r - 92} cy={cy + r - 36} r={14} fill={k.light ? k.accent : k.onAccent} />
                      <T x={cx - r - 92} y={cy + r - 31} s={15} w={700} f="#FFFFFF" a="middle">?</T>
                      <T x={cx - r - 68} y={cy + r - 31} s={15} w={600} f="#111827">ปันผลจ่ายเมื่อไหร่?</T>
                    </g>
                    <StockCard x={cx + r - 70} y={cy - r - 4} k={k} num={num} r={k.r} />
                  </>
                );
              })()}
            </g>
          ) : (
            <g>
              <Photo id={`${id}-hero`} x={700} y={heroTop + 32} w={PW - 48 - 700} h={heroH - 64} r={k.r} src={photos[0]} />
              <StockCard x={676} y={heroTop + heroH - 116} k={k} num={num} r={k.r} />
            </g>
          )}
        </g>
      )}

      {/* lower band */}
      <rect x={0} y={low} width={PW} height={PH - low} fill={k.band} />
      {(() => {
        const ty = low + 56;
        const title = story ? "เส้นทางการเติบโต" : "ข้อมูลทางการเงินที่สำคัญ";
        return (
          <g>
            {!approachable && <T x={48} y={ty} s={13} w={700} f={k.light ? k.accent : k.second} fam={num} ls={1}>01</T>}
            <T x={approachable ? 48 : 78} y={ty} s={24} w={700} f={k.head} fam={head}>{title}</T>
            <T x={dense && story ? 700 : PW - 48} y={ty} s={14} w={600} f={k.light ? k.accent : k.second} a="end">ดูทั้งหมด →</T>
          </g>
        );
      })()}
      {story ? (
        <g>
          {(() => {
            const x0 = 48, x1 = dense ? 700 : PW - 48, ly = low + 112, step = (x1 - x0 - (dense ? 150 : 200)) / 3;
            return (
              <>
                <line x1={x0} y1={ly} x2={x1} y2={ly} stroke={k.line} strokeWidth={2} />
                {MILESTONES.map(([yr, t, d], i) => {
                  const x = x0 + i * step;
                  const last = i === 3;
                  return (
                    <g key={yr}>
                      {approachable
                        ? <circle cx={x + 8} cy={ly} r={8} fill={last ? k.accent : k.bg} stroke={k.accent} strokeWidth={3} />
                        : <rect x={x} y={ly - 7} width={14} height={14} fill={last ? k.accent : k.bg} stroke={k.accent} strokeWidth={3} />}
                      <T x={x} y={ly + 50} s={dense ? 24 : 28} w={700} f={k.head} fam={num}>{yr}</T>
                      <T x={x} y={ly + 78} s={15} w={600} f={k.ink}>{t}</T>
                      {!dense && <T x={x} y={ly + 100} s={13} f={k.muted}>{d}</T>}
                    </g>
                  );
                })}
              </>
            );
          })()}
          {dense && (
            <g>
              <rect x={748} y={low + 24} width={PW - 48 - 748} height={PH - low - 48} rx={k.r} fill={k.light ? "#FFFFFF" : k.card} stroke={k.light ? k.line : "none"} />
              <T x={772} y={low + 60} s={17} w={700} f={k.ink}>ข่าวล่าสุด</T>
              {NEWS.map(([d, t], i) => (
                <g key={t}>
                  <Photo id={`${id}-n${i}`} x={772} y={low + 80 + i * 66} w={72} h={52} r={Math.min(k.r, 8)} src={photos[i + 1]} />
                  <T x={860} y={low + 100 + i * 66} s={12} f={k.muted}>{d}</T>
                  <T x={860} y={low + 122 + i * 66} s={14} w={600} f={k.ink}>{t}</T>
                </g>
              ))}
            </g>
          )}
        </g>
      ) : (
        <g>
          {(dense ? KPIS : KPIS.slice(0, 3)).map(([l, v, u, d], i, all) => {
            const gap = 20, w = (PW - 96 - gap * (all.length - 1)) / all.length;
            const x = 48 + i * (w + gap), cy = low + 84, h = dense ? 112 : 150;
            return (
              <g key={l}>
                <rect x={x} y={cy} width={w} height={h} rx={k.r} fill={k.light ? "#FFFFFF" : k.card} stroke={k.light ? k.line : "none"} />
                <T x={x + 24} y={cy + 34} s={14} f={k.muted}>{l}</T>
                <T x={x + 24} y={cy + (dense ? 80 : 96)} s={dense ? 32 : 42} w={700} f={k.head} fam={num}>{v}</T>
                <T x={x + 24 + v.length * (dense ? 20 : 26) + 10} y={cy + (dense ? 80 : 96)} s={13} f={k.muted}>{u}</T>
                {!dense && <T x={x + 24} y={cy + 128} s={13} w={700} f={k.up}>{d} จากปีก่อน</T>}
                {dense && <T x={x + w - 20} y={cy + 34} s={13} w={700} f={k.up} a="end">{d}</T>}
              </g>
            );
          })}
          {dense && (
            <g>
              <line x1={48} y1={PH - 34} x2={PW - 48} y2={PH - 34} stroke={k.line} />
              {[0.42, 0.5, 0.47, 0.58, 0.55, 0.66, 0.7, 0.8, 0.76, 0.88, 0.92, 1].map((b, i) => {
                const bw = 70, x = 48 + i * ((PW - 96 - bw) / 11), base = PH - 34, hh = 110 * b;
                return (
                  <g key={i}>
                    <rect x={x} y={base - hh} width={bw} height={hh} rx={Math.min(k.r, 6)} fill={i === 11 ? k.accent : alpha(k.light ? k.accent : "#FFFFFF", k.light ? 0.16 : 0.14)} />
                    {i % 4 === 3 && <T x={x + bw / 2} y={base + 22} s={12} w={600} f={k.muted} a="middle">Q4/{65 + Math.floor(i / 4)}</T>}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      )}

      {/* q1 approachable — floating chat button */}
      {approachable && (
        <g>
          <rect x={PW - 48 - 168} y={PH - 72} width={168} height={48} rx={24} fill={k.light ? k.accent : k.second} />
          <path d={`M${PW - 48 - 142} ${PH - 56} h20 a6 6 0 0 1 6 6 v8 a6 6 0 0 1 -6 6 h-12 l-6 5 v-5 h-2 a6 6 0 0 1 -6 -6 v-8 a6 6 0 0 1 6 -6 z`} fill={k.light ? "#FFFFFF" : k.onAccent} />
          <T x={PW - 48 - 106} y={PH - 43} s={15} w={600} f={k.light ? "#FFFFFF" : k.onAccent}>คุยกับทีม IR</T>
        </g>
      )}
    </>
  );
}

// ── the same page on a phone (390 wide) ─────────────────────────────────────
function PhonePage({ id, k, picks, head, num, photos, brand }: { id: string; k: Look; picks: Picks; head: string; num: string; photos: string[]; brand: { name: string; initial: string } }) {
  const approachable = picks.q1 === "A";
  const expressive = picks.q5 === "A"; // q5: A = expressive, B = subtle
  const story = picks.q3 === "A";
  return (
    <>
      <rect width={390} height={780} fill={k.bg} />
      <T x={28} y={30} s={14} w={600} f={k.ink}>9:41</T>
      <rect x={24} y={52} width={28} height={28} rx={approachable ? 9 : 3} fill={k.accent} />
      <T x={38} y={72} s={15} w={700} f={k.onAccent} fam={num} a="middle">{brand.initial}</T>
      <T x={62} y={72} s={16} w={700} f={k.ink}>{brand.name}</T>
      {[0, 1, 2].map((i) => <rect key={i} x={340} y={58 + i * 8} width={24} height={2.5} rx={1} fill={k.ink} />)}
      {expressive ? (
        <g>
          <T x={22} y={156} s={52} w={700} f={k.head} fam={head}>เติบโต</T>
          <T x={22} y={214} s={52} w={700} f={k.second} fam={head}>ไปด้วยกัน</T>
          <Photo id={`${id}-ph`} x={0} y={240} w={390} h={230} src={photos[0]} clip={`M0 270 L390 240 L390 470 L0 470 Z`} />
          <rect x={24} y={492} width={36} height={5} rx={2.5} fill={k.ink} />
          <rect x={68} y={492} width={14} height={5} rx={2.5} fill={k.line} />
        </g>
      ) : (
        <g>
          <Photo id={`${id}-ph`} x={24} y={104} w={342} h={200} r={approachable ? 24 : 4} src={photos[0]} />
          <T x={24} y={350} s={32} w={700} f={k.head} fam={head}>สร้างการเติบโต</T>
          <T x={24} y={390} s={32} w={700} f={k.second} fam={head}>อย่างยั่งยืน</T>
          <rect x={24} y={420} width={342} height={48} rx={Math.min(k.btnR, 24)} fill={k.accent} />
          <T x={195} y={450} s={15} w={600} f={k.onAccent} a="middle">ดาวน์โหลดรายงานประจำปี</T>
        </g>
      )}
      <g transform="translate(24 520)">
        <rect width={342} height={76} rx={Math.min(k.r, 16)} fill="#FFFFFF" stroke="#E5E7EB" />
        <T x={18} y={28} s={12} w={600} f="#6B7280" ls={1}>ABC · SET</T>
        <T x={18} y={60} s={26} w={700} f="#111827" fam={num}>42.75</T>
        <T x={112} y={60} s={13} w={700} f="#15803D">▲ 3.0%</T>
        <Spark x={260} y={22} w={64} h={28} c={k.light ? k.accent : "#15803D"} />
      </g>
      <rect x={0} y={620} width={390} height={160} fill={k.band} />
      <T x={24} y={662} s={20} w={700} f={k.head} fam={head}>{story ? "เส้นทางการเติบโต" : "ข้อมูลการเงิน"}</T>
      {story
        ? MILESTONES.slice(0, 2).map(([yr, t], i) => (
            <g key={yr}>
              <T x={24 + i * 176} y={712} s={24} w={700} f={k.head} fam={num}>{yr}</T>
              <T x={24 + i * 176} y={738} s={13} w={600} f={k.ink}>{t}</T>
            </g>
          ))
        : KPIS.slice(0, 2).map(([l, v], i) => (
            <g key={l}>
              <rect x={24 + i * 176} y={680} width={166} height={84} rx={Math.min(k.r, 14)} fill={k.light ? "#FFFFFF" : k.card} stroke={k.light ? k.line : "none"} />
              <T x={40 + i * 176} y={706} s={12} f={k.muted}>{l}</T>
              <T x={40 + i * 176} y={744} s={26} w={700} f={k.head} fam={num}>{v}</T>
            </g>
          ))}
    </>
  );
}

export function DirectionPreview({ directionId, picks, colors, label, sections, company }: {
  directionId: string; picks: Picks; colors: string[]; label: string; sections?: string[]; company?: string;
}) {
  const id = `dp${useId().replace(/[^a-zA-Z0-9]/g, "")}`; // clip/filter ids are document-global
  const k = makeLook(colors, picks.q2 !== "B", picks.q1 === "A");
  const pairing = FONT_PAIRINGS[directionId] ?? DEFAULT_PAIRING;
  const head = fontStack(pairing.thai);
  const num = fontStack(pairing.heading);
  const shots = VISUAL_STYLES[directionId]?.shots ?? VISUAL_STYLES["premium-corporate"].shots;
  const photos = shots.map((s, i) => unsplashUrl(s.id, i === 0 ? 1400 : 240));
  const fromSections = (sections ?? []).map((s) => NAV_LABEL[s]).filter(Boolean);
  const nav = fromSections.length >= 3 ? fromSections : DEFAULT_NAV;
  const [primary, second] = colors;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`ตัวอย่างหน้าเว็บ ${label}`} style={{ display: "block", fontFamily: BODY }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={alpha(primary, 0.16)} />
          <stop offset="1" stopColor={alpha(isLight(second) ? primary : second, 0.12)} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#0B1020" floodOpacity="0.22" />
        </filter>
        <clipPath id={`${id}-win`}><rect x={36} y={32} width={960} height={614} rx={14} /></clipPath>
        <clipPath id={`${id}-scr`}><rect x={972} y={244} width={195} height={390} rx={26} /></clipPath>
      </defs>
      <rect width={W} height={H} fill="#EEF0F4" />
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />

      {/* browser window */}
      <g filter={`url(#${id}-sh)`}><rect x={36} y={32} width={960} height={614} rx={14} fill="#FFFFFF" /></g>
      <g clipPath={`url(#${id}-win)`}>
        <rect x={36} y={32} width={960} height={36} fill="#F1F3F5" />
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => <circle key={c} cx={58 + i * 18} cy={50} r={5.5} fill={c} />)}
        <rect x={336} y={41} width={360} height={19} rx={9.5} fill="#FFFFFF" />
        <T x={516} y={55} s={11.5} f="#6B7280" a="middle">ir.abcgroup.co.th</T>
        <svg x={36} y={68} width={960} height={578} viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="xMidYMin slice">
          <Page id={`${id}-pg`} k={k} picks={picks} nav={nav} head={head} num={num} photos={photos} brand={brandOf(company)} />
        </svg>
      </g>

      {/* phone */}
      <g filter={`url(#${id}-sh)`}><rect x={964} y={236} width={211} height={406} rx={34} fill="#0B0B0F" /></g>
      <g clipPath={`url(#${id}-scr)`}>
        <svg x={972} y={244} width={195} height={390} viewBox="0 0 390 780">
          <PhonePage id={`${id}-pp`} k={k} picks={picks} head={head} num={num} photos={photos} brand={brandOf(company, 16)} />
        </svg>
      </g>
      <rect x={1040} y={250} width={58} height={14} rx={7} fill="#0B0B0F" />

    </svg>
  );
}

/** Phones only: the same page in a phone frame, drawn large on its own — the browser-frame
 *  composition is unreadable at ~300px wide. */
export function DirectionPhonePreview({ directionId, picks, colors, label, company }: {
  directionId: string; picks: Picks; colors: string[]; label: string; company?: string;
}) {
  const id = `dpp${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const k = makeLook(colors, picks.q2 !== "B", picks.q1 === "A");
  const pairing = FONT_PAIRINGS[directionId] ?? DEFAULT_PAIRING;
  const shots = VISUAL_STYLES[directionId]?.shots ?? VISUAL_STYLES["premium-corporate"].shots;
  const photos = shots.map((s, i) => unsplashUrl(s.id, i === 0 ? 900 : 240));
  const [primary, second] = colors;
  return (
    <svg viewBox="0 0 460 860" width="100%" height="100%" role="img" aria-label={`ตัวอย่างหน้าเว็บบนมือถือ ${label}`} style={{ display: "block", fontFamily: BODY }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={alpha(primary, 0.16)} />
          <stop offset="1" stopColor={alpha(isLight(second) ? primary : second, 0.12)} />
        </linearGradient>
        <filter id={`${id}-sh`} x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="16" stdDeviation="18" floodColor="#0B1020" floodOpacity="0.22" />
        </filter>
        <clipPath id={`${id}-scr`}><rect x={35} y={35} width={390} height={790} rx={44} /></clipPath>
      </defs>
      <rect width={460} height={860} fill="#EEF0F4" />
      <rect width={460} height={860} fill={`url(#${id}-bg)`} />
      <g filter={`url(#${id}-sh)`}><rect x={25} y={25} width={410} height={810} rx={54} fill="#0B0B0F" /></g>
      <g clipPath={`url(#${id}-scr)`}>
        <svg x={35} y={35} width={390} height={790} viewBox="0 0 390 790" preserveAspectRatio="xMidYMin slice">
          <PhonePage id={`${id}-pp`} k={k} picks={picks} head={fontStack(pairing.thai)} num={fontStack(pairing.heading)} photos={photos} brand={brandOf(company, 16)} />
        </svg>
      </g>
      <rect x={180} y={45} width={100} height={26} rx={13} fill="#0B0B0F" />
    </svg>
  );
}
