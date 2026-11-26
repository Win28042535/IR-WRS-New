// Thai word units that must not be split across lines (26 Nov 2026).
// Intl.Segmenter (and the browser's own line breaker) split compounds into their parts —
// "ความรับผิดชอบ" → ความ|รับ|ผิดชอบ, "น่าเชื่อถือ" → น่า|เชื่อ|ถือ — so a line could end mid-word.
// thaiUnits() joins the segmenter's words back into the compounds below; callers break lines
// only between units (canvas: line fitting; screen: <wbr> between nowrap spans).

const COMPOUNDS = [
  "ความรับผิดชอบ", "รับผิดชอบ", "น่าเชื่อถือ", "เชื่อถือ", "ความน่าเชื่อถือ", "สิ่งแวดล้อม",
  "ผลการดำเนินงาน", "การดำเนินงาน", "ดำเนินงาน", "ดำเนินธุรกิจ", "ตรวจสอบ", "นักลงทุน",
  "นักลงทุนสัมพันธ์", "ผลประกอบการ", "ประกอบการ", "การเติบโต", "เติบโต", "วิสัยทัศน์",
  "ภาพลักษณ์", "กำกับดูแล", "การกำกับดูแล", "ธรรมาภิบาล", "เทคโนโลยี", "ทันสมัย", "เป็นระบบ",
  "เป็นทางการ", "เข้าถึง", "เข้าใจ", "ครบถ้วน", "ทิศทาง", "ยั่งยืน", "ความยั่งยืน", "โปร่งใส",
  "ความโปร่งใส", "ผู้ถือหุ้น", "หมวดหมู่", "ศักยภาพ", "มาตรฐาน", "ดิจิทัล", "ปรับตัว", "จดจำ",
  "เรื่องราว", "ข้อมูล", "องค์กร", "ธุรกิจ", "สังคม", "การรับรู้", "แบรนด์", "สื่อสาร",
  "นักวิเคราะห์", "ผู้กำกับดูแล", "สถาบัน", "รายย่อย", "เป้าหมาย", "งบการเงิน", "การเงิน",
];
const SET = new Set(COMPOUNDS);
const MAX_PARTS = 5;

const words = (s: string): string[] =>
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(s), (x) => x.segment)
    : [s];

/** The text as units that may not be broken: segmenter words, with known compounds joined. */
export function thaiUnits(s: string): string[] {
  const w = words(s);
  const out: string[] = [];
  for (let i = 0; i < w.length; ) {
    let take = 1;
    for (let k = Math.min(MAX_PARTS, w.length - i); k > 1; k--) {
      if (SET.has(w.slice(i, i + k).join(""))) { take = k; break; }
    }
    out.push(w.slice(i, i + take).join(""));
    i += take;
  }
  return out;
}
