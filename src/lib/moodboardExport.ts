// ── Moodboard sheet export (PDF / PNG) ──
// One portrait sheet that sums up the client's answers, downloaded straight away — no
// print dialog, nothing to set up. Drawn on a <canvas> so it uses the page's own loaded
// web fonts (Thai shaping included), then saved as PNG, or wrapped as the single image of
// a one-page PDF written by hand below. No libraries: the PDF is just a JPEG on a page.

export type SheetData = {
  company: string;
  directionLabel: string;
  tagline?: string;
  mainMood?: string;
  supportMoods: string[];
  /** quiz answers, e.g. { topic: "ความรู้สึกของเว็บ", choice: "เป็นทางการ" } */
  answers: { topic: string; choice: string }[];
  /** true → the team takes colours from the client's site / logo; no swatches shown */
  ownPending: boolean;
  ciSite?: string;
  logo?: string;        // company logo (data URL), top-right of the cover
  fontInterest?: string; // a font the client liked; the team decides
  colorSource: string;
  /** given only on the page after sending: stamped at the foot ("Ref. No. … · ดาวน์โหลดเมื่อ …") */
  refNo?: string;
  /** step 2 note: what to change from the kept CI, or the tone in mind for the refresh */
  ciNote?: string;
  /** "2 ลิงก์ · 1 ไฟล์" of CI the client attached on the refresh option ("" = none) */
  ciAssets?: string;
  swatches: { hex: string; role: string; use: string }[];
  primary: string;
  moodInk: string;
  /** CSS background of the cover band on screen (gradient); the sheet uses `primary` */
  coverBg: string;
  /** what the client attached in the Inspiration step */
  inspiration: { links: number; files: number; note?: string };
  fontName: string;
  /** CSS font-family stack of the main Thai font (may contain var(--…)) */
  fontStack: string;
  /** where the main font comes from, for the moodboard view ("Google Fonts · ฟรี" / IR Plus set) */
  fontSource: string;
  /** the body (Latin) font of the pairing and its CSS stack — moodboard view only */
  bodyFont: string;
  bodyStack: string;
  fontNote?: string;
  sections: string[];
  note?: string;
  visualMood?: string;
  shots: { url: string; cap: string }[];
};

// Portrait, one column, phone-first: a fixed width and a height that follows the content
// (never shorter than A4), with type large enough to read on a phone screen.
const W = 1440;
const M = 96; // outer margin
const PAPER = "#FBFAF6";
const INK = "#2B2A26";
const MUTED = "#8A8578";
const LINE = "#E4E0D6";
/** moodboard panels: a solid paper tone, darker than the sheet, never outlined */
const PANEL = "#F1EEE6";

/** var(--x) → the actual family names, so canvas `ctx.font` can use the stack. */
function resolveStack(stack: string) {
  const cs = getComputedStyle(document.body);
  return stack.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || "sans-serif");
}

function loadImage(url: string, timeout = 8000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const t = setTimeout(() => resolve(null), timeout);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); resolve(null); };
    img.src = url;
  });
}

/** Thai has no spaces between words — break on word boundaries via Intl.Segmenter. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 99): string[] {
  const words: string[] = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), (s) => s.segment)
    : text.split(/(\s+)/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur + w;
    if (ctx.measureText(next).width > maxW && cur.trim()) {
      lines.push(cur.trimEnd());
      cur = w.trimStart();
      if (lines.length === maxLines) break;
    } else cur = next;
  }
  if (lines.length < maxLines && cur.trim()) lines.push(cur.trim());
  if (lines.length === maxLines && words.join("").length > lines.join("").length) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

/** a → b by t (0..1), both #RRGGBB */
function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.replace("#", "").padEnd(6, "0").slice(i - 1, i + 1), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
/** #RRGGBB at an alpha, as rgba() */
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "").padEnd(6, "0");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
// ── Cover headline: one set of rules for the screen and the PDF / PNG (23 Nov 2026) ──
// The headline is cut into phrases at its spaces (or at " · " for the mood fallback, the
// dot staying with the phrase before it), and a phrase is kept whole on one line. Thai
// has no spaces inside a phrase, so a long run-on phrase ("เน้นตัวเลขและผลประกอบการที่ชัดเจน")
// can't be kept whole: it breaks between Thai words instead, and the headline steps
// down a size, so it never runs off the cover.
export const HEADLINE_LONG_PHRASE = 16;
export function headlinePhrases(t: string): string[] {
  return t.includes(" · ")
    ? t.split(" · ").map((p, i, a) => (i < a.length - 1 ? `${p} ·` : p))
    : t.split(" ").filter(Boolean);
}
/** A phrase too long to keep on one line: a run of Thai with no space in it. */
export const isLongPhrase = (p: string) => !p.includes(" ") && p.length > HEADLINE_LONG_PHRASE;
export const headlineIsLong = (t: string) => headlinePhrases(t).some(isLongPhrase);
/** Kept on one line on screen: a short single phrase. A multi-word one (the English mood
 *  fallback, "Professional & Clean") wraps at its own spaces on a phone. */
export const keepPhraseWhole = (p: string) => !p.includes(" ") && !isLongPhrase(p);

const thaiWords = (s: string): string[] =>
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(s), (x) => x.segment)
    : [s];

// Thai linking words: a long run is cut into chunks that start at one of these, so a
// line breaks between meaningful pieces ("เน้นตัวเลข / และผลประกอบการ / ที่ชัดเจน") and never
// inside a compound the word splitter cuts in two ("ผล|ประกอบการ").
const TH_LINKS = new Set(["และ", "ที่", "ด้วย", "ของ", "ใน", "เพื่อ", "กับ", "แก่", "สู่", "จาก", "โดย", "อย่าง", "หรือ", "แต่"]);
export function headlineChunks(phrase: string): string[] {
  const chunks: string[] = [];
  for (const w of thaiWords(phrase)) {
    if (chunks.length && !TH_LINKS.has(w)) chunks[chunks.length - 1] += w;
    else chunks.push(w);
  }
  return chunks;
}

/** Headline lines for the canvas: phrases kept whole when they fit, else broken between
 *  Thai words; the first line can be narrower (beside the logo); at most `maxLines`, the
 *  last one ending in "…" when there's more. */
function headlineLines(ctx: CanvasRenderingContext2D, text: string, firstW: number, restW: number, maxLines = 3): string[] {
  const toks: { s: string; gap: boolean }[] = [];
  headlinePhrases(text).forEach((p, i) => {
    if (ctx.measureText(p).width <= Math.min(firstW, restW)) toks.push({ s: p, gap: i > 0 });
    else headlineChunks(p).forEach((ch, j) => {
      // a chunk still too wide falls back to single words
      const parts = ctx.measureText(ch).width <= Math.min(firstW, restW) ? [ch] : thaiWords(ch);
      parts.forEach((w, k) => toks.push({ s: w, gap: i > 0 && j === 0 && k === 0 }));
    });
  });
  const lines: string[] = [];
  let cur = "";
  for (const t of toks) {
    const next = cur ? cur + (t.gap ? " " : "") + t.s : t.s;
    const maxW = lines.length === 0 ? firstW : restW;
    if (cur.trim() && ctx.measureText(next).width > maxW) { lines.push(cur.trim()); cur = t.s.trimStart(); }
    else cur = next;
  }
  if (cur.trim()) lines.push(cur.trim());
  if (lines.length > maxLines) {
    const g = typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter("th", { granularity: "grapheme" }).segment(lines[maxLines - 1]), (x) => x.segment)
      : Array.from(lines[maxLines - 1]);
    while (g.length && ctx.measureText(g.join("") + "…").width > restW) g.pop();
    lines.splice(maxLines - 1, lines.length, g.join("").trimEnd() + "…");
  }
  return lines;
}

/** Cover watermark: a faint grid and a rising line with a soft fill under it (the same
 *  shape as CoverWatermark on screen: COVER_LINE, in 0..100 units of the box). */
export const COVER_LINE: [number, number][] = [[0, 82], [12, 74], [24, 78], [38, 60], [52, 64], [66, 44], [80, 48], [100, 22]];
function drawCoverWatermark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ink: string, accent: string) {
  ctx.save();
  ctx.strokeStyle = hexA(ink.length === 4 ? "#FFFFFF" : ink, 0.07);
  ctx.lineWidth = 2;
  for (let gx = x; gx <= x + w; gx += 72) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
  for (let gy = y; gy <= y + h; gy += 72) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
  const pt = ([px, py]: [number, number]) => [x + (px / 100) * w, y + (py / 100) * h] as const;
  const area = ctx.createLinearGradient(0, y + h * 0.2, 0, y + h);
  area.addColorStop(0, hexA(accent, 0.16));
  area.addColorStop(1, hexA(accent, 0));
  ctx.beginPath();
  COVER_LINE.forEach((p, i) => { const [px, py] = pt(p); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  ctx.fillStyle = area; ctx.fill();
  ctx.beginPath();
  COVER_LINE.forEach((p, i) => { const [px, py] = pt(p); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  // fades in from the left so it never runs under the type
  const fade = ctx.createLinearGradient(x, 0, x + w * 0.55, 0);
  fade.addColorStop(0, hexA(accent, 0)); fade.addColorStop(1, hexA(accent, 0.5));
  ctx.strokeStyle = fade; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.stroke();
  ctx.restore();
}

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
};


// ── Moodboard view (23 Nov 2026) ──
// The same answers laid out as a style tile: cards for colour, type, sample UI, answers and
// homepage, after a reference the team liked (Colors / Typography / UI Styling). Only the
// presentation is borrowed — nothing here is a control (no shuffle, lock or "+"), as testers
// tried to click things on the summary before. Screen: ProjectOverview view="board".

/** Neutral greys, light to dark ("โทนเทา": text, backgrounds and lines). */
export const NEUTRALS = ["#FFFFFF", "#F2F1EE", "#DAD8D2", "#B3B0A8", "#85827A", "#53514B", "#22211E", "#0B0C08"];

/** Nine shades of a colour, light to dark; index 4 is the colour itself. */
export function tintSteps(hex: string): string[] {
  return [0.86, 0.7, 0.5, 0.26].map((t) => mixHex(hex, "#FFFFFF", t))
    .concat([hex.toUpperCase()], [0.22, 0.42, 0.6, 0.76].map((t) => mixHex(hex, "#000000", t)));
}

/** Sample words for the "องค์ประกอบบนเว็บ" cards — investor content, not lorem ipsum. */
export const BOARD_SAMPLE = {
  url: "ir.company.co.th",
  primaryBtn: "ดูงบการเงิน",
  secondaryBtn: "ดาวน์โหลด",
  fieldLabel: "อีเมลรับข่าวสารนักลงทุน",
  fieldPlaceholder: "name@company.com",
  cardTitle: "ผลประกอบการ Q3",
  cardText: "สรุปตัวเลขสำคัญและบทวิเคราะห์จากผู้บริหาร",
  card2Title: "รายงานประจำปี 2567",
  card2Text: "ดาวน์โหลดเอกสารฉบับเต็ม",
  kpiLabel: "รายได้รวม Q3",
  kpiValue: "12,480",
  kpiUnit: "ล้านบาท",
  kpiDelta: "▲ 8.2%",
  eventDay: "14",
  eventMonth: "พ.ย.",
  eventTitle: "ประชุมนักวิเคราะห์",
  eventText: "10:00 น. · ออนไลน์",
  eventBtn: "ลงทะเบียน",
  headSample: "นักลงทุนสัมพันธ์ · ข้อมูลสำคัญทางการเงิน",
  bodySample: "รายได้รวม 12,480 ล้านบาท เพิ่มขึ้น 8.2% จากปีก่อน",
};

/** The moodboard banner: the headline tile in the main colour (with the watermark), then one
 *  row under it — main mood on the accent, supporting mood on a light tint — as on screen
 *  (Banner). Returns its bottom. */
function drawBoardBanner(ctx: CanvasRenderingContext2D, d: SheetData, head: string, ui: string, logoImg: HTMLImageElement | null): number {
  const CW = W - 2 * M, G = 20, top = 96; // card-to-card gap, as in drawBoard
  const font = (w: number, px: number, fam = ui) => { ctx.font = `${w} ${px}px ${fam}`; };
  const text = (s: string, x: number, y: number, color = INK) => { ctx.fillStyle = color; ctx.fillText(s, x, y); };
  const on = d.moodInk;
  const titleText = d.tagline ?? [d.mainMood, ...d.supportMoods].filter(Boolean).join(" · ");
  const TS = headlineIsLong(titleText) ? 64 : 84, LH = Math.round(TS * 1.15);
  font(700, TS, head);
  const lines = headlineLines(ctx, titleText, logoImg ? CW - 80 - 230 : CW - 80, CW - 80);
  const H = Math.max(240, 112 + lines.length * LH + 30);
  ctx.save(); ctx.beginPath(); ctx.roundRect(M, top, CW, H, 20); ctx.clip();
  const g = ctx.createLinearGradient(M, top, M + CW, top + H);
  g.addColorStop(0, d.primary); g.addColorStop(1, mixHex(d.primary, isLight(d.primary) ? "#000000" : "#FFFFFF", 0.22));
  ctx.fillStyle = g; ctx.fillRect(M, top, CW, H);
  const glow = d.ownPending ? "#FFFFFF" : (d.swatches[1]?.hex ?? "#FFFFFF");
  const rg = ctx.createRadialGradient(M + CW, top, 0, M + CW, top, CW * 0.6);
  rg.addColorStop(0, hexA(glow, 0.3)); rg.addColorStop(1, hexA(glow, 0));
  ctx.fillStyle = rg; ctx.fillRect(M, top, CW, H);
  drawCoverWatermark(ctx, M + CW * 0.42, top, CW * 0.58, H, on, glow);
  ctx.restore();
  if (logoImg) {
    const lw0 = 190, lh0 = 96, lx = M + CW - 40 - lw0, ly = top + 36, pad = 16;
    ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.roundRect(lx, ly, lw0, lh0, 14); ctx.fill();
    const s = Math.min((lw0 - 2 * pad) / logoImg.naturalWidth, (lh0 - 2 * pad) / logoImg.naturalHeight);
    ctx.drawImage(logoImg, lx + (lw0 - logoImg.naturalWidth * s) / 2, ly + (lh0 - logoImg.naturalHeight * s) / 2, logoImg.naturalWidth * s, logoImg.naturalHeight * s);
  }
  ctx.globalAlpha = 0.78; font(500, 28); text("แนวทางที่ได้จากคำตอบของคุณ", M + 40, top + 66, on); ctx.globalAlpha = 1;
  font(700, TS, head); lines.forEach((ln, i) => text(ln, M + 40, top + 82 + LH * (i + 1) - Math.round(LH * 0.18), on));
  // moods: one neutral card under the headline — the main mood large on the left, the
  // supporting one beside it after a hairline (as on screen)
  const support = d.supportMoods.join(" · ");
  if (!d.mainMood && !support) return top + H;
  const my = top + H + G, mh = 160;
  ctx.fillStyle = PANEL; ctx.beginPath(); ctx.roundRect(M, my, CW, mh, 20); ctx.fill();
  font(600, 22); text("อารมณ์ของเว็บไซต์", M + 34, my + 48, MUTED);
  const half = d.mainMood && support ? CW / 2 : CW;
  if (d.mainMood) { font(600, 44); text(wrap(ctx, d.mainMood, half - 68, 1)[0] ?? "", M + 34, my + 116); }
  if (support) {
    const sx = d.mainMood ? M + half : M;
    if (d.mainMood) { ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(sx, my + 70, 2, 64); }
    const tx = sx + (d.mainMood ? 34 : 34);
    font(400, 22); text("เสริมด้วย", tx, my + 86, MUTED);
    font(600, 30); text(wrap(ctx, support, CW - (tx - M) - 34, 1)[0] ?? "", tx, my + 124);
  }
  return my + mh;
}

function drawBoard(ctx: CanvasRenderingContext2D, d: SheetData, top: number, imgs: (HTMLImageElement | null)[], head: string, ui: string, body: string): number {
  const CW = W - 2 * M;
  const G = 20, R = 20; // panels: 12px on screen, on the app's radius scale
  const font = (w: number, px: number, fam = ui) => { ctx.font = `${w} ${px}px ${fam}`; };
  const text = (s: string, x: number, y: number, color = INK) => { ctx.fillStyle = color; ctx.fillText(s, x, y); };
  const card = (x: number, y: number, w: number, h: number, fill = PANEL, stroke: string | null = null, r = R) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  };
  const clip = (x: number, y: number, w: number, h: number, r: number | number[], fn: () => void) => {
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); fn(); ctx.restore();
  };
  const cover = (img: HTMLImageElement | null, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = "#ECE9E1"; ctx.fillRect(x, y, w, h);
    if (!img) return;
    const s = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  };
  const pill = (label: string, xRight: number, yMid: number) => {
    font(600, 24); const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.beginPath(); ctx.roundRect(xRight - tw - 32, yMid - 21, tw + 32, 42, 21); ctx.fill();
    text(label, xRight - tw - 16, yMid + 8, "#6F6A5E");
  };
  const fit = (s: string, w: number, px: number, weight: number, fam: string) => {
    let size = px; font(weight, size, fam);
    while (size > 28 && ctx.measureText(s).width > w) { size -= 2; font(weight, size, fam); }
  };
  const label = (s: string, x: number, yy: number) => { font(600, 22); text(s, x, yy, MUTED); };
  const muted = (s: string, lines = 3) => { font(400, 26); wrap(ctx, s, CW, lines).forEach((ln) => { y += 40; text(ln, M, y, MUTED); }); };
  let y = top;
  const section = (n: string, title: string, chip?: string) => {
    // section rhythm and title → content gap follow the screen (32 / 16 on a wide sheet)
    y += 94; font(400, 26); text(n, M, y, MUTED);
    font(700, 40); text(title, M + 56, y);
    if (chip) pill(chip, M + CW, y - 12);
    y += 38;
  };
  const fromSite = (what: string, x: number, w: number) => {
    card(x, y, w, 130);
    font(600, 34); text(`ใช้${what}จากเว็บไซต์เดิม`, x + 30, y + 58);
    font(400, 26); text(`ทีมจะใช้${what}จาก ${d.ciSite ?? "เว็บไซต์ปัจจุบันของคุณ"}`, x + 30, y + 100, "#6F6A5E");
    return 130;
  };

  // ── 01 colours and type: the three colours in a row (greys as a strip) beside one font card
  section("01", "สีและตัวอักษร");
  if (d.ownPending && d.ciSite) y += fromSite("สีและฟอนต์", M, CW);
  else {
    const w1 = Math.round((CW - G) * 0.6), w2 = CW - w1 - G, x2 = M + w1 + G;
    let h1 = 0, h2 = 0;
    if (d.ownPending) h1 = fromSite("สี", M, w1);
    else {
      const tw = (w1 - 2 * 16) / 3, th = 170;
      d.swatches.slice(0, 3).forEach((s, i) => {
        const x = M + i * (tw + 16), light = isLight(s.hex), ink = light ? INK : "#FFFFFF";
        clip(x, y, tw, th, 14, () => {
          ctx.fillStyle = s.hex; ctx.fillRect(x, y, tw, th);
          const steps = tintSteps(s.hex), sw = tw / steps.length;
          steps.forEach((t, k) => { ctx.fillStyle = t; ctx.fillRect(x + k * sw, y + th - 10, sw + 1, 10); });
        });
        if (light) { ctx.beginPath(); ctx.roundRect(x, y, tw, th, 14); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); }
        font(600, 26); text(s.role, x + 22, y + 44, ink);
        font(500, 22); text(s.hex.toUpperCase(), x + 22, y + th - 32, ink);
        font(400, 21); wrap(ctx, s.use, tw - 4, 2).forEach((ln, k) => text(ln, x + 2, y + th + 34 + k * 28, MUTED));
      });
      const ny = y + th + 104;
      label("โทนเทา", M, ny + 8);
      const bx = M + 96, bw = w1 - 96;
      clip(bx, ny - 12, bw, 26, 6, () => {
        const sw = bw / (NEUTRALS.length - 1);
        NEUTRALS.slice(1).forEach((n, k) => { ctx.fillStyle = n; ctx.fillRect(bx + k * sw, ny - 12, sw + 1, 26); });
      });
      font(400, 21); text("ใช้กับตัวอักษร พื้นหลัง และเส้นแบ่ง", M, ny + 52, MUTED);
      h1 = th + 104 + 62;
    }
    if (d.ciSite) h2 = fromSite("ฟอนต์", x2, w2);
    else {
      const rows = [
        { lab: "หัวข้อ", name: d.fontName, fam: head, wt: 700, src: d.fontSource, sample: BOARD_SAMPLE.headSample },
        { lab: "เนื้อหา", name: d.bodyFont, fam: body, wt: 400, src: "Google Fonts · ฟรี", sample: BOARD_SAMPLE.bodySample },
      ];
      // heading row large and bold, body row small and quiet, the source once at the foot
      // (as on screen)
      const [hd, bd] = rows;
      const h1r = 168, h2r = 132, hf = 54; h2 = h1r + h2r + hf;
      card(x2, y, w2, h2);
      const rule = (ry: number) => { ctx.fillStyle = "rgba(0,0,0,0.07)"; ctx.fillRect(x2 + 28, ry, w2 - 56, 2); };
      label(hd.lab, x2 + 28, y + 42);
      fit(hd.name, w2 - 56, 56, 700, hd.fam); text(hd.name, x2 + 28, y + 104);
      font(600, 26, hd.fam); text(wrap(ctx, hd.sample, w2 - 56, 1)[0] ?? "", x2 + 28, y + 146);
      rule(y + h1r);
      label(bd.lab, x2 + 28, y + h1r + 40);
      font(500, 30, bd.fam); text(bd.name, x2 + 28, y + h1r + 80);
      font(400, 21, bd.fam); text(wrap(ctx, bd.sample, w2 - 56, 1)[0] ?? "", x2 + 28, y + h1r + 112, MUTED);
      rule(y + h1r + h2r);
      font(400, 20); text(hd.src === "Google Fonts · ฟรี" ? "ทั้งสองฟอนต์จาก Google Fonts · ฟรี" : `หัวข้อ · ${hd.src} · เนื้อหา · Google Fonts · ฟรี`, x2 + 28, y + h1r + h2r + 36, MUTED);
    }
    y += Math.max(h1, h2);
  }
  y += 6;
  if (!d.ownPending && !d.ciSite) muted("สีและฟอนต์ตัวอย่างที่เข้ากับอารมณ์ของเว็บ · สรุปอีกครั้งเมื่อคุยรายละเอียด", 2);
  if (d.fontInterest) { y += 40; font(500, 26); text(`ลูกค้าสนใจฟอนต์ · ${d.fontInterest}`, M, y); }
  if (d.ciAssets) muted(`CI ที่แนบ · ${d.ciAssets} · ส่วนที่ไม่ได้แนบ ทีมเสนอให้`, 2);
  if (d.ciNote) muted(`หมายเหตุ · ${d.ciNote}`, 3);

  // ── 02 sample page: a browser frame — buttons + field on the left, cards running past the
  // right edge
  section("02", "องค์ประกอบบนเว็บ", "ตัวอย่างองค์ประกอบ");
  {
    const H = 380, btn = d.ownPending ? "#151823" : d.primary, onBtn = isLight(btn) ? INK : "#FFFFFF";
    card(M, y, CW, H, "#E6E2D8");
    [0, 1, 2].forEach((i) => { ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath(); ctx.arc(M + 30 + i * 22, y + 26, 7, 0, Math.PI * 2); ctx.fill(); });
    font(400, 20); const uw = ctx.measureText(BOARD_SAMPLE.url).width + 44;
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.roundRect(M + (CW - uw) / 2, y + 10, uw, 32, 16); ctx.fill();
    text(BOARD_SAMPLE.url, M + (CW - uw) / 2 + 22, y + 33, MUTED);
    const px = M + 12, py = y + 52, pw = CW - 24, ph = H - 64, lw = Math.round(pw * 0.44);
    // two white panels split by a gap of the frame colour — never a line, so an underlined
    // field can't read as a divider (as on screen)
    const zg = 12;
    card(px, py, lw - zg / 2, ph, "#FFFFFF", null, 10);
    card(px + lw + zg / 2, py, pw - lw - zg / 2, ph, "#FFFFFF", null, 10);
    font(600, 26);
    const b1 = ctx.measureText(BOARD_SAMPLE.primaryBtn).width + 52, b2 = ctx.measureText(BOARD_SAMPLE.secondaryBtn).width + 52;
    ctx.fillStyle = btn; ctx.beginPath(); ctx.roundRect(px + 32, py + 34, b1, 60, 30); ctx.fill();
    text(BOARD_SAMPLE.primaryBtn, px + 58, py + 73, onBtn);
    ctx.beginPath(); ctx.roundRect(px + 32 + b1 + 14, py + 34, b2, 60, 30); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke();
    text(BOARD_SAMPLE.secondaryBtn, px + 58 + b1 + 14, py + 73);
    font(500, 22); text(BOARD_SAMPLE.fieldLabel, px + 32, py + 160);
    // underlined field: heavier and darker than any rule, only as long as the field, with a
    // send arrow at its end
    font(400, 26); text(BOARD_SAMPLE.fieldPlaceholder, px + 32, py + 206, "#A7A296");
    const fw = Math.min(460, lw - zg / 2 - 64);
    ctx.fillStyle = "rgba(43,42,38,0.4)"; ctx.fillRect(px + 32, py + 224, fw, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const ax = px + 32 + fw - 6, ay = py + 198;
    ctx.beginPath(); ctx.moveTo(ax - 22, ay); ctx.lineTo(ax, ay); ctx.moveTo(ax - 9, ay - 9); ctx.lineTo(ax, ay); ctx.lineTo(ax - 9, ay + 9); ctx.stroke();
    ctx.lineCap = "butt"; ctx.lineJoin = "miter";
    const x0 = px + lw + zg / 2;
    clip(x0, py, pw - lw - zg / 2, ph, 10, () => {
      // three kinds of card — news with a photo, a key figure, an event — two whole and the
      // third peeking past the edge (each 40% of the row)
      const cy = py + 32, ch = ph - 64, rx = x0 + 28, cw = Math.round((px + pw - rx) * 0.4), gap = 14;
      const box = (x: number) => { ctx.beginPath(); ctx.roundRect(x, cy, cw, ch, 10); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(); };
      // news
      const ih = 128;
      clip(rx, cy, cw, ih, [10, 10, 0, 0], () => cover(imgs[1] ?? imgs[0] ?? null, rx, cy, cw, ih));
      box(rx);
      font(700, 24, head); text(wrap(ctx, BOARD_SAMPLE.cardTitle, cw - 40, 1)[0] ?? "", rx + 20, cy + ih + 40);
      font(400, 19); wrap(ctx, BOARD_SAMPLE.cardText, cw - 40, 2).forEach((ln, k) => text(ln, rx + 20, cy + ih + 74 + k * 26, "#6F6A5E"));
      // key figure
      const kx = rx + cw + gap;
      box(kx);
      font(400, 20); text(BOARD_SAMPLE.kpiLabel, kx + 20, cy + 44, "#6F6A5E");
      font(700, 60, head); text(BOARD_SAMPLE.kpiValue, kx + 20, cy + 140);
      font(400, 20); text(BOARD_SAMPLE.kpiUnit, kx + 20, cy + 174, "#6F6A5E");
      const acc = d.ownPending ? "#E9E7E1" : mixHex(d.swatches[1]?.hex ?? "#BCC416", "#FFFFFF", 0.65);
      font(600, 20); const dw = ctx.measureText(BOARD_SAMPLE.kpiDelta).width + 28;
      ctx.fillStyle = acc; ctx.beginPath(); ctx.roundRect(kx + 20, cy + ch - 60, dw, 38, 19); ctx.fill();
      text(BOARD_SAMPLE.kpiDelta, kx + 34, cy + ch - 34);
      // event
      const ex = kx + cw + gap;
      box(ex);
      ctx.fillStyle = btn; ctx.beginPath(); ctx.roundRect(ex + 20, cy + 20, 76, 84, 10); ctx.fill();
      ctx.textAlign = "center"; font(700, 34); text(BOARD_SAMPLE.eventDay, ex + 58, cy + 62, onBtn); font(400, 18); text(BOARD_SAMPLE.eventMonth, ex + 58, cy + 90, onBtn); ctx.textAlign = "left";
      font(700, 22, head); text(wrap(ctx, BOARD_SAMPLE.eventTitle, cw - 140, 1)[0] ?? "", ex + 112, cy + 52);
      font(400, 18); text(BOARD_SAMPLE.eventText, ex + 112, cy + 82, "#6F6A5E");
      font(600, 20); const bw = ctx.measureText(BOARD_SAMPLE.eventBtn).width + 36;
      ctx.beginPath(); ctx.roundRect(ex + 20, cy + ch - 64, bw, 44, 22); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke();
      text(BOARD_SAMPLE.eventBtn, ex + 38, cy + ch - 35);
    });
    y += H;
  }

  // ── 03 answers + homepage order: plain lists, one item a row, divided by hairlines —
  // no boxes, no highlighted row (they read as something to pick)
  section("03", "คำตอบและหน้าแรก");
  {
    const w2 = (CW - G) / 2, RH = 56;
    const names = d.sections.map((n) => n.split(" / ")[0]);
    const aH = 70 + Math.max(1, d.answers.length) * RH + 14;
    const hH = 70 + Math.max(1, names.length) * RH + 14;
    const H = Math.max(aH, hH);
    const rule = (x: number, yy: number) => { ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(x + 28, yy, w2 - 56, 2); };
    card(M, y, w2, H);
    label("คำตอบของคุณ", M + 28, y + 46);
    const vx = M + 28 + Math.round((w2 - 56) * 0.53);
    if (d.answers.length) d.answers.forEach((a, i) => {
      const ry = y + 70 + i * RH;
      if (i) rule(M, ry);
      font(400, 23); text(wrap(ctx, a.topic, vx - M - 44, 1)[0] ?? "", M + 28, ry + 37, MUTED);
      font(600, 24); text(wrap(ctx, a.choice, M + w2 - 28 - vx, 1)[0] ?? "", vx, ry + 37);
    });
    else { font(400, 26); text("ยังไม่ได้ตอบคำถามสำรวจแนวทาง", M + 28, y + 100, MUTED); }
    const x = M + w2 + G;
    card(x, y, w2, H);
    label("หน้าแรก · เรียงจากบนลงล่าง", x + 28, y + 46);
    if (names.length) names.forEach((n, i) => {
      const ry = y + 70 + i * RH;
      if (i) rule(x, ry);
      font(500, 20); text(String(i + 1).padStart(2, "0"), x + 28, ry + 37, MUTED);
      font(400, 24); text(wrap(ctx, n, w2 - 130, 1)[0] ?? "", x + 76, ry + 37);
    });
    else { font(400, 26); text("ยังไม่ได้จัดหน้าแรก", x + 28, y + 100, MUTED); }
    y += H;
    const insp = [d.inspiration.links ? `${d.inspiration.links} ลิงก์` : "", d.inspiration.files ? `${d.inspiration.files} ไฟล์` : "", d.inspiration.note ?? ""].filter(Boolean).join(" · ");
    if (d.note) muted(`หมายเหตุ · ${d.note.replace(/\s+/g, " ")}`, 4);
    if (insp) muted(`แรงบันดาลใจที่แนบ · ${insp}`, 4);
  }

  // ── 04 photos as thumbnails, one row
  if (imgs.length) {
    section("04", "แนวภาพ", "ตัวอย่างโทนภาพ");
    if (d.visualMood) { font(400, 26); wrap(ctx, d.visualMood, CW, 2).forEach((ln) => { y += 38; text(ln, M, y, "#4A473F"); }); y += 22; }
    const n = Math.min(6, imgs.length), gap = 12, pw = (CW - gap * (n - 1)) / n, ph = pw * 0.75;
    imgs.slice(0, n).forEach((img, i) => { const px = M + i * (pw + gap); clip(px, y, pw, ph, 10, () => cover(img, px, y, pw, ph)); });
    y += ph;
    muted("ภาพตัวอย่างเพื่อบอกโทนภาพ · ทีมจะเลือกภาพที่ตรงกับธุรกิจของคุณอีกครั้ง", 2);
  }
  return y;
}

export type SheetView = "doc" | "board";

export async function renderMoodboard(d: SheetData, view: SheetView = "doc"): Promise<HTMLCanvasElement> {
  const ui = resolveStack("var(--font-plex), 'IBM Plex Sans Thai', system-ui, sans-serif");
  const head = resolveStack(d.fontStack);
  const body = resolveStack(d.bodyStack);
  // Make sure the faces are ready before drawing (canvas won't wait for them).
  await Promise.all([
    document.fonts.load(`400 40px ${ui}`), document.fonts.load(`600 40px ${ui}`),
    document.fonts.load(`700 40px ${head}`), document.fonts.load(`400 40px ${head}`), document.fonts.load(`400 40px ${body}`),
  ]).catch(() => undefined);
  const imgs = await Promise.all(d.shots.slice(0, 6).map((s) => loadImage(s.url)));
  const logoImg = d.logo ? await loadImage(d.logo) : null;

  // Draw on a tall scratch canvas, then crop to the content's real height.
  const c = document.createElement("canvas");
  c.width = W;
  c.height = 9000;
  const ctx = c.getContext("2d")!;
  ctx.textBaseline = "alphabetic";
  const font = (w: number, px: number, fam = ui) => { ctx.font = `${w} ${px}px ${fam}`; };
  const text = (s: string, x: number, y: number, color = INK) => { ctx.fillStyle = color; ctx.fillText(s, x, y); };
  const CW = W - 2 * M;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, c.height);

  // ── cover band in the client's colour (height follows its text)
  const on = d.moodInk;
  // mood leads, no style name: the tagline is the headline, then main / supporting moods
  const moods = [d.mainMood, ...d.supportMoods].filter(Boolean) as string[];
  // the headline follows the same rules as the screen (headlinePhrases): a long run-on
  // Thai phrase steps the size down; the first line stops short of the logo chip
  const titleText = d.tagline ?? moods.join(" · ");
  const TS = headlineIsLong(titleText) ? 88 : 112;
  const LH = Math.round(TS * 1.15);
  font(700, TS, head);
  const titleLines = headlineLines(ctx, titleText, logoImg ? CW - 300 - 48 : CW, CW);
  // moods as type: label, main mood big, "เสริมด้วย …" smaller and softer
  const hasMoods = !!(d.mainMood || d.supportMoods.length);
  const moodH = hasMoods ? 60 + 54 + (d.mainMood ? 74 : 0) + (d.supportMoods.length ? 58 : 0) : 0;
  // the old company line above the kicker is gone, so the cover starts higher and is shorter
  const coverH = 220 + titleLines.length * LH + moodH + 100;
  // Layered, not one flat block (19 Nov 2026): a diagonal from the main colour to a lighter
  // shade, a soft glow of the accent top right, and a faint grid with a rising line on the
  // right — investor data as a watermark, well under the type. Same as the screen.
  const g = ctx.createLinearGradient(0, 0, W, coverH);
  g.addColorStop(0, d.primary);
  g.addColorStop(1, mixHex(d.primary, isLight(d.primary) ? "#000000" : "#FFFFFF", 0.22));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, coverH);
  const glow = d.ownPending ? "#FFFFFF" : (d.swatches[1]?.hex ?? "#FFFFFF");
  const rg = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.75);
  rg.addColorStop(0, hexA(glow, 0.3));
  rg.addColorStop(1, hexA(glow, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, coverH);
  drawCoverWatermark(ctx, W * 0.45, 0, W * 0.55, coverH, on, glow);
  // logo on a white chip, top right
  if (logoImg) {
    const bw = 300, bh = 150, bx = W - M - bw, by = 80, pad = 22;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill();
    const s = Math.min((bw - 2 * pad) / logoImg.naturalWidth, (bh - 2 * pad) / logoImg.naturalHeight);
    const lw = logoImg.naturalWidth * s, lh = logoImg.naturalHeight * s;
    ctx.drawImage(logoImg, bx + (bw - lw) / 2, by + (bh - lh) / 2, lw, lh);
  }
  ctx.globalAlpha = 0.78;
  font(500, 34);
  text("แนวทางที่ได้จากคำตอบของคุณ", M, 170, on);
  ctx.globalAlpha = 1;
  let y = 170 + LH + 2;
  font(700, TS, head); titleLines.forEach((ln) => { text(ln, M, y, on); y += LH; });
  y -= LH;
  if (hasMoods) {
    y += 60;
    ctx.globalAlpha = 0.22; ctx.fillStyle = on; ctx.fillRect(M, y, CW, 2); ctx.globalAlpha = 1;
    y += 54; ctx.globalAlpha = 0.65; font(500, 28); text("อารมณ์ของเว็บไซต์", M, y, on); ctx.globalAlpha = 1;
    if (d.mainMood) { y += 74; font(600, 56); text(d.mainMood, M, y, on); }
    if (d.supportMoods.length) { y += 58; ctx.globalAlpha = 0.75; font(400, 36); text(`เสริมด้วย ${d.supportMoods.join(" · ")}`, M, y, on); ctx.globalAlpha = 1; }
  }

  if (view === "board") {
    // the board has its own banner in place of the cover band
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, coverH);
    y = drawBoard(ctx, d, drawBoardBanner(ctx, d, head, ui, logoImg) - 30, imgs, head, ui, body);
  }
  else {
  // ── chapters: hairline, "01  title", then content full width (reads like the phone view)
  y = coverH + 20;
  const chapter = (n: string, title: string) => {
    y += 70;
    ctx.fillStyle = LINE; ctx.fillRect(M, y, CW, 2);
    y += 92;
    font(500, 32); text(n, M, y, MUTED);
    font(700, 46); text(title, M + 70, y);
    y += 30;
  };

  // 01 answers — one row each: topic muted, choice strong
  chapter("01", "คำตอบของคุณ");
  if (d.answers.length) {
    d.answers.forEach((a, i) => {
      if (i) { ctx.fillStyle = "rgba(0,0,0,0.07)"; ctx.fillRect(M, y + 26, CW, 2); }
      y += 76;
      font(400, 36); text(a.topic, M, y, MUTED);
      font(600, 42); text(a.choice, M + CW / 2, y);
    });
  } else { y += 70; font(400, 38); text("ยังไม่ได้ตอบคำถามสำรวจแนวทาง", M, y, MUTED); }

  // 02 colours — three flat fields
  chapter("02", "สี");
  if (d.ownPending) {
    y += 70; font(600, 42); text("ใช้สีจากเว็บไซต์เดิม", M, y);
    font(400, 36); wrap(ctx, d.ciSite ? `ทีมจะใช้สีจาก ${d.ciSite}` : "ทีมจะใช้สีจากเว็บไซต์ปัจจุบันของคุณ", CW, 2).forEach((ln) => { y += 56; text(ln, M, y, "#6F6A5E"); });
  } else {
    y += 40;
    const gap = 24, sw = (CW - gap * 2) / 3, fh = 240;
    d.swatches.slice(0, 3).forEach((s, i) => {
      const sx = M + i * (sw + gap);
      ctx.fillStyle = s.hex; ctx.fillRect(sx, y, sw, fh);
      if (isLight(s.hex)) { ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.lineWidth = 2; ctx.strokeRect(sx + 1, y + 1, sw - 2, fh - 2); }
      font(600, 38); text(s.role, sx, y + fh + 58);
      font(400, 32); text(s.hex.toUpperCase(), sx, y + fh + 104, MUTED);
    });
    y += fh + 104;
    y += 64; font(400, 32); text(d.colorSource, M, y, MUTED);
  }
  if (d.ciAssets) { y += 56; font(400, 32); text(`CI ที่แนบ · ${d.ciAssets} · ส่วนที่ไม่ได้แนบ ทีมเสนอให้`, M, y, MUTED); }
  if (d.ciNote) { font(400, 32); wrap(ctx, `หมายเหตุ · ${d.ciNote}`, CW, 3).forEach((ln) => { y += 52; text(ln, M, y, MUTED); }); }

  // 03 font
  chapter("03", "ตัวอักษร");
  if (d.ciSite) {
    y += 70; font(600, 42); text("ใช้ฟอนต์จากเว็บไซต์เดิม", M, y);
    font(400, 36); wrap(ctx, `ทีมจะใช้ฟอนต์จาก ${d.ciSite}`, CW, 2).forEach((ln) => { y += 56; text(ln, M, y, "#6F6A5E"); });
  } else {
    y += 120; font(700, 110, head); text(d.fontName, M, y);
    // "ตัวอย่างฟอนต์" chip above the sample sentence
    y += 44; font(600, 26);
    { const tw = ctx.measureText("ตัวอย่างฟอนต์").width; ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.beginPath(); ctx.roundRect(M, y, tw + 36, 46, 23); ctx.fill(); text("ตัวอย่างฟอนต์", M + 18, y + 32, "#6F6A5E"); y += 46; }
    font(400, 50, head); wrap(ctx, "นักลงทุนสัมพันธ์ · ข้อมูลสำคัญทางการเงิน", CW, 2).forEach((ln) => { y += 76; text(ln, M, y, "#4A473F"); });
    const fnote = "ฟอนต์ตัวอย่างที่เข้ากับอารมณ์ของเว็บ · สรุปอีกครั้งเมื่อคุยรายละเอียด"; // no font description (user test CBG)
    font(400, 32); wrap(ctx, fnote, CW, 2).forEach((ln, i) => { y += i ? 46 : 64; text(ln, M, y, MUTED); });
    if (d.fontInterest) { y += 56; font(500, 34); text(`ลูกค้าสนใจ · ${d.fontInterest}`, M, y); }
  }

  // 04 photos — 2 × 2, captioned
  const hasShots = imgs.length > 0;
  if (hasShots) {
    chapter("04", "แนวภาพ");
    if (d.visualMood) { font(400, 38); wrap(ctx, d.visualMood, CW, 3).forEach((ln) => { y += 58; text(ln, M, y, "#4A473F"); }); }
    y += 40;
    const cols = 3, gap = 24, pw = (CW - gap * (cols - 1)) / cols, ph = pw * 0.75;
    imgs.forEach((img, i) => {
      const px = M + (i % cols) * (pw + gap);
      const py = y + Math.floor(i / cols) * (ph + 24); // no captions (user test CBG)
      ctx.fillStyle = "#ECE9E1"; ctx.fillRect(px, py, pw, ph);
      if (img) {
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
        const s = Math.max(pw / img.width, ph / img.height);
        ctx.drawImage(img, px + (pw - img.width * s) / 2, py + (ph - img.height * s) / 2, img.width * s, img.height * s);
        ctx.restore();
      }
    });
    y += Math.ceil(imgs.length / cols) * (ph + 24) - 24;
    font(400, 32); wrap(ctx, "ภาพตัวอย่างเพื่อบอกโทนภาพ · ทีมจะเลือกภาพที่ตรงกับธุรกิจของคุณอีกครั้ง", CW, 2).forEach((ln, i) => { y += i ? 46 : 80; text(ln, M, y, MUTED); });
  }

  // 05 homepage — one numbered list, top to bottom
  chapter(hasShots ? "05" : "04", "หน้าแรก");
  if (d.sections.length) {
    d.sections.forEach((name, i) => {
      y += 72;
      font(500, 32); ctx.textAlign = "right"; text(String(i + 1), M + 40, y, MUTED); ctx.textAlign = "left";
      font(400, 40); text(wrap(ctx, name.split(" / ")[0], CW - 80, 1)[0] ?? "", M + 80, y);
    });
  } else { y += 72; font(400, 38); text("ยังไม่ได้จัดหน้าแรก", M, y, MUTED); }
  const insp = [d.inspiration.links ? `${d.inspiration.links} ลิงก์` : "", d.inspiration.files ? `${d.inspiration.files} ไฟล์` : "", d.inspiration.note ?? ""].filter(Boolean).join(" · ");
  for (const [k, v] of [["หมายเหตุ", d.note ? d.note.replace(/\s+/g, " ") : ""], ["แรงบันดาลใจที่แนบ", insp]] as const) {
    if (!v) continue;
    y += 40;
    font(400, 36); wrap(ctx, `${k} · ${v}`, CW, 4).forEach((ln) => { y += 56; text(ln, M, y, "#4A473F"); });
  }

  }

  // ── footer
  y += 90;
  ctx.fillStyle = LINE; ctx.fillRect(M, y, CW, 2);
  font(400, 30);
  wrap(ctx, "เอกสารสรุปแนวทางจากคำตอบของคุณ ไม่ใช่งานออกแบบจริง · ทีม IR Plus จะคุยรายละเอียดกับคุณอีกครั้ง", CW, 3).forEach((ln, i) => { y += i ? 44 : 70; text(ln, M, y, MUTED); });
  // the reference number (after sending) or "ฉบับร่าง", and when this copy was downloaded,
  // so a saved file can be traced back later
  const now = new Date();
  const when = `${now.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  y += 52; text(`${d.refNo ? `Ref. No. ${d.refNo}` : "ฉบับร่าง (ยังไม่ได้ส่ง)"} · ดาวน์โหลดเมื่อ ${when} · IR Plus by efin`, M, y, MUTED);
  y += 110;

  // crop — never shorter than an A4 page so it still prints as one
  const outH = Math.round(Math.max(y, W * 1.414));
  const out = document.createElement("canvas");
  out.width = W;
  out.height = outH;
  const o = out.getContext("2d")!;
  o.fillStyle = PAPER;
  o.fillRect(0, 0, W, outH);
  o.drawImage(c, 0, 0, W, Math.min(outH, c.height), 0, 0, W, Math.min(outH, c.height));
  return out;
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), type, q));

/** A one-page PDF (A4 width, sheet-proportioned height) whose page is the given JPEG, edge to edge. */
async function jpegToPdf(jpeg: Blob, imgW: number, imgH: number): Promise<Blob> {
  // page = A4 width, height in the sheet's own proportion (a tall sheet stays one page)
  const img = new Uint8Array(await jpeg.arrayBuffer());
  const enc = new TextEncoder();
  const pageW = 595, pageH = Math.round((595 * imgH) / imgW);
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (b: Uint8Array) => { parts.push(b); len += b.length; };
  const str = (s: string) => push(enc.encode(s));
  str("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const obj = (n: number, body: () => void) => { offsets[n] = len; str(`${n} 0 obj\n`); body(); str("\nendobj\n"); };
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;
  obj(1, () => str("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => str("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  obj(3, () => str(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`));
  obj(4, () => str(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  obj(5, () => {
    str(`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`);
    push(img);
    str("\nendstream");
  });
  const xref = len;
  str(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
  str(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function moodboardFilename(company: string, ext: "pdf" | "png") {
  const d = new Date();
  const be = `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const name = (company || "IR-Plus").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-");
  return `Moodboard-${name}-${be}.${ext}`;
}

export async function saveMoodboard(d: SheetData, kind: "pdf" | "png", view: SheetView = "doc") {
  const canvas = await renderMoodboard(d, view);
  if (kind === "png") {
    download(await toBlob(canvas, "image/png"), moodboardFilename(d.company, "png"));
  } else {
    const jpeg = await toBlob(canvas, "image/jpeg", 0.92);
    download(await jpegToPdf(jpeg, canvas.width, canvas.height), moodboardFilename(d.company, "pdf"));
  }
}
