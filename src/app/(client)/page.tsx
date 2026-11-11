"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { DIRECTIONS, FLOW_STEPS, QUIZ } from "@/lib/data";
import { IconCheck, IconArrowRight } from "@/components/icons";
import { ExploreMock } from "@/components/ExploreMock";
import { DirectionPreview, DirectionPhonePreview } from "@/components/DirectionPreview";
import { useStartFlow } from "@/lib/useStartFlow";

const balance = { textWrap: "balance" } as CSSProperties;

// ── Homepage ──
// Written for someone who was sent the link with no one to explain it. Above the fold it
// answers: what is this (prepare your IR website brief for IR Plus), who it's for, what
// to press, how long it takes. Then: what to have ready, the same 6 steps the flow's step
// bar shows, what happens after sending, and a short FAQ. Same mood as before — faint grid,
// lime glow, black pill CTA with the lime arrow disc.

const FACTS = ["ไม่เกิน 20 นาที", "6 ขั้นตอน", "บันทึกอัตโนมัติ กลับมาทำต่อได้", "ไม่ต้องสมัครสมาชิก"];

const PREP = [
  { title: "ชื่อบริษัท และเว็บไซต์ปัจจุบัน", note: "ถ้ายังไม่มีเว็บไซต์ ข้ามได้" },
  { title: "กลุ่มนักลงทุนที่สำคัญ", note: "เช่น นักลงทุนรายย่อย สถาบัน นักวิเคราะห์" },
  { title: "เว็บไซต์ที่ชอบ", note: "ไม่บังคับ หรือให้ระบบแนะนำตัวอย่างให้" },
  { title: "ชื่อ อีเมล และเบอร์โทรของผู้ติดต่อ", note: "ให้ทีม IR Plus ติดต่อกลับ" },
];

// One line per step, in the flow's own step names (FLOW_STEPS) so the inside matches.
const STEP_DESC = [
  "บอกชื่อบริษัท เว็บไซต์เดิม และกลุ่มนักลงทุนที่เว็บไซต์ต้องสื่อสารด้วย",
  "เลือกสิ่งที่เว็บไซต์ IR ต้องทำให้ได้ เช่น สร้างความน่าเชื่อถือ หรือสื่อสารเรื่องความยั่งยืน",
  "ตอบคำถามจากภาพ 5 ข้อ แบบ A หรือ B ระบบสรุปเป็นแนวทางการออกแบบ (Design Direction)",
  "เลือกส่วนต่างๆ ของหน้าแรกและจัดลำดับ ระบบจัดโครงที่เหมาะกับคุณไว้ให้ก่อน",
  "วางลิงก์หรือรูปเว็บที่ชอบ หรือให้ระบบเสนอเว็บ IR ตัวอย่าง ขั้นนี้ข้ามได้",
  "ดูภาพรวมเว็บไซต์ที่ได้ กรอกข้อมูลผู้ติดต่อ แล้วกดส่งให้ทีม IR Plus",
];

const AFTER = [
  { title: "คุณกดส่ง", desc: "ทีม IR Plus ได้รับภาพรวม แนวทางการออกแบบ สี ฟอนต์ และโครงหน้าแรกที่คุณเลือก" },
  { title: "ทีมติดต่อกลับ", desc: "ภายใน 1–2 วันทำการ เพื่อคุยรายละเอียดและสิ่งที่อยากปรับเพิ่ม" },
  { title: "เริ่มออกแบบ", desc: "ทีมออกแบบเริ่มงานจากแนวทางที่คุณเลือก ไม่ต้องเริ่มอธิบายใหม่" },
];

const FAQ = [
  { q: "ต้องมีความรู้ด้านการออกแบบไหม", a: "ไม่ต้อง ทุกข้อตอบด้วยการเลือกจากภาพหรือตัวเลือกที่อธิบายไว้ ระบบสรุปเป็นแนวทางการออกแบบให้เอง" },
  { q: "ใครในบริษัทควรเป็นคนกรอก", a: "ผู้ที่ดูแลงานนักลงทุนสัมพันธ์หรือเว็บไซต์ IR เช่น ฝ่าย IR ฝ่ายการตลาด หรือเลขานุการบริษัท" },
  { q: "ทำไม่เสร็จ ปิดหน้าไปก่อนได้ไหม", a: "ได้ ข้อมูลบันทึกอัตโนมัติในเบราว์เซอร์นี้ กลับมาที่หน้านี้ด้วยเครื่องและเบราว์เซอร์เดิม แล้วกด \"ทำต่อ\"" },
  { q: "ส่งไปแล้ว แก้ไขได้ไหม", a: "ได้ แจ้งทีม IR Plus ตอนที่ทีมติดต่อกลับ ทีมจะปรับให้ก่อนเริ่มออกแบบ" },
];

// The deliverable shown under the hero — a real Direction preview, labelled as an example.
const SAMPLE = { dir: "premium-corporate", picks: { q1: "B", q2: "B", q3: "B", q4: "B", q5: "A" } as const };

export default function Landing() {
  const flow = useStartFlow();

  return (
    <div className="relative overflow-hidden">
      {/* Backdrop — 64px grid fading out from the top, lime glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        style={{
          backgroundImage: "linear-gradient(#E9EBE4 1px, transparent 1px), linear-gradient(90deg, #E9EBE4 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-280px] h-[680px] w-[1100px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(185,230,4,0.38), rgba(185,230,4,0) 70%)" }}
      />

      {/* ── Hero: what · who · what to press · how long ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-10 sm:pt-16 text-center ir-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-ir-t2 shadow-sm backdrop-blur">
          <span className="rounded-full bg-ir-dark px-2.5 py-0.5 text-[12px] font-semibold text-white">IR Plus</span>
          สำหรับลูกค้า IR Plus · บริษัทจดทะเบียน
        </span>
        <h1
          className="mx-auto mt-7 max-w-[980px] text-[clamp(2.2rem,5.4vw,4.2rem)] font-semibold leading-[1.16] tracking-[-0.035em]"
          style={balance}
        >
          <span className="whitespace-nowrap">เตรียมข้อมูลเว็บไซต์ IR</span>{" "}
          <span className="whitespace-nowrap">ของบริษัทคุณ</span>{" "}
          <span className="relative isolate inline-block whitespace-nowrap">
            <span aria-hidden="true" className="absolute inset-x-[-0.12em] bottom-[0.08em] top-[0.42em] -z-10 rounded-[0.18em] bg-ir-accent" />
            ก่อนเริ่มออกแบบ
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[660px] text-[16px] sm:text-[18px] leading-relaxed text-ir-t2" style={balance}>
          ตอบคำถาม 6 ขั้นตอน เลือกสไตล์จากภาพ แล้วส่งให้ทีม IR Plus ใช้เริ่มออกแบบเว็บไซต์ของคุณ ไม่ต้องมีความรู้ด้านการออกแบบ
        </p>

        <div className="mt-8">
          <StartActions flow={flow} secondary={<a href="#steps" className={secondaryCls}>ดูขั้นตอนทั้งหมด</a>} />
        </div>

        <ul className="mx-auto mt-6 flex max-w-[760px] flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-ir-t2">
          {FACTS.map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <IconCheck width={20} height={20} className="text-ir-accent-text" />
              {t}
            </li>
          ))}
        </ul>

        <HeroPreview />
      </section>

      {/* ── Before you start ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-24 sm:pt-28">
        <div className="grid gap-8 rounded-[28px] border border-black/[0.06] bg-ir-card p-7 sm:p-10 md:grid-cols-[1fr_1.5fr] md:items-start">
          <div>
            <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-[1.2] tracking-[-0.03em]" style={balance}>ก่อนเริ่ม เตรียมอะไรบ้าง</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ir-t2">ไม่ต้องเตรียมเอกสารหรือ Brief แค่รู้ข้อมูล 4 อย่างนี้ก็เริ่มได้</p>
          </div>
          <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {PREP.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="mt-0.5 grid w-7 h-7 shrink-0 place-items-center rounded-full bg-ir-accent text-ir-on-accent">
                  <IconCheck width={18} height={18} />
                </span>
                <span>
                  <span className="block text-[16px] font-semibold text-ir-t1">{p.title}</span>
                  <span className="mt-0.5 block text-[14px] text-ir-t3">{p.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── The 6 steps — same names as the flow's step bar ── */}
      <section id="steps" className="relative mx-auto max-w-[1240px] scroll-mt-20 px-5 sm:px-8 pt-24 sm:pt-28">
        <div className="text-center">
          <h2 className="mx-auto max-w-[24ch] text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
            <span className="whitespace-nowrap">6 ขั้นตอน</span>{" "}<span className="whitespace-nowrap">จากคำตอบ</span>{" "}<span className="whitespace-nowrap">สู่แนวทางเว็บไซต์</span>
          </h2>
          <p className="mt-3 text-[16px] text-ir-t2">ชื่อขั้นตอนตรงกับแถบด้านบนตอนกรอกจริง</p>
        </div>
        <ol className="relative mx-auto mt-12 max-w-[920px]">
          {FLOW_STEPS.map((name, i) => (
            <li key={name} className="relative grid grid-cols-[44px_1fr] gap-4 pb-9 last:pb-0 sm:gap-6">
              {i < FLOW_STEPS.length - 1 && <span aria-hidden="true" className="absolute left-[21px] top-12 bottom-1 w-px bg-ir-border" />}
              <span className="grid w-11 h-11 place-items-center rounded-full bg-ir-dark font-mono text-[15px] font-bold text-ir-accent">{String(i + 1).padStart(2, "0")}</span>
              <div className="pt-1.5">
                <h3 className="text-[20px] font-semibold tracking-[-0.02em]">
                  {name}
                  {i === 4 && <span className="ml-2 align-middle rounded-full bg-ir-muted px-2.5 py-0.5 text-[12px] font-medium text-ir-t2">ข้ามได้</span>}
                </h3>
                <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-ir-t2">{STEP_DESC[i]}</p>
                {i === 2 && <QuizPeek />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── After you send ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-24 sm:pt-28">
        <div className="rounded-[28px] bg-ir-dark p-7 sm:p-10 text-white">
          <h2 className="text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-white" style={balance}>หลังจากกดส่ง</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {AFTER.map((a, i) => (
              <li key={a.title} className="relative">
                <span className="grid w-9 h-9 place-items-center rounded-full bg-ir-accent font-mono text-[14px] font-bold text-ir-on-accent">{i + 1}</span>
                <h3 className="mt-4 text-[18px] font-semibold text-white">{a.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">{a.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative mx-auto max-w-[920px] px-5 sm:px-8 pt-24 sm:pt-28">
        <h2 className="text-center text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-[1.2] tracking-[-0.03em]">คำถามที่พบบ่อย</h2>
        <div className="mt-8 divide-y divide-ir-border rounded-[24px] border border-black/[0.06] bg-ir-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-ir-t1 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="grid w-8 h-8 shrink-0 place-items-center rounded-full bg-ir-muted text-[18px] text-ir-t2 transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 pr-12 text-[15px] leading-relaxed text-ir-t2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 py-24 sm:py-28">
        <div className="relative overflow-hidden rounded-[32px] bg-ir-dark px-6 py-16 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-200px] h-[400px] w-[700px] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(185,230,4,0.22), rgba(185,230,4,0) 70%)" }}
          />
          <h2 className="relative mx-auto max-w-[18ch] text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-white" style={balance}>
            พร้อมเริ่มเว็บไซต์ IR ใหม่ขององค์กรคุณ
          </h2>
          <p className="relative mt-4 text-[16px] text-white/75">ไม่เกิน 20 นาที · ทีม IR Plus ติดต่อกลับภายใน 1–2 วันทำการ</p>
          <div className="relative mt-8 flex justify-center">
            <StartActions flow={flow} onDark />
          </div>
        </div>
        <p className="mt-10 text-center text-[13px] text-ir-t3">IR Plus by efin · Website Requirement System</p>
      </section>
    </div>
  );
}

const secondaryCls =
  "inline-flex h-[52px] items-center rounded-full border border-black/10 bg-white/70 px-6 text-[15px] font-medium text-ir-t1 backdrop-blur transition-colors hover:bg-white";

// Primary action. With work in progress it resumes (starting over replaces the draft, so
// that takes a second, explicit tap); otherwise it starts.
function StartActions({ flow, secondary, onDark }: { flow: ReturnType<typeof useStartFlow>; secondary?: ReactNode; onDark?: boolean }) {
  const [confirmNew, setConfirmNew] = useState(false);
  if (!flow.inProgress) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <PrimaryCta onClick={flow.startNew} onDark={onDark}>เริ่มเลย</PrimaryCta>
        {secondary}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <PrimaryCta onClick={flow.resume} onDark={onDark}>ทำต่อ · ขั้นที่ {flow.step} {flow.stepName}</PrimaryCta>
      <p className={`text-[14px] ${onDark ? "text-white/70" : "text-ir-t3"}`}>
        {flow.company ? `${flow.company} · ` : ""}บันทึกไว้ในเบราว์เซอร์นี้
      </p>
      {confirmNew ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`text-[14px] ${onDark ? "text-white/80" : "text-ir-t2"}`}>ข้อมูลที่กรอกไว้จะหายไป</span>
          <button type="button" onClick={flow.startNew} className="min-h-11 rounded-full bg-red-600 px-4 text-[14px] font-semibold text-white hover:bg-red-700">ยืนยันเริ่มใหม่</button>
          <button type="button" onClick={() => setConfirmNew(false)} className={`min-h-11 rounded-full px-4 text-[14px] font-medium ${onDark ? "text-white" : "text-ir-t1"}`}>ยกเลิก</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmNew(true)} className={`min-h-11 px-3 text-[14px] font-medium underline underline-offset-4 ${onDark ? "text-white/80" : "text-ir-t2"}`}>
          เริ่มใหม่ตั้งแต่ต้น
        </button>
      )}
    </div>
  );
}

// Black pill with a lime arrow disc (production WRS hero CTA). On a dark band it flips to
// a white pill so it still reads as the primary action.
function PrimaryCta({ children, onClick, onDark }: { children: ReactNode; onClick: () => void; onDark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex min-h-[52px] items-center gap-3 rounded-full py-2 pl-7 pr-2 text-[15px] font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 ${
        onDark ? "bg-white text-ir-t1 hover:bg-ir-bg" : "bg-ir-dark text-white shadow-[0_10px_30px_rgba(20,22,19,0.18)] hover:bg-neutral-800"
      }`}
    >
      {children}
      <span className="grid w-9 h-9 shrink-0 place-items-center rounded-full bg-ir-accent text-ir-on-accent transition-transform duration-200 group-hover:translate-x-1">
        <IconArrowRight width={24} height={24} />
      </span>
    </button>
  );
}

// The deliverable: the same overview the Deliver step shows, labelled as an example.
function HeroPreview() {
  const d = DIRECTIONS.find((x) => x.id === SAMPLE.dir)!;
  return (
    <figure className="relative mx-auto mt-14 sm:mt-16 max-w-[1080px] m-0">
      <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ir-dark px-3 py-1 text-[12px] font-semibold text-white">ตัวอย่างสิ่งที่คุณจะได้</span>
      <div className="overflow-hidden rounded-[24px] sm:rounded-[30px] border border-black/[0.06] shadow-[0_30px_80px_rgba(20,22,19,0.10)]">
        <div className="sm:hidden relative mx-auto" style={{ paddingTop: `${(860 / 460) * 100}%` }}>
          <div className="absolute inset-0"><DirectionPhonePreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} /></div>
        </div>
        <div className="hidden sm:block relative" style={{ paddingTop: "56.42%" }}>
          <div className="absolute inset-0"><DirectionPreview directionId={SAMPLE.dir} picks={SAMPLE.picks} colors={d.colors} label={d.label} /></div>
        </div>
      </div>
      <figcaption className="mt-3 text-[14px] text-ir-t3">ภาพรวมเว็บไซต์ที่สร้างจากคำตอบ สี ฟอนต์ และภาพตามแนวทางที่ได้</figcaption>
    </figure>
  );
}

// A glimpse of the Explore step: one real A/B pair from the quiz.
function QuizPeek() {
  const q = QUIZ[0];
  return (
    <div className="mt-4 max-w-[520px] rounded-[18px] border border-ir-border bg-ir-card p-3">
      <p className="text-[14px] font-semibold text-ir-t1">{q.question}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {[q.optionA, q.optionB].map((o, i) => (
          <div key={o.label}>
            <div className="relative overflow-hidden rounded-[10px] border border-ir-border" style={{ paddingTop: "56.42%" }}>
              <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-ir-t1">{i === 0 ? "A" : "B"} · {o.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
