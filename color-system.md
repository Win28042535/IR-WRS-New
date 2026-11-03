# IR PLUS · WRS — Color System

Single source of truth for color. Two palettes: **Primary** (brand / interactive) and
**Neutral** (text / surface / border). All values live as Tailwind tokens in
`src/app/globals.css` (`@theme`) and map to semantic `ir-*` tokens.

---

## 1. Primary Palette (lime)

Primary 600 (`#AACC00`) is the main brand color.

| Token | Hex | CSS var | Tailwind |
|-------|-----|---------|----------|
| Primary 50  | `#FAFFE7` | `--color-primary-50`  | `*-primary-50` |
| Primary 100 | `#F0FFC4` | `--color-primary-100` | `*-primary-100` |
| Primary 200 | `#E6FF8F` | `--color-primary-200` | `*-primary-200` |
| Primary 300 | `#D8FF4E` | `--color-primary-300` | `*-primary-300` |
| Primary 400 | `#CCFB1A` | `--color-primary-400` | `*-primary-400` |
| Primary 500 | `#B9E604` | `--color-primary-500` | `*-primary-500` |
| **Primary 600** | **`#AACC00`** | `--color-primary-600` | `*-primary-600` |
| Primary 700 | `#829504` | `--color-primary-700` | `*-primary-700` |
| Primary 800 | `#6D780B` | `--color-primary-800` | `*-primary-800` |
| Primary 900 | `#5F660F` | `--color-primary-900` | `*-primary-900` |
| Primary 950 | `#363B03` | `--color-primary-950` | `*-primary-950` |

**Usage:** Primary buttons · active navigation · active/selected states · progress &
step indicators · focus states · interactive components · link highlights · success accents.

> **Contrast rule (WCAG):** Primary 600 is a *light* lime. Text/icons placed **on** a
> Primary fill must be **Neutral 900 (`#151823`)**, not white (white on lime fails AA).
> The one documented exception is the **checkbox/radio indicator glyph = white** (brand
> spec). For green *text on light surfaces* use **Primary 800 (`#6D780B`)** (passes AA),
> never Primary 600.

---

## 2. Neutral Palette (grayscale)

| Token | Hex | CSS var |
|-------|-----|---------|
| Neutral 50  | `#F9FAFB` | `--color-neutral-50` |
| Neutral 100 | `#F4F4F5` | `--color-neutral-100` |
| Neutral 200 | `#E6E7EA` | `--color-neutral-200` |
| Neutral 300 | `#D3D5D9` | `--color-neutral-300` |
| Neutral 400 | `#A0A3AB` | `--color-neutral-400` |
| Neutral 500 | `#6F727C` | `--color-neutral-500` |
| Neutral 600 | `#5A5F6B` | `--color-neutral-600` |
| Neutral 700 | `#3C404C` | `--color-neutral-700` |
| Neutral 800 | `#232833` | `--color-neutral-800` |
| Neutral 900 | `#151823` | `--color-neutral-900` |
| Neutral 950 | `#06070F` | `--color-neutral-950` |

| Role | Tokens |
|------|--------|
| Page background / secondary surfaces / cards / empty states | Neutral 50, 100 |
| Borders / dividers / table & input borders | Neutral 200, 300 |
| Secondary text / meta / placeholder / helper | Neutral 500, 600 |
| Headings / body / navigation / data tables | Neutral 700, 800, 900 |

---

## 3. Semantic Tokens (`ir-*`)

Components reference these (kept stable so themes can be re-skinned centrally).

| Semantic token | Light value | Role |
|----------------|-------------|------|
| `ir-accent` | Primary 600 `#AACC00` | brand / interactive fills |
| `ir-accent-hi` | Primary 500 `#B9E604` | hover |
| `ir-accent-lo` | Primary 700 `#829504` | active / pressed |
| `ir-accent-text` | Primary 800 `#6D780B` | green emphasis text on light |
| `ir-on-accent` | Neutral 900 `#151823` | text/icon on a Primary fill |
| `ir-bg` | Neutral 50 `#F9FAFB` | page background |
| `ir-card` | `#FFFFFF` | card / content surface |
| `ir-border` | Neutral 200 `#E6E7EA` | borders / dividers |
| `ir-border-hi` | Neutral 300 `#D3D5D9` | strong border / hover |
| `ir-t1` | Neutral 800 `#232833` | body text (headings use Neutral 900) |
| `ir-t2` | Neutral 600 `#5A5F6B` | secondary text |
| `ir-t3` | Neutral 500 `#6F727C` | meta / placeholder |
| `ir-disabled` | Neutral 400 `#A0A3AB` | disabled text |
| `ir-dark` | Neutral 900 `#151823` | dark surface / emphasis |
| `ir-nav` | Neutral 950 `#06070F` | deepest dark |
| `ir-teal` | `#34C759` | success |
| `ir-warn` | `#FF9500` | warning |
| `ir-error` | `#FF3B30` | error / destructive |

---

## 4. Light & Dark Theme

The app is **light by default**. **Dark theme** is enabled by adding the class `dark` to
`<html>` — the `.dark { … }` block in `globals.css` re-maps the semantic `ir-*` tokens to
dark surfaces (bg → Neutral 950, card → Neutral 900, text → Neutral 100/400, borders →
Neutral 700/600, green emphasis → Primary 400 for legibility). No component changes needed.

---

## 5. Figma Variable Library (import reference)

Recreate as Figma Variables (Collection: **WRS / Color**), modes **Light** + **Dark**:

- Group `primary/`: `primary/50` … `primary/950` = hex values in §1.
- Group `neutral/`: `neutral/50` … `neutral/950` = hex values in §2.
- Group `semantic/` (alias variables → primitives, per mode): `accent → primary/600`,
  `on-accent → neutral/900`, `bg → neutral/50` (dark: `neutral/950`), `text/body →
  neutral/800` (dark: `neutral/100`), etc. (mirror §3 + §4).

Keep primitives (primary/neutral) as raw hex; semantic variables alias to primitives so
switching mode flips everything. This mirrors the CSS `@theme` + `.dark` setup 1:1.
