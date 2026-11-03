import { sectionById } from "@/lib/data";

// Live website-structure preview: a browser-like nav bar (derived menu) + a vertical
// page flow of the selected sections. Updates real-time as sections change.
export function SitemapView({ sections, compact }: { sections: string[]; compact?: boolean }) {
  const items = sections.map((id) => ({ id, name: sectionById(id)?.name || id, cat: sectionById(id)?.category || "" }));

  if (items.length === 0) {
    return (
      <div className="bg-ir-bg border border-dashed border-ir-border rounded-xl p-6 text-center text-ir-t3 text-xs">
        ยังไม่ได้เลือก Section เลือกด้านล่างเพื่อดูโครงสร้างเว็บไซต์แบบเรียลไทม์
      </div>
    );
  }

  // Primary nav = first item per category (max 6) → mimics a real site menu
  const navNames: string[] = [];
  const seenCat = new Set<string>();
  for (const it of items) {
    if (!seenCat.has(it.cat)) { seenCat.add(it.cat); navNames.push(it.name); }
    if (navNames.length >= 6) break;
  }

  return (
    <div className="bg-white border border-ir-border rounded-xl overflow-hidden ir-shadow">
      {/* browser chrome + derived navigation */}
      <div className="bg-ir-dark px-3 py-2 flex items-center gap-2">
        <span className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-white/25" />
          <span className="w-2 h-2 rounded-full bg-white/25" />
          <span className="w-2 h-2 rounded-full bg-white/25" />
        </span>
        <span className="text-white text-[10px] font-semibold ml-1">🏠 Home</span>
        <div className="ml-auto hidden sm:flex gap-2.5">
          {navNames.map((n) => <span key={n} className="text-white/55 text-[9px]">{n}</span>)}
        </div>
      </div>
      {/* page flow */}
      <div className={`p-3 ${compact ? "" : "sm:p-4"}`}>
        <div className="space-y-1.5">
          {items.map((it, i) => (
            <div key={it.id}>
              <div className="flex items-center gap-2.5 bg-ir-bg border border-ir-border rounded-lg px-3 py-2">
                <span className="w-5 h-5 rounded-md bg-ir-accent/12 text-ir-accent-text text-[10px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[12px] text-ir-t1 flex-1 leading-tight">{it.name}</span>
                <span className="text-[9px] text-ir-t3 shrink-0">{it.cat}</span>
              </div>
              {i < items.length - 1 && <div className="w-px h-1.5 bg-ir-border mx-auto" />}
            </div>
          ))}
        </div>
        <div className="mt-2.5 text-center text-[9px] text-ir-t3">{items.length} sections · footer</div>
      </div>
    </div>
  );
}
