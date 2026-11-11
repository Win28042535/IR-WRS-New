// AI-recommended Google font pairing per direction — heading paired with a neutral body
// on a contrast axis (serif/geometric heading + humanist body), all free on Google Fonts.
// `thai` is the Thai heading face matched to each Latin heading's character — always a
// loopless (ไม่มีหัว) face, by design decision; the Latin fonts carry no Thai glyphs.
export const FONT_PAIRINGS: Record<string, { heading: string; thai: string; body: string; note: string }> = {
  "premium-corporate": { heading: "Fraunces", thai: "Noto Sans Thai", body: "Inter", note: "Serif ที่ดูมีระดับ คู่กับอักษรไทยไม่มีหัวที่เรียบ เป็นทางการ" },
  "esg-focused":       { heading: "Manrope", thai: "Anuphan", body: "Inter", note: "Humanist sans อบอุ่น เป็นมิตร" },
  "modern-tech":       { heading: "Space Grotesk", thai: "Prompt", body: "Inter", note: "Geometric sans ทันสมัย มีเอกลักษณ์" },
  "growth-oriented":   { heading: "Sora", thai: "Kanit", body: "Inter", note: "Grotesk เน้นความชัดของตัวเลข" },
};
export const DEFAULT_PAIRING = { heading: "Manrope", thai: "Anuphan", body: "Inter", note: "คู่ฟอนต์อเนกประสงค์ อ่านง่ายทุกขนาด" };

// CSS variables set by next/font in the root layout for every font FONT_PAIRINGS names.
const FONT_VARS: Record<string, string> = {
  Fraunces: "--font-fraunces",
  Manrope: "--font-manrope",
  "Space Grotesk": "--font-space-grotesk",
  Sora: "--font-sora",
  Inter: "--font-inter",
  "Noto Sans Thai": "--font-noto-sans-thai",
  Anuphan: "--font-anuphan",
  Prompt: "--font-prompt",
  Kanit: "--font-kanit",
};

/** font-family for a pairing font — the loaded next/font face, then a system fallback. */
export function fontStack(name: string) {
  const v = FONT_VARS[name];
  return `${v ? `var(${v})` : `"${name}"`}, system-ui, sans-serif`;
}
