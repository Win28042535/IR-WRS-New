"use client";
// ── Homepage showcase ──
// Moodboard: the deliverable as a bento of the client's decisions: the Direction, its
// palette, type, imagery, the picks behind it, the audience and the homepage order. Everything
// is read from the system's own data, so the example is exactly what the flow produces.
// StepGallery: one small, faithful mock of each step's screen, so a first-time client
// sees what each step asks for and what it looks like before they get there.

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BUSINESS_GOALS, DIRECTIONS, FLOW_STEPS, IR_AUDIENCES, QUIZ, VISUAL_STYLES, unsplashUrl } from "@/lib/data";
import { FONT_PAIRINGS, fontStack } from "@/lib/fonts";
import { ExploreMock } from "@/components/ExploreMock";

const SAMPLE: { dir: string; picks: Record<"q1" | "q2" | "q3" | "q4" | "q5", "A" | "B"> } = { dir: "premium-corporate", picks: { q1: "B", q2: "B", q3: "B", q4: "B", q5: "B" } };
const SAMPLE_SECTIONS = ["Hero Section", "ข้อมูลสำคัญทางการเงิน", "ราคาหลักทรัพย์", "เอกสารนักลงทุน"];

// Motion (globals.css .mb-*): tiles assemble on a diagonal (--d), each plays its content
// once (--j). Hover lifts the tile and names the step that produces it.
type Vars = CSSProperties & Record<`--${string}`, string | number>;
const v = (vars: Record<string, number>): Vars => Object.fromEntries(Object.entries(vars).map(([k, n]) => [`--${k}`, n])) as Vars;

// dark tiles take their background on the card itself (bg), so the rounded corners are one
// painted surface: no separate layer underneath that could peek out at an edge.
const Tile = ({ label, step, d, dark, bg, className = "", children }: { label: string; step: number; d: number; dark?: boolean; bg?: string; className?: string; children: ReactNode }) => (
  <div className={`mb-tile flex min-w-0 ${className}`} style={v({ d })}>
    <div className={`mb-card group relative flex w-full min-w-0 flex-col rounded-[20px] border p-4 sm:p-5 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(20,22,19,0.22)] ${
      dark ? "border-transparent text-white" : "border-black/[0.06] bg-white hover:border-black/[0.1]"
    }`} style={bg ? { background: bg } : undefined}>
      <p className={`text-[12px] font-semibold ${dark ? "text-white/60" : "text-ir-t3"}`}>{label}</p>
      {/* Sits on the top edge so it never takes layout space. */}
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-0 z-10 hidden sm:block -translate-y-[30%] whitespace-nowrap rounded-full bg-ir-dark px-2.5 py-0.5 text-[11px] font-semibold text-white opacity-0 ring-1 ring-white/20 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1/2 group-hover:opacity-100">
        จากขั้นที่ {step} · {FLOW_STEPS[step - 1]}
      </span>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </div>
  </div>
);

// ── Moodboard: the deliverable as a bento of the client's own decisions ─────────────
// No website mock: the Direction leads (large, in its own colours and heading font), and
// around it what it is made of: palette, type, imagery, the five picks behind it, who it is
// for and the homepage order. Everything is read from the system's data.
export function Moodboard({ company }: { company: string }) {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  const pair = FONT_PAIRINGS[SAMPLE.dir];
  const style = VISUAL_STYLES[SAMPLE.dir];
  const photos = style.shots.slice(0, 3);
  const audience = IR_AUDIENCES.find((a) => a.id === "institutional")!;
  const goals = BUSINESS_GOALS.filter((g) => !g.hidden).slice(0, 2);
  const name = company.trim() || "บริษัทของคุณ";
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

  return (
    // data-mb="wait" holds the assembly until the figure is on screen (it sits below the fold).
    <figure ref={ref} data-mb="wait" className="mbw relative m-0">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-6 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
        {/* Direction — the lead tile, in the Direction's own colours and heading font */}
        <Tile label="แนวทางการออกแบบ" step={3} d={0} dark bg={d.bg} className="col-span-2 md:col-span-6 lg:col-span-5 lg:row-span-2">
          <p className="mb-item text-[13px] text-white/70" style={v({ j: 0 })}>สำหรับ <span className="font-semibold text-white">{name}</span></p>
          <p className="mb-item mt-auto pt-8 text-[clamp(2.1rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: fontStack(pair.heading), ...v({ j: 1 }) }}>{d.label}</p>
          <p className="mb-item mt-3 text-[16px] text-white/85" style={v({ j: 2 })}>{d.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {[...d.mood, ...d.tags].map((t, j) => (
              <span key={t} className="mb-item rounded-full border border-white/20 bg-white/[0.08] px-2.5 py-1 text-[12px] font-medium text-white/90" style={v({ j: 3 + j * 0.5 })}>{t}</span>
            ))}
          </div>
        </Tile>

        {/* Palette */}
        <Tile label={`ชุดสี · ${d.palette}`} step={3} d={1} className="col-span-1 md:col-span-3 lg:col-span-4">
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {d.colors.slice(0, 3).map((c, j) => (
              <div key={c} className="flex min-h-[96px] flex-col justify-end" style={v({ j })}>
                <span className="mb-swatch block flex-1 rounded-[12px] ring-1 ring-inset ring-black/10" style={{ background: c, transformOrigin: "bottom" }} />
                <span className="mb-item mt-1.5 font-mono text-[11px] text-ir-t2">{c}</span>
              </div>
            ))}
          </div>
        </Tile>

        {/* Type */}
        <Tile label="ตัวอักษร" step={3} d={2} className="col-span-1 md:col-span-3 lg:col-span-3">
          <div className="flex flex-1 items-end gap-2 text-ir-t1">
            <span className="mb-item text-[clamp(2.6rem,4vw,3.4rem)] leading-none" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>Aa</span>
            <span className="mb-item text-[clamp(2.3rem,3.6vw,3rem)] leading-none" style={{ fontFamily: fontStack(pair.thai), fontWeight: 700, ...v({ j: 1 }) }}>กข</span>
          </div>
          <p className="mb-item mt-3 text-[13px] font-semibold text-ir-t1" style={v({ j: 2 })}>{pair.heading} + {pair.thai}</p>
          <p className="mb-item mt-0.5 text-[12px] leading-snug text-ir-t3" style={v({ j: 3 })}>{pair.note}</p>
        </Tile>

        {/* Imagery */}
        <Tile label="สไตล์ภาพ" step={3} d={2} className="col-span-2 md:col-span-6 lg:col-span-7">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-1.5">
            {photos.map((p, j) => (
              <div key={p.id} className="overflow-hidden rounded-[12px] bg-ir-muted">
                <img src={unsplashUrl(p.id, 420)} alt={p.cap} loading="lazy" className="mb-photo aspect-[4/3] h-full w-full object-cover" style={v({ j })} />
              </div>
            ))}
          </div>
          <p className="mb-item mt-2.5 text-[13px] leading-snug text-ir-t2" style={v({ j: 3 })}>{style.mood}</p>
        </Tile>

        {/* The five picks behind the Direction */}
        <Tile label="สิ่งที่คุณเลือก · 5 ข้อจากภาพ" step={3} d={3} className="col-span-2 md:col-span-6 lg:col-span-5">
          <ol className="grid gap-1.5">
            {QUIZ.map((q, j) => {
              const pick = SAMPLE.picks[q.id as keyof typeof SAMPLE.picks];
              const opt = pick === "A" ? q.optionA : q.optionB;
              return (
                <li key={q.id} className="flex min-w-0 items-center gap-2.5" style={v({ j })}>
                  <span className="mb-swatch h-7 w-10 shrink-0 rounded-[8px] ring-1 ring-inset ring-black/10" style={{ background: opt.preview }} />
                  <span className="mb-item min-w-0 flex-1 truncate text-[13px] text-ir-t2">{q.topic}</span>
                  <span className="mb-item shrink-0 text-[13px] font-semibold text-ir-t1">{opt.label}</span>
                  <span className="mb-num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ir-accent-soft font-mono text-[11px] font-bold text-ir-accent-text">{pick}</span>
                </li>
              );
            })}
          </ol>
        </Tile>

        {/* Who it is for */}
        <Tile label="ผู้อ่านหลัก · เป้าหมาย" step={1} d={3} className="col-span-1 md:col-span-3 lg:col-span-4">
          <p className="mb-item text-[17px] font-semibold leading-tight text-ir-t1">{audience.label}</p>
          <p className="mb-item mt-1 text-[12px] leading-snug text-ir-t3" style={v({ j: 1 })}>{audience.shapes}</p>
          <ul className="mt-3 grid gap-1.5">
            {goals.map((g, j) => (
              <li key={g.id} className="flex items-center gap-2 text-[13px] font-medium text-ir-t1" style={v({ j: 2 + j })}>
                <span className="mb-num ir-grad-fill grid h-5 w-5 shrink-0 place-items-center rounded-full text-ir-on-accent"><Tick className="h-3 w-3" /></span>
                <span className="mb-item min-w-0 truncate">{g.label}</span>
              </li>
            ))}
          </ul>
        </Tile>

        {/* Homepage order as a wireframe */}
        <Tile label="โครงหน้าแรก" step={4} d={4} className="col-span-1 md:col-span-3 lg:col-span-3">
          <ol className="grid gap-1">
            {SAMPLE_SECTIONS.map((s, j) => (
              <li key={s} className={`mb-item flex min-w-0 items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-medium ${j === 0 ? "h-9 bg-ir-dark text-ir-accent" : "h-6 bg-ir-muted text-ir-t2"}`} style={v({ j })}>
                <span className="font-mono opacity-70">{j + 1}</span><span className="truncate">{s}</span>
              </li>
            ))}
          </ol>
        </Tile>
      </div>
      <figcaption className="mt-4 text-center text-[13px] text-ir-t3" style={{ textWrap: "balance" }}>
        หมายเหตุ: ไม่ใช่ Moodboard จริง เป็นภาพอ้างอิงแนวทางที่สรุปจากคำตอบ งานออกแบบจริงเริ่มหลังทีมคุยรายละเอียดกับคุณ
      </figcaption>
    </figure>
  );
}

// ── Step gallery ───────────────────────────────────────────────────────────────
// Each mock shows only the one thing that step is about, centred with room around it —
// a hint of the screen, not a copy of it.
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="flex h-[184px] flex-col items-center justify-center overflow-hidden rounded-[16px] border border-ir-border bg-ir-bg px-5" aria-hidden="true">{children}</div>
);
const Chip = ({ on, t, children }: { on?: boolean; t?: number; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium ${on ? "sg-pick border-ir-select bg-primary-50 text-ir-t1" : "border-ir-border bg-white text-ir-t2"}`} style={t === undefined ? undefined : v({ t })}>
    {on && <Tick className="sg-check h-3 w-3 text-ir-accent-text" />}{children}
  </span>
);

// Each mock acts out its step once (globals.css .sg-*); --t orders the beats inside a card.
function MockUnderstand() {
  return (
    <Frame>
      <div className="w-full max-w-[220px] rounded-full border border-ir-border bg-white px-4 py-2 text-[13px] text-ir-t1"><span className="sg-type inline-block">บริษัทของคุณ จำกัด</span></div>
      <div className="mt-3 flex gap-1.5">
        <Chip on t={3}>{IR_AUDIENCES[1].label}</Chip>
        <Chip>{IR_AUDIENCES[0].label}</Chip>
      </div>
    </Frame>
  );
}
function MockDefine() {
  const goals = BUSINESS_GOALS.filter((g) => !g.hidden).slice(0, 2);
  return (
    <Frame>
      <div className="grid w-full max-w-[230px] gap-2">
        {goals.map((g, i) => (
          <div key={g.id} className={`flex items-center justify-between rounded-[12px] border px-3.5 py-2.5 ${i === 0 ? "sg-pick border-ir-select bg-primary-50" : "border-ir-border bg-white"}`} style={v({ t: i })}>
            <span className="truncate text-[13px] font-semibold text-ir-t1">{g.label}</span>
            {i === 0 && <span className="sg-check ir-grad-fill grid h-5 w-5 shrink-0 place-items-center rounded-full text-ir-on-accent"><Tick className="h-3 w-3" /></span>}
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
      <div className="grid w-full max-w-[250px] grid-cols-2 gap-2.5">
        {[q.optionA, q.optionB].map((o, i) => (
          <div key={o.label} className={`relative rounded-[12px] border-2 bg-white p-1 ${i === 1 ? "sg-pickbump border-ir-select" : "border-transparent"}`} style={v({ t: 1 })}>
            <div className="relative overflow-hidden rounded-[8px]" style={{ paddingTop: "70%" }}>
              <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
            </div>
            <span className={`absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full font-mono text-[12px] font-bold ${i === 1 ? "ir-grad-fill text-ir-on-accent" : "bg-white text-ir-t3 ring-1 ring-ir-border"}`}>{i === 0 ? "A" : "B"}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
function MockStructure() {
  const rows = SAMPLE_SECTIONS.slice(0, 3);
  return (
    <Frame>
      <div className="grid w-full max-w-[220px] gap-1.5">
        {rows.map((r, i) => (
          // Row 2 is dragged up past row 3, which drops back into place.
          <div key={r} className={`flex items-center gap-2 rounded-[10px] border border-ir-border bg-white px-3 py-2 ${i === 1 ? "sg-drag relative z-10 translate-x-1 shadow-[0_6px_16px_rgba(20,22,19,0.12)]" : i === 2 ? "sg-drop" : ""}`}>
            <span className="text-[12px] leading-none text-ir-t3">⋮⋮</span>
            <span className="truncate text-[13px] font-medium text-ir-t1">{r}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
function MockInspire() {
  return (
    <Frame>
      <div className="grid w-full max-w-[220px] grid-cols-2 gap-2.5">
        {["linear-gradient(135deg,#0D1B4B,#1A2E6B)", "linear-gradient(135deg,#1E3A1E,#4A8C4A)"].map((bg, i) => (
          <div key={bg} className={`sg-a relative rounded-[12px] border-2 bg-white p-1 ${i === 0 ? "border-ir-select" : "border-transparent"}`} style={v({ t: i })}>
            <div className="h-16 rounded-[8px]" style={{ background: bg }} />
            {i === 0 && <span className="sg-check ir-grad-fill absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-ir-on-accent" style={v({ t: 2 })}><Tick className="h-3 w-3" /></span>}
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
      <div className="sg-a flex w-full max-w-[230px] items-center gap-2.5 rounded-[12px] border border-ir-border bg-white px-3 py-2.5" style={v({ t: 0 })}>
        <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: d.bg }} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ir-t1">{d.label}</span>
          <span className="block text-[12px] text-ir-t3">{SAMPLE_SECTIONS.length} Section</span>
        </span>
      </div>
      <div className="sg-press mt-3 w-full max-w-[230px] rounded-full bg-ir-dark py-2 text-center text-[13px] font-semibold text-white" style={v({ t: 1.5 })}>ส่งให้ทีม IR Plus</div>
    </Frame>
  );
}

const STEPS_INFO: { mock: () => ReactNode; todo: string; how: string; optional?: boolean }[] = [
  { mock: MockUnderstand, todo: "บอกชื่อบริษัทและกลุ่มนักลงทุนหลัก", how: "พิมพ์ + เลือก" },
  { mock: MockDefine, todo: "เลือกสิ่งที่เว็บไซต์ต้องทำได้", how: "เลือกจากรายการ" },
  { mock: MockExplore, todo: "ตอบ 5 ข้อ ด้วยการเลือกภาพ A หรือ B", how: "เลือกจากภาพ" },
  { mock: MockStructure, todo: "ปรับโครงหน้าแรกที่ระบบจัดให้", how: "ระบบจัดให้ก่อน" },
  { mock: MockInspire, todo: "แนบเว็บที่ชอบ ถ้ามี", how: "ไม่บังคับ", optional: true },
  { mock: MockDeliver, todo: "ตรวจภาพรวม แล้วกดส่ง", how: "ตรวจ + ส่ง" },
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
    <div ref={root} data-busy={busy || undefined} data-phase={phase} className="bm relative overflow-clip rounded-[24px] sm:rounded-[28px] bg-ir-dark p-3 sm:p-5 lg:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div aria-hidden="true" className="bm-glow pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-5 lg:gap-y-3">
        {/* ① raw input */}
        <div className="lg:col-start-1 lg:row-start-1"><ColHead n="01" title="วัตถุดิบ" sub="สิ่งที่คุณตอบ" /></div>
        <div className="lg:col-start-1 lg:row-start-2">
          <ol className="grid gap-2">
            {inputs.map((x, i) => (
              <li key={x.q} ref={(n) => { ins.current[i] = n; }} data-state={step === i + 1 && phase === "in" ? "active" : step > i + 1 || (step === i + 1 && phase !== "in") ? "done" : "idle"}
                className="bm-in flex items-start gap-2.5 rounded-[14px] border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="bm-in-body min-w-0 flex-1">
                  <p className="text-[11px] text-white/50">ขั้นที่ {i + 1} · {x.name}</p>
                  <p className="mt-0.5 text-[13px] font-semibold text-white">{x.q}</p>
                  <div className="mt-1.5">{x.body}</div>
                </div>
                {/* reserved slot: the tick appears in place, nothing shifts */}
                <span aria-hidden="true" className="bm-used ir-grad-fill grid h-6 w-6 shrink-0 place-items-center rounded-full text-ir-on-accent"><Tick /></span>
              </li>
            ))}
          </ol>
        </div>

        {/* ② the machine */}
        <div className="bm-chamber relative mt-1 lg:mt-0 h-[170px] rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] lg:col-start-2 lg:row-start-2 lg:h-auto lg:min-h-[300px]">
          <span aria-hidden="true" className="bm-scan pointer-events-none absolute inset-x-3 top-0 h-px" />
          <div ref={core} className="absolute left-1/2 top-1/2 h-0 w-0">
            <div aria-hidden="true" className="bm-ring absolute h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
            <div aria-hidden="true" className="absolute h-[82px] w-[82px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-ir-dark" />
            <div className="bm-core absolute grid h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full bg-white">
              <img src="/irplus-logo.jpg" alt="IR Plus" width={44} height={44} className="h-11 w-11 object-contain" />
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
            <div className="relative rounded-[18px] bg-white p-3.5 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] sm:p-4">
              <div className="flex items-center justify-between gap-3 border-b border-ir-border pb-2.5">
                <div>
                  <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-ir-t3">REQUIREMENT</p>
                  <p className="text-[15px] font-semibold text-ir-t1">เว็บไซต์ IR · บริษัทของคุณ</p>
                </div>
                <span data-on={step === 5} className="bm-ready inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-1 pr-3 text-[13px] font-semibold">
                  <span className="bm-ready-dot grid h-6 w-6 place-items-center rounded-full"><Tick /></span>
                  {step === 5 ? "พร้อมส่ง" : "รอเรียบเรียง"}
                </span>
              </div>
              <div className="divide-y divide-ir-border">
                {blocks.map((b, i) => (
                  <div key={b.label} ref={(n) => { outs.current[i] = n; }} data-on={step > i + 1 || (step === i + 1 && phase === "out")} className="bm-blk relative py-2">
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

// ── Hero fragments ─────────────────────────────────────────────────────────────
// Eight pieces of the deliverable, four per side, spread from the top of the hero down to
// the "เริ่มจากชื่อบริษัทของคุณ" line (measured from the page, so it follows the headline's
// wrapping), staggered so the two sides never line up. Three depth planes make it read as
// real space:
//   near — at the screen edges, a touch larger, crisp, more opaque, moves most
//   mid  — normal size and opacity
//   far  — nearer the headline, smaller, softly blurred, faint, barely moves
// Background texture, not content: aria-hidden, no pointer events, behind everything,
// kept clear of the headline, description and form. xl: all eight; lg: the four at the
// edges (top and bottom of each side); smaller screens: none (no room beside the content).
// Motion: globals.css .hf-*; reduced motion = still.
type Plane = "near" | "mid" | "far";
const PLANE: Record<Plane, { depth: number; dur: number }> = { near: { depth: 16, dur: 9 }, mid: { depth: 8, dur: 11.5 }, far: { depth: 3, dur: 14 } };
const F = ({ i, plane, r, className, children }: { i: number; plane: Plane; r: number; className: string; children: ReactNode }) => (
  <div className={`hf hf-${plane} absolute ${className}`} style={{ ...v({ i, depth: PLANE[plane].depth, dur: PLANE[plane].dur + (i % 3) }), rotate: `${r}deg` }}>{children}</div>
);
const glass = "rounded-[12px] border border-white/70 bg-white/50 shadow-[0_10px_28px_-16px_rgba(20,22,19,0.3)] backdrop-blur-sm";

export function HeroFragments() {
  const ref = useRef<HTMLDivElement>(null);
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  const pair = FONT_PAIRINGS[SAMPLE.dir];
  const photo = VISUAL_STYLES[SAMPLE.dir].shots[0];
  const picks = Object.values(SAMPLE.picks);

  // The field ends at the first line of the form ("เริ่มจากชื่อบริษัทของคุณ"), or at the top
  // of the resume card when the visitor has a draft in progress.
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const fit = () => {
      const stop = host.querySelector("label[for='company-input']") ?? host.querySelector(":scope > div.mx-auto");
      if (!stop) return;
      const h = stop.getBoundingClientRect().bottom - host.getBoundingClientRect().top;
      if (h > 0) el.style.height = `${Math.round(h)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = host.getBoundingClientRect();
        el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
    };
    const onLeave = () => { el.style.setProperty("--px", "0"); el.style.setProperty("--py", "0"); };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => { cancelAnimationFrame(raf); host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave); };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="hf-layer pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[65%] lg:block">
      {/* ── left: 4 / 30 / 58 / 86 % ── */}
      <F i={0} plane="near" r={-6} className="left-[1%] top-[4%]">
        <div className={`${glass} px-2.5 py-2`}>
          <div className="flex gap-1">{d.colors.map((c) => <span key={c} className="h-6 w-6 rounded-[7px] ring-1 ring-inset ring-black/10" style={{ background: c }} />)}</div>
          <p className="mt-1 text-[10px] font-medium text-ir-t3">{d.palette}</p>
        </div>
      </F>
      <F i={1} plane="far" r={-3} className="left-[9%] top-[30%] hidden xl:block">
        <div className={`${glass} flex gap-0.5 rounded-full p-1`}>
          {picks.map((p, j) => <span key={j} className="grid h-4 w-4 place-items-center rounded-full bg-white/80 font-mono text-[9px] font-bold text-ir-t3">{p}</span>)}
        </div>
      </F>
      <F i={2} plane="mid" r={4} className="left-[3%] top-[58%] hidden xl:block">
        <div className={`${glass} flex items-center gap-1 rounded-full py-1 pl-1 pr-2.5`}>
          <span className="grid h-4 w-4 place-items-center rounded-full bg-ir-accent/80 text-ir-on-accent"><Tick className="h-2.5 w-2.5" /></span>
          <span className="text-[11px] font-semibold text-ir-t2">นักลงทุนสถาบัน</span>
        </div>
      </F>
      <F i={3} plane="near" r={5} className="left-[2%] top-[84%]">
        <div className={`${glass} p-1`}>
          <img src={unsplashUrl(photo.id, 200)} alt="" loading="lazy" className="h-[50px] w-[70px] rounded-[8px] object-cover" />
        </div>
      </F>

      {/* ── right: 10 / 36 / 62 / 88 % (offset from the left) ── */}
      <F i={4} plane="mid" r={5} className="right-[2%] top-[10%]">
        <div className={`${glass} px-2.5 py-1.5`}>
          <span className="text-[22px] leading-none text-ir-t2" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>Aa <span style={{ fontFamily: fontStack(pair.thai) }}>กข</span></span>
        </div>
      </F>
      <F i={5} plane="near" r={-5} className="right-[7%] top-[36%] hidden xl:block">
        <span className={`${glass} inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[12px] font-semibold text-ir-t2`}>
          <span className="grid h-5 w-5 place-items-center rounded-full bg-ir-dark/80 text-ir-accent"><Tick className="h-3 w-3" /></span>พร้อมส่ง
        </span>
      </F>
      <F i={6} plane="far" r={4} className="right-[10%] top-[62%] hidden xl:block">
        <div className={`${glass} w-[84px] p-1.5`}>
          <span className="block h-2.5 rounded-[3px] bg-ir-dark/70" />
          <span className="mt-1 grid grid-cols-3 gap-0.5">{[0, 1, 2].map((j) => <span key={j} className="h-2 rounded-[2px] bg-ir-accent/50" />)}</span>
          <span className="mt-1 block h-1.5 rounded-[2px] bg-ir-muted" />
        </div>
      </F>
      <F i={7} plane="near" r={-3} className="right-[2%] top-[88%]">
        <div className={`${glass} flex gap-1 rounded-full px-2 py-1.5`}>
          {[0, 1, 2, 3, 4, 5].map((j) => <span key={j} className={`h-1.5 w-4 rounded-full ${j < 4 ? "ir-grad-fill" : "bg-ir-border"}`} />)}
        </div>
      </F>
    </div>
  );
}
