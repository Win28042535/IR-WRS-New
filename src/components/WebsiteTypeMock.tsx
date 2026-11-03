// Schematic SVG mocks one per website type used in Flow 1 type selection cards
// viewBox 160×120 (4:3) same aspect ratio as MoodMock for consistent card layout
// Hero fills top 55%+; each type has one unmistakable signature element.

export function WebsiteTypeMock({ type, selected }: { type: string; selected: boolean }) {
  const sel = selected;

  // ── Corporate Website ──────────────────────────────────────────────────────
  // Dark navy, city skyline right, massive headline left brand authority
  if (type === "Corporate Website") return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="120" fill="#060D22" />
      <rect y="10" width="160" height="62" fill="#091540" />
      {/* City skyline right third */}
      <rect x="91"  y="14" width="7"  height="58" rx="0.5" fill="rgba(255,255,255,0.05)" />
      <rect x="101" y="22" width="9"  height="50" rx="0.5" fill="rgba(255,255,255,0.04)" />
      <rect x="113" y="10" width="13" height="62" rx="0.5" fill="rgba(255,255,255,0.08)" />
      <rect x="129" y="26" width="9"  height="46" rx="0.5" fill="rgba(255,255,255,0.04)" />
      <rect x="140" y="17" width="11" height="55" rx="0.5" fill="rgba(255,255,255,0.06)" />
      <rect x="154" y="30" width="6"  height="42" rx="0.5" fill="rgba(255,255,255,0.03)" />
      {/* Window lights */}
      {[94,94,116,116,116,143,143].map((x, i) => (
        <rect key={i} x={x} y={[18,25,14,21,28,21,29][i]} width="2.5" height="1.5" rx="0.5" fill="rgba(255,210,80,0.28)" />
      ))}
      {/* Navbar */}
      <rect width="160" height="10" fill="rgba(255,255,255,0.02)" />
      <rect x="8"   y="3"   width="20" height="4"  rx="1"   fill="rgba(255,255,255,0.72)" />
      <rect x="54"  y="3.5" width="12" height="3"  rx="0.5" fill="rgba(255,255,255,0.18)" />
      <rect x="70"  y="3.5" width="12" height="3"  rx="0.5" fill="rgba(255,255,255,0.18)" />
      <rect x="86"  y="3.5" width="12" height="3"  rx="0.5" fill="rgba(255,255,255,0.18)" />
      <rect x="132" y="2.5" width="20" height="5"  rx="2"   fill="#AACC00" />
      {/* Big headline */}
      <rect x="8" y="18" width="76" height="11" rx="2"   fill="rgba(255,255,255,0.93)" />
      <rect x="8" y="33" width="60" height="8"  rx="1.5" fill="rgba(255,255,255,0.88)" />
      <rect x="8" y="45" width="44" height="4"  rx="1"   fill="rgba(255,255,255,0.30)" />
      {/* CTAs */}
      <rect x="8"  y="55" width="30" height="10" rx="2.5" fill="#AACC00" />
      <rect x="42" y="56" width="22" height="8"  rx="2"   fill="rgba(255,255,255,0.07)" />
      {/* Divider */}
      <rect y="72" width="160" height="0.75" fill="rgba(255,255,255,0.05)" />
      {/* 4-col service cards */}
      {[6, 45, 84, 123].map((x, i) => (
        <g key={i}>
          <rect x={x}   y="75" width="34" height="38" rx="2.5" fill="rgba(255,255,255,0.04)" />
          <rect x={x+4} y="80" width="16" height="11" rx="1.5" fill="rgba(255,255,255,0.09)" />
          <rect x={x+4} y="95" width="22" height="2.5" rx="0.5" fill="rgba(255,255,255,0.26)" />
          <rect x={x+4} y="100" width="14" height="2"  rx="0.5" fill="rgba(255,255,255,0.13)" />
          <rect x={x+4} y="105" width="18" height="2"  rx="0.5" fill="rgba(255,255,255,0.08)" />
        </g>
      ))}
      {sel && <rect width="160" height="120" fill="rgba(170,204,0,0.07)" />}
    </svg>
  );

  // ── Investor Relations Site ────────────────────────────────────────────────
  // Light background, bold blue header, dominant stock chart panel financial authority
  if (type === "Investor Relations Site") return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="120" fill="#EEF3FF" />
      {/* Bold blue header */}
      <rect width="160" height="15" fill="#1A3A8F" />
      <rect x="7"   y="4.5" width="16" height="6"   rx="1.5" fill="rgba(255,255,255,0.88)" />
      <rect x="34"  y="6"   width="12" height="3"   rx="1"   fill="rgba(255,255,255,0.45)" />
      <rect x="50"  y="6"   width="12" height="3"   rx="1"   fill="rgba(255,255,255,0.45)" />
      <rect x="66"  y="6"   width="12" height="3"   rx="1"   fill="rgba(255,255,255,0.45)" />
      <rect x="128" y="4.5" width="24" height="6"   rx="2"   fill="rgba(255,255,255,0.18)" />
      {/* Ticker strip */}
      <rect y="15" width="160" height="10" fill="#F0F5FF" />
      <rect x="7"  y="18"   width="32" height="5" rx="1"   fill="rgba(26,58,143,0.88)" />
      <rect x="43" y="18.5" width="18" height="4" rx="1"   fill="rgba(22,163,74,0.75)" />
      <rect x="65" y="19"   width="14" height="3" rx="0.5" fill="rgba(100,116,139,0.4)" />
      <rect x="83" y="19"   width="14" height="3" rx="0.5" fill="rgba(100,116,139,0.4)" />
      {/* LARGE stock chart panel */}
      <rect x="7" y="28" width="146" height="50" rx="3" fill="white" />
      <rect x="7" y="28" width="146" height="50" rx="3" stroke="rgba(26,58,143,0.1)" strokeWidth="0.75" fill="none" />
      <rect x="12" y="32" width="30" height="4"  rx="0.75" fill="rgba(26,58,143,0.75)" />
      <rect x="130" y="32" width="18" height="4" rx="0.75" fill="rgba(22,163,74,0.5)" />
      {[40, 48, 56, 64].map((y, i) => (
        <line key={i} x1="14" y1={y} x2="148" y2={y} stroke="rgba(26,58,143,0.06)" strokeWidth="0.5" />
      ))}
      <polygon points="14,70 24,68 34,71 44,63 54,66 64,57 74,60 84,50 94,54 104,47 114,50 124,42 134,44 144,36 148,36 148,70"
        fill="rgba(26,58,143,0.06)" />
      <polyline points="14,70 24,68 34,71 44,63 54,66 64,57 74,60 84,50 94,54 104,47 114,50 124,42 134,44 144,36"
        fill="none" stroke="#1A3A8F" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="144" cy="36" r="2.5" fill="#1A3A8F" />
      {[14,34,54,74,94,114,134].map((x, i) => (
        <rect key={i} x={x-3} y="74" width="8" height="2" rx="0.5" fill="rgba(100,116,139,0.2)" />
      ))}
      {/* 4 KPI cards */}
      {[7, 45, 83, 121].map((x, i) => (
        <g key={i}>
          <rect x={x}   y="82" width="32" height="30" rx="2.5" fill="white" />
          <rect x={x}   y="82" width="32" height="30" rx="2.5" stroke="rgba(26,58,143,0.1)" strokeWidth="0.75" fill="none" />
          <rect x={x+4} y="87" width="18" height="8"  rx="1.5" fill="rgba(26,58,143,0.8)" />
          <rect x={x+4} y="98" width="14" height="2.5" rx="0.5" fill="rgba(100,116,139,0.35)" />
          <rect x={x+4} y="103" width="10" height="2"  rx="0.5" fill="rgba(22,163,74,0.5)" />
        </g>
      ))}
      <rect x="7"  y="116" width="32" height="2.5" rx="1" fill="rgba(26,58,143,0.3)" />
      <rect x="43" y="116" width="22" height="2.5" rx="1" fill="rgba(100,116,139,0.2)" />
      {sel && <rect width="160" height="120" fill="rgba(170,204,0,0.09)" />}
    </svg>
  );

  // ── Product / Service Site ─────────────────────────────────────────────────
  // Dark + indigo, split hero: bold copy left / prominent app window right
  if (type === "Product / Service Site") return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="120" fill="#08081A" />
      <ellipse cx="140" cy="30" rx="55" ry="40" fill="rgba(99,102,241,0.12)" />
      <rect width="160" height="11" fill="rgba(255,255,255,0.02)" />
      <rect x="8"   y="3.5" width="20" height="4" rx="1.5" fill="rgba(255,255,255,0.65)" />
      <rect x="54"  y="4"   width="13" height="3" rx="0.5" fill="rgba(255,255,255,0.18)" />
      <rect x="71"  y="4"   width="13" height="3" rx="0.5" fill="rgba(255,255,255,0.18)" />
      <rect x="132" y="3"   width="20" height="5" rx="2"   fill="#6366F1" />
      {/* LEFT hero text */}
      <rect x="8" y="18" width="68" height="11" rx="2"   fill="rgba(255,255,255,0.92)" />
      <rect x="8" y="33" width="54" height="11" rx="2"   fill="rgba(99,102,241,0.7)" />
      <rect x="8" y="48" width="44" height="4"  rx="1"   fill="rgba(255,255,255,0.25)" />
      <circle cx="12" cy="58" r="2" fill="#6366F1" />
      <rect x="17" y="56" width="40" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
      <circle cx="12" cy="66" r="2" fill="#6366F1" />
      <rect x="17" y="64" width="34" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
      <circle cx="12" cy="74" r="2" fill="rgba(99,102,241,0.5)" />
      <rect x="17" y="72" width="38" height="4" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="8"  y="82" width="36" height="11" rx="2.5" fill="#6366F1" />
      <rect x="48" y="83" width="22" height="9"  rx="2"   fill="rgba(255,255,255,0.06)" />
      {/* RIGHT browser/app window */}
      <rect x="88" y="14" width="66" height="90" rx="4.5" fill="rgba(255,255,255,0.04)" />
      <rect x="88" y="14" width="66" height="90" rx="4.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" fill="none" />
      <rect x="88" y="14" width="66" height="13" rx="4.5" fill="rgba(255,255,255,0.06)" />
      <rect x="88" y="24.5" width="66" height="0.75" fill="rgba(255,255,255,0.06)" />
      <circle cx="96"  cy="20.5" r="2.2" fill="rgba(255,59,48,0.5)" />
      <circle cx="103" cy="20.5" r="2.2" fill="rgba(255,196,0,0.45)" />
      <circle cx="110" cy="20.5" r="2.2" fill="rgba(52,199,89,0.45)" />
      <rect x="92" y="28" width="58" height="8" rx="1.5" fill="rgba(255,255,255,0.05)" />
      <rect x="92" y="28" width="20" height="8" rx="1.5" fill="rgba(99,102,241,0.5)" />
      <rect x="92" y="39" width="58" height="0.75" fill="rgba(255,255,255,0.06)" />
      {[42, 51, 60, 69, 78, 87, 96].map((y, i) => (
        <g key={i}>
          <rect x="92" y={y} width="14" height="6" rx="1.5" fill="rgba(255,255,255,0.08)" />
          <rect x="110" y={y+1} width={[30,26,34,22,28,24,32][i]} height="4" rx="1" fill="rgba(255,255,255,0.16)" />
        </g>
      ))}
      {[92, 116, 140].map((x, i) => (
        <rect key={i} x={x-2} y="104" width="18" height="6" rx="1"
          fill={i === 1 ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.03)"}
          stroke={i === 1 ? "rgba(99,102,241,0.5)" : "none"} strokeWidth="0.75" />
      ))}
      {sel && <rect width="160" height="120" fill="rgba(170,204,0,0.07)" />}
    </svg>
  );

  // ── Campaign / Microsite ───────────────────────────────────────────────────
  // Bold gradient, oversized centered headline, single CTA pure campaign energy
  if (type === "Campaign / Microsite") return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cmp-glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#6B21A8" />
          <stop offset="60%" stopColor="#3B0764" />
          <stop offset="100%" stopColor="#1A0030" />
        </radialGradient>
      </defs>
      <rect width="160" height="120" fill="url(#cmp-glow)" />
      <polygon points="0,0 100,0 0,70"   fill="rgba(255,255,255,0.04)" />
      <polygon points="160,0 160,90 60,0" fill="rgba(180,30,90,0.18)" />
      <rect x="8" y="8" width="18" height="5" rx="1" fill="rgba(255,255,255,0.55)" />
      <circle cx="150" cy="10.5" r="5.5" fill="rgba(255,255,255,0.1)" />
      {/* Giant headline */}
      <rect x="10" y="26" width="140" height="14" rx="3"   fill="rgba(255,255,255,0.96)" />
      <rect x="10" y="44" width="116" height="11" rx="2.5" fill="rgba(255,255,255,0.80)" />
      <rect x="10" y="59" width="86"  height="8"  rx="2"   fill="rgba(255,255,255,0.45)" />
      <rect x="10" y="71" width="60"  height="5"  rx="1.5" fill="rgba(255,255,255,0.22)" />
      {/* Single bold CTA */}
      <rect x="38" y="84" width="84" height="22" rx="6"   fill="rgba(255,255,255,0.96)" />
      <rect x="50" y="90" width="60" height="10" rx="2.5" fill="rgba(50,10,90,0.50)" />
      <circle cx="72" cy="113" r="2.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="80" cy="113" r="3"   fill="rgba(255,255,255,0.75)" />
      <circle cx="88" cy="113" r="2.5" fill="rgba(255,255,255,0.3)" />
      {sel && <rect width="160" height="120" fill="rgba(170,204,0,0.08)" />}
    </svg>
  );

  // ── ESG / Sustainability Site ──────────────────────────────────────────────
  // Forest green, SDG color tiles band (unmistakable), E·S·G score cards
  return (
    <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="esg-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A4D2E" />
          <stop offset="100%" stopColor="#0D2E1A" />
        </linearGradient>
      </defs>
      <rect width="160" height="120" fill="#071A0E" />
      <rect x="0" y="0" width="110" height="65" fill="rgba(45,106,60,0.18)" />
      <rect width="160" height="12" fill="rgba(255,255,255,0.03)" />
      <rect x="8"   y="3.5" width="18" height="5"   rx="1.5" fill="rgba(255,255,255,0.72)" />
      <rect x="52"  y="5"   width="14" height="2.5" rx="0.5" fill="rgba(255,255,255,0.25)" />
      <rect x="70"  y="5"   width="14" height="2.5" rx="0.5" fill="rgba(255,255,255,0.25)" />
      <rect x="124" y="3"   width="28" height="6"   rx="2"   fill="rgba(74,193,74,0.5)" />
      <rect y="12" width="160" height="32" fill="url(#esg-h)" />
      <rect x="10" y="17" width="78" height="10" rx="2" fill="rgba(255,255,255,0.88)" />
      <rect x="10" y="30" width="56" height="6"  rx="1" fill="rgba(255,255,255,0.38)" />
      <rect x="102" y="14" width="52" height="28" rx="3" fill="rgba(74,193,74,0.15)" />
      <rect x="102" y="14" width="52" height="28" rx="3" stroke="rgba(74,193,74,0.3)" strokeWidth="0.75" fill="none" />
      <rect x="108" y="18" width="26" height="16" rx="2" fill="rgba(74,193,74,0.6)" />
      <rect x="138" y="19" width="12" height="5"  rx="1" fill="rgba(255,255,255,0.3)" />
      {/* SDG color tiles THE signature */}
      <rect y="44" width="160" height="0.75" fill="rgba(255,255,255,0.06)" />
      {["#E5233D","#DDA73A","#4C9F38","#C5192D","#FF3A21","#26BDE2","#FCC30B","#A21942","#FD6925","#DD1367","#FD9D24","#BF8B2E"].map((c, i) => (
        <rect key={i} x={4 + i * 13} y="46" width="11" height="12" rx="2" fill={c} />
      ))}
      <rect y="58" width="160" height="0.75" fill="rgba(255,255,255,0.06)" />
      {/* E · S · G score cards */}
      {[
        { x: 6,   bar: 28, color: "rgba(74,193,74,0.6)" },
        { x: 59,  bar: 22, color: "rgba(74,153,193,0.6)" },
        { x: 112, bar: 32, color: "rgba(193,160,74,0.6)" },
      ].map(({ x, bar, color }, i) => (
        <g key={i}>
          <rect x={x}   y="62" width="46" height="50" rx="3" fill="rgba(255,255,255,0.04)" />
          <rect x={x}   y="62" width="46" height="50" rx="3" stroke="rgba(74,193,74,0.16)" strokeWidth="0.75" fill="none" />
          <rect x={x+4} y="67" width="12" height="12" rx="2.5" fill={color} />
          <rect x={x+4} y="84" width="36" height="5"  rx="2.5" fill="rgba(255,255,255,0.07)" />
          <rect x={x+4} y="84" width={bar}  height="5" rx="2.5" fill={color} />
          <rect x={x+4} y="93" width="28" height="3"  rx="1"   fill="rgba(255,255,255,0.22)" />
          <rect x={x+4} y="99" width="20" height="2.5" rx="1"  fill="rgba(255,255,255,0.12)" />
          <rect x={x+4} y="104" width="14" height="2.5" rx="1" fill="rgba(255,255,255,0.07)" />
        </g>
      ))}
      {sel && <rect width="160" height="120" fill="rgba(170,204,0,0.08)" />}
    </svg>
  );
}
