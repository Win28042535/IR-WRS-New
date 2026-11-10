"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BUSINESS_GOALS, QUIZ, RULES, SECTIONS, SECTION_CATEGORY_LABEL, RELATED_SECTIONS, GOAL_SECTIONS, REQUIRED_SECTION_IDS, LEADING_REQUIRED_IDS, TRAILING_REQUIRED_IDS, IR_AUDIENCES, audienceById, directionById, sectionById } from "@/lib/data";
import { photo, bgImage, type ImageRole } from "@/lib/images";
import { rankDirections, buildProfile, profileToDirection, rankProfileDirections } from "@/lib/recommend";
import { StepIndicator, RuleBadge, SectionLabel, SectionDivider, StepNav, NextButton, BackButton, WorkspaceDividerToggle, OptionCard, OptionTag } from "@/components/ui";
import { IconCheck, IconReset, IconClose, IconPlus, IconArrowRight, IconExternalLink, IconGlobe, IconEdit, OPTION_ICONS } from "@/components/icons";
import { ExploreMock } from "@/components/ExploreMock";
import type { DesignProfile, QuizOption } from "@/lib/types";
import AIJourneyGuide from "@/components/AIJourneyGuide";
import { useGuide } from "@/hooks/useGuide";
import { useHesitation } from "@/hooks/useHesitation";
import { ProjectContextProvider } from "@/components/ProjectContextProvider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProjectContext } from "@/hooks/useProjectContext";
import { PreviewPanel, usePreviewPanel } from "@/components/PreviewPanel";
import { AIMascot } from "@/components/AIMascot";
import { useSectionFx } from "@/lib/sectionFx";
import { useFloatingPreview } from "@/lib/floatingPreview";
import { emailError, phoneError, sanitizeEmailInput, sanitizePhoneInput } from "@/lib/validation";

const STEPS    = ["ทำความเข้าใจ", "กำหนดเป้าหมาย", "สำรวจแนวทาง", "วางโครงสร้าง", "เพิ่มเติมแรงบันดาลใจ", "ส่งมอบ"];
const STEPS_EN = ["Understand",   "Define",         "Explore",      "Structure",    "Inspiration",   "Deliver"];

const IR_CATEGORY_ORDER = ["Core", "People", "Investor", "Sustainability", "Engagement"];
// Goals offered in the IR flow — the non-IR ones (lead generation, product launch) stay in
// the data for corporate-site projects but aren't shown here.
const VISIBLE_GOALS = BUSINESS_GOALS.filter((g) => !g.hidden);

const WS_WIDTH_KEY = "wrs_workspace_left_pct";

export default function Flow2() {
  const router = useRouter();
  const { draft, startFlow, updateDraft, submit, addTimelineEntry, addNotebookEntry } = useStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizDone, setQuizDone] = useState(false); // last answer given → show the result screen
  const [answers, setAnswers] = useState<{ axis: keyof DesignProfile; option: QuizOption }[]>([]);
  const [dir, setDir] = useState<"forward" | "backward">("forward");
  const prevStep = useRef(1);
  // leftPct = questionnaire share of the split. Workspace now supports section review +
  // context, not large previews, so its share is capped to ~60% of its old max (70% -> 42%)
  // and defaults noticeably lighter (~32%) so it reads as secondary to the questionnaire.
  const [leftPct, setLeftPct] = useState(68);
  const wsCollapsed = usePreviewPanel((s) => s.wsCollapsed);
  const toggleWsCollapsed = usePreviewPanel((s) => s.toggleWsCollapsed);
  // Below lg there isn't room for a side-by-side split — the workspace becomes a
  // near-full-width overlay with a scrim over the questionnaire instead of a squeezed column.
  const isOverlayWorkspace = !useMediaQuery("(min-width: 1024px)");
  // Below md specifically, the overlay drawer itself is replaced by a bottom sheet — see
  // MobileWorkspaceSheet. Tablet (md–lg) keeps the existing right-side overlay drawer.
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(WS_WIDTH_KEY);
    if (saved) {
      const v = parseFloat(saved);
      if (!isNaN(v)) setLeftPct(Math.max(58, Math.min(75, v)));
    }
    const st = useStore.getState();
    const pid = new URLSearchParams(window.location.search).get("p");
    if (pid) {
      const proj = st.projects.find((p) => p.id === pid);
      if (proj && (!st.draft || st.draft.projectId !== pid)) {
        startFlow("flow2");
        updateDraft({ projectId: pid, company: proj.company, industry: proj.industry, companyType: proj.companyType, projectType: proj.projectType });
        return;
      }
    }
    if (!st.draft || st.draft.flow !== "flow2") {
      startFlow("flow2"); // prefill from memory applied atomically inside startFlow
      return;
    }
    // Resume where the customer left off. Quiz answers live in component state (not the
    // draft), so a draft without a Direction yet resumes at the quiz rather than past it.
    let resume = st.draft.flowStep ?? 1;
    if (resume > 3 && !st.draft.selectedDirection) resume = 3;
    if (resume > 1) {
      prevStep.current = resume;
      setStep(resume);
    }
    // A finished quiz is kept in the draft, so returning to Explore shows its result.
    if (st.draft.quizPicks?.length === QUIZ.length && st.draft.selectedDirection) setQuizDone(true);
  }, [startFlow, updateDraft]);

  // Persist panel width whenever it changes (but not while collapsed)
  useEffect(() => {
    if (!wsCollapsed) localStorage.setItem(WS_WIDTH_KEY, String(leftPct));
  }, [leftPct, wsCollapsed]);

  // Keep the Blueprint panel in sync with current phase (must be before early return)
  useEffect(() => {
    usePreviewPanel.getState().setCurrentStep(step);
  }, [step]);

  // Default the workspace closed until Structure (step 4) — before that there isn't
  // enough selected yet for the preview to be meaningful. Once the customer manually
  // opens/closes it, this stops overriding their choice for the rest of the session.
  useEffect(() => {
    // Before Structure there isn't enough selected for a meaningful preview, so keep it
    // closed. On tablet/mobile the workspace is a full-screen overlay, so it also starts
    // closed there (Structure included) — the user opens it deliberately from the edge tab.
    usePreviewPanel.getState().setWsCollapsedAuto(step < 4 || isOverlayWorkspace);
  }, [step, isOverlayWorkspace]);

  // Every new step or quiz question starts at its heading: jump (not smooth-scroll) the
  // questionnaire back to the top so the old scroll offset never carries over, then move
  // focus to the new card so keyboard and screen-reader users land on it too. Skipped on
  // first load so opening the page doesn't steal focus.
  useEffect(() => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }
    leftPanelRef.current?.scrollTo({ top: 0 });
    stepCardRef.current?.focus({ preventScroll: true });
  }, [step, quizIdx, quizDone]);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    if (wsCollapsed) return;
    e.preventDefault();
    setIsResizing(true);
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(58, Math.min(75, pct)));
    };
    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [wsCollapsed]);

  if (!mounted || !draft) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <AIMascot mood="insight" size={44} />
        <p className="text-[13px] text-ir-t2 mt-1">กำลังเตรียมระบบ...</p>
      </div>
    );
  }

  const go = (n: number) => {
    setDir(n > prevStep.current ? "forward" : "backward");
    prevStep.current = n;
    setStep(n);
    updateDraft({ flowStep: n });
  };

  const panelTransition = isResizing ? "none" : "width 260ms cubic-bezier(0.4, 0, 0.2, 1)";
  // The shared workspace panel is only meaningful during Structure (step 4) — that's the
  // one step where a live preview of the picked sections helps. Every other step owns the
  // full width; step 6 (Deliver) builds its own right sidebar internally.
  const showWorkspace = step === 4;

  const answerQuiz = (option: QuizOption) => {
    const q = QUIZ[quizIdx];
    const updated = [...answers];
    updated[quizIdx] = { axis: q.axis, option };
    setAnswers(updated);
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx(quizIdx + 1);
    } else {
      // Explore complete synthesize the design direction (Blueprint's Direction block)
      const profile = buildProfile(updated);
      const ai = profileToDirection(profile);
      const ranked = rankDirections(draft.industry, draft.companyType, draft.businessGoals);
      const chosen = ai?.direction ?? (ranked[0] ? directionById(ranked[0].id) : undefined);
      const picks = updated.map((a, i) => ({ questionId: QUIZ[i].id, letter: (a.option === QUIZ[i].optionA ? "A" : "B") as "A" | "B" }));
      updateDraft({
        designProfile: profile,
        quizPicks: picks,
        ...(chosen ? {
          selectedDirection: chosen.id,
          directionLabel: chosen.label,
          selectedLayout: chosen.layout,
        } : {}),
      });
      if (chosen) {
        addTimelineEntry?.({
          step: 3, type: "direction",
          decision: chosen.label,
          reasoning: `AI สังเคราะห์แนวทางจาก Design Profile ของคุณ ${chosen.tagline} (${ai?.confidence ?? ""}% match)`,
        });
      }
      setQuizDone(true);
    }
  };

  const retakeQuiz = () => {
    setAnswers([]);
    setQuizIdx(0);
    setQuizDone(false);
  };

  // Switching to another ranked Direction on the result screen
  const chooseDirection = (id: string) => {
    const d = directionById(id);
    if (!d) return;
    updateDraft({ selectedDirection: d.id, directionLabel: d.label, selectedLayout: d.layout });
    addTimelineEntry?.({ step: 3, type: "direction", decision: d.label, reasoning: "ลูกค้าเลือกแนวทางนี้เองจากผลการสำรวจ" });
  };

  return (
    <ProjectContextProvider>
    <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      <GhostFlightLayer />
      <FloatingPreviewToast />
      <StepIndicator steps={STEPS} stepsEn={STEPS_EN} current={step} />

      {/* ── Full-width split workspace ── */}
      <div ref={containerRef} className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── Left: scrollable questionnaire ── */}
        <div
          ref={leftPanelRef}
          className="overflow-y-auto shrink-0"
          style={{
            width: !showWorkspace || isOverlayWorkspace ? "100%" : wsCollapsed ? "100%" : `${leftPct}%`,
            transition: panelTransition,
          }}
        >
          <div className="px-5 lg:px-7 py-6 pb-20">
            {/* Step 6 (Deliver) breaks out of the single questionnaire card into a wider
                two-column layout with its own surfaces — so it isn't a card-in-a-card. */}
            <div className={`mx-auto ${step === 6 ? "max-w-[1320px]" : "max-w-[1000px]"}`}>
              {step === 6 ? (
                <div
                  ref={stepCardRef}
                  tabIndex={-1}
                  className={`outline-none ${dir === "forward" ? "step-enter-forward" : "step-enter-backward"}`}
                  key={`${step}-${quizIdx}`}
                >
                  <S6Deliver go={go} draft={draft} updateDraft={updateDraft} submit={submit} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} router={router} />
                </div>
              ) : (
                <div
                  ref={stepCardRef}
                  tabIndex={-1}
                  className={`outline-none bg-ir-card border border-ir-border rounded-[20px] ir-shadow p-6 md:p-8 ${dir === "forward" ? "step-enter-forward" : "step-enter-backward"}`}
                  key={`${step}-${quizIdx}-${quizDone}`}
                >
                  {step === 1 && <S1 go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} router={router} />}
                  {step === 2 && <S2Define go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} />}
                  {step === 3 && quizDone && <QuizResult draft={draft} onContinue={() => go(4)} onRetake={retakeQuiz} onChoose={chooseDirection} />}
                  {step === 3 && !quizDone && <S2quiz q={QUIZ[quizIdx]} idx={quizIdx} total={QUIZ.length} onAnswer={(opt: QuizOption) => { answerQuiz(opt); }} onBack={() => (quizIdx > 0 ? setQuizIdx(quizIdx - 1) : go(2))} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} quizIdx={quizIdx} />}
                  {step === 4 && <S3 go={go} draft={draft} updateDraft={updateDraft} enterDir={dir} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} />}
                  {step === 5 && <S5DesignBlueprint go={go} draft={draft} updateDraft={updateDraft} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace + divider only exist from Structure (step 4) onward */}
        {showWorkspace && !isOverlayWorkspace && (
          <>
            <WorkspaceDividerToggle
              wsCollapsed={wsCollapsed}
              onDividerMouseDown={onDividerMouseDown}
              toggleWsCollapsed={toggleWsCollapsed}
              panelTransition={panelTransition}
              empty={false}
            />

            {/* ── Right: Living Workspace (Desktop/Laptop — resizable split) ── */}
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: wsCollapsed ? "0%" : `calc(${100 - leftPct}% - 1px)`,
                transition: panelTransition,
              }}
            >
              <div className="h-full p-3">
                <PreviewPanel dominant embedded />
              </div>
            </div>
          </>
        )}

        {/* ── Right: Living Workspace (Tablet — full-height overlay drawer that slides in
            from the right and covers the questionnaire. z sits above the AI guide (z-9999)
            so the scrim dims it too, avoiding the earlier overlap. Mobile uses the bottom
            sheet below instead. ── */}
        {showWorkspace && isOverlayWorkspace && !isMobile && !wsCollapsed && (
          <>
            <div
              className="fixed inset-0 bg-black/45 conf-backdrop-in"
              style={{ zIndex: 10000 }}
              onClick={toggleWsCollapsed}
              aria-hidden="true"
            />
            <div
              className="fixed inset-y-0 right-0 wsdrawer-in"
              style={{ width: "min(92vw, 460px)", zIndex: 10001 }}
              role="dialog"
              aria-label="Living Workspace"
            >
              <PreviewPanel dominant embedded flush />
            </div>
          </>
        )}

        {/* Collapsed-state edge tab to reopen the workspace in overlay mode (tablet only) */}
        {showWorkspace && isOverlayWorkspace && !isMobile && wsCollapsed && (
          <WorkspaceDividerToggle
            wsCollapsed={wsCollapsed}
            onDividerMouseDown={() => {}}
            toggleWsCollapsed={toggleWsCollapsed}
            panelTransition={panelTransition}
            empty={false}
          />
        )}

        {/* ── Right: Living Workspace (Mobile <768px — bottom sheet, not a side panel).
            Never covers the whole screen even at its tallest, and the main form behind it
            is never dimmed/blocked — collapsed is just a slim bar, so context is always
            visible. ── */}
        {showWorkspace && isMobile && (
          <MobileWorkspaceSheet
            wsCollapsed={wsCollapsed}
            setWsCollapsed={(v: boolean) => usePreviewPanel.getState().setWsCollapsed(v)}
            sectionCount={draft.selectedSections?.length ?? 0}
          />
        )}

      </div>
    </div>
    </ProjectContextProvider>
  );
}

function Head({ n: _n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    // Mobile trims a bit of the dead space above the fold (mb-4 pb-4 vs the desktop mb-5
    // pb-5) — small on its own, but it stacks with the card's own padding and every
    // section's spacing, and mobile has the least vertical room to spare.
    // No rule line under the title — the heading's own size/weight already separates it
    // from the body below at a glance, so a border here was reinforcing something
    // typography had already established, not adding a distinction of its own.
    <div className="mb-4 pb-4 md:mb-5 md:pb-5">
      <h2 className="text-[24px] font-semibold text-ir-t1 tracking-tight leading-tight" style={{ textWrap: "balance" } as CSSProperties}>{title}</h2>
      {sub && <p className="text-[16px] text-ir-t2 leading-relaxed mt-2">{sub}</p>}
    </div>
  );
}

// ── AI inference helpers keyword-based fallback for industry + company type ──
function inferIndustry(company: string, website: string): string {
  const t = `${company} ${website}`.toLowerCase();
  if (/bank|finance|capital|asset|fund|invest|insurance|leasing|หลักทรัพย์|ธนาคาร/.test(t)) return "Finance & Banking";
  if (/energy|power|electric|solar|wind|oil|gas|petroleum|ptt|coal|พลังงาน/.test(t)) return "Energy & Power";
  if (/hospital|clinic|pharma|health|medical|drug|medicine|โรงพยาบาล/.test(t)) return "Healthcare & Pharma";
  if (/real.?estate|property|land|condo|realty|developer|อสังหา/.test(t)) return "Real Estate & Property";
  if (/tech|software|digital|data|cloud|system|solution|computer|เทคโนโลยี/.test(t)) return "Technology & Digital";
  if (/retail|consumer|food|restaurant|fashion|beauty|lifestyle|ค้าปลีก/.test(t)) return "Consumer & Retail";
  if (/manufactur|industrial|factory|production|engineer|material|อุตสาหกรรม/.test(t)) return "Industrial & Manufacturing";
  if (/esg|sustain|green|environment|carbon|climate|ยั่งยืน/.test(t)) return "ESG & Sustainability";
  if (/government|ministry|กระทรวง|หน่วยงาน|municipal|รัฐ/.test(t)) return "Government & Public Sector";
  return "Listed Company (SET)";
}

function inferCompanyType(company: string): string {
  const t = company.toLowerCase();
  if (/มหาชน|public|plc|pcl/.test(t)) return "Public Company (Listed / SET)";
  if (/holding/.test(t)) return "Holding Company";
  if (/venture|startup/.test(t)) return "Startup";
  if (/non.?profit|foundation|มูลนิธิ/.test(t)) return "Non-profit / Foundation";
  if (/government|กระทรวง|หน่วยงาน/.test(t)) return "Government / State Enterprise";
  if (/จำกัด|limited|ltd/.test(t) && !/มหาชน/.test(t)) return "Private Company";
  return "Public Company (Listed / SET)";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── S1 · Understand company context + audience ──
function S1({ go, draft, updateDraft, addTimelineEntry, addNotebookEntry, router }: any) {
  // Audience: one flat multi-select — no forced "pick primary first" step.
  // Whichever audience is picked first is still kept as primaryAudience
  // behind the scenes (all the AI tone/priority/density logic downstream
  // reads a single "main" audience), and later picks land in
  // secondaryAudiences. Removing a card promotes the next selected one so
  // primaryAudience is only ever empty when nothing is selected at all.
  const selectedAudiences: string[] = [draft.primaryAudience, ...(draft.secondaryAudiences ?? [])].filter(Boolean);
  // Read the live draft from the store, not this render's `draft` — taps that land before
  // a re-render would otherwise each see the same stale state and overwrite one another.
  const toggleAudience = (id: string) => {
    const d = useStore.getState().draft ?? draft;
    const cur = d.secondaryAudiences ?? [];
    if (d.primaryAudience === id) {
      const [next, ...rest] = cur;
      updateDraft({ primaryAudience: next ?? "", secondaryAudiences: rest });
    } else if (cur.includes(id)) {
      updateDraft({ secondaryAudiences: cur.filter((a: string) => a !== id) });
    } else if (!d.primaryAudience) {
      updateDraft({ primaryAudience: id });
    } else {
      updateDraft({ secondaryAudiences: [...cur, id] });
    }
  };
  // Promote an already-picked audience to primary; the old primary becomes the first
  // secondary so nothing else in the order shifts.
  const makePrimary = (id: string) => {
    const d = useStore.getState().draft ?? draft;
    const rest = (d.secondaryAudiences ?? []).filter((a: string) => a !== id);
    updateDraft({ primaryAudience: id, secondaryAudiences: d.primaryAudience ? [d.primaryAudience, ...rest] : rest });
  };
  const ok = !!(draft.company.trim() && draft.projectType && draft.primaryAudience);

  // Auto-select IR as the only website type
  useEffect(() => {
    if (draft.projectType !== "Investor Relations Site") {
      updateDraft({ projectType: "Investor Relations Site" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-infer industry + company type from company name/website after a short settle
  const inferTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!draft.company.trim()) return;
    clearTimeout(inferTimerRef.current);
    inferTimerRef.current = setTimeout(() => {
      if (!draft.industry) updateDraft({ industry: inferIndustry(draft.company, draft.website ?? "") });
      if (!draft.companyType) updateDraft({ companyType: inferCompanyType(draft.company) });
    }, 1000);
    return () => clearTimeout(inferTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.company, draft.website]);

  const g = useGuide("strategy");
  const { memory } = useProjectContext();
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; });

  // First visit show once on mount, then chain prefillNotice if fields were auto-filled
  const t2Ref = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const t = setTimeout(() => {
      const d = draftRef.current;
      if (memory.hasMemory) {
        g.show(memory.messages.welcomeBack, { mode: "insight", expert: "strategy", autohide: 8000 });
        if (memory.prefillCount > 0) {
          // chain: show prefillNotice after welcomeBack autohides
          t2Ref.current = setTimeout(() => {
            g.show(memory.messages.prefillNotice, { mode: "tip", expert: "strategy", autohide: 10000 });
          }, 9200);
        }
      } else if (!d.company.trim()) {
        g.show("สวัสดีครับ ยินดีต้อนรับ เดี๋ยวเราช่วยกันสร้าง Direction ที่เหมาะกับองค์กรจริงๆ เริ่มจากชื่อก่อนเลยนะครับ", { mode: "tip", expert: "strategy", autohide: 9000 });
      }
    }, 1200);
    return () => { clearTimeout(t); clearTimeout(t2Ref.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Long hesitation fires once per step visit after 15 s of inactivity
  const shownHesitation = useRef(false);
  useHesitation(15000, () => {
    if (shownHesitation.current) return;
    shownHesitation.current = true;
    const d = draftRef.current;
    if (!d.company.trim())
      g.show("ไม่ต้องเป็นทางการครับ ชื่อย่อหรือชื่อเต็มก็ได้เลย แก้ทีหลังได้เสมอครับ", { mode: "tip", expert: "strategy", autohide: 10000 });
    else if (!d.projectType)
      g.show("เลือก Website Type ด้วยนะครับ กำหนดว่าเว็บนี้ทำงานเพื่ออะไรครับ", { mode: "tip", expert: "strategy", autohide: 10000 });
    else if (d.businessGoals.length < RULES.goals.min)
      g.show("เกือบแล้วครับ เพิ่ม Business Goals อีก 1-2 อย่าง แล้วเราไป Quiz กันได้เลย", { mode: "tip", expert: "strategy", autohide: 10000 });
    else
      g.show("เยี่ยมครับ ข้อมูลครบทุกอย่างแล้ว ไป Smart Quiz กันได้เลยครับ", { mode: "celebrate", expert: "analyst", autohide: 7000 });
  });

  // ── Timeline entries ────────────────────────────────────────────
  const companyTlFired = useRef(false);
  useEffect(() => {
    if (!draft.company.trim() || companyTlFired.current) return;
    companyTlFired.current = true;
    const t = setTimeout(() => {
      addTimelineEntry({
        step: 1, type: "company",
        decision: draft.company,
        reasoning: `ชื่อองค์กรใช้สร้าง Preview เว็บไซต์และปรับ AI Recommendation ให้ตรงกับแบรนด์ของคุณ`,
      });
    }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.company]);

  useEffect(() => {
    if (!draft.industry) return;
    const industryLabel = draft.industry;
    addTimelineEntry({
      step: 1, type: "industry",
      decision: industryLabel,
      reasoning: `Industry กำหนด Content จริง ภาพ Hero และ Direction ที่เหมาะสม ${
        industryLabel.includes("Energy") ? "พลังงานมักต้องการ Layout ที่หนักแน่น น่าเชื่อถือ" :
        industryLabel.includes("Finance") ? "การเงินต้องการความชัดเจนของตัวเลขและความน่าเชื่อถือ" :
        industryLabel.includes("ESG") ? "ESG เน้น Storytelling และ Impact ที่จับต้องได้" :
        "เลือก Industry ช่วยให้ AI แนะนำ Direction และ Content ได้แม่นยำขึ้น"
      }`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.industry]);

  // Audience → timeline
  useEffect(() => {
    if (!draft.primaryAudience) return;
    const aud = audienceById(draft.primaryAudience);
    if (!aud) return;
    addTimelineEntry({
      step: 1, type: "goal",
      decision: `กลุ่มเป้าหมายหลัก: ${aud.label}`,
      reasoning: `กลุ่มเป้าหมายกำหนดโทน ความหนาแน่นของข้อมูล และลำดับความสำคัญของ Section ${aud.shapes}`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.primaryAudience]);

  // ── Notebook auto-capture ────────────────────────────────────────
  const nbCompanyFired = useRef(false);
  useEffect(() => {
    if (!draft.company.trim() || nbCompanyFired.current) return;
    nbCompanyFired.current = true;
    const t = setTimeout(() => {
      addNotebookEntry?.({
        step: 1, category: "insight", source: "ai",
        title: `องค์กร: ${draft.company}`,
        body: `AI ตรวจจับชื่อองค์กร "${draft.company}" เพื่อใช้ปรับ Preview เว็บไซต์และ Recommendation ให้ตรงกับ Brand ขององค์กรโดยตรง`,
        tags: ["company", "brand"],
      });
    }, 1800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.company]);

  useEffect(() => {
    if (!draft.industry) return;
    const isFinance = draft.industry.includes("Finance");
    const isESG = draft.industry.includes("ESG");
    const isListed = draft.industry.includes("Listed") || draft.industry.includes("SET");
    addNotebookEntry?.({
      step: 1, category: "insight", source: "ai",
      title: `อุตสาหกรรม: ${draft.industry}`,
      body: isFinance
        ? "ธุรกิจการเงินต้องการ Layout ที่สื่อความน่าเชื่อถือ ควรเน้น Data clarity, Conservative palette, และ Compliance section"
        : isESG
        ? "ESG ต้องการ Storytelling เป็นหลัก ภาพ Impact, Metrics ที่จับต้องได้, และ Sustainability Report section"
        : isListed
        ? "บริษัทจดทะเบียนต้องการ IR Section ครบ Annual Report, Financial Highlights, Investor Contact"
        : `${draft.industry} AI จะวิเคราะห์ Direction และ Content Structure ที่เหมาะสมกับอุตสาหกรรมนี้`,
      tags: [draft.industry, "industry-context"],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.industry]);

  // Audience → notebook insight (how it shapes the design)
  useEffect(() => {
    if (!draft.primaryAudience) return;
    const aud = audienceById(draft.primaryAudience);
    if (!aud) return;
    addNotebookEntry?.({
      step: 1, category: "insight", source: "ai",
      title: `กลุ่มเป้าหมาย: ${aud.label}`,
      body: `${aud.desc} ${aud.shapes} Blueprint จะจัดลำดับ Section ที่กลุ่มนี้ให้ความสำคัญขึ้นก่อน`,
      tags: ["audience", aud.id],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.primaryAudience]);

  return (
    <>
      <Head n={1} title="ทำความเข้าใจ" sub="เริ่มจากทำความเข้าใจองค์กรของคุณ และกลุ่มเป้าหมายที่เว็บไซต์ IR ต้องสื่อสารด้วย" />

      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      {/* Company identity grouped */}
      <div className="mb-0 space-y-4">
        <div>
          <SectionLabel>ชื่อบริษัท / องค์กร <span className="text-red-500 font-normal">*</span></SectionLabel>
          <input
            aria-label="ชื่อบริษัท / องค์กร"
            value={draft.company}
            onChange={(e) => updateDraft({ company: e.target.value })}
            placeholder="เช่น บริษัท ABC จำกัด (มหาชน)"
            className="w-full border border-ir-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-ir-accent mt-2 transition-colors"
          />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <SectionLabel>เว็บไซต์ปัจจุบัน</SectionLabel>
            <span className="text-[11px] text-ir-t3">(ไม่บังคับ)</span>
          </div>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ir-t3 text-base select-none">🌐</span>
            <input
              aria-label="เว็บไซต์ปัจจุบัน"
              value={draft.website ?? ""}
              onChange={(e) => updateDraft({ website: e.target.value })}
              placeholder="https://www.irplus.in.th"
              className="w-full border border-ir-border rounded-xl pl-10 pr-4 py-3 text-[14px] outline-none focus:border-ir-accent transition-colors"
            />
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* Audience who the IR site speaks to — one flat multi-select, every
          card behaves the same way so nothing has to be picked "first" */}
      <div>
        <SectionLabel>กลุ่มเป้าหมาย <span className="text-red-500 font-normal">*</span></SectionLabel>
        <p className="text-[14px] text-ir-t3 mb-3 mt-1">เว็บไซต์ IR สื่อสารกับใครบ้าง? เลือกได้หลายกลุ่ม กลุ่มแรกที่เลือกคือกลุ่มเป้าหมายหลัก ซึ่ง AI จะใช้กำหนดโครงสร้าง เนื้อหา และการออกแบบเป็นอันดับแรก</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {IR_AUDIENCES.map((aud) => {
            const rank = selectedAudiences.indexOf(aud.id) + 1;
            return (
              <OptionCard
                key={aud.id}
                icon={OPTION_ICONS[aud.id]}
                title={aud.label}
                desc={aud.desc}
                selected={rank > 0}
                rank={rank || undefined}
                onSelect={() => toggleAudience(aud.id)}
                tag={rank === 1 ? <OptionTag>กลุ่มเป้าหมายหลัก</OptionTag> : undefined}
                aside={rank > 1 ? (
                  <button
                    type="button"
                    onClick={() => makePrimary(aud.id)}
                    className="text-[12px] font-medium text-ir-accent-text px-2.5 py-1.5 rounded-full hover:bg-ir-accent-soft transition-colors whitespace-nowrap"
                  >
                    ตั้งเป็นกลุ่มหลัก
                  </button>
                ) : undefined}
              />
            );
          })}
        </div>
      </div>

      <SectionDivider />

      {/* Corporate identity — whether existing brand guidelines should anchor the design */}
      <div>
        <div className="flex items-baseline gap-2">
          <SectionLabel>Corporate Identity (CI)</SectionLabel>
          <span className="text-[11px] text-ir-t3">(ไม่บังคับ)</span>
        </div>
        <p className="text-[14px] text-ir-t3 mb-3 mt-1">บริษัทมี CI เดิม (เว็บไซต์ โลโก้ หรือแนวทางแบรนด์) ที่ต้องการให้ AI ใช้อ้างอิงตอนออกแบบหรือไม่?</p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {([
            { id: "yes", label: "มี ต้องการใช้อ้างอิง", desc: "AI จะยึดสี โลโก้ และแนวทางแบรนด์เดิมเป็นฐานในการออกแบบ" },
            { id: "no", label: "ไม่มี", desc: "AI จะแนะนำ Direction และโทนสีให้ใหม่ทั้งหมดตามข้อมูลที่กรอก" },
          ] as const).map((opt) => (
            <OptionCard
              key={opt.id}
              icon={OPTION_ICONS[`ci-${opt.id}`]}
              title={opt.label}
              desc={opt.desc}
              selected={draft.hasCorporateIdentity === opt.id}
              onSelect={() => updateDraft({ hasCorporateIdentity: draft.hasCorporateIdentity === opt.id ? "" : opt.id })}
            />
          ))}
        </div>
      </div>

      {/* Missing info clicking Next when form is incomplete shows specific guide */}
      <StepNav onBack={() => router.push("/")} backLabel="หน้าหลัก" next={
        <div onClick={() => {
          if (ok) return;
          if (!draft.company.trim()) g.show("ใส่ชื่อองค์กรก่อนนะครับ ชื่อย่อก็ได้เลยครับ", { mode: "tip" });
          else g.show("เลือกกลุ่มเป้าหมายอย่างน้อย 1 กลุ่มด้วยนะครับ ช่วยให้ AI ปรับโทนและข้อมูลให้ตรงกลุ่มผู้อ่านจริงครับ", { mode: "tip" });
        }}>
          <NextButton onClick={() => go(2)} disabled={!ok}>ถัดไป</NextButton>
        </div>
      } />
    </>
  );
}

// ── S2 · Define objectives (what the IR site must achieve) ──
const GOALS_COLLAPSE_AT = 6;

function S2Define({ go, draft, updateDraft, addTimelineEntry, addNotebookEntry }: any) {
  const g = useGuide("strategy");
  const { memory } = useProjectContext();
  // Mobile-only progressive disclosure — 10 goal cards is a long stack on a single mobile
  // column. Show the first 6 and a "show more" affordance; if a previously-chosen goal
  // lives past that cutoff (e.g. returning to this step with a saved draft), reveal
  // everything automatically so a selection is never hidden from the user.
  const [showAllGoals, setShowAllGoals] = useState(false);
  const hasHiddenSelection = VISIBLE_GOALS.slice(GOALS_COLLAPSE_AT).some((bg: any) => draft.businessGoals.includes(bg.id));
  const goalsExpanded = showAllGoals || hasHiddenSelection;
  // Collapsing is only offered when it wouldn't hide a goal the user already picked.
  const canCollapseGoals = showAllGoals && !hasHiddenSelection;

  // Live store read — see toggleAudience.
  const toggleGoal = (id: string) => {
    const goals: string[] = (useStore.getState().draft ?? draft).businessGoals;
    if (goals.includes(id)) updateDraft({ businessGoals: goals.filter((x: string) => x !== id) });
    else if (goals.length < RULES.goals.max)
      updateDraft({ businessGoals: [...goals, id] });
  };
  const ok = draft.businessGoals.length >= RULES.goals.min;

  // Objectives → timeline
  useEffect(() => {
    if (draft.businessGoals.length === 0) return;
    const goalDefs = BUSINESS_GOALS.filter((bg: any) => draft.businessGoals.includes(bg.id));
    const hasIR = draft.businessGoals.some((x: string) => x.startsWith("ir"));
    addTimelineEntry?.({
      step: 2, type: "goal",
      decision: goalDefs.map((bg: any) => bg.label).join(", "),
      reasoning: hasIR
        ? `IR Objective ตรวจพบ Blueprint จะเน้น Section งานนักลงทุนสัมพันธ์และ Direction ที่น่าเชื่อถือ`
        : `เป้าหมายเหล่านี้กำหนด Direction และ Section ที่ AI แนะนำ ยิ่งชัดยิ่งแม่นยำ`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.businessGoals.length]);

  // Objectives → notebook recommendation
  useEffect(() => {
    if (draft.businessGoals.length === 0) return;
    const goalDefs = BUSINESS_GOALS.filter((bg: any) => draft.businessGoals.includes(bg.id));
    const hasIR = draft.businessGoals.some((x: string) => x.startsWith("ir"));
    const hasESG = draft.businessGoals.includes("esg");
    addNotebookEntry?.({
      step: 2, category: "recommendation", source: "ai",
      title: hasIR ? "แนะนำ: IR Section หลัก" : hasESG ? "แนะนำ: Sustainability Section" : "แนะนำ: Section ตามเป้าหมาย",
      body: hasIR
        ? "เป้าหมาย IR Blueprint ควรมี Financial Highlights, Stock, Annual Reports และ IR Contact"
        : hasESG
        ? "เป้าหมาย ESG ควรมี ESG Overview, Sustainability Report และ CSR"
        : `เป้าหมาย: ${goalDefs.map((x: any) => x.label).join(", ")} AI จะแนะนำ Section และ Direction ที่ตอบเป้าหมายเหล่านี้`,
      tags: [...draft.businessGoals, "objectives"],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.businessGoals.length]);

  return (
    <>
      <Head n={2} title="กำหนดเป้าหมาย" sub="เว็บไซต์ IR นี้ควรตอบโจทย์อะไรบ้าง?" />
      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      <div>
        <SectionLabel badge={<RuleBadge ruleKey="goals" count={draft.businessGoals.length} />}>เป้าหมายหลัก</SectionLabel>
        <div className="grid md:grid-cols-2 gap-2.5 mt-2">
          {VISIBLE_GOALS.map((goal, i) => {
            const sel = draft.businessGoals.includes(goal.id);
            const memFreq = memory.frequentGoals.find((f) => f.value === goal.id);
            const hiddenOnMobile = i >= GOALS_COLLAPSE_AT && !goalsExpanded;
            return (
              <OptionCard
                key={goal.id}
                className={hiddenOnMobile ? "hidden md:flex" : ""}
                icon={OPTION_ICONS[goal.id]}
                title={goal.label}
                desc={goal.desc}
                selected={sel}
                onSelect={() => toggleGoal(goal.id)}
                tag={memFreq && !sel ? <OptionTag>เคยเลือกบ่อย</OptionTag> : undefined}
              />
            );
          })}
        </div>
        {/* Expand/collapse toggle — stays in place after expanding (rather than vanishing,
            which read as "something disappeared") so the disclosure is reversible. Hidden
            only when collapsing would hide an already-selected goal, since a selection must
            never end up out of sight. */}
        {VISIBLE_GOALS.length > GOALS_COLLAPSE_AT && (!goalsExpanded || canCollapseGoals) && (
          <button
            type="button"
            onClick={() => setShowAllGoals((v) => !v)}
            aria-expanded={goalsExpanded}
            className="md:hidden mt-2.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-ir-border text-[13px] font-medium text-ir-t2 active:bg-ir-hover"
          >
            {goalsExpanded ? "ย่อรายการ" : `ดูเป้าหมายเพิ่มเติมอีก ${VISIBLE_GOALS.length - GOALS_COLLAPSE_AT} รายการ`}
            <svg
              width="24" height="24" viewBox="0 0 12 12" fill="none"
              className={`shrink-0 transition-transform duration-200 ${goalsExpanded ? "rotate-180" : ""}`}
            >
              <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <StepNav onBack={() => go(1)} next={
        <div onClick={() => {
          if (ok) return;
          g.show(`เลือกเป้าหมายอีก ${RULES.goals.min - draft.businessGoals.length} อย่างก็ไป Explore กันได้เลยครับ`, { mode: "tip", expert: "strategy" });
        }}>
          <NextButton onClick={() => go(3)} disabled={!ok}>ถัดไป</NextButton>
        </div>
      } />
    </>
  );
}

// Website mock at the top of each quiz card — a flat illustration (ExploreMock) of the
// choice, so the pair can be told apart at a glance.
function QuizVisual({ mock, letter }: { mock: string; letter: string }) {
  return (
    // 16:9 inset frame. Height comes from the padding-box ratio (56.42% = 677/1200) rather
    // than `aspect-ratio`, which some mobile WebViews don't lock in.
    <div className="relative overflow-hidden rounded-[10px] sm:rounded-[14px] border border-ir-border select-none" style={{ paddingTop: "56.42%" }}>
      <div className="absolute inset-0"><ExploreMock id={mock} /></div>
      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 grid place-items-center w-7 h-7 rounded-full bg-ir-dark/75 text-white text-[12px] font-bold backdrop-blur-sm" aria-hidden="true">
        {letter}
      </span>
    </div>
  );
}

// ── S2 Smart Discovery Quiz (A/B) ──
function S2quiz({ q, idx, total, onAnswer, onBack, addTimelineEntry, addNotebookEntry, quizIdx }: any) {
  const opts: [QuizOption, string][] = [[q.optionA, "A"], [q.optionB, "B"]];
  const [pending, setPending] = useState<string | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectOption = (o: QuizOption, letter: string) => {
    if (pending) return;
    setPending(letter);
    if (idx === total - 1) {
      addTimelineEntry?.({
        step: 2, type: "quiz",
        decision: o.label,
        reasoning: `Design Profile สร้างจาก ${total} คำถาม สไตล์ "${o.label}" บน ${q.question.replace("?", "")} ช่วย AI เลือก Direction ที่ตรง Visual Identity ขององค์กร`,
      });
      addNotebookEntry?.({
        step: 2, category: "reasoning", source: "ai",
        title: `Design Profile: ${o.label}`,
        body: `Quiz ${total} ข้อเสร็จสิ้น Design Profile ของคุณเน้น "${o.label}" AI จะใช้ข้อมูลนี้กรองและเรียง Direction ที่ตรง Visual Identity ขององค์กรมากที่สุด`,
        tags: ["design-profile", "quiz", o.label.toLowerCase().replace(/\s+/g, "-")],
      });
    }
    pendingTimer.current = setTimeout(() => {
      setPending(null);
      onAnswer(o);
    }, 220);
  };

  useEffect(() => () => clearTimeout(pendingTimer.current), []);

  const g = useGuide("design");

  // Long hesitation fires once if user stalls on a question
  const shownHesitation = useRef(false);
  useHesitation(15000, () => {
    if (shownHesitation.current) return;
    shownHesitation.current = true;
    g.show("ตอบตาม Feeling ได้เลยครับ ไม่มีคำตอบผิด AI เราไม่ตัดสินคนจากสีโปรดครับ", {
      mode: "tip",
      expert: "design",
      actions: { explain: "Quiz สร้าง Design Profile จากสไตล์ที่คุณชอบ ตอบตาม Brand ขององค์กรได้เลย" },
      autohide: 10000,
    });
  });

  return (
    <>
      <AIJourneyGuide
        visible={g.visible}
        message={g.message}
        mode={g.mode}
        actions={g.actions}
        expert={g.expert}
        className="mb-5"
      />
      {/* Question counter — segmented like the step bar above, one segment per question */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < idx ? "bg-ir-accent" : i === idx ? "bg-ir-dark" : "bg-ir-border"}`} />
          ))}
        </div>
        <span className="font-mono text-[12px] text-ir-t3 shrink-0 tabular-nums">ข้อ {idx + 1}/{total}</span>
      </div>
      <p className="text-center text-[13px] font-semibold text-ir-accent-text">{String(idx + 1).padStart(2, "0")} — {q.topic}</p>
      <p className="text-center text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-ir-t1 mt-1.5 mb-6 leading-snug" style={{ textWrap: "balance" } as CSSProperties}>{q.question}</p>
      {/* Always two-up, even on phones, so A and B are compared side by side — stacking
          them pushed B below the fold and biased answers toward A. */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {opts.map(([o, letter]) => (
          <button key={letter} onClick={() => selectOption(o, letter)} disabled={!!pending}
            aria-label={`ตัวเลือก ${letter}: ${o.label} — ${o.desc}`}
            className={[
              "rounded-[16px] sm:rounded-[20px] border bg-ir-card p-1.5 sm:p-2.5 text-left select-none transition-[border-color,box-shadow,opacity,transform] duration-200",
              pending === letter
                ? "wrs-quiz-selected border-ir-select"
                : pending
                ? "border-ir-border opacity-50 cursor-default"
                : "border-ir-border hover:border-ir-select-soft hover:shadow-[0_8px_24px_rgba(20,22,19,0.06)] active:scale-[0.99]",
            ].join(" ")}>
            <QuizVisual mock={o.mock} letter={letter} />
            <div className="px-1.5 sm:px-2 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2">
              <div className="text-[14px] sm:text-[16px] font-semibold text-ir-t1 leading-snug">{o.label}</div>
              <div className="text-[13px] sm:text-[14px] text-ir-t3 mt-0.5 leading-snug">{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <BackButton onClick={onBack}>ย้อนกลับ</BackButton>
      </div>
    </>
  );
}

// ── Explore result — what the quiz concluded and why ──
// Shown after the last answer instead of jumping straight to Structure: the matched
// Direction with its % and palette, the five picks that led there, and the other three
// Directions ranked so the customer can switch if another one fits better. Everything is
// read back from the draft (designProfile + quizPicks), so it survives a reload.
function QuizResult({ draft, onContinue, onRetake, onChoose }: { draft: any; onContinue: () => void; onRetake: () => void; onChoose: (id: string) => void }) {
  const ranked = draft.designProfile ? rankProfileDirections(draft.designProfile) : [];
  const current = ranked.find((r) => r.direction.id === draft.selectedDirection) ?? ranked[0];
  if (!current) return null;
  const d = current.direction;
  const isTop = current === ranked[0];
  const picks: { questionId: string; letter: "A" | "B" }[] = draft.quizPicks ?? [];

  return (
    <>
      <div className="text-center">
        <span className="text-[14px] font-semibold text-ir-accent-text">ผลการสำรวจ</span>
        <h2 className="mt-2 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-ir-t1" style={{ textWrap: "balance" } as CSSProperties}>
          {isTop ? "แนวทางที่ใกล้กับองค์กรคุณที่สุด" : "แนวทางที่คุณเลือก"}
        </h2>
      </div>

      {/* Matched Direction — drenched in its own gradient */}
      <div className="mt-6 rounded-[24px] p-6 sm:p-8 text-white" style={{ background: d.bg }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-white/75">Design Direction</p>
            <p className="mt-1 text-[30px] sm:text-[36px] font-semibold leading-tight tracking-[-0.03em] text-white">{d.label}</p>
            <p className="mt-1 text-[16px] text-white/85">{d.tagline}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3.5 py-1.5 font-mono text-[14px] font-bold text-white backdrop-blur-sm">
            {current.confidence}% match
          </span>
        </div>
        <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-white/85">{d.desc}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              {d.colors.map((c: string) => <span key={c} className="w-7 h-7 rounded-full ring-1 ring-white/30" style={{ background: c }} />)}
            </div>
            <span className="text-[14px] text-white/85">{d.palette}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {d.mood.map((m: string) => (
              <span key={m} className="rounded-full border border-white/25 px-3 py-1 text-[13px] text-white/90">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Why — the five picks, each with the photo that was chosen */}
      {picks.length > 0 && (
        <div className="mt-8">
          <p className="text-[16px] font-semibold text-ir-t1">มาจากคำตอบของคุณ</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {picks.map((p, i) => {
              const q = QUIZ.find((x) => x.id === p.questionId);
              if (!q) return null;
              const o = p.letter === "A" ? q.optionA : q.optionB;
              return (
                <li key={p.questionId} className="flex lg:flex-col gap-3 rounded-[16px] border border-ir-border bg-ir-card p-2">
                  {/* Outer box fixes the width; the inner padding ratio is a % of that width */}
                  <div className="w-24 lg:w-full shrink-0">
                    <div className="relative overflow-hidden rounded-[10px] border border-ir-border" style={{ paddingTop: "56.42%" }}>
                      <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
                    </div>
                  </div>
                  <div className="min-w-0 py-1 lg:px-1">
                    <p className="text-[12px] text-ir-t3 truncate">ข้อ {i + 1} · {q.topic}</p>
                    <p className="text-[14px] font-semibold leading-snug text-ir-t1">{o.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Other Directions — ranked, switchable */}
      <div className="mt-8">
        <p className="text-[16px] font-semibold text-ir-t1">แนวทางอื่นที่ใกล้เคียง</p>
        <p className="mt-1 text-[14px] text-ir-t3">ถ้าแนวทางอื่นตรงกับองค์กรมากกว่า เลือกแทนได้เลย</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {ranked.filter((r) => r.direction.id !== d.id).map((r) => (
            <OptionCard
              key={r.direction.id}
              title={r.direction.label}
              desc={r.direction.tagline}
              selected={false}
              onSelect={() => onChoose(r.direction.id)}
              aside={<span className="font-mono text-[13px] font-semibold text-ir-t2">{r.confidence}%</span>}
              tag={
                <>
                  <span className="mt-2 flex gap-1" aria-hidden="true">
                    {r.direction.colors.map((c: string) => <span key={c} className="w-4 h-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />)}
                  </span>
                  {r === ranked[0] && <OptionTag>ตรงกับคำตอบที่สุด</OptionTag>}
                </>
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5">
        <BackButton onClick={onRetake}>ทำ Quiz ใหม่</BackButton>
        <NextButton onClick={onContinue}>ไปวางโครงสร้าง</NextButton>
      </div>
    </>
  );
}

// Watches useSectionFx's `flight` state and plays the "flying card" feedback in both
// directions:
//  - add:    a ghost clones the picked section from its source card and travels to its new
//            row (which stays hidden — see `pendingIds` — until the ghost "becomes" it).
//  - remove: a ghost clones the outgoing row and travels back to the picker card it came
//            from, so removing a section reads as it physically returning, not just vanishing.
// The card/row underneath never moves itself — only the ghost layer travels. If the
// destination is unreachable (workspace collapsed, drawer closed) or the user prefers
// reduced motion, the flight is skipped and state resolves immediately instead.
function GhostFlightLayer() {
  const flight = useSectionFx((s) => s.flight);
  const land = useSectionFx((s) => s.land);

  useEffect(() => {
    if (!flight) return;
    const { id, direction, fromRect, toRect } = flight;

    const landAndClear = () => {
      land(id);
      setTimeout(() => useSectionFx.getState().clearLanded(id), 480);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      landAndClear();
      return;
    }

    const s = sectionById(id);
    let cancelled = false;
    let attempts = 0;

    const flyGhost = (destRect: DOMRect) => {
      if (cancelled) return;
      const ghost = document.createElement("div");
      ghost.className = "wrs-ghost-card";
      ghost.style.left = `${fromRect.left}px`;
      ghost.style.top = `${fromRect.top}px`;
      ghost.style.width = `${fromRect.width}px`;
      ghost.style.height = `${fromRect.height}px`;
      const icon = document.createElement("span");
      icon.className = "wrs-ghost-icon";
      icon.textContent = s?.icon ?? "";
      const name = document.createElement("span");
      name.className = "wrs-ghost-name";
      name.textContent = s?.name ?? id;
      ghost.append(icon, name);
      document.body.appendChild(ghost);

      const dx = destRect.left - fromRect.left;
      const dy = destRect.top - fromRect.top;
      // Travels at full strength for most of the trip, a soft overshoot near the end, then
      // settles + dissolves right at arrival — reads as "becoming" the item there rather
      // than shrinking away mid-flight.
      const anim = ghost.animate(
        [
          { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.65}px, ${dy * 0.65}px) scale(1.04)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.92)`, opacity: 0 },
        ],
        { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
      anim.onfinish = () => {
        ghost.remove();
        landAndClear();
      };
    };

    if (direction === "remove") {
      // Destination (the picker card) is already on screen and never moves — no polling needed.
      if (toRect) flyGhost(toRect); else landAndClear();
      return () => { cancelled = true; };
    }

    // direction === "add" — destination row doesn't exist yet; wait a few frames for it to mount.
    const tryFly = () => {
      if (cancelled) return;
      const target = document.querySelector<HTMLElement>(`[data-section-row="${id}"]`);
      if (!target) {
        if (attempts < 8) { attempts++; requestAnimationFrame(tryFly); return; }
        landAndClear(); // workspace row never appeared (panel closed/collapsed) — skip the flight
        return;
      }
      flyGhost(target.getBoundingClientRect());
    };
    tryFly();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight]);

  return null;
}

// Floating preview — a small visual (icon/swatch/thumbnail) + label that confirms an action
// right where the user already is, so they never need to scroll or open the
// (collapsed-by-default) workspace sheet just to see that something happened. Used at every
// width: being fixed-position, it costs no layout space, so no step has to reserve an empty
// band for a message that is only on screen for ~2s. Vertical offset is handled by
// `.wrs-floating-preview-pos` — high on mobile to clear the sticky action bar and the
// collapsed workspace handle, tucked near the edge on desktop where neither exists.
function FloatingPreviewToast() {
  const preview = useFloatingPreview((s) => s.preview);
  if (!preview) return null;
  return (
    <div className="wrs-floating-preview-pos fixed inset-x-0 z-[10002] flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-ir-dark text-white shadow-[0_8px_24px_rgba(6,7,15,0.35)] ${
          preview.leaving ? "wrs-floating-preview-out" : "wrs-floating-preview-in"
        }`}
      >
        <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-white/10 text-[13px]">
          {preview.swatch}
        </span>
        <span className="text-[12.5px] font-medium leading-tight">
          {preview.label}
          {preview.sub && <span className="text-white/50 font-normal"> · {preview.sub}</span>}
        </span>
      </div>
    </div>
  );
}

// Mobile (<768px) Living Workspace — a draggable bottom sheet instead of a side panel/drawer.
// Three heights: collapsed (a slim always-visible bar — tap or drag up opens it), half (~50vh,
// enough to preview the structure list while the form above stays reachable), and expanded
// (~85vh — deliberately short of full-screen so the page header stays peeking above it, per
// "preserve context without hiding the main form"). No dimming scrim — unlike the tablet
// drawer, the form is never blocked, just partially covered while the sheet is taller.
const SHEET_COLLAPSED_PX = 64;
type SheetHeight = "half" | "expanded";

function MobileWorkspaceSheet({
  wsCollapsed,
  setWsCollapsed,
  sectionCount,
}: {
  wsCollapsed: boolean;
  setWsCollapsed: (v: boolean) => void;
  sectionCount: number;
}) {
  const [sheetHeight, setSheetHeight] = useState<SheetHeight>("half");
  const [dragPx, setDragPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Refs mirror the drag-in-progress state so the pointer handlers always read the latest
  // value synchronously — React state updates inside a fast pointerdown→move→up sequence
  // aren't guaranteed to have committed by the time the next event fires (same reasoning as
  // the drag-reorder handlers in PreviewPanel's SectionWorkspace).
  const isDraggingRef = useRef(false);
  const liveHeightRef = useRef<number | null>(null);
  const drag = useRef({ startY: 0, startHeight: 0, moved: false });

  const pxFor = (target: "collapsed" | SheetHeight) => {
    if (target === "collapsed") return SHEET_COLLAPSED_PX;
    const vh = typeof window === "undefined" ? 700 : window.innerHeight;
    return Math.round(vh * (target === "half" ? 0.5 : 0.85));
  };

  const beginDrag = (clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    drag.current = {
      startY: clientY,
      startHeight: sheetRef.current?.getBoundingClientRect().height ?? pxFor(wsCollapsed ? "collapsed" : sheetHeight),
      moved: false,
    };
  };
  const moveDrag = (clientY: number) => {
    const delta = drag.current.startY - clientY;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    const next = Math.min(pxFor("expanded"), Math.max(pxFor("collapsed") - 12, drag.current.startHeight + delta));
    liveHeightRef.current = next;
    setDragPx(next);
  };
  const endDrag = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    const finalPx = liveHeightRef.current ?? pxFor(wsCollapsed ? "collapsed" : sheetHeight);
    liveHeightRef.current = null;
    setDragPx(null);

    if (!drag.current.moved) {
      // A tap toggles. The handle is the sheet's single open/close control, so the same
      // spot that opened it closes it again — previously a tap only ever opened, and
      // closing meant hunting for a separate chevron inside the panel toolbar, which read
      // as two unrelated controls for one job. Dragging still resizes as before.
      if (wsCollapsed) { setWsCollapsed(false); setSheetHeight("half"); }
      else setWsCollapsed(true);
      return;
    }

    const collapsedPx = pxFor("collapsed");
    const halfPx = pxFor("half");
    const expandedPx = pxFor("expanded");
    if (finalPx < collapsedPx + (halfPx - collapsedPx) * 0.4) {
      setWsCollapsed(true);
    } else if (finalPx < halfPx + (expandedPx - halfPx) * 0.5) {
      setWsCollapsed(false); setSheetHeight("half");
    } else {
      setWsCollapsed(false); setSheetHeight("expanded");
    }
  };

  const currentHeight = dragPx ?? pxFor(wsCollapsed ? "collapsed" : sheetHeight);
  // Header/Hero/Footer are fixed structure, not a choice — counting them here read as "3
  // sections already picked" before the user had touched anything. The bar now only counts
  // what the user actually added, against how much room is left before the max.
  const optionalCount = Math.max(0, sectionCount - REQUIRED_SECTION_IDS.length);
  const optionalMax = RULES.sections.max - REQUIRED_SECTION_IDS.length;
  const remaining = Math.max(0, optionalMax - optionalCount);

  return (
    <div
      ref={sheetRef}
      // A flat white card + neutral shadow is exactly what a native browser/OS action sheet
      // looks like. Two deliberate departures from that, both borrowed from the homepage's
      // own card-hover language (border-ir-accent/40 + a plain neutral shadow, no color in
      // the glow): (1) an accent-tinted border instead of a plain neutral one — a colored
      // shadow/glow read as an odd yellow halo, a border reads as the same brand accent the
      // rest of the app already uses; (2) the handle row sits on its own soft brand-tinted
      // band (below) rather than flush with the white body — a two-tier "toolbar cap +
      // content" structure a generic sheet never has.
      className="md:hidden fixed inset-x-0 bottom-0 z-[10001] bg-ir-card rounded-t-[22px] border border-ir-accent/40 shadow-[0_-16px_46px_-12px_rgba(6,7,15,0.22),0_-2px_10px_rgba(6,7,15,0.06)] flex flex-col overflow-hidden"
      style={{
        height: currentHeight,
        paddingBottom: wsCollapsed ? "env(safe-area-inset-bottom, 0px)" : undefined,
        transition: isDragging ? "none" : "height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      role="dialog"
      aria-label="โครงสร้างเว็บไซต์"
    >
      {/* Handle band — the outer accent border + shadow already mark this as a distinct WRS
          surface, so this stays plain white rather than adding its own colored wash on top
          (a gradient here read as hazy, not "depth"). Drag to resize, tap to open/close. */}
      <div className="shrink-0 rounded-t-[22px]">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={!wsCollapsed}
          aria-label={wsCollapsed ? "เปิดโครงสร้างเว็บไซต์" : "ย่อโครงสร้างเว็บไซต์"}
          className="flex flex-col items-center pt-2 pb-2.5 cursor-grab active:cursor-grabbing touch-none select-none wrs-no-callout focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-accent/40 focus-visible:ring-inset"
          onPointerDown={(e) => {
            // Capture failure (e.g. an already-released pointer) must never block the drag
            // itself from starting — it's just an enhancement that stops the gesture from
            // "leaking" onto other elements as the finger moves.
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
            beginDrag(e.clientY);
          }}
          onPointerMove={(e) => { if (isDraggingRef.current) moveDrag(e.clientY); }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            if (wsCollapsed) { setWsCollapsed(false); setSheetHeight("half"); }
            else setWsCollapsed(true);
          }}
        >
          <span className="w-9 h-1 rounded-full bg-ir-accent/35" />

          {/* Text block always left-aligned, chevron chip always right-aligned — same
              layout in both states so the control reads as one consistent element, not two
              different bars. Collapsed splits status (what you have) from headroom (what's
              left) into two distinct weights so they don't read as one flat line; open
              swaps in a single action hint instead of repeating the panel's own heading. */}
          <div className="w-full flex items-center justify-between gap-3 mt-2.5 px-5">
            <div className="min-w-0 text-left">
              {wsCollapsed ? (
                <>
                  <p className="text-[13px] font-semibold text-ir-t1 leading-tight tabular-nums">
                    {optionalCount} Section
                  </p>
                  <p className="text-[10.5px] text-ir-t3 leading-tight mt-0.5">
                    {remaining > 0 ? `เพิ่มได้อีก ${remaining}` : "ครบจำนวนสูงสุดแล้ว"}
                  </p>
                </>
              ) : (
                <p className="text-[11.5px] font-medium text-ir-t2 leading-tight">
                  แตะเพื่อย่อหน้าต่างนี้
                </p>
              )}
            </div>
            {/* Same chip the category accordion chevrons use — bigger and its own circular
                affordance so it reads as a real control, not decoration. Direction always
                matches the action it performs: up to open, down to collapse. */}
            <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-ir-t1/[0.06] text-ir-t2">
              <svg
                width="24" height="24" viewBox="0 0 12 12" fill="none"
                className={`transition-transform duration-200 ${wsCollapsed ? "" : "rotate-180"}`}
              >
                <path d="M2.5 7.5 L6 4 L9.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Content — unmounted while collapsed so it can't intercept taps/scroll behind the bar */}
      {!wsCollapsed && (
        <div className="flex-1 min-h-0">
          <PreviewPanel dominant embedded flush />
        </div>
      )}
    </div>
  );
}

// Inserts `id` right before the trailing-locked rows (footer) instead of at the very end —
// keeps the invariant that footer always renders last in the live workspace list, no matter
// when a section gets added.
function insertBeforeTrailing(list: string[], id: string) {
  const trailingPresent = TRAILING_REQUIRED_IDS.filter((t) => list.includes(t)).length;
  const next = [...list];
  next.splice(next.length - trailingPresent, 0, id);
  return next;
}

// ── S3 Structure — section picker + reorderable page structure ──
function S3({ go, draft, updateDraft, addTimelineEntry, addNotebookEntry }: any) {
  // ── Auto-select direction silently (AI picks, not shown as UI) ──
  const ranked = rankDirections(draft.industry, draft.companyType, draft.businessGoals);
  const ai = draft.designProfile ? profileToDirection(draft.designProfile) : null;
  const bestId = ai?.direction.id || ranked[0].id;

  useEffect(() => {
    if (!draft.selectedDirection && bestId) {
      const d = directionById(bestId);
      updateDraft({ selectedDirection: bestId, directionLabel: d?.label || "", selectedLayout: d?.layout || "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestId]);

  // ── Section selection state ──
  const selected: string[] = draft.selectedSections ?? [];
  const count = selected.length;
  const canNext = count >= RULES.sections.min;

  // ── AI recommendations: goal sections → audience priorities → direction sections ──
  // Goals come first: they're what the customer explicitly asked the site to do, and
  // "ใช้คำแนะนำ" only fills the room left under the section cap, in this order.
  const aud = audienceById(draft.primaryAudience);
  const dirSuggested = directionById(draft.selectedDirection)?.sections ?? [];
  const goalSuggested = (draft.businessGoals ?? []).flatMap((g: string) => GOAL_SECTIONS[g] ?? []);
  const recommended = new Set<string>([...goalSuggested, ...(aud?.prioritizes ?? []), ...dirSuggested.slice(0, 6)]);

  // Why each section is recommended — shown on its card. Same precedence as above, so the
  // reason given is the one that actually got the section into the set.
  const recReason: Record<string, string> = {};
  const noteWhy = (ids: string[], why: string) => ids.forEach((id) => { recReason[id] ??= why; });
  (draft.businessGoals ?? []).forEach((g: string) =>
    noteWhy(GOAL_SECTIONS[g] ?? [], `คุณเลือกเป้าหมาย “${BUSINESS_GOALS.find((b) => b.id === g)?.label ?? g}”`));
  if (aud) noteWhy(aud.prioritizes, `${aud.label}ต้องหาข้อมูลนี้เจอเร็ว`);
  const dirLabel = directionById(draft.selectedDirection)?.label;
  if (dirLabel) noteWhy(dirSuggested.slice(0, 6), `เป็นส่วนสำคัญของแนวทาง ${dirLabel}`);

  // Page order for recommended sections: what the primary audience looks for first leads
  // (an institutional investor wants Financial Highlights before About Us), then secondary
  // audiences, then goal sections, then the usual IA order.
  const audienceOrder = [draft.primaryAudience, ...(draft.secondaryAudiences ?? [])]
    .flatMap((a: string) => audienceById(a)?.prioritizes ?? []);
  const pageRank = (id: string) => {
    const a = audienceOrder.indexOf(id);
    if (a >= 0) return a;
    const g = goalSuggested.indexOf(id);
    if (g >= 0) return 100 + g;
    return 200 + SECTIONS.findIndex((s) => s.id === id);
  };

  // Source-card DOM refs, keyed by section id — read at click time to know where the
  // "flying card" ghost should start from (see GhostFlightLayer).
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const removingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Brief "gently scales" acknowledgement on the card the instant it's selected — a discrete
  // beat before the ghost departs, not just the CSS `:active` press state.
  const [selectPulseId, setSelectPulseId] = useState<string | null>(null);
  const selectPulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(selectPulseTimer.current), []);

  // The "X / max Section" counter pops every time the count changes — add or remove — the
  // same tick used by every other counter in this flow (reference gallery, goal count, etc.).
  const [countPulse, setCountPulse] = useState(false);
  const countPulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(countPulseTimer.current), []);
  const pulseCount = () => {
    setCountPulse(true);
    clearTimeout(countPulseTimer.current);
    countPulseTimer.current = setTimeout(() => setCountPulse(false), 260);
  };

  // Same `landedIds` a ghost lands into on the workspace side — reused here so the picker
  // card also gets a brief glow: on add it echoes the row settling in, on remove it's the
  // returning ghost's actual landing spot.
  const cardLandedIds = useSectionFx((st) => st.landedIds);

  // Contextual "AI recommends" chips — updates to whatever was just picked, so suggestions
  // stay relevant to the current moment instead of a single static list for the whole step.
  const [lastPickedId, setLastPickedId] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  // Collapsible category groups (mobile only — see `md:grid` override below, desktop always
  // shows everything expanded). Categories with more than 2 optional sections start collapsed
  // so a first-time mobile visit isn't an 11-card wall of scrolling; a 1-2 item category isn't
  // worth an extra tap to reveal, so those start open. Any category with an existing selection
  // is always treated as expanded regardless of this set — "context-aware," not just a
  // one-time default.
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(() => {
    const s = new Set<string>();
    IR_CATEGORY_ORDER.forEach((cat) => {
      const n = SECTIONS.filter((sec) => sec.category === cat && !REQUIRED_SECTION_IDS.includes(sec.id)).length;
      if (n > 2) s.add(cat);
    });
    return s;
  });
  const toggleCat = (cat: string) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  // `sourceRectOverride` lets the recommendation chips (which aren't the section's own grid
  // card, and must never overwrite that card's entry in `cardRefs`) supply their own rect as
  // the ghost's starting point instead.
  const toggle = (id: string, sourceRectOverride?: DOMRect) => {
    if (REQUIRED_SECTION_IDS.includes(id)) return; // fundamental structure — not user-toggleable
    // Live store read (see toggleAudience) so quick successive picks don't overwrite each other.
    const selected: string[] = (useStore.getState().draft ?? draft).selectedSections ?? [];
    const isAdding = !selected.includes(id);

    if (isAdding) {
      if (selected.length >= RULES.sections.max) return;
      const rect = sourceRectOverride ?? cardRefs.current[id]?.getBoundingClientRect();
      updateDraft({ selectedSections: insertBeforeTrailing(selected, id) });
      setLastPickedId(id);

      clearTimeout(selectPulseTimer.current);
      setSelectPulseId(id);
      selectPulseTimer.current = setTimeout(() => setSelectPulseId(null), 200);
      pulseCount();
      if (rect) useSectionFx.getState().flyToStructure(id, rect);

      const s = sectionById(id);
      addTimelineEntry?.({
        step: 4, type: "structure",
        decision: `เพิ่ม ${s?.name?.split(" / ")[0] ?? id}`,
        reasoning: s?.businessPurpose ?? "",
      });
      // Mobile floating preview — the Living Workspace is a collapsed-by-default bottom
      // sheet there, so without this, adding a section shows nothing about the structure
      // unless the user opens it. Ghost-flight/glow already cover it when the sheet is open.
      useFloatingPreview.getState().show(
        <span className="text-[13px] leading-none">{s?.icon ?? "📄"}</span>,
        `เพิ่ม ${s?.name?.split(" / ")[0] ?? id} แล้ว`,
        `${selected.length + 1} Section`
      );
    } else {
      // Ghost travels back from the workspace row to this picker card — "animate the item
      // back toward the available list" — while the row fades out; the actual removal from
      // `selectedSections` lands a beat later so the fade has time to play.
      const rowRect = document.querySelector<HTMLElement>(`[data-section-row="${id}"]`)?.getBoundingClientRect();
      const cardRect = cardRefs.current[id]?.getBoundingClientRect();
      if (rowRect && cardRect) {
        useSectionFx.getState().flyToPicker(id, rowRect, cardRect);
      } else {
        useSectionFx.getState().startRemove(id); // no ghost target found — just fade the row
      }

      clearTimeout(removingTimers.current[id]);
      removingTimers.current[id] = setTimeout(() => {
        // Read the freshest selection at execution time (not the stale render-time
        // `selected` closure) — several removals can be mid-fade at once.
        const latest = useStore.getState().draft?.selectedSections ?? [];
        const next = latest.filter((s) => s !== id);
        updateDraft({ selectedSections: next });
        useSectionFx.getState().clearRemoving(id);
        delete removingTimers.current[id];
        pulseCount();

        const removed = sectionById(id);
        useFloatingPreview.getState().show(
          <span className="text-[13px] leading-none opacity-60">{removed?.icon ?? "📄"}</span>,
          `ลบ ${removed?.name?.split(" / ")[0] ?? id} แล้ว`,
          `${next.length} Section`
        );
      }, 220);
    }
  };

  useEffect(() => () => {
    Object.values(removingTimers.current).forEach(clearTimeout);
  }, []);

  // Required structure is always present, header/hero pinned first and footer pinned last —
  // normalize on mount so a fresh draft gets it backfilled and an older saved draft (from
  // before footer moved to the bottom) gets its order corrected too.
  useEffect(() => {
    const current: string[] = draft.selectedSections ?? [];
    const optional = current.filter((id: string) => !REQUIRED_SECTION_IDS.includes(id));
    const normalized = [...LEADING_REQUIRED_IDS, ...optional, ...TRAILING_REQUIRED_IDS];
    const changed = normalized.length !== current.length || normalized.some((id, i) => id !== current[i]);
    if (changed) {
      updateDraft({ selectedSections: normalized });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI guide: audience-aware message shown once on mount
  const g = useGuide("analyst");
  const shownGuide = useRef(false);
  useEffect(() => {
    if (shownGuide.current) return;
    shownGuide.current = true;
    const t = setTimeout(() => {
      if (aud) {
        g.show(
          `สำหรับ ${aud.label} — ${aud.shapes} AI ไฮไลต์ Section ที่สำคัญไว้ให้แล้วครับ เลือกเพิ่มได้ จัดลำดับได้ด้วย`,
          { mode: "insight", expert: "analyst", autohide: 11000 }
        );
      }
    }, 900);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // At max capacity there's no room left to add anything anyway, so neither AI-suggest
  // surface below should keep nudging — a suggestion the user can't act on reads as the step
  // not being done yet, even once all 9 sections are actually picked.
  const atCapacity = selected.length >= RULES.sections.max;

  // Contextual recommendations for whatever was just picked — already-selected and
  // required ids filtered out, capped at 3 so it stays a nudge, not another grid to scan.
  const suggestionSource = !atCapacity && lastPickedId && dismissedFor !== lastPickedId ? lastPickedId : null;
  const suggestions = suggestionSource
    ? (RELATED_SECTIONS[suggestionSource] ?? [])
        .filter((sid) => !selected.includes(sid) && !REQUIRED_SECTION_IDS.includes(sid))
        .slice(0, 3)
    : [];

  // Cards already carry an "AI แนะนำ" badge (below), but badges alone still leave every one
  // of them as a separate decision to notice and tap. This offers the whole recommended set
  // in one action instead — still fully optional (sections stay unselected until the user
  // acts, same as before), just one decision instead of N. Only shown before a first pick —
  // once the user has engaged (this way or by picking manually themselves), the reactive
  // suggestion strip above takes over as the nudge mechanism, so the two never stack.
  const recommendedUnselected = !atCapacity && lastPickedId === null
    ? [...recommended].filter((id) => !selected.includes(id) && !REQUIRED_SECTION_IDS.includes(id))
    : [];
  const acceptAllRecommended = () => {
    const room = RULES.sections.max - selected.length;
    // Which sections make the cut follows `recommended` (goals first); where they land on
    // the page follows pageRank (audience first).
    const toAdd = recommendedUnselected.slice(0, room).sort((a, b) => pageRank(a) - pageRank(b));
    if (toAdd.length === 0) return;
    updateDraft({ selectedSections: toAdd.reduce((acc, id) => insertBeforeTrailing(acc, id), selected) });
    setLastPickedId(toAdd[toAdd.length - 1]);
    pulseCount();
    addTimelineEntry?.({
      step: 4, type: "structure",
      decision: `เพิ่ม Section ที่ AI แนะนำ ${toAdd.length} รายการ`,
      reasoning: aud ? `สำหรับ ${aud.label} — ${aud.shapes}` : "เพิ่มตามคำแนะนำของ AI ตามกลุ่มเป้าหมายและ Direction ที่เลือก",
    });
    useFloatingPreview.getState().show(
      <span className="text-[13px] leading-none">✨</span>,
      "เพิ่ม Section ที่ AI แนะนำแล้ว",
      `${selected.length + toAdd.length} Section`
    );
  };

  return (
    <>
      <Head n={4} title="วางโครงสร้าง"
        sub="เลือก Section และจัดลำดับหน้าเว็บ AI ไฮไลต์ Section ที่เหมาะกับกลุ่มเป้าหมายของคุณ เลือกได้ตามต้องการ" />

      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      {/* Control bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-semibold text-ir-t1 tabular-nums ${countPulse ? "wrs-counter-pop" : ""}`}>{count}</span>
          <span className="text-[12px] text-ir-t3">/ {RULES.sections.max} Section</span>
        </div>
        <button
          onClick={() => {
            updateDraft({ selectedSections: REQUIRED_SECTION_IDS });
            setLastPickedId(null);
            setDismissedFor(null);
          }}
          className="flex items-center gap-1.5 -my-2 py-2 text-[12px] font-medium text-ir-t3 hover:text-ir-t1 active:text-ir-t1 transition-colors"
        >
          <IconReset width={20} height={20} />
          รีเซ็ต
        </button>
      </div>

      {/* Foundation (Header · Hero · Footer) is intentionally NOT rendered here. It's fixed
          infrastructure every site has — already present and locked in the live workspace
          panel — so surfacing it in the picker only added a "choice" that isn't one. This
          step now opens straight into the categories the user actually decides on. A single
          line still reassures them the base structure is handled, without listing it. */}
      <p className="text-[12px] text-ir-t3 leading-relaxed mb-6 md:mb-7">
        เราเตรียมโครงสร้างพื้นฐานของเว็บไซต์ไว้ให้อัตโนมัติแล้ว เลือกเพิ่มเฉพาะ Section ที่ตรงกับธุรกิจของคุณด้านล่าง
      </p>

      {/* Section picker — grouped by category */}
      {/* Bulk-accept the initial AI recommendation — one decision instead of finding and
          tapping each badged card individually. Self-clearing: disappears the moment the
          user picks anything (via this button or manually), handing off to the reactive
          suggestion strip below for further nudges. */}
      {recommendedUnselected.length > 0 && (
        <div className="wrs-suggest-in flex items-center gap-3 mb-5 px-3.5 py-3 rounded-xl bg-ir-accent/[0.05] border border-ir-accent/20">
          <span className="text-[15px] shrink-0">✨</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-ir-t1 leading-snug">
              AI แนะนำ {recommendedUnselected.length} Section ให้ตามกลุ่มเป้าหมายและ Direction ของคุณ
            </p>
            <p className="text-[11px] text-ir-t3 mt-0.5">เพิ่มได้ในคลิกเดียว หรือเลือกเองด้านล่างก็ได้</p>
          </div>
          <button
            type="button"
            onClick={acceptAllRecommended}
            className="shrink-0 flex items-center gap-1.5 text-[12.5px] font-semibold text-ir-on-accent bg-ir-accent px-3.5 py-2 rounded-full hover:bg-ir-accent-hi active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-accent/40 focus-visible:ring-offset-2 transition-all"
          >
            ใช้คำแนะนำ
            <IconCheck width={10} height={10} />
          </button>
        </div>
      )}

      {/* AI recommends — contextual chips keyed to whatever was just picked, capped at 3 so
          it's a nudge rather than another grid. One tap adds; dismissible per-suggestion-set. */}
      {suggestions.length > 0 && (
        <div key={suggestionSource} className="wrs-suggest-in flex items-start gap-2 mb-5 px-3 py-2.5 rounded-xl bg-ir-accent/[0.05] border border-ir-accent/20">
          <span className="text-[13px] shrink-0 mt-0.5">✨</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-ir-t3 mb-1.5">
              AI แนะนำเพิ่มจาก <span className="font-medium text-ir-t2">{sectionById(suggestionSource!)?.name?.split(" / ")[0]}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sid) => {
                const s = sectionById(sid);
                if (!s) return null;
                return (
                  <button
                    key={sid}
                    onClick={(e) => toggle(sid, e.currentTarget.getBoundingClientRect())}
                    className="flex items-center gap-1 text-[11.5px] font-medium text-ir-accent-text bg-ir-card border border-ir-accent/30 rounded-full pl-2 pr-2.5 py-1 hover:border-ir-accent/60 hover:bg-ir-accent/[0.04] active:scale-[0.96] transition-all"
                  >
                    <span className="text-[12px] leading-none">{s.icon}</span>
                    {s.name.split(" / ")[0]}
                    <IconPlus width={8} height={8} className="text-ir-accent-text/70" />
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setDismissedFor(suggestionSource)}
            aria-label="ปิดคำแนะนำ"
            className="shrink-0 w-7 h-7 -m-1 rounded-full flex items-center justify-center text-ir-t3 hover:text-ir-t1 hover:bg-ir-t1/8 active:bg-ir-t1/8 active:scale-90 transition-[background-color,transform]"
          >
            {/* Deliberately 16px, under the system's 24px icon floor — the dismiss "x" on
                every AI-suggest surface reads as a quieter, secondary action against the
                accent-colored recommendation it's closing, not another primary glyph the
                same size as the checkmark/plus icons next to it. Same glyph as IconClose,
                just not routed through that shared component so it isn't clamped back up. */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-6 md:space-y-7">
        {IR_CATEGORY_ORDER.map((cat) => {
          const items = SECTIONS.filter((s) => s.category === cat && !REQUIRED_SECTION_IDS.includes(s.id));
          const selectedInCat = items.filter((s) => selected.includes(s.id)).length;
          if (!items.length) return null;
          // Mobile only — desktop always renders expanded (see `md:grid` override below).
          // A category with a selection in it is never collapsed, regardless of the toggle.
          const collapsedOnMobile = collapsedCats.has(cat) && selectedInCat === 0;
          return (
            <div
              key={cat}
              // Open on mobile: header + cards share one soft tinted "tray" so the group
              // reads as a single unit instead of a bar sitting above a disconnected grid.
              // A background wash (not a border box) keeps this from becoming a card wrapped
              // around more cards — the individual section cards still carry their own
              // border, popping against the tray rather than nesting inside another one.
              // Collapsed / desktop: no wash, nothing to visually unify.
              className={!collapsedOnMobile ? "rounded-2xl bg-ir-t1/[0.03] md:bg-transparent md:rounded-none" : ""}
            >
              {/* Category header. On mobile it's a self-evident accordion control: a chevron
                  in its own circular affordance makes it obvious the group opens/closes on
                  tap. Collapsed, it's a standalone bordered pill; open, its border/bg drop
                  away so it reads as the tray's top edge rather than a separate bar. On
                  desktop (≥md) all that chrome is stripped back to the original plain label
                  + divider rule — the grid ignores collapse there, so an accordion look
                  would be misleading. */}
              <button
                type="button"
                onClick={() => toggleCat(cat)}
                aria-expanded={!collapsedOnMobile}
                className={[
                  "w-full flex items-center gap-2 text-left transition-colors",
                  collapsedOnMobile
                    ? "rounded-xl border border-ir-border bg-ir-card px-3.5 py-3 mb-2 active:bg-ir-t1/[0.04]"
                    : "px-3.5 pt-3 pb-2",
                  "md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:mb-3 md:active:bg-transparent md:cursor-default",
                ].join(" ")}
              >
                <span className="text-[12.5px] font-semibold text-ir-t1 md:text-[12px] md:text-ir-t2">{SECTION_CATEGORY_LABEL[cat]}</span>
                {selectedInCat > 0 && (
                  <span className="text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-ir-accent text-ir-on-accent leading-none">{selectedInCat}</span>
                )}
                {/* Item count — only useful while collapsed, so you know what's hidden
                    before tapping to reveal it. */}
                {collapsedOnMobile && (
                  <span className="md:hidden text-[10.5px] text-ir-t3">{items.length} รายการ</span>
                )}
                {/* Desktop keeps the section-header divider rule; mobile just pushes the chevron right. */}
                <div className="hidden md:block flex-1 h-px bg-ir-border" />
                <div className="flex-1 md:hidden" />
                <span className="md:hidden shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-ir-t1/[0.05] text-ir-t2">
                  <svg
                    width="24" height="24" viewBox="0 0 12 12" fill="none"
                    className={`transition-transform duration-200 ${collapsedOnMobile ? "" : "rotate-180"}`}
                  >
                    <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {/* Cards — same tray, so items still read as clearly separated (own border +
                  gap each) without the tray itself looking like another card around them. */}
              <div className={`${collapsedOnMobile ? "hidden md:grid" : "grid"} grid-cols-1 sm:grid-cols-2 gap-2 ${collapsedOnMobile ? "" : "px-2.5 pb-2.5 md:px-0 md:pb-0"}`}>
                {items.map((s) => {
                  const sel = selected.includes(s.id);
                  const isRec = recommended.has(s.id);
                  const disabled = !sel && count >= RULES.sections.max;
                  return (
                    <button
                      key={s.id}
                      ref={(el) => { cardRefs.current[s.id] = el; }}
                      onClick={() => toggle(s.id)}
                      disabled={disabled}
                      className={[
                        // Same selected/hover language as OptionCard (production WRS): lime-tinted
                        // fill + olive border + soft ring when picked. Kept as its own button
                        // (not OptionCard) because the ghost-flight animation needs its ref.
                        "text-left rounded-[18px] border p-3.5 transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98] select-none",
                        sel
                          ? "border-ir-select bg-primary-50 shadow-[0_0_0_2px_rgba(185,230,4,0.12)]"
                          : disabled
                            ? "border-ir-border bg-ir-card opacity-40 cursor-not-allowed"
                            // AI-recommended cards use the same neutral border as any other
                            // unselected card — the "AI แนะนำ" badge is the only signal that
                            // it's recommended; a different border color read as an unexplained
                            // state/interaction rather than a hint.
                            : "border-ir-border bg-ir-card hover:border-ir-select-soft hover:bg-primary-50/60",
                        selectPulseId === s.id ? "wrs-card-select-pulse" : "",
                        cardLandedIds.has(s.id) ? "wrs-card-glow" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-full text-[18px] transition-colors ${sel ? "bg-ir-accent-soft" : "bg-ir-muted"}`}>{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[15px] font-semibold text-ir-t1 leading-snug">{s.name}</span>
                            {isRec && !sel && !disabled && (
                              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-ir-accent-soft text-ir-accent-text">
                                AI แนะนำ
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-ir-t3 leading-snug line-clamp-2">{s.businessPurpose}</p>
                          {isRec && !sel && !disabled && recReason[s.id] && (
                            <p className="mt-1.5 text-[12px] font-medium text-ir-accent-text leading-snug">แนะนำเพราะ{recReason[s.id]}</p>
                          )}
                        </div>
                        <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          sel ? "bg-ir-accent border-ir-accent text-ir-on-accent" : "border-ir-border-hi"
                        }`}>
                          {sel && <IconCheck width={24} height={24} />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <StepNav
        onBack={() => go(3)}
        next={
          <NextButton onClick={() => go(5)} disabled={!canNext}>
            {canNext ? "ถัดไป" : `เลือกอีก ${RULES.sections.min - count}`}
          </NextButton>
        }
      />
    </>
  );
}

// ── Reference editor sources for AI design-knowledge extraction ──
function domainOf(url: string) {
  try {
    return new URL(url.match(/^https?:\/\//) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── Progressive URL validation (Reference Editor) — recomputed on every keystroke, no
// debounce needed since it's pure string parsing, not a network call. ──
type UrlValidationState = "empty" | "invalid" | "unsupported" | "existing" | "valid";

function validateUrlInput(raw: string, existing: { value: string }[]): UrlValidationState {
  const value = raw.trim();
  if (!value) return "empty";

  let parsed: URL;
  try {
    // Accept bare domains ("example.com") the same way domainOf() and the final submit do.
    parsed = new URL(/^[a-z][a-z\d+\-.]*:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return "invalid";
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return "unsupported";
  if (!parsed.hostname.includes(".")) return "invalid"; // e.g. "https://asdf" — parses but isn't a real host

  const normalized = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isDuplicate = existing.some((u) => domainOf(u.value).toLowerCase() === normalized);
  if (isDuplicate) return "existing";

  return "valid";
}

const URL_VALIDATION_COPY: Record<Exclude<UrlValidationState, "empty">, { label: string; textClass: string; dotClass: string }> = {
  valid:       { label: "ลิงก์ใช้ได้",                              textClass: "text-ir-accent-text", dotClass: "bg-ir-accent" },
  invalid:     { label: "รูปแบบลิงก์ไม่ถูกต้อง ตรวจสอบอีกครั้ง",       textClass: "text-ir-error",       dotClass: "bg-ir-error" },
  unsupported: { label: "ไม่รองรับลิงก์ประเภทนี้ ใช้ http:// หรือ https://", textClass: "text-ir-warn", dotClass: "bg-ir-warn" },
  existing:    { label: "มีลิงก์นี้อยู่ในรายการแล้ว",                   textClass: "text-ir-t2",          dotClass: "bg-ir-t2" },
};

const MAX_REFERENCE_URLS = 8;

// URL thumbnail gradients cycle so a Pinterest board of link-cards doesn't look flat/uniform
const URL_THUMB_THEMES = [
  "linear-gradient(135deg,#1f2937,#374151)",
  "linear-gradient(135deg,#151823,#232833)",
  "linear-gradient(135deg,#3f3d56,#232042)",
  "linear-gradient(135deg,#1e3a3a,#0f2323)",
];

// ── Curated website references per Design Direction — for customers who have a feel
// in mind but no specific site to point to. AI proposes, customer just reacts.
// Real investor-relations sites only: Thai listed companies plus a few international
// benchmarks. Every URL was checked to load its IR home (Nov 2026). Cards show the
// company as a brand-colored monogram tile — no screenshots of other companies' sites.
// `domain` doubles as the selection id stored in draft.curatedSelected.
type CuratedSite = { name: string; symbol: string; market: string; sector: string; url: string; domain: string };
const IR_SITES: Record<string, CuratedSite> = {
  ptt:        { name: "PTT", symbol: "PTT", market: "SET", sector: "พลังงาน", url: "https://investor.pttplc.com/en/ir-home", domain: "investor.pttplc.com" },
  scg:        { name: "SCG", symbol: "SCC", market: "SET", sector: "วัสดุก่อสร้าง", url: "https://scc.listedcompany.com", domain: "scc.listedcompany.com" },
  pttep:      { name: "PTTEP", symbol: "PTTEP", market: "SET", sector: "พลังงาน", url: "https://pttep.listedcompany.com", domain: "pttep.listedcompany.com" },
  banpu:      { name: "Banpu", symbol: "BANPU", market: "SET", sector: "พลังงาน", url: "https://www.banpu.com/investor-relations/", domain: "banpu.com" },
  ais:        { name: "AIS", symbol: "ADVANC", market: "SET", sector: "สื่อสาร", url: "https://investor.ais.co.th/en/home", domain: "investor.ais.co.th" },
  aot:        { name: "Airports of Thailand", symbol: "AOT", market: "SET", sector: "ขนส่ง", url: "https://investor.airportthai.co.th", domain: "investor.airportthai.co.th" },
  bdms:       { name: "BDMS", symbol: "BDMS", market: "SET", sector: "การแพทย์", url: "https://investor.bdms.co.th/en", domain: "investor.bdms.co.th" },
  bumrungrad: { name: "Bumrungrad Hospital", symbol: "BH", market: "SET", sector: "การแพทย์", url: "https://investor.bumrungrad.com", domain: "investor.bumrungrad.com" },
  dbs:        { name: "DBS", symbol: "DBS", market: "สิงคโปร์", sector: "ธนาคาร", url: "https://www.dbs.com/investors/default.page", domain: "dbs.com" },
  siemens:    { name: "Siemens", symbol: "SIE", market: "เยอรมนี", sector: "อุตสาหกรรม", url: "https://www.siemens.com/global/en/company/investor-relations.html", domain: "siemens.com" },
  unilever:   { name: "Unilever", symbol: "ULVR", market: "สหราชอาณาจักร", sector: "สินค้าอุปโภค", url: "https://www.unilever.com/investors/", domain: "unilever.com" },
  novo:       { name: "Novo Nordisk", symbol: "NOVO", market: "เดนมาร์ก", sector: "ยา", url: "https://www.novonordisk.com/investors.html", domain: "novonordisk.com" },
};
const CURATED_REFERENCES: Record<string, CuratedSite[]> = {
  "premium-corporate": [IR_SITES.ptt, IR_SITES.scg, IR_SITES.bdms, IR_SITES.dbs],
  "esg-focused":       [IR_SITES.banpu, IR_SITES.pttep, IR_SITES.unilever, IR_SITES.novo],
  "modern-tech":       [IR_SITES.ais, IR_SITES.aot, IR_SITES.siemens, IR_SITES.bumrungrad],
  "growth-oriented":   [IR_SITES.aot, IR_SITES.bumrungrad, IR_SITES.ais, IR_SITES.dbs],
};

function CuratedReferenceBoard({ dir, draft, updateDraft }: { dir: any; draft: any; updateDraft: any }) {
  const sites = CURATED_REFERENCES[dir?.id ?? ""] ?? CURATED_REFERENCES["premium-corporate"];
  const selected: string[] = draft?.curatedSelected ?? [];
  const activeDomain = selected[0] ?? null;

  // Single-select: choosing one clears any other pick (radio behavior).
  const pick = (domain: string) => {
    updateDraft({ curatedSelected: activeDomain === domain ? [] : [domain] });
  };

  return (
    <div>
      <p className="text-[14px] text-ir-t3 mt-1 mb-4 leading-relaxed">
        ทีม IR Plus คัดเว็บไซต์นักลงทุนสัมพันธ์จริงที่ใกล้เคียงกับแนวทาง <span className="text-ir-t2 font-medium">{dir?.label}</span> มาให้ดู
        เปิดดูเว็บจริงได้ แล้วเลือกเว็บที่ใช่ที่สุด 1 แบบ
      </p>
      {/* Always paired 2-up so all four options stay comparable at a glance (same as the
          quiz step), even on mobile. */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {sites.map((s) => {
          const isSelected = activeDomain === s.domain;
          return (
            <div
              key={s.domain}
              className={`rounded-[16px] sm:rounded-[20px] border bg-ir-card p-1.5 sm:p-2 transition-[border-color,box-shadow] duration-200 ${
                isSelected ? "border-ir-select shadow-[0_0_0_2px_rgba(185,230,4,0.12)]" : "border-ir-border hover:border-ir-select-soft"
              }`}
            >
              {/* Monogram tile in the Direction's own gradient — identifies the company
                  without reproducing its website. Clicking it selects, like the button. */}
              <button
                type="button"
                onClick={() => pick(s.domain)}
                aria-pressed={isSelected}
                aria-label={`เลือก ${s.name} เป็นเว็บอ้างอิง`}
                className="relative block w-full overflow-hidden rounded-[12px] sm:rounded-[14px] text-left"
                style={{ paddingTop: "56.42%", background: dir?.bg ?? "#141613" }}
              >
                <span className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 text-white">
                  <span className="text-[12px] font-medium text-white/75">{s.market} · {s.sector}</span>
                  <span className="font-mono text-[22px] sm:text-[30px] font-bold leading-none tracking-tight">{s.symbol}</span>
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 grid place-items-center w-7 h-7 rounded-full bg-ir-accent text-ir-on-accent" aria-hidden="true">
                    <IconCheck width={24} height={24} />
                  </span>
                )}
              </button>
              <div className="px-1.5 sm:px-2 pt-2.5 pb-1">
                <p className="text-[14px] sm:text-[15px] font-semibold text-ir-t1 leading-snug truncate">{s.name}</p>
                <p className="text-[12px] text-ir-t3 truncate">{s.domain}</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`เปิดเว็บ IR ของ ${s.name} ในแท็บใหม่`}
                    className="shrink-0 inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 rounded-full bg-ir-muted text-ir-t2 text-[13px] font-medium hover:bg-ir-border hover:text-ir-t1 transition-colors"
                  >
                    <IconExternalLink width={24} height={24} className="-my-1" />
                    <span className="hidden sm:inline">เปิดเว็บ IR</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => pick(s.domain)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-full text-[13px] font-semibold transition-colors ${
                      isSelected ? "bg-ir-dark text-white" : "border border-ir-border text-ir-t2 hover:border-ir-select-soft hover:text-ir-t1"
                    }`}
                  >
                    {isSelected ? "เลือกแล้ว" : "เลือก"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferenceEditor({ draft, updateDraft }: any) {
  // ── URL list state ── committed immediately on Enter/blur, no separate save step
  const [urls, setUrls] = useState<{ id: string; value: string; note?: string }[]>(() =>
    (draft.references ?? [])
      .filter((r: any) => r.type === "url")
      .map((r: any) => ({ id: r.id, value: r.value, note: r.note }))
  );
  const [urlInput, setUrlInput] = useState("");
  // Recomputed every keystroke — pure parsing against the current list, no debounce needed.
  const urlValidation = useMemo(() => validateUrlInput(urlInput, urls), [urlInput, urls]);

  // ── Image list state (base64 data-uri) ──
  const [images, setImages] = useState<{ id: string; src: string; name: string; note?: string }[]>(() =>
    (draft.references ?? [])
      .filter((r: any) => r.type === "image")
      .map((r: any) => ({ id: r.id, src: r.value, name: r.label ?? "", note: r.note }))
  );

  // ── Per-item note ("why I picked this one") — id of the tile currently open for editing.
  // Notes are optional annotations, not a separate save step: typing updates the item (and
  // synced draft) immediately, same immediacy as everything else in this editor.
  const [noteEditing, setNoteEditing] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Id of the tile that just landed in the gallery — plays the single ~320ms press-to-settle
  // choreography (appear → slide into place → brief accent highlight → settle), then clears
  // so re-renders don't replay it. The success toast (below) is the separate, longer-lived
  // confirmation — this is just the connective motion from the button to the gallery.
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const lastAddedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashNew = (id: string) => {
    clearTimeout(lastAddedTimer.current);
    setLastAddedId(id);
    lastAddedTimer.current = setTimeout(() => setLastAddedId(null), 360);
  };
  useEffect(() => () => clearTimeout(lastAddedTimer.current), []);

  // Ids currently mid fade-out after a remove — the tile stays rendered (with
  // `wrs-row-removing`, the same fade used for a removed structure section) for the
  // animation's duration before it actually leaves `urls`/`images`, so "removed" gets the
  // same brief, visible confirmation "added" already gets, not an instant disappearance.
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const removingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => () => { Object.values(removingTimers.current).forEach(clearTimeout); }, []);

  // The gallery counter pops on removal too, not just on add — one shared "count just
  // changed" tick, reusing `wrs-counter-pop` the same way the add path already does.
  const [removePulse, setRemovePulse] = useState(false);
  const removePulseTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(removePulseTimer.current), []);

  // Brief "loading" beat between pressing add and the card actually landing — makes the add
  // feel like a deliberate, connected action rather than an instant snap. Guards against
  // double-submits too (commitUrl bails out while a commit is already in flight).
  const [isCommittingUrl, setIsCommittingUrl] = useState(false);
  const commitUrlTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(commitUrlTimer.current), []);

  // "Add website" button — four states: idle (+) -> loading (spinner, replaces the icon)
  // -> completed (check, brief) -> back to idle. Native `disabled` still covers the actual
  // idle/disabled distinction (empty input or link cap reached); this only tracks the two
  // transient states that layer on top of it.
  const [urlJustCompleted, setUrlJustCompleted] = useState(false);
  const urlCompletedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(urlCompletedTimer.current), []);

  // Choreographed confirmation: the counter updates immediately (right next to the input,
  // no scroll needed to see it), the floating preview confirms the add over the page, and
  // the gallery tile's own entrance animation is delayed slightly (see the `animationDelay`
  // on its `reference-card-insert` below) — so the sequence reads as one thing leading to
  // the next rather than everything landing at once. Nothing here occupies layout space,
  // so adding a reference never shifts the sections around it at any width.
  const GALLERY_TILE_DELAY_MS = 220;

  // Sync to draft.references whenever local state changes
  const syncToDraft = useCallback((nextUrls: typeof urls, nextImages: typeof images) => {
    const urlItems = nextUrls
      .filter((u) => u.value.trim())
      .map((u) => ({ id: u.id, type: "url" as const, category: "favorite" as const, value: u.value, label: u.value, note: u.note?.trim() || undefined }));
    const imgItems = nextImages
      .map((img) => ({ id: img.id, type: "image" as const, category: "favorite" as const, value: img.src, label: img.name, note: img.note?.trim() || undefined }));
    updateDraft({ references: [...urlItems, ...imgItems] });
  }, [updateDraft]);

  // Note handlers — typing updates the item's note immediately (no separate save step).
  // Unlike remove (above), these fire straight from a textarea `onChange` inside a React
  // event handler, where a functional setState updater is queued rather than run inline —
  // reading its result on the very next line would still see the pre-update value. So this
  // computes `next` directly off the current `urls`/`images` closure (same as `commitUrl`'s
  // plain-value commit) instead of that "capture inside the updater" pattern.
  const updateUrlNote = (id: string, note: string) => {
    const next = urls.map((u) => (u.id === id ? { ...u, note } : u));
    setUrls(next);
    syncToDraft(next, images);
  };
  const updateImageNote = (id: string, note: string) => {
    const next = images.map((img) => (img.id === id ? { ...img, note } : img));
    setImages(next);
    syncToDraft(urls, next);
  };

  // URL handlers — one input, commit on Enter/blur, appears straight in the board.
  // A short "loading" beat runs before the card actually lands (see isCommittingUrl above).
  const commitUrl = () => {
    if (isCommittingUrl) return;
    const value = urlInput.trim();
    if (!value || urlValidation !== "valid") return;
    setIsCommittingUrl(true);
    clearTimeout(commitUrlTimer.current);
    commitUrlTimer.current = setTimeout(() => {
      const id = Math.random().toString(36).slice(2);
      const next = [...urls, { id, value }];
      setUrls(next);
      setUrlInput("");
      syncToDraft(next, images);
      flashNew(id);
      // Floating preview (all widths) — shows the actual favicon-style swatch rather than
      // a bare checkmark, so it's a genuine visual preview, not only a confirmation message.
      useFloatingPreview.getState().show(
        <span className="w-full h-full flex items-center justify-center" style={{ background: URL_THUMB_THEMES[0] }}>
          <IconGlobe width={11} height={11} className="text-white/80" />
        </span>,
        "เพิ่มเว็บไซต์แล้ว",
        domainOf(value)
      );
      setIsCommittingUrl(false);
      setUrlJustCompleted(true);
      clearTimeout(urlCompletedTimer.current);
      urlCompletedTimer.current = setTimeout(() => setUrlJustCompleted(false), 700);
    }, 120);
  };
  const removeUrl = (id: string) => {
    if (removingIds.has(id)) return; // already fading out
    const removed = urls.find((u) => u.id === id);
    setRemovingIds((prev) => new Set(prev).add(id));
    clearTimeout(removingTimers.current[id]);
    removingTimers.current[id] = setTimeout(() => {
      setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      delete removingTimers.current[id];
      // `syncToDraft` runs as a plain statement after the updater settles, never inside it —
      // see the identical note on `removeImage` below.
      let nextUrls: typeof urls = [];
      setUrls((prev) => {
        nextUrls = prev.filter((u) => u.id !== id);
        return nextUrls;
      });
      syncToDraft(nextUrls, images);
      setRemovePulse(true);
      clearTimeout(removePulseTimer.current);
      removePulseTimer.current = setTimeout(() => setRemovePulse(false), 260);
      // Mobile floating preview — same dimmed-swatch treatment the Structure step uses to
      // confirm a removal, so "removed" reads consistently across the whole flow.
      useFloatingPreview.getState().show(
        <span className="w-full h-full flex items-center justify-center opacity-60" style={{ background: URL_THUMB_THEMES[0] }}>
          <IconGlobe width={11} height={11} className="text-white/80" />
        </span>,
        "ลบเว็บไซต์แล้ว",
        removed ? domainOf(removed.value) : undefined
      );
    }, 220);
  };

  // Image handlers
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const newImg = { id: Math.random().toString(36).slice(2), src, name: file.name };
        // `syncToDraft` must run as a plain statement after the state updater settles, never
        // from inside the updater callback itself — calling it there updates the parent
        // draft store while React is still applying this component's own state update,
        // which throws "Cannot update a component while rendering a different component."
        let nextImages: typeof images = [];
        setImages((prev) => {
          nextImages = [...prev, newImg];
          return nextImages;
        });
        syncToDraft(urls, nextImages);
        flashNew(newImg.id);
        // Floating preview (all widths) — an actual thumbnail crop of the uploaded image,
        // the clearest possible confirmation of what just got added.
        useFloatingPreview.getState().show(
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" draggable={false} className="w-full h-full object-cover block select-none wrs-no-callout" />,
          "เพิ่มรูปภาพแล้ว",
          file.name
        );
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (id: string) => {
    if (removingIds.has(id)) return; // already fading out
    const removed = images.find((img) => img.id === id);
    setRemovingIds((prev) => new Set(prev).add(id));
    clearTimeout(removingTimers.current[id]);
    removingTimers.current[id] = setTimeout(() => {
      setRemovingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      delete removingTimers.current[id];
      let nextImages: typeof images = [];
      setImages((prev) => {
        nextImages = prev.filter((img) => img.id !== id);
        return nextImages;
      });
      syncToDraft(urls, nextImages);
      setRemovePulse(true);
      clearTimeout(removePulseTimer.current);
      removePulseTimer.current = setTimeout(() => setRemovePulse(false), 260);
      useFloatingPreview.getState().show(
        removed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={removed.src} alt="" className="w-full h-full object-cover block opacity-60" />
        ) : (
          <span className="text-[13px] leading-none opacity-60">🖼️</span>
        ),
        "ลบรูปภาพแล้ว",
        removed?.name
      );
    }, 220);
  };

  // Drop zone
  const [isDragOver, setIsDragOver] = useState(false);
  const onDropZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const onDropZoneDragLeave = () => setIsDragOver(false);
  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const total = urls.length + images.length;
  const urlCapReached = urls.length >= MAX_REFERENCE_URLS;

  return (
    <div>
      {/* ── AI-learning reassurance — one merged sentence (was two separate, overlapping
          descriptions split across this component and its parent section header) ── */}
      <p className="text-[12.5px] text-ir-t3 mb-5 leading-relaxed">
        เพิ่มเว็บไซต์หรือรูปที่ชอบ ให้ AI วิเคราะห์ <span className="text-ir-t2 font-medium">"ความรู้สึก"</span> และปรับ Design Direction ให้ตรงใจคุณมากขึ้น โดยไม่คัดลอกดีไซน์ของใคร
      </p>

      {/* Mobile/tablet (<768px): Input → Gallery → Upload, so a newly added reference lands
          right under the input with no scrolling — the floating preview + counter confirm
          success without needing the gallery to be the sole signal. Desktop (md+):
          Input → Upload → Gallery, unchanged — only the `order-*`/`md:order-*` pairs below
          reorder. */}
      <div className="flex flex-col">
        {/* ── Website links — unified input+button as one control, no visual seam ── */}
        <div className="order-1 mb-4">
          <p className="text-[12px] font-semibold text-ir-t2 mb-2">
            เว็บไซต์ที่ชอบ <span className="font-normal text-ir-t3">(ไม่บังคับ)</span>
          </p>
          <div
            className={`flex items-stretch rounded-2xl border bg-ir-card overflow-hidden transition-colors ${
              {
                empty: "border-ir-border focus-within:border-ir-accent/50",
                valid: "border-ir-accent/50",
                existing: "border-ir-t2/40",
                unsupported: "border-ir-warn/50",
                invalid: "border-ir-error/50",
              }[urlValidation]
            }`}
          >
            <span className="shrink-0 flex items-center pl-4 pr-2 text-[15px] text-ir-t3">🌐</span>
            <input
              type="url"
              placeholder={urlCapReached ? `เพิ่มได้สูงสุด ${MAX_REFERENCE_URLS} ลิงก์` : "วางลิงก์เว็บไซต์ที่ชอบ..."}
              value={urlInput}
              disabled={urlCapReached}
              aria-invalid={urlValidation === "invalid" || urlValidation === "unsupported"}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); }}
              className="flex-1 min-w-0 bg-transparent text-[13.5px] text-ir-t1 placeholder:text-ir-t3 outline-none py-3 disabled:cursor-not-allowed"
            />
            <button
              onClick={commitUrl}
              disabled={urlValidation !== "valid" || urlCapReached}
              aria-busy={isCommittingUrl}
              className="shrink-0 flex items-center gap-1.5 text-[13px] font-semibold text-ir-on-accent bg-ir-accent px-4 my-1.5 mr-1.5 rounded-xl hover:bg-ir-accent-hi active:scale-[0.97] transition-all disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
            >
              {/* Icon swaps between four states — idle (+) / loading (spinner) / completed
                  (check) — each mount plays a short, non-bouncy fade+scale so the swap reads
                  as one smooth transition rather than an abrupt pixel-swap. The button's own
                  disabled state (empty input / link cap) is unaffected — it's a separate,
                  persistent condition, not one of these three transient icon states. */}
              {isCommittingUrl ? (
                <span
                  key="loading"
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full border-[1.5px] border-ir-on-accent/30 border-t-ir-on-accent animate-spin ref-btn-icon-in"
                />
              ) : urlJustCompleted ? (
                <IconCheck key="completed" width={12} height={12} className="ref-btn-icon-in" />
              ) : (
                <IconPlus key="idle" width={12} height={12} className="ref-btn-icon-in" />
              )}
              เพิ่มลิงก์
            </button>
          </div>
          {/* Progressive validation — recomputed on every keystroke, no submit required to
              find out the link won't work. Falls back to the generic hint when empty. */}
          {urlValidation === "empty" ? (
            <p className="text-[10.5px] text-ir-t3 mt-1.5">วางทีละลิงก์ แล้วกด "เพิ่มลิงก์" เพื่อใส่ลิงก์ถัดไป · {urls.length}/{MAX_REFERENCE_URLS}</p>
          ) : (
            <p role="status" className={`text-[10.5px] mt-1.5 flex items-center gap-1.5 ${URL_VALIDATION_COPY[urlValidation].textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${URL_VALIDATION_COPY[urlValidation].dotClass}`} />
              {URL_VALIDATION_COPY[urlValidation].label}
            </p>
          )}
        </div>

        {/* ── Compact reference thumbnail grid — fixed-size small tiles that don't stretch to fill the row.
            Mobile: right after the input (order-2) — the add toast + counter pop above already
            confirm success, so the gallery itself is the "yes, that landed" surface, no separate
            teaser needed. Desktop: unchanged, after Upload. ── */}
        <div className="order-2 md:order-3">
          {total > 0 && (
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px] font-semibold text-ir-t2">เพิ่มแล้ว</span>
                <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full bg-ir-accent text-ir-on-accent leading-none tabular-nums ${(lastAddedId || removePulse) ? "wrs-counter-pop" : ""}`}>{total}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {urls.map((u, i) => (
                  <div
                    key={u.id}
                    className={`relative group rounded-lg overflow-hidden border border-ir-border shrink-0 ${u.id === lastAddedId ? "reference-card-insert" : ""} ${removingIds.has(u.id) ? "wrs-row-removing pointer-events-none" : ""}`}
                    style={{ width: 72, height: 72, animationDelay: u.id === lastAddedId ? `${GALLERY_TILE_DELAY_MS}ms` : undefined }}
                  >
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1 px-1 text-center"
                      style={{ background: URL_THUMB_THEMES[i % URL_THUMB_THEMES.length] }}
                    >
                      <IconGlobe width={12} height={12} className="text-white/70" />
                      <span className="text-white text-[8px] font-medium truncate max-w-full px-1">{domainOf(u.value)}</span>
                    </div>
                    {/* No per-tile checkmark — every tile in this gallery is, by definition,
                        already added (that's what the "เพิ่มแล้ว N" header above it means),
                        so a checkmark repeated on each one added nothing a viewer didn't
                        already know from the section it's sitting in. */}
                    {/* Always visible on mobile — a hover-only reveal (as on desktop) is
                        never reachable on a touchscreen. Sized to the ~24px touch-target
                        floor (was 16px) with an instant `active:` press, since `:hover`
                        color changes never fire on tap. */}
                    <button
                      onClick={() => removeUrl(u.id)}
                      aria-label="ลบเว็บไซต์นี้"
                      className="absolute -top-0.5 -left-0.5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-[opacity,transform] hover:bg-red-500 active:bg-red-500 active:scale-90"
                      style={{ width: 24, height: 24 }}
                    >
                      <IconClose width={8} height={8} />
                    </button>
                    {/* Note toggle — mirrors the remove button (same size/visibility rules),
                        opposite corner. A filled accent dot stays visible even when this
                        button itself is hover-hidden, so "this one has a note" reads at a
                        glance without needing to hover every tile. */}
                    <button
                      onClick={() => setNoteEditing(noteEditing === u.id ? null : u.id)}
                      aria-label={u.note ? "แก้ไขโน้ต" : "เพิ่มโน้ต"}
                      className={`absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center transition-[opacity,transform] active:scale-90 ${
                        noteEditing === u.id
                          ? "bg-ir-accent text-ir-on-accent opacity-100"
                          : "bg-black/50 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/70 active:bg-black/70"
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      <IconEdit width={8} height={8} />
                    </button>
                    {u.note && noteEditing !== u.id && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-ir-accent ring-1 ring-white/70" />
                    )}
                  </div>
                ))}
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group rounded-lg overflow-hidden border border-ir-border shrink-0 ${img.id === lastAddedId ? "reference-card-insert" : ""} ${removingIds.has(img.id) ? "wrs-row-removing pointer-events-none" : ""}`}
                    style={{ width: 72, height: 72, animationDelay: img.id === lastAddedId ? `${GALLERY_TILE_DELAY_MS}ms` : undefined }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.name}
                      draggable={false}
                      className="w-full h-full object-cover block select-none wrs-no-callout"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    <button
                      onClick={() => removeImage(img.id)}
                      aria-label="ลบรูปภาพนี้"
                      className="absolute -top-0.5 -left-0.5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-[opacity,transform] hover:bg-red-500 active:bg-red-500 active:scale-90"
                      style={{ width: 24, height: 24 }}
                    >
                      <IconClose width={8} height={8} />
                    </button>
                    <button
                      onClick={() => setNoteEditing(noteEditing === img.id ? null : img.id)}
                      aria-label={img.note ? "แก้ไขโน้ต" : "เพิ่มโน้ต"}
                      className={`absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center transition-[opacity,transform] active:scale-90 ${
                        noteEditing === img.id
                          ? "bg-ir-accent text-ir-on-accent opacity-100"
                          : "bg-black/50 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/70 active:bg-black/70"
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      <IconEdit width={8} height={8} />
                    </button>
                    {img.note && noteEditing !== img.id && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-ir-accent ring-1 ring-white/70" />
                    )}
                  </div>
                ))}
              </div>

              {/* Inline note editor — appears right under the gallery for whichever tile's
                  note button was just pressed. A slim panel rather than an in-tile popover:
                  tiles are only 72px, far too small to host a text field, and a popover would
                  overlap whatever sits next to it in this wrapping grid. */}
              {(() => {
                const editingUrl = urls.find((u) => u.id === noteEditing);
                const editingImage = images.find((img) => img.id === noteEditing);
                if (!editingUrl && !editingImage) return null;
                return (
                  <div className="mt-3 rounded-xl border border-ir-accent/30 bg-ir-accent/[0.04] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {editingUrl ? (
                        <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: URL_THUMB_THEMES[0] }}>
                          <IconGlobe width={10} height={10} className="text-white/80" />
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editingImage!.src} alt="" className="w-6 h-6 rounded-md object-cover shrink-0" />
                      )}
                      <span className="text-[11.5px] font-medium text-ir-t2 truncate flex-1">
                        {editingUrl ? domainOf(editingUrl.value) : editingImage!.name}
                      </span>
                      <button
                        onClick={() => setNoteEditing(null)}
                        aria-label="ปิดการแก้ไขโน้ต"
                        className="text-ir-t3 hover:text-ir-t1 active:text-ir-t1 shrink-0"
                      >
                        <IconClose width={9} height={9} />
                      </button>
                    </div>
                    <textarea
                      autoFocus
                      rows={2}
                      value={editingUrl ? (editingUrl.note ?? "") : (editingImage!.note ?? "")}
                      onChange={(e) =>
                        editingUrl ? updateUrlNote(editingUrl.id, e.target.value) : updateImageNote(editingImage!.id, e.target.value)
                      }
                      placeholder="โน้ตเพิ่มเติม เช่น ชอบสีพื้นหลัง, ชอบฟอนต์หัวข้อ..."
                      className="w-full bg-ir-card border border-ir-border rounded-lg text-[12.5px] text-ir-t1 placeholder:text-ir-t3 outline-none focus:border-ir-accent/50 px-3 py-2 resize-none"
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Image upload — centered dropzone, standard upload-card pattern ── */}
        <div className="order-3 md:order-2">
          <p className="text-[12px] font-semibold text-ir-t2 mb-2">
            รูปภาพที่ชอบ <span className="font-normal text-ir-t3">(ไม่บังคับ)</span>
          </p>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDropZoneDragOver}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDropZoneDrop}
            className={`flex flex-col items-center text-center gap-1.5 rounded-2xl border-2 border-dashed cursor-pointer px-5 py-6 mb-6 transition-colors select-none ${
              isDragOver ? "border-ir-accent bg-ir-accent/[0.06]" : "border-ir-border bg-ir-card hover:border-ir-accent/40 hover:bg-ir-accent/[0.03] active:border-ir-accent/40 active:bg-ir-accent/[0.03]"
            }`}
          >
            <span className="w-10 h-10 rounded-xl bg-ir-accent/10 flex items-center justify-center text-[18px] mb-1">🖼️</span>
            <p className="text-[13.5px] font-semibold text-ir-t1">ลากรูปมาวางที่นี่</p>
            <p className="text-[12px] text-ir-t3">หรือ <span className="text-ir-accent-text font-medium">เลือกจากเครื่อง</span></p>
            <p className="text-[10.5px] text-ir-t3">รองรับ PNG, JPG, WEBP · เพิ่มได้หลายรูปพร้อมกัน</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mode picker — replaces the old "both sections shown, loser dims" layout. The
// customer commits to one path up front (their own references, or AI-curated examples)
// and only that section renders below — the other path's data (if any) is kept, not
// cleared, so switching back and forth never loses work already done in it.
function ReferenceModePicker({ mode, setMode, hasCustom, hasCurated }: { mode: "custom" | "curated" | null; setMode: (m: "custom" | "curated") => void; hasCustom: boolean; hasCurated: boolean }) {
  const OPTIONS: { id: "custom" | "curated"; title: string; desc: string; hasData: boolean }[] = [
    { id: "custom", title: "วางลิงก์หรือรูปเว็บที่ชอบ", desc: "มีเว็บหรือรูปในใจอยู่แล้ว อยากให้ AI ดูของจริง", hasData: hasCustom },
    { id: "curated", title: "ให้ AI ช่วยหาเว็บไซต์ตัวอย่าง", desc: "ยังไม่มีตัวอย่างในใจ ให้ทีม IR Plus คัดมาให้เลือก", hasData: hasCurated },
  ];
  return (
    <div className="mb-6">
      {mode === null && <p className="text-[14px] text-ir-t3 mb-3">เลือกวิธีที่สะดวกสำหรับคุณ — สลับไปอีกแบบได้ทุกเมื่อ ไม่หายกัน</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.id}
            icon={OPTION_ICONS[o.id]}
            title={o.title}
            desc={o.desc}
            selected={mode === o.id}
            onSelect={() => setMode(o.id)}
            tag={o.hasData && mode !== o.id ? <OptionTag>มีข้อมูลอยู่แล้ว</OptionTag> : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── S5: AI leads with its understanding, customer only reacts ──────────────
// Reversed interaction model — instead of asking customers to supply inspiration
// first, AI already picked the Design Direction — this step is one optional enrichment
// path, picked up front via ReferenceModePicker. Skipping the whole step is still fine.
function S5DesignBlueprint({ go, draft, updateDraft }: any) {
  // Add-confirmation is handled entirely by the floating preview (FloatingPreviewToast) at
  // every width — see its note. This step deliberately owns no in-flow notification slot:
  // one reserved a permanent empty band between the step header and the first section.
  const ai = draft?.designProfile ? profileToDirection(draft.designProfile) : null;
  const ranked = draft?.industry ? rankDirections(draft.industry, draft.companyType, draft.businessGoals) : [];
  const dir = (draft?.selectedDirection && directionById(draft.selectedDirection)) || ai?.direction || (ranked[0] && directionById(ranked[0].id));

  const hasCustom = (draft?.references?.length ?? 0) > 0;
  const hasCurated = (draft?.curatedSelected?.length ?? 0) > 0;
  // Persisted on draft so leaving and returning to this step remembers the choice. Never
  // defaulted to either option on a genuinely fresh draft — only inferred from content
  // that already exists, so a first-time visitor sees the picker, not a path pre-chosen
  // for them.
  const mode: "custom" | "curated" | null = draft?.referenceMode ?? (hasCustom ? "custom" : hasCurated ? "curated" : null);
  const setMode = (m: "custom" | "curated") => updateDraft({ referenceMode: m });

  return (
    <div>
      <Head
        n={5}
        title="เพิ่มเติมแรงบันดาลใจ"
        sub="ขั้นตอนนี้เป็นทางเลือกเสริม ไม่จำเป็นต้องทำก็ได้ เลือกวิธีที่สะดวก หรือข้ามไปเลยก็ได้"
      />

      <ReferenceModePicker mode={mode} setMode={setMode} hasCustom={hasCustom} hasCurated={hasCurated} />

      {mode === "custom" && (
        <div className="mb-6">
          <SectionLabel>วางลิงก์หรือรูปเว็บที่ชอบ</SectionLabel>
          <ReferenceEditor draft={draft} updateDraft={updateDraft} />
        </div>
      )}

      {mode === "curated" && (
        <div className="mb-6 md:mb-8">
          <SectionLabel>ให้ AI ช่วยหาเว็บไซต์ตัวอย่าง</SectionLabel>
          <CuratedReferenceBoard dir={dir} draft={draft} updateDraft={updateDraft} />
        </div>
      )}

      <StepNav
        onBack={() => go(4)}
        next={<NextButton onClick={() => go(6)}>ถัดไป</NextButton>}
      />
    </div>
  );
}

// AI-recommended Google font pairing per direction — heading paired with a neutral body
// on a contrast axis (serif/geometric heading + humanist body), all free on Google Fonts.
// `thai` is the Thai heading face matched to each Latin heading's character (serif with
// serif, geometric with geometric) — the Latin fonts carry no Thai glyphs.
const FONT_PAIRINGS: Record<string, { heading: string; thai: string; body: string; note: string }> = {
  "premium-corporate": { heading: "Fraunces", thai: "Noto Serif Thai", body: "Inter", note: "Serif ที่ดูมีระดับ คู่กับ Sans ที่อ่านง่าย" },
  "esg-focused":       { heading: "Manrope", thai: "Anuphan", body: "Inter", note: "Humanist sans อบอุ่น เป็นมิตร" },
  "modern-tech":       { heading: "Space Grotesk", thai: "Bai Jamjuree", body: "Inter", note: "Geometric sans ทันสมัย มีเอกลักษณ์" },
  "growth-oriented":   { heading: "Sora", thai: "Kanit", body: "Inter", note: "Grotesk เน้นความชัดของตัวเลข" },
};
const DEFAULT_PAIRING = { heading: "Manrope", thai: "Anuphan", body: "Inter", note: "คู่ฟอนต์อเนกประสงค์ อ่านง่ายทุกขนาด" };

// CSS variables set by next/font in the root layout for every font FONT_PAIRINGS names.
const FONT_VARS: Record<string, string> = {
  Fraunces: "--font-fraunces",
  Manrope: "--font-manrope",
  "Space Grotesk": "--font-space-grotesk",
  Sora: "--font-sora",
  Inter: "--font-inter",
  "Noto Serif Thai": "--font-noto-serif-thai",
  Anuphan: "--font-anuphan",
  "Bai Jamjuree": "--font-bai-jamjuree",
  Kanit: "--font-kanit",
};

/** font-family for a pairing font — the loaded next/font face, then a system fallback. */
function fontStack(name: string) {
  const v = FONT_VARS[name];
  return `${v ? `var(${v})` : `"${name}"`}, system-ui, sans-serif`;
}

// Perceptual lightness of a hex — decides readable ink on a swatch.
function isLightHex(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150;
}

// Map the direction's palette into named swatches (name from the "X & Y" palette label).
function namedPalette(dir: any): { hex: string; name: string; main: boolean }[] {
  const colors: string[] = dir?.colors ?? ["#151823", "#AACC00", "#FFFFFF"];
  const parts = String(dir?.palette ?? "").split(/\s*&\s*/);
  const fallback = ["Primary", "Accent", "Surface"];
  return colors.slice(0, 3).map((hex, i) => ({
    hex: hex.toUpperCase(),
    name: (parts[i] || fallback[i] || `Color ${i + 1}`).trim(),
    main: i === 0,
  }));
}

const NEUTRAL_RAMP = ["#F5F5F5", "#D9DBDE", "#B4B7BD", "#8A8F99", "#5A5F6B", "#33383F", "#151823"];

// Typography specimen figures — a spread of numeral punctuation (comma, decimal, %, ฿,
// hyphen) so the heading font's numeral rendering actually gets exercised, not just its
// letterforms. Illustrative only, not real figures for the client's company.
const TYPE_SPECIMEN_STATS = [
  { value: "1,284.50", label: "SET Index" },
  { value: "+12.4%", label: "YoY Growth" },
  { value: "฿8.20", label: "Dividend/Share" },
  { value: "56-1", label: "One Report" },
];

// Direction icon — a small glyph that carries the concept's own meaning (institutional
// trust, growth in numbers, sustainability, technology) instead of an inert color dot.
// A soft color-wash "glow" sits behind every glyph (same treatment across all four
// directions) so the icon reads with some depth/presence rather than a flat line-drawing —
// the glyph itself should still communicate the concept on its own at a glance.
function ConceptIcon({ directionId, color }: { directionId?: string; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const glow = <circle cx="9" cy="9" r="8.5" fill={color} opacity="0.14" />;
  switch (directionId) {
    case "esg-focused":
      return (
        <svg width="24" height="24" viewBox="0 0 18 18">
          {glow}
          <path d="M9 16c-3.5-1.2-6-4-6-8 0-2 .6-3.6 1.6-5C6.6 5 9 5.5 11 7c2 1.5 3 3.7 3 6 0 1-.3 2-.8 2.8" {...stroke} />
          <path d="M9 16V8c0-1.6.7-2.8 1.8-3.8" {...stroke} />
        </svg>
      );
    case "modern-tech":
      return (
        <svg width="24" height="24" viewBox="0 0 18 18">
          {glow}
          <path d="M10.2 2.5 4.5 10.2h4L7.8 15.5l6-8h-4.1l1.5-5z" fill={color} />
        </svg>
      );
    case "growth-oriented":
      return (
        <svg width="24" height="24" viewBox="0 0 18 18">
          {glow}
          <path d="M3 13.5 7.2 9l3 3 4.8-5.5" {...stroke} />
          <path d="M11.5 6h3.5v3.5" {...stroke} />
          <circle cx="7.2" cy="9" r="1.15" fill={color} />
          <circle cx="10.2" cy="12" r="1.15" fill={color} />
          <circle cx="3" cy="13.5" r="1.15" fill={color} />
        </svg>
      );
    case "premium-corporate":
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 18 18">
          {glow}
          <path d="M9 2 11 6.5 16 7 12.3 10.3 13.3 15 9 12.6 4.7 15l1-4.7L2 7l5-.5z" fill={color} />
        </svg>
      );
  }
}

// ── Concept board — the design-system "concept" the client co-authored, mapped from
// their real choices (Direction palette + AI font pairing + UI-styling profile). Bento
// principles from /design-bentogrids-com: mixed tile sizes, generous 12px-based spacing,
// rounded surfaces, one clear hierarchy — not its literal colors/fonts. ──
function ConceptBoard({ draft }: { draft: any }) {
  const dir = directionById(draft.selectedDirection);
  const pairing = FONT_PAIRINGS[draft.selectedDirection] ?? DEFAULT_PAIRING;

  const p: DesignProfile | undefined = draft.designProfile;
  const dataDriven = p?.densityData ?? 0;
  const swatches = namedPalette(dir);
  const primary = swatches[0]?.hex ?? "#151823";
  // 6-swatch palette card: the 3 named brand colors plus ink/neutral/surface, echoing the
  // reference layout's mixed brand + support-tone grid rather than only the brand 3.
  const paletteSwatches = [...swatches.map((s) => s.hex), NEUTRAL_RAMP[6], NEUTRAL_RAMP[3], "#FFFFFF"];

  // The exact structure picked in "วางโครงสร้าง" (Structure step), in the order the
  // client arranged it — this board should mirror that decision, not restate it.
  const homepageSections = ((draft.selectedSections as string[] | undefined) ?? [])
    .map((id) => ({ id, name: sectionById(id)?.name ?? id }));

  const eyebrow = "text-[10px] font-semibold uppercase tracking-wider text-ir-t3";
  // Mobile gets a tighter vertical rhythm between subsections — this board is the
  // longest single scroll in the flow, and it previously carried the same rhythm at
  // every width (no `md:` overrides anywhere in this component).
  const sectionRule = "flex items-center gap-3 mt-5 md:mt-6 mb-2.5 md:mb-3 first:mt-0";

  const GoogleTag = () => (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ir-t3">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z"/><path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.4l3.8 3C6.5 6.7 9 4.8 12 4.8z"/></svg>
      Google · ฟรี
    </span>
  );

  // The customer's own Explore picks, in question order — the moodboard is built from
  // these. Drafts from before quizPicks existed fall back to the industry stock shots.
  const picked = ((draft.quizPicks ?? []) as { questionId: string; letter: "A" | "B" }[])
    .map((pk) => {
      const q = QUIZ.find((x) => x.id === pk.questionId);
      return q ? (pk.letter === "A" ? q.optionA : q.optionB) : undefined;
    })
    .filter((o): o is QuizOption => !!o);
  // Light/Dark comes straight from the tone question (q2) — the Mood panel follows it
  // instead of always rendering on the dark brand gradient.
  const q2 = (draft.quizPicks ?? []).find((pk: { questionId: string }) => pk.questionId === "q2");
  const prefersLight = q2 ? q2.letter === "A" : (p?.contrastDark ?? 0) < 0; // q2: A = สว่าง, B = เข้ม

  // Compact imagery — a few tuned shots, not a 9-tile wall.
  const shots: { role: ImageRole; seed: number }[] = [
    { role: "hero", seed: 0 }, { role: "executive", seed: 1 },
    { role: dataDriven >= 0 ? "investor" : "esg", seed: 1 }, { role: "team", seed: 2 },
  ];

  return (
    <div className="rounded-[20px] border border-ir-border bg-ir-card ir-shadow overflow-hidden">
      {/* Header strip — Direction name is the actual content here, so it carries the
          weight; "Concept" is just the eyebrow label identifying what this card is. */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 md:px-5 md:py-4 border-b border-ir-border">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ background: `linear-gradient(135deg, ${primary}26, ${primary}08)`, borderColor: `${primary}30` }}
        >
          <ConceptIcon directionId={draft.selectedDirection} color={primary} />
        </span>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ir-t3">ภาพรวมโปรเจกต์</span>
          <p className="text-[19px] font-semibold text-ir-t1 leading-tight mt-0.5">{dir?.label ?? "Design Direction"}</p>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {/* ── Mood anchor — the emotional hero: real imagery paired with the personality
            words set in the actual heading typeface, over the direction's own brand
            gradient. One large visual the eye lands on first (bento anchor principle
            from /design-bentogrids-com). ── */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {picked.length > 0 ? (
            // Moodboard from the customer's own picks — the first-question pick (overall
            // impression) leads, the other four sit underneath as a strip.
            <div className="sm:col-span-3 flex flex-col gap-1.5">
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/[0.06]" style={{ paddingTop: "56.42%" }}>
                <div className="absolute inset-0"><ExploreMock id={picked[0].mock} /></div>
                <span className="absolute left-3 bottom-3 rounded-full bg-ir-dark/75 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">จากแนวทางที่คุณเลือก</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {picked.slice(1).map((o) => (
                  <div key={o.mock} className="relative overflow-hidden rounded-[10px] ring-1 ring-black/[0.06]" style={{ paddingTop: "56.42%" }} title={o.label}>
                    <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Feeling photo — 4:3, tinted with the brand gradient (drafts without quiz picks) */
            <div className="sm:col-span-3 rounded-2xl overflow-hidden relative ring-1 ring-black/[0.06]" style={{ aspectRatio: "4/3" }}>
              <div className="absolute inset-0" style={{ background: bgImage(photo("hero", draft.industry, 0, 720, 540), dir?.bg ?? `linear-gradient(135deg,${primary},${primary})`, 0.12), backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-1.5">
                {swatches.map((s) => <span key={s.hex} className="w-4 h-4 rounded-full ring-1 ring-white/40" style={{ background: s.hex }} />)}
              </div>
            </div>
          )}
          {/* Mood panel — mood words in the heading font. Dark brand gradient when the
              customer chose "เข้ม" (Dark); a light surface with brand-colored type when they
              chose "สว่าง" (Light), so the board matches the tone they asked for. */}
          <div
            className={`sm:col-span-2 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden ${prefersLight ? "border border-ir-border bg-ir-bg" : ""}`}
            style={prefersLight ? { minHeight: 120 } : { background: dir?.bg ?? primary, color: "#fff", minHeight: 120 }}
          >
            <span className={`text-[12px] font-semibold uppercase tracking-wider ${prefersLight ? "text-ir-t3" : "text-white/70"}`}>
              Mood · {prefersLight ? "Light" : "Dark"}
            </span>
            <div className="flex flex-col gap-0.5 my-2">
              {(dir?.mood ?? ["Professional & Clean"]).map((m) => (
                <span key={m} className={`text-[21px] leading-tight font-semibold ${prefersLight ? "" : "drop-shadow-sm"}`} style={{ fontFamily: fontStack(pairing.heading), color: prefersLight ? primary : undefined }}>{m}</span>
              ))}
            </div>
            {dir?.tagline && <span className={`text-[13px] leading-snug ${prefersLight ? "text-ir-t2" : "text-white/80"}`}>{dir.tagline}</span>}
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              {swatches.map((s) => <span key={s.hex} className={`w-5 h-5 rounded-full ring-1 ${prefersLight ? "ring-black/10" : "ring-white/40"}`} style={{ background: s.hex }} />)}
            </div>
          </div>
        </div>

        {/* ── Colors — solid swatch + hex only, no ramp bar / name chips ── */}
        <div className={sectionRule}><span className="text-[15px] font-semibold text-ir-t1">Colors</span><div className="flex-1 h-px bg-ir-border" /></div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {paletteSwatches.map((hex, i) => (
            <div key={`${hex}-${i}`} className="rounded-xl overflow-hidden ring-1 ring-black/[0.06]">
              <div style={{ background: hex, aspectRatio: "1/1" }} />
              <p className="text-[10px] font-mono text-ir-t3 text-center py-1.5">{hex}</p>
            </div>
          ))}
        </div>

        {/* ── Typography — font pairing + description, then a real-content specimen
            (headline/body/CTA + numeral-heavy stat tiles) so the choice reads as how it
            will actually look, not just an isolated font-name label. ── */}
        <div className={sectionRule}><span className="text-[15px] font-semibold text-ir-t1">Typography</span><div className="flex-1 h-px bg-ir-border" /></div>
        <div className="rounded-2xl border border-ir-border p-4 md:p-5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[26px] sm:text-[30px] text-ir-t1 leading-tight" style={{ fontFamily: fontStack(pairing.heading), fontWeight: 700 }} title={pairing.heading}>
              {pairing.heading}
            </p>
            <span className="text-ir-t3 text-[13px]">+</span>
            <p className="text-[22px] sm:text-[24px] text-ir-t1 leading-tight" style={{ fontFamily: fontStack(pairing.thai), fontWeight: 700 }} title={pairing.thai}>
              {pairing.thai}
            </p>
            <span className="text-ir-t3 text-[13px]">+</span>
            <p className="text-[18px] text-ir-t2" style={{ fontFamily: fontStack(pairing.body), fontWeight: 500 }} title={pairing.body}>
              {pairing.body}
            </p>
          </div>
          <p className="text-[13px] text-ir-t2 leading-relaxed mt-2 max-w-[560px]">
            {pairing.heading} สำหรับหัวข้อภาษาอังกฤษ คู่กับ {pairing.thai} สำหรับหัวข้อภาษาไทย และ {pairing.body} สำหรับเนื้อหา — {pairing.note}
          </p>
          <div className="mt-2"><GoogleTag /></div>

          <div className="mt-4 pt-4 border-t border-ir-border grid grid-cols-1 sm:grid-cols-[1.1fr,1.3fr] gap-4">
            <div>
              <span className={eyebrow}>ตัวอย่าง</span>
              {/* Thai headline in the pairing's Thai face; body copy stays on the app's
                  IBM Plex Sans Thai (Inter, the body pairing, has no Thai glyphs). */}
              <p className="text-ir-t1 leading-tight mt-1.5" style={{ fontFamily: fontStack(pairing.thai), fontWeight: 700, fontSize: "clamp(20px, 5vw, 26px)" }}>
                นักลงทุนสัมพันธ์
              </p>
              <p className="text-[13px] text-ir-t2 leading-relaxed mt-1.5">
                มุ่งมั่นสร้างการเติบโตอย่างยั่งยืน ด้วยข้อมูลที่โปร่งใสและเชื่อถือได้สำหรับผู้ถือหุ้นทุกท่าน
              </p>
              <button
                type="button"
                className="mt-3 text-[12.5px] font-semibold px-4 py-2 rounded-full"
                style={{ background: primary, color: isLightHex(primary) ? "#151823" : "#fff" }}
              >
                รายละเอียดเพิ่มเติม
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {TYPE_SPECIMEN_STATS.map((s) => (
                <div key={s.label} className="rounded-xl bg-ir-bg border border-ir-border px-3 py-2.5">
                  <p className="text-[19px] text-ir-t1 leading-none" style={{ fontFamily: fontStack(pairing.heading), fontWeight: 700 }}>{s.value}</p>
                  <p className="text-[10.5px] text-ir-t3 mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── IR Homepage Sections — the exact structure picked in "วางโครงสร้าง", in the
            order the client arranged it. ── */}
        <div className={sectionRule}>
          <span className="text-[15px] font-semibold text-ir-t1">IR Homepage Sections</span>
          {homepageSections.length > 0 && <span className="text-[11px] text-ir-t3 shrink-0">{homepageSections.length} sections</span>}
          <div className="flex-1 h-px bg-ir-border" />
        </div>
        {homepageSections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {homepageSections.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-xl border border-ir-border px-3 py-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-ir-accent/15 text-ir-accent-text text-[11px] font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[12.5px] text-ir-t1 leading-snug truncate" title={s.name}>{s.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-ir-t3">ยังไม่ได้เลือก Section — กลับไปที่ขั้นตอน &quot;วางโครงสร้าง&quot; เพื่อเลือก</p>
        )}

        {/* ── Visual Style — industry stock strip, only for drafts without quiz picks (the
            moodboard above already shows the customer's own imagery otherwise) ── */}
        {picked.length === 0 && (
          <>
            <div className={sectionRule}><span className="text-[15px] font-semibold text-ir-t1">Visual Style</span><span className="text-[11px] text-ir-t3 truncate">{draft.industry || "องค์กรของคุณ"}</span><div className="flex-1 h-px bg-ir-border" /></div>
            <div className="grid grid-cols-4 gap-2.5">
              {shots.map((s, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-ir-border" style={{ aspectRatio: "4/3" }}>
                  <div className="w-full h-full" style={{ background: bgImage(photo(s.role, draft.industry, s.seed, 240, 180), "linear-gradient(135deg,#1f2937,#111827)"), backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── S6 · Deliver references + finalize + submit ──
function S6Deliver({ go, draft, updateDraft, submit, addTimelineEntry, addNotebookEntry, router }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const contactErrors = {
    name: draft.name.trim() ? "" : "กรุณากรอกชื่อ-นามสกุล",
    email: emailError(draft.email),
    phone: phoneError(draft.phone),
  };
  const showError = (field: keyof typeof contactErrors) => (touched[field] || attempted) ? contactErrors[field] : "";
  const markTouched = (field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  const canSubmit = !contactErrors.name && !contactErrors.email && !contactErrors.phone && draft.company;
  const s6GapFired = useRef(false);
  useEffect(() => {
    if (s6GapFired.current) return;
    s6GapFired.current = true;
    const gaps: { title: string; body: string }[] = [];
    if (!draft.selectedSections || draft.selectedSections.length < 4) gaps.push({ title: "Section น้อยกว่า 4 รายการ", body: "ควรเพิ่มเพื่อ Scope ที่ครบถ้วน" });
    if (!draft.comments?.trim()) gaps.push({ title: "ไม่มี Comment พิเศษ", body: "เพิ่มหมายเหตุให้ทีมออกแบบจะช่วยลด Revision รอบแรกได้" });
    if (!draft.website?.trim()) gaps.push({ title: "ไม่มี URL เว็บไซต์เดิม", body: "ถ้ามีเว็บอยู่แล้ว ใส่ไว้ให้ AI วิเคราะห์ Reference ได้" });
    for (const gap of gaps) {
      addNotebookEntry?.({
        step: 5, category: "gap", source: "ai",
        title: gap.title,
        body: gap.body,
        tags: ["gap", "pre-submit"],
      });
    }
    if (draft.selectedSections?.length > 0) {
      addNotebookEntry?.({
        step: 5, category: "recommendation", source: "ai",
        title: `${draft.selectedSections.length} Sections พร้อม Submit`,
        body: `เลือก ${draft.selectedSections.length} Section แล้ว ทีมออกแบบจะใช้ข้อมูลนี้สร้าง Sitemap และ Wireframe เบื้องต้นให้คุณ`,
        tags: ["sections", "sitemap", "ready"],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    addTimelineEntry?.({
      step: 5, type: "submitted",
      decision: `Requirement ส่งแล้ว ${draft.company}`,
      reasoning: `${draft.directionLabel || "Direction ที่เลือก"} · ${draft.selectedSections.length} Sections · ส่งโดย ${draft.name || draft.email} ทีม IR Plus จะติดต่อกลับภายใน 1-2 วันทำการ`,
    });
    addNotebookEntry?.({
      step: 5, category: "insight", source: "system",
      title: "Requirement ส่งเรียบร้อย",
      body: `${draft.company} · ${draft.directionLabel || draft.selectedDirection} · ${draft.selectedSections.length} Sections · ผู้ส่ง: ${draft.name || draft.email} Notebook นี้จะถูกแนบไปกับ Requirement เพื่อให้ทีมมีบริบทครบถ้วน`,
      tags: ["submitted", draft.industry, draft.directionLabel].filter(Boolean),
    });
    setTimeout(() => {
      const id = submit();
      if (id) router.push(`/status/${id}`);
    }, 750);
  };

  const g = useGuide("analyst");

  // Long hesitation nudge if contact fields still empty after 15 s
  const shownHesitation = useRef(false);
  useHesitation(15000, () => {
    if (shownHesitation.current || canSubmit) return;
    shownHesitation.current = true;
    const missing = !draft.name ? "ชื่อ-นามสกุล" : !draft.email ? "Email" : "ข้อมูลติดต่อ";
    g.show(`ใกล้เสร็จแล้วครับ ใส่ ${missing} เพิ่มก็ Submit ได้เลย`, { mode: "tip", expert: "analyst", autohide: 10000 });
  });

  const onBlockedSubmit = () => {
    if (canSubmit) return;
    setAttempted(true);
    setTouched({ name: true, email: true, phone: true });
    if (contactErrors.name) g.show("ใส่ชื่อ-นามสกุลด้วยนะครับ เพื่อให้ทีมออกแบบรู้ว่าจะติดต่อใครครับ", { mode: "tip", expert: "analyst" });
    else if (contactErrors.email) g.show(!draft.email.trim() ? "ใส่ Email ด้วยนะครับ เราจะส่ง Blueprint สรุปและ Next Steps ไปให้ทางนี้ครับ" : "รูปแบบ Email ไม่ถูกต้องครับ ลองเช็คอีกทีนะครับ", { mode: "tip", expert: "analyst" });
    else if (contactErrors.phone) g.show("รูปแบบเบอร์โทรไม่ถูกต้องครับ ลองเช็คอีกทีนะครับ", { mode: "tip", expert: "analyst" });
    else g.show("ใส่ชื่อบริษัทด้วยนะครับ", { mode: "tip", expert: "analyst" });
  };

  return (
    <div>
      {/* Header — full width above the two columns. Same title role as every other step's
          `Head()` (size, mobile/desktop spacing) even though this step's own body breaks
          into its wide two-column layout right below. No divider line for the same reason
          `Head()` no longer has one — the heading is already visually distinct. */}
      <div className="mb-4 pb-4 md:mb-5 md:pb-5">
        <h2 className="text-[24px] font-semibold text-ir-t1 tracking-tight leading-tight" style={{ textWrap: "balance" } as CSSProperties}>ส่งมอบ</h2>
        <p className="text-[16px] text-ir-t2 leading-relaxed mt-2">ตรวจสอบภาพรวมโปรเจกต์ที่คุณและ AI ร่วมกันกำหนด แล้วยืนยันเพื่อส่งให้ทีม IR Plus</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT: project overview (main visual) ── */}
        <div className="flex-1 min-w-0 w-full">
          <ConceptBoard draft={draft} />
        </div>

        {/* ── RIGHT: contact + confirm CTA (sticky sidebar) ── */}
        <aside className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-4 space-y-4">
          {/* Contact */}
          <div className="rounded-[20px] border border-ir-border bg-ir-card px-5 pt-5 pb-6 ir-shadow">
            <p className="text-[15px] font-semibold text-ir-t1 mb-1">ข้อมูลติดต่อ</p>
            <p className="text-[13px] text-ir-t3 mb-4">ทีม IR Plus จะติดต่อกลับภายใน 1-2 วันทำการ</p>
            {/* space-y-4 (not -3) — these are three distinct fields, not tightly related
                sub-parts of one field, so they get a touch more breathing room between them. */}
            <div className="space-y-4">
              <F label="ชื่อ-นามสกุล *" value={draft.name} onChange={(v) => updateDraft({ name: v })} onBlur={() => markTouched("name")} error={showError("name")} placeholder="คุณสมชาย ใจดี" autoComplete="name" />
              <F label="Email *" type="email" autoComplete="email" value={draft.email} onChange={(v) => updateDraft({ email: sanitizeEmailInput(v) })} onBlur={() => markTouched("email")} error={showError("email")} placeholder="somchai@company.com" />
              <F label="โทรศัพท์" type="tel" autoComplete="tel" value={draft.phone} onChange={(v) => updateDraft({ phone: sanitizePhoneInput(v) })} onBlur={() => markTouched("phone")} error={showError("phone")} placeholder="08X-XXX-XXXX" />
            </div>
            <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mt-4 mb-0" />
          </div>

          {/* Confirm + submit — one CTA, since "confirm" and "submit" were saying the
              same thing to the customer. The confirm copy now lives as a caption below
              the button instead of its own separate checkbox card. */}
          <div className="rounded-[20px] border border-ir-border bg-ir-card p-5 ir-shadow">
            <div onClick={onBlockedSubmit}>
              <button
                onClick={doSubmit}
                disabled={!canSubmit || submitting}
                // Same black pill + lime arrow disc as the landing CTA — this is the flow's
                // final primary action. Disabled keeps a readable label on a gray fill.
                className={`group w-full flex items-center justify-between gap-3 h-[52px] rounded-full pl-6 pr-2 text-[15px] font-semibold transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 ${
                  canSubmit && !submitting
                    ? "text-white bg-ir-dark hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
                    : "bg-ir-border text-ir-t3 cursor-not-allowed"
                }`}
              >
                {submitting ? "กำลังส่ง..." : "ยืนยันและส่งให้ทีม IR Plus"}
                <span className={`grid w-9 h-9 place-items-center rounded-full transition-transform duration-200 ${canSubmit && !submitting ? "bg-ir-accent text-ir-on-accent group-hover:translate-x-0.5" : "bg-ir-muted text-ir-t3"}`}>
                  <IconArrowRight width={24} height={24} />
                </span>
              </button>
            </div>
            <p className="text-[13px] text-ir-t3 text-center leading-relaxed mt-3">
              ฉันตรวจสอบภาพรวมโปรเจกต์แล้ว และยืนยันส่งให้ทีม IR Plus
            </p>

            <div className="flex justify-center mt-4">
              <BackButton onClick={() => go(5)}>ย้อนกลับ</BackButton>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function F({
  label, value, onChange, onBlur, error, placeholder, type = "text", autoComplete,
}: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string; placeholder?: string; type?: string; autoComplete?: string }) {
  return (
    <div>
      <label className="text-[13px] font-medium block mb-1.5">{label}</label>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={`w-full border rounded-xl px-3 py-3 text-[14px] outline-none transition-colors ${error ? "border-red-400 focus:border-red-500" : "border-ir-border focus:border-ir-accent"}`}
      />
      {error && <p className="text-[12px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}
