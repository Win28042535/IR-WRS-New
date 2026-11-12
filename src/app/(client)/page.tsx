"use client";

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { FLOW_STEPS } from "@/lib/data";
import { IconCheck, IconArrowRight } from "@/components/icons";
import { BriefFlow, HeroFragments, Moodboard, StepGallery } from "@/components/HomeShowcase";
import { useStartFlow } from "@/lib/useStartFlow";
import { HomeContact } from "@/components/HomeContact";

const balance = { textWrap: "balance" } as CSSProperties;

// ── Homepage: start here ──
// Built for action, not explanation. The first question of the flow (company name) is
// asked right here, and the example website beside it takes the name as it's typed — the
// client sees "their" site before answering anything else, and pressing ต่อไป lands them
// in step 1 with that answer already filled. The highlight beside it is the whole
// deliverable as a moodboard. Below: a preview of every step's screen (what to do, what it
// looks like), then what to prepare and the FAQ, folded.
// Same mood as before: faint grid, lime glow, black pill CTA with the lime arrow disc.

// "ทีมได้รับอะไร" (the transformation machine) is switched off for now; flip to bring it back.
const SHOW_BRIEF = false;

const REASSURE = ["ไม่เกิน 20 นาที", "บันทึกอัตโนมัติ", "แก้ไขได้ก่อนเริ่มออกแบบ", "ไม่ต้องสมัครสมาชิก"];

const STATS = [
  { pre: "ไม่เกิน", n: "20", post: "นาที" },
  { n: String(FLOW_STEPS.length), post: "ขั้นตอน" },
  { n: "1–2", post: "วันทำการ ทีมติดต่อกลับ" },
];

const PREP = [
  "ชื่อบริษัท และเว็บไซต์ปัจจุบัน (ถ้ามี)",
  "กลุ่มนักลงทุนที่สำคัญ เช่น รายย่อย สถาบัน นักวิเคราะห์",
  "เว็บไซต์ที่ชอบ (ไม่บังคับ)",
  "ชื่อ อีเมล และเบอร์โทรของผู้ติดต่อ",
];

const FAQ = [
  { q: "ต้องมีความรู้ด้านการออกแบบไหม", a: "ไม่ต้อง ทุกข้อตอบด้วยการเลือกจากภาพหรือตัวเลือกที่อธิบายไว้ ระบบสรุปเป็นแนวทางการออกแบบให้เอง" },
  { q: "ใครในบริษัทควรเป็นคนกรอก", a: "ผู้ที่ดูแลงานนักลงทุนสัมพันธ์หรือเว็บไซต์ IR เช่น ฝ่าย IR ฝ่ายการตลาด หรือเลขานุการบริษัท" },
  { q: "ทำไม่เสร็จ ปิดหน้าไปก่อนได้ไหม", a: "ได้ ข้อมูลบันทึกอัตโนมัติในเบราว์เซอร์นี้ กลับมาที่หน้านี้ด้วยเครื่องและเบราว์เซอร์เดิม แล้วกด \"ทำต่อ\"" },
  { q: "ส่งไปแล้ว แก้ไขได้ไหม", a: "ได้ แจ้งทีม IR Plus ตอนที่ทีมติดต่อกลับ ทีมจะปรับให้ก่อนเริ่มออกแบบ" },
];

export default function Landing() {
  const flow = useStartFlow();
  const [company, setCompany] = useState("");
  const shown = flow.inProgress ? flow.company : company;

  return (
    // overflow-clip, not hidden: hidden would capture the scroll-motion view() timelines.
    <div className="relative overflow-clip">
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
        className="pointer-events-none absolute left-1/2 top-[-300px] h-[720px] w-[1200px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(215,224,39,0.38), rgba(215,224,39,0) 70%)" }}
      />

      {/* ── Hero: the outcome and the first question, nothing competing with the CTA ── */}
      <section className="relative isolate mx-auto max-w-[1320px] px-5 sm:px-8 pt-10 sm:pt-20 pb-6 text-center ir-fade-up">
        <HeroFragments />
        {/* Narrow phones wrap after "สำหรับลูกค้า ·", so the pill softens to a rounded box. */}
        <span className="inline-flex items-center gap-2 rounded-[18px] min-[440px]:rounded-full border border-black/[0.06] bg-white/80 py-1.5 pl-1.5 pr-4 text-left text-[13px] font-medium leading-snug text-ir-t2 shadow-sm backdrop-blur">
          <span className="shrink-0 rounded-full bg-ir-dark px-2.5 py-0.5 text-[12px] font-semibold text-white">IR Plus</span>
          <span>
            สำหรับลูกค้า ·{" "}
            <span className="whitespace-nowrap">บริษัทจดทะเบียนในตลาดหลักทรัพย์</span>
          </span>
        </span>
        <h1 className="mx-auto mt-6 max-w-[900px] text-[clamp(2.4rem,6vw,4.75rem)] font-semibold leading-[1.12] tracking-[-0.04em]" style={balance}>
          <span className="whitespace-nowrap">เว็บไซต์ IR ที่ใช่</span>{" "}
          <span className="whitespace-nowrap">เริ่มจาก</span>{" "}
          <span className="ir-grad-text whitespace-nowrap px-[0.02em] py-[0.15em]">คำตอบของคุณ</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[36rem] text-[16px] sm:text-[19px] leading-relaxed text-ir-t2" style={balance}>
          ตอบคำถามสั้นๆ เลือกสไตล์จากภาพ แล้วรับ Moodboard และ Requirement ที่พร้อมส่งให้ทีมออกแบบ
        </p>

        <div className="mx-auto mt-9 max-w-[36rem] text-left">
          {flow.inProgress ? <ResumeCard flow={flow} /> : <StartForm value={company} onChange={setCompany} onStart={flow.startWith} />}
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[14px] text-ir-t2">
          {REASSURE.map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <IconCheck width={20} height={20} className="text-ir-accent-text" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* ── The deliverable, revealed on scroll: centred and large, away from the CTA ── */}
      <section id="example" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-5 sm:px-8 pt-20 sm:pt-28">
        <div className="sc-reveal text-center">
          <h2 className="mx-auto max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
            <span className="whitespace-nowrap">ตัวอย่าง</span><span className="ir-grad-text whitespace-nowrap px-[0.02em] py-[0.15em]">สิ่งที่คุณจะได้</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[40rem] text-[16px] leading-relaxed text-ir-t2" style={balance}>
            Moodboard ที่ระบบสรุปจากคำตอบ: แนวทาง สี ตัวอักษร ภาพ สิ่งที่คุณเลือก และโครงหน้าแรก
            {shown.trim() && <> · แสดงด้วยชื่อ <span className="font-semibold text-ir-t1">{shown.trim()}</span></>}
          </p>
        </div>
        <div className="sc-stage mt-10">
          <div className="sc-show"><Moodboard company={shown} /></div>
        </div>
      </section>

      {/* ── Each step, previewed ── */}
      <section id="steps" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-5 sm:px-8 pt-20 sm:pt-24">
        <div className="sc-reveal text-center">
          <h2 className="mx-auto max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
            <span className="whitespace-nowrap">{FLOW_STEPS.length} ขั้นตอน</span>{" "}<span className="ir-grad-text whitespace-nowrap px-[0.02em] py-[0.15em]">แต่ละขั้นทำอะไร</span>
          </h2>
          <p className="mt-3 text-[16px] text-ir-t2">หน้าตาจริงของแต่ละขั้น ชื่อตรงกับแถบด้านบนตอนกรอก</p>
        </div>
        <div className="mt-10"><StepGallery /></div>
      </section>

      {/* ── What the team receives — each answer becomes a heading of the Requirement ── */}
      {SHOW_BRIEF && (
        <section id="brief" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-5 sm:px-8 pt-16 sm:pt-20">
          <div className="sc-reveal text-center">
            <h2 className="mx-auto max-w-[22ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
              <span className="whitespace-nowrap">ทุกคำตอบ</span>{" "}<span className="ir-grad-text whitespace-nowrap px-[0.02em] py-[0.15em]">กลายเป็นโจทย์</span>{" "}<span className="whitespace-nowrap">ให้นักออกแบบ</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[40rem] text-[16px] leading-relaxed text-ir-t2" style={balance}>
              ทีม IR Plus ได้รับ Requirement ที่บอกว่าเว็บไซต์ของคุณคุยกับใคร ต้องทำอะไรได้ และควรออกมาแนวไหน พร้อม Moodboard เป็นภาพอ้างอิง
            </p>
          </div>
          <div className="sc-reveal mt-8"><BriefFlow /></div>
        </section>
      )}

      {/* ── More detail, folded — for those who want to read first ── */}
      <section id="faq" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-5 sm:px-8 pt-20 sm:pt-24">
        <div className="sc-reveal text-center">
          <h2 className="mx-auto max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
            <span className="whitespace-nowrap">อยากรู้<span className="ir-grad-text px-[0.02em] py-[0.15em]">รายละเอียด</span></span>{" "}<span className="whitespace-nowrap">ก่อนเริ่ม</span>
          </h2>
          <p className="mt-3 text-[16px] text-ir-t2" style={balance}>คำตอบสั้นๆ ของคำถามที่ลูกค้าถามบ่อย</p>
        </div>
        {/* One card per question, two columns from lg, so the full width reads as a grid
            rather than one very long accordion. */}
        <div className="sc-reveal mt-10 grid items-start gap-3 lg:grid-cols-2">
          <Fold title="ต้องเตรียมอะไรบ้าง">
            <p className="text-[15px] text-ir-t2">ไม่ต้องเตรียมเอกสารหรือ Brief แค่รู้ข้อมูลเหล่านี้</p>
            <ul className="mt-3 grid gap-2 pb-5">
              {PREP.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[15px] text-ir-t1">
                  <IconCheck width={20} height={20} className="mt-0.5 shrink-0 text-ir-accent-text" />{p}
                </li>
              ))}
            </ul>
          </Fold>
          {FAQ.map((f) => (
            <Fold key={f.q} title={f.q}>
              <p className="pb-5 text-[15px] leading-relaxed text-ir-t2">{f.a}</p>
            </Fold>
          ))}
        </div>
      </section>

      {/* ── Still have a question? Same title DNA as the FAQ; a quiet form below it ── */}
      <section id="contact" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-5 sm:px-8 pt-20 sm:pt-24">
        <div className="sc-reveal text-center">
          <h2 className="mx-auto max-w-[24ch] text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
            <span className="whitespace-nowrap">ยังมี<span className="ir-grad-text px-[0.02em] py-[0.15em]">คำถาม?</span></span>
          </h2>
          <p className="mt-3 text-[16px] text-ir-t2" style={balance}>ฝากเรื่องไว้ ทีม IR Plus ติดต่อกลับภายใน 1–2 วันทำการ</p>
        </div>
        <div className="sc-reveal mt-10"><HomeContact /></div>
      </section>

      {/* ── Closing banner — start (or resume) right here, no scrolling back up ── */}
      <section className="relative mx-auto max-w-[1320px] px-5 sm:px-8 pt-16 sm:pt-20 pb-16">
        <div className="sc-reveal relative overflow-hidden rounded-[32px] bg-ir-dark px-6 py-14 sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-220px] h-[440px] w-[760px] -translate-x-1/2 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(215,224,39,0.24), rgba(215,224,39,0) 70%)" }}
          />
          <div className="relative mx-auto max-w-[640px] text-center">
            <h2 className="mt-5 text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-white" style={balance}>
              <span className="whitespace-nowrap">พร้อมเริ่มเว็บไซต์ IR</span>{" "}<span className="ir-grad-text-dark whitespace-nowrap px-[0.02em] py-[0.15em]">ใหม่ขององค์กรคุณ</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/75">คำตอบบันทึกอัตโนมัติ ปิดแล้วกลับมาทำต่อจากจุดเดิมได้</p>
            <div className="mx-auto mt-8 max-w-[34rem] text-left">
              {flow.inProgress ? (
                <div className="flex flex-col items-center gap-2">
                  <PrimaryCta onClick={flow.resume} onDark>ทำต่อ · ขั้นที่ {flow.step} {flow.stepName}</PrimaryCta>
                  {flow.company && <p className="text-[14px] text-white/70">{flow.company}</p>}
                </div>
              ) : (
                <StartForm value={company} onChange={setCompany} onStart={flow.startWith} inputId="company-input-bottom" dark />
              )}
            </div>
            <ul className="mt-10 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-[14px] text-white/70">
              {STATS.map((st) => (
                <li key={st.post} className="inline-flex items-baseline gap-1.5">
                  {st.pre && <span>{st.pre}</span>}
                  <span className="ir-grad-text-dark text-[20px] font-semibold tabular-nums">{st.n}</span>
                  <span>{st.post}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-[13px] text-ir-t3">IR Plus by efin · Website Requirement System</p>
      </section>

      <BackToTop />
    </div>
  );
}

// Appears once the hero is out of view; back to the top in one tap. Smooth unless the
// visitor prefers reduced motion. Hidden copies are inert so they're never tabbed to.
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="กลับขึ้นด้านบน"
      title="กลับขึ้นด้านบน"
      inert={!show}
      className={`fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-40 grid w-12 h-12 place-items-center rounded-full bg-ir-dark text-ir-accent shadow-[0_10px_30px_rgba(20,22,19,0.25)] transition-[opacity,transform,background-color] duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 motion-reduce:transition-none ${
        show ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
      }`}
    >
      <IconArrowRight width={24} height={24} className="-rotate-90" />
    </button>
  );
}

// The flow's first question, asked on the homepage. Enter or ต่อไป starts step 1 with
// the name already filled in.
function StartForm({ value, onChange, onStart, inputId = "company-input", dark }: {
  value: string; onChange: (v: string) => void; onStart: (company: string) => void; inputId?: string; dark?: boolean;
}) {
  const [hint, setHint] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim().length < 2) { setHint(true); return; }
    onStart(value);
  };
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={inputId} className={`block text-[15px] font-semibold ${dark ? "text-white" : "text-ir-t1"}`}>เริ่มจากชื่อบริษัทของคุณ</label>
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <input
          id={inputId}
          value={value}
          onChange={(e) => { onChange(e.target.value); if (hint) setHint(false); }}
          placeholder="เช่น บริษัท ตัวอย่าง จำกัด (มหาชน)"
          autoComplete="organization"
          aria-invalid={hint}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          className="h-[56px] w-full min-w-0 flex-none sm:flex-1 rounded-full border border-black/10 bg-white px-6 text-[16px] text-ir-t1 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-ir-t3 focus:border-ir-select focus:ring-3 focus:ring-ir-ring/30"
        />
        <PrimaryCta type="submit" onDark={dark}>ต่อไป</PrimaryCta>
      </div>
      {hint && <p id={`${inputId}-hint`} role="alert" className={`mt-2 pl-6 text-[14px] ${dark ? "text-red-300" : "text-red-700"}`}>พิมพ์ชื่อบริษัทก่อน แล้วกดต่อไป</p>}
    </form>
  );
}

// Work in progress: resume where they left off; starting over takes a second tap.
function ResumeCard({ flow }: { flow: ReturnType<typeof useStartFlow> }) {
  const [confirmNew, setConfirmNew] = useState(false);
  return (
    <div className="rounded-[24px] border border-black/[0.06] bg-white/85 p-5 shadow-sm backdrop-blur">
      <p className="text-[14px] text-ir-t3">คุณทำค้างไว้</p>
      <p className="mt-0.5 text-[18px] font-semibold text-ir-t1">{flow.company || "เว็บไซต์ IR ของคุณ"}</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {FLOW_STEPS.map((name, i) => (
            <span key={name} className={`h-1.5 flex-1 rounded-full transition-colors ${i < flow.step ? "ir-grad-fill" : "bg-ir-border"}`} />
          ))}
        </div>
        <span className="shrink-0 text-[13px] text-ir-t2">ขั้นที่ {flow.step}/{FLOW_STEPS.length} · {flow.stepName}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryCta onClick={flow.resume}>ทำต่อ</PrimaryCta>
        {confirmNew ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] text-ir-t2">ข้อมูลที่กรอกไว้จะหายไป</span>
            <button type="button" onClick={flow.startNew} className="min-h-11 rounded-full bg-red-600 px-4 text-[14px] font-semibold text-white hover:bg-red-700">ยืนยันเริ่มใหม่</button>
            <button type="button" onClick={() => setConfirmNew(false)} className="min-h-11 rounded-full px-3 text-[14px] font-medium text-ir-t1">ยกเลิก</button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmNew(true)} className="min-h-11 px-2 text-[14px] font-medium text-ir-t2 underline underline-offset-4">เริ่มใหม่ตั้งแต่ต้น</button>
        )}
      </div>
    </div>
  );
}

// Black pill with a lime arrow disc (production WRS hero CTA).
function PrimaryCta({ children, onClick, type = "button", onDark }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; onDark?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group inline-flex h-[56px] shrink-0 items-center justify-center gap-3 rounded-full pl-7 pr-2 text-[16px] font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 ${
        onDark ? "ir-grad-fill text-ir-on-accent shadow-[0_10px_40px_rgba(215,224,39,0.25)] hover:brightness-105" : "bg-ir-dark text-white shadow-[0_10px_30px_rgba(20,22,19,0.18)] hover:bg-neutral-800"
      }`}
    >
      {children}
      <span className={`grid w-10 h-10 place-items-center rounded-full transition-transform duration-200 group-hover:translate-x-1 ${onDark ? "bg-ir-dark text-ir-accent" : "ir-grad-fill text-ir-on-accent"}`}>
        <IconArrowRight width={24} height={24} />
      </span>
    </button>
  );
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-[20px] border border-black/[0.06] bg-ir-card px-6 py-1 transition-[border-color,box-shadow] duration-200 open:border-ir-select-soft open:shadow-[0_14px_32px_-18px_rgba(20,22,19,0.18)]">
      <summary className="-mx-3 flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[14px] px-3 text-[16px] font-semibold text-ir-t1 transition-colors duration-200 hover:bg-primary-50/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/40 [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="grid w-8 h-8 shrink-0 place-items-center rounded-full bg-ir-muted text-[18px] text-ir-t2 transition-[rotate,background-color,color] duration-200 group-open:rotate-45 group-open:bg-ir-accent-soft group-open:text-ir-accent-text">+</span>
      </summary>
      {children}
    </details>
  );
}
