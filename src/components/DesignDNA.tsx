"use client";
// ── Design DNA card ───────────────────────────────────────────────────────────────
// The client's answers as one page a designer (or a board) can read at a glance:
//   personality — a spectrum per quiz axis (labels come from the quiz itself)
//   colour      — their own brand colours when they keep the existing set, else the
//                 Direction's palette with roles (หลัก / เน้น / พื้น)
//   type        — the Direction's pairing, plus the fonts found on their current site
//   imagery     — the photo direction + three examples
//   motion      — from the "expression" axis
//   priorities  — ranked audiences and goals
//   references  — what they said they like about the sites they attached
import type { CSSProperties, ReactNode } from "react";
import { BUSINESS_GOALS, IR_AUDIENCES, QUIZ, REFERENCE_LIKES, VISUAL_STYLES, directionById, unsplashUrl } from "@/lib/data";
import { DEFAULT_PAIRING, FONT_PAIRINGS, fontStack } from "@/lib/fonts";
import type { DesignProfile, Requirement } from "@/lib/types";

type Axis = keyof DesignProfile;

// One row per quiz axis, in quiz order; position 0…1 from the stored profile or the picks.
function spectrum(req: Requirement) {
  const axes: Axis[] = [];
  QUIZ.forEach((q) => { if (!axes.includes(q.axis as Axis)) axes.push(q.axis as Axis); });
  return axes.map((axis) => {
    const qs = QUIZ.filter((q) => q.axis === axis);
    const first = qs[0];
    const neg = first.optionA.value < 0 ? first.optionA : first.optionB;
    const pos = neg === first.optionA ? first.optionB : first.optionA;
    // designProfile is normalised to -100…100 (buildProfile); picks are summed ±1 per question
    let p: number | null = null;
    const stored = req.designProfile?.[axis];
    if (stored !== undefined) p = (stored + 100) / 200;
    else if (req.quizPicks?.length) {
      const v = qs.reduce((sum, q) => {
        const pick = req.quizPicks!.find((x) => x.questionId === q.id);
        return pick ? sum + (pick.letter === "A" ? q.optionA.value : q.optionB.value) : sum;
      }, 0);
      p = (v + qs.length) / (2 * qs.length);
    }
    return { axis, topic: first.topic, left: neg.label, right: pos.label, pos: p };
  });
}

const Block = ({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) => (
  <div className={`min-w-0 rounded-[16px] border border-ir-border bg-white p-4 ${className}`}>
    <p className="text-[13px] font-semibold text-ir-t3">{label}</p>
    <div className="mt-2.5">{children}</div>
  </div>
);

export function DesignDNACard({ req, className = "" }: { req: Requirement; className?: string }) {
  const dir = directionById(req.selectedDirection);
  if (!dir) return null;
  const pair = FONT_PAIRINGS[dir.id] ?? DEFAULT_PAIRING;
  const style = VISUAL_STYLES[dir.id];
  const rows = spectrum(req).filter((r) => r.pos !== null);
  const energy = rows.find((r) => r.axis === "energyBold")?.pos ?? null;
  const motion = energy === null ? null
    : energy > 0.5 ? { label: "มีชีวิตชีวา", note: "transition และ hover ชัด ภาพเคลื่อนไหวได้" }
    : energy < 0.5 ? { label: "นิ่ง เรียบ", note: "เคลื่อนไหวน้อย เน้นความมั่นคง" }
    : { label: "พอดี", note: "เคลื่อนไหวเฉพาะจุดสำคัญ" };

  // "ใช้ชุดสีเดิม": the team takes the colours from their current site / logo. Real hex codes
  // only exist if they were captured earlier; otherwise the card says so instead of showing
  // the Direction palette as if it were theirs.
  const keepOwn = req.hasCorporateIdentity === "yes";
  const own = keepOwn && (req.brandColors?.length ?? 0) > 0;
  const ownColors = own ? [req.brandPrimary, ...req.brandColors!.filter((c) => c !== req.brandPrimary)].filter(Boolean).slice(0, 5) as string[] : [];
  const roles = ["หลัก", "เน้น", "พื้น"];

  const audiences = [req.primaryAudience, ...(req.secondaryAudiences ?? [])].filter(Boolean).slice(0, 3).map((id) => IR_AUDIENCES.find((a) => a.id === id)?.label).filter(Boolean);
  const goals = (req.businessGoals ?? []).slice(0, 3).map((id) => BUSINESS_GOALS.find((g) => g.id === id)?.label).filter(Boolean);
  const likeCount = REFERENCE_LIKES.map((l) => ({ l, n: (req.references ?? []).filter((r) => r.likes?.includes(l)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);

  return (
    <section aria-label="Design DNA" className={`rounded-[24px] border border-ir-border bg-ir-bg p-3 sm:p-4 ${className}`}>
      {/* header: the Direction in its own colours and heading face */}
      <div className="rounded-[18px] p-5 text-white" style={{ background: own && req.brandPrimary ? `linear-gradient(135deg, ${req.brandPrimary}, #141613)` : dir.bg }}>
        <p className="font-mono text-[13px] font-semibold tracking-[0.14em] text-white/70">DESIGN DNA</p>
        <p className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight" style={{ fontFamily: fontStack(pair.heading) }}>{dir.label}</p>
        <p className="mt-1 text-[15px] text-white/85">{dir.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...dir.mood, ...(keepOwn ? ["ใช้ชุดสีเดิมของแบรนด์"] : [])].map((m) => (
            <span key={m} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[13px] font-medium">{m}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {/* personality spectrum */}
        {rows.length > 0 && (
          <Block label="บุคลิก" className="md:col-span-2">
            <ul className="grid gap-3">
              {rows.map((r) => (
                <li key={r.axis} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)] items-center gap-3 text-[13px]">
                  <span className={`truncate text-right ${r.pos! < 0.5 ? "font-semibold text-ir-t1" : "text-ir-t3"}`}>{r.left}</span>
                  <span className="relative h-2 rounded-full bg-ir-muted" aria-label={`${r.topic}: ${r.pos! < 0.5 ? r.left : r.pos! > 0.5 ? r.right : "กลาง ๆ"}`}>
                    <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-ir-border-hi" aria-hidden="true" />
                    <span className="dna-dot ir-grad-fill absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white shadow" style={{ left: `${Math.round(r.pos! * 100)}%` } as CSSProperties} />
                  </span>
                  <span className={`truncate ${r.pos! > 0.5 ? "font-semibold text-ir-t1" : "text-ir-t3"}`}>{r.right}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {/* colour */}
        <Block label={keepOwn ? "ชุดสีของแบรนด์" : `ชุดสี · ${dir.palette}`}>
          {keepOwn && !own ? (
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-ir-accent-soft text-ir-accent-text">
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.4-.9.2-1.9 1.2-1.9H17a4 4 0 0 0 4-4c0-5-4-10.3-9-10.3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="8" r="1" /></svg>
              </span>
              <p className="text-[15px] leading-relaxed text-ir-t1"><span className="font-semibold">ใช้ชุดสีเดิมของแบรนด์</span><br /><span className="text-[14px] text-ir-t2">ทีมจะอ้างอิงจากเว็บไซต์และโลโก้ปัจจุบัน</span></p>
            </div>
          ) : (
          <div className="flex gap-2">
            {(own ? ownColors : dir.colors.slice(0, 3)).map((c, i) => (
              <div key={c} className="min-w-0 flex-1">
                <span className="block h-14 rounded-[10px] ring-1 ring-inset ring-black/10" style={{ background: c }} />
                <span className="mt-1 block truncate font-mono text-[13px] text-ir-t2">{c}</span>
                <span className="block text-[13px] text-ir-t3">{own ? (i === 0 ? "หลัก" : "") : roles[i]}</span>
              </div>
            ))}
          </div>
          )}
        </Block>

        {/* type */}
        <Block label="ตัวอักษร">
          <p className="text-[34px] leading-none text-ir-t1" style={{ fontFamily: fontStack(pair.heading), fontWeight: 700 }}>
            Aa <span style={{ fontFamily: fontStack(pair.thai) }}>กข</span>
          </p>
          <p className="mt-2 text-[14px] font-semibold text-ir-t1">{pair.heading} + {pair.thai}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-ir-t3">{pair.note}</p>
          {(req.brandFonts?.length ?? 0) > 0 && <p className="mt-1.5 text-[13px] text-ir-t2">ฟอนต์บนเว็บไซต์เดิม: {req.brandFonts!.join(", ")}</p>}
        </Block>

        {/* imagery */}
        {style && (
          <Block label="สไตล์ภาพ">
            <div className="grid grid-cols-3 gap-1.5">
              {style.shots.slice(0, 3).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={unsplashUrl(p.id, 240)} alt={p.cap} loading="lazy" className="aspect-[4/3] w-full rounded-[8px] object-cover" />
              ))}
            </div>
            <p className="mt-2 text-[13px] leading-snug text-ir-t2">{style.mood}</p>
          </Block>
        )}

        {/* motion + priorities */}
        <Block label="การเคลื่อนไหว · ลำดับความสำคัญ">
          {motion && (
            <p className="text-[14px] text-ir-t1"><span className="font-semibold">{motion.label}</span> <span className="text-ir-t3">· {motion.note}</span></p>
          )}
          {audiences.length > 0 && (
            <ol className="mt-2.5 grid gap-1">
              {audiences.map((a, i) => (
                <li key={a} className="flex items-center gap-2 text-[13px] text-ir-t1">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ir-dark font-mono text-[13px] text-white">{i + 1}</span>{a}
                </li>
              ))}
            </ol>
          )}
          {goals.length > 0 && <p className="mt-2 text-[13px] text-ir-t2">เป้าหมาย: {goals.join(" · ")}</p>}
        </Block>

        {/* what they like in their references */}
        {likeCount.length > 0 && (
          <Block label="สิ่งที่ชอบจากเว็บอ้างอิง" className="md:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {likeCount.map(({ l, n }) => (
                <span key={l} className="inline-flex items-center gap-1.5 rounded-full border border-ir-select-soft bg-ir-accent-soft px-3 py-1 text-[13px] font-medium text-ir-t1">
                  {l}{n > 1 && <span className="font-mono text-[13px] text-ir-accent-text">×{n}</span>}
                </span>
              ))}
            </div>
          </Block>
        )}
      </div>
    </section>
  );
}
