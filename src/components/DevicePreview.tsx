"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { DeviceMode } from "@/lib/types";

type PinComment = { id: string; x: number; y: number; text: string; status: "open" | "resolved"; replies: string[] };
import { directionById } from "@/lib/data";
import { contentFor } from "@/lib/content";
import { photo, bgImage } from "@/lib/images";
import { previewBrand, moodsToBrand } from "@/lib/brand";
import type { PreviewBrand } from "@/lib/brand";
import type { IndustryContent } from "@/lib/content";
import { IconDesktop, IconTablet, IconMobile, IconExpand, IconClose } from "./icons";

const DEVICE_W: Record<DeviceMode, number> = { desktop: 1180, tablet: 720, mobile: 380 };

// ── Section → content-group mapping (SET-inspired Information Architecture) ──
type Group = "about" | "products" | "people" | "ir" | "governance" | "esg" | "news" | "contact";
const SECTION_GROUP: Record<string, Group> = {
  about: "about", mission: "about", history: "about", "chairman-message": "about",
  services: "products", products: "products", features: "products",
  team: "people", board: "people", careers: "people",
  financial: "ir", stock: "ir", reports: "ir", "ir-calendar": "ir",
  "ir-info": "ir", "shareholder-info": "ir", analyst: "ir",
  governance: "governance",
  esg: "esg", sustainability: "esg", csr: "esg", environment: "esg",
  news: "news", blog: "news", cases: "news", awards: "news", testimonials: "news",
  contact: "contact",
};
const GROUP_NAV: Record<Group, string> = {
  about: "เกี่ยวกับเรา", products: "ธุรกิจ", people: "ผู้บริหาร",
  ir: "นักลงทุนสัมพันธ์", governance: "ธรรมาภิบาล", esg: "ความยั่งยืน",
  news: "ข่าวสาร", contact: "ติดต่อ",
};

// Hero height varies by layout style taller for editorial/impact, shorter for data/minimal.
function layoutHeroHeight(layout: string | undefined, sm: boolean): number {
  if (sm) return 150;
  if (!layout) return 230;
  const k = layout.toLowerCase();
  if (k.includes("data") || k.includes("minimal") || k.includes("focus")) return 190;
  if (k.includes("split") || k.includes("dynamic") || k.includes("story") || k.includes("journey") || k.includes("full")) return 265;
  return 230;
}

export function DevicePreview({
  directionId,
  industry,
  sections,
  company,
  moods,
  layout,
  snapshot,
}: {
  directionId: string;
  industry: string;
  sections: string[];
  company?: string;
  moods?: string[];
  layout?: string;
  snapshot?: boolean;
}) {
  const [mode, setMode] = useState<DeviceMode>("desktop");
  const [full, setFull] = useState(false);

  // ── Figma-like pinned comments on the preview ──
  const [commentMode, setCommentMode] = useState(false);
  const [comments, setComments] = useState<PinComment[]>([]);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState("");
  const cid = () => Math.random().toString(36).slice(2, 8);

  const onFrameClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDraftPin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    setDraftText("");
  };
  const addComment = () => {
    if (!draftPin || !draftText.trim()) return;
    setComments((cs) => [...cs, { id: cid(), x: draftPin.x, y: draftPin.y, text: draftText.trim(), status: "open", replies: [] }]);
    setDraftPin(null); setDraftText("");
  };
  const toggleResolve = (id: string) => setComments((cs) => cs.map((c) => (c.id === id ? { ...c, status: c.status === "open" ? "resolved" : "open" } : c)));
  const removeComment = (id: string) => setComments((cs) => cs.filter((c) => c.id !== id));
  const addReply = (id: string, text: string) => setComments((cs) => cs.map((c) => (c.id === id ? { ...c, replies: [...c.replies, text] } : c)));

  const dir = directionById(directionId);
  const c = contentFor(industry);
  const brand = directionId ? previewBrand(directionId) : moodsToBrand(moods ?? []);
  const name = (company && company.trim()) || `${(industry || "Corporate").split(" ")[0].toUpperCase()} GROUP`;

  // Ordered, de-duplicated content blocks preserving the client's section ordering.
  const blocks = useMemo(() => {
    const seen = new Set<Group>();
    const out: Group[] = [];
    for (const id of sections) {
      const g = SECTION_GROUP[id];
      if (g && g !== "contact" && !seen.has(g)) { seen.add(g); out.push(g); }
    }
    return out;
  }, [sections]);

  const navItems = useMemo(() => blocks.filter((g) => g !== "contact").map((g) => GROUP_NAV[g]), [blocks]);
  const hasIR = blocks.includes("ir");
  const hasContact = sections.includes("contact");

  const Frame = ({ sm }: { sm: boolean }) => (
    <div
      className="mx-auto bg-white border border-ir-border rounded-md overflow-hidden shadow-e1 transition-all duration-base"
      style={{ maxWidth: sm ? DEVICE_W.mobile : undefined, width: "100%" }}
    >
      {/* ── Utility top bar (SET-style) ── */}
      <div className="flex items-center justify-between px-3 h-6 text-[8px]" style={{ background: brand.primary }}>
        <div className="flex items-center gap-2 text-white/55">
          <span className="text-white/90 font-medium">TH</span><span>|</span><span>EN</span>
        </div>
        <div className="flex items-center gap-2 text-white/55">
          <span>นักลงทุนสัมพันธ์</span><span>•</span><span>ร่วมงานกับเรา</span>
          <span aria-hidden>🔍</span>
        </div>
      </div>

      {/* ── Main navigation ── */}
      <div className="flex items-center justify-between px-3.5 border-b border-black/5" style={{ height: sm ? 38 : 46, background: "#fff" }}>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded font-bold"
            style={{ width: sm ? 20 : 24, height: sm ? 20 : 24, background: brand.accent, color: brand.onAccent, fontSize: sm ? 11 : 13 }}
          >
            {name.charAt(0)}
          </span>
          <span className="font-semibold tracking-tight" style={{ color: brand.primary, fontSize: sm ? 11 : 13 }}>{name}</span>
        </div>
        {sm ? (
          <span style={{ color: brand.primary }}>☰</span>
        ) : (
          <div className="flex items-center gap-3.5">
            <span className="text-[10px]" style={{ color: brand.primary }}>หน้าแรก</span>
            {navItems.slice(0, 5).map((m) => (
              <span key={m} className="text-[10px] text-ir-t2">{m}</span>
            ))}
            <span className="text-[9px] font-medium px-2 py-1 rounded" style={{ background: brand.accent, color: brand.onAccent }}>{c.cta}</span>
          </div>
        )}
      </div>

      {/* ── Hero (real image + brand scrim) ── */}
      <div
        className="px-6 flex flex-col justify-center"
        style={{
          minHeight: layoutHeroHeight(layout, sm),
          backgroundImage: bgImage(photo("hero", industry, 0, 1100, 560), brand.gradient, 0.45),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-[62%]" style={{ minWidth: sm ? "100%" : undefined }}>
          <div className="inline-block mb-2 px-2 py-0.5 rounded text-[8px] tracking-wide" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            {dir?.label || "Corporate Website"}
          </div>
          <div className="text-white font-bold leading-tight mb-2" style={{ fontSize: sm ? 16 : 26 }}>{c.heroTitle}</div>
          <div className="text-white/75 mb-3" style={{ fontSize: sm ? 9 : 12, maxWidth: 380 }}>{c.heroSub}</div>
          <span className="inline-block px-4 py-1.5 rounded-sm font-semibold" style={{ fontSize: sm ? 10 : 12, background: brand.accent, color: brand.onAccent }}>{c.cta} →</span>
        </div>
      </div>

      {/* ── IR / financial highlights strip (SET data presentation) ── */}
      {hasIR && (
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: brand.primary }}>
          <div className="flex items-center gap-2.5">
            <span className="text-white font-semibold" style={{ fontSize: sm ? 11 : 13 }}>{c.stock.symbol}</span>
            <span className="text-white font-bold" style={{ fontSize: sm ? 13 : 17 }}>{c.stock.price}</span>
            <span className="font-medium" style={{ fontSize: sm ? 9 : 11, color: c.stock.up ? "#4ADE80" : "#FF6B6B" }}>{c.stock.change}</span>
          </div>
          <div className="flex items-center gap-3.5">
            {c.stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-white font-bold" style={{ fontSize: sm ? 10 : 13 }}>{s.value}</div>
                <div className="text-white/50" style={{ fontSize: 7 }}>{s.label}</div>
              </div>
            ))}
            <span className="text-[8px] px-2 py-1 rounded" style={{ background: brand.accent, color: brand.onAccent }}>ข้อมูลนักลงทุน</span>
          </div>
        </div>
      )}

      {/* ── Stats strip when no IR section ── */}
      {!hasIR && (
        <div className="grid grid-cols-3 divide-x divide-ir-border bg-ir-bg">
          {c.stats.map((s) => (
            <div key={s.label} className="py-3 text-center">
              <div className="font-bold" style={{ color: brand.primary, fontSize: sm ? 12 : 17 }}>{s.value}</div>
              <div className="text-ir-t3 text-[8px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Content blocks ── */}
      {blocks.map((g, i) => (
        <Block key={g} group={g} sm={sm} idx={i} c={c} brand={brand} industry={industry} />
      ))}

      {/* ── Contact ── */}
      {hasContact && (
        <div className="px-6 py-5 border-t border-ir-border grid gap-4" style={{ gridTemplateColumns: sm ? "1fr" : "1fr 1fr" }}>
          <div>
            <SecLabel brand={brand}>ติดต่อเรา</SecLabel>
            <div className="text-ir-t2 leading-relaxed" style={{ fontSize: sm ? 9 : 11 }}>
              <div>{c.contact.address}</div>
              <div className="mt-1">โทร. {c.contact.phone}</div>
              <div>{c.contact.email}</div>
            </div>
          </div>
          <div className="rounded-sm min-h-[70px]" style={{ background: bgImage(photo("office", industry, 7, 600, 360), brand.gradient, 0.1), backgroundSize: "cover", backgroundPosition: "center" }} />
        </div>
      )}

      {/* ── Footer + IR PLUS brand mark (Brand Consistency) ── */}
      <div className="px-6 py-4" style={{ background: brand.primary }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-white/80 font-semibold" style={{ fontSize: sm ? 10 : 12 }}>{name}</span>
          <span className="text-white/40 text-[8px]">© 2026 {name}. All rights reserved.</span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[7px] text-white/35">
          <span className="inline-flex items-center justify-center w-3 h-3 rounded-xs" style={{ background: "#BCC416", color: "#151823" }}>✦</span>
          Powered by IR PLUS · Website Requirement System
        </div>
      </div>
    </div>
  );

  const sm = mode === "mobile";

  // device toggle (reused inline + fullscreen)
  const deviceToggle = (compact = false) => (
    <div className="flex gap-1.5">
      {([["desktop", IconDesktop, "Desktop"], ["tablet", IconTablet, "Tablet"], ["mobile", IconMobile, "Mobile"]] as const).map(([m, Icon, label]) => (
        <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} aria-label={label}
          className={`flex items-center gap-1.5 ${compact ? "px-2.5 py-1.5" : "px-3.5 py-2"} rounded-sm border text-body transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${
            mode === m ? "bg-ir-accent text-ir-on-accent border-ir-accent" : "bg-ir-card text-ir-t2 border-ir-border hover:border-ir-border-hi"}`}>
          <Icon /> {compact ? "" : label}
        </button>
      ))}
    </div>
  );

  // framed preview + comment pins/overlay (reused inline + fullscreen)
  const stage = (maxW: number) => (
    <div className="relative mx-auto transition-all duration-base" style={{ maxWidth: maxW, width: "100%" }}>
      <div className={commentMode ? "cursor-crosshair" : ""} onClick={onFrameClick}>
        <Frame sm={sm} />
      </div>
      {/* existing pins */}
      {comments.map((c, i) => (
        <button key={c.id} onClick={(e) => { e.stopPropagation(); setDraftPin(null); }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-caption font-bold flex items-center justify-center ring-2 ring-white shadow-e2 z-10"
          style={{ left: `${c.x}%`, top: `${c.y}%`, background: c.status === "resolved" ? "#34C759" : "#BCC416", color: c.status === "resolved" ? "#fff" : "#151823" }}>
          {i + 1}
        </button>
      ))}
      {/* new-comment popover */}
      {draftPin && (
        <div className="absolute z-20 w-56 -translate-x-1/2 bg-white border border-ir-border rounded-md shadow-e2 p-2.5" style={{ left: `${draftPin.x}%`, top: `calc(${draftPin.y}% + 14px)` }} onClick={(e) => e.stopPropagation()}>
          <textarea autoFocus value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={2} placeholder="พิมพ์คอมเมนต์ที่จุดนี้..." className="w-full border border-ir-border rounded-sm px-2 py-1.5 text-small outline-none focus:border-ir-accent resize-none" />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <button onClick={() => setDraftPin(null)} className="text-caption px-2 py-1 rounded-sm text-ir-t3 hover:text-ir-t1">ยกเลิก</button>
            <button onClick={addComment} className="text-caption px-2.5 py-1 rounded-sm bg-ir-accent text-ir-on-accent font-medium hover:bg-ir-accent-hi">เพิ่ม</button>
          </div>
        </div>
      )}
    </div>
  );

  if (snapshot) {
    return (
      <div className="bg-ir-bg/60 border border-ir-border rounded-md p-3 md:p-4 overflow-hidden">
        <Frame sm={false} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <button onClick={() => { setCommentMode(!commentMode); setDraftPin(null); }} aria-pressed={commentMode}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-body transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${commentMode ? "bg-ir-accent text-ir-on-accent border-ir-accent" : "bg-ir-card text-ir-t2 border-ir-border hover:border-ir-border-hi"}`}>
          💬 Comment{comments.length > 0 ? ` (${comments.length})` : ""}
        </button>
        <button onClick={() => setFull(true)} className="flex items-center gap-2 px-3.5 py-2 rounded-sm border border-ir-border bg-ir-card text-ir-t2 text-body hover:border-ir-border-hi transition-colors">
          <IconExpand /> Full-screen
        </button>
      </div>

      {commentMode && <div className="mb-3 text-small text-ir-accent-text bg-ir-accent/[0.06] border border-ir-accent/20 rounded-sm px-3 py-2">โหมดคอมเมนต์: คลิกตำแหน่งใดก็ได้บน Preview เพื่อปักหมุดคอมเมนต์ (เหมือน Figma)</div>}

      <div className="bg-ir-bg/60 border border-ir-border rounded-md p-4 md:p-6">
        {stage(DEVICE_W["desktop"])}
      </div>

      {/* comment list */}
      {comments.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-caption uppercase tracking-wide text-ir-t3">Comments ({comments.filter((c) => c.status === "open").length} open)</div>
          {comments.map((c, i) => (
            <CommentRow key={c.id} n={i + 1} c={c} onResolve={() => toggleResolve(c.id)} onDelete={() => removeComment(c.id)} onReply={(t) => addReply(c.id, t)} />
          ))}
        </div>
      )}

      {full && createPortal(
        <div className="fixed inset-0 z-[100] bg-ir-bg flex flex-col ir-fade">
          <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-ir-border bg-white">
            <span className="text-ir-t2 text-body font-medium truncate">High-Fidelity Preview {dir?.label} · {brand.paletteName}</span>
            <div className="flex items-center gap-3">
              {deviceToggle(true)}
              <button onClick={() => { setCommentMode(!commentMode); setDraftPin(null); }} aria-pressed={commentMode} aria-label="Comment" className={`px-2.5 py-1.5 rounded-sm border text-body transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${commentMode ? "bg-ir-accent text-ir-on-accent border-ir-accent" : "bg-ir-card text-ir-t2 border-ir-border hover:border-ir-border-hi"}`}>💬</button>
              <button onClick={() => setFull(false)} className="text-ir-t2 hover:text-ir-t1 p-1.5"><IconClose width={24} height={24} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            {stage(DEVICE_W[mode])}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── helpers ──
function CommentRow({ n, c, onResolve, onDelete, onReply }: { n: number; c: PinComment; onResolve: () => void; onDelete: () => void; onReply: (t: string) => void }) {
  const [reply, setReply] = useState("");
  return (
    <div className={`border rounded-md p-3 ${c.status === "resolved" ? "border-ir-border bg-ir-bg/60" : "border-ir-border bg-white"}`}>
      <div className="flex items-start gap-2.5">
        <span className="w-6 h-6 rounded-full text-caption font-bold flex items-center justify-center shrink-0" style={{ background: c.status === "resolved" ? "#34C759" : "#BCC416", color: c.status === "resolved" ? "#fff" : "#151823" }}>{n}</span>
        <div className="flex-1 min-w-0">
          <div className="text-body text-ir-t1">{c.text}</div>
          {c.replies.map((r, i) => (<div key={i} className="text-small text-ir-t2 mt-1 pl-2 border-l-2 border-ir-border">↳ {r}</div>))}
          <div className="flex items-center gap-2 mt-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) { onReply(reply.trim()); setReply(""); } }} placeholder="ตอบกลับ..." className="flex-1 border border-ir-border rounded-sm px-2 py-1 text-small outline-none focus:border-ir-accent" />
            <button onClick={onResolve} className="text-caption px-2 py-1 rounded-sm border border-ir-border text-ir-t2 hover:border-ir-border-hi">{c.status === "open" ? "Resolve" : "Reopen"}</button>
            <button onClick={onDelete} className="text-caption text-ir-t3 hover:text-ir-error">ลบ</button>
          </div>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${c.status === "resolved" ? "bg-ir-teal/15 text-ir-teal" : "bg-ir-accent/10 text-ir-accent-text"}`}>{c.status}</span>
      </div>
    </div>
  );
}

// Pick the most topical "products / business" image role per industry.
function productRole(industry: string): import("@/lib/images").ImageRole {
  switch (industry) {
    case "Energy & Power":
    case "Industrial & Manufacturing":
      return "factory";
    case "ESG & Sustainability":
      return "esg";
    case "Finance & Banking":
    case "Listed Company (SET)":
    case "Government & Public Sector":
    case "Real Estate & Property":
      return "office";
    default:
      return "product"; // Technology, Healthcare, Consumer & Retail
  }
}

function SecLabel({ children, brand }: { children: React.ReactNode; brand: PreviewBrand }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="inline-block w-3 h-[2px] rounded" style={{ background: brand.accent }} />
      <span className="font-semibold uppercase tracking-wide" style={{ color: brand.primary, fontSize: 10 }}>{children}</span>
    </div>
  );
}

function Block({
  group, sm, idx, c, brand, industry,
}: {
  group: Group; sm: boolean; idx: number; c: IndustryContent; brand: PreviewBrand; industry: string;
}) {
  const cols = sm ? "1fr" : "1fr 1fr";
  const tFs = sm ? 9 : 11;

  if (group === "about") {
    return (
      <div className="px-6 py-5 border-t border-ir-border grid gap-4 items-center" style={{ gridTemplateColumns: cols }}>
        <div>
          <SecLabel brand={brand}>{GROUP_NAV.about}</SecLabel>
          <div className="font-semibold mb-1.5" style={{ color: brand.primary, fontSize: sm ? 12 : 15 }}>{c.heroTitle}</div>
          <div className="text-ir-t2 leading-relaxed mb-2" style={{ fontSize: tFs }}>{c.about}</div>
          <div className="text-ir-t3 leading-relaxed" style={{ fontSize: tFs }}>{c.businessDesc}</div>
        </div>
        <div className="rounded-sm min-h-[110px]" style={{ background: bgImage(photo("office", industry, idx, 700, 460), brand.gradient, 0.05), backgroundSize: "cover", backgroundPosition: "center" }} />
      </div>
    );
  }

  if (group === "products") {
    const prodRole = productRole(industry);
    return (
      <div className="px-6 py-5 border-t border-ir-border" style={{ background: "#fff" }}>
        <SecLabel brand={brand}>ธุรกิจและบริการ</SecLabel>
        <div className="grid gap-3" style={{ gridTemplateColumns: sm ? "1fr" : "repeat(3,1fr)" }}>
          {c.products.map((p, i) => (
            <div key={p.name} className="rounded-sm overflow-hidden border border-ir-border">
              <div className="h-16" style={{ background: bgImage(photo(prodRole, industry, i + idx, 500, 320), brand.gradient, 0.05), backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="p-2.5">
                <div className="font-semibold mb-0.5" style={{ color: brand.primary, fontSize: tFs }}>{p.name}</div>
                <div className="text-ir-t3" style={{ fontSize: 8.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group === "people") {
    return (
      <div className="px-6 py-5 border-t border-ir-border bg-ir-bg">
        <SecLabel brand={brand}>คณะผู้บริหาร</SecLabel>
        <div className="grid gap-3" style={{ gridTemplateColumns: sm ? "repeat(3,1fr)" : "repeat(3,1fr)" }}>
          {c.execs.map((e, i) => (
            <div key={e.name} className="text-center">
              <div className="rounded-sm mx-auto mb-1.5" style={{ width: sm ? 48 : 84, height: sm ? 56 : 96, background: bgImage(photo("executive", industry, i + idx, 320, 380), brand.gradient, 0.05), backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="font-semibold" style={{ color: brand.primary, fontSize: sm ? 8.5 : 10 }}>{e.name}</div>
              <div className="text-ir-t3" style={{ fontSize: sm ? 7 : 8.5 }}>{e.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group === "ir") {
    return (
      <div className="px-6 py-5 border-t border-ir-border" style={{ background: "#fff" }}>
        <SecLabel brand={brand}>นักลงทุนสัมพันธ์</SecLabel>
        <div className="grid gap-3" style={{ gridTemplateColumns: sm ? "1fr" : "1.3fr 1fr" }}>
          <div className="rounded-sm p-3" style={{ background: brand.gradient }}>
            <div className="text-white/70 text-[8px] mb-1">ราคาหลักทรัพย์ ({c.stock.symbol})</div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-white font-bold" style={{ fontSize: sm ? 18 : 24 }}>{c.stock.price}</span>
              <span className="mb-1 font-medium" style={{ fontSize: 10, color: c.stock.up ? "#4ADE80" : "#FF6B6B" }}>{c.stock.change}</span>
            </div>
            {/* mini sparkline */}
            <svg viewBox="0 0 120 28" className="w-full" style={{ height: sm ? 22 : 30 }} preserveAspectRatio="none">
              <polyline fill="none" stroke={c.stock.up ? "#4ADE80" : "#FF6B6B"} strokeWidth="2"
                points="0,22 15,18 30,20 45,12 60,15 75,8 90,11 105,5 120,7" />
            </svg>
            <div className="text-white/45 text-[8px] mt-1">Market Cap {c.stock.marketCap}</div>
          </div>
          <div className="space-y-2">
            {["รายงานประจำปี 2569", "งบการเงินไตรมาส 1/2569", "หนังสือเชิญประชุมผู้ถือหุ้น", "นโยบายการจ่ายเงินปันผล"].map((d) => (
              <div key={d} className="flex items-center justify-between px-2.5 py-1.5 rounded border border-ir-border" style={{ fontSize: tFs }}>
                <span className="text-ir-t2">{d}</span>
                <span style={{ color: brand.primary }}>↓ PDF</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (group === "governance") {
    return (
      <div className="px-6 py-5 border-t border-ir-border bg-ir-bg">
        <SecLabel brand={brand}>การกำกับดูแลกิจการ</SecLabel>
        <div className="grid gap-2" style={{ gridTemplateColumns: sm ? "1fr 1fr" : "repeat(4,1fr)" }}>
          {["จริยธรรมธุรกิจ", "โครงสร้างคณะกรรมการ", "การบริหารความเสี่ยง", "การต่อต้านทุจริต"].map((g2) => (
            <div key={g2} className="rounded-sm border border-ir-border bg-white px-2.5 py-2.5 text-center">
              <div className="mx-auto mb-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: brand.accent, color: brand.onAccent, fontSize: 9 }}>⚖</div>
              <div className="text-ir-t2 leading-tight" style={{ fontSize: 8.5 }}>{g2}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group === "esg") {
    return (
      <div className="px-6 py-5 border-t border-ir-border grid gap-4 items-center" style={{ gridTemplateColumns: cols }}>
        <div className="rounded-sm min-h-[110px] order-2" style={{ background: bgImage(photo("esg", industry, idx, 700, 460), brand.gradient, 0.05), backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="order-1">
          <SecLabel brand={brand}>ความยั่งยืน (ESG)</SecLabel>
          <div className="font-semibold mb-1.5" style={{ color: brand.primary, fontSize: sm ? 12 : 14 }}>มุ่งสู่การเติบโตอย่างยั่งยืน</div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {c.stats.map((s) => (
              <div key={s.label} className="rounded-sm bg-ir-bg py-2 text-center">
                <div className="font-bold" style={{ color: brand.primary, fontSize: sm ? 11 : 14 }}>{s.value}</div>
                <div className="text-ir-t3" style={{ fontSize: 7.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // news
  return (
    <div className="px-6 py-5 border-t border-ir-border" style={{ background: "#fff" }}>
      <div className="flex items-center justify-between mb-2">
        <SecLabel brand={brand}>ข่าวสารและกิจกรรม</SecLabel>
        <span className="text-ir-t3" style={{ fontSize: 8.5 }}>ดูทั้งหมด →</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: sm ? "1fr" : "repeat(3,1fr)" }}>
        {c.news.map((n, i) => (
          <div key={n.title} className="rounded-sm overflow-hidden border border-ir-border">
            <div className="h-14" style={{ background: bgImage(photo("news", industry, i + idx, 500, 300), brand.gradient, 0.1), backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[7px] font-medium" style={{ background: brand.accent, color: brand.onAccent }}>{n.tag}</span>
                <span className="text-ir-t3 text-[7.5px]">{n.date}</span>
              </div>
              <div className="text-ir-t2 leading-snug" style={{ fontSize: 8.5 }}>{n.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
