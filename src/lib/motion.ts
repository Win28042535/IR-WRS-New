// Motion tokens for JS (Web Animations API). Same values as the --motion-* variables in
// globals.css; CSS and class names should use those (duration-fast, ease-spring, …).
//   instant 120 — hover colour, small state flips
//   fast    200 — buttons, toggles, rows sliding aside
//   base    320 — cards, drops, panels opening
//   slow    600 — reveals on scroll / on mount
//   ambient 1200 — background loops and decorative drift
// Easing: out = enter / settle (default) · spring = only when the user succeeds at something
// (pick, drop, confirm) · inOut = colour or size changes · in = leaving.
export const DUR = { instant: 120, fast: 200, base: 320, slow: 600, ambient: 1200 } as const;
export const EASE = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  in: "cubic-bezier(0.55, 0, 0.75, 0.3)",
} as const;
