"use client";
// The one-page summary sheet ("สรุปผลจากคำตอบของคุณ"), shared by the deliver step and the
// page shown after sending, so both always show the same thing. The PDF / PNG download
// draws the same content (sheetData).
/* eslint-disable @typescript-eslint/no-explicit-any -- drafts and submitted requirements both come in loosely typed */
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { isLightHex, sheetData } from "@/lib/sheetData";
import { COVER_LINE, headlineChunks, headlineIsLong, headlinePhrases, keepPhraseWhole } from "@/lib/moodboardExport";
import { chosenThaiFont, previewFamily } from "@/lib/fontCatalog";
import { useGoogleFont } from "@/lib/useGoogleFont";

// Faint grid + rising line on the right half of the cover (same shape as the PDF / PNG).
function CoverWatermark({ accent }: { accent: string }) {
  const pts = COVER_LINE.map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[58%]"
      style={{ maskImage: "linear-gradient(to right, transparent, black 55%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)" }}>
      <defs>
        <pattern id="cover-grid" width="8" height="12" patternUnits="userSpaceOnUse">
          <path d="M8 0V12M0 12H8" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </pattern>
        <linearGradient id="cover-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.2" stopColor={accent} stopOpacity="0.16" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#cover-grid)" />
      <polygon points={`${pts} 100,100 0,100`} fill="url(#cover-area)" />
      <polyline points={pts} fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// One numbered chapter of the overview: label column, hairline above.
function Chapter({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-black/[0.08] py-6 md:grid-cols-[150px_minmax(0,1fr)] md:gap-8 md:py-8">
      <p className="flex items-baseline gap-2.5 md:block">
        <span className="font-mono text-small text-[#8A8578]">{n}</span>
        <span className="text-body font-semibold text-[#2B2A26] md:mt-1 md:block">{title}</span>
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── Project overview — the result, not a form ──
// One section replacing the old "สรุปแนวทางการออกแบบ" + "ภาพรวมโปรเจกต์" pair (they
// repeated each other and both looked like the questionnaire: bordered rounded cards,
// chips, sample buttons — testers wondered if they still had to fill something in).
// It reads as a printed brand sheet instead: paper background, a cover band in the
// client's own colour, the chosen heading font at display size, numbered chapters split
// by hairlines, flat colour fields and captioned photos. Nothing here is a control, so
// nothing looks like one. The PDF / PNG download draws the same content (sheetData).
export function ProjectOverview({ draft }: { draft: any }) {
  const thaiPick = chosenThaiFont(draft);
  useGoogleFont(thaiPick.source === "selected" ? previewFamily(thaiPick.family) : undefined, [400, 500, 600, 700]);
  const d = sheetData(draft);
  const head = { fontFamily: d.fontStack } as CSSProperties;
  const moods = [d.mainMood, ...d.supportMoods].filter(Boolean);
  // headline rules shared with the PDF / PNG (headlinePhrases): short phrases kept whole,
  // a long run-on Thai phrase breaks between words, and a long headline steps down a size
  const title = d.tagline ?? moods.join(" · ");
  const titleLong = headlineIsLong(title);
  // the glow and the watermark line: the direction's accent, or white when the colours
  // come from their own website (not known here)
  const coverGlow = d.ownPending ? "#FFFFFF" : (d.swatches[1]?.hex ?? "#FFFFFF");
  const insp = [
    d.inspiration.links ? `${d.inspiration.links} ลิงก์` : "",
    d.inspiration.files ? `${d.inspiration.files} ไฟล์` : "",
  ].filter(Boolean).join(" · ");

  return (
    <section aria-label="ภาพรวมผลลัพธ์" className="cursor-default overflow-clip rounded-sm bg-[#FBFAF6] text-[#2B2A26] ring-1 ring-black/[0.06]">
      {/* cover — layered, not one flat block (19 Nov 2026): a diagonal from the main colour
          to a lighter shade, a soft accent glow top right, and a faint grid with a rising
          line on the right (investor data) under the type. The PDF / PNG draws the same. */}
      <div className="relative isolate overflow-hidden px-6 pb-7 pt-6 md:px-10 md:pb-9 md:pt-8"
        style={{ color: d.moodInk, background: `radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, ${coverGlow} 30%, transparent), transparent 60%), linear-gradient(135deg, ${d.primary}, color-mix(in srgb, ${d.primary} 78%, ${isLightHex(d.primary) ? "#000" : "#fff"}))` }}>
        <CoverWatermark accent={coverGlow} />
        {/* their logo, on a white chip so a dark or transparent logo still shows; above the
            text on a phone, beside it from sm up (a float squeezed the kicker into two lines) */}
        {d.logo && (
          <span className="mb-4 grid h-14 w-28 sm:float-right sm:mb-0 sm:ml-4 shrink-0 place-items-center rounded-md bg-white p-2 shadow-e1 md:h-16 md:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.logo} alt="โลโก้บริษัท" className="max-h-full max-w-full object-contain" />
          </span>
        )}
        {/* Mood leads, no style name (19 Nov 2026): a name like "Premium Corporate" read as
            more specific and settled than the answers really are. */}
        <p className="text-small font-medium opacity-75">แนวทางที่ได้จากคำตอบของคุณ</p>
        <h3 className="mt-2 max-w-[36rem] font-bold leading-[1.15] tracking-[-0.02em]" style={{ ...head, color: d.moodInk, fontSize: titleLong ? "clamp(28px, 5.4vw, 44px)" : "clamp(34px, 7vw, 56px)", textWrap: "balance" } as CSSProperties}>{/* each phrase stays whole; a long Thai run breaks between words (the browser segments Thai) */}
          {headlinePhrases(title).map((w, i) => <Fragment key={i}>{i ? " " : ""}{keepPhraseWhole(w) || w.includes(" ") ? <span className={keepPhraseWhole(w) ? "whitespace-nowrap" : undefined}>{w}</span>
            : headlineChunks(w).map((c, j) => <Fragment key={j}>{j ? <wbr /> : null}<span className={c.length <= 16 ? "whitespace-nowrap" : undefined}>{c}</span></Fragment>)}</Fragment>)}</h3>
        {/* Moods as type, not pills (pills read as picked / not picked): the main one big,
            the supporting one smaller and softer. */}
        {moods.length > 0 && (
          <div className="mt-8 max-w-[36rem] border-t pt-5" style={{ borderColor: "currentColor", borderTopColor: "color-mix(in srgb, currentColor 22%, transparent)" }}>
            <p className="text-caption font-medium uppercase tracking-[0.04em] opacity-65">อารมณ์ของเว็บไซต์</p>
            {d.mainMood && <p className="mt-1.5 text-title font-semibold leading-snug">{d.mainMood}</p>}
            {d.supportMoods.length > 0 && <p className="mt-1 text-body opacity-75">เสริมด้วย {d.supportMoods.join(" · ")}</p>}
          </div>
        )}
      </div>

      <div className="px-6 md:px-10">
        <Chapter n="01" title="คำตอบของคุณ">
          {d.answers.length ? (
            <dl className="divide-y divide-black/[0.07]">
              {d.answers.map((a) => (
                <div key={a.topic} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-body text-[#8A8578]">{a.topic}</dt>
                  <dd className="m-0 text-lead font-semibold">{a.choice}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-body text-[#8A8578]">ยังไม่ได้ตอบคำถามสำรวจแนวทาง</p>}
        </Chapter>

        <Chapter n="02" title="สี">
          {d.ownPending ? (
            <p className="text-lead leading-relaxed"><span className="font-semibold">ใช้สีจากเว็บไซต์เดิม</span> <span className="text-[#6F6A5E]">· ทีมจะใช้สีจาก {d.ciSite ?? "เว็บไซต์ปัจจุบันของคุณ"}</span></p>
          ) : (
            <>
              <div className="grid grid-cols-3">
                {d.swatches.map((s) => (
                  <div key={s.role}>
                    <div className="h-20 md:h-28" style={{ background: s.hex, boxShadow: isLightHex(s.hex) ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : undefined }} />
                    <p className="mt-2 text-small font-semibold">{s.role}</p>
                    <p className="font-mono text-caption text-[#8A8578]">{s.hex.toUpperCase()}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-small text-[#8A8578]">{d.colorSource}</p>
            </>
          )}
          {d.ciAssets && <p className="mt-2 text-small"><span className="text-[#8A8578]">CI ที่แนบ · </span>{d.ciAssets} <span className="text-[#8A8578]">· ส่วนที่ไม่ได้แนบ ทีมเสนอให้</span></p>}
          {d.ciNote && <p className="mt-2 text-small"><span className="text-[#8A8578]">หมายเหตุ · </span>{d.ciNote}</p>}
        </Chapter>

        <Chapter n="03" title="ตัวอักษร">
          {d.ciSite ? (
            <p className="text-lead leading-relaxed"><span className="font-semibold">ใช้ฟอนต์จากเว็บไซต์เดิม</span> <span className="text-[#6F6A5E]">· ทีมจะใช้ฟอนต์จาก {d.ciSite}</span></p>
          ) : (
            <>
              <p className="font-bold leading-tight" style={{ ...head, fontSize: "clamp(32px, 6vw, 48px)" }}>{d.fontName}</p>
              {/* sample text, labelled so it isn't read as content (user test SCGP) */}
              <p className="mt-3"><span className="inline-block rounded-full bg-black/[0.06] px-2.5 py-0.5 text-caption font-semibold text-[#6F6A5E]">ตัวอย่างฟอนต์</span></p>
              <p className="mt-1.5 text-title leading-snug text-[#4A473F]" style={head}>นักลงทุนสัมพันธ์ · ข้อมูลสำคัญทางการเงิน</p>
              {/* no font description: too specific for a summary (user test CBG) */}
              <p className="mt-2 text-small text-[#8A8578]">ฟอนต์ตัวอย่างที่เข้ากับอารมณ์ของเว็บ · สรุปอีกครั้งเมื่อคุยรายละเอียด</p>
              {d.fontInterest && <p className="mt-2 text-body"><span className="text-[#8A8578]">ลูกค้าสนใจ · </span><span className="font-semibold">{d.fontInterest}</span></p>}
            </>
          )}
        </Chapter>

        {d.shots.length > 0 && (
          <Chapter n="04" title="แนวภาพ">
            {d.visualMood && <p className="mb-4 text-body leading-relaxed text-[#4A473F]">{d.visualMood}</p>}
            {/* photos without captions: a caption per photo read as a promise of that exact shot (user test CBG) */}
            {/* labelled as samples so they don't read as something to click or pick (user test AOT) */}
            <p className="mb-2"><span className="inline-block rounded-full bg-black/[0.06] px-2.5 py-0.5 text-caption font-semibold text-[#6F6A5E]">ตัวอย่างโทนภาพ · ไม่ต้องเลือก</span></p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {d.shots.slice(0, 6).map((s) => (
                <figure key={s.url} className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.cap} loading="lazy" draggable={false} className="pointer-events-none block w-full select-none object-cover" style={{ aspectRatio: "4 / 3" }} />
                </figure>
              ))}
            </div>
            <p className="mt-4 text-small text-[#8A8578]">ภาพตัวอย่างเพื่อบอกโทนภาพ · ทีมจะเลือกภาพที่ตรงกับธุรกิจของคุณอีกครั้ง</p>
          </Chapter>
        )}

        <Chapter n={d.shots.length ? "05" : "04"} title="หน้าแรก">
          {d.sections.length ? (
            <ol className="grid gap-x-8 sm:grid-cols-2">
              {d.sections.map((name, i) => (
                <li key={name} className="flex items-baseline gap-3 py-1.5 text-body">
                  <span className="w-5 shrink-0 text-right font-mono text-small text-[#8A8578]">{i + 1}</span>
                  <span>{name.split(" / ")[0]}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-body text-[#8A8578]">ยังไม่ได้จัดหน้าแรก</p>}
          {d.note && <p className="mt-4 text-body leading-relaxed"><span className="text-[#8A8578]">หมายเหตุ · </span>{d.note}</p>}
          {(insp || d.inspiration.note) && (
            <p className="mt-3 text-body leading-relaxed">
              <span className="text-[#8A8578]">แรงบันดาลใจที่แนบ · </span>{[insp, d.inspiration.note].filter(Boolean).join(" · ")}
            </p>
          )}
        </Chapter>

        <p className="border-t border-black/[0.08] py-5 text-small text-[#8A8578]">
          เอกสารสรุปแนวทางจากคำตอบของคุณ ไม่ใช่งานออกแบบจริง · ทีม IR Plus จะคุยรายละเอียดกับคุณอีกครั้ง
        </p>
      </div>
    </section>
  );
}


// ── S6 · Deliver references + finalize + submit ──
