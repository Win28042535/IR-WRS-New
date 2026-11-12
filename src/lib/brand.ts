// Brand layer for Branding & Realistic Preview Experience.
// Two distinct brands are in play:
//  1. IR PLUS the system/product brand (cream + deep navy), used as chrome &
//     a "Powered by IR Plus" mark to keep Brand Consistency across Client/Designer mode.
//  2. The PREVIEW SITE brand derived per Direction from the chosen Corporate Identity
//     colors, so the mockup feels like the client's own site, not a generic template.

import { directionById } from "./data";

// ── IR PLUS corporate identity (WRS Design System tokens) ──
export const IRPLUS = {
  name: "IR PLUS",
  green: "#BCC416",   // Primary 600 brand
  dark: "#151823",    // Neutral 900
  blue: "#BCC416",    // (legacy field) → primary
} as const;

export interface PreviewBrand {
  primary: string;     // dominant surface / nav / hero base
  secondary: string;   // supporting tone
  accent: string;      // CTA / highlight
  onAccent: string;    // readable text on the accent
  gradient: string;    // hero / nav gradient (from Direction.bg)
  paletteName: string; // human label, e.g. "Deep Navy & Gold"
}

// Pick readable text color for a given background hex (YIQ luminance).
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return "#FFFFFF";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1C1C1C" : "#FFFFFF";
}

/**
 * Derive the preview site's design tokens from the selected Direction's CI colors.
 * Falls back to IR Plus navy/cream when no direction is chosen yet.
 */
export function previewBrand(directionId: string): PreviewBrand {
  const dir = directionById(directionId);
  const colors = dir?.colors ?? [IRPLUS.dark, IRPLUS.blue, "#FFFFFF"];
  const [primary, secondary] = colors;
  const accent = secondary || IRPLUS.blue;
  return {
    primary: primary || IRPLUS.dark,
    secondary: secondary || IRPLUS.blue,
    accent,
    onAccent: readableOn(accent),
    gradient: dir?.bg || `linear-gradient(135deg,${IRPLUS.dark},#000000)`,
    paletteName: dir?.palette || "IR Plus Signature",
  };
}

// Mood-specific palette seeds used before a Direction is chosen.
const MOOD_BRAND: Record<string, { primary: string; accent: string; gradient: string }> = {
  professional: { primary: "#0D1B4B", accent: "#BCC416", gradient: "linear-gradient(135deg,#0D1B4B,#050B1F)" },
  luxury:       { primary: "#1A1208", accent: "#C8A855", gradient: "linear-gradient(135deg,#1A1208,#0D0905)" },
  modern:       { primary: "#03041C", accent: "#E5E7EB", gradient: "linear-gradient(135deg,#03041C,#000)" },
  esg:          { primary: "#1A3320", accent: "#5CB85C", gradient: "linear-gradient(135deg,#1A3320,#0D1A0D)" },
  warm:         { primary: "#3D1F00", accent: "#E08A3C", gradient: "linear-gradient(135deg,#3D1F00,#1A0D00)" },
  creative:     { primary: "#1A0B3B", accent: "#7C3AED", gradient: "linear-gradient(135deg,#1A0B3B,#0D051E)" },
  data:         { primary: "#050E2B", accent: "#3B82F6", gradient: "linear-gradient(135deg,#050E2B,#020812)" },
  bold:         { primary: "#003030", accent: "#008080", gradient: "linear-gradient(135deg,#003030,#001818)" },
};

/**
 * Derive preview brand from selected moods used when no direction is selected yet.
 * First mood sets the primary palette; second mood (if present) contributes the accent.
 */
export function moodsToBrand(moods: string[]): PreviewBrand {
  if (!moods.length) {
    return {
      primary: IRPLUS.dark,
      secondary: IRPLUS.green,
      accent: IRPLUS.green,
      onAccent: readableOn(IRPLUS.green),
      gradient: `linear-gradient(135deg,${IRPLUS.dark},#000)`,
      paletteName: "IR Plus Signature",
    };
  }
  const base = MOOD_BRAND[moods[0]] ?? MOOD_BRAND.professional;
  const accent = moods.length >= 2 ? (MOOD_BRAND[moods[1]]?.accent ?? base.accent) : base.accent;
  return {
    primary: base.primary,
    secondary: accent,
    accent,
    onAccent: readableOn(accent),
    gradient: base.gradient,
    paletteName: moods.slice(0, 2).map((id) => id.charAt(0).toUpperCase() + id.slice(1)).join(" · "),
  };
}
