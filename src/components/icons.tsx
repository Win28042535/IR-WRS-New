import type { SVGProps } from "react";

// System-wide floor: no icon renders smaller than 24px, no matter what a call site
// asks for. Call sites keep passing whatever width/height reads well in context
// (many were tuned down to 8-14px over time) — clamping here means every icon that
// was too small to read simply grows to 24px in one place, instead of a sweep across
// every call site, and nothing can regress below the floor again by accident.
const MIN_ICON_SIZE = 24;

const clampSize = (value: SVGProps<SVGSVGElement>["width"]) =>
  Math.max(typeof value === "number" ? value : MIN_ICON_SIZE, MIN_ICON_SIZE);

const base = ({ width, height, ...rest }: SVGProps<SVGSVGElement>) => ({
  width: clampSize(width),
  height: clampSize(height),
  viewBox: "0 0 16 16",
  fill: "none",
  ...rest,
});

// Every icon shares one stroke weight (1.5, on the common 16-unit viewBox) so mixing any
// two of them — e.g. a check next to a plus, or an arrow next to a lock — never reads as
// two different icon sets. `IconStar` (a solid glyph) and `IconReset`'s arrowhead accent
// are the only intentional exceptions: solid fills are a different rendering technique,
// not a stroke-weight mismatch, and a filled arrow-tip on an otherwise-outlined refresh
// icon is a standard convention (Feather/Heroicons do the same) rather than drift.
const STROKE = "1.5";

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconLines = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 5h10M3 8h6M3 11h4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconDesktop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth={STROKE} /><path d="M6 14h4M8 11v3" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconTablet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="4" y="2" width="8" height="12" rx="1.2" stroke="currentColor" strokeWidth={STROKE} /><path d="M7.2 12h1.6" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconMobile = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="5" y="2" width="6" height="12" rx="1.2" stroke="currentColor" strokeWidth={STROKE} /><path d="M7.4 12h1.2" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconExpand = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 2H2v4M10 14h4v-4M14 6V2h-4M2 10v4h4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconSwap = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 5h8M9 2l3 3-3 3M12 11H4M7 8l-3 3 3 3" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="7" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth={STROKE} /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth={STROKE} /></svg>
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth={STROKE} /><path d="M2.5 13c0-2 1.6-3.2 3.5-3.2S9.5 11 9.5 13M10.5 5.8a2 2 0 010 3.4M11 13c0-1.5-.8-2.6-2-3.1" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" /></svg>
);
export const IconStar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 2l1.7 3.7 4 .5-3 2.8.8 4L8 11.8 4.5 13l.8-4-3-2.8 4-.5L8 2z" fill="currentColor" /></svg>
);
export const IconReset = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 1.2L11.3 3L8 4.8Z" fill="currentColor" />
  </svg>
);
export const IconExternalLink = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6.5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 3h4v4M13 3 7 9" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconEdit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M11.5 2.5a2 2 0 0 1 2.8 2.8L6.3 13.3l-3.8 1 1-3.8L11.5 2.5Z" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" /></svg>
);

// Domain/website glyph for URL references — was copy-pasted inline four times across the
// Inspiration step (reference card, both floating-preview toasts, the gallery tile) with
// stroke width drifting between 1.1 and 1.2 across the copies. One definition now, so it
// can't drift again. Its own 14-unit viewBox (not the shared 16-unit `base()`) preserves
// the original path coordinates; 1.2 sits between the two drifted values. Was tuned for
// 11-13px use — now floored to MIN_ICON_SIZE like every other icon.
export const IconGlobe = ({ width, height, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg width={clampSize(width)} height={clampSize(height)} viewBox="0 0 14 14" fill="none" {...rest}>
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 7h12M7 1c1.8 1.7 1.8 10.3 0 12M7 1c-1.8 1.7-1.8 10.3 0 12" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// ── Option-card icons (audiences, goals, CI, inspiration mode) ──
// Line glyphs on the same 16-unit grid and stroke as the set above, replacing the emoji
// those cards used — emoji render differently on every OS and clash with the outlined UI.
const line = { stroke: "currentColor", strokeWidth: STROKE, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="5.5" r="2.5" {...line} /><path d="M3 13.5c0-2.6 2.2-4.2 5-4.2s5 1.6 5 4.2" {...line} /></svg>
);
export const IconBank = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M2 6.2L8 2.5l6 3.7M3 13.5h10M4 7v4.5M8 7v4.5M12 7v4.5" {...line} /></svg>
);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" {...line} /></svg>
);
export const IconScale = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 2.5v11M5 13.5h6M3.5 4.5h9M3.5 4.5L1.8 9a1.8 1.8 0 003.4 0L3.5 4.5zM12.5 4.5L10.8 9a1.8 1.8 0 003.4 0l-1.7-4.5z" {...line} /></svg>
);
export const IconHandshake = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M1.5 7l2.5-2.5 2.5 1 2-1.5 2.5 1L14.5 7M4 4.5L7.5 9c.6.7 1.6.7 2.1 0M6.5 10.5l1 1M9 6l3.5 4.5-2 1.5M1.5 7L4 10" {...line} /></svg>
);
export const IconSprout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 13.5V8M8 8C8 5 6 3.5 3 3.5 3 6.5 5 8 8 8zM8 9.5c0-2.5 1.7-4 4.5-4 0 2.5-1.7 4-4.5 4z" {...line} /></svg>
);
export const IconAward = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="6" r="3.5" {...line} /><path d="M5.8 8.8L5 14l3-1.6 3 1.6-.8-5.2" {...line} /></svg>
);
export const IconTrendUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M2 11.5l4-4 2.5 2.5L14 4.5M10 4.5h4v4" {...line} /></svg>
);
export const IconTarget = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="8" cy="8" r="5.5" {...line} /><circle cx="8" cy="8" r="2.5" {...line} /></svg>
);
export const IconMegaphone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M2.5 6.5v3h2l5 3v-9l-5 3h-2zM4.5 9.5l.8 3.5M12 6a2.5 2.5 0 010 4" {...line} /></svg>
);
export const IconBolt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8l1-5.5z" {...line} /></svg>
);
export const IconLeaf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 13c0-6 3.5-9.5 10-10 0 6.5-3.5 10-9 10M3 13l5-5" {...line} /></svg>
);
export const IconRocket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9.5 10.5L5.5 6.5C7 3.5 9.5 2 13.5 2.5c.5 4-1 6.5-4 8zM5.5 6.5H3L1.5 8.5l3 .5M9.5 10.5V13l-2 1.5-.5-3M3.5 12.5c0-1 .5-1.5 1.5-1.5" {...line} /></svg>
);
export const IconPalette = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 2a6 6 0 100 12c1 0 1.5-.7 1.2-1.6-.3-1 .3-1.9 1.3-1.9H12a2.5 2.5 0 002.5-2.5C14.5 4.6 11.6 2 8 2z" {...line} /><circle cx="5" cy="7" r=".6" fill="currentColor" /><circle cx="7.5" cy="4.8" r=".6" fill="currentColor" /><circle cx="10.5" cy="5.5" r=".6" fill="currentColor" /></svg>
);
export const IconSparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 2l1.4 3.6L13 7l-3.6 1.4L8 12l-1.4-3.6L3 7l3.6-1.4L8 2zM12.5 11.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5z" {...line} /></svg>
);
export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" {...line} /></svg>
);

/** Icon per option id — audiences, business goals, CI choice and inspiration mode. */
export const OPTION_ICONS: Record<string, (p: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  // audiences
  retail: IconUser, institutional: IconBank, analyst: IconChart,
  regulator: IconScale, shareholder: IconHandshake, potential: IconSprout,
  // business goals
  credibility: IconAward, ir: IconTrendUp, lead: IconTarget, awareness: IconMegaphone,
  digital: IconBolt, esg: IconLeaf, talent: IconUsers, product: IconRocket,
  intl: IconGlobe, compliance: IconScale,
  // corporate identity + inspiration mode
  "ci-yes": IconPalette, "ci-no": IconSparkle, custom: IconLink, curated: IconSparkle,
};
