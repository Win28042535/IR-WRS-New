// POST /api/brand-colors  { url }  →  { colors, neutrals, fonts }
// Reads a client's current website and returns its most prominent brand colours and font
// families, so "ใช้ชุดสีเดิม" comes with real hex codes instead of a promise.
//
// Safety: this fetches a URL the visitor typed, so it only goes to public http(s) hosts.
// Every hop (including redirects and linked stylesheets) is resolved and refused if it
// points at a private, loopback, link-local or otherwise internal address; responses are
// size-capped and time-boxed.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML = 1_500_000;
const MAX_CSS = 600_000;
const MAX_SHEETS = 4;
const TIMEOUT_MS = 6000;

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
function privateV6(ip: string) {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
  const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? privateV4(mapped[1]) : false;
}

async function assertPublic(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("protocol");
  if (u.username || u.password) throw new Error("credentials");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) throw new Error("internal host");
  const addrs = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true });
  if (!addrs.length) throw new Error("unresolved");
  for (const a of addrs) if (a.family === 4 ? privateV4(a.address) : privateV6(a.address)) throw new Error("private address");
}

// fetch with manual redirects (each hop checked) and a byte cap
async function safeFetch(start: string, cap: number, accept: string): Promise<{ text: string; url: URL }> {
  let url = new URL(start);
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept, "user-agent": "Mozilla/5.0 (compatible; WRS-BrandColors/1.0)" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      chunks.push(value);
      if (size >= cap) { await reader.cancel(); break; }
    }
    return { text: new TextDecoder().decode(Buffer.concat(chunks)), url };
  }
  throw new Error("too many redirects");
}

// ── colour scoring ──
const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("").toUpperCase();
function parseColor(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return toHex(...(m[1].split("").map((c) => parseInt(c + c, 16)) as [number, number, number]));
  m = s.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/);
  if (m) return "#" + m[1].toUpperCase();
  m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    const alpha = m[4] ? (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1;
    if (alpha < 0.6) return null;
    return toHex(+m[1], +m[2], +m[3]);
  }
  return null;
}
function hsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  let h = 0;
  if (max !== min) h = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}
const distance = (a: string, b: string) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

// Framework defaults (Bootstrap 4/5) show up on countless sites and say nothing about the
// brand; they still count, but at a tenth of the weight.
const FRAMEWORK = new Set(["#0D6EFD", "#6610F2", "#6F42C1", "#D63384", "#DC3545", "#FD7E14", "#FFC107", "#198754", "#20C997", "#0DCAF0", "#6C757D", "#E9ECEF", "#F8F9FA", "#DEE2E6", "#CED4DA", "#ADB5BD", "#495057", "#343A40", "#212529", "#007BFF", "#28A745", "#17A2B8", "#0A58CA", "#BB2D3B", "#157347", "#31D2F2", "#FFCA2C", "#0B5ED7", "#5C636A",
  // WordPress core / block-library defaults
  "#3858E9", "#183AD6", "#007CBA", "#005A87", "#006BA1", "#CC1818", "#710D0D", "#1E1E1E", "#DDDDDD", "#2271B1", "#135E96", "#0073AA", "#00A0D2", "#D63638", "#F0F0F1", "#C3C4C7", "#50575E", "#1D2327", "#32373C", "#ABB8C3", "#F78DA7", "#CF2E2E", "#FF6900", "#FCB900", "#7BDCB5", "#00D084", "#8ED1FC", "#0693E3", "#9B51E0"]);
// Stylesheets from libraries rather than the site itself are skipped.
const VENDOR = /bootstrap|font-?awesome|swiper|slick|owl\.carousel|jquery|animate(\.min)?\.css|aos\.css|fancybox|lightbox|select2|datepicker|cdnjs|jsdelivr|unpkg|googleapis|wp-includes|wp-admin|block-library|dashicons/i;
const ICON_FONT = /icon|awesome|glyph|swiper|slick|dashicons|material symbols|material icons/i;

const GENERIC_FONTS = new Set(["sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "cursive", "fantasy", "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica", "helvetica neue", "arial", "tahoma", "ui-sans-serif", "ui-serif", "ui-monospace", "apple color emoji", "segoe ui emoji", "segoe ui symbol", "noto color emoji", "oxygen-sans", "oxygen", "ubuntu", "cantarell", "fira sans", "droid sans", "liberation sans", "verdana", "georgia", "times new roman", "times", "courier new", "courier", "baskerville", "fira code", "consolas", "menlo", "monaco", "sf mono", "source code pro","font awesome 5 free", "font awesome 6 free", "fontawesome", "dashicons", "icomoon", "var"]);

function analyse(html: string, css: string[]) {
  const score = new Map<string, number>();
  const add = (raw: string, w: number) => { const hex = parseColor(raw); if (hex) score.set(hex, (score.get(hex) ?? 0) + (FRAMEWORK.has(hex) ? w * 0.1 : w)); };
  // theme-color / msapplication tile colour: the site telling us its brand colour
  for (const m of html.matchAll(/<meta[^>]+name=["'](?:theme-color|msapplication-TileColor)["'][^>]*content=["']([^"']+)["']/gi)) add(m[1], 30);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["'](?:theme-color|msapplication-TileColor)["']/gi)) add(m[1], 30);
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n") + "\n" + [...html.matchAll(/style=["']([^"']+)["']/gi)].map((m) => m[1]).join(";");
  const allCss = [inline, ...css].join("\n");
  const COLOR = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g;
  // logos and icons drawn inline (fill / stroke / stop-color) are usually the brand itself
  for (const m of html.matchAll(/(?:fill|stroke|stop-color)=["'](#[0-9a-fA-F]{3,6})["']/g)) add(m[1], 3);
  // custom properties named like a brand colour count heavily
  for (const m of allCss.matchAll(/--[\w-]*(?:primary|brand|main|accent|theme|key)[\w-]*\s*:\s*([^;}{]+)/gi)) for (const c of m[1].matchAll(COLOR)) add(c[1], 8);
  // backgrounds and buttons say more than text colour
  for (const m of allCss.matchAll(/(background(?:-color)?|border(?:-[a-z]+)?-color|fill)\s*:\s*([^;}{]+)/gi)) for (const c of m[2].matchAll(COLOR)) add(c[1], 2);
  for (const m of allCss.matchAll(/(?:^|[;{\s])color\s*:\s*([^;}{]+)/gi)) for (const c of m[1].matchAll(COLOR)) add(c[1], 1);

  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]);
  const colors: string[] = [], neutrals: string[] = [];
  for (const [hex] of ranked) {
    const { s, l } = hsl(hex);
    const neutral = s < 0.14 || l < 0.08 || l > 0.95;
    const bucket = neutral ? neutrals : colors;
    if (bucket.length >= (neutral ? 3 : 6)) continue;
    if (bucket.some((h) => distance(h, hex) < 38)) continue; // near-duplicates
    bucket.push(hex);
  }

  const fontScore = new Map<string, number>();
  for (const m of allCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    for (const f of m[1].split(",")) {
      // drop quotes, !important, CSS escapes ("DB Helvethaica X\ 75 Bd") and a trailing weight
      const name = f.replace(/["'()]/g, "").replace(/!important/i, "").replace(/\\\s*/g, " ").replace(/\s+\d+\s*\w*$/, "").trim();
      if (!name || /^var-/.test(name) ||GENERIC_FONTS.has(name.toLowerCase()) || ICON_FONT.test(name)) continue;
      fontScore.set(name, (fontScore.get(name) ?? 0) + 1);
    }
  }
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)) {
    for (const fam of decodeURIComponent(m[1]).split("|")) {
      const name = fam.split(":")[0].replace(/\+/g, " ").trim();
      if (name) fontScore.set(name, (fontScore.get(name) ?? 0) + 5);
    }
  }
  const fonts = [...fontScore.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
  return { colors, neutrals, fonts };
}

export async function POST(request: Request) {
  let raw = "";
  try {
    const body = await request.json();
    raw = String(body?.url ?? "").trim();
  } catch { /* fall through */ }
  if (!raw) return Response.json({ error: "missing url" }, { status: 400 });
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let start: URL;
  try { start = new URL(raw); } catch { return Response.json({ error: "invalid url" }, { status: 400 }); }

  try {
    const page = await safeFetch(start.href, MAX_HTML, "text/html,application/xhtml+xml");
    const hrefs = [...page.text.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)]
      .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
      .filter((h): h is string => !!h && !VENDOR.test(h))
      .slice(0, MAX_SHEETS);
    const sheets = await Promise.all(hrefs.map(async (h) => {
      try { return (await safeFetch(new URL(h, page.url).href, MAX_CSS, "text/css,*/*")).text; } catch { return ""; }
    }));
    const result = analyse(page.text, sheets);
    if (!result.colors.length && !result.neutrals.length) return Response.json({ error: "no colours found", ...result }, { status: 422 });
    return Response.json(result);
  } catch {
    return Response.json({ error: "could not read site" }, { status: 422 });
  }
}
