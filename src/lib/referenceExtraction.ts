// ── Reference → Design Knowledge extraction ──
// References are no longer stored as URLs / screenshots. Instead, AI extracts reusable
// design knowledge across 17 dimensions and synthesizes it into design principles.
// The Blueprint then describes DESIGN DECISIONS, not a list of references.

import type { Requirement } from "./types";
import { audienceById } from "./data";

export interface DesignDimension { id: string; label: string; th: string; }

export const DESIGN_DIMENSIONS: DesignDimension[] = [
  { id: "navigation", label: "Navigation", th: "การนำทาง" },
  { id: "hero", label: "Hero", th: "Hero" },
  { id: "storytelling", label: "Storytelling", th: "การเล่าเรื่อง" },
  { id: "typography", label: "Typography", th: "ตัวอักษร" },
  { id: "motion", label: "Motion", th: "การเคลื่อนไหว" },
  { id: "grid", label: "Grid", th: "กริด" },
  { id: "layout", label: "Layout", th: "เลย์เอาต์" },
  { id: "cards", label: "Cards", th: "การ์ด" },
  { id: "cta", label: "CTA", th: "ปุ่มกระตุ้น" },
  { id: "footer", label: "Footer", th: "ส่วนท้าย" },
  { id: "section-flow", label: "Section Flow", th: "การไหลของ Section" },
  { id: "interaction", label: "Interaction", th: "ปฏิสัมพันธ์" },
  { id: "micro-animation", label: "Micro Animation", th: "ไมโครแอนิเมชัน" },
  { id: "information-density", label: "Information Density", th: "ความหนาแน่นข้อมูล" },
  { id: "visual-rhythm", label: "Visual Rhythm", th: "จังหวะภาพ" },
  { id: "color-language", label: "Color Language", th: "ภาษาสี" },
  { id: "white-space", label: "White Space", th: "พื้นที่ว่าง" },
];

const POOLS: Record<string, string[]> = {
  navigation: [
    "เมนู sticky จัดกลุ่มชัด เข้าถึงข้อมูลหลักได้ใน 1 คลิก",
    "Mega-menu แยกหมวดข้อมูลนักลงทุนอย่างเป็นระบบ",
    "แถบนำทางเรียบ โฟกัสเมนูสำคัญไม่เกิน 6 รายการ",
  ],
  hero: [
    "Hero ข้อความสั้นทรงพลัง + ตัวเลขสำคัญ + CTA เดียว",
    "Hero ใช้ภาพองค์กรจริงคู่กับ headline วิสัยทัศน์",
    "Hero เน้นพื้นที่ว่าง โฟกัสข้อความเดียวชัดเจน",
  ],
  storytelling: [
    "เล่าเรื่องแบบ scroll-driven จากภาพรวมสู่รายละเอียด",
    "ลำดับเนื้อหาตามคำถามที่นักลงทุนถามบ่อย",
    "ใช้ตัวเลขและ milestone เล่าเรื่องการเติบโต",
  ],
  typography: [
    "คู่ฟอนต์ sans น้ำหนักหนา + อ่านง่าย ลำดับหัวข้อชัด",
    "Type scale คอนทราสต์สูงระหว่างหัวข้อกับเนื้อหา",
    "ตัวเลขใช้ tabular figures เพื่ออ่านง่ายในตาราง",
  ],
  motion: [
    "เคลื่อนไหวเนียนตอน scroll fade/slide สั้น",
    "Motion เฉพาะจุดเน้น ไม่รบกวนการอ่านข้อมูล",
    "Transition นุ่ม 200–300ms สม่ำเสมอทั้งเว็บ",
  ],
  grid: [
    "12-column grid สม่ำเสมอ จัดวางคาดเดาได้",
    "Grid ยืดหยุ่นรองรับทั้งตารางและการ์ด",
    "Baseline grid คุมจังหวะแนวตั้งให้เป็นระเบียบ",
  ],
  layout: [
    "Section เต็มความกว้างสลับพื้นหลังเพื่อแยกเนื้อหา",
    "Layout สองคอลัมน์ ข้อมูลหลัก + สรุปด้านข้าง",
    "Layout กระชับ เนื้อหาสำคัญอยู่ครึ่งบนของหน้า",
  ],
  cards: [
    "การ์ดขอบมน เงานุ่ม ยกเล็กน้อยเมื่อ hover",
    "การ์ดข้อมูลการเงินแสดงตัวเลขเด่น + แนวโน้ม",
    "การ์ดเรียบ เส้นขอบบาง เน้นความชัดของเนื้อหา",
  ],
  cta: [
    "CTA หลักสีตัดกัน ข้อความเป็นกริยา ตำแหน่งคงที่",
    "CTA ดาวน์โหลดเอกสารเด่นในทุก section ที่เกี่ยวข้อง",
    "CTA รองแบบ ghost ที่ไม่แย่งความสนใจจาก CTA หลัก",
  ],
  footer: [
    "Footer จัดคอลัมน์ ติดต่อ IR + ลิงก์เอกสารครบ",
    "Footer มี quick links สู่รายงานและปฏิทินนักลงทุน",
    "Footer เรียบ พร้อม disclaimer และช่องทางกำกับดูแล",
  ],
  "section-flow": [
    "แต่ละ section มีจังหวะพัก หายใจได้ ไม่อัดแน่น",
    "ไหลจากภาพรวมองค์กรสู่ข้อมูลการเงินเชิงลึก",
    "สลับความหนาแน่นของเนื้อหาเพื่อคงความสนใจ",
  ],
  interaction: [
    "Feedback ทันทีทุก hover / focus / active",
    "สถานะ loading / empty / error ชัดเจนและเป็นมิตร",
    "ปฏิสัมพันธ์คาดเดาได้ ตามมาตรฐานที่ผู้ใช้คุ้นเคย",
  ],
  "micro-animation": [
    "Count-up ตัวเลขการเงินเมื่อเลื่อนถึง",
    "เส้นใต้ลิงก์ค่อยๆ ปรากฏเมื่อ hover",
    "ไอคอนขยับเล็กน้อยเพื่อบอกสถานะการทำงาน",
  ],
  "information-density": [
    "หนาแน่นสูง จัดระเบียบด้วยตารางและแท็บ",
    "หนาแน่นปานกลาง เว้นที่ว่างให้เนื้อหาหายใจ",
    "เบา ย่อยง่าย สรุปก่อนแล้วค่อยลงลึก",
  ],
  "visual-rhythm": [
    "จังหวะ spacing และ heading ซ้ำ สร้างความคาดเดาได้",
    "สลับขนาด section เพื่อสร้างจังหวะการมอง",
    "ใช้เส้นแบ่งและระยะห่างสม่ำเสมอทั้งเว็บ",
  ],
  "color-language": [
    "โทนหลัก + accent เดียว ใช้สีสื่อสถานะของข้อมูล",
    "สีเข้มสื่อความมั่นคง accent เน้นตัวเลขสำคัญ",
    "จำกัดจานสีเพื่อคุมความน่าเชื่อถือ",
  ],
  "white-space": [
    "ระยะขอบกว้าง เน้น content สำคัญให้โดดเด่น",
    "White space รอบตัวเลขสำคัญเพื่อเพิ่มน้ำหนัก",
    "เว้นวรรคระหว่าง section อย่างชัดเจน",
  ],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

export interface KnowledgeContext {
  dense: boolean;   // institutional / analyst → prefers density
  light: boolean;   // retail / potential → prefers lightness
  bold: boolean;
  seed: string;     // company, so context-only extraction is stable
  audienceLabel: string;
}

export function knowledgeContext(d: Requirement): KnowledgeContext {
  const a = audienceById(d.primaryAudience ?? "");
  return {
    dense: a?.id === "institutional" || a?.id === "analyst",
    light: a?.id === "retail" || a?.id === "potential",
    bold: (d.designProfile?.energyBold ?? 0) >= 0,
    seed: d.company || "site",
    audienceLabel: a?.label ?? "กลุ่มเป้าหมาย",
  };
}

// Select a principle for one dimension given a reference seed + context.
function pick(dimId: string, refSeed: string, ctx: KnowledgeContext): string {
  const pool = POOLS[dimId] ?? [""];
  if (dimId === "information-density") {
    if (ctx.dense) return pool[0];
    if (ctx.light) return pool[2];
    return pool[1];
  }
  if ((dimId === "motion" || dimId === "micro-animation") && !ctx.bold) {
    return pool[1]; // calmer variant
  }
  return pool[hash(refSeed + dimId) % pool.length];
}

// Extract design knowledge from a single reference (returns all 17 dimensions).
export function extractFromReference(refValue: string, d: Requirement) {
  const ctx = knowledgeContext(d);
  return DESIGN_DIMENSIONS.map((dim) => ({
    ...dim,
    principle: pick(dim.id, refValue, ctx),
  }));
}

export interface DesignKnowledge extends DesignDimension {
  principle: string;
  why: string;
  sources: number;
}

function whyFor(dimId: string, ctx: KnowledgeContext): string {
  const a = ctx.audienceLabel;
  const map: Record<string, string> = {
    navigation: `${a}มาหาข้อมูลเฉพาะ การนำทางที่ชัดลดแรงเสียดทาน`,
    hero: `First impression ต้องสื่อความน่าเชื่อถือให้${a}ทันที`,
    storytelling: `ช่วยให้${a}เข้าใจภาพรวมก่อนลงข้อมูลเชิงลึก`,
    typography: `ความชัดของตัวอักษรคือความน่าเชื่อถือของข้อมูลการเงิน`,
    motion: `การเคลื่อนไหวต้องเสริมการอ่าน ไม่ลดความจริงจังของข้อมูล`,
    grid: `โครงที่สม่ำเสมอทำให้ข้อมูลจำนวนมากดูเป็นระเบียบ`,
    layout: `เลย์เอาต์รองรับเนื้อหาจริงและลำดับความสำคัญของ${a}`,
    cards: `การ์ดช่วยสรุปข้อมูลการเงินให้อ่านและเทียบได้เร็ว`,
    cta: `${a}ต้องดาวน์โหลดเอกสารและติดต่อได้ง่าย`,
    footer: `Footer เป็นจุดรวมทางลัดสู่เอกสารและช่องทางกำกับ`,
    "section-flow": `การไหลที่ดีคงความสนใจตลอดการอ่านข้อมูลยาว`,
    interaction: `ปฏิสัมพันธ์ที่ชัดสร้างความมั่นใจในการใช้งาน`,
    "micro-animation": `รายละเอียดเล็กๆ เพิ่มความประณีตโดยไม่รบกวน`,
    "information-density": `ความหนาแน่นต้องพอดีกับ${a} ไม่มากจนท่วม ไม่น้อยจนขาด`,
    "visual-rhythm": `จังหวะที่คาดเดาได้ทำให้เว็บดูมืออาชีพ`,
    "color-language": `สีที่มีวินัยคุมความน่าเชื่อถือของแบรนด์ IR`,
    "white-space": `พื้นที่ว่างชี้นำสายตาไปยังข้อมูลที่สำคัญที่สุด`,
  };
  return map[dimId] ?? "สนับสนุนเป้าหมายการสื่อสารของเว็บไซต์ IR";
}

// Aggregate across all references → consolidated reusable design knowledge.
// If there are no references, knowledge is synthesized from the project's own context,
// so the Blueprint still DESCRIBES DECISIONS rather than listing sources.
export function aggregateDesignKnowledge(d: Requirement | null): DesignKnowledge[] {
  if (!d) return [];
  const ctx = knowledgeContext(d);
  const refs = (d.references ?? []).map((r) => r.value).filter(Boolean);
  const seeds = refs.length ? refs : [ctx.seed];

  return DESIGN_DIMENSIONS.map((dim) => {
    const picks = Array.from(new Set(seeds.map((s) => pick(dim.id, s, ctx))));
    const principle = picks.slice(0, 2).join(" + ");
    return {
      ...dim,
      principle,
      why: whyFor(dim.id, ctx),
      sources: refs.length,
    };
  });
}
