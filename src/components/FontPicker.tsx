"use client";
// ── Website font (step 5) ─────────────────────────────────────────────────────────────
// FontChoice    — three ways to settle the font: the team's pick for the Direction (default),
//                 the fonts on their current site, or one they choose themselves.
// FontPickerSheet — the chooser. Grid first, grouped by structure (ไม่มีหัว / มีหัว) and then
//                 personality, so no font sits in two groups. Tapping a card opens that
//                 font's specimen page (Google Fonts-style, but in IR terms): their company
//                 name, a small IR page, a type tester, weights, sizes by role, numbers and
//                 stacked Thai marks. "เลือก …" stays pinned at the bottom.
// Phones: a full-height sheet; specimen replaces the grid. lg+: once a font is open, the
// list stays on the left and the specimen fills the right.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  FONT_CATALOG, FONT_GROUPS, FONT_STRUCTURES, ROLE_LABEL, WEIGHT_NAME,
  FONT_COLLECTIONS, familyStack, fontByFamily, groupLabel, inCollection, previewFamily, structureLabel, webWeights,
  type CatalogFont, type FontCollection, type FontStructure,
} from "@/lib/fontCatalog";
import { loadGoogleFont, useGoogleFont } from "@/lib/useGoogleFont";
import { DEFAULT_PAIRING, FONT_PAIRINGS } from "@/lib/fonts";
import type { Direction, Requirement } from "@/lib/types";
import { IconCheck, IconClose, IconEdit, IconGlobe, IconUsers } from "./icons";
import { OptionCard, SectionLabel } from "./ui";

// Figures match SAMPLE_FIN (lib/data) — the same sample company as the Explore mocks and
// the Deliver summary — with decimals kept so numeral rendering shows.
const SAMPLES = {
  heading: { label: "หัวข้อ", text: "รายงานประจำปี 2568", weight: 600 },
  numbers: { label: "ตัวเลข", text: "฿28,560.42 ล้าน ▲ 18%", weight: 500 },
  sentence: { label: "ประโยค", text: "ผลประกอบการไตรมาส 3/2568 เติบโตต่อเนื่อง", weight: 400 },
  company: { label: "ชื่อบริษัท", text: "", weight: 600 },
} as const;
type SampleKey = keyof typeof SAMPLES;
const FALLBACK_COMPANY = "บริษัท ตัวอย่าง จำกัด (มหาชน)";

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
};

// ── Step 5 block ──────────────────────────────────────────────────────────────────────
// "ใช้ฟอนต์จากเว็บไซต์เดิม" needs a current website (step 1's field, just above): without one
// the card is disabled, and clearing the URL later drops the choice back to the team's pick.
export function FontChoice({ draft, updateDraft, dir }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void; dir?: Direction | null }) {
  const team = (FONT_PAIRINGS[draft.selectedDirection ?? dir?.id] ?? DEFAULT_PAIRING).thai;
  const website = (draft.website ?? "").trim();
  const mode: "team" | "website" | "selected" = draft.fontMode === "website" && !website ? "team" : draft.fontMode ?? "team";
  const chosen = fontByFamily(draft.selectedFont);
  const [sheet, setSheet] = useState<null | { family?: string }>(null);
  useGoogleFont(chosen ? previewFamily(chosen.family) : undefined, [400, 600]);
  useGoogleFont(team, [400, 600]);
  useEffect(() => {
    if (draft.fontMode === "website" && !website) updateDraft({ fontMode: "team" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [website, draft.fontMode]);

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2">
        <SectionLabel>ฟอนต์ของเว็บไซต์</SectionLabel>
        <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
      </div>
      <p className="mb-3 mt-1 text-body text-ir-t3">จะให้ทีมเลือกให้ ใช้ฟอนต์เดิม หรือเลือกเองจากตัวอย่างก็ได้</p>
      <div className="grid gap-2.5 lg:grid-cols-3">
        <OptionCard
          icon={IconUsers}
          title="ให้ทีมแนะนำ"
          desc={dir
            ? <>ใช้ <span style={{ fontFamily: familyStack(team) }} className="font-semibold text-ir-t1">{team}</span> ตามแนวทาง {dir.label}</>
            : "ทีมเลือกให้เข้ากับแนวทางที่ได้จากขั้นสำรวจแนวทาง"}
          selected={mode === "team"}
          onSelect={() => updateDraft({ fontMode: "team" })}
        />
        <OptionCard
          icon={IconGlobe}
          title="ใช้ฟอนต์จากเว็บไซต์เดิม"
          desc={website ? `ทีมจะดูจาก ${website.replace(/^https?:\/\//, "")}` : "กรอกเว็บไซต์ปัจจุบันด้านบนก่อน จึงจะเลือกข้อนี้ได้"}
          selected={mode === "website"}
          disabled={!website}
          onSelect={() => updateDraft({ fontMode: "website" })}
        />
        <OptionCard
          icon={IconEdit}
          title="เลือกฟอนต์เอง"
          desc={chosen ? <>เลือกไว้: <span style={{ fontFamily: familyStack(chosen.family) }} className="font-semibold text-ir-t1">{chosen.family}</span></> : `ดูตัวอย่างและเลือกจาก ${FONT_CATALOG.length} ฟอนต์`}
          selected={mode === "selected"}
          onSelect={() => (chosen ? updateDraft({ fontMode: "selected" }) : setSheet({}))}
        />
      </div>

      {mode === "selected" && chosen && (
        <div className="mt-3 flex flex-col gap-4 rounded-xl border border-ir-border bg-ir-card p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="truncate text-heading leading-tight text-ir-t1" style={{ fontFamily: familyStack(chosen.family), fontWeight: 600 }}>
              {draft.company?.trim() || FALLBACK_COMPANY}
            </p>
            <p className="mt-1 text-small text-ir-t3">
              <span className="font-semibold text-ir-t1">{chosen.family}</span> · {structureLabel(chosen.structure)} · {groupLabel(chosen.group)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setSheet({ family: chosen.family })} className="inline-flex h-11 items-center rounded-full bg-ir-muted px-4 text-body font-semibold text-ir-t1 transition-colors hover:bg-ir-border focus-ring">ดูรายละเอียด</button>
            <button type="button" onClick={() => setSheet({})} className="inline-flex h-11 items-center rounded-full bg-ir-dark px-4 text-body font-semibold text-white transition-colors hover:bg-neutral-800 focus-ring">เปลี่ยนฟอนต์</button>
          </div>
        </div>
      )}

      {sheet && (
        <FontPickerSheet
          initialFamily={sheet.family}
          value={chosen?.family}
          teamFont={team}
          company={draft.company?.trim() || FALLBACK_COMPANY}
          dir={dir}
          onClose={() => setSheet(null)}
          onChoose={(family) => { updateDraft({ fontMode: "selected", selectedFont: family }); setSheet(null); }}
        />
      )}
    </div>
  );
}

// ── The sheet ─────────────────────────────────────────────────────────────────────────
// interest: browsing the team's options in step 1 ("ดูฟอนต์แนะนำอื่น ๆ") — the pinned button
// marks a font the client likes ("สนใจฟอนต์นี้"); the team still makes the final call.
export function FontPickerSheet({
  initialFamily, value, teamFont, company, dir, onClose, onChoose, interest = false,
}: {
  initialFamily?: string; value?: string; teamFont: string; company: string; dir?: Direction | null;
  onClose: () => void; onChoose: (family: string) => void; interest?: boolean;
}) {
  const [collection, setCollection] = useState<FontCollection>("all");
  const [structure, setStructure] = useState<"all" | FontStructure>("all");
  const [group, setGroup] = useState<string | null>(null);
  const inSource = FONT_CATALOG.filter((f) => inCollection(f, collection));
  const [sample, setSample] = useState<SampleKey>("heading");
  const [open, setOpen] = useState<string | null>(initialFamily ?? null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const groups = FONT_GROUPS.filter((g) => structure === "all" || g.structure === structure);
  const visible = inSource.filter((f) => (structure === "all" || f.structure === structure) && (!group || f.group === group));
  const font = open ? fontByFamily(open) : undefined;
  const idx = font ? visible.findIndex((f) => f.family === font.family) : -1;
  const nav = font && idx >= 0 ? { prev: visible[idx - 1], next: visible[idx + 1] } : null;

  // lock the page behind, focus the dialog, Escape = back (from a specimen) or close
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) setOpen(null); else onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // each page starts at the top
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [open]);

  const sampleText = (k: SampleKey) => (k === "company" ? company : SAMPLES[k].text);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="ปิด" onClick={onClose} className="sheet-backdrop absolute inset-0 bg-ir-dark/45 backdrop-blur-[2px]" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={font ? `ฟอนต์ ${font.family}` : interest ? "ฟอนต์แนะนำ" : "เลือกฟอนต์"}
        className="sheet-in relative flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-ir-card shadow-e3 outline-none sm:h-[min(860px,92dvh)] sm:max-w-[1180px] sm:rounded-2xl"
      >
        {/* header */}
        <div className="flex min-h-16 shrink-0 items-center gap-2 border-b border-ir-border-soft px-3 sm:px-5">
          {font ? (
            <>
              <button type="button" onClick={() => setOpen(null)} className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-body font-semibold text-ir-t1 transition-colors hover:bg-ir-muted focus-ring">
                <Chevron dir="left" /> ฟอนต์ทั้งหมด
              </button>
              <div className="ml-auto flex items-center gap-1">
                <span className="mr-1 hidden text-small text-ir-t3 sm:inline tabular-nums">{idx + 1} / {visible.length}</span>
                <IconBtn label="ฟอนต์ก่อนหน้า" disabled={!nav?.prev} onClick={() => nav?.prev && setOpen(nav.prev.family)}><Chevron dir="left" /></IconBtn>
                <IconBtn label="ฟอนต์ถัดไป" disabled={!nav?.next} onClick={() => nav?.next && setOpen(nav.next.family)}><Chevron dir="right" /></IconBtn>
              </div>
            </>
          ) : (
            <div className="min-w-0 pl-2">
              <p className="text-lead font-semibold text-ir-t1">{interest ? "ฟอนต์แนะนำ" : "เลือกฟอนต์"}</p>
              <p className="text-small text-ir-t3">{visible.length} ฟอนต์ · กดที่ฟอนต์เพื่อดูตัวอย่างบนเว็บไซต์ IR</p>
            </div>
          )}
          <IconBtn label="ปิด" onClick={onClose} className={font ? "" : "ml-auto"}><IconClose width={20} height={20} /></IconBtn>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* lg+: the list stays on the left while a specimen is open */}
          {font && (
            <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-r border-ir-border-soft bg-ir-sunken p-3 lg:block">
              {groups.map((g) => {
                const items = visible.filter((f) => f.group === g.id);
                if (!items.length) return null;
                return (
                  <div key={g.id} className="mb-3">
                    <p className="px-2 pb-1 text-caption font-semibold text-ir-t3">{structureLabel(g.structure)} · {g.label}</p>
                    {items.map((f) => <ListItem key={f.family} f={f} active={f.family === font.family} chosen={f.family === value} onClick={() => setOpen(f.family)} />)}
                  </div>
                );
              })}
            </aside>
          )}

          <div ref={bodyRef} className="min-w-0 flex-1 overflow-y-auto">
            {font ? (
              <Specimen key={font.family} font={font} company={company} teamFont={teamFont} dir={dir} />
            ) : (
              <div className="px-4 pb-8 pt-4 sm:px-6">
                {/* level 0: where the font comes from — IR Plus's licensed set or free Google Fonts */}
                <div role="group" aria-label="ที่มาของฟอนต์" className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                  {FONT_COLLECTIONS.map((c) => {
                    const n = FONT_CATALOG.filter((f) => inCollection(f, c.id)).length;
                    const on = collection === c.id;
                    return (
                      <button key={c.id} type="button" aria-pressed={on} onClick={() => { setCollection(c.id); setStructure("all"); setGroup(null); }}
                        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 sm:px-4 text-small sm:text-body font-semibold transition-colors focus-ring ${on ? "border-ir-dark bg-ir-dark text-white" : "border-ir-border bg-ir-card text-ir-t2 hover:border-ir-border-hi hover:text-ir-t1"}`}>
                        {c.id === "irplus" && <span aria-hidden className={on ? "text-ir-accent" : "text-ir-accent-text"}>★</span>}
                        <span className="sm:hidden">{c.short}</span><span className="max-sm:hidden">{c.label}</span><span className={`font-mono text-caption ${on ? "text-white/70" : "text-ir-t3"}`}>{n}</span>
                      </button>
                    );
                  })}
                </div>
                {collection === "irplus" && (
                  <p className="-mt-1 mb-3 max-w-[64ch] text-small leading-relaxed text-ir-t3">ฟอนต์ลิขสิทธิ์ที่ทีม IR Plus มีไว้ใช้กับงานเว็บไซต์ · บนหน้านี้แสดงเป็นตัวอย่างโดยประมาณ</p>
                )}
                {/* level 1: structure */}
                <div role="group" aria-label="โครงสร้างตัวอักษร" className="inline-flex rounded-full bg-ir-muted p-1">
                  {([{ id: "all", label: "ทั้งหมด" }, ...FONT_STRUCTURES] as { id: "all" | FontStructure; label: string }[]).map((s) => {
                    const n = s.id === "all" ? inSource.length : inSource.filter((f) => f.structure === s.id).length;
                    const on = structure === s.id;
                    return (
                      <button key={s.id} type="button" aria-pressed={on} onClick={() => { setStructure(s.id); setGroup(null); }}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-body font-semibold transition-colors focus-ring ${on ? "bg-ir-card text-ir-t1 shadow-e1" : "text-ir-t2 hover:text-ir-t1"}`}>
                        {s.label}<span className="font-mono text-caption text-ir-t3">{n}</span>
                      </button>
                    );
                  })}
                </div>
                {structure !== "all" && <p className="mt-2 text-small text-ir-t3">{FONT_STRUCTURES.find((s) => s.id === structure)?.hint}</p>}

                {/* level 2: personality */}
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="บุคลิก">
                  <Chip on={!group} onClick={() => setGroup(null)}>ทุกบุคลิก</Chip>
                  {groups.map((g) => (
                    <Chip key={g.id} on={group === g.id} onClick={() => setGroup(group === g.id ? null : g.id)}>
                      {structure === "all" && <span className="text-ir-t3">{structureLabel(g.structure)} · </span>}{g.label}
                    </Chip>
                  ))}
                </div>

                {/* sample text */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ir-border-soft pt-4">
                  <span className="text-small font-semibold text-ir-t3">ข้อความตัวอย่าง</span>
                  <div role="group" aria-label="ข้อความตัวอย่าง" className="inline-flex flex-wrap rounded-full bg-ir-muted p-1">
                    {(Object.keys(SAMPLES) as SampleKey[]).map((k) => (
                      <button key={k} type="button" aria-pressed={sample === k} onClick={() => setSample(k)}
                        className={`h-10 rounded-full px-3.5 text-small font-semibold transition-colors focus-ring ${sample === k ? "bg-ir-card text-ir-t1 shadow-e1" : "text-ir-t2 hover:text-ir-t1"}`}>
                        {SAMPLES[k].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* the grid, grouped */}
                {groups.map((g) => {
                  const items = visible.filter((f) => f.group === g.id);
                  if (!items.length) return null;
                  return (
                    <section key={g.id} className="mt-6">
                      <h3 className="mb-2.5 text-body font-semibold text-ir-t1">
                        <span className="text-ir-t3">{structureLabel(g.structure)} · </span>{g.label}
                        <span className="ml-1.5 font-mono text-caption text-ir-t3">{items.length}</span>
                      </h3>
                      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((f) => (
                          <li key={f.family}>
                            <FontCard f={f} text={sampleText(sample)} weight={SAMPLES[sample].weight} showNumbers={sample !== "numbers"}
                              team={f.family === teamFont} chosen={f.family === value} onOpen={() => setOpen(f.family)} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* pinned choose bar (specimen only) */}
        {font && (
          <div className="flex shrink-0 items-center gap-3 border-t border-ir-border-soft bg-ir-card px-4 pt-3 sm:px-5" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-body font-semibold text-ir-t1">{font.family}</p>
              <p className="truncate text-small text-ir-t3">{structureLabel(font.structure)} · {groupLabel(font.group)} · {ROLE_LABEL[font.role]}</p>
            </div>
            {font.family === value ? (
              <button type="button" onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ir-accent-soft px-6 text-lead font-semibold text-ir-t1 focus-ring sm:flex-none">
                <IconCheck width={18} height={18} /> {interest ? "สนใจฟอนต์นี้แล้ว" : "เลือกฟอนต์นี้อยู่แล้ว"}
              </button>
            ) : (
              <button type="button" onClick={() => onChoose(font.family)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ir-dark px-6 text-lead font-semibold text-white transition-colors hover:bg-neutral-800 focus-ring sm:flex-none">
                {interest ? "สนใจฟอนต์นี้" : `เลือก ${font.family}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Read-only preview of the font the team proposes (step 1, "ให้ทีมออกแบบเสนอใหม่") ──
// Nothing to pick: one font's specimen (their company name, an IR page, a type tester with
// heading / body / numbers, weights, sizes, Thai marks), compared with a plain standard
// font on the same IR page. Before Explore there's no Direction yet, so it's the starting
// pairing, labelled as a draft (user test AOT asked to compare fonts; CI decides the rest).
export function FontPreviewSheet({ family, company, compareWith = "IBM Plex Sans Thai", onClose }: {
  family: string; company?: string; compareWith?: string; onClose: () => void;
}) {
  const font = fontByFamily(family);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, []);
  if (!font) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="ปิด" onClick={onClose} className="sheet-backdrop absolute inset-0 bg-ir-dark/45 backdrop-blur-[2px]" />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`ตัวอย่างฟอนต์ ${font.family}`}
        className="sheet-in relative flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-ir-card shadow-e3 outline-none sm:h-[min(860px,92dvh)] sm:max-w-[960px] sm:rounded-2xl">
        <div className="flex min-h-16 shrink-0 items-center gap-2 border-b border-ir-border-soft px-3 sm:px-5">
          <div className="min-w-0 pl-2">
            <p className="text-lead font-semibold text-ir-t1">ฟอนต์ที่ทีมเสนอ <span className="font-normal text-ir-t3">(ร่าง)</span></p>
            <p className="text-small text-ir-t3">ดูอย่างเดียว ไม่ต้องเลือกอะไร</p>
          </div>
          <IconBtn label="ปิด" onClick={onClose} className="ml-auto"><IconClose width={20} height={20} /></IconBtn>
        </div>
        <div className="ir-scroll min-h-0 flex-1 overflow-y-auto">
          <p className="mx-4 mt-4 rounded-lg bg-primary-50 px-4 py-3 text-small leading-relaxed text-ir-t2 sm:mx-8">
            ข้อเสนอเบื้องต้นจากทีม · ฟอนต์จริงจะเลือกตามแนวทางที่ได้ในขั้นสำรวจแนวทาง และปรับได้ตอนคุยรายละเอียด
          </p>
          <Specimen font={font} company={company?.trim() || FALLBACK_COMPANY} teamFont={compareWith} compareLabel={`เทียบกับ ${compareWith}`} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Grid card ──
// The font is loaded when its card scrolls near the screen.
function FontCard({ f, text, weight, showNumbers, team, chosen, onOpen }: {
  f: CatalogFont; text: string; weight: number; showNumbers: boolean; team: boolean; chosen: boolean; onOpen: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadGoogleFont(previewFamily(f.family), [400, 500, 600]); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [f.family]);
  return (
    <button ref={ref} type="button" onClick={onOpen}
      className={`group flex h-full w-full flex-col rounded-xl border p-4 text-left transition-[border-color,box-shadow,background-color] duration-fast focus-ring ${chosen ? "border-ir-select bg-primary-50 shadow-selected" : "border-ir-border bg-ir-card hover:border-ir-border-hi hover:shadow-e2"}`}>
      <div className="flex min-h-6 items-center gap-1.5">
        <span className="rounded-full bg-ir-muted px-2 py-0.5 text-caption font-medium text-ir-t2">{ROLE_LABEL[f.role]}</span>
        {team && <span className="rounded-full bg-ir-accent-soft px-2 py-0.5 text-caption font-semibold text-ir-accent-text">★ ทีมแนะนำ</span>}
        {f.collection === "irplus" && <span className="rounded-full bg-ir-dark px-2 py-0.5 text-caption font-semibold text-white">IR Plus</span>}
        {chosen && <span className="ml-auto grid h-6 w-6 place-items-center rounded-full bg-ir-dark text-white"><IconCheck width={14} height={14} /></span>}
      </div>
      <div className="pb-4">
      {f.collection === "irplus" && <p className="mt-2 text-caption text-ir-t3">ตัวอย่างโดยประมาณ</p>}
      <p className="mt-3 line-clamp-2 text-[28px] leading-[1.25] text-ir-t1 sm:text-[30px]" style={{ fontFamily: familyStack(f.family), fontWeight: weight }}>{text}</p>
      {showNumbers && <p className="mt-1.5 truncate text-lead text-ir-t2 tabular-nums" style={{ fontFamily: familyStack(f.family), fontWeight: 500 }}>฿28,560.42 ล้าน ▲ 18%</p>}
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-ir-border-soft pt-3">
        <span className="min-w-0 flex-1 truncate text-body font-semibold text-ir-t1">{f.family}</span>
        <span className="shrink-0 text-small text-ir-t3">{webWeights(f).length} น้ำหนัก</span>
        <Chevron dir="right" className="shrink-0 text-ir-t3 transition-transform duration-fast group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function ListItem({ f, active, chosen, onClick }: { f: CatalogFont; active: boolean; chosen: boolean; onClick: () => void }) {
  useGoogleFont(previewFamily(f.family), [400, 500, 600]);
  return (
    <button type="button" onClick={onClick} aria-current={active || undefined}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors focus-ring ${active ? "bg-ir-card shadow-e1" : "hover:bg-ir-card/70"}`}>
      <span className="min-w-0 flex-1 truncate text-lead text-ir-t1" style={{ fontFamily: familyStack(f.family), fontWeight: 600 }}>{f.family}</span>
      {chosen && <IconCheck width={16} height={16} className="shrink-0 text-ir-accent-text" />}
    </button>
  );
}

// ── Specimen page ───────────────────────────────────────────────────────────────────
function Specimen({ font, company, teamFont, dir, compareLabel }: { font: CatalogFont; company: string; teamFont: string; dir?: Direction | null; compareLabel?: string }) {
  const weights = webWeights(font);
  useGoogleFont(previewFamily(font.family), webWeights(fontByFamily(previewFamily(font.family)) ?? font));
  useGoogleFont(teamFont, [400, 500, 600, 700]);
  const stack = familyStack(font.family);

  // type tester
  const PRESETS = {
    heading: { label: "หัวข้อ", size: 40, weight: 600, text: "ผลประกอบการไตรมาส 3/2568 เติบโตต่อเนื่อง" },
    body: { label: "เนื้อหา", size: 18, weight: 400, text: "บริษัทมีรายได้รวม 28,560.42 ล้านบาท เพิ่มขึ้นร้อยละ 18 จากปีก่อน จากการขยายฐานลูกค้าและการบริหารต้นทุนที่มีประสิทธิภาพ คณะกรรมการมีมติจ่ายเงินปันผลระหว่างกาลในอัตราหุ้นละ 0.35 บาท" },
    numbers: { label: "ตัวเลข", size: 36, weight: 500, text: "฿28,560.42 ล้าน ▲ 18%  EPS 3.21" },
  } as const;
  type PresetKey = keyof typeof PRESETS;
  const [preset, setPreset] = useState<PresetKey>("heading");
  const [text, setText] = useState<string>(PRESETS.heading.text);
  const [size, setSize] = useState<number>(PRESETS.heading.size);
  const nearest = (w: number) => weights.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a), weights[0] ?? 400);
  const [weight, setWeight] = useState<number>(nearest(600));
  const pick = (k: PresetKey) => { setPreset(k); setText(PRESETS[k].text); setSize(PRESETS[k].size); setWeight(nearest(PRESETS[k].weight)); };

  // compare the IR page with the team's font
  const [compare, setCompare] = useState<"this" | "team">("this");
  const mockFont = compare === "team" ? teamFont : font.family;

  const SIZES = [
    { px: 48, role: "หัวข้อหลัก (H1)", w: 600, text: "นักลงทุนสัมพันธ์" },
    { px: 32, role: "หัวข้อส่วน (H2)", w: 600, text: "ข้อมูลสำคัญทางการเงิน" },
    { px: 24, role: "หัวการ์ด", w: 600, text: "รายงานประจำปี 2568" },
    { px: 18, role: "เนื้อหานำ", w: 400, text: "เราเติบโตอย่างยั่งยืน พร้อมสร้างผลตอบแทนที่ดีให้ผู้ถือหุ้นทุกกลุ่ม" },
    { px: 16, role: "เนื้อหา", w: 400, text: "คณะกรรมการมีมติจ่ายเงินปันผลระหว่างกาลในอัตราหุ้นละ 0.35 บาท กำหนดจ่ายวันที่ 12 ธันวาคม 2568" },
    { px: 14, role: "ตาราง · คำบรรยาย", w: 400, text: "หน่วย: ล้านบาท · ข้อมูล ณ 30 กันยายน 2568" },
  ];

  return (
    <div className="px-4 pb-10 pt-5 sm:px-8 sm:pt-7">
      {/* 1. header */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag>{structureLabel(font.structure)}</Tag>
        <Tag>{groupLabel(font.group)}</Tag>
        <Tag>{ROLE_LABEL[font.role]}</Tag>
        {font.family === teamFont && <Tag accent>★ ทีมแนะนำสำหรับแนวทางนี้</Tag>}
        {font.collection === "irplus" && <Tag accent>★ ชุดของ IR Plus (ลิขสิทธิ์)</Tag>}
      </div>
      <h2 className="mt-3 text-display leading-tight text-ir-t1" style={{ fontFamily: stack, fontWeight: 600 }}>{font.family}</h2>
      <p className="mt-1 text-small text-ir-t3">ออกแบบโดย {font.designer} · {weights.length} น้ำหนักสำหรับเว็บ · {font.collection === "irplus" ? `ตัวอย่างโดยประมาณ (แสดงด้วย ${font.preview})` : "ใช้ฟรี (Google Fonts)"}</p>
      <p className="mt-3 max-w-[60ch] text-body leading-relaxed text-ir-t2">{font.note}</p>

      {/* 2. their name */}
      <div className="mt-6 rounded-2xl bg-ir-sunken px-5 py-7 sm:px-8 sm:py-10">
        <p className="text-[clamp(2rem,6vw,3.6rem)] leading-[1.15] text-ir-t1 [overflow-wrap:anywhere]" style={{ fontFamily: stack, fontWeight: nearest(600) }}>{company}</p>
        <p className="mt-3 text-title text-ir-t2" style={{ fontFamily: stack, fontWeight: nearest(400) }}>นักลงทุนสัมพันธ์ · Investor Relations</p>
      </div>

      {/* 3. on an IR page */}
      <Block title="บนเว็บไซต์ IR ของคุณ" sub="หน้าจำลองที่ใช้ฟอนต์นี้ทั้งหน้า กับชุดสีของแนวทางที่ได้"
        aside={font.family !== teamFont ? (
          <div role="group" aria-label="เปรียบเทียบฟอนต์" className="inline-flex rounded-full bg-ir-muted p-1">
            {([["this", font.family], ["team", compareLabel ?? `ทีมแนะนำ: ${teamFont}`]] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={compare === k} onClick={() => setCompare(k)}
                className={`h-10 rounded-full px-3.5 text-small font-semibold transition-colors focus-ring ${compare === k ? "bg-ir-card text-ir-t1 shadow-e1" : "text-ir-t2 hover:text-ir-t1"}`}>{l}</button>
            ))}
          </div>
        ) : null}>
        <IrMock family={mockFont} company={company} dir={dir} />
      </Block>

      {/* 4. tester */}
      <Block title="ลองพิมพ์ดู" sub="แก้ข้อความได้ ปรับขนาดและความหนาได้">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div role="group" aria-label="รูปแบบ" className="inline-flex rounded-full bg-ir-muted p-1">
            {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
              <button key={k} type="button" aria-pressed={preset === k} onClick={() => pick(k)}
                className={`h-10 rounded-full px-3.5 text-small font-semibold transition-colors focus-ring ${preset === k ? "bg-ir-card text-ir-t1 shadow-e1" : "text-ir-t2 hover:text-ir-t1"}`}>{PRESETS[k].label}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-small text-ir-t3">
            ขนาด
            <input type="range" min={14} max={72} value={size} onChange={(e) => setSize(Number(e.target.value))} className="h-1 w-32 cursor-pointer accent-ir-dark" aria-label="ขนาดตัวอักษร" />
            <span className="w-11 font-mono tabular-nums text-ir-t1">{size}px</span>
          </label>
        </div>
        <div role="group" aria-label="ความหนา" className="mt-3 flex flex-wrap gap-1.5">
          {weights.map((w) => (
            <button key={w} type="button" aria-pressed={weight === w} onClick={() => setWeight(w)}
              className={`h-10 rounded-full border px-3 text-small transition-colors focus-ring ${weight === w ? "border-ir-dark bg-ir-dark text-white" : "border-ir-border text-ir-t2 hover:border-ir-border-hi"}`}
              style={{ fontFamily: stack, fontWeight: w }}>{WEIGHT_NAME[w]}</button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} aria-label="ข้อความทดลอง"
          className="mt-4 w-full resize-y rounded-xl border border-ir-border bg-ir-card p-4 leading-snug text-ir-t1 outline-none focus:border-ir-accent"
          style={{ fontFamily: stack, fontWeight: weight, fontSize: size }} />
      </Block>

      {/* 5. weights */}
      <Block title="ความหนาที่ใช้ได้" sub="เว็บไซต์มักใช้ 3–4 ความหนา: บางสำหรับตัวเลขใหญ่ ปกติสำหรับเนื้อหา หนาสำหรับหัวข้อ">
        <ul className="divide-y divide-ir-border-soft">
          {weights.map((w) => (
            <li key={w} className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-baseline sm:gap-4">
              <span className="text-small text-ir-t3">{WEIGHT_NAME[w]} {w}</span>
              <span className="truncate text-heading text-ir-t1" style={{ fontFamily: stack, fontWeight: w }}>นักลงทุนสัมพันธ์ Investor Relations 2568</span>
            </li>
          ))}
        </ul>
      </Block>

      {/* 6. sizes by role */}
      <Block title="ขนาดตามการใช้งาน" sub="เช็คว่าตัวเล็กยังอ่านออก โดยเฉพาะตารางและคำบรรยาย">
        <ul className="divide-y divide-ir-border-soft">
          {SIZES.map((s) => (
            <li key={s.px} className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-baseline sm:gap-4">
              <span className="text-small text-ir-t3">{s.role} <span className="font-mono">· {s.px}px</span></span>
              <span className="leading-snug text-ir-t1 [overflow-wrap:anywhere]" style={{ fontFamily: stack, fontWeight: nearest(s.w), fontSize: s.px }}>{s.text}</span>
            </li>
          ))}
        </ul>
      </Block>

      {/* 7. numbers + marks */}
      <Block title="ตัวเลข สัญลักษณ์ และสระซ้อน" sub="ตัวเลขควรกว้างเท่ากันเพื่อให้ตารางเรียงตรงหลัก และสระ วรรณยุกต์ต้องไม่ชนกัน">
        <div className="grid gap-3 sm:grid-cols-2">
          <Glyphs label="ตัวเลขอารบิก" stack={stack} w={nearest(500)}>0123456789</Glyphs>
          <Glyphs label="ตัวเลขไทย" stack={stack} w={nearest(500)}>๐๑๒๓๔๕๖๗๘๙</Glyphs>
          <Glyphs label="สัญลักษณ์" stack={stack} w={nearest(500)}>฿ % , . ( ) + − ▲ ▼</Glyphs>
          <Glyphs label="สระและวรรณยุกต์ซ้อน" stack={stack} w={nearest(500)}>ผู้ถือหุ้น ปู่ ญาติ ฎีกา ฐาน ปั้น</Glyphs>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-ir-border">
          <table className="w-full min-w-[420px] text-left tabular-nums" style={{ fontFamily: stack }}>
            <thead><tr className="bg-ir-sunken text-small text-ir-t3"><th className="px-4 py-2 font-medium">ตัวเลขเรียงตรงหลักไหม</th><th className="px-4 py-2 text-right font-medium">2566</th><th className="px-4 py-2 text-right font-medium">2567</th><th className="px-4 py-2 text-right font-medium">2568</th></tr></thead>
            <tbody className="text-body text-ir-t1">
              {[["รายได้รวม", "20,489.27", "24,213.66", "28,560.42"], ["กำไรสุทธิ", "3,251.40", "3,678.55", "4,120.18"], ["กำไรต่อหุ้น (บาท)", "2.53", "2.87", "3.21"]].map((r) => (
                <tr key={r[0]} className="border-t border-ir-border-soft">{r.map((c, i) => <td key={i} className={`px-4 py-2 ${i ? "text-right" : ""}`} style={{ fontWeight: nearest(i ? 500 : 400) }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
    </div>
  );
}

// A small IR page in the given font and the Direction's colours.
function IrMock({ family, company, dir }: { family: string; company: string; dir?: Direction | null }) {
  const [c1 = "#141613", c2 = "#D7E027", c3 = "#FFFFFF"] = dir?.colors ?? [];
  const ink = isLight(c1) ? "#141613" : "#FFFFFF";
  const btnInk = isLight(c2) ? "#141613" : "#FFFFFF";
  const stack = familyStack(family);
  const short = company.replace(/^บริษัท\s*/, "").replace(/\s*จำกัด.*$/, "") || company;
  return (
    <div className="overflow-hidden rounded-xl border border-ir-border" style={{ fontFamily: stack, background: isLight(c3) ? c3 : "#FFFFFF" }}>
      <div className="flex items-center gap-4 px-4 py-3 sm:px-6" style={{ background: c1, color: ink }}>
        <span className="min-w-0 truncate text-body font-semibold">{short}</span>
        <span className="ml-auto hidden gap-4 text-small opacity-80 md:flex"><span>ภาพรวม</span><span>ข้อมูลทางการเงิน</span><span>เอกสาร</span><span>ข่าว</span></span>
      </div>
      <div className="grid gap-5 px-4 py-6 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:py-8">
        <div>
          <p className="text-small font-medium" style={{ color: isLight(c2) ? "#5F6A00" : c2 }}>นักลงทุนสัมพันธ์</p>
          <p className="mt-1 text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-tight text-[#141613]">เติบโตอย่างยั่งยืน เพื่อผู้ถือหุ้นทุกกลุ่ม</p>
          <p className="mt-3 text-body leading-relaxed text-[#4A4F47]">ติดตามผลการดำเนินงาน เอกสารนักลงทุน และกิจกรรมล่าสุดของบริษัทได้ในที่เดียว</p>
          <span className="mt-4 inline-flex h-11 items-center rounded-full px-5 text-body font-semibold" style={{ background: c2, color: btnInk }}>ดาวน์โหลดรายงานประจำปี 2568</span>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-small text-[#686D64]">ราคาหุ้น · SET</p>
          <p className="mt-1 text-[40px] font-semibold leading-none tabular-nums text-[#141613]">24.50</p>
          <p className="mt-2 text-body font-medium tabular-nums text-[#1E7B3C]">▲ 0.75 (+3.16%)</p>
          <p className="mt-2 text-caption text-[#686D64]">อัปเดต 14:30 น. · 12 พ.ย. 2568</p>
        </div>
      </div>
      <div className="grid gap-5 border-t border-black/[0.06] px-4 py-5 sm:px-6 md:grid-cols-2">
        <div>
          <p className="text-lead font-semibold text-[#141613]">ข้อมูลสำคัญทางการเงิน</p>
          <table className="mt-2 w-full text-small tabular-nums text-[#141613]">
            <thead><tr className="text-[#686D64]"><th className="py-1 text-left font-normal">ล้านบาท</th><th className="py-1 text-right font-normal">2567</th><th className="py-1 text-right font-normal">2568</th></tr></thead>
            <tbody>
              {[["รายได้รวม", "24,213.66", "28,560.42"], ["กำไรสุทธิ", "3,678.55", "4,120.18"], ["อัตรากำไรสุทธิ", "15.2%", "14.4%"]].map((r) => (
                <tr key={r[0]} className="border-t border-black/[0.06]"><td className="py-1.5">{r[0]}</td><td className="py-1.5 text-right">{r[1]}</td><td className="py-1.5 text-right font-semibold">{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-lead font-semibold text-[#141613]">ข่าวและเอกสารล่าสุด</p>
          <ul className="mt-2 divide-y divide-black/[0.06] text-small text-[#141613]">
            {[["12 พ.ย. 2568", "คำอธิบายและวิเคราะห์ของฝ่ายจัดการ ไตรมาส 3/2568"], ["8 พ.ย. 2568", "แจ้งมติคณะกรรมการ เรื่องการจ่ายเงินปันผลระหว่างกาล"]].map(([d, t]) => (
              <li key={t} className="py-2"><span className="block text-caption text-[#686D64]">{d}</span>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── small parts ──
function Block({ title, sub, aside, children }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-title font-semibold text-ir-t1">{title}</h3>
          {sub && <p className="mt-0.5 text-small text-ir-t3">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
function Glyphs({ label, stack, w, children }: { label: string; stack: string; w: number; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ir-border p-4">
      <p className="text-caption text-ir-t3">{label}</p>
      <p className="mt-1 text-heading leading-snug text-ir-t1 tabular-nums [overflow-wrap:anywhere]" style={{ fontFamily: stack, fontWeight: w }}>{children}</p>
    </div>
  );
}
function Tag({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${accent ? "bg-ir-accent-soft text-ir-accent-text" : "bg-ir-muted text-ir-t2"}`}>{children}</span>;
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-small font-semibold transition-colors focus-ring ${on ? "border-ir-dark bg-ir-dark text-white [&_span]:text-white/70" : "border-ir-border bg-ir-card text-ir-t1 hover:border-ir-border-hi"}`}>
      {children}
    </button>
  );
}
function IconBtn({ label, onClick, disabled, className = "", children }: { label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-ir-t2 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring disabled:opacity-30 disabled:hover:bg-transparent ${className}`}>
      {children}
    </button>
  );
}
function Chevron({ dir, className = "" }: { dir: "left" | "right"; className?: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

