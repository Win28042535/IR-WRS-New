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
  /** quiz answers, e.g. { topic: "บุคลิกแบรนด์", choice: "เป็นทางการ" } */
  answers: { topic: string; choice: string }[];
  /** true → the team takes colours from the client's site / logo; no swatches shown */
  ownPending: boolean;
  ciSite?: string;
  fontInterest?: string; // a font the client liked; the team decides      // "ใช้ CI เดิม": colours and font come from this website
  colorSource: string;
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

const isLight = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
};

export async function renderMoodboard(d: SheetData): Promise<HTMLCanvasElement> {
  const ui = resolveStack("var(--font-plex), 'IBM Plex Sans Thai', system-ui, sans-serif");
  const head = resolveStack(d.fontStack);
  // Make sure the faces are ready before drawing (canvas won't wait for them).
  await Promise.all([
    document.fonts.load(`400 40px ${ui}`), document.fonts.load(`600 40px ${ui}`),
    document.fonts.load(`700 40px ${head}`), document.fonts.load(`400 40px ${head}`),
  ]).catch(() => undefined);
  const imgs = await Promise.all(d.shots.slice(0, 4).map((s) => loadImage(s.url)));

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
  font(700, 150, head);
  const titleLines = wrap(ctx, d.directionLabel, CW, 3);
  font(400, 48, head);
  const tagLines = d.tagline ? wrap(ctx, d.tagline, CW, 3) : [];
  const moods = [d.mainMood, ...d.supportMoods].filter(Boolean) as string[];
  font(500, 34);
  const moodLines = moods.length ? wrap(ctx, `อารมณ์ของเว็บไซต์ · ${moods.join(" · ")}`, CW, 2) : [];
  const coverH = 380 + titleLines.length * 160 + tagLines.length * 66 + (tagLines.length ? 30 : 0) + (moodLines.length ? 60 + moodLines.length * 48 : 0) + 110;
  const g = ctx.createLinearGradient(0, 0, W, coverH);
  g.addColorStop(0, d.primary);
  g.addColorStop(1, isLight(d.primary) ? "#D9D6CC" : "#0B0D12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, coverH);
  ctx.globalAlpha = 0.78;
  font(500, 34);
  wrap(ctx, `แนวทางเว็บไซต์นักลงทุนสัมพันธ์${d.company ? ` · ${d.company}` : ""}`, CW, 2).forEach((ln, i) => text(ln, M, 140 + i * 46, on));
  text("แนวทางที่ได้จากคำตอบของคุณ", M, 330, on);
  ctx.globalAlpha = 1;
  let y = 330 + 150;
  font(700, 150, head); titleLines.forEach((ln) => { text(ln, M, y, on); y += 160; });
  y -= 160;
  font(400, 48, head); tagLines.forEach((ln, i) => { y += i ? 66 : 96; text(ln, M, y, on); });
  if (moodLines.length) { y += 60; ctx.globalAlpha = 0.78; font(500, 34); moodLines.forEach((ln) => { y += 48; text(ln, M, y, on); }); ctx.globalAlpha = 1; }

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
    d.answers.forEach((a) => {
      y += 70;
      font(400, 36); text(a.topic, M, y, MUTED);
      font(600, 42); ctx.textAlign = "right"; text(a.choice, W - M, y); ctx.textAlign = "left";
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

  // 03 font
  chapter("03", "ตัวอักษร");
  if (d.ciSite) {
    y += 70; font(600, 42); text("ใช้ฟอนต์จากเว็บไซต์เดิม", M, y);
    font(400, 36); wrap(ctx, `ทีมจะใช้ฟอนต์จาก ${d.ciSite}`, CW, 2).forEach((ln) => { y += 56; text(ln, M, y, "#6F6A5E"); });
  } else {
    y += 120; font(700, 110, head); text(d.fontName, M, y);
    font(400, 50, head); wrap(ctx, "นักลงทุนสัมพันธ์ · ข้อมูลสำคัญทางการเงิน", CW, 2).forEach((ln) => { y += 76; text(ln, M, y, "#4A473F"); });
    const fnote = `ทีมเสนอตามแนวทาง${d.fontNote ? ` · ${d.fontNote}` : ""}`;
    font(400, 32); wrap(ctx, fnote, CW, 2).forEach((ln, i) => { y += i ? 46 : 64; text(ln, M, y, MUTED); });
    if (d.fontInterest) { y += 56; font(500, 34); text(`ลูกค้าสนใจ · ${d.fontInterest}`, M, y); }
  }

  // 04 photos — 2 × 2, captioned
  const hasShots = imgs.length > 0;
  if (hasShots) {
    chapter("04", "แนวภาพ");
    if (d.visualMood) { font(400, 38); wrap(ctx, d.visualMood, CW, 3).forEach((ln) => { y += 58; text(ln, M, y, "#4A473F"); }); }
    y += 40;
    const gap = 24, pw = (CW - gap) / 2, ph = pw * 0.75;
    imgs.forEach((img, i) => {
      const px = M + (i % 2) * (pw + gap);
      const py = y + Math.floor(i / 2) * (ph + 96);
      ctx.fillStyle = "#ECE9E1"; ctx.fillRect(px, py, pw, ph);
      if (img) {
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
        const s = Math.max(pw / img.width, ph / img.height);
        ctx.drawImage(img, px + (pw - img.width * s) / 2, py + (ph - img.height * s) / 2, img.width * s, img.height * s);
        ctx.restore();
      }
      font(400, 32); text(wrap(ctx, d.shots[i]?.cap ?? "", pw, 1)[0] ?? "", px, py + ph + 52, MUTED);
    });
    y += Math.ceil(imgs.length / 2) * (ph + 96) - 96 + 52;
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

  // ── footer
  y += 90;
  ctx.fillStyle = LINE; ctx.fillRect(M, y, CW, 2);
  font(400, 30);
  wrap(ctx, "เอกสารสรุปแนวทางจากคำตอบของคุณ ไม่ใช่งานออกแบบจริง · ทีม IR Plus จะคุยรายละเอียดกับคุณอีกครั้ง", CW, 3).forEach((ln, i) => { y += i ? 44 : 70; text(ln, M, y, MUTED); });
  const date = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  y += 52; text(`สร้างเมื่อ ${date} · IR Plus by efin`, M, y, MUTED);
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

export async function saveMoodboard(d: SheetData, kind: "pdf" | "png") {
  const canvas = await renderMoodboard(d);
  if (kind === "png") {
    download(await toBlob(canvas, "image/png"), moodboardFilename(d.company, "png"));
  } else {
    const jpeg = await toBlob(canvas, "image/jpeg", 0.92);
    download(await jpegToPdf(jpeg, canvas.width, canvas.height), moodboardFilename(d.company, "pdf"));
  }
}
