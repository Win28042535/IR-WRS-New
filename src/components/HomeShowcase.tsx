"use client";
// ── Homepage showcase ──
// Moodboard: the whole deliverable in one frame — the website itself, plus the Direction,
// its colors, its font pairing, its photo style and the homepage order. Everything is read
// from the system's own data, so the example is exactly what the flow produces.
// StepGallery: one small, faithful mock of each step's screen, so a first-time client
// sees what each step asks for and what it looks like before they get there.

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { BUSINESS_GOALS, DIRECTIONS, FLOW_STEPS, IR_AUDIENCES, QUIZ, VISUAL_STYLES, unsplashUrl } from "@/lib/data";
import { FONT_PAIRINGS, fontStack } from "@/lib/fonts";
import { ExploreMock } from "@/components/ExploreMock";
import { DirectionPreview, DirectionPhonePreview } from "@/components/DirectionPreview";
import { IconCheck } from "@/components/icons";

const SAMPLE = { dir: "premium-corporate", picks: { q1: "B", q2: "B", q3: "B", q4: "B", q5: "A" } as const };
const SAMPLE_SECTIONS = ["Hero Section", "ข้อมูลสำคัญทางการเงิน", "ราคาหลักทรัพย์", "เอกสารนักลงทุน"];

const Tile = ({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) => (
  <div className={`min-w-0 rounded-[18px] border border-black/[0.06] bg-white p-3.5 sm:p-4 ${className}`}>
    <p className="text-[12px] font-semibold text-ir-t3">{label}</p>
    <div className="mt-2">{children}</div>
  </div>
);

export function Moodboard({ company }: { company: string }) {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  const pair = FONT_PAIRINGS[SAMPLE.dir];
  const photos = VISUAL_STYLES[SAMPLE.dir].shots.slice(0, 3);
  const swatches = d.colors.slice(0, 3);

  const direction = (
    <Tile label="แนวทางการออกแบบ">
      <p className="text-[17px] font-semibold leading-tight text-ir-t1">{d.label}</p>
      <p className="mt-1 text-[13px] leading-snug text-ir-t2">{d.tagline}</p>
    </Tile>
  );
  const colors = (
    <Tile label="ชุดสี">
      <ul className="grid gap-1.5">
        {swatches.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <span className="h-5 w-8 shrink-0 rounded-[6px] ring-1 ring-black/10" style={{ background: c }} />
            <span className="font-mono text-[12px] text-ir-t2">{c}</span>
          </li>
        ))}
      </ul>
    </Tile>
  );
  const type = (
    <Tile label="ตัวอักษร">
      <div className="flex items-baseline gap-2 text-ir-t1">
        <span className="text-[32px] leading-none" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>Aa</span>
        <span className="text-[30px] leading-none" style={{ fontFamily: fontStack(pair.thai), fontWeight: 700 }}>กข</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-ir-t3">{pair.heading} + {pair.thai}</p>
    </Tile>
  );
  const imagery = (
    <Tile label="สไตล์ภาพ">
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((p) => (
          <img key={p.id} src={unsplashUrl(p.id, 240)} alt={p.cap} loading="lazy" className="aspect-[4/3] w-full rounded-[8px] object-cover bg-ir-muted" />
        ))}
      </div>
    </Tile>
  );
  const sections = (
    <Tile label="โครงหน้าแรก">
      <ol className="grid gap-1">
        {SAMPLE_SECTIONS.map((s, i) => (
          <li key={s} className="flex items-center gap-2 text-[13px] text-ir-t1">
            <span className="grid w-5 h-5 shrink-0 place-items-center rounded-full bg-ir-accent-soft font-mono text-[12px] font-bold text-ir-accent-text">{i + 1}</span>
            <span className="truncate">{s}</span>
          </li>
        ))}
      </ol>
    </Tile>
  );

  return (
    <figure className="relative m-0">
      <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ir-dark px-3 py-1 text-[12px] font-semibold text-white">
        ตัวอย่างสิ่งที่คุณจะได้
      </span>
      <div className="rounded-[26px] sm:rounded-[30px] border border-black/[0.06] bg-ir-bg/90 p-2.5 sm:p-3 shadow-[0_30px_80px_rgba(20,22,19,0.12)] backdrop-blur">
        {/* Phones: phone mock beside a stack of tiles */}
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] gap-2.5 sm:hidden">
          <div className="relative overflow-hidden rounded-[18px] border border-black/[0.06]" style={{ paddingTop: `${(860 / 460) * 100}%` }}>
            <div className="absolute inset-0"><DirectionPhonePreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} company={company} /></div>
          </div>
          <div className="grid content-start gap-2.5">{direction}{colors}{type}</div>
          <div className="col-span-2 grid grid-cols-2 gap-2.5">{imagery}{sections}</div>
        </div>
        {/* sm and up: the website large, the system around it */}
        <div className="hidden sm:grid grid-cols-6 gap-3">
          <div className="col-span-6 relative overflow-hidden rounded-[20px] border border-black/[0.06]" style={{ paddingTop: "56.42%" }}>
            <div className="absolute inset-0"><DirectionPreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} company={company} /></div>
          </div>
          <div className="col-span-2">{direction}</div>
          <div className="col-span-2">{colors}</div>
          <div className="col-span-2">{type}</div>
          <div className="col-span-3">{imagery}</div>
          <div className="col-span-3">{sections}</div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[14px] text-ir-t3">สรุปจากคำตอบของคุณ: หน้าเว็บ แนวทาง สี ตัวอักษร ภาพ และโครงหน้าแรก</figcaption>
    </figure>
  );
}

// ── Step gallery ───────────────────────────────────────────────────────────────
// Each mock is a scaled-down sketch of the real screen, in the app's own visual language.
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="h-[184px] overflow-hidden rounded-[16px] border border-ir-border bg-ir-bg p-3" aria-hidden="true">{children}</div>
);
const Chip = ({ on, children }: { on?: boolean; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium ${on ? "border-ir-select bg-primary-50 text-ir-t1" : "border-ir-border bg-white text-ir-t2"}`}>
    {on && <IconCheck width={14} height={14} className="text-ir-accent-text" />}{children}
  </span>
);

function MockUnderstand() {
  const aud = IR_AUDIENCES.slice(0, 4).map((a) => a.label);
  return (
    <Frame>
      <p className="text-[12px] font-semibold text-ir-t1">ชื่อบริษัท / องค์กร</p>
      <div className="mt-1.5 rounded-full border border-ir-border bg-white px-3 py-1.5 text-[12px] text-ir-t1">บริษัทของคุณ จำกัด (มหาชน)</div>
      <p className="mt-3 text-[12px] font-semibold text-ir-t1">กลุ่มเป้าหมาย</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{aud.map((a, i) => <Chip key={a} on={i < 2}>{a}</Chip>)}</div>
    </Frame>
  );
}
function MockDefine() {
  const goals = BUSINESS_GOALS.filter((g) => !g.hidden).slice(0, 3);
  return (
    <Frame>
      <div className="grid gap-1.5">
        {goals.map((g, i) => (
          <div key={g.id} className={`flex items-center justify-between rounded-[12px] border px-3 py-2 ${i < 2 ? "border-ir-select bg-primary-50" : "border-ir-border bg-white"}`}>
            <span className="truncate text-[12px] font-semibold text-ir-t1">{g.label}</span>
            {i < 2 && <span className="grid w-5 h-5 shrink-0 place-items-center rounded-full bg-ir-accent text-ir-on-accent"><IconCheck width={14} height={14} /></span>}
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
          <div key={o.label} className={`rounded-[10px] border bg-white p-1 ${i === 1 ? "border-ir-select" : "border-ir-border"}`}>
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
          return (
            <div key={r} className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-1.5 ${fixed ? "border-transparent bg-ir-muted" : "border-ir-border bg-white"} ${i === 2 ? "shadow-[0_6px_16px_rgba(20,22,19,0.12)] translate-x-1" : ""}`}>
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
          <div key={t} className="rounded-[12px] border border-ir-border bg-white p-1.5">
            <div className="h-12 rounded-[8px]" style={{ background: i ? "linear-gradient(135deg,#1E3A1E,#4A8C4A)" : "linear-gradient(135deg,#0D1B4B,#1A2E6B)" }} />
            <p className="mt-1 truncate text-[12px] font-semibold text-ir-t1">{t}</p>
            <span className={`mt-1 block rounded-full py-0.5 text-center text-[12px] font-semibold ${i === 0 ? "bg-ir-dark text-white" : "border border-ir-border text-ir-t2"}`}>{i === 0 ? "เลือกแล้ว" : "เลือก"}</span>
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
          {["ชื่อ-นามสกุล", "อีเมล", "โทรศัพท์"].map((f) => (
            <div key={f} className="truncate rounded-full border border-ir-border bg-white px-2.5 py-1 text-[12px] text-ir-t3">{f}</div>
          ))}
        </div>
      </div>
      <div className="mt-2.5 rounded-full bg-ir-dark py-1.5 text-center text-[12px] font-semibold text-white">ยืนยันและส่งให้ทีม IR Plus</div>
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

export function StepGallery() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FLOW_STEPS.map((name, i) => {
        const s = STEPS_INFO[i];
        const Mock = s.mock;
        return (
          <li key={name} className="flex flex-col rounded-[24px] border border-black/[0.06] bg-ir-card p-3.5">
            <Mock />
            <div className="px-1.5 pt-4 pb-1.5">
              <div className="flex items-center gap-2.5">
                <span className="grid w-8 h-8 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-[13px] font-bold text-ir-accent">{i + 1}</span>
                <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ir-t1">{name}</h3>
                <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${s.optional ? "bg-ir-muted text-ir-t2" : "bg-ir-accent-soft text-ir-accent-text"}`}>{s.how}</span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-ir-t2">{s.todo}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
