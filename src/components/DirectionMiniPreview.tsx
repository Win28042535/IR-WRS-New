// DirectionMiniPreview structurally unique mini-website per direction.
// Each direction uses a different layout grammar, not just different colors.

import { previewBrand } from "@/lib/brand";
import { contentFor } from "@/lib/content";
import { directionById } from "@/lib/data";

interface Props {
  directionId: string;
  industry?: string;
  company?: string;
  className?: string;
}

interface SubProps {
  brand: ReturnType<typeof previewBrand>;
  headline: string;
  displayName: string;
  className: string;
}

export function DirectionMiniPreview({ directionId, industry = "", company, className = "" }: Props) {
  const brand   = previewBrand(directionId);
  const dir     = directionById(directionId);
  const content = contentFor(industry);

  const headline    = content?.heroTitle || dir?.tagline || "Crafting your digital identity";
  const displayName = company?.trim()
    || (industry ? `${industry.split(" ")[0].toUpperCase()} GROUP` : (dir?.label ?? "COMPANY"));

  switch (directionId) {
    case "premium-corporate":
      return <PremiumCorporate brand={brand} headline={headline} displayName={displayName} className={className} />;
    case "esg-focused":
      return <EsgFocused brand={brand} headline={headline} displayName={displayName} className={className} />;
    case "modern-tech":
      return <ModernTech brand={brand} headline={headline} displayName={displayName} className={className} />;
    case "growth-oriented":
      return <GrowthOriented brand={brand} headline={headline} displayName={displayName} className={className} />;
    default:
      return <PremiumCorporate brand={brand} headline={headline} displayName={displayName} className={className} />;
  }
}

// ── A: Premium Corporate Full-Width Elegant Grid ──────────────────────────
// Formal horizontal nav, centered hero, gold divider, symmetric 3-col grid.
function PremiumCorporate({ brand, headline, className }: SubProps) {
  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: brand.primary }}
    >
      {/* Nav traditional: logo | nav links | CTA */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: "11%", borderBottom: `1px solid rgba(255,255,255,0.1)` }}
      >
        <div className="flex items-center gap-1.5">
          <div style={{ width: 8, height: 8, background: brand.accent, borderRadius: 1 }} />
          <div style={{ width: 22, height: 2.5, background: "rgba(255,255,255,0.55)", borderRadius: 1 }} />
        </div>
        <div className="flex gap-2">
          {[14, 10, 16, 10].map((w, i) => (
            <div key={i} style={{ width: w, height: 2, background: "rgba(255,255,255,0.28)", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ width: 22, height: 6, background: brand.accent, borderRadius: 2 }} />
      </div>

      {/* Hero full-width, centered content */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4"
        style={{ background: `linear-gradient(180deg, ${brand.primary} 0%, rgba(0,0,0,0.18) 100%)` }}
      >
        {/* Centered eyebrow with flanking lines */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 0.5, background: brand.accent, opacity: 0.7 }} />
          <div style={{ width: 22, height: 2, background: brand.accent, borderRadius: 1, opacity: 0.75 }} />
          <div style={{ width: 14, height: 0.5, background: brand.accent, opacity: 0.7 }} />
        </div>
        {/* Large centered headline */}
        <div
          style={{
            fontSize: 7.5,
            fontWeight: 800,
            color: "rgba(255,255,255,0.95)",
            lineHeight: 1.2,
            maxWidth: "82%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {headline}
        </div>
        {/* Sub text bars centered */}
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <div style={{ width: 55, height: 2, background: "rgba(255,255,255,0.28)", borderRadius: 1 }} />
          <div style={{ width: 38, height: 2, background: "rgba(255,255,255,0.18)", borderRadius: 1 }} />
        </div>
        {/* Dual CTA group */}
        <div className="flex gap-2 mt-1.5">
          <div style={{ width: 26, height: 7, background: brand.accent, borderRadius: 2 }} />
          <div
            style={{ width: 26, height: 7, borderRadius: 2, border: `0.8px solid rgba(255,255,255,0.38)` }}
          />
        </div>
      </div>

      {/* Gold divider signature element */}
      <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent, ${brand.accent}, transparent)`, opacity: 0.65, flexShrink: 0 }} />

      {/* 3-col symmetric section grid */}
      <div className="grid grid-cols-3 shrink-0" style={{ height: "26%" }}>
        {["About", "Services", "Investors"].map((label, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-0.5 py-1"
            style={{
              background: i === 1 ? "rgba(255,255,255,0.04)" : "transparent",
              borderLeft: i > 0 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            <div style={{ width: 11, height: 11, background: brand.accent, borderRadius: 2, opacity: 0.35 + i * 0.12 }} />
            <div style={{ width: 18, height: 2.5, background: "rgba(255,255,255,0.45)", borderRadius: 1 }} />
            <div style={{ width: 22, height: 1.5, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── B: ESG-Focused Light Editorial / Nature Photography ────────────────────
// White bg, full-width nature photo hero, SDG palette strip, article cards.
// Feels like Patagonia's sustainability page or a UN SDG report site.
function EsgFocused({ brand, headline, className }: SubProps) {
  const sdgColors = ["#E5243B", "#DDA63A", "#4C9F38", "#C5192D", "#FF3A21", "#26BDE2", "#FCC30B", "#A21942"];
  const green = "#1E6B2E";
  const greenLight = "#2E8B3E";

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: "#FAFCF8" }}
    >
      {/* White nav bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: "10%", background: "white", borderBottom: "0.75px solid #E4EDE2" }}
      >
        <div className="flex items-center gap-1.5">
          <div style={{ width: 7, height: 7, background: green, borderRadius: 1 }} />
          <div style={{ width: 20, height: 2.5, background: green, borderRadius: 1, opacity: 0.55 }} />
        </div>
        <div className="flex gap-1.5">
          {[12, 16, 12, 10].map((w, i) => (
            <div key={i} style={{ width: w, height: 2, background: "rgba(30,107,46,0.35)", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ width: 22, height: 7, background: green, borderRadius: 3 }} />
      </div>

      {/* Full-width nature photo hero */}
      <div
        className="relative shrink-0"
        style={{
          height: "40%",
          background: `linear-gradient(160deg, #1A5C28 0%, #2E7D3E 40%, #3D9E52 70%, #2A6B38 100%)`,
        }}
      >
        {/* Simulated forest/nature texture with layered opacity shapes */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 40%, rgba(74,180,74,0.3) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%, rgba(0,80,20,0.4) 0%, transparent 50%)" }} />
        {/* Overlay gradient for text legibility */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
        {/* Hero headline on photo */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
          <div style={{ width: "70%", height: 7, background: "rgba(255,255,255,0.92)", borderRadius: 1, marginBottom: 3 }} />
          <div style={{ width: "50%", height: 4, background: "rgba(255,255,255,0.55)", borderRadius: 1 }} />
        </div>
        {/* ESG badge */}
        <div
          className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5"
          style={{ background: "rgba(30,107,46,0.85)", borderRadius: 2 }}
        >
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#6EE89A" }} />
          <div style={{ width: 12, height: 2, background: "rgba(255,255,255,0.75)", borderRadius: 0.5 }} />
        </div>
      </div>

      {/* SDG color strip */}
      <div
        className="flex items-center gap-0.5 px-2 shrink-0"
        style={{ height: "10%", background: "white", borderBottom: "0.75px solid #E4EDE2", borderTop: "0.75px solid #E4EDE2" }}
      >
        <div style={{ width: 18, height: 2, background: "rgba(30,107,46,0.35)", borderRadius: 1, marginRight: 3 }} />
        {sdgColors.map((c, i) => (
          <div key={i} style={{ width: 8, height: 8, background: c, borderRadius: 1.5, opacity: 0.88 }} />
        ))}
      </div>

      {/* 2-col editorial article cards */}
      <div className="flex-1 grid grid-cols-2 gap-1.5 p-2">
        {[
          { photo: "linear-gradient(135deg, #2A6B2A, #4A9B4A)", tag: "Climate" },
          { photo: "linear-gradient(135deg, #1A5080, #2A80B0)", tag: "Report" },
        ].map(({ photo, tag }, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-lg overflow-hidden" style={{ background: "white", border: "0.75px solid #E4EDE2" }}>
            <div style={{ height: "50%", background: photo, position: "relative" }}>
              <div className="absolute bottom-1 left-1.5 px-1 py-0.5 rounded" style={{ background: greenLight, fontSize: 4, color: "white" }}>
                <div style={{ width: 10, height: 2, background: "rgba(255,255,255,0.8)", borderRadius: 0.5 }} />
              </div>
            </div>
            <div className="px-1.5 pb-1.5 flex flex-col gap-0.5">
              <div style={{ width: "75%", height: 2.5, background: "rgba(30,107,46,0.65)", borderRadius: 1 }} />
              <div style={{ width: "88%", height: 2, background: "rgba(0,0,0,0.22)", borderRadius: 1 }} />
              <div style={{ width: "60%", height: 2, background: "rgba(0,0,0,0.14)", borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── C: Modern Tech Clean White Product UI ──────────────────────────────────
// White bg, dark navy nav, oversized headline left + product screenshot right.
// Feels like Stripe / Linear / Vercel confident white space, precision type.
function ModernTech({ brand, headline, className }: SubProps) {
  const navy = "#0F172A";
  const blue = "#2563EB";

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: "#F8FAFF" }}
    >
      {/* Dark navy nav */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: "11%", background: navy }}
      >
        <div className="flex items-center gap-1.5">
          <div style={{ width: 6, height: 6, background: blue, transform: "rotate(45deg)" }} />
          <div style={{ width: 18, height: 2.5, background: "rgba(255,255,255,0.55)", borderRadius: 1 }} />
        </div>
        <div className="flex gap-1.5">
          {[11, 14, 11, 9].map((w, i) => (
            <div key={i} style={{ width: w, height: 2, background: "rgba(255,255,255,0.3)", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ width: 22, height: 7, background: blue, borderRadius: 3 }} />
      </div>

      {/* Hero headline left, product UI right */}
      <div className="flex shrink-0" style={{ height: "52%" }}>
        {/* Left copy panel */}
        <div className="flex flex-col justify-center px-3 gap-1.5" style={{ width: "46%", background: "white" }}>
          <div className="flex items-center gap-1">
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: blue }} />
            <div style={{ width: 20, height: 2, background: `${blue}55`, borderRadius: 1 }} />
          </div>
          <div style={{ width: "95%", height: 6, background: navy, borderRadius: 1.5 }} />
          <div style={{ width: "80%", height: 6, background: navy, borderRadius: 1.5 }} />
          <div style={{ width: "60%", height: 6, background: navy, borderRadius: 1.5 }} />
          <div className="flex flex-col gap-0.5 mt-0.5">
            {[88, 75].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 2, background: "rgba(15,23,42,0.28)", borderRadius: 1 }} />
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            <div style={{ width: 30, height: 8, background: blue, borderRadius: 3 }} />
            <div style={{ width: 28, height: 8, background: "white", border: `1px solid rgba(15,23,42,0.13)`, borderRadius: 3 }} />
          </div>
        </div>

        {/* Right: product screenshot simulation */}
        <div
          className="flex-1 flex items-start justify-start p-1.5"
          style={{ background: "#EFF4FF", borderLeft: "1px solid rgba(37,99,235,0.1)" }}
        >
          <div
            className="w-full rounded-lg overflow-hidden"
            style={{ background: "white", border: "0.75px solid #E2E8F0", boxShadow: "0 2px 8px rgba(15,23,42,0.08)" }}
          >
            <div className="flex items-center gap-1 px-2" style={{ height: 10, background: "#F8FAFC", borderBottom: "0.75px solid #E2E8F0" }}>
              {["#FF5F57","#FEBC2E","#28C840"].map((c, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div className="p-2 flex flex-col gap-1">
              <div style={{ width: "100%", height: 3, background: `${blue}22`, borderRadius: 1 }} />
              {[90, 70, 80, 55].map((w, i) => (
                <div key={i} style={{ width: `${w}%`, height: 2, background: "rgba(15,23,42,0.12)", borderRadius: 1 }} />
              ))}
              <div className="flex gap-1 mt-0.5">
                <div style={{ width: 20, height: 5, background: blue, borderRadius: 2 }} />
                <div style={{ width: 16, height: 5, background: "rgba(15,23,42,0.08)", borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature icons strip */}
      <div
        className="flex items-center justify-around shrink-0 px-3"
        style={{ height: "14%", background: "white", borderTop: "0.75px solid #E2E8F0", borderBottom: "0.75px solid #E2E8F0" }}
      >
        {[blue, "rgba(15,23,42,0.35)", "rgba(15,23,42,0.35)", "rgba(15,23,42,0.35)"].map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div style={{ width: 8, height: 8, background: `${c}20`, border: `0.75px solid ${c}50`, borderRadius: 2 }} />
            <div style={{ width: 14 + i, height: 2, background: `${c}60`, borderRadius: 1 }} />
          </div>
        ))}
      </div>

      {/* Bottom metrics bar */}
      <div className="flex-1 flex items-center justify-around px-3" style={{ background: "#F8FAFF" }}>
        {[1,2,3].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div style={{ width: 22, height: 5, background: navy, borderRadius: 1 }} />
            <div style={{ width: 14, height: 2, background: "rgba(15,23,42,0.3)", borderRadius: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── D: Growth-Oriented Data & Metrics Grid ─────────────────────────────────
// KPI tiles appear ABOVE the headline data-first hierarchy. Line chart. Minimal.
function GrowthOriented({ brand, headline, className }: SubProps) {
  const kpis = [
    { value: "12.4%", label: "ROE" },
    { value: "$2.4B", label: "REV" },
    { value: "847", label: "CUST" },
    { value: "A+", label: "RTNG" },
  ];

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ background: brand.primary }}
    >
      {/* Minimal nav */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{ height: "9%", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
      >
        <div style={{ width: 18, height: 3, background: brand.accent, borderRadius: 1 }} />
        <div className="flex gap-1.5">
          {[10, 12, 8].map((w, i) => (
            <div key={i} style={{ width: w, height: 2, background: "rgba(255,255,255,0.22)", borderRadius: 1 }} />
          ))}
        </div>
      </div>

      {/* KPI tiles data leads before any copy */}
      <div
        className="grid grid-cols-4 gap-px shrink-0"
        style={{ height: "24%", background: "rgba(255,255,255,0.04)" }}
      >
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-0.5"
            style={{
              background: i === 0 ? `rgba(170,204,0,0.07)` : brand.primary,
            }}
          >
            <div
              style={{
                fontSize: 7,
                fontWeight: 800,
                color: i === 0 ? brand.accent : "rgba(255,255,255,0.82)",
                lineHeight: 1,
              }}
            >
              {kpi.value}
            </div>
            <div style={{ width: 12, height: 1.5, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
          </div>
        ))}
      </div>

      {/* Line chart stock / growth curve */}
      <div className="relative shrink-0" style={{ height: "20%", background: "rgba(0,0,0,0.22)" }}>
        <svg width="100%" height="100%" viewBox="0 0 100 28" preserveAspectRatio="none">
          {/* Grid lines */}
          {[9, 18].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          ))}
          {/* Area fill */}
          <polyline
            points="0,20 12,17 24,18 36,11 48,13 60,7 72,9 84,4 100,6 100,28 0,28"
            fill={brand.accent}
            fillOpacity="0.07"
          />
          {/* Line */}
          <polyline
            points="0,20 12,17 24,18 36,11 48,13 60,7 72,9 84,4 100,6"
            fill="none"
            stroke={brand.accent}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Headline smaller, below data (inverted hierarchy) */}
      <div className="flex-1 flex flex-col justify-center px-3 gap-1">
        <div style={{ width: "68%", height: 3, background: "rgba(255,255,255,0.55)", borderRadius: 1 }} />
        <div style={{ width: "48%", height: 2.5, background: "rgba(255,255,255,0.32)", borderRadius: 1 }} />
        <div className="flex gap-2 mt-1">
          <div style={{ width: 22, height: 7, background: brand.accent, borderRadius: 2 }} />
        </div>
      </div>

      {/* Data row strip */}
      <div
        className="shrink-0 px-2 py-1.5 flex flex-col gap-0.5"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
      >
        {[70, 55, 80].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              style={{
                width: 4, height: 4,
                background: i === 0 ? brand.accent : "rgba(255,255,255,0.18)",
                borderRadius: 1,
              }}
            />
            <div style={{ width: `${w}%`, height: 1.5, background: "rgba(255,255,255,0.14)", borderRadius: 1 }} />
            <div style={{ width: 10, height: 2, background: "rgba(255,255,255,0.22)", borderRadius: 1, marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
