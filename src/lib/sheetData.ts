/* eslint-disable @typescript-eslint/no-explicit-any -- drafts and submitted requirements both come in loosely typed, as in the flow page */
// Builds the one-page summary sheet (SheetData) from a draft or a submitted requirement.
// Shared by the deliver step's overview, its PDF / PNG download, and the download on the
// page shown after sending (which stamps the reference number).
import { noteWithLinkNames } from "@/lib/noteLinks";
import { BUSINESS_GOALS, QUIZ, RETIRED_SECTION_IDS, VISUAL_STYLES, directionById, keepsCi, sectionById, siteHostOf, unsplashUrl } from "@/lib/data";
import { FONT_PAIRINGS, DEFAULT_PAIRING, fontStack } from "@/lib/fonts";
import { chosenThaiFont, familyStack, fontByFamily } from "@/lib/fontCatalog";
import type { DesignProfile } from "@/lib/types";
import type { SheetData } from "@/lib/moodboardExport";
import { FEEL_LABEL, TELLING_LABEL, directionMappingFor } from "@/lib/directionMapping";

/** "2 ลิงก์ · 1 ไฟล์" for a list of attached links/files ("" when none). */
export function refCounts(items?: { type: string }[]): string {
  const list = items ?? [];
  const links = list.filter((r) => r.type === "url").length;
  const files = list.length - links;
  return [links ? `${links} ลิงก์` : "", files ? `${files} ไฟล์` : ""].filter(Boolean).join(" · ");
}

// Perceptual lightness of a hex — decides readable ink on a swatch.
export function isLightHex(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
}

// Map the direction's palette into named swatches (name from the "X & Y" palette label).
function namedPalette(dir: any): { hex: string; name: string; main: boolean }[] {
  const colors: string[] = dir?.colors ?? ["#151823", "#BCC416", "#FFFFFF"];
  const parts = String(dir?.palette ?? "").split(/\s*&\s*/);
  const fallback = ["Primary", "Accent", "Surface"];
  return colors.slice(0, 3).map((hex, i) => ({
    hex: hex.toUpperCase(),
    name: (parts[i] || fallback[i] || `Color ${i + 1}`).trim(),
    main: i === 0,
  }));
}

const NEUTRAL_RAMP = ["#F5F5F5", "#D9DBDE", "#B4B7BD", "#8A8F99", "#5A5F6B", "#33383F", "#151823"];


// ── The design concept the client co-authored, worked out from their real choices
// (Direction palette or their own brand colours, font, mood, homepage structure). Feeds
// sheetData(), which both the on-screen overview and the PDF / PNG sheet draw from, so
// the two never disagree. ──
export function conceptData(draft: any) {
  const dir = directionById(draft.selectedDirection);
  // the Thai face follows their step-5 choice when they picked one themselves
  const basePairing = FONT_PAIRINGS[draft.selectedDirection] ?? DEFAULT_PAIRING;
  const thaiPick = chosenThaiFont(draft);
  const pairing = thaiPick.source === "selected"
    ? { ...basePairing, thai: thaiPick.family, note: `ฟอนต์ภาษาไทยที่เลือกเอง คู่กับ ${basePairing.heading}` }
    : basePairing;
  // a picked catalog font (incl. an IR Plus face drawn by its preview) vs a pairing var font
  const thaiStack = thaiPick.source === "selected" ? familyStack(pairing.thai) : fontStack(pairing.thai);
  const mainFont = pairing.thai;
  const mainFontNote = fontByFamily(mainFont)?.note ?? basePairing.note;

  const p: DesignProfile | undefined = draft.designProfile;
  const dataDriven = p?.densityData ?? 0;
  // "ใช้ CI เดิม" = colours and font come from the current website, which this system doesn't
  // read: the board says so instead of passing the Direction's palette off as theirs (user
  // test #1: BTS is red, the board showed navy & gold). "ให้ทีมเสนอใหม่" shows the
  // Direction's palette as the team's proposal. No typed colour codes any more.
  const keepOwn = keepsCi(draft);
  const siteUrl = siteHostOf(draft.website);
  const own: string[] = [];
  const ownPending = keepOwn;
  const swatches = namedPalette(dir);
  const primary = swatches[0]?.hex ?? "#151823";
  const accent = own.length ? (own[1] ?? own[0]).toUpperCase() : swatches[1]?.hex ?? "#BCC416";
  const surface = own.length ? (own[2] && isLightHex(own[2]) ? own[2].toUpperCase() : "#FFFFFF") : swatches[2]?.hex ?? "#FFFFFF";
  const moodBg = own.length
    ? `linear-gradient(135deg, ${primary}, color-mix(in srgb, ${primary} 70%, #000))`
    : ownPending ? "linear-gradient(135deg,#151823,#33383F)" : dir?.bg ?? primary;
  const moodInk = own.length && isLightHex(primary) ? "#151823" : "#fff";
  const ink = NEUTRAL_RAMP[6];
  const muted = NEUTRAL_RAMP[3];
  // Five colours, each with the job it does on the site — so the palette reads as a plan
  // for the page, not just a row of hex codes.
  const paletteRoles = [
    { hex: primary, role: "Primary", use: "หัวเว็บ ปุ่มหลัก หัวข้อสำคัญ" },
    { hex: accent, role: "Accent", use: "ไฮไลต์ ตัวเลขเด่น เส้นกราฟ" },
    { hex: surface, role: "Background", use: "พื้นหลังหน้าและการ์ด" },
    { hex: ink, role: "Text", use: "ตัวหนังสือหลัก" },
    { hex: muted, role: "Muted", use: "คำบรรยาย เส้นแบ่ง" },
  ];
  const onPrimary = isLightHex(primary) ? ink : "#FFFFFF";
  const onAccent = isLightHex(accent) ? ink : "#FFFFFF";
  // Mood: one main feeling, the second only supports it — two equal words left the client
  // unsure which one the site is really about.
  const moods: string[] = dir?.mood ?? ["Professional & Clean"];
  const [mainMood, ...supportMoods] = moods;

  // The exact structure picked in "จัดหน้าแรก" (Structure step), in the order the
  // client arranged it — this board should mirror that decision, not restate it.
  const homepageSections = ((draft.selectedSections as string[] | undefined) ?? [])
    .filter((id) => !RETIRED_SECTION_IDS.includes(id))
    .map((id) => ({ id, name: sectionById(id)?.name ?? id }));
  return { dir, thaiPick, pairing, thaiStack, mainFont, mainFontNote, p, dataDriven, keepOwn, siteUrl, own, ownPending, swatches, primary, accent, surface, moodBg, moodInk, ink, muted, paletteRoles, onPrimary, onAccent, moods, mainMood, supportMoods, homepageSections };
}

// ── Save the summary as a one-page moodboard sheet (PDF or PNG) ──
// Click → the file downloads, no print dialog. The button itself reports the result:
// spinner + "กำลังบันทึก…", then a check + "บันทึกแล้ว" for a few seconds.
const SHEET_ROLE_TH: Record<string, string> = { Primary: "สีหลัก", Accent: "สีเน้น", Background: "พื้นหลัง", Text: "ตัวอักษร", Muted: "สีรอง" };

/** the body font shown on the moodboard (loaded from Google Fonts where it's drawn) */
export const BODY_FONT = "Sarabun";

/** "จากคำตอบ: เป้าหมายหลัก … · … · …" under the cover headline (screen and PDF/PNG). Off. */
const SHOW_TAGLINE_SOURCE = false;

export function sheetData(draft: any): SheetData {
  const c = conceptData(draft);
  const vs = VISUAL_STYLES[draft.selectedDirection];
  const picks = (draft.quizPicks ?? []) as { questionId: string; letter: "A" | "B" }[];
  return {
    company: draft.company ?? "",
    directionLabel: c.dir?.label ?? "Design Direction",
    // headline + sentence from goal #1 × feel × telling (the 32-row mapping); the visual
    // direction's own tagline until those three are known
    tagline: directionMappingFor(draft)?.headline ?? c.dir?.tagline,
    taglineDetail: directionMappingFor(draft)?.sentence,
    // where the headline came from — the three answers the mapping reads. Off (26 Nov 2026):
    // the client didn't need it on the cover; flip SHOW_TAGLINE_SOURCE to bring it back
    taglineSource: !SHOW_TAGLINE_SOURCE ? undefined : (() => { const m = directionMappingFor(draft); return m ? `จากคำตอบ: เป้าหมายหลัก “${BUSINESS_GOALS.find((g) => g.id === m.goal)?.label ?? m.goal}” · ${FEEL_LABEL[m.feel]} · ${TELLING_LABEL[m.telling]}` : undefined; })(),
    mainMood: c.mainMood,
    supportMoods: c.supportMoods,
    answers: picks.flatMap((p) => {
      const q = QUIZ.find((x) => x.id === p.questionId);
      return q ? [{ topic: q.topic, choice: (p.letter === "A" ? q.optionA : q.optionB).label }] : [];
    }),
    ownPending: c.ownPending,
    colorSource: c.keepOwn ? "ชุดสีเดิมของแบรนด์" : "ชุดสีตัวอย่างที่เข้ากับแนวทาง · สรุปอีกครั้งเมื่อคุยรายละเอียด",
    ciNote: c.keepOwn ? noteWithLinkNames(draft.ciKeepNote, draft.noteLinks?.ciKeep) : noteWithLinkNames(draft.ciNote, draft.noteLinks?.ci),
    // what CI they attached on "ใช้ CI ใหม่"; whatever is missing, the team proposes
    ciAssets: c.keepOwn ? "" : refCounts(draft.ciAssets),
    ciSite: c.keepOwn ? c.siteUrl : undefined,
    logo: c.keepOwn && draft.logo ? draft.logo : undefined,
    fontInterest: !c.keepOwn && fontByFamily(draft.fontInterest ?? "") ? draft.fontInterest : undefined,
    // three colours only — main, accent, background; text/muted greys add nothing here
    swatches: c.paletteRoles.slice(0, 3).map((r) => ({ hex: r.hex, role: SHEET_ROLE_TH[r.role] ?? r.role, use: r.use })),
    primary: c.primary,
    moodInk: c.moodInk,
    coverBg: c.moodBg,
    inspiration: {
      links: ((draft.references ?? []) as { type: string }[]).filter((r) => r.type === "url").length,
      files: ((draft.references ?? []) as { type: string }[]).filter((r) => r.type !== "url").length,
      note: noteWithLinkNames(draft.inspirationNote, draft.noteLinks?.inspiration),
    },
    fontName: c.mainFont,
    fontStack: c.thaiStack,
    fontSource: fontByFamily(c.mainFont)?.collection === "irplus" ? "ชุดฟอนต์ของ IR Plus" : "Google Fonts · ฟรี",
    // the body example is Sarabun (Thai + Latin, 23 Nov 2026): the pairing's Inter has no
    // Thai, so the Thai sample line drew in a fallback face
    bodyFont: BODY_FONT,
    bodyStack: familyStack(BODY_FONT),
    fontNote: c.mainFontNote,
    // the Thai half of a name like "Header / เมนูหลัก" or "เกี่ยวกับบริษัท / About Us", when there
    // is one (23 Nov 2026)
    sections: c.homepageSections.map((s) => s.name.split(" / ").map((p) => p.trim()).find((p) => /[฀-๿]/.test(p)) ?? s.name),
    note: noteWithLinkNames(draft.structureNote, draft.noteLinks?.structure),
    visualMood: vs?.mood,
    shots: (vs?.shots ?? []).map((s) => ({ url: unsplashUrl(s.id, 700), cap: s.cap })),
  };
}

