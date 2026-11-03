# IR PLUS · WRS Design System

Enterprise-grade, token-driven foundation for the Website Requirement System.
Goals: **consistent · accessible (WCAG AA) · readable · light + dark ready · future-proof.**

This is the single source of truth for Product, Design, Dev, and AI tools
(Claude Code / Cursor / Figma Make / design generators).

- **Color** → see [`color-system.md`](./color-system.md) (Primary + Neutral, tokens, themes).
- **Tokens live in** `src/app/globals.css` (`@theme`) → generate Tailwind utilities
  (`bg-primary-600`, `text-neutral-700`, `bg-ir-accent`, …) and CSS variables.

---

## 1. Token Architecture

```
Primitives            Semantic (ir-*)              Components
primary-50..950   →   ir-accent / ir-on-accent  →  Button, Checkbox, Tag, Nav…
neutral-50..950   →   ir-bg / ir-card / ir-tN   →  Surface, Text, Border
```

- **Primitives**: raw palette steps (never hard-code hex in components — use a token).
- **Semantic**: intent-based aliases components consume; swapped per theme in `.dark`.
- Change a brand color in **one place** (`@theme`) → whole product updates.

---

## 2. Typography

### Font Families

| Context | Typeface | Variable | Subsets |
|---------|----------|----------|---------|
| **Client Mode** | **Prompt** (Google Fonts, Cadson Demak) | `--font-prompt` | Thai + Latin |
| Internal Workspace | SF Pro TH / SF Pro Text (system) | `--font-sans` | — |
| Display / Headings (Internal) | SF Pro Display (system) | `--font-display` | — |

Client Mode includes: Flow 1, Flow 2, Status, Summary. Applied via `(client)` route group layout → `.client-mode` CSS class.

### Client Mode Type Scale (Prompt)

| Token class | Size (fluid) | Line height | Weight | Tracking | Usage |
|-------------|-------------|-------------|--------|----------|-------|
| `.type-display` | clamp(28px → 40px) | 1.2 | 700 | −0.025em | Hero / flow page titles |
| `.type-h1` | clamp(24px → 32px) | 1.25 | 600 | −0.02em | Section headings |
| `.type-h2` | clamp(20px → 24px) | 1.3 | 600 | −0.015em | Card / panel headings |
| `.type-h3` | clamp(18px → 20px) | 1.4 | 600 | −0.01em | Sub-sections |
| `.type-h4` | 18px | 1.45 | 600 | −0.005em | Component titles |
| `.type-title` | 16px | 1.5 | 600 | 0 | UI labels, steppers |
| `.type-body-lg` | 16px | 1.7 | 400 | 0 | Lead / description text |
| `.type-body` | 15px | 1.65 | 400 | 0 | Default body text |
| `.type-small` | 14px | 1.6 | 400 | 0 | Secondary / helper text |
| `.type-caption` | 12px | 1.5 | 400 | 0 | Captions, meta, tags |
| `.type-overline` | 11px | 1.4 | 500 | +0.05em | Category labels (uppercase) |

> Thai body text uses 1.65–1.70 line-height (vs. 1.5 for Latin) to account for Thai diacritics.  
> Fluid sizes use `clamp(mobile, preferred vw, desktop)` — no breakpoint required.

### Text Color Roles (all modes)

| Role | Color token | Notes |
|------|-------------|-------|
| Heading (h1–h3) | Neutral 900 `#151823` | −0.01em tracking |
| Body | Neutral 800 `#232833` (`ir-t1`) | default text |
| Secondary | Neutral 600 `#5A5F6B` (`ir-t2`) | meta, descriptions |
| Placeholder / meta | Neutral 500 `#6F727C` (`ir-t3`) | |
| Disabled | Neutral 400 `#A0A3AB` (`ir-disabled`) | |
| Green emphasis / link | Primary 800 `#6D780B` (`ir-accent-text`) | passes AA on white |

---

## 3. Core Components

### Buttons
- **Primary**: `bg-ir-accent` (Primary 600) + **`text-ir-on-accent`** (Neutral 900) + radius 8px; hover `ir-accent-hi`, active `ir-accent-lo`. Disabled = Neutral 200 bg / Neutral 400 text.
- **Secondary**: transparent, Neutral-900 border + text, hover `bg-black/5`.
- **Ghost/Link**: `ir-accent-text`, underline on hover.

### Checkbox & Radio
- **Active**: background = **Primary 600 `#AACC00`**, indicator glyph = **White `#FFFFFF`** (brand spec).
- **Inactive**: border = Neutral 300, hover = Neutral 400.

### Tags & Status Labels
- Soft background, thin/no border, low weight — **must not look like a CTA button**.
- Backgrounds: `bg-primary-50` (`#FAFFE7`) or `bg-neutral-100` (`#F4F4F5`); text = `ir-accent-text` or Neutral 600.
- In code: `bg-ir-accent/10 text-ir-accent-text` for brand tags.

### Inputs
- White bg, Neutral 200 border, radius 8px. **Focus**: Primary 600 border + green glow
  `0 0 0 3px rgba(170,204,0,0.22)` (applied globally to `input/textarea/select`).

### Cards / Surfaces
- `bg-ir-card` (#FFF) on `ir-bg` (Neutral 50); border Neutral 200; radius 12–20px; soft elevation (`ir-shadow`).

### Navigation / Step / Progress Indicators
- Active nav & step dot = Primary 600 fill + `ir-on-accent` glyph; progress bar fill = Primary 600.

### Icons
- **24px floor** — no icon (check, close, chevron, arrow, external-link, lock, plus, grip, globe, star, reset, brand marks) renders smaller than 24×24px anywhere in the system, so glyphs stay legible at a glance instead of reading as texture.
- Icons from `src/components/icons.tsx` enforce this centrally: `base()`/`IconGlobe` clamp any `width`/`height` passed in up to 24px, so call sites can't regress below the floor.
- Any badge/chip that *contains* an icon (a checkmark inside a step dot, a close glyph inside a pill) must be sized to comfortably fit a 24px glyph — grow the container, never shrink the icon to fit the container.
- Exception: `LumaChip` (the small solid-color AI-origin marker in `AIMascot.tsx`) is a color/shape bullet, not a pictographic icon, so it is not held to this floor.

---

## 4. Spacing, Radius, Elevation

- **Spacing**: 4px scale (4,8,12,16,20,24,28,32,40,48,56…).
- **Radius**: inputs/buttons 8px · cards 12px · feature/containers 20px · pills 50%.
- **Elevation** (soft, large-blur): `ir-shadow` raised · `ir-shadow-lg` floating · `ir-frost` frosted nav.

---

## 5. Accessibility

- Body/heading text on white ≥ AA (Neutral 800/900).
- **Never** white text on Primary 600 — use `ir-on-accent` (Neutral 900). Exception:
  checkbox/radio indicator glyph (brand decision; large, recognizable).
- Green-on-white text uses Primary 800 minimum.
- Form focus is always visible (Primary border + glow). Touch targets ≥ 44px on mobile.

---

## 6. Theming

Light is default. Add `class="dark"` to `<html>` to activate dark theme (see
`color-system.md` §4). All semantic tokens remap automatically; no per-component work.

---

## 7. For AI / Codegen tools

When generating WRS UI: consume **semantic tokens** (`ir-accent`, `ir-on-accent`,
`ir-bg`, `ir-t1/2/3`, `ir-border`) or palette utilities (`primary-*`, `neutral-*`).
Do not invent hex values. Honor the contrast rule in §5. Tags ≠ buttons (§3).
