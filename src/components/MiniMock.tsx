// MiniMock a tiny styled "website" preview rendered from a color palette + layout kind.
// Used for Layout / Direction / Mood thumbnails so each option is DISTINCT, full-frame
// (never cropped), and reflects real color + structure (better than generic stock photos).

function Bar({ w, c = "rgba(0,0,0,0.16)", h = 4 }: { w: string; c?: string; h?: number }) {
  return <div style={{ width: w, height: h, background: c, borderRadius: 2 }} />;
}

export function MiniMock({ colors, layout = "", className = "" }: { colors: string[]; layout?: string; className?: string }) {
  const primary = colors[0] || "#151823";
  const accent = colors[1] || "#BCC416";
  const light = colors[2] || "#FFFFFF";
  const L = layout.toLowerCase();
  const kind = /data|dashboard|metric/.test(L) ? "data"
    : /split/.test(L) ? "split"
    : /story|journey/.test(L) ? "story"
    : /minimal|focus/.test(L) ? "minimal"
    : "grid";

  return (
    <div className={`w-full h-full overflow-hidden flex flex-col ${className}`} style={{ background: light }}>
      {/* nav */}
      <div className="flex items-center gap-1.5 px-2" style={{ height: "16%", minHeight: 14, background: primary }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: accent }} />
        <div className="flex gap-1 ml-1">
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 12, height: 3, background: "rgba(255,255,255,0.4)", borderRadius: 2 }} />)}
        </div>
        <span className="ml-auto" style={{ width: 22, height: 8, background: accent, borderRadius: 3 }} />
      </div>

      {kind === "split" ? (
        <div className="flex-1 grid grid-cols-2">
          <div className="flex flex-col justify-center gap-1.5 p-2.5" style={{ background: light }}>
            <Bar w="70%" c={primary} h={6} /><Bar w="90%" /><Bar w="50%" />
            <span style={{ width: 30, height: 9, background: accent, borderRadius: 3, marginTop: 3 }} />
          </div>
          <div style={{ background: primary, opacity: 0.92 }} />
        </div>
      ) : kind === "data" ? (
        <div className="flex-1 flex flex-col p-2 gap-1.5" style={{ background: light }}>
          <div style={{ height: "30%", background: primary, borderRadius: 4 }} />
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ background: "rgba(0,0,0,0.05)", borderRadius: 3, borderTop: `3px solid ${accent}` }} />)}
          </div>
        </div>
      ) : kind === "story" ? (
        <div className="flex-1 flex flex-col">
          <div style={{ height: "46%", background: primary }} className="flex flex-col justify-center gap-1 px-3">
            <Bar w="55%" c="rgba(255,255,255,0.9)" h={6} /><Bar w="75%" c="rgba(255,255,255,0.4)" />
          </div>
          <div className="flex-1 grid grid-cols-2">
            <div style={{ background: light }} className="p-2.5 flex flex-col gap-1 justify-center"><Bar w="80%" /><Bar w="60%" /></div>
            <div style={{ background: accent, opacity: 0.2 }} />
          </div>
        </div>
      ) : kind === "minimal" ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5" style={{ background: light }}>
          <Bar w="38%" c={primary} h={6} /><Bar w="52%" />
          <span style={{ width: 30, height: 9, background: accent, borderRadius: 3, marginTop: 4 }} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ background: light }}>
          <div style={{ height: "48%", background: primary }} className="flex flex-col justify-center gap-1 px-3">
            <Bar w="60%" c="rgba(255,255,255,0.9)" h={6} /><Bar w="80%" c="rgba(255,255,255,0.4)" />
            <span style={{ width: 30, height: 9, background: accent, borderRadius: 3, marginTop: 3 }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-2 flex-1">
            {[0, 1, 2].map((i) => <div key={i} style={{ background: "rgba(0,0,0,0.05)", borderRadius: 3 }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
