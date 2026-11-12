"use client";
// ── Homepage showcase ──
// Moodboard: the whole deliverable in one frame — the website itself, plus the Direction,
// its colors, its font pairing, its photo style and the homepage order. Everything is read
// from the system's own data, so the example is exactly what the flow produces.
// StepGallery: one small, faithful mock of each step's screen, so a first-time client
// sees what each step asks for and what it looks like before they get there.

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BUSINESS_GOALS, DIRECTIONS, FLOW_STEPS, IR_AUDIENCES, QUIZ, VISUAL_STYLES, unsplashUrl } from "@/lib/data";
import { FONT_PAIRINGS, fontStack } from "@/lib/fonts";
import { ExploreMock } from "@/components/ExploreMock";
import { DirectionPreview, DirectionPhonePreview } from "@/components/DirectionPreview";
import { IconCheck } from "@/components/icons";

const SAMPLE = { dir: "premium-corporate", picks: { q1: "B", q2: "B", q3: "B", q4: "B", q5: "A" } as const };
const SAMPLE_SECTIONS = ["Hero Section", "ข้อมูลสำคัญทางการเงิน", "ราคาหลักทรัพย์", "เอกสารนักลงทุน"];

// Motion (globals.css .mb-*): tiles assemble on a diagonal after the website (--d), each
// plays its content once (--j). Hover lifts the tile and names the step that produces it.
type Vars = CSSProperties & Record<`--${string}`, string | number>;
const v = (vars: Record<string, number>): Vars => Object.fromEntries(Object.entries(vars).map(([k, n]) => [`--${k}`, n])) as Vars;

const Tile = ({ label, step, d, children }: { label: string; step: number; d: number; children: ReactNode }) => (
  <div className="mb-tile min-w-0" style={v({ d })}>
    <div className="mb-card group relative min-w-0 rounded-[18px] border border-black/[0.06] bg-white p-3.5 sm:p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-[0_14px_32px_-12px_rgba(20,22,19,0.18)]">
      <p className="text-[12px] font-semibold text-ir-t3">{label}</p>
      {/* Sits on the top edge (like the figure's badge) so it never takes layout space. */}
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-0 hidden sm:block -translate-y-[30%] whitespace-nowrap rounded-full bg-ir-dark px-2.5 py-0.5 text-[11px] font-semibold text-white opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1/2 group-hover:opacity-100">
        จากขั้นที่ {step} · {FLOW_STEPS[step - 1]}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  </div>
);

export function Moodboard({ company }: { company: string }) {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  const pair = FONT_PAIRINGS[SAMPLE.dir];
  const photos = VISUAL_STYLES[SAMPLE.dir].shots.slice(0, 3);
  const swatches = d.colors.slice(0, 3);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.dataset.mb = "go"; return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.dataset.mb = "go";
      io.disconnect();
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const direction = (
    <Tile label="แนวทางการออกแบบ" step={3} d={1}>
      <p className="mb-item text-[17px] font-semibold leading-tight text-ir-t1">{d.label}</p>
      <p className="mb-item mt-1 text-[13px] leading-snug text-ir-t2" style={v({ j: 1 })}>{d.tagline}</p>
    </Tile>
  );
  const colors = (
    <Tile label="ชุดสี" step={3} d={2}>
      <ul className="grid gap-1.5">
        {swatches.map((c, j) => (
          <li key={c} className="flex items-center gap-2" style={v({ j })}>
            <span className="mb-swatch h-5 w-8 shrink-0 rounded-[6px] ring-1 ring-black/10" style={{ background: c }} />
            <span className="mb-item font-mono text-[12px] text-ir-t2">{c}</span>
          </li>
        ))}
      </ul>
    </Tile>
  );
  const type = (
    <Tile label="ตัวอักษร" step={3} d={3}>
      <div className="flex items-baseline gap-2 text-ir-t1">
        <span className="mb-item text-[32px] leading-none" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>Aa</span>
        <span className="mb-item text-[30px] leading-none" style={{ fontFamily: fontStack(pair.thai), fontWeight: 700, ...v({ j: 1 }) }}>กข</span>
      </div>
      <p className="mb-item mt-1.5 text-[12px] leading-snug text-ir-t3" style={v({ j: 2 })}>{pair.heading} + {pair.thai}</p>
    </Tile>
  );
  const imagery = (
    <Tile label="สไตล์ภาพ" step={3} d={2}>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((p, j) => (
          <div key={p.id} className="overflow-hidden rounded-[8px] bg-ir-muted">
            <img src={unsplashUrl(p.id, 240)} alt={p.cap} loading="lazy" className="mb-photo aspect-[4/3] w-full object-cover" style={v({ j })} />
          </div>
        ))}
      </div>
    </Tile>
  );
  const sections = (
    <Tile label="โครงหน้าแรก" step={4} d={3}>
      <ol className="grid gap-1">
        {SAMPLE_SECTIONS.map((s, j) => (
          <li key={s} className="flex min-w-0 items-center gap-2 text-[13px] text-ir-t1" style={v({ j })}>
            <span className="mb-num grid w-5 h-5 shrink-0 place-items-center rounded-full bg-ir-accent-soft font-mono text-[12px] font-bold text-ir-accent-text">{j + 1}</span>
            <span className="mb-item truncate">{s}</span>
          </li>
        ))}
      </ol>
    </Tile>
  );

  return (
    // data-mb="wait" holds the assembly until the figure is on screen (it sits below the fold).
    <figure ref={ref} data-mb="wait" className="mbw relative m-0">
      <div className="rounded-[26px] sm:rounded-[30px] border border-black/[0.06] bg-ir-bg/90 p-2.5 sm:p-3 shadow-[0_30px_80px_rgba(20,22,19,0.12)] backdrop-blur">
        {/* Phones: phone mock beside a stack of tiles */}
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-2.5 sm:hidden">
          <div className="mb-tile relative overflow-hidden rounded-[18px] border border-black/[0.06]" style={{ paddingTop: `${(860 / 460) * 100}%` }}>
            <div className="absolute inset-0"><DirectionPhonePreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} company={company} /></div>
          </div>
          <div className="grid content-start gap-2.5">{direction}{colors}{type}</div>
          <div className="col-span-2 grid grid-cols-2 gap-2.5">{imagery}{sections}</div>
        </div>
        {/* sm and up: the website large, the system around it */}
        <div className="hidden sm:grid grid-cols-6 gap-3">
          <div className="mb-tile col-span-6 relative overflow-hidden rounded-[20px] border border-black/[0.06]" style={{ paddingTop: "56.42%" }}>
            <div className="absolute inset-0"><DirectionPreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} company={company} /></div>
          </div>
          <div className="col-span-2">{direction}</div>
          <div className="col-span-2">{colors}</div>
          <div className="col-span-2">{type}</div>
          <div className="col-span-3">{imagery}</div>
          <div className="col-span-3">{sections}</div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[13px] text-ir-t3" style={{ textWrap: "balance" }}>
        หมายเหตุ: ไม่ใช่แบบเว็บไซต์จริง เป็นภาพอ้างอิงแนวทางที่สรุปจากคำตอบ งานออกแบบจริงเริ่มหลังทีมคุยรายละเอียดกับคุณ
      </figcaption>
    </figure>
  );
}

// ── Step gallery ───────────────────────────────────────────────────────────────
// Each mock is a scaled-down sketch of the real screen, in the app's own visual language.
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="h-[184px] overflow-hidden rounded-[16px] border border-ir-border bg-ir-bg p-3" aria-hidden="true">{children}</div>
);
const Chip = ({ on, t, children }: { on?: boolean; t?: number; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium ${on ? "sg-pick border-ir-select bg-primary-50 text-ir-t1" : "border-ir-border bg-white text-ir-t2"}`} style={t === undefined ? undefined : v({ t })}>
    {on && <IconCheck width={14} height={14} className="sg-check text-ir-accent-text" />}{children}
  </span>
);

// Each mock acts out its step once (globals.css .sg-*); --t orders the beats inside a card.
function MockUnderstand() {
  const aud = IR_AUDIENCES.slice(0, 4).map((a) => a.label);
  return (
    <Frame>
      <p className="text-[12px] font-semibold text-ir-t1">ชื่อบริษัท / องค์กร</p>
      <div className="mt-1.5 rounded-full border border-ir-border bg-white px-3 py-1.5 text-[12px] text-ir-t1"><span className="sg-type inline-block">บริษัทของคุณ จำกัด (มหาชน)</span></div>
      <p className="mt-3 text-[12px] font-semibold text-ir-t1">กลุ่มเป้าหมาย</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{aud.map((a, i) => <Chip key={a} on={i < 2} t={i < 2 ? 3 + i : undefined}>{a}</Chip>)}</div>
    </Frame>
  );
}
function MockDefine() {
  const goals = BUSINESS_GOALS.filter((g) => !g.hidden).slice(0, 3);
  return (
    <Frame>
      <div className="grid gap-1.5">
        {goals.map((g, i) => (
          <div key={g.id} className={`flex items-center justify-between rounded-[12px] border px-3 py-2 ${i < 2 ? "sg-pick border-ir-select bg-primary-50" : "border-ir-border bg-white"}`} style={v({ t: i })}>
            <span className="truncate text-[12px] font-semibold text-ir-t1">{g.label}</span>
            {i < 2 && <span className="sg-check grid w-5 h-5 shrink-0 place-items-center rounded-full bg-ir-accent text-ir-on-accent"><IconCheck width={14} height={14} /></span>}
          </div>
        ))}
      </div>
    </Frame>
  );
}
function MockExplore() {
  const q = QUIZ[0];
  return (
    <Frame>
      <p className="text-center text-[12px] font-semibold text-ir-t1">{q.question}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[q.optionA, q.optionB].map((o, i) => (
          <div key={o.label} className={`rounded-[10px] border bg-white p-1 ${i === 1 ? "sg-pickbump border-ir-select" : "border-ir-border"}`} style={v({ t: 1 })}>
            <div className="relative overflow-hidden rounded-[6px]" style={{ paddingTop: "56.42%" }}>
              <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
            </div>
            <p className="px-1 pt-1 text-[12px] font-semibold text-ir-t1">{i === 0 ? "A" : "B"} · {o.label}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}
function MockStructure() {
  const rows = ["Header", ...SAMPLE_SECTIONS.slice(0, 3), "Footer"];
  return (
    <Frame>
      <div className="grid gap-1">
        {rows.map((r, i) => {
          const fixed = i === 0 || i === rows.length - 1;
          // Row 3 is dragged up past row 4, which drops back down into place.
          const act = i === 2 ? "sg-drag relative z-10" : i === 3 ? "sg-drop" : "";
          return (
            <div key={r} className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 ${fixed ? "border-transparent bg-ir-muted" : "border-ir-border bg-white"} ${i === 2 ? "shadow-[0_6px_16px_rgba(20,22,19,0.12)] translate-x-1" : ""} ${act}`}>
              <span className="w-3 text-[12px] leading-none text-ir-t3">{fixed ? "" : "⋮⋮"}</span>
              <span className="w-4 font-mono text-[12px] text-ir-t3">{i + 1}</span>
              <span className="truncate text-[12px] font-medium text-ir-t1">{r}</span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
function MockInspire() {
  return (
    <Frame>
      <div className="rounded-full border border-ir-border bg-white px-3 py-1.5 text-[12px] text-ir-t3">วางลิงก์เว็บที่ชอบ…</div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {["ตัวอย่างเว็บ IR 1", "ตัวอย่างเว็บ IR 2"].map((t, i) => (
          <div key={t} className="sg-a rounded-[12px] border border-ir-border bg-white p-1.5" style={v({ t: i })}>
            <div className="h-12 rounded-[8px]" style={{ background: i ? "linear-gradient(135deg,#1E3A1E,#4A8C4A)" : "linear-gradient(135deg,#0D1B4B,#1A2E6B)" }} />
            <p className="mt-1 truncate text-[12px] font-semibold text-ir-t1">{t}</p>
            <span className={`mt-1 block rounded-full py-0.5 text-center text-[12px] font-semibold ${i === 0 ? "sg-pick-dark bg-ir-dark text-white" : "border border-ir-border text-ir-t2"}`} style={i === 0 ? v({ t: 2 }) : undefined}>{i === 0 ? "เลือกแล้ว" : "เลือก"}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
function MockDeliver() {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  return (
    <Frame>
      <div className="grid grid-cols-[1.2fr_1fr] gap-2">
        <div className="relative overflow-hidden rounded-[8px] border border-ir-border" style={{ paddingTop: "56.42%" }}>
          <div className="absolute inset-0"><DirectionPreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} /></div>
        </div>
        <div className="grid content-start gap-1.5">
          {["ชื่อ-นามสกุล", "อีเมล", "โทรศัพท์"].map((f, i) => (
            <div key={f} style={v({ t: i })} className="sg-a truncate rounded-full border border-ir-border bg-white px-2.5 py-1 text-[12px] text-ir-t3">{f}</div>
          ))}
        </div>
      </div>
      <div className="sg-press mt-2.5 rounded-full bg-ir-dark py-1.5 text-center text-[12px] font-semibold text-white" style={v({ t: 3.5 })}>ยืนยันและส่งให้ทีม IR Plus</div>
    </Frame>
  );
}

const STEPS_INFO: { mock: () => ReactNode; todo: string; how: string; optional?: boolean }[] = [
  { mock: MockUnderstand, todo: "กรอกชื่อบริษัท และเลือกกลุ่มนักลงทุนที่เว็บไซต์ต้องสื่อสารด้วย", how: "พิมพ์ + เลือก" },
  { mock: MockDefine, todo: "เลือกสิ่งที่เว็บไซต์ IR ต้องทำให้ได้ เช่น สร้างความน่าเชื่อถือ", how: "เลือกจากรายการ" },
  { mock: MockExplore, todo: "ตอบคำถาม 5 ข้อ โดยเลือกภาพ A หรือ B ที่ใกล้กับบริษัทคุณ", how: "เลือกจากภาพ" },
  { mock: MockStructure, todo: "ดูโครงหน้าแรกที่ระบบจัดให้ เพิ่ม ลด หรือลากเพื่อเปลี่ยนลำดับ", how: "ระบบจัดให้ก่อน" },
  { mock: MockInspire, todo: "วางลิงก์เว็บที่ชอบ หรือเลือกจากเว็บ IR ตัวอย่างที่ระบบเสนอ", how: "ไม่บังคับ", optional: true },
  { mock: MockDeliver, todo: "ตรวจภาพรวมเว็บไซต์ กรอกข้อมูลผู้ติดต่อ แล้วกดส่ง", how: "ตรวจ + กรอก" },
];

// Enters when scrolled into view (staggered by its column, like the Moodboard's diagonal),
// then its mock plays; hovering replays it. State lives on the DOM (data-sg) so re-renders
// never reset it, and the card stays fully visible until JS decides to animate.
function StepCard({ i, name }: { i: number; name: string }) {
  const s = STEPS_INFO[i];
  const Mock = s.mock;
  const ref = useRef<HTMLLIElement>(null);
  const lastRun = useRef(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.sg = "idle";
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const cols = getComputedStyle(el.parentElement!).gridTemplateColumns.split(" ").length;
      el.style.setProperty("--d", String(i % cols));
      el.dataset.sg = "play";
      lastRun.current = performance.now();
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [i]);

  const replay = () => {
    const el = ref.current;
    if (!el?.dataset.sg || el.dataset.sg === "idle" || performance.now() - lastRun.current < 2000) return;
    lastRun.current = performance.now();
    el.dataset.sg = "replay";
    setRun((r) => r + 1); // remount the mock so its animations start over
  };

  return (
    <li ref={ref} className="sg-card flex" onMouseEnter={replay}>
      <div className="sg-lift group flex w-full flex-col rounded-[24px] border border-black/[0.06] bg-ir-card p-3.5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(20,22,19,0.2)]">
        <Mock key={run} />
        <div className="px-1.5 pt-4 pb-1.5">
          <div className="flex items-center gap-2.5">
            <span className="grid w-8 h-8 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-[13px] font-bold text-ir-accent transition-colors duration-300 group-hover:bg-ir-accent group-hover:text-ir-dark">{i + 1}</span>
            <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ir-t1">{name}</h3>
            <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${s.optional ? "bg-ir-muted text-ir-t2" : "bg-ir-accent-soft text-ir-accent-text"}`}>{s.how}</span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ir-t2">{s.todo}</p>
        </div>
      </div>
    </li>
  );
}

export function StepGallery() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FLOW_STEPS.map((name, i) => <StepCard key={name} i={i} name={name} />)}
    </ol>
  );
}

// ── What the team receives: the transformation machine ──────────────────────────
// Raw answers go in on the left (↑ on phones), IR Plus processes them in the chamber, and
// something of a different kind comes out on the right (↓): a designed Requirement page.
//   ranked audiences (text)  → a persona block with weighted bars
//   ticked goals (chips)     → a checklist of what the site must do
//   A/B answers (letters)    → a palette, a type specimen and a named Direction (visual)
//   section list (names)     → a homepage wireframe
// One answer at a time: it is sucked into the core (in), the core spins and sparks (proc),
// a spark flies out and the matching block is written into the page (out). When all four
// are in, the page is marked ready; then it loops while in
// view. Token paths are measured from the real layout, so they work in both directions.
// Reduced motion / no JS: the finished page, static. Motion: globals.css (.bm-*).
const DarkChip = ({ n, on, children }: { n?: number; on?: boolean; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border py-0.5 text-[12px] font-medium ${n ? "pl-0.5 pr-2" : "px-2"} ${
    on === false ? "border-white/10 text-white/40" : on ? "border-ir-accent/50 bg-ir-accent/10 text-white" : "border-white/12 bg-white/[0.05] text-white/85"
  }`}>
    {n !== undefined && <span className="ir-grad-fill grid h-[18px] w-[18px] place-items-center rounded-full font-mono text-[10px] font-bold text-ir-on-accent">{n}</span>}
    {on && <Tick className="h-3 w-3 text-ir-accent" />}
    {children}
  </span>
);

const Tick = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d="M5 12.5 9.5 17 19 7.5" /></svg>
);
// One header style for all three columns, so they line up on one baseline.
const ColHead = ({ n, title, sub, tone = "light" }: { n: string; title: string; sub: string; tone?: "light" | "lime" }) => (
  <div className="flex items-center gap-2.5">
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[12px] font-bold ${tone === "lime" ? "ir-grad-fill text-ir-on-accent" : "bg-white/10 text-white"}`}>{n}</span>
    <p className="min-w-0 text-[14px] leading-tight"><span className={`font-semibold ${tone === "lime" ? "text-ir-accent" : "text-white"}`}>{title}</span><span className="text-white/55"> · {sub}</span></p>
  </div>
);

const T = { in: 700, proc: 650, out: 650, gap: 300, hold: 4800, reset: 700 };
type Phase = "in" | "proc" | "out" | "rest";
type Geo = { s: { x: number; y: number }[]; e: { x: number; y: number }[] };

export function BriefFlow() {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  const pair = FONT_PAIRINGS[SAMPLE.dir];
  const audiences = ["institutional", "analyst", "retail"].map((id) => IR_AUDIENCES.find((a) => a.id === id)!);
  const goals = BUSINESS_GOALS.filter((g) => !g.hidden).slice(0, 3);
  const picks = Object.values(SAMPLE.picks);

  // step: 0 = nothing processed yet, 1..4 = processing answer k, 5 = page finished
  const [step, setStep] = useState(5);
  const [phase, setPhase] = useState<Phase>("rest");
  const [geo, setGeo] = useState<Geo | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const ins = useRef<(HTMLLIElement | null)[]>([]);
  const outs = useRef<(HTMLDivElement | null)[]>([]);

  // Where each token starts (edge of its answer card) and where each spark lands (its block),
  // relative to the core's centre. Horizontal on wide layouts, vertical when stacked.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const c = core.current?.getBoundingClientRect();
      if (!c) return;
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      const s = ins.current.map((n) => {
        const r = n!.getBoundingClientRect();
        return r.right < c.left ? { x: r.right - 12 - cx, y: r.top + r.height / 2 - cy } : { x: r.left + r.width / 2 - cx, y: r.bottom - 8 - cy };
      });
      const e = outs.current.map((n) => {
        const r = n!.getBoundingClientRect();
        return r.left > c.right ? { x: r.left + 18 - cx, y: r.top + r.height / 2 - cy } : { x: r.left + r.width / 2 - cx, y: r.top + 10 - cy };
      });
      setGeo({ s, e });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The loop: runs only while the panel is on screen; reduced motion keeps the finished page.
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const run = () => {
      stop();
      setStep(0); setPhase("rest");
      let t = T.reset;
      for (let k = 1; k <= 4; k++) {
        at(t, () => { setStep(k); setPhase("in"); });
        at(t + T.in, () => setPhase("proc"));
        at(t + T.in + T.proc, () => setPhase("out"));
        t += T.in + T.proc + T.out + T.gap;
      }
      at(t, () => { setStep(5); setPhase("rest"); });
      at(t + T.hold, run);
    };
    setStep(0);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? run() : stop()), { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); stop(); };
  }, []);

  const inputs: { name: string; q: string; body: ReactNode; token: string }[] = [
    { name: FLOW_STEPS[0], q: "ใครคือผู้อ่านหลัก", token: audiences[0].label,
      body: <div className="flex flex-wrap gap-1">{audiences.map((a, j) => <DarkChip key={a.id} n={j + 1}>{a.label}</DarkChip>)}</div> },
    { name: FLOW_STEPS[1], q: "เว็บไซต์ต้องทำอะไรได้", token: "2 เป้าหมาย",
      body: <div className="flex flex-wrap gap-1">{goals.map((g, j) => <DarkChip key={g.id} on={j < 2}>{g.label}</DarkChip>)}</div> },
    { name: FLOW_STEPS[2], q: "ตอบ 5 ข้อจากภาพ", token: picks.join(" "),
      body: <div className="flex gap-1">{picks.map((p, j) => <span key={j} className="grid h-7 w-7 place-items-center rounded-[7px] border border-white/12 bg-white/[0.05] font-mono text-[12px] font-semibold text-white/85">{p}</span>)}</div> },
    { name: FLOW_STEPS[3], q: "เรียงเนื้อหาบนหน้าแรก", token: `${SAMPLE_SECTIONS.length} Section`,
      body: <div className="flex flex-wrap gap-1">{SAMPLE_SECTIONS.map((s, j) => <DarkChip key={s} n={j + 1}>{s}</DarkChip>)}</div> },
  ];

  const blocks: { label: string; body: ReactNode }[] = [
    { label: "ผู้อ่านหลัก", body: (
      <div>
        <p className="text-[15px] font-semibold text-ir-t1">{audiences[0].label}</p>
        <div className="mt-2 grid gap-1.5">
          {audiences.map((a, j) => (
            <div key={a.id} className="grid grid-cols-[88px_1fr] items-center gap-2 text-[11px] text-ir-t2">
              <span className="truncate">{a.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-ir-muted"><span className="bm-bar ir-grad-fill block h-full rounded-full" style={{ width: `${[100, 66, 40][j]}%` }} /></span>
            </div>
          ))}
        </div>
      </div>
    ) },
    { label: "สิ่งที่เว็บต้องทำได้", body: (
      <ul className="grid gap-1">
        {goals.slice(0, 2).map((g) => (
          <li key={g.id} className="flex items-center gap-1.5 text-[13px] font-medium text-ir-t1">
            <span className="ir-grad-fill grid h-5 w-5 shrink-0 place-items-center rounded-full text-ir-on-accent"><Tick className="h-3 w-3" /></span>{g.label}
          </li>
        ))}
      </ul>
    ) },
    { label: "แนวทางดีไซน์", body: (
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">{d.colors.slice(0, 3).map((c) => <span key={c} className="h-8 w-8 rounded-full ring-2 ring-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: c }} />)}</div>
        <span className="text-[24px] leading-none text-ir-t1" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>Aa<span style={{ fontFamily: fontStack(pair.thai) }}> กข</span></span>
        <span className="min-w-0 truncate text-[13px] font-semibold text-ir-t1">{d.label}</span>
      </div>
    ) },
    { label: "โครงหน้าแรก", body: (
      <div className="grid gap-1">
        <span className="h-1.5 w-full rounded-full bg-ir-border" />
        <span className="grid h-9 place-items-center rounded-[6px] bg-ir-dark text-[10px] font-semibold text-ir-accent">{SAMPLE_SECTIONS[0]}</span>
        <span className="grid grid-cols-3 gap-1">{[0, 1, 2].map((j) => <span key={j} className="h-5 rounded-[5px] bg-ir-accent-soft" />)}</span>
        <span className="grid grid-cols-2 gap-1"><span className="h-4 rounded-[5px] bg-ir-muted" /><span className="h-4 rounded-[5px] bg-ir-muted" /></span>
      </div>
    ) },
  ];

  const busy = step >= 1 && step <= 4;
  const status = step === 0 ? "รอคำตอบ" : step === 5 ? "เรียบเรียงเสร็จ" : `กำลังแปลงคำตอบ ${step}/4`;

  return (
    <div ref={root} data-busy={busy || undefined} data-phase={phase} className="bm relative overflow-clip rounded-[28px] sm:rounded-[32px] bg-ir-dark p-4 sm:p-6 lg:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div aria-hidden="true" className="bm-glow pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_minmax(0,1.1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-7 lg:gap-y-4">
        {/* ① raw input */}
        <div className="lg:col-start-1 lg:row-start-1"><ColHead n="01" title="วัตถุดิบ" sub="สิ่งที่คุณตอบ" /></div>
        <div className="lg:col-start-1 lg:row-start-2">
          <ol className="grid gap-2">
            {inputs.map((x, i) => (
              <li key={x.q} ref={(n) => { ins.current[i] = n; }} data-state={step === i + 1 && phase === "in" ? "active" : step > i + 1 || (step === i + 1 && phase !== "in") ? "done" : "idle"}
                className="bm-in flex items-start gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] px-3.5 py-3">
                <div className="bm-in-body min-w-0 flex-1">
                  <p className="text-[11px] text-white/50">ขั้นที่ {i + 1} · {x.name}</p>
                  <p className="mt-0.5 text-[14px] font-semibold text-white">{x.q}</p>
                  <div className="mt-2">{x.body}</div>
                </div>
                {/* reserved slot: the tick appears in place, nothing shifts */}
                <span aria-hidden="true" className="bm-used ir-grad-fill grid h-6 w-6 shrink-0 place-items-center rounded-full text-ir-on-accent"><Tick /></span>
              </li>
            ))}
          </ol>
        </div>

        {/* ② the machine */}
        <div className="bm-chamber relative mt-1 lg:mt-0 h-[210px] rounded-[26px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] lg:col-start-2 lg:row-start-2 lg:h-auto lg:min-h-[440px]">
          <span aria-hidden="true" className="bm-scan pointer-events-none absolute inset-x-3 top-0 h-px" />
          <div ref={core} className="absolute left-1/2 top-1/2 h-0 w-0">
            <div aria-hidden="true" className="bm-ring absolute h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div aria-hidden="true" className="absolute h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-ir-dark" />
            <div className="bm-core absolute grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full bg-white">
              <img src="/irplus-logo.jpg" alt="IR Plus" width={56} height={56} className="h-14 w-14 object-contain" />
            </div>
            {phase === "proc" && Array.from({ length: 10 }, (_, j) => (
              <span key={`${step}-${j}`} aria-hidden="true" className="bm-spark absolute" style={{ rotate: `${j * 36}deg` }}><span /></span>
            ))}
            {geo && busy && phase === "in" && (
              <span key={`in-${step}`} aria-hidden="true" className="bm-token" style={{ "--sx": `${geo.s[step - 1].x}px`, "--sy": `${geo.s[step - 1].y}px` } as Vars}>{inputs[step - 1].token}</span>
            )}
            {geo && busy && phase === "out" && (
              <span key={`out-${step}`} aria-hidden="true" className="bm-out" style={{ "--ex": `${geo.e[step - 1].x}px`, "--ey": `${geo.e[step - 1].y}px` } as Vars} />
            )}
          </div>
          <p role="status" className="absolute inset-x-2 bottom-3 text-center text-[12px] font-medium text-white/70">{status}</p>
        </div>

        {/* ③ what comes out */}
        <div className="mt-3 lg:col-start-3 lg:row-start-1 lg:mt-0"><ColHead n="02" title="ผลลัพธ์" sub="สิ่งที่นักออกแบบได้รับ" tone="lime" /></div>
        <div className="lg:col-start-3 lg:row-start-2">
          <div className="relative">
            <div className="relative rounded-[20px] bg-white p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-ir-border pb-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ir-t3">REQUIREMENT</p>
                  <p className="text-[16px] font-semibold text-ir-t1">เว็บไซต์ IR · บริษัทของคุณ</p>
                </div>
                <span data-on={step === 5} className="bm-ready inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-1 pr-3 text-[13px] font-semibold">
                  <span className="bm-ready-dot grid h-6 w-6 place-items-center rounded-full"><Tick /></span>
                  {step === 5 ? "พร้อมส่ง" : "รอเรียบเรียง"}
                </span>
              </div>
              <div className="divide-y divide-ir-border">
                {blocks.map((b, i) => (
                  <div key={b.label} ref={(n) => { outs.current[i] = n; }} data-on={step > i + 1 || (step === i + 1 && phase === "out")} className="bm-blk relative py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ir-accent-text">{b.label}</p>
                    <div aria-hidden="true" className="bm-skel absolute inset-x-0 bottom-3 top-8 grid content-start gap-1.5">
                      <span className="h-2.5 w-2/3 rounded-full bg-ir-muted" /><span className="h-2.5 w-1/2 rounded-full bg-ir-muted" />
                    </div>
                    <div className="bm-content mt-1.5">{b.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
