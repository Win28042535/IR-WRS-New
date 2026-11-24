"use client";
// ── Moodboard view of the summary (23 Nov 2026) ──
// The same answers as the document view, laid out as a style tile (after a "Colors /
// Typography / UI Styling" reference the team liked). Only the presentation is borrowed:
// nothing here is a control — no shuffle, lock or "+" — since testers tried to click things
// on the summary before. The PDF / PNG draws the same layout (drawBoard in moodboardExport).
// Layout follows the sheet's own width (container queries): on the deliver step it sits in
// a narrow column beside the form.
// Read-only on purpose: panels are solid paper tones with no outline, so they never look
// like the white, outlined contact form beside them; the sample UI sits inside a browser
// frame, a picture of a page rather than a field to type in.
// Compact (23 Nov 2026): three levels only — the banner, section titles, small muted card
// labels — and things that belong together share a row or a card (moods in one row, the
// three colours in one row with the greys as a strip, both fonts in one card, answers as
// pairs, photos as thumbnails), so the board is about half as tall on a phone.
// Spacing follows the app's 4px scale (23 Nov 2026): panels 16 / 20 like the app's cards,
// 12 between cards, 8 inside a group, sections 24 / 32 like the document view's chapters.
// Corners follow the app's radius scale (globals.css): panels 12px, tiles 8px, small 6px —
// inside a sheet with 8px corners, the earlier 20-24px read too soft.
import type { CSSProperties, ReactNode } from "react";
import { BODY_FONT, isLightHex } from "@/lib/sheetData";
import { useGoogleFont } from "@/lib/useGoogleFont";
import { BOARD_SAMPLE, NEUTRALS, textOn, tintSteps, type SheetData } from "@/lib/moodboardExport";

// solid, no outline: an outlined white box is what the form uses for "fill this in"
const CARD = "min-w-0 rounded-md bg-[#F1EEE6]";
const MUTED = "text-[#8A8578]";
/** the third level: small muted card labels */
const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-caption font-semibold tracking-[0.02em] ${MUTED} ${className}`}>{children}</p>
);

function Section({ n, title, chip, children }: { n: string; title: string; chip?: string; children: ReactNode }) {
  return (
    <section className="pt-6 @2xl:pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* numbered like a report's chapters, so it reads as a document to look through */}
        <h4 className="flex items-baseline gap-2 text-[19px] font-semibold leading-tight @2xl:text-[22px]">
          <span className={`font-mono text-caption font-normal ${MUTED}`}>{n}</span>{title}
        </h4>
        {chip && <span className="inline-block rounded-full bg-black/[0.06] px-3 py-0.5 text-caption font-semibold text-[#6F6A5E]">{chip}</span>}
      </div>
      {children}
    </section>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className={`mt-3 text-small leading-relaxed ${MUTED}`}>{children}</p>;

/** a colour tile: role on top, hex below, its nine shades as a thin strip along the bottom */
function Swatch({ s }: { s: SheetData["swatches"][number] }) {
  const light = isLightHex(s.hex);
  return (
    <div className="min-w-0">
      <div className={`relative flex h-24 flex-col justify-between overflow-hidden rounded-sm px-2 pb-4 pt-2 @sm:px-3 @sm:pt-3 @2xl:h-28 ${light ? "ring-1 ring-inset ring-[#E4E0D6]" : ""}`}
        style={{ background: s.hex, color: light ? "#2B2A26" : "#fff" }}>
        <p className="whitespace-nowrap text-caption font-semibold @sm:text-small">{s.role}</p>
        <p className="whitespace-nowrap font-mono text-[11px] tracking-tight @sm:text-caption @sm:tracking-normal">{s.hex.toUpperCase()}</p>
        <span className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {tintSteps(s.hex).map((t, i) => <span key={i} className="flex-1" style={{ background: t }} />)}
        </span>
      </div>
      <p className={`mt-2 line-clamp-2 text-caption leading-snug ${MUTED}`}>{s.use}</p>
    </div>
  );
}

/** "ใช้สี / ฟอนต์จากเว็บไซต์เดิม" — one compact card in place of the swatches and/or fonts */
const FromSite = ({ what, site }: { what: string; site?: string }) => (
  <div className={`${CARD} p-4 @2xl:p-5`}>
    <p className="text-body font-semibold">ใช้{what}จากเว็บไซต์เดิม</p>
    <p className="mt-0.5 text-small text-[#6F6A5E]">ทีมจะใช้{what}จาก {site ?? "เว็บไซต์ปัจจุบันของคุณ"}</p>
  </div>
);

// The direction + mood banner: the headline tile in the main colour (with the rising-line
// watermark), then the moods in one neutral card under it (23 Nov 2026). The direction's
// colours show only here in the headline tile and in "สีและตัวอักษร" — mood cards in the
// accent and a tint read as one more set of swatches and made the board busy. The main
// mood leads by size, the supporting one sits beside it, split by a hairline.
function Banner({ d, headline, watermark, glow }: { d: SheetData; headline: ReactNode; watermark: ReactNode; glow: string }) {
  const support = d.supportMoods.join(" · ");
  return (
    <div className="grid gap-3">
      <div className="relative isolate min-w-0 overflow-hidden rounded-md p-5 @2xl:p-6"
        style={{ color: d.moodInk, background: `radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, ${glow} 30%, transparent), transparent 60%), linear-gradient(135deg, ${d.primary}, color-mix(in srgb, ${d.primary} 78%, ${isLightHex(d.primary) ? "#000" : "#fff"}))` }}>
        {watermark}
        {d.logo && (
          <span className="mb-3 grid h-11 w-22 place-items-center rounded-md bg-white p-2 shadow-e1 @md:float-right @md:mb-0 @md:ml-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.logo} alt="โลโก้บริษัท" className="max-h-full max-w-full object-contain" />
          </span>
        )}
        <p className="text-small font-medium text-balance opacity-75">แนวทางที่ได้จากคำตอบของคุณ</p>
        {headline}
      </div>
      {(d.mainMood || support) && (
        <div className={`${CARD} p-4 @2xl:p-5`}>
          <Label>อารมณ์ของเว็บไซต์</Label>
          <div className={`mt-2 grid gap-3 ${d.mainMood && support ? "@sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @sm:gap-0" : ""}`}>
            {d.mainMood && <p className="min-w-0 text-title font-semibold leading-snug @sm:pr-5">{d.mainMood}</p>}
            {support && (
              <div className={`min-w-0 ${d.mainMood ? "border-t border-black/[0.08] pt-3 @sm:border-l @sm:border-t-0 @sm:pl-5 @sm:pt-0" : ""}`}>
                <p className={`text-caption ${MUTED}`}>เสริมด้วย</p>
                <p className="mt-0.5 text-body font-semibold leading-snug">{support}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MoodboardTiles({ d, headline, watermark, glow }: { d: SheetData; headline: ReactNode; watermark: ReactNode; glow: string }) {
  const head = { fontFamily: d.fontStack } as CSSProperties;
  const body = { fontFamily: d.bodyStack } as CSSProperties;
  useGoogleFont(BODY_FONT, [400, 600]);
  const btn = d.ownPending ? "#151823" : d.primary;
  const onBtn = isLightHex(btn) ? "#2B2A26" : "#fff";
  // a light wash of the accent, behind the key figure's change
  const accentSoft = d.ownPending ? "#E9E7E1" : `color-mix(in srgb, ${d.swatches[1]?.hex ?? "#BCC416"} 35%, #fff)`;
  const names = d.sections.map((n) => n.split(" / ")[0]);
  const insp = [d.inspiration.links ? `${d.inspiration.links} ลิงก์` : "", d.inspiration.files ? `${d.inspiration.files} ไฟล์` : "", d.inspiration.note ?? ""].filter(Boolean).join(" · ");
  const shot = (i: number) => d.shots[i]?.url ?? d.shots[0]?.url;
  const fromSiteBoth = d.ownPending && !!d.ciSite;
  // one line for where the fonts come from; "ทั้งสองฟอนต์…" when both are free Google faces
  const fontSourceLine = d.fontSource === "Google Fonts · ฟรี" ? "ทั้งสองฟอนต์จาก Google Fonts · ฟรี" : `หัวข้อ · ${d.fontSource} · เนื้อหา · Google Fonts · ฟรี`;
  const fonts = [
    { label: "หัวข้อ", name: d.fontName, fam: head, wt: 700, src: d.fontSource, sample: BOARD_SAMPLE.headSample },
    { label: "เนื้อหา", name: d.bodyFont, fam: body, wt: 400, src: "Google Fonts · ฟรี", sample: BOARD_SAMPLE.bodySample },
  ];

  return (
    <div className="@container px-4 pb-2 pt-5 sm:px-6 sm:pt-6 md:px-10 md:pt-8">
      <Banner d={d} headline={headline} watermark={watermark} glow={glow} />

      <Section n="01" title="สีและตัวอักษร">
        {fromSiteBoth ? <FromSite what="สีและฟอนต์" site={d.ciSite} /> : (
          <div className="grid gap-3 @lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* colours: three tiles in one row, the greys as a strip under them */}
            {d.ownPending ? <FromSite what="สี" site={d.ciSite} /> : (
              <div className="min-w-0">
                <div className="grid grid-cols-3 gap-2">{d.swatches.map((s) => <Swatch key={s.role} s={s} />)}</div>
                <div className="mt-3 flex items-center gap-3">
                  <Label className="shrink-0">โทนเทา</Label>
                  <span className="flex h-3 flex-1 overflow-hidden rounded-[4px] ring-1 ring-inset ring-black/[0.06]" aria-hidden="true">
                    {NEUTRALS.slice(1).map((n) => <span key={n} className="flex-1" style={{ background: n }} />)}
                  </span>
                </div>
                {/* what the greys are for — "สีกลาง" alone left testers asking */}
                <p className={`mt-2 text-caption leading-snug ${MUTED}`}>ใช้กับตัวอักษร พื้นหลัง และเส้นแบ่ง</p>
                {/* text on each colour (24 Nov 2026): which text colour reads on it and how well —
                    real information for the team, and it fills the column beside the font card */}
                <div className="mt-4 border-t border-black/[0.08] pt-3">
                  <Label>ตัวอักษรบนสี</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {d.swatches.map((s) => {
                      const t = textOn(s.hex);
                      return (
                        <div key={s.role} className="min-w-0">
                          <div className={`grid h-12 place-items-center rounded-sm @2xl:h-14 ${isLightHex(s.hex) ? "ring-1 ring-inset ring-[#E4E0D6]" : ""}`} style={{ background: s.hex, color: t.ink }}>
                            <span className="text-lead font-bold leading-none @2xl:text-title" style={head} aria-label={`ตัวอักษรบน${s.role}`}>Aa</span>
                          </div>
                          <p className={`mt-1.5 text-caption leading-snug ${t.ok ? MUTED : "text-ir-error"}`}>{t.ok ? "✓ " : ""}{t.verdict} · {t.ratio.toFixed(1)}:1</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* both fonts in one card, a row each */}
            {d.ciSite ? <FromSite what="ฟอนต์" site={d.ciSite} /> : (
              // each row looks like what its font does (23 Nov 2026): the heading row large and
              // bold, set like a heading; the body row small and quiet, set like a paragraph —
              // two equal rows read as one flat block. The source is said once, at the foot.
              <div className={`${CARD} flex flex-col px-4 @2xl:px-5`}>
                <div className="min-w-0 py-5">
                  <Label>{fonts[0].label}</Label>
                  <p className="mt-1.5 break-words leading-tight" style={{ ...fonts[0].fam, fontWeight: 700, fontSize: "clamp(28px, 4.4cqw, 36px)" }}>{fonts[0].name}</p>
                  <p className="mt-2 text-body font-semibold leading-snug text-[#2B2A26]" style={fonts[0].fam}>{fonts[0].sample}</p>
                </div>
                <div className="min-w-0 border-t border-black/[0.07] py-4">
                  <Label>{fonts[1].label}</Label>
                  <p className="mt-1 text-lead font-medium leading-tight" style={fonts[1].fam}>{fonts[1].name}</p>
                  <p className={`mt-1 line-clamp-2 text-small leading-relaxed ${MUTED}`} style={fonts[1].fam}>{fonts[1].sample}</p>
                </div>
                <p className={`mt-auto border-t border-black/[0.07] py-3 text-caption ${MUTED}`}>{fontSourceLine}</p>
              </div>
            )}
          </div>
        )}
        {!d.ownPending && !d.ciSite && <Note>สีและฟอนต์ตัวอย่างที่เข้ากับอารมณ์ของเว็บ · สรุปอีกครั้งเมื่อคุยรายละเอียด</Note>}
        {d.fontInterest && <p className="mt-3 text-small"><span className={MUTED}>ลูกค้าสนใจฟอนต์ · </span><span className="font-semibold">{d.fontInterest}</span></p>}
        {d.ciAssets && <Note>CI ที่แนบ · {d.ciAssets} · ส่วนที่ไม่ได้แนบ ทีมเสนอให้</Note>}
        {d.ciNote && <Note>หมายเหตุ · {d.ciNote}</Note>}
      </Section>

      {/* samples, not controls: a picture of a page in a browser frame — nothing to press,
          nothing to type in */}
      <Section n="02" title="องค์ประกอบบนเว็บ" chip="ตัวอย่างองค์ประกอบ">
        <div role="img" aria-label="ภาพตัวอย่างองค์ประกอบบนเว็บ: ปุ่ม ช่องกรอก และการ์ดเนื้อหา ในสีและฟอนต์ของแนวทาง"
          className="pointer-events-none select-none rounded-md bg-[#E6E2D8] p-1.5">
          <div className="flex items-center gap-3 px-2 pb-1.5 pt-0.5" aria-hidden="true">
            <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-black/15" />)}</span>
            <span className={`mx-auto max-w-[60%] truncate rounded-full bg-white/60 px-3 text-caption ${MUTED}`}>{BOARD_SAMPLE.url}</span>
            <span className="w-[32px]" />
          </div>
          {/* zones are split by surface and space, never by a line (23 Nov 2026): inside the
              sample page a line is always part of the UI — a field's underline, a table rule — so
              an underlined field can never be mistaken for a divider */}
          <div className="grid gap-1.5 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div className="rounded-[6px] bg-white p-4 pb-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex h-9 items-center rounded-full px-4 text-small font-semibold" style={{ background: btn, color: onBtn }}>{BOARD_SAMPLE.primaryBtn}</span>
                <span className="inline-flex h-9 items-center rounded-full px-4 text-small font-semibold ring-1 ring-inset ring-[#D9D5CB]">{BOARD_SAMPLE.secondaryBtn}</span>
              </div>
              {/* an underlined field still reads as a field: label above, placeholder inside, a
                  heavier line than any rule (1.5px, dark), only as long as the field, and a send
                  arrow at its end */}
              <p className="mt-5 text-caption font-medium">{BOARD_SAMPLE.fieldLabel}</p>
              <div className="mt-1.5 flex max-w-[17rem] items-center gap-2 border-b-[1.5px] border-[#2B2A26]/40 pb-1.5">
                <span className="min-w-0 flex-1 truncate text-small text-[#A7A296]">{BOARD_SAMPLE.fieldPlaceholder}</span>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[#2B2A26]"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </div>
            {/* three kinds of card an IR site uses — news with a photo, a key figure, an event —
                two whole and the third peeking past the right edge (each 40% of the row) */}
            <div className="flex gap-2 overflow-hidden rounded-[6px] bg-white py-4 pl-4">
              <div className="w-[40%] shrink-0 overflow-hidden rounded-[6px] ring-1 ring-inset ring-[#E4E0D6]">
                <div className="aspect-[16/9] bg-[#ECE9E1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {shot(1) && <img src={shot(1)} alt="" draggable={false} className="h-full w-full object-cover" />}
                </div>
                <div className="px-3 py-2">
                  <p className="text-caption font-bold leading-snug @md:text-small" style={head}>{BOARD_SAMPLE.cardTitle}</p>
                  <p className="mt-0.5 line-clamp-2 text-caption leading-snug text-[#6F6A5E]">{BOARD_SAMPLE.cardText}</p>
                </div>
              </div>
              {/* key figure: the number in the heading font, the change on the accent colour */}
              <div className="flex w-[40%] shrink-0 flex-col justify-between rounded-[6px] p-3 ring-1 ring-inset ring-[#E4E0D6]">
                <p className="text-caption text-[#6F6A5E]">{BOARD_SAMPLE.kpiLabel}</p>
                <div className="mt-3">
                  <p className="text-[26px] font-bold leading-none tabular-nums @md:text-[32px]" style={head}>{BOARD_SAMPLE.kpiValue}</p>
                  <p className="mt-1 text-caption text-[#6F6A5E]">{BOARD_SAMPLE.kpiUnit}</p>
                </div>
                <span className="mt-3 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-caption font-semibold" style={{ background: accentSoft, color: "#2B2A26" }}>{BOARD_SAMPLE.kpiDelta}</span>
              </div>
              {/* event: a date block in the main colour, the title, a small button */}
              <div className="flex w-[40%] shrink-0 flex-col justify-between rounded-[6px] p-3 ring-1 ring-inset ring-[#E4E0D6]">
                <div className="flex items-start gap-2">
                  <span className="grid w-11 shrink-0 place-items-center rounded-[6px] py-1 text-center leading-tight" style={{ background: btn, color: onBtn }}>
                    <span className="text-lead font-bold">{BOARD_SAMPLE.eventDay}</span><span className="text-[11px]">{BOARD_SAMPLE.eventMonth}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-caption font-bold leading-snug @md:text-small" style={head}>{BOARD_SAMPLE.eventTitle}</p>
                    <p className="mt-0.5 text-caption text-[#6F6A5E]">{BOARD_SAMPLE.eventText}</p>
                  </div>
                </div>
                <span className="mt-3 inline-flex h-7 w-fit items-center rounded-full px-3 text-caption font-semibold ring-1 ring-inset ring-[#D9D5CB]">{BOARD_SAMPLE.eventBtn}</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section n="03" title="คำตอบและหน้าแรก">
        <div className="grid gap-3 @2xl:grid-cols-2">
          <div className={`${CARD} p-4 @2xl:p-5`}>
            <Label>คำตอบของคุณ</Label>
            {d.answers.length ? (
              // one answer a row, divided by hairlines: topic muted on the left, the answer on the
              // right, every answer starting on the same line so both sides read straight down
              <dl className="mt-2 divide-y divide-black/[0.08]">
                {d.answers.map((a) => (
                  <div key={a.topic} className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-baseline gap-3 py-2">
                    <dt className={`text-small leading-snug ${MUTED}`}>{a.topic}</dt>
                    <dd className="m-0 text-small font-semibold leading-snug">{a.choice}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className={`mt-2 text-small ${MUTED}`}>ยังไม่ได้ตอบคำถามสำรวจแนวทาง</p>}
          </div>
          <div className={`${CARD} p-4 @2xl:p-5`}>
            <Label>หน้าแรก · เรียงจากบนลงล่าง</Label>
            {names.length ? (
              // a plain numbered list, divided by hairlines: no boxes, no row standing out —
              // filled rows with a highlighted first one read as something to pick
              <ol className="mt-2 grid grid-cols-[minmax(0,1fr)] divide-y divide-black/[0.08]">
                {names.map((n, i) => (
                  <li key={n} className="flex items-baseline gap-3 py-2 text-small">
                    <span className={`w-5 shrink-0 font-mono text-caption ${MUTED}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 break-words">{n}</span>
                  </li>
                ))}
              </ol>
            ) : <p className={`mt-2 text-small ${MUTED}`}>ยังไม่ได้จัดหน้าแรก</p>}
          </div>
        </div>
        {d.note && <Note>หมายเหตุ · {d.note}</Note>}
        {insp && <Note>แรงบันดาลใจที่แนบ · {insp}</Note>}
      </Section>

      {d.shots.length > 0 && (
        <Section n="04" title="แนวภาพ" chip="ตัวอย่างโทนภาพ">
          {d.visualMood && <p className="mb-3 text-small leading-relaxed text-[#4A473F]">{d.visualMood}</p>}
          <div className="grid grid-cols-3 gap-2 @2xl:grid-cols-6">
            {d.shots.slice(0, 6).map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.url} src={s.url} alt={s.cap} loading="lazy" draggable={false} className="pointer-events-none block w-full select-none rounded-[6px] object-cover" style={{ aspectRatio: "4 / 3" }} />
            ))}
          </div>
          <Note>ภาพตัวอย่างเพื่อบอกโทนภาพ · ทีมจะเลือกภาพที่ตรงกับธุรกิจของคุณอีกครั้ง</Note>
        </Section>
      )}

      <p className="mt-6 border-t border-black/[0.08] py-5 @2xl:mt-8 text-small text-[#8A8578]">
        เอกสารสรุปแนวทางจากคำตอบของคุณ ไม่ใช่งานออกแบบจริง · ทีม IR Plus จะคุยรายละเอียดกับคุณอีกครั้ง
      </p>
    </div>
  );
}
