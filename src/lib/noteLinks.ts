// Links typed or pasted into a note box are kept apart from its text (20 Nov 2026): the
// box shows them as tags, the team sees them as links, the sheet lists them by name.

// http(s)://… or a bare drive/docs.google.com/… — the same shapes the team view links.
const URL_RE = /(https?:\/\/[^\s]+|(?:drive|docs)\.google\.com\/[^\s]+)/gi;

const trimEnd = (u: string) => u.replace(/[),.;!?'"”’]+$/, "");
const withScheme = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

/** Pull every link out of `text`. Returns the text without them and the links found. */
export function extractLinks(text: string): { text: string; links: string[] } {
  const links: string[] = [];
  const rest = text.replace(URL_RE, (m) => { links.push(withScheme(trimEnd(m))); return ""; });
  // tidy the gaps the links leave, keep line breaks
  // (a single trailing space stays, so typing can carry on after the tag is lifted)
  const clean = rest.split("\n").map((ln) => ln.replace(/[ \t]{2,}/g, " ")).join("\n").replace(/\n{3,}/g, "\n\n");
  return { text: clean, links };
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

export const mergeLinks = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** A note with its links, for the team view (full links, clickable there). */
export function noteWithLinks(text?: string, links?: string[]): string {
  return [text?.trim(), ...(links ?? [])].filter(Boolean).join(" · ");
}

/** A note with its links by name, for the summary sheet ("ลิงก์ที่แนบ · Google Drive, …"). */
export function noteWithLinkNames(text?: string, links?: string[]): string | undefined {
  const names = (links ?? []).map(linkName);
  const out = [text?.trim(), names.length ? `ลิงก์ที่แนบ · ${names.join(", ")}` : ""].filter(Boolean).join(" · ");
  return out || undefined;
}
