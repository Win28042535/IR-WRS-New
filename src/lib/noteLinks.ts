// Links typed or pasted into a note box are kept apart from its text (20 Nov 2026): the
// box shows them as tags, the team sees them as links, the sheet lists them by name.
// Numbered markers (23 Nov 2026): a link is replaced in the text by "[ลิงก์ 1]", and its tag
// carries the same number, so it stays clear which words a link belongs to. The summary
// shows the marker as the link's name, the team view as the link itself. Links with no
// marker in the text (older notes, or a marker the client deleted) are listed at the end.

// http(s)://… or a bare drive/docs.google.com/… — the same shapes the team view links.
const URL_RE = /(https?:\/\/[^\s]+|(?:drive|docs)\.google\.com\/[^\s]+)/gi;
/** "[ลิงก์ 3]" in a note's text; group 1 = the number. Written with a no-break space so a
 *  marker never wraps across lines in the box; a plain space (typed by hand) is read too. */
const MARK_RE = /\[ลิงก์[  ](\d+)\]/g;

const trimEnd = (u: string) => u.replace(/[),.;!?'"”’]+$/, "");
const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
export const linkMarker = (n: number) => `[ลิงก์ ${n}]`;

// tidy the gaps left in the text (a single trailing space stays, so typing can carry on)
const tidy = (s: string) => s.split("\n").map((ln) => ln.replace(/[ \t]{2,}/g, " ")).join("\n").replace(/\n{3,}/g, "\n\n");

/** Replace every link in `text` with its numbered marker; numbers follow `existing` (the
 *  links already tagged), new links are added after them. Returns the new text and list. */
export function markLinks(text: string, existing: string[]): { text: string; links: string[]; found: number } {
  const links = [...existing];
  let found = 0;
  const out = text.replace(URL_RE, (m) => {
    const url = withScheme(trimEnd(m));
    const tail = m.slice(trimEnd(m).length); // closing ")" or "." typed after the link stays
    let i = links.indexOf(url);
    if (i < 0) { links.push(url); i = links.length - 1; }
    found++;
    return linkMarker(i + 1) + tail;
  });
  return { text: found ? tidy(out) : text, links, found };
}

/** Drop link `n` (1-based): its marker leaves the text, and higher numbers move down one. */
export function unmarkLink(text: string, links: string[], n: number): { text: string; links: string[] } {
  const next = text
    .replace(new RegExp(`[ \\t]?\\[ลิงก์[ \\u00A0]${n}\\]`, "g"), "")
    .replace(MARK_RE, (m, d) => (Number(d) > n ? linkMarker(Number(d) - 1) : m));
  return { text: next, links: links.filter((_, i) => i !== n - 1) };
}

/** Links followed by a space or a line break (finished typing) — the ones to lift out now. */
export function hasFinishedLink(text: string): boolean {
  return /(https?:\/\/[^\s]+|(?:drive|docs)\.google\.com\/[^\s]+)\s/i.test(text);
}

/** A short name for a link: "Google Drive", "YouTube", or the site's domain. */
export function linkName(url: string): string {
  try {
    const h = new URL(withScheme(url)).hostname.replace(/^www\./, "");
    if (h === "drive.google.com") return "Google Drive";
    if (h === "docs.google.com") return "Google Docs";
    if (h === "youtube.com" || h === "youtu.be" || h === "m.youtube.com") return "YouTube";
    if (h === "vimeo.com") return "Vimeo";
    return h;
  } catch {
    return url;
  }
}

/** numbers of the markers present in `text` */
const markedIn = (text: string) => new Set([...text.matchAll(MARK_RE)].map((m) => Number(m[1])));

/** A note with its links, for the team view: each marker becomes the link (clickable
 *  there), unmarked links follow at the end. */
export function noteWithLinks(text?: string, links?: string[]): string {
  const t = text?.trim() ?? "";
  const list = links ?? [];
  const marked = markedIn(t);
  const body = t.replace(MARK_RE, (m, d) => list[Number(d) - 1] ?? m);
  return [body, ...list.filter((_, i) => !marked.has(i + 1))].filter(Boolean).join(" · ");
}

/** A note with its links by name, for the summary sheet: each marker becomes "(Google
 *  Drive)" in place; unmarked links follow as "ลิงก์ที่แนบ · …". */
export function noteWithLinkNames(text?: string, links?: string[]): string | undefined {
  const t = text?.trim() ?? "";
  const list = links ?? [];
  const marked = markedIn(t);
  const body = t.replace(MARK_RE, (m, d) => (list[Number(d) - 1] ? `(${linkName(list[Number(d) - 1])})` : m));
  const rest = list.filter((_, i) => !marked.has(i + 1)).map(linkName);
  const out = [body, rest.length ? `ลิงก์ที่แนบ · ${rest.join(", ")}` : ""].filter(Boolean).join(" · ");
  return out || undefined;
}
