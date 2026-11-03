// QuizMock — bespoke mini-website / UI-component SVG per Explore-quiz option, in the same
// schematic-mockup idiom as MoodMock and WebsiteTypeMock (viewBox 160×120, rects standing
// in for real UI). The quiz asks style questions about the WEBSITE being designed, so each
// option should look like a website decision — a hero, a palette, a stat card, a typeface
// specimen — not a stock photo of an office or skyline.
// `id` is `${questionId}_${optionLetter}`, e.g. "q1_A".
//
// Palettes reuse the exact hexes from DIRECTIONS in lib/data.ts (Deep Navy & Gold, Royal
// Blue & Cyan) so a quiz answer visually previews the real direction palette it steers
// toward, instead of an unrelated color.

// Whether each option's own scene reads as a dark or light surface — drives the letter
// badge ink color in the calling card wrapper (kept out of the SVG itself).
export const QUIZ_MOCK_DARK: Record<string, boolean> = {
  q1_A: true,  q1_B: false,
  q2_A: true,  q2_B: false,
  q3_A: false, q3_B: false,
  q4_A: false, q4_B: false,
  q5_A: true,  q5_B: true,
};

const PROMPT = "'Prompt', 'Noto Sans Thai', sans-serif";

export function QuizMock({ id }: { id: string }) {
  switch (id) {

    // ── Q1 · Corporate & Formal ── symmetric navy/gold hero, centered nav & CTA pair
    case "q1_A":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#0D1B4B" />
          <rect width="160" height="1.5" fill="#C8A855" />
          <rect x="66" y="8" width="28" height="5" rx="1" fill="rgba(255,255,255,0.85)" />
          <rect x="20" y="9.5" width="18" height="2" rx="0.5" fill="rgba(255,255,255,0.28)" />
          <rect x="122" y="9.5" width="18" height="2" rx="0.5" fill="rgba(255,255,255,0.28)" />
          <line x1="20" y1="20" x2="140" y2="20" stroke="rgba(200,168,85,0.3)" strokeWidth="0.5" />
          <rect x="34" y="34" width="92" height="10" rx="1.5" fill="rgba(255,255,255,0.92)" />
          <rect x="46" y="48" width="68" height="6" rx="1" fill="rgba(255,255,255,0.5)" />
          <rect x="72" y="60" width="16" height="1.5" fill="#C8A855" />
          <rect x="52" y="70" width="26" height="10" rx="2" fill="#C8A855" />
          <rect x="82" y="70" width="26" height="10" rx="2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.75" />
          {[20, 68, 116].map((x, i) => <rect key={i} x={x} y="96" width="24" height="16" rx="1.5" fill="rgba(255,255,255,0.05)" />)}
        </svg>
      );

    // ── Q1 · Modern & Approachable ── asymmetric light hero, rounded pill nav, soft blob
    case "q1_B":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="q1b-blob" cx="80%" cy="15%" r="55%">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="160" height="120" fill="#F5F8FF" />
          <rect width="160" height="120" fill="url(#q1b-blob)" />
          <rect x="10" y="9" width="9" height="9" rx="2.5" fill="#00B4D8" />
          <rect x="46" y="10" width="16" height="3.5" rx="1.75" fill="rgba(13,27,75,0.14)" />
          <rect x="66" y="10" width="16" height="3.5" rx="1.75" fill="rgba(13,27,75,0.14)" />
          <rect x="128" y="7.5" width="22" height="9" rx="4.5" fill="#AACC00" />
          <rect x="10" y="32" width="88" height="10" rx="2" fill="#151823" opacity="0.88" />
          <rect x="10" y="46" width="60" height="6" rx="1.5" fill="#151823" opacity="0.45" />
          <rect x="10" y="62" width="34" height="11" rx="5.5" fill="#151823" />
          <rect x="16" y="65.5" width="22" height="4" rx="1" fill="white" opacity="0.9" />
          <rect x="102" y="82" width="48" height="26" rx="4" fill="white" />
          <rect x="102" y="82" width="48" height="26" rx="4" stroke="rgba(13,27,75,0.08)" strokeWidth="0.75" fill="none" />
          <circle cx="112" cy="92" r="4" fill="#00B4D8" opacity="0.65" />
          <rect x="120" y="89" width="24" height="3" rx="1" fill="rgba(13,27,75,0.3)" />
          <rect x="120" y="95" width="18" height="2.5" rx="1" fill="rgba(13,27,75,0.16)" />
        </svg>
      );

    // ── Q2 · Dark & Premium ── color-palette card, real Direction hexes (Deep Navy & Gold)
    case "q2_A":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#03041C" />
          {[
            { x: 16, c: "#0D1B4B", label: 24 },
            { x: 64, c: "#C8A855", label: 20 },
            { x: 112, c: "#FFFFFF", label: 24 },
          ].map(({ x, c, label }, i) => (
            <g key={i}>
              <rect x={x} y="18" width="32" height="32" rx="4" fill={c} />
              <rect x={x + 4} y="55" width={label} height="2.5" rx="1" fill="rgba(255,255,255,0.28)" />
            </g>
          ))}
          <rect x="16" y="70" width="128" height="34" rx="4" fill="#0D1B4B" />
          <rect x="16" y="70" width="128" height="34" rx="4" stroke="rgba(200,168,85,0.3)" strokeWidth="0.75" fill="none" />
          <rect x="24" y="78" width="30" height="10" rx="1.5" fill="#C8A855" />
          <polygon points="140,80 143,86 137,86" fill="#4A8C4A" />
          <rect x="24" y="92" width="44" height="3" rx="1" fill="rgba(255,255,255,0.32)" />
        </svg>
      );

    // ── Q2 · Light & Clear ── color-palette card, real Direction hexes (Royal Blue & Cyan)
    case "q2_B":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#FFFFFF" />
          {[
            { x: 16, c: "#F5F8FF", stroke: true, label: 20 },
            { x: 64, c: "#0D3080", stroke: false, label: 24 },
            { x: 112, c: "#00B4D8", stroke: false, label: 22 },
          ].map(({ x, c, stroke, label }, i) => (
            <g key={i}>
              <rect x={x} y="18" width="32" height="32" rx="4" fill={c} stroke={stroke ? "rgba(13,48,128,0.12)" : "none"} strokeWidth="0.75" />
              <rect x={x + 4} y="55" width={label} height="2.5" rx="1" fill="rgba(13,48,128,0.22)" />
            </g>
          ))}
          <rect x="16" y="70" width="128" height="34" rx="4" fill="#F5F8FF" />
          <rect x="16" y="70" width="128" height="34" rx="4" stroke="rgba(13,48,128,0.12)" strokeWidth="0.75" fill="none" />
          <rect x="24" y="78" width="30" height="10" rx="1.5" fill="#0D3080" />
          <polygon points="140,80 143,86 137,86" fill="#2D8A4A" />
          <rect x="24" y="92" width="44" height="3" rx="1" fill="rgba(13,48,128,0.28)" />
        </svg>
      );

    // ── Q3 · Precise & Data-forward ── real typeface specimen, tight tabular numerals
    case "q3_A":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#F9FAFB" />
          <polygon points="18,52 26,52 22,44" fill="#829504" />
          <text x="18" y="82" fontFamily={PROMPT} fontWeight="700" fontSize="34" letterSpacing="-1" fill="#151823">1,284.50</text>
          <line x1="18" y1="90" x2="142" y2="90" stroke="rgba(21,24,35,0.1)" strokeWidth="0.75" />
          <text x="18" y="102" fontFamily={PROMPT} fontWeight="600" fontSize="9" letterSpacing="1.5" fill="#6F727C">SET INDEX · REAL-TIME</text>
        </svg>
      );

    // ── Q3 · Editorial & Narrative ── real typeface specimen, relaxed narrative weight
    case "q3_B":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#FAFFE7" />
          <text x="12" y="46" fontFamily={PROMPT} fontWeight="700" fontSize="46" fill="#AACC00" opacity="0.4">&ldquo;</text>
          <text x="18" y="66" fontFamily={PROMPT} fontWeight="300" fontSize="15" letterSpacing="0.3" fill="#232833">สร้างการเติบโต</text>
          <text x="18" y="88" fontFamily={PROMPT} fontWeight="300" fontSize="15" letterSpacing="0.3" fill="#232833">ที่ยั่งยืนร่วมกัน</text>
          <rect x="18" y="99" width="28" height="2" rx="1" fill="rgba(35,40,51,0.25)" />
        </svg>
      );

    // ── Q4 · Bold & Confident ── thick accent border, oversized filled stat badge
    case "q4_A":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#FFFFFF" />
          <rect x="6" y="6" width="148" height="108" rx="6" fill="none" stroke="#AACC00" strokeWidth="3.5" />
          <rect x="24" y="30" width="112" height="34" rx="4" fill="#AACC00" />
          <text x="34" y="55" fontFamily={PROMPT} fontWeight="800" fontSize="22" letterSpacing="-0.5" fill="#151823">+24.8%</text>
          <rect x="24" y="78" width="60" height="4" rx="1.5" fill="rgba(21,24,35,0.75)" />
          <rect x="24" y="87" width="40" height="3" rx="1" fill="rgba(21,24,35,0.28)" />
        </svg>
      );

    // ── Q4 · Minimal & Professional ── hairline border, quiet ghost button, negative space
    case "q4_B":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#FFFFFF" />
          <rect x="6" y="6" width="148" height="108" rx="6" fill="none" stroke="rgba(21,24,35,0.12)" strokeWidth="0.75" />
          <rect x="26" y="40" width="52" height="3" rx="1" fill="rgba(21,24,35,0.55)" />
          <rect x="26" y="50" width="34" height="2.5" rx="1" fill="rgba(21,24,35,0.22)" />
          <rect x="26" y="70" width="46" height="12" rx="2.5" fill="none" stroke="rgba(21,24,35,0.3)" strokeWidth="0.75" />
          <rect x="34" y="75" width="26" height="2.5" rx="1" fill="rgba(21,24,35,0.45)" />
        </svg>
      );

    // ── Q5 · Premium / Institutional ── navy/gold formal seal, doc-style caption
    case "q5_A":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#0D1B4B" />
          <line x1="16" y1="16" x2="144" y2="16" stroke="rgba(200,168,85,0.35)" strokeWidth="0.75" />
          <circle cx="80" cy="50" r="18" fill="none" stroke="#C8A855" strokeWidth="1.5" />
          <path d="M72,50 l6,6 l10,-13" fill="none" stroke="#C8A855" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="46" y="82" width="68" height="3" rx="1" fill="rgba(255,255,255,0.7)" />
          <rect x="58" y="90" width="44" height="2" rx="1" fill="rgba(200,168,85,0.55)" />
        </svg>
      );

    // ── Q5 · Tech / Transparent ── glass panel, live-data dot, monospace ticker
    case "q5_B":
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="q5b-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0D3080" />
              <stop offset="100%" stopColor="#03041C" />
            </linearGradient>
          </defs>
          <rect width="160" height="120" fill="url(#q5b-bg)" />
          <rect x="16" y="24" width="128" height="72" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.75" />
          <circle className="ir-live-dot" cx="30" cy="38" r="3" fill="#FF3B30" />
          <text x="38" y="41" fontFamily={PROMPT} fontWeight="600" fontSize="8" letterSpacing="1.5" fill="rgba(255,255,255,0.7)">LIVE</text>
          <text x="26" y="72" fontFamily="'SF Mono', ui-monospace, monospace" fontWeight="600" fontSize="20" fill="#00B4D8">▲ 12.45</text>
          <rect x="26" y="82" width="60" height="2.5" rx="1" fill="rgba(255,255,255,0.22)" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="160" height="120" fill="#151823" />
        </svg>
      );
  }
}
