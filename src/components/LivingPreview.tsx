"use client"; // v2
import { createContext, useContext, useMemo, useRef, useEffect, useState } from "react";
import { useProjectContext } from "@/hooks/useProjectContext";
import { directionById } from "@/lib/data";
import { contentFor } from "@/lib/content";
import { photo, bgImage } from "@/lib/images";
import { previewBrand, moodsToBrand } from "@/lib/brand";
import type { PreviewBrand } from "@/lib/brand";
import type { IndustryContent } from "@/lib/content";

// โ”€โ”€ Section โ’ content-group mapping (mirrors DevicePreview) โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

// Visual-width context set by PreviewScaler in PreviewPanel, drives responsive layouts
export const PreviewWidthCtx = createContext(400);

type Group = "about" | "products" | "people" | "ir" | "governance" | "esg" | "news" | "contact";

const SECTION_GROUP: Record<string, Group> = {
  about: "about", mission: "about", history: "about",
  services: "products", products: "products", features: "products",
  team: "people", board: "people", careers: "people",
  financial: "ir", stock: "ir", reports: "ir", "ir-calendar": "ir",
  governance: "governance",
  esg: "esg", sustainability: "esg", csr: "esg", environment: "esg",
  news: "news", blog: "news", cases: "news", awards: "news", testimonials: "news",
  contact: "contact",
};

const GROUP_LABEL: Record<Group, string> = {
  about: "เน€เธเธตเนเธขเธงเธเธฑเธเน€เธฃเธฒ", products: "เธเธธเธฃเธเธดเธ", people: "เธเธนเนเธเธฃเธดเธซเธฒเธฃ",
  ir: "IR", governance: "Governance", esg: "ESG",
  news: "เธเนเธฒเธงเธชเธฒเธฃ", contact: "เธ•เธดเธ”เธ•เนเธญ",
};

// Transition shorthand applied to every brand-colored inline style.
// When direction changes, the CSS engine animates all color properties.
const T = "0.45s ease";

// โ”€โ”€ Component โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

interface Props {
  className?: string;
  hideHeader?: boolean;
}

export function LivingPreview({ className = "", hideHeader = false }: Props) {
  const ctx = useProjectContext();
  const { company, industry, selectedDirection, selectedMoods, selectedSections } = ctx;

  // Responsive breakpoints driven by the VISUAL (post-zoom) panel width
  const visualWidth = useContext(PreviewWidthCtx);
  const bp = visualWidth < 300 ? "mobile" : visualWidth < 450 ? "tablet" : visualWidth < 620 ? "laptop" : "desktop";
  const cols3 = bp === "mobile" ? "grid-cols-1" : bp === "tablet" ? "grid-cols-2" : "grid-cols-3";
  const cols4 = bp === "mobile" || bp === "tablet" ? "grid-cols-2" : "grid-cols-4";
  const maxNavItems = bp === "mobile" ? 1 : bp === "tablet" ? 2 : 3;

  // Brand โ€” transitions smoothly when direction changes via CSS `transition` on inline styles
  const brand = selectedDirection
    ? previewBrand(selectedDirection)
    : (selectedMoods?.length ? moodsToBrand(selectedMoods) : previewBrand(""));

  const dir     = directionById(selectedDirection);
  const content = contentFor(industry);
  const name    = company?.trim() || (industry ? `${industry.split(" ")[0].toUpperCase()} GROUP` : null);
  const hasData = !!(company?.trim() || industry);

  // โ”€โ”€ Palette flash: re-trigger CSS animation on every direction change โ”€โ”€โ”€โ”€
  const prevDirRef = useRef(selectedDirection);
  const [flashKey, setFlashKey] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (selectedDirection && selectedDirection !== prevDirRef.current) {
      setFlashKey(k => k + 1);
    }
    prevDirRef.current = selectedDirection;
    return () => clearTimeout(flashTimer.current);
  }, [selectedDirection]);

  // โ”€โ”€ Section entrance: track newly added groups โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  const prevSectionsRef = useRef<string[]>(selectedSections);
  const [newGroups, setNewGroups] = useState<ReadonlySet<Group>>(new Set());
  useEffect(() => {
    const prev = prevSectionsRef.current;
    const added = new Set<Group>();
    for (const id of selectedSections) {
      if (!prev.includes(id)) {
        const g = SECTION_GROUP[id];
        if (g) added.add(g);
      }
    }
    if (added.size > 0) {
      setNewGroups(added);
      const t = setTimeout(() => setNewGroups(new Set()), 400);
      prevSectionsRef.current = selectedSections;
      return () => clearTimeout(t);
    }
    prevSectionsRef.current = selectedSections;
  }, [selectedSections]);

  // โ”€โ”€ Blocks: unique content groups in section order โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
  const { blocks, hasContact } = useMemo(() => {
    const seen = new Set<Group>();
    const out: Group[] = [];
    let contact = false;
    for (const id of selectedSections) {
      const g = SECTION_GROUP[id];
      if (!g || seen.has(g)) continue;
      seen.add(g);
      if (g === "contact") { contact = true; continue; }
      out.push(g);
    }
    return { blocks: out, hasContact: contact };
  }, [selectedSections]);

  const hasIR     = blocks.includes("ir");
  const navGroups = blocks.filter(g => g !== "contact").slice(0, maxNavItems);

  return (
    <div className={`${className}`}>

      {!hideHeader && (
        <>
      {/* โ”€โ”€ Header row โ”€โ”€ */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-semibold text-ir-t3 tracking-widest uppercase">
          Live Preview
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ir-live ir-live-dot" />
          <span className="text-[9px] font-semibold tracking-wide text-ir-live">LIVE</span>
        </div>
      </div>
        </>
      )}


      {/* โ”€โ”€ Mini website โ”€โ”€ */}
      <div
        key={flashKey}
        className={`rounded-[10px] overflow-hidden border border-black/10 shadow-xl ${flashKey > 0 ? "preview-palette-flash" : ""}`}
        style={{ background: "#fff" }}
      >

        {/* Utility top bar */}
        <div
          className="flex items-center justify-between px-2.5"
          style={{ height: 17, background: brand.primary, transition: `background ${T}` }}
        >
          <span className="text-[5.5px] text-white/60 font-medium tracking-wider">TH | EN</span>
          <div className="flex items-center gap-1.5 text-[5.5px] text-white/45">
            <span>เธเธฑเธเธฅเธเธ—เธธเธเธชเธฑเธกเธเธฑเธเธเน</span>
            <span>โ€ข</span>
            <span>เธฃเนเธงเธกเธเธฒเธเธเธฑเธเน€เธฃเธฒ</span>
          </div>
        </div>

        {/* Main navbar */}
        <div
          className="flex items-center justify-between px-2.5 border-b border-black/[0.05]"
          style={{ height: 28, background: "#fff" }}
        >
          {/* Logo + name */}
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center rounded-[3px] font-bold shrink-0"
              style={{
                width: 15, height: 15, fontSize: 8,
                background: brand.accent, color: brand.onAccent,
                transition: `background ${T}, color ${T}`,
              }}
            >
              {name ? name.charAt(0) : "?"}
            </span>
            {name ? (
              <span
                className="text-[8px] font-semibold leading-none tracking-tight"
                style={{ color: brand.primary, transition: `color ${T}`, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {name}
              </span>
            ) : (
              <span className="inline-block h-[7px] w-14 rounded-sm bg-gray-200 animate-pulse" />
            )}
          </div>
          {/* Nav items */}
          <div className="flex items-center gap-1.5">
            {navGroups.length > 0 ? (
              <>
                <span className="text-[6px] font-medium" style={{ color: brand.primary, transition: `color ${T}` }}>เธซเธเนเธฒเนเธฃเธ</span>
                {navGroups.map(g => (
                  <span key={g} className="text-[6px] text-ir-t3 leading-none">{GROUP_LABEL[g]}</span>
                ))}
                <span
                  className="text-[5.5px] font-semibold px-1.5 py-0.5 rounded-sm leading-none"
                  style={{ background: brand.accent, color: brand.onAccent, transition: `background ${T}` }}
                >
                  {content.cta}
                </span>
              </>
            ) : (
              <span className="inline-block h-[6px] w-20 rounded-sm bg-gray-100" />
            )}
          </div>
        </div>

        {/* Hero */}
        <div
          className="px-3 flex flex-col justify-end pb-3"
          style={{
            height: 78,
            ...(industry
              ? {
                  backgroundImage: bgImage(photo("hero", industry, 0, 600, 300), brand.gradient, 0.52),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background: hasData ? brand.gradient : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                  transition: `background ${T}`,
                }),
          }}
        >
          {dir && (
            <span
              className="mb-1 text-[5.5px] font-medium px-1.5 py-0.5 rounded-sm leading-none inline-block w-fit"
              style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
            >
              {dir.label}
            </span>
          )}
          <p className="text-white font-bold leading-tight mb-1" style={{ fontSize: 10 }}>
            {industry
              ? content.heroTitle
              : name
                ? `${name} Official Website`
                : "เน€เธงเนเธเนเธเธ•เนเธเธญเธเธญเธเธเนเธเธฃเธเธธเธ“"}
          </p>
          <span
            className="inline-block px-2 py-[3px] rounded-[3px] text-[6.5px] font-semibold leading-none"
            style={{
              background: hasData ? brand.accent : "#d1d5db",
              color: hasData ? brand.onAccent : "#9ca3af",
              transition: `background ${T}, color ${T}`,
            }}
          >
            {industry ? content.cta : "เธ•เธดเธ”เธ•เนเธญเน€เธฃเธฒ"} โ’
          </span>
        </div>

        {/* IR strip or stats row */}
        {hasIR ? (
          <div
            className="flex items-center justify-between px-2.5"
            style={{ height: 22, background: brand.primary, transition: `background ${T}` }}
          >
            <span className="text-[6.5px] text-white font-bold">{content.stock.symbol} {content.stock.price}</span>
            <span className="text-[6px] font-semibold" style={{ color: content.stock.up ? "#4ADE80" : "#FF6B6B" }}>
              {content.stock.change}
            </span>
            <div className="flex items-center gap-2">
              {content.stats.slice(0, 2).map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-[6px] text-white font-bold leading-none">{s.value}</div>
                </div>
              ))}
              <span
                className="text-[5.5px] px-1.5 py-0.5 rounded-sm font-medium"
                style={{ background: brand.accent, color: brand.onAccent, transition: `background ${T}` }}
              >
                IR Data
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-black/[0.05] bg-gray-50/80">
            {content.stats.slice(0, 3).map(s => (
              <div key={s.label} className="py-1.5 text-center">
                <div className="text-[7px] font-bold" style={{ color: brand.primary, transition: `color ${T}` }}>{s.value}</div>
                <div className="text-[5px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Content section blocks */}
        {blocks.length === 0 ? (
          /* skeleton when no sections yet */
          <div className="px-3 py-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-block w-2.5 h-[1.5px] rounded bg-gray-200" />
              <span className="inline-block h-[7px] w-16 rounded-sm bg-gray-200" />
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-100 rounded w-full" />
              <div className="h-1.5 bg-gray-100 rounded w-4/5" />
              <div className="h-1.5 bg-gray-100 rounded w-3/5" />
            </div>
            <div className="flex gap-1 mt-2">
              {[75, 55, 65].map(w => <div key={w} className="h-8 rounded-sm bg-gray-100 flex-1" />)}
            </div>
            <div className="space-y-1 mt-1">
              <div className="h-1.5 bg-gray-100 rounded w-full" />
              <div className="h-1.5 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ) : (
          blocks.map((g, i) => (
            <MiniBlock
              key={g}
              group={g}
              brand={brand}
              content={content}
              industry={industry}
              idx={i}
              isNew={newGroups.has(g)}
              cols3={cols3}
              cols4={cols4}
            />
          ))
        )}

        {/* Contact */}
        {hasContact && (
          <div className="px-3 py-2 border-t border-black/[0.05] flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <SectionLabel brand={brand}>{GROUP_LABEL.contact}</SectionLabel>
              <div className="text-[6px] text-gray-400 leading-relaxed">
                <div>{content.contact.address.slice(0, 35)}</div>
                <div>เนเธ—เธฃ. {content.contact.phone}</div>
              </div>
            </div>
            <div
              className="w-12 h-8 rounded-sm shrink-0"
              style={{ backgroundImage: bgImage(photo("office", industry, 7, 200, 140), brand.gradient, 0.05), backgroundSize: "cover" }}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="px-2.5 py-1.5"
          style={{ background: brand.primary, transition: `background ${T}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[6px] text-white/70 font-semibold">{name || "เธเธทเนเธญเธเธฃเธดเธฉเธฑเธ—"}</span>
            <span className="text-[5px] text-white/35">ยฉ 2026 All rights reserved.</span>
          </div>
          <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1">
            <span
              className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-sm text-[5px]"
              style={{ background: "#AACC00", color: "#151823" }}
            >โฆ</span>
            <span className="text-[5px] text-white/25">Powered by IR PLUS</span>
          </div>
        </div>
      </div>

      {/* Build hint โ€” shown until direction is chosen */}
      {!selectedDirection && (
        <p className="text-[9px] text-ir-t3 mt-2 text-center leading-relaxed">
          {!hasData
            ? "เธเธฃเธญเธเธเธทเนเธญเธเธฃเธดเธฉเธฑเธ—เน€เธเธทเนเธญเน€เธฃเธดเนเธกเธชเธฃเนเธฒเธ Preview"
            : "เน€เธฅเธทเธญเธ Direction เน€เธเธทเนเธญเน€เธเธดเนเธกเธชเธตเนเธฅเธฐ Brand"}
        </p>
      )}
    </div>
  );
}

// โ”€โ”€ Section label helper โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

function SectionLabel({ children, brand }: { children: React.ReactNode; brand: PreviewBrand }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <span className="inline-block w-2 h-[1.5px] rounded" style={{ background: brand.accent, transition: `background ${T}` }} />
      <span className="text-[6px] font-semibold uppercase tracking-wide" style={{ color: brand.primary, transition: `color ${T}` }}>
        {children}
      </span>
    </div>
  );
}

// โ”€โ”€ Mini section blocks โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€

interface MiniBlockProps {
  group: Group;
  brand: PreviewBrand;
  content: IndustryContent;
  industry: string;
  idx: number;
  isNew: boolean;
  cols3: string;
  cols4: string;
}

function MiniBlock({ group, brand, content, industry, idx, isNew, cols3, cols4 }: MiniBlockProps) {
  const base = `border-t border-black/[0.05] ${isNew ? "preview-section-in" : ""}`;

  if (group === "about") return (
    <div className={`${base} px-3 py-2 flex items-start gap-2`}>
      <div className="flex-1 min-w-0">
        <SectionLabel brand={brand}>{GROUP_LABEL.about}</SectionLabel>
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-200 rounded w-full" />
          <div className="h-1.5 bg-gray-100 rounded w-3/4" />
          <div className="h-1.5 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div
        className="w-12 h-10 rounded-sm shrink-0"
        style={{ backgroundImage: bgImage(photo("office", industry, idx, 200, 160), brand.gradient, 0.05), backgroundSize: "cover", backgroundPosition: "center" }}
      />
    </div>
  );

  if (group === "products") return (
    <div className={`${base} px-3 py-2`}>
      <SectionLabel brand={brand}>เธเธธเธฃเธเธดเธเนเธฅเธฐเธเธฃเธดเธเธฒเธฃ</SectionLabel>
      <div className={`grid ${cols3} gap-1`}>
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-sm overflow-hidden border border-black/[0.05]">
            <div
              className="h-6"
              style={{ backgroundImage: bgImage(photo("product", industry, i + idx, 160, 110), brand.gradient, 0.08), backgroundSize: "cover" }}
            />
            <div className="px-1 py-1 space-y-0.5">
              <div className="h-1 bg-gray-200 rounded" />
              <div className="h-1 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (group === "people") return (
    <div className={`${base} px-3 py-2 bg-gray-50/50`}>
      <SectionLabel brand={brand}>{GROUP_LABEL.people}</SectionLabel>
      <div className={`grid ${cols3} gap-2`}>
        {[0, 1, 2].map(i => (
          <div key={i} className="text-center">
            <div
              className="mx-auto rounded-sm mb-0.5"
              style={{ width: 20, height: 24, backgroundImage: bgImage(photo("executive", industry, i + idx, 120, 160), brand.gradient, 0.04), backgroundSize: "cover", backgroundPosition: "center top" }}
            />
            <div className="h-1 bg-gray-200 rounded mx-auto w-4/5" />
            <div className="h-1 bg-gray-100 rounded mx-auto w-3/5 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );

  if (group === "ir") return (
    <div className={`${base} px-3 py-2`}>
      <SectionLabel brand={brand}>{GROUP_LABEL.ir}</SectionLabel>
      <div className="grid grid-cols-2 gap-1.5">
        {/* Stock chart */}
        <div className="rounded-sm p-1.5" style={{ background: brand.gradient, transition: `background ${T}` }}>
          <div className="text-[5.5px] text-white/60 mb-0.5">{content.stock.symbol}</div>
          <div className="text-[9px] text-white font-bold leading-none">{content.stock.price}</div>
          <svg viewBox="0 0 50 14" className="w-full mt-1" style={{ height: 9 }} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke={content.stock.up ? "#4ADE80" : "#FF6B6B"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,11 8,9 16,10 24,6 32,7 40,3 50,4"
            />
          </svg>
        </div>
        {/* Documents */}
        <div className="space-y-0.5">
          {["เธฃเธฒเธขเธเธฒเธเธเธฃเธฐเธเธณเธเธต", "เธเธเธเธฒเธฃเน€เธเธดเธ Q1", "เธซเธเธฑเธเธชเธทเธญเน€เธเธดเธเธเธฃเธฐเธเธธเธก"].map(d => (
            <div key={d} className="flex items-center justify-between px-1.5 py-1 rounded border border-black/[0.05]">
              <span className="text-[5.5px] text-gray-500 truncate flex-1">{d}</span>
              <span className="text-[5.5px] ml-1" style={{ color: brand.primary, transition: `color ${T}` }}>PDFโ“</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (group === "governance") return (
    <div className={`${base} px-3 py-2 bg-gray-50/50`}>
      <SectionLabel brand={brand}>{GROUP_LABEL.governance}</SectionLabel>
      <div className={`grid ${cols4} gap-1`}>
        {["เธเธฃเธดเธขเธเธฃเธฃเธก", "เธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ", "เธเธงเธฒเธกเน€เธชเธตเนเธขเธ", "เธ•เนเธญเธ•เนเธฒเธเธ—เธธเธเธฃเธดเธ•"].map(g2 => (
          <div key={g2} className="rounded-sm border border-black/[0.05] bg-white py-1.5 flex flex-col items-center gap-0.5">
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center text-[6px]"
              style={{ background: brand.accent, color: brand.onAccent, transition: `background ${T}` }}
            >โ–</div>
            <div className="h-1 bg-gray-100 rounded w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );

  if (group === "esg") return (
    <div className={`${base} px-3 py-2 flex gap-2 items-center`}>
      <div
        className="w-14 h-12 rounded-sm shrink-0"
        style={{ backgroundImage: bgImage(photo("esg", industry, idx, 160, 120), brand.gradient, 0.05), backgroundSize: "cover" }}
      />
      <div className="flex-1 min-w-0">
        <SectionLabel brand={brand}>{GROUP_LABEL.esg}</SectionLabel>
        <div className="grid grid-cols-3 gap-0.5">
          {content.stats.slice(0, 3).map(s => (
            <div key={s.label} className="rounded-[3px] bg-gray-50 py-1 text-center">
              <div className="text-[6.5px] font-bold" style={{ color: brand.primary, transition: `color ${T}` }}>{s.value}</div>
              <div className="text-[5px] text-gray-400 mt-0.5 leading-none">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // news (default)
  return (
    <div className={`${base} px-3 py-2`}>
      <SectionLabel brand={brand}>{GROUP_LABEL.news}</SectionLabel>
      <div className={`grid ${cols3} gap-1`}>
        {content.news.slice(0, 3).map((n, i) => (
          <div key={n.title} className="rounded-sm overflow-hidden border border-black/[0.05]">
            <div
              className="h-6"
              style={{ backgroundImage: bgImage(photo("news", industry, i + idx, 160, 100), brand.gradient, 0.1), backgroundSize: "cover" }}
            />
            <div className="px-1 py-1">
              <div
                className="text-[5px] font-semibold px-1 py-0.5 rounded-sm inline-block mb-0.5 leading-none"
                style={{ background: brand.accent, color: brand.onAccent, transition: `background ${T}` }}
              >
                {n.tag}
              </div>
              <div className="h-1 bg-gray-200 rounded w-full" />
              <div className="h-1 bg-gray-100 rounded w-3/4 mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
