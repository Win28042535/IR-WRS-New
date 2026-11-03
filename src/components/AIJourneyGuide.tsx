"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AIMascot } from "./AIMascot";

// Fixed position for the floating card (top-left corner, below nav)
const CARD_TOP  = 88;
const CARD_LEFT = 16;
const CARD_W    = 292;

export type GuideMode   = "insight" | "recommend" | "tip" | "celebrate";
export type GuideAction = "explain" | "compare" | "recommend" | "learn" | "summarize";
export type ExpertId    = "strategy" | "design" | "content" | "ir" | "analyst";

export interface GuideActions {
  explain?:   string;
  compare?:   string;
  recommend?: string;
  learn?:     string;
  summarize?: string;
}

export interface Expert {
  id:       ExpertId;
  name:     string;
  initials: string;
  color:    string;
  onColor:  string;
  tagline:  string;
}

export const EXPERTS: Record<ExpertId, Expert> = {
  strategy: { id:"strategy", name:"Strategy Guide", initials:"SG", color:"#1E3A5F", onColor:"#93C5FD", tagline:"Business strategy & goals" },
  design:   { id:"design",   name:"Design Guide",   initials:"DG", color:"#4C1D95", onColor:"#DDD6FE", tagline:"Visual direction & aesthetics" },
  content:  { id:"content",  name:"Content Guide",  initials:"CG", color:"#065F46", onColor:"#6EE7B7", tagline:"Content structure & messaging" },
  ir:       { id:"ir",       name:"IR Guide",       initials:"IR", color:"#78350F", onColor:"#FDE68A", tagline:"Investor relations best practices" },
  analyst:  { id:"analyst",  name:"AI Analyst",     initials:"AI", color:"#AACC00", onColor:"#151823", tagline:"Data-driven insights" },
};

const ACTION_META: { key: GuideAction; label: string }[] = [
  { key: "explain",   label: "อธิบาย"      },
  { key: "compare",   label: "เปรียบเทียบ"  },
  { key: "recommend", label: "แนะนำ"        },
  { key: "learn",     label: "เรียนรู้"     },
  { key: "summarize", label: "สรุป"          },
];

const MODE_DOT: Record<GuideMode, string> = {
  insight:   "#AACC00",
  recommend: "#0D6EFD",
  tip:       "#A0A3AB",
  celebrate: "#34C759",
};

interface Props {
  message:    string;
  mode?:      GuideMode;
  expert?:    ExpertId;
  className?: string;
  actions?:   GuideActions;
  visible?:   boolean;
}

// ── ActionContent renderer unchanged ──────────────────────────────
function ActionContent({ action, content, accentColor }: {
  action:      GuideAction;
  content:     string;
  accentColor: string;
}) {
  const dashParts  = content.split(/\s*—\s*|\s+-\s+/).map(s => s.trim()).filter(Boolean);
  const commaParts = content.split(/[,，]\s*/).map(s => s.trim()).filter(Boolean);

  if (action === "compare" && dashParts.length >= 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {dashParts.slice(0, 2).map((seg, i) => (
          <div key={i} className="rounded-lg bg-black/[0.035] px-2.5 py-2">
            <p className="text-[11px] text-ir-t2 leading-snug">{seg}</p>
          </div>
        ))}
        {dashParts.length > 2 && (
          <p className="col-span-2 text-[10.5px] text-ir-t3 leading-snug mt-0.5">
            {dashParts.slice(2).join(" ")}
          </p>
        )}
      </div>
    );
  }

  if (action === "recommend") {
    const headline = dashParts[0] ?? content;
    const rest     = dashParts.slice(1).join(" ");
    return (
      <div>
        <p className="text-[12px] font-semibold leading-snug" style={{ color: accentColor }}>{headline}</p>
        {rest && <p className="text-[11px] text-ir-t2 leading-snug mt-1">{rest}</p>}
      </div>
    );
  }

  if (action === "summarize") {
    const bullets = (commaParts.length >= 2 ? commaParts : dashParts).slice(0, 4);
    return (
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <svg width="24" height="24" viewBox="0 0 9 9" fill="none" className="shrink-0 mt-[3px]"
              style={{ color: accentColor }} aria-hidden>
              <path d="M1 4.5L3.5 7L8 1.5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] text-ir-t2 leading-snug">{b}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (action === "explain" || action === "learn") {
    const items = commaParts.length >= 2 ? commaParts : dashParts;
    if (items.length >= 2) {
      return (
        <ul className="space-y-1.5">
          {items.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 rounded-full mt-[5px]"
                style={{ width: 5, height: 5, background: accentColor, display: "block" }} />
              <span className="text-[11px] text-ir-t2 leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      );
    }
  }

  return <p className="text-[11.5px] text-ir-t2 leading-relaxed">{content}</p>;
}

// ── Floating card rendered via portal ───────────────────────────────
function FloatingCard({
  live, liveMode, liveExpert, fading, accentColor,
  available, active, actions, onAction, onClose, exiting,
}: {
  live:        string;
  liveMode:    GuideMode;
  liveExpert:  Expert;
  fading:      boolean;
  accentColor: string;
  available:   typeof ACTION_META;
  active:      GuideAction | null;
  actions?:    GuideActions;
  onAction:    (key: GuideAction) => void;
  onClose:     () => void;
  exiting:     boolean;
}) {
  const posStyle: React.CSSProperties = {
    position: "fixed",
    top:  CARD_TOP,
    left: CARD_LEFT,
    width: CARD_W,
    zIndex: 9999,
  };

  return (
    <div
      style={posStyle}
      className={["rounded-2xl bg-white border border-ir-border/70 overflow-hidden ai-guide-card shadow-lg", exiting ? "ai-hint-out" : "ai-guide-popover-in"].join(" ")}
      data-mode={liveMode}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-3.5 py-3">
        <AIMascot mood={liveMode} size={30} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={["text-[12.5px] text-ir-t1 leading-snug ai-hint-msg", fading ? "fading" : "visible"].join(" ")}>
            {live}
          </p>
          {fading && (
            <div className="flex items-center gap-[3px] mt-1" aria-hidden>
              {[0,1,2].map(i => (
                <span key={i} className="luma-dot" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          )}
          {available.length > 0 && (
            <div className="flex items-center gap-0.5 mt-2 flex-wrap">
              {available.map(({ key, label }, idx) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAction(key)}
                  className={[
                    "text-[10.5px] px-2.5 py-1 rounded-full transition-colors duration-100 ai-guide-chip-in",
                    active === key
                      ? "font-medium"
                      : "text-ir-t3 hover:text-ir-t2 hover:bg-black/[0.04]",
                  ].join(" ")}
                  style={active === key
                    ? { color: accentColor, background: `${accentColor}14`, animationDelay: `${idx * 55}ms` }
                    : { animationDelay: `${idx * 55}ms` }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-ir-t3 hover:text-ir-t1 hover:bg-black/[0.05] transition-colors"
          aria-label="ปิด"
        >
          <svg width="18" height="18" viewBox="0 0 8 8" fill="none" aria-hidden>
            <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Action content */}
      {active && actions?.[active] && (
        <div key={active} className="border-t border-ir-border/40 px-3.5 py-2.5 ai-hint-content-in">
          <ActionContent action={active} content={actions[active]!} accentColor={accentColor} />
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function AIJourneyGuide({
  message,
  mode    = "insight",
  expert  = "analyst",
  className: _className = "",
  actions,
  visible = true,
}: Props) {
  const [liveExpert, setLiveExpert] = useState<Expert>(EXPERTS[expert] ?? EXPERTS.analyst);
  const prevExpertRef = useRef(expert);

  const [live,     setLive]     = useState(message);
  const [liveMode, setLiveMode] = useState(mode);
  const [fading,   setFading]   = useState(false);
  const [active,   setActive]   = useState<GuideAction | null>(null);
  const [shown,    setShown]    = useState(() => visible);
  const [exiting,  setExiting]  = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  const msgTimer  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const exitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mounted   = useRef(false);

  // Portal target (SSR-safe)
  useEffect(() => { setPortalEl(document.body); }, []);

  // Silent expert switch
  useEffect(() => {
    if (expert === prevExpertRef.current) return;
    prevExpertRef.current = expert;
    const next = EXPERTS[expert] ?? EXPERTS.analyst;
    if (next.id !== liveExpert.id) setLiveExpert(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expert]);

  // Cross-fade message on content change
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!message) return;
    setFading(true);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => {
      setLive(message);
      setLiveMode(mode);
      const next = EXPERTS[expert] ?? EXPERTS.analyst;
      if (next.id !== liveExpert.id) setLiveExpert(next);
      prevExpertRef.current = expert;
      setActive(null);
      setFading(false);
    }, 140);
    return () => clearTimeout(msgTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, mode, expert]);

  // Auto-dismiss active action after 5s
  useEffect(() => {
    if (!active) return;
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => setActive(null), 5000);
    return () => clearTimeout(autoTimer.current);
  }, [active]);

  // Drive shown/exiting from visible prop
  useEffect(() => {
    if (visible) {
      clearTimeout(exitTimer.current);
      setShown(true);
      setExiting(false);
    } else if (shown) {
      setExiting(true);
      clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => {
        setShown(false);
        setExiting(false);
        setActive(null);
      }, 180);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => () => {
    clearTimeout(msgTimer.current);
    clearTimeout(autoTimer.current);
    clearTimeout(exitTimer.current);
  }, []);

  const available   = ACTION_META.filter(a => actions?.[a.key]);
  const accentColor = MODE_DOT[liveMode];

  if (!live || !shown || !portalEl) return null;

  const handleAction = (key: GuideAction) => {
    clearTimeout(autoTimer.current);
    setActive(prev => prev === key ? null : key);
    if (active !== key) {
      autoTimer.current = setTimeout(() => setActive(null), 5000);
    }
  };

  return createPortal(
    <>
      <span role="status" aria-live="polite" className="sr-only">{live}</span>
      <FloatingCard
        live={live}
        liveMode={liveMode}
        liveExpert={liveExpert}
        fading={fading}
        accentColor={accentColor}
        available={available}
        active={active}
        actions={actions}
        onAction={handleAction}
        onClose={() => { setExiting(true); setTimeout(() => setShown(false), 180); }}
        exiting={exiting}
      />
    </>,
    portalEl,
  );
}
