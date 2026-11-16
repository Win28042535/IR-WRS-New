// ── Thai font catalog for the font picker ─────────────────────────────────────────────
// Google Fonts only, so what the client sees is exactly what the team can ship. Designers
// and weights checked against fonts.google.com/metadata/fonts (Nov 2026).
//
// Two separate axes, so a font is never in two groups at once:
//   structure — the Thai letterform: ไม่มีหัว (loopless) or มีหัว (looped). The first choice.
//   group     — personality inside that structure. Exactly one per font.
// What a font is good for (headings / body) is a label on the card, not a category.
import { DEFAULT_PAIRING, FONT_PAIRINGS } from "./fonts";
import type { Requirement } from "./types";

export type FontStructure = "loopless" | "looped";
export type FontRole = "heading" | "body" | "both";

export const FONT_STRUCTURES: { id: FontStructure; label: string; hint: string }[] = [
  { id: "loopless", label: "ไม่มีหัว", hint: "ทันสมัย สะอาดตา ใช้กับหัวข้อได้ดี" },
  { id: "looped", label: "มีหัว", hint: "ทางการ คุ้นตา อ่านเนื้อหายาวได้สบาย" },
];

export const FONT_GROUPS: { id: string; structure: FontStructure; label: string }[] = [
  { id: "neutral", structure: "loopless", label: "เรียบ เป็นกลาง" },
  { id: "geometric", structure: "loopless", label: "เรขาคณิต ทันสมัย" },
  { id: "tech", structure: "loopless", label: "เหลี่ยม เทคโนโลยี" },
  { id: "formal", structure: "looped", label: "ทางการ อ่านง่าย" },
  { id: "classic", structure: "looped", label: "คลาสสิก มีเชิง" },
];

export const ROLE_LABEL: Record<FontRole, string> = {
  heading: "เหมาะกับหัวข้อ",
  body: "เหมาะกับเนื้อหา",
  both: "หัวข้อ + เนื้อหา",
};

export interface CatalogFont {
  family: string;          // Google Fonts family name (also the id)
  designer: string;
  weights: number[];       // upright weights available on Google Fonts
  structure: FontStructure;
  group: string;           // FONT_GROUPS id
  role: FontRole;
  note: string;            // why it suits an IR site, in plain Thai
}

export const FONT_CATALOG: CatalogFont[] = [
  // ไม่มีหัว · เรียบ เป็นกลาง
  { family: "Noto Sans Thai", designer: "Google", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "loopless", group: "neutral", role: "both", note: "เป็นกลาง ไม่แย่งความสนใจจากเนื้อหา ใช้ได้ทั้งหัวข้อและตารางตัวเลข" },
  { family: "IBM Plex Sans Thai", designer: "Mike Abbink, Bold Monday", weights: [100, 200, 300, 400, 500, 600, 700], structure: "loopless", group: "neutral", role: "both", note: "ดูเป็นมืออาชีพแบบองค์กรใหญ่ ตัวเลขชัด เหมาะกับข้อมูลการเงิน" },
  { family: "Anuphan", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700], structure: "loopless", group: "neutral", role: "both", note: "โค้งนุ่ม อบอุ่นกว่าฟอนต์เรียบทั่วไป เหมาะกับองค์กรที่อยากดูเข้าถึงง่าย" },
  // ไม่มีหัว · เรขาคณิต ทันสมัย
  { family: "Prompt", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "loopless", group: "geometric", role: "both", note: "ทรงกลมเรขาคณิต ทันสมัย อ่านง่ายทั้งหัวข้อใหญ่และเนื้อหา" },
  { family: "Kanit", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "loopless", group: "geometric", role: "heading", note: "แน่น หนักแน่น มีพลัง หัวข้อและตัวเลขใหญ่เด่นชัด" },
  // ไม่มีหัว · เหลี่ยม เทคโนโลยี
  { family: "Bai Jamjuree", designer: "Cadson Demak", weights: [200, 300, 400, 500, 600, 700], structure: "loopless", group: "tech", role: "both", note: "มุมตัด ดูทันสมัยแบบเทคโนโลยี แต่ยังอ่านเนื้อหาได้สบาย" },
  { family: "Chakra Petch", designer: "Cadson Demak", weights: [300, 400, 500, 600, 700], structure: "loopless", group: "tech", role: "heading", note: "เหลี่ยมชัด บุคลิกแรง เหมาะกับหัวข้อของธุรกิจเทคโนโลยีหรือพลังงาน" },
  { family: "K2D", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700, 800], structure: "loopless", group: "tech", role: "heading", note: "กึ่งเหลี่ยม ดูแข็งแรงและเป็นระบบ เหมาะกับหัวข้อและตัวเลข" },
  // มีหัว · ทางการ อ่านง่าย
  { family: "Sarabun", designer: "Suppakit Chalermlarp", weights: [100, 200, 300, 400, 500, 600, 700, 800], structure: "looped", group: "formal", role: "body", note: "คุ้นตาแบบเอกสารราชการ อ่านเนื้อหายาวได้สบาย ดูน่าเชื่อถือ" },
  { family: "Noto Sans Thai Looped", designer: "Google", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "looped", group: "formal", role: "body", note: "ตัวมีหัวที่เรียบและเป็นกลาง อ่านง่ายในทุกขนาด" },
  { family: "IBM Plex Sans Thai Looped", designer: "Mike Abbink, Bold Monday", weights: [100, 200, 300, 400, 500, 600, 700], structure: "looped", group: "formal", role: "body", note: "มีหัวแบบทันสมัย เป็นทางการแต่ไม่ดูเก่า" },
  { family: "Niramit", designer: "Cadson Demak", weights: [200, 300, 400, 500, 600, 700], structure: "looped", group: "formal", role: "body", note: "มีหัว เส้นเรียบเสมอ อ่านเนื้อหาได้สบายตา" },
  { family: "Krub", designer: "Cadson Demak", weights: [200, 300, 400, 500, 600, 700], structure: "looped", group: "formal", role: "both", note: "มีหัวทรงกว้าง เป็นมิตร ใช้ได้ทั้งหัวข้อและเนื้อหา" },
  // มีหัว · คลาสสิก มีเชิง
  { family: "Noto Serif Thai", designer: "Google", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "looped", group: "classic", role: "both", note: "มีเชิงแบบคลาสสิก ดูเป็นสถาบัน มั่นคง มีระดับ" },
  { family: "Taviraj", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "looped", group: "classic", role: "heading", note: "มีเชิงแบบหนังสือ หรูหรา เหมาะกับหัวข้อของแบรนด์พรีเมียม" },
  { family: "Trirong", designer: "Cadson Demak", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], structure: "looped", group: "classic", role: "heading", note: "คมและสง่า ให้ความรู้สึกเป็นทางการระดับสูง" },
  { family: "Pridi", designer: "Cadson Demak", weights: [200, 300, 400, 500, 600, 700], structure: "looped", group: "classic", role: "heading", note: "มีเชิงหนาแน่น อบอุ่นแบบดั้งเดิม เหมาะกับองค์กรที่มีประวัติยาว" },
];

export const fontByFamily = (family?: string) => FONT_CATALOG.find((f) => f.family === family);
export const groupLabel = (id: string) => FONT_GROUPS.find((g) => g.id === id)?.label ?? "";
export const structureLabel = (id: FontStructure) => FONT_STRUCTURES.find((s) => s.id === id)?.label ?? "";
/** The weights a website actually uses (Light–Bold), from what the family has. */
export const webWeights = (f: CatalogFont) => f.weights.filter((w) => w >= 300 && w <= 700);
export const WEIGHT_NAME: Record<number, string> = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };

export const familyStack = (family: string) => `"${family}", "IBM Plex Sans Thai", system-ui, sans-serif`;

// ── Which Thai heading font a requirement ends up with ──
export type FontSource = "selected" | "website" | "team";
export function chosenThaiFont(req: Pick<Requirement, "fontMode" | "selectedFont" | "selectedDirection" | "brandFonts">) {
  const team = (FONT_PAIRINGS[req.selectedDirection] ?? DEFAULT_PAIRING).thai;
  if (req.fontMode === "selected" && req.selectedFont && fontByFamily(req.selectedFont)) {
    return { family: req.selectedFont, source: "selected" as FontSource, team };
  }
  if (req.fontMode === "website") return { family: team, source: "website" as FontSource, team };
  return { family: team, source: "team" as FontSource, team };
}
export const SOURCE_LABEL: Record<FontSource, string> = {
  selected: "ลูกค้าเลือกเอง",
  website: "ใช้ฟอนต์จากเว็บไซต์เดิม",
  team: "ทีมแนะนำตามแนวทาง",
};
