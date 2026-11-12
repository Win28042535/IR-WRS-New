"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { GuideMode } from "./AIJourneyGuide";

// ── Face spec per mood (28×28 SVG viewBox) ──────────────────────────────
// Squircle body: rect x=1.5 y=1.5 w=25 h=25 rx=6.5
// Eye centres: cx=9.5 and cx=18.5, cy varies per mood
// Mouth: y≈19–21

interface FaceSpec {
  eyeRy:   number;   // eye vertical radius; collapses to 0.08 on blink
  eyeCy:   number;   // eye centre Y
  eyeRx:   number;   // eye horizontal radius
  hlY:     number;   // specular highlight Y (above eye)
  arcEyes: boolean;  // celebrate uses happy-arc eyes instead of ellipses
  mouth:   "smile" | "open" | "think" | "grin";
}

const FACE: Record<GuideMode, FaceSpec> = {
  tip:       { eyeRy: 2.2,  eyeCy: 12.8, eyeRx: 2.4, hlY: 11.3, arcEyes: false, mouth: "smile" },
  insight:   { eyeRy: 2.85, eyeCy: 12.4, eyeRx: 2.8, hlY: 10.9, arcEyes: false, mouth: "open"  },
  recommend: { eyeRy: 1.55, eyeCy: 13.1, eyeRx: 2.4, hlY: 11.7, arcEyes: false, mouth: "think" },
  celebrate: { eyeRy: 0,    eyeCy: 13.6, eyeRx: 2.5, hlY: 12.1, arcEyes: true,  mouth: "grin"  },
};

// ── Mouth renderer ────────────────────────────────────────────────────────

function Mouth({ kind, dx = 0 }: { kind: FaceSpec["mouth"]; dx?: number }) {
  const s = dx * 0.22; // slight mouth follow on gaze
  switch (kind) {
    case "smile":
      return (
        <path
          d={`M${10.2 + s} 19.8 Q${14 + s} 22 ${17.8 + s} 19.8`}
          stroke="#151823" strokeWidth="1.65" fill="none" strokeLinecap="round"
        />
      );
    case "open":
      // Small open "o" surprised/curious
      return (
        <ellipse
          cx={14 + s} cy={20.0} rx={1.85} ry={1.55}
          fill="#151823" opacity={0.72}
        />
      );
    case "think":
      // Slightly pursed thinking, asymmetric
      return (
        <path
          d={`M${11.5 + s} 20.2 Q${14 + s} 19.3 ${16.5 + s} 20.2`}
          stroke="#151823" strokeWidth="1.45" fill="none" strokeLinecap="round"
        />
      );
    case "grin":
      // Wide smile with a white fill hint (teeth)
      return (
        <>
          <path
            d={`M${8.2 + s} 17.8 Q${14 + s} 24.2 ${19.8 + s} 17.8`}
            stroke="#151823" strokeWidth="1.85" fill="none" strokeLinecap="round"
          />
          {/* subtle teeth fill */}
          <path
            d={`M${9.8 + s} 18.9 Q${14 + s} 23 ${18.2 + s} 18.9`}
            fill="white" fillOpacity={0.38} stroke="none"
          />
        </>
      );
    default:
      return null;
  }
}

// ── LUMA Design Language shared type system ────────────────────────────

export type LumaType = "insight" | "recommendation" | "reasoning" | "gap" | "tip" | "celebrate";

const LUMA_COLOR: Record<LumaType, string> = {
  insight:        "#BCC416",
  recommendation: "#0D6EFD",
  reasoning:      "#6366F1",
  gap:            "#F59E0B",
  tip:            "#A0A3AB",
  celebrate:      "#34C759",
};

// Tiny squircle chip LUMA's shape language as an inline AI-origin marker
export function LumaChip({
  type  = "insight",
  size  = 14,
}: {
  type?: LumaType;
  size?: number;
}) {
  const color = LUMA_COLOR[type];
  const pad   = Math.round(size * 0.07);
  const inner = size - pad * 2;
  const rx    = inner * 0.23; // matches LUMA body proportion (rx 6.5/28 ≈ 23%)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden className="shrink-0">
      <rect x={pad} y={pad} width={inner} height={inner} rx={rx} fill={color} />
    </svg>
  );
}

// Squircle loading state replaces bare loading text on AI-flow pages
export function LumaLoader({ label = "กำลังเตรียมข้อมูล..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 px-6" role="status" aria-label={label}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="luma-loader-sq" aria-hidden>
        <defs>
          <radialGradient id="luma-loader-grad" cx="33%" cy="27%" r="65%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </radialGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="7.4" fill="#BCC416" />
        <rect x="2" y="2" width="32" height="32" rx="7.4" fill="url(#luma-loader-grad)" />
      </svg>
      <p className="text-[12px] text-ir-t3" aria-hidden>{label}</p>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function AIMascot({
  mood    = "tip",
  size    = 28,
  className = "",
}: {
  mood?:      GuideMode;
  size?:      number;
  className?: string;
}) {
  const uid    = useId().replace(/:/g, "");
  const gradId = `mg-${uid}`;

  const [live,     setLive]   = useState<GuideMode>(mood);
  const [blinking, setBlink]  = useState(false);
  const [gazeX,    setGazeX]  = useState(0);
  const blinkRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gazeRef  = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setLive(mood); }, [mood]);

  // Blink every 3.5–7 s
  useEffect(() => {
    const sched = () => {
      blinkRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); sched(); }, 110);
      }, 3500 + Math.random() * 3500);
    };
    sched();
    return () => clearTimeout(blinkRef.current);
  }, []);

  // Gaze glance every 5–10 s
  useEffect(() => {
    const go = () => {
      gazeRef.current = setTimeout(() => {
        const off = (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.8);
        setGazeX(off);
        setTimeout(() => { setGazeX(0); go(); }, 650 + Math.random() * 450);
      }, 5000 + Math.random() * 5000);
    };
    go();
    return () => clearTimeout(gazeRef.current);
  }, []);

  const f      = FACE[live];
  const eyeRy  = blinking ? 0.08 : f.eyeRy;
  const isArc  = f.arcEyes;
  const isCel  = live === "celebrate";

  return (
    <div
      aria-hidden
      data-mood={live}
      data-mascot="luma"
      className={["mascot-float-wrap shrink-0", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        className="mascot-svg"
      >
        <defs>
          <radialGradient id={gradId} cx="34%" cy="25%" r="70%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.24" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* ── Body: squircle (rounded square) the LUMA signature ── */}
        <rect x="1.5" y="1.5" width="25" height="25" rx="6.5" fill="#BCC416" />
        <rect x="1.5" y="1.5" width="25" height="25" rx="6.5" fill={`url(#${gradId})`} />

        {/* ── Celebrate ring halo expands and fades on repeat ── */}
        {isCel && (
          <rect
            x="1.5" y="1.5" width="25" height="25" rx="6.5"
            fill="none" stroke="#BCC416" strokeWidth="1.5"
            className="mascot-halo"
          />
        )}

        {/* ── Eyes ── */}
        {isArc ? (
          // Happy arc eyes (^_^) for celebrate
          <g transform={`translate(${gazeX}, 0)`}>
            {blinking ? (
              <>
                <line x1={7} y1={13.5} x2={12} y2={13.5}
                  stroke="#151823" strokeWidth="1.9" strokeLinecap="round" />
                <line x1={16} y1={13.5} x2={21} y2={13.5}
                  stroke="#151823" strokeWidth="1.9" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Upper-arc happy eyes: M start A rx ry 0 0 1 end */}
                <path d="M 7 14 A 2.5 2.5 0 0 1 12 14"
                  stroke="#151823" strokeWidth="2.1" fill="none" strokeLinecap="round" />
                <path d="M 16 14 A 2.5 2.5 0 0 1 21 14"
                  stroke="#151823" strokeWidth="2.1" fill="none" strokeLinecap="round" />
              </>
            )}
          </g>
        ) : (
          // Ellipse eyes for tip / insight / recommend
          <>
            <ellipse
              cx={9.5 + gazeX}  rx={f.eyeRx}
              cy={f.eyeCy}      ry={eyeRy}
              fill="#151823"
              className="mascot-eye"
            />
            <ellipse
              cx={18.5 + gazeX} rx={f.eyeRx}
              cy={f.eyeCy}      ry={eyeRy}
              fill="#151823"
              className="mascot-eye"
            />
            {/* Specular highlights */}
            <circle cx={10.6 + gazeX} cy={f.hlY} r="0.82" fill="white" opacity="0.55" className="mascot-hl" />
            <circle cx={19.6 + gazeX} cy={f.hlY} r="0.82" fill="white" opacity="0.55" className="mascot-hl" />
          </>
        )}

        {/* ── Mouth ── */}
        <Mouth kind={f.mouth} dx={gazeX} />

        {/* ── Celebrate corner sparkles twinkling dots on squircle face ── */}
        {isCel && (
          <>
            <circle cx="5"  cy="5"  r="1.6" fill="white" fillOpacity="0.8" className="mascot-spark mascot-spark-a" />
            <circle cx="23" cy="5"  r="1.6" fill="white" fillOpacity="0.8" className="mascot-spark mascot-spark-b" />
            <circle cx="5"  cy="23" r="1.6" fill="white" fillOpacity="0.8" className="mascot-spark mascot-spark-c" />
            <circle cx="23" cy="23" r="1.6" fill="white" fillOpacity="0.8" className="mascot-spark mascot-spark-d" />
          </>
        )}
      </svg>
    </div>
  );
}
