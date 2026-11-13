import { useEffect, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent, type SVGProps } from "react";
import { createPortal } from "react-dom";
import { IconArrowRight, IconArrowLeft, IconCheck } from "./icons";
import { RULES } from "@/lib/data";


// ── Step indicator (production WRS pattern) ──
// One centered pill carries where you are — the step name plus "3/6" — and a segmented
// bar underneath is the single progress readout (no % figure, no second dot row), so the
// two can never disagree. Same layout at every width; the pill truncates the name on very
// narrow screens. The draft persists to localStorage on every change, hence the static
// "บันทึกอัตโนมัติ" note. Sticky so it stays in view while the step content scrolls.
export function StepIndicator({ steps, stepsEn, current }: { steps: string[]; stepsEn?: string[]; current: number }) {
  return (
    <div className="sticky top-14 md:top-0 z-30 bg-ir-bg/85 backdrop-blur-md">
      <div className="max-w-[1000px] mx-auto px-5 lg:px-7 pt-3 pb-3">
        <div className="relative flex items-center justify-center min-h-9">
          <div
            className="flex items-center gap-2 max-w-full sm:max-w-[calc(100%-7rem)] rounded-full border border-ir-border bg-ir-card px-4 py-2 shadow-e1"
            aria-label={`ขั้นตอนที่ ${current} จาก ${steps.length}: ${steps[current - 1]}`}
            title={stepsEn?.[current - 1]}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ir-accent shrink-0" aria-hidden="true" />
            <span className="text-body font-medium text-ir-t1 truncate">{steps[current - 1]}</span>
            <span className="font-mono text-small text-ir-t3 tabular-nums shrink-0" aria-hidden="true">
              {current}/{steps.length}
            </span>
          </div>
          <span className="absolute right-0 hidden items-center gap-1.5 text-small font-medium text-ir-t3 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ir-accent" aria-hidden="true" />
            บันทึกอัตโนมัติ
          </span>
        </div>

        <div className="flex gap-1 mt-3" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i + 1 < current ? "bg-ir-accent" : i + 1 === current ? "bg-ir-dark" : "bg-ir-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Option card (production WRS pattern) ──
// One selectable card for every pick-from-a-list question: 40px round icon (or the pick's
// rank number once ranked), title + description, and a lime selected state. Cards never
// move when picked — order is shown by the rank number instead. The whole card is the hit
// area (stretched ::after on the main button); `aside` controls sit above it so they stay
// separately clickable without nesting buttons.
// ── Selection indicator — the shared "pickable / picked" mark (globals.css .sel-*) ──
// Always visible: an empty ring says the card can be picked, the ring darkens on hover
// (inside a `group/sel`) as a preview, and fills lime with a springing check once picked.
export function SelectDot({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center w-7 h-7 shrink-0 rounded-full border-2 transition-[background-color,border-color] duration-200 ${
        on ? "border-ir-accent bg-ir-accent text-ir-on-accent" : "border-ir-border-hi bg-ir-card group-hover/sel:border-ir-select"
      } ${className}`}
    >
      {on && <IconCheck width={20} height={20} className="sel-check" />}
    </span>
  );
}

export function OptionCard({
  icon: Icon,
  title,
  desc,
  selected,
  onSelect,
  rank,
  tag,
  aside,
  disabled = false,
  className = "",
}: {
  icon?: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
  title: ReactNode;
  desc?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  rank?: number;
  tag?: ReactNode;
  aside?: ReactNode;
  /** Max reached and this one isn't picked: dims and stops taking taps. */
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group/sel relative flex items-center gap-3 rounded-xl border px-4 py-3.5 min-h-[84px] transition-[background-color,border-color,box-shadow,opacity,scale] duration-200 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ir-ring/40 ${
        selected
          ? "border-ir-select bg-primary-50 shadow-selected active:scale-[0.98]"
          : disabled
            ? "border-ir-border bg-ir-card opacity-40"
            : "border-ir-border bg-ir-card hover:border-ir-select-soft hover:bg-primary-50/60 active:scale-[0.98]"
      } ${className}`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        disabled={disabled}
        className="flex flex-1 min-w-0 items-center gap-3 text-left focus-visible:outline-none disabled:cursor-not-allowed after:absolute after:inset-0 after:rounded-xl after:content-['']"
      >
        {rank ? (
          <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-ir-accent text-ir-on-accent font-mono text-body font-bold">
            {rank}
          </span>
        ) : Icon ? (
          <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-full transition-colors ${selected ? "bg-ir-accent-soft text-ir-accent-text" : "bg-ir-muted text-ir-t2"}`}>
            <Icon width={24} height={24} />
          </span>
        ) : null}
        <span className="flex-1 min-w-0">
          <span className="block text-lead font-semibold text-ir-t1 leading-snug">{title}</span>
          {desc && <span className="block text-body text-ir-t3 leading-snug mt-0.5">{desc}</span>}
          {tag}
        </span>
        <SelectDot on={selected} />
      </button>
      {aside && <div className="relative z-10 flex items-center shrink-0">{aside}</div>}
    </div>
  );
}

/** Small lime pill under an option card title — e.g. "กลุ่มเป้าหมายหลัก". */
export function OptionTag({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1.5 inline-flex rounded-full px-2 py-0.5 text-small font-semibold bg-ir-accent-soft text-ir-accent-text">
      {children}
    </span>
  );
}

// ── Selection rule badge (UX #5) ──
export function RuleBadge({ ruleKey, count }: { ruleKey: keyof typeof RULES; count: number }) {
  const rule = RULES[ruleKey];
  const ok = count >= rule.min && count <= rule.max;
  const full = count >= rule.max;
  return (
    <span
      className={`text-small font-semibold px-2 py-0.5 rounded-full transition-colors ${
        ok ? "bg-ir-accent/12 text-ir-accent-text" : "bg-black/[0.05] text-ir-t3"
      }`}
      title={`เลือกได้ ${rule.min}-${rule.max} รายการ`}
    >
      {count}/{rule.max}
      {full && " · เต็ม"}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full bg-ir-border rounded-full overflow-hidden">
      <div className="h-full bg-ir-accent transition-all duration-500" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Chip({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-small px-2.5 py-1 rounded-full ${
        dark ? "bg-ir-accent/10 text-ir-accent-text" : "bg-ir-bg border border-ir-border text-ir-t2"
      }`}
    >
      {dark && <span className="w-[5px] h-[5px] rounded-full bg-ir-accent" />}
      {children}
    </span>
  );
}

export function SectionLabel({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="type-title text-ir-t1 mb-2 flex items-center flex-wrap gap-2">
      {children}
      {badge}
    </div>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="type-small font-semibold text-ir-t2">{children}</span>
      <div className="flex-1 h-px bg-ir-border" />
    </div>
  );
}

export function SectionDivider() {
  // Mobile gets a slightly tighter gap (my-5 vs my-6) — every section break adds up on a
  // screen with much less vertical room than desktop to begin with.
  return <div className="h-px bg-ir-border/60 my-5 md:my-6" />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-ir-card border border-ir-border rounded-md shadow-e1 ${className}`}>{children}</div>
  );
}

export function PaletteSwatches({ colors, size = 16 }: { colors: string[]; size?: number }) {
  return (
    <div className="flex gap-1">
      {colors.map((c, i) => (
        <span
          key={i}
          className="rounded-full border border-white/20"
          style={{ background: c, width: size, height: size }}
        />
      ))}
    </div>
  );
}

// ── Nav buttons (production WRS pattern) ──
// Primary: near-black pill, white label. Disabled keeps a readable label on the muted fill
// (the step's own guide explains what's missing when it's clicked) instead of fading out.
// Secondary: borderless muted pill. Hover is a quiet fill change — no scale jump.
export function NextButton({
  children,
  onClick,
  disabled,
  accent,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex items-center gap-2 h-11 pl-6 pr-5 rounded-full text-lead font-semibold text-white bg-ir-dark hover:bg-neutral-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 transition-[background-color,color,transform] duration-200 disabled:bg-ir-border disabled:text-ir-t3 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {children}
      {!accent && (
        <IconArrowRight width={24} height={24} className="transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0" />
      )}
    </button>
  );
}

export function BackButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 h-11 pl-4 pr-6 rounded-full text-lead font-medium text-ir-t2 bg-ir-muted hover:bg-ir-border hover:text-ir-t1 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 transition-[background-color,color,transform] duration-200"
    >
      <IconArrowLeft width={24} height={24} />
      {children}
    </button>
  );
}

// Same window-frame glyph for both the open and close controls — right column always
// represents the Living Workspace panel itself, and only the arrow inside flips direction
// (pointing in to open, out to close) so the pair reads as one consistent control instead of
// two unrelated pictograms.
function WorkspaceDockIcon({ direction, muted }: { direction: "open" | "close"; muted?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 2.5 V13.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10.9" y="3.1" width="3.2" height="9.8" rx="0.6" fill="currentColor" opacity={muted ? 0.18 : 0.35} />
      {direction === "open" ? (
        <path d="M13.3 5.6 L11.8 8 L13.3 10.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M11.9 5.6 L13.4 8 L11.9 10.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// ── Living Workspace drag divider + collapse/expand toggle ──
// Collapsed state is a minimal icon-only control — same hover/active/focus/motion
// language as Primary Buttons (NextButton), just visually lighter so it doesn't compete
// for attention. Before Structure there's nothing useful to show yet, so `empty` renders
// a muted, non-inviting variant instead of the accent-glow "ready" one.
export function WorkspaceDividerToggle({
  wsCollapsed,
  onDividerMouseDown,
  toggleWsCollapsed,
  panelTransition,
  empty,
}: {
  wsCollapsed: boolean;
  onDividerMouseDown: (e: ReactMouseEvent) => void;
  toggleWsCollapsed: () => void;
  panelTransition: string;
  empty?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 group z-10 flex items-center justify-center ${wsCollapsed ? "w-0" : "w-px bg-ir-border hover:bg-ir-accent/30 cursor-ew-resize transition-colors duration-150"}`}
      onMouseDown={onDividerMouseDown}
      style={{ transition: panelTransition }}
    >
      {/* Expanded hit area */}
      {!wsCollapsed && <div className="absolute inset-y-0 -left-3 -right-3" />}

      {/* Grip dots (drag hint) — same 6-dot grip glyph the row drag-handles use elsewhere in
          the Living Workspace, so every drag affordance in the app reads as one consistent
          mark. Was two thin bars stretched to the divider's full height; that shape couldn't
          reach the 20px icon floor without an absurdly tall stretch (a plain aspect-preserving
          scale-up would have needed ~88px), so it's redrawn as the same dot grid instead. */}
      {!wsCollapsed && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-ir-accent-text">
          <svg width="20" height="32" viewBox="0 0 10 16" fill="none">
            <circle cx="3" cy="4" r="1.2" fill="currentColor" />
            <circle cx="7" cy="4" r="1.2" fill="currentColor" />
            <circle cx="3" cy="8" r="1.2" fill="currentColor" />
            <circle cx="7" cy="8" r="1.2" fill="currentColor" />
            <circle cx="3" cy="12" r="1.2" fill="currentColor" />
            <circle cx="7" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Expanded-state toggle: subtle pill, always visible but low-key while workspace is open */}
      {!wsCollapsed && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={toggleWsCollapsed}
          title="ซ่อน Living Workspace"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-ir-border bg-ir-card shadow-e1 text-ir-t2 hover:text-ir-accent-text hover:border-ir-accent/40 hover:bg-ir-accent/5 active:text-ir-accent-text active:border-ir-accent/40 active:bg-ir-accent/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-accent/40 transition-all duration-150 z-20"
          style={{ width: 24, height: 36 }}
        >
          <WorkspaceDockIcon direction="close" />
        </button>
      )}

      {/* Collapsed-state toggle: minimal icon-only control docked to the edge. Motion/timing
          mirrors NextButton (scale + glow on hover, quick settle on active) so it feels like
          part of the same system despite being visually quiet. */}
      {wsCollapsed && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={toggleWsCollapsed}
          title={empty ? "Living Workspace" : "เปิด Living Workspace"}
          aria-label={empty ? "Living Workspace (ยังไม่มีข้อมูล)" : "เปิด Living Workspace"}
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-l-md transition-all duration-500 active:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-accent/40 z-30 animate-[wsdock-in_320ms_cubic-bezier(0.4,0,0.2,1)] ${
            empty
              ? "bg-ir-card border border-r-0 border-ir-border text-ir-t3 hover:text-ir-t2 hover:border-ir-border-hi hover:scale-[1.06] active:scale-[0.98]"
              : "bg-ir-card border border-r-0 border-ir-border text-ir-t2 hover:text-ir-accent-text hover:border-ir-accent/40 hover:bg-ir-accent hover:!text-ir-on-accent hover:scale-[1.1] hover:shadow-glow active:scale-[0.98] active:shadow-none"
          }`}
          style={{ width: 36, height: 44, right: 0 }}
        >
          <WorkspaceDockIcon direction="open" muted={empty} />
        </button>
      )}
    </div>
  );
}

// Below 768px, the inline nav below doubles as a scroll sentinel: once it scrolls out of
// the viewport (content taller than one screen, user hasn't reached the bottom yet), a fixed
// duplicate takes over so the primary CTA never requires scrolling all the way down to find.
// It disappears again once the real nav is back in view — and never appears at all if the
// step's content already fits on screen (nothing to scroll). Desktop is untouched: the
// floating bar is `md:hidden` and the inline nav's own layout/spacing don't change on md+.
export function StepNav({
  onBack,
  backLabel = "ย้อนกลับ",
  next,
}: {
  onBack: () => void;
  backLabel?: string;
  next: ReactNode;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowFloating(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Reserved space (mobile only) so the fixed bar below never overlaps this content,
          whether or not it's currently showing. No rule line above the nav row — the
          existing mt-8/pt-5 gap already reads as "a new section" (the primary/secondary
          buttons are visually distinct from body content on their own), so the border was
          adding a second signal for something spacing alone already communicated. */}
      <div ref={sentinelRef} className="flex items-center justify-between mt-8 pt-5 pb-20 md:pb-0">
        <BackButton onClick={onBack}>{backLabel}</BackButton>
        {next}
      </div>

      {/* Portaled to <body>: the step card animates in with a transform, and any transformed
          ancestor turns `position: fixed` into "fixed to that card", which left this bar
          parked at the end of the card instead of pinned to the screen. It sits above any
          bottom dock (the Structure step's sheet sets --wrs-bottom-dock while it's open). */}
      {showFloating && createPortal(
        <div
          className="md:hidden fixed inset-x-0 z-40 ir-frost border-t border-black/[0.08] flex items-center justify-between gap-3 px-4 pt-3 wrs-mobile-bar-in"
          style={{ bottom: "var(--wrs-bottom-dock, 0px)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <BackButton onClick={onBack}>{backLabel}</BackButton>
          {next}
        </div>,
        document.body,
      )}
    </>
  );
}
