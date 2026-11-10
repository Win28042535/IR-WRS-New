"use client";

import { type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DIRECTIONS, QUIZ } from "@/lib/data";
import { IconCheck, IconArrowRight } from "@/components/icons";
import { ExploreMock } from "@/components/ExploreMock";

const balance = { textWrap: "balance" } as CSSProperties;

const HOW_IT_WORKS = [
  { title: "เล่าเรื่ององค์กร", desc: "ชื่อบริษัท กลุ่มนักลงทุนที่สำคัญ และเป้าหมายของเว็บไซต์ ตอบทีละข้อ ไม่ต้องเตรียม Brief" },
  { title: "เลือกจากภาพ", desc: "Quiz 5 ข้อแบบ A/B ระบบสรุปเป็น Design Direction พร้อมสี ฟอนต์ และโครงหน้าแรก" },
  { title: "ส่งให้ทีม IR Plus", desc: "ตรวจภาพรวมแล้วกดส่ง ทีมจะติดต่อกลับภายใน 1–2 วันทำการเพื่อเริ่มออกแบบ" },
];

// Homepage order shown in the "what you get" preview — the default IR skeleton the
// structure step starts from.
const BLUEPRINT = ["Hero Section", "ข้อมูลสำคัญทางการเงิน", "ปฏิทินกิจกรรม และข่าวสาร", "ข้อมูลผู้ถือหุ้น"];

// ── Landing (production WRS layout) ──
// Hero → product preview → how it works → what you get → closing CTA, on a faint grid
// with a lime glow behind the hero. Every preview below is built from the flow's own
// data (the quiz mocks, real Direction palettes), never invented figures.
export default function Landing() {
  const router = useRouter();
  const startFlow = useStore((s) => s.startFlow);
  const begin = () => {
    startFlow("flow2");
    router.push("/flow2");
  };

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

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-10 sm:pt-16 text-center ir-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-ir-t2 shadow-sm backdrop-blur">
          <span className="rounded-full bg-ir-dark px-2.5 py-0.5 text-[12px] font-semibold text-white">IR Plus</span>
          สำหรับบริษัทจดทะเบียนในตลาดหลักทรัพย์
        </span>
        <h1
          className="mx-auto mt-7 max-w-[1000px] text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[1.14] tracking-[-0.035em]"
          style={balance}
        >
          <span className="whitespace-nowrap">เว็บไซต์ IR ที่ใช่</span>{" "}
          <span className="sm:whitespace-nowrap">
            <span className="whitespace-nowrap">เริ่มจาก</span>{" "}
            <span className="relative isolate inline-block whitespace-nowrap">
              <span aria-hidden="true" className="absolute inset-x-[-0.12em] bottom-[0.08em] top-[0.42em] -z-10 rounded-[0.18em] bg-ir-accent" />
              คำตอบของคุณ
            </span>
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[640px] text-[16px] sm:text-[18px] leading-relaxed text-ir-t2" style={balance}>
          ตอบคำถามสั้นๆ เลือกสไตล์จากภาพ แล้วรับ Design Direction และ Requirement ที่พร้อมส่งให้ทีมออกแบบ
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <PrimaryCta onClick={begin}>เริ่มกำหนด Requirement</PrimaryCta>
          <a
            href="#how"
            className="inline-flex h-[52px] items-center rounded-full border border-black/10 bg-white/70 px-6 text-[15px] font-medium text-ir-t1 backdrop-blur transition-colors hover:bg-white"
          >
            ดูวิธีการทำงาน
          </a>
        </div>
        <div className="mt-5 flex items-center justify-center gap-5 text-[13px] text-ir-t3">
          {["บันทึกอัตโนมัติ", "ไม่ต้องรู้ศัพท์ดีไซน์"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <IconCheck width={24} height={24} className="text-ir-accent-text" />
              {t}
            </span>
          ))}
        </div>

        <HeroPreview />
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative mx-auto max-w-[1240px] scroll-mt-10 px-5 sm:px-8 pt-24 sm:pt-28">
        <SectionHead eyebrow="วิธีการทำงาน" title="จากคำตอบ สู่ Requirement ที่ทีมออกแบบใช้ได้ทันที" />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="rounded-[24px] border border-black/[0.06] bg-ir-card p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="grid w-10 h-10 place-items-center rounded-full bg-ir-dark font-mono text-[14px] font-bold text-ir-accent">{i + 1}</span>
              <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ir-t2">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── What you get ── */}
      <section className="relative mx-auto max-w-[1240px] px-5 sm:px-8 pt-24 sm:pt-28">
        <SectionHead eyebrow="สิ่งที่คุณจะได้" title="เห็นภาพเว็บไซต์ก่อนเริ่มออกแบบจริง" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {/* Design Direction — the four directions with their real palettes */}
          <div className="lg:col-span-2 flex flex-col rounded-[28px] bg-ir-dark p-8 text-white">
            <span className="text-[13px] font-semibold text-ir-accent">Design Direction</span>
            <h3 className="mt-2 max-w-[22ch] text-[26px] font-semibold leading-snug tracking-[-0.02em] text-white" style={balance}>
              4 แนวทางสำหรับเว็บไซต์ IR เลือกให้จากคำตอบของคุณ
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIRECTIONS.map((d) => (
                <div key={d.id} className="rounded-2xl bg-white/[0.06] p-4">
                  <div className="flex gap-1.5" aria-hidden="true">
                    {d.colors.map((c) => (
                      <span key={c} className="w-5 h-5 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                    ))}
                  </div>
                  <p className="mt-4 text-[14px] font-semibold text-white">{d.label}</p>
                  <p className="mt-1 text-[13px] leading-snug text-white/70">{d.tagline}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Design Quiz — a real A/B pair from the flow */}
          <div className="rounded-[28px] border border-black/[0.06] bg-ir-card p-7">
            <span className="text-[13px] font-semibold text-ir-accent-text">Design Quiz</span>
            <h3 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.02em]" style={balance}>เลือกจากภาพ 5 ข้อ ไม่ต้องรู้ศัพท์ดีไซน์</h3>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[QUIZ[1].optionA, QUIZ[1].optionB].map((o) => (
                <div key={o.label} className="rounded-[14px] border border-ir-border p-1.5">
                  <div className="relative overflow-hidden rounded-[10px] border border-ir-border" style={{ paddingTop: "56.42%" }}>
                    <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
                  </div>
                  <p className="px-1 pt-2 pb-1 text-[13px] font-semibold">{o.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Homepage Blueprint */}
          <div className="lg:col-span-3 grid gap-6 rounded-[28px] border border-black/[0.06] bg-ir-card p-7 md:grid-cols-[1fr_1.4fr] md:items-center">
            <div>
              <span className="text-[13px] font-semibold text-ir-accent-text">Homepage Blueprint</span>
              <h3 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.02em]" style={balance}>เลือกและจัดลำดับ Section ของหน้าแรกเอง</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ir-t2">ระบบแนะนำโครงตามกลุ่มเป้าหมาย ส่วน Header และ Footer จัดให้อัตโนมัติ</p>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {BLUEPRINT.map((s, i) => (
                <li key={s} className="flex items-center gap-3 rounded-2xl border border-ir-border bg-ir-bg px-4 py-3">
                  <span className="grid w-8 h-8 shrink-0 place-items-center rounded-full bg-ir-accent font-mono text-[13px] font-bold text-ir-on-accent">{i + 1}</span>
                  <span className="text-[14px] font-medium">{s}</span>
                </li>
              ))}
            </ol>
          </div>
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
          <p className="relative mt-4 text-[16px] text-white/75">กรอกครั้งเดียว ทีม IR Plus ติดต่อกลับภายใน 1–2 วันทำการ</p>
          <div className="relative mt-8 flex justify-center">
            <PrimaryCta onClick={begin} onDark>เริ่มกำหนด Requirement</PrimaryCta>
          </div>
        </div>
        <p className="mt-10 text-center text-[13px] text-ir-t3">IR Plus by efin · Website Requirement System</p>
      </section>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="text-[14px] font-semibold text-ir-accent-text">{eyebrow}</span>
      <h2 className="mx-auto mt-3 max-w-[20ch] text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.18] tracking-[-0.03em]" style={balance}>
        {title}
      </h2>
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
      className={`group inline-flex h-[52px] items-center gap-3 rounded-full pl-7 pr-2 text-[15px] font-semibold transition-[transform,background-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 ${
        onDark ? "bg-white text-ir-t1 hover:bg-ir-bg" : "bg-ir-dark text-white shadow-[0_10px_30px_rgba(20,22,19,0.18)] hover:bg-neutral-800"
      }`}
    >
      {children}
      <span className="grid w-9 h-9 place-items-center rounded-full bg-ir-accent text-ir-on-accent transition-transform duration-200 group-hover:translate-x-1">
        <IconArrowRight width={24} height={24} />
      </span>
    </button>
  );
}

// Product preview under the hero: a quiz pick, the Direction it leads to, and the
// homepage order — all from the flow's real data, labelled as an example.
function HeroPreview() {
  const q = QUIZ[0];
  const dir = DIRECTIONS[0];
  return (
    <div className="relative mx-auto mt-14 sm:mt-16 max-w-[1080px] rounded-[28px] sm:rounded-[34px] border border-black/[0.06] bg-white/60 p-3 sm:p-4 shadow-[0_30px_80px_rgba(20,22,19,0.10)] backdrop-blur text-left">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ir-dark px-3 py-1 text-[12px] font-semibold text-white">ตัวอย่างผลลัพธ์</span>
      <div className="grid gap-3 md:grid-cols-[1.25fr_1fr]">
        <div className="rounded-[20px] border border-ir-border bg-ir-card p-3 sm:p-4">
          <div className="flex items-center justify-between text-[12px] text-ir-t3">
            <span>สำรวจแนวทาง</span>
            <span className="font-mono">ข้อ 1/5</span>
          </div>
          <p className="mt-2 text-[15px] font-semibold" style={balance}>{q.question}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[q.optionA, q.optionB].map((o, i) => (
              <div key={o.label} className={`rounded-[14px] border p-1.5 ${i === 0 ? "border-ir-select bg-primary-50" : "border-ir-border"}`}>
                <div className="relative overflow-hidden rounded-[10px] border border-ir-border" style={{ paddingTop: "56.42%" }}>
                  <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
                </div>
                <p className="px-1 pt-2 pb-1 text-[13px] font-semibold">{o.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[20px] p-5 text-white" style={{ background: dir.colors[0] }}>
            <span className="text-[12px] font-semibold text-white/70">Design Direction</span>
            <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-white">{dir.label}</p>
            <p className="mt-1 text-[14px] text-white/80">{dir.tagline}</p>
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {dir.colors.map((c) => <span key={c} className="w-6 h-6 rounded-full ring-1 ring-white/30" style={{ background: c }} />)}
            </div>
          </div>
          <div className="rounded-[20px] border border-ir-border bg-ir-card p-4">
            <span className="text-[12px] font-semibold text-ir-t3">โครงหน้าแรก</span>
            <ol className="mt-2 grid gap-1.5">
              {BLUEPRINT.slice(0, 3).map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 text-[13px] font-medium">
                  <span className="grid w-6 h-6 place-items-center rounded-full bg-ir-accent-soft font-mono text-[12px] font-bold text-ir-accent-text">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
