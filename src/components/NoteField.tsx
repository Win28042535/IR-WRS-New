"use client";
// ── One style for every free-text note ("หมายเหตุเพิ่มเติม") ─────────────────────────────
// A body-size bold label + grey "(ไม่บังคับ)", one short grey line ("หากมี… สามารถระบุไว้ได้เลย"),
// then a white rounded box. Same look wherever a client can leave the team a note.
// With `links` + `onLinksChange`, a link pasted or typed into the box (finished with a space
// or Enter, or on leaving the box) is lifted out of the text and shown as a tag under it,
// inside the same box, so links never mix with the words (20 Nov 2026).
import { useEffect, useId, useRef, type ClipboardEvent } from "react";
import { extractLinks, hasFinishedLink, linkName, mergeLinks } from "@/lib/noteLinks";

export function NoteField({
  label, hint, value, onChange, placeholder, rows = 3, optional = true, id, className = "", links, onLinksChange,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  rows?: number; optional?: boolean; id?: string; className?: string;
  links?: string[]; onLinksChange?: (links: string[]) => void;
}) {
  const auto = useId();
  const fieldId = id ?? `note-${auto}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const tags = links ?? [];
  const taking = !!onLinksChange;

  // lift links out of `text`; returns the text to keep
  const lift = (text: string) => {
    if (!onLinksChange) return text;
    const { text: rest, links: found } = extractLinks(text);
    if (found.length) onLinksChange(mergeLinks(tags, found));
    return found.length ? rest : text;
  };

  // an older note with links typed into its text: move them out once
  const migrated = useRef(false);
  useEffect(() => {
    if (migrated.current || !taking) return;
    migrated.current = true;
    const rest = lift(value);
    if (rest !== value) onChange(rest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!taking) return;
    const pasted = e.clipboardData.getData("text");
    const { text: rest, links: found } = extractLinks(pasted);
    if (!found.length) return;
    e.preventDefault();
    const el = e.currentTarget;
    const before = value.slice(0, el.selectionStart);
    const words = rest.trim();
    // a space between the existing text and the pasted words, when there isn't one
    const gap = before && words && !/\s$/.test(before) ? " " : "";
    const next = before + gap + words + value.slice(el.selectionEnd);
    onLinksChange!(mergeLinks(tags, found));
    onChange(next);
  };

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex items-baseline gap-2">
        <span className="text-body font-semibold text-ir-t1">{label}</span>
        {optional && <span className="text-small text-ir-t3">(ไม่บังคับ)</span>}
      </label>
      {hint && <p id={hintId} className="mt-0.5 text-small text-ir-t3">{hint}</p>}
      <div className="mt-2 rounded-md border border-ir-border bg-white transition-colors focus-within:border-ir-accent">
        <textarea
          id={fieldId}
          rows={rows}
          value={value}
          onChange={(e) => onChange(taking && hasFinishedLink(e.target.value) ? lift(e.target.value) : e.target.value)}
          onPaste={onPaste}
          onBlur={() => { if (taking) { const rest = lift(value); if (rest !== value) onChange(rest); } }}
          placeholder={placeholder}
          aria-describedby={hintId}
          className="block w-full resize-y rounded-md bg-transparent px-3.5 py-3 text-body leading-relaxed text-ir-t1 outline-none !shadow-none placeholder:text-ir-t3"
        />
        {tags.length > 0 && (
          <ul aria-label="ลิงก์ที่แนบ" className="flex flex-wrap gap-1.5 border-t border-ir-border-soft px-2.5 py-2">
            {tags.map((url) => (
              <li key={url} className="inline-flex h-10 max-w-full items-center rounded-full sm:h-8 bg-ir-accent-soft pl-2.5 text-small font-medium text-ir-t1 ring-1 ring-inset ring-ir-select/40">
                <a href={url} target="_blank" rel="noopener noreferrer" title={url} className="inline-flex min-w-0 self-stretch items-center gap-1.5 hover:underline focus-ring rounded-full">
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-ir-accent-text"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" /></svg>
                  <span className="truncate">{linkName(url)}</span>
                </a>
                <button type="button" onClick={() => onLinksChange?.(tags.filter((t) => t !== url))} aria-label={`เอาลิงก์ ${linkName(url)} ออก`}
                  className="ml-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8 text-ir-t3 transition-colors hover:bg-black/[0.06] hover:text-ir-t1 focus-ring">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
