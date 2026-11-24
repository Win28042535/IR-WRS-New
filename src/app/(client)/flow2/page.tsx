"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { BUSINESS_GOALS, QUIZ, REFERENCE_LIKES, RULES, REQUIRED_SECTION_IDS, IR_AUDIENCES, FLOW_STEPS, FLOW_STEPS_EN, CONTACT_DAYS, STEP_SCHEME, SUGGESTED_AUDIENCES, SUGGESTED_GOALS, audienceIsSuggested, goalsAreSuggested, flowStepOf, siteHostOf, audienceById, directionById, sectionById } from "@/lib/data";
import { rankDirections, buildProfile, profileToDirection, rankProfileDirections } from "@/lib/recommend";
import { StepIndicator, SectionLabel, SectionDivider, RequiredMark, StepNav, NextButton, BackButton, OptionCard, OptionTag, SelectDot, FieldError, useNudge } from "@/components/ui";
import { IconCheck, IconClose, IconPalette, IconSparkle, IconPlus, IconArrowRight, IconExternalLink, IconGlobe, OPTION_ICONS } from "@/components/icons";
import { ExploreMock } from "@/components/ExploreMock";
import { RankPicker, PickCount } from "@/components/RankPicker";
import { StructureBuilder, STRUCTURE_MIN_OPTIONAL, isRecommendedHomepage } from "@/components/StructureBuilder";
import { FONT_PAIRINGS, DEFAULT_PAIRING } from "@/lib/fonts";
import { BackToTop } from "@/components/BackToTop";
import { familyStack, fontByFamily, previewFamily } from "@/lib/fontCatalog";
import { useGoogleFont } from "@/lib/useGoogleFont";
import { FontPickerSheet, FontPreviewSheet } from "@/components/FontPicker";
import { NoteField } from "@/components/NoteField";
import { CoDeciders } from "@/components/CoDeciders";
import type { DesignProfile, QuizOption } from "@/lib/types";
import { SaveSheetButton } from "@/components/SaveSheetButton";
import type { SheetView } from "@/lib/moodboardExport";
import { ProjectOverview } from "@/components/ProjectOverview";
import { PageLoader, Spinner } from "@/components/Loader";
import AIJourneyGuide from "@/components/AIJourneyGuide";
import { useGuide } from "@/hooks/useGuide";
import { useHesitation } from "@/hooks/useHesitation";
import { ProjectContextProvider } from "@/components/ProjectContextProvider";
import { useProjectContext } from "@/hooks/useProjectContext";
import { usePreviewPanel } from "@/components/PreviewPanel";
import { useSectionFx } from "@/lib/sectionFx";
import { useFloatingPreview } from "@/lib/floatingPreview";
import { emailError, phoneError, sanitizeEmailInput, sanitizePhoneInput } from "@/lib/validation";
import { DUR, EASE } from "@/lib/motion";
import { onScrollShowBar } from "@/lib/useScrollBar";

// Explore result screen is switched off for now: the last answer goes straight to Structure
// (the Direction is still chosen from the answers). Flip to bring the screen back.
const SHOW_QUIZ_RESULT = false;
// Inspiration step: "ให้ทีมช่วยหาเว็บไซต์ตัวอย่าง" (the curated board) is parked for a later
// phase, so the step goes straight to the link / upload editor. Flip to bring the picker back.
const SHOW_CURATED_REFERENCES = false;

const STEPS = FLOW_STEPS;
const STEPS_EN = FLOW_STEPS_EN;

// Goals offered in the IR flow — the non-IR ones (lead generation, product launch) stay in
// the data for corporate-site projects but aren't shown here.
// Suggested answers first, in the suggested order, so the picked cards read 1, 2, 3 from
// the top on a first visit; the rest keep their order below.
const suggestedFirst = <T extends { id: string }>(list: T[], ids: string[]) =>
  [...list].sort((a, b) => (ids.includes(a.id) ? ids.indexOf(a.id) : ids.length) - (ids.includes(b.id) ? ids.indexOf(b.id) : ids.length));
const VISIBLE_GOALS = suggestedFirst(BUSINESS_GOALS.filter((g) => !g.hidden), SUGGESTED_GOALS);
const AUDIENCE_LIST = suggestedFirst(IR_AUDIENCES, SUGGESTED_AUDIENCES);


export default function Flow2() {
  const router = useRouter();
  const { draft, startFlow, updateDraft, submit, addTimelineEntry, addNotebookEntry } = useStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizDone, setQuizDone] = useState(false); // last answer given → show the result screen
  const [answers, setAnswers] = useState<{ axis: keyof DesignProfile; option: QuizOption }[]>([]);
  const [dir, setDir] = useState<"forward" | "backward">("forward");
  // Inspiration → summary: a short "putting your answers together" screen, so the next page
  // reads as the result rather than one more form (internal review 19 Nov 2026).
  const [summarizing, setSummarizing] = useState(false);
  const summaryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevStep = useRef(1);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const stepCardRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    setMounted(true);
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
    let resume = flowStepOf(st.draft);
    if (resume > 5 && !st.draft.selectedDirection) resume = 5;
    if (resume > 1) {
      prevStep.current = resume;
      setStep(resume);
    }
    // A finished quiz is kept in the draft, so returning to Explore shows its result.
    if (st.draft.quizPicks?.length === QUIZ.length && st.draft.selectedDirection) {
      if (SHOW_QUIZ_RESULT) setQuizDone(true);
      else {
        // No result screen: come back to the last question, with every earlier answer kept.
        setAnswers(st.draft.quizPicks.map((p, i) => ({ axis: QUIZ[i].axis, option: p.letter === "A" ? QUIZ[i].optionA : QUIZ[i].optionB })));
        setQuizIdx(QUIZ.length - 1);
      }
    }
  }, [startFlow, updateDraft]);

  // Keep the Blueprint panel in sync with current phase (must be before early return)
  useEffect(() => {
    usePreviewPanel.getState().setCurrentStep(step);
  }, [step]);

  // Every new step or quiz question starts at its heading: jump (not smooth-scroll) the
  // questionnaire back to the top so the old scroll offset never carries over, then move
  // focus to the new card so keyboard and screen-reader users land on it too. Skipped on
  // first load so opening the page doesn't steal focus.
  useEffect(() => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }
    // Phones scroll the page itself; from md up the questionnaire column scrolls.
    leftPanelRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    stepCardRef.current?.focus({ preventScroll: true });
  }, [step, quizIdx, quizDone]);

  if (!mounted || !draft) {
    return (
      <PageLoader title="กำลังเตรียมระบบ" />
    );
  }

  const go = (n: number) => {
    if (n === 8 && prevStep.current === 7) {
      if (summarizing) return;
      setSummarizing(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      summaryTimer.current = setTimeout(finishSummary, reduce ? 500 : 2000); // 2 s (23 Nov 2026)
      return;
    }
    goNow(n);
  };

  // the loader ends on its own after 2 s, or straight away on a tap (audit 19 Nov 2026)
  const finishSummary = () => {
    clearTimeout(summaryTimer.current);
    setSummarizing(false);
    goNow(8);
  };

  const goNow = (n: number) => {
    // Back moves a whole step: from a later step, Explore reopens at question 1 (not the
    // last question), with the earlier answers still picked.
    if (n === 5 && prevStep.current > 5 && !SHOW_QUIZ_RESULT) setQuizIdx(0);
    setDir(n > prevStep.current ? "forward" : "backward");
    prevStep.current = n;
    setStep(n);
    updateDraft({ flowStep: n, stepScheme: STEP_SCHEME });
  };

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
      if (SHOW_QUIZ_RESULT) setQuizDone(true);
      else go(6);
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
    {/* Phones: the document scrolls (address bar can collapse, tap-status-bar-to-top works).
        From md up: a fixed-height split workspace whose left column scrolls on its own. */}
    {/* print: drop the fixed-height split and inner scroll, so "บันทึกสรุปเป็น PDF" on the
        deliver step prints the whole summary, not one viewport of it */}
    <div className="flex flex-col md:h-[calc(100dvh-56px)] print:h-auto">
      <GhostFlightLayer />
      <FloatingPreviewToast />
      {summarizing && <SummaryLoader onSkip={finishSummary} />}
      <div className="no-print"><StepIndicator steps={STEPS} stepsEn={STEPS_EN} current={step} /></div>

      {/* ── Full-width split workspace ── */}
      <BackToTop scrollRef={leftPanelRef} threshold={600} />
      <div className="flex-1 min-h-0 flex md:overflow-hidden print:overflow-visible">

        {/* ── Left: scrollable questionnaire ── */}
        <div
          ref={leftPanelRef}
          onScroll={onScrollShowBar}
          className="ir-scroll w-full min-w-0 md:overflow-y-auto print:overflow-visible"
        >
          {/* overflow-x clip: the step card slides in 28px from the side, which briefly made the
              page wider than a phone screen (audit 19 Nov 2026) */}
          {/* the step card fills the screen below the step bar (24 Nov 2026): one height for
              every step, so a short step (ทำความเข้าใจ) no longer leaves an empty band under a
              short card, and Back / Next sit at the card's foot in the same place each time.
              A longer step grows the card and the page scrolls as before. */}
          {/* phones scroll the whole page (no fixed-height panel), so there the fill is the screen
              less the header and step bar (138px). No extra room for the phone bar: it only shows
              while the card's own buttons are off screen. */}
          <div className="flex min-h-[calc(100dvh-138px)] flex-col px-5 lg:px-7 py-6 md:min-h-full overflow-x-clip">
            {/* Step 6 (Deliver) breaks out of the single questionnaire card into a wider
                two-column layout with its own surfaces — so it isn't a card-in-a-card. */}
            <div className={`mx-auto flex w-full flex-1 flex-col ${step === 8 ? "max-w-[1320px]" : "max-w-[1000px]"}`}>
              {step === 8 ? (
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
                  className={`flex flex-1 flex-col outline-none bg-ir-card border border-ir-border rounded-xl shadow-e1 p-6 md:p-8 ${dir === "forward" ? "step-enter-forward" : "step-enter-backward"}`}
                  key={`${step}-${quizIdx}-${quizDone}`}
                >
                  {step === 1 && <S1 go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} router={router} />}
                  {step === 2 && <SBrand go={go} draft={draft} updateDraft={updateDraft} />}
                  {step === 3 && <S2Audience go={go} draft={draft} updateDraft={updateDraft} addNotebookEntry={addNotebookEntry} />}
                  {step === 4 && <S2Define go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} />}
                  {step === 5 && quizDone && <QuizResult draft={draft} onContinue={() => go(6)} onRetake={retakeQuiz} onChoose={chooseDirection} />}
                  {step === 5 && !quizDone && <S2quiz q={QUIZ[quizIdx]} idx={quizIdx} total={QUIZ.length} onAnswer={(opt: QuizOption) => { answerQuiz(opt); }} onBack={() => (quizIdx > 0 ? setQuizIdx(quizIdx - 1) : go(4))} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} quizIdx={quizIdx} answered={answers[quizIdx]?.option} />}
                  {step === 6 && <S4Structure go={go} draft={draft} updateDraft={updateDraft} />}
                  {step === 7 && <S5DesignBlueprint go={go} draft={draft} updateDraft={updateDraft} />}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
    </ProjectContextProvider>
  );
}

function Head({ n: _n, title, sub, optional, required }: { n: number; title: string; sub?: string; optional?: boolean; required?: boolean }) {
  return (
    // Mobile trims a bit of the dead space above the fold (mb-4 pb-4 vs the desktop mb-5
    // pb-5) — small on its own, but it stacks with the card's own padding and every
    // section's spacing, and mobile has the least vertical room to spare.
    // No rule line under the title — the heading's own size/weight already separates it
    // from the body below at a glance, so a border here was reinforcing something
    // typography had already established, not adding a distinction of its own.
    <div className="mb-4 pb-4 md:mb-5 md:pb-5">
      <h2 className="text-heading font-semibold text-ir-t1 tracking-tight leading-tight" style={{ textWrap: "balance" } as CSSProperties}>
        {title}
        {required && <RequiredMark />}
        {/* same "(ไม่บังคับ)" as optional fields elsewhere — plain grey text, not a badge */}
        {optional && <span className="ml-2 whitespace-nowrap text-lead font-normal tracking-normal text-ir-t3">(ไม่บังคับ)</span>}
      </h2>
      {sub &&<p className="text-lead text-ir-t2 leading-relaxed mt-2">{sub}</p>}
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
  // Audience moved to its own step (S2Audience).
  const ok = !!(draft.company.trim() && draft.projectType);
  const nudge = useNudge();
  const companyErr = nudge.field === "company-field" && !draft.company.trim();

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


  return (
    <>
      <Head n={1} title="ทำความเข้าใจ" sub="ชื่อบริษัทและเว็บไซต์ปัจจุบัน" />

      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      {/* Company identity grouped — one field a row at every width (24 Nov 2026): side by
          side they left the full-height card mostly empty */}
      <div className="mb-0 grid gap-6">
        <div>
          <SectionLabel><span>ชื่อบริษัท / องค์กร<RequiredMark /></span></SectionLabel>
          <input
            id="company-field"
            aria-label="ชื่อบริษัท / องค์กร"
            aria-invalid={companyErr || undefined}
            value={draft.company}
            onChange={(e) => updateDraft({ company: e.target.value })}
            placeholder="เช่น บริษัท ABC จำกัด (มหาชน)"
            className="w-full border border-ir-border rounded-md px-4 py-3 text-body outline-none focus:border-ir-accent mt-2 transition-colors aria-invalid:border-ir-error aria-invalid:focus:border-ir-error aria-invalid:bg-ir-error-soft/40"
          />
          {companyErr && <FieldError>ใส่ชื่อบริษัทหรือองค์กรก่อน ชื่อย่อก็ได้</FieldError>}
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <SectionLabel>เว็บไซต์ปัจจุบัน</SectionLabel>
            <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
          </div>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ir-t3 text-lead select-none">🌐</span>
            <input
              id="website-field"
              aria-label="เว็บไซต์ปัจจุบัน"
              value={draft.website ?? ""}
              onChange={(e) => updateDraft({ website: e.target.value })}
              placeholder="https://www.irplus.in.th"
              className="w-full border border-ir-border rounded-md pl-10 pr-4 py-3 text-body outline-none focus:border-ir-accent transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Missing info clicking Next when form is incomplete shows specific guide */}
      <StepNav onBack={() => router.push("/")} backLabel="หน้าหลัก" next={
        <NextButton onClick={() => go(2)} blocked={!ok} onBlocked={(b) => nudge.nudge("company-field", b)}>ถัดไป</NextButton>
      } />
    </>
  );
}

// ── S2 · Brand (CI): colours and font. Its own step since the internal review of
// 18 Nov 2026 (it used to sit under the company questions in step 1). Right after step 1,
// so the company, its website and its brand are answered together. ──
// The team's font as a specimen card on "ปรับ CI ให้ทันสมัย". Off this phase (19 Nov 2026:
// the client attaches what CI they already have instead); the card, its full preview and
// the font browser stay in the code for a later phase.
const SHOW_CI_FONT_CARD = false;


function SBrand({ go, draft, updateDraft }: any) {
  // CI: keeping it means taking colours + font from the current website, so it needs the
  // link. Until the client picks, the default follows the link (link → keep, none → team
  // proposes); without a link it can never stay on "keep".
  const siteHost = siteHostOf(draft.website);
  const keepCi = draft.hasCorporateIdentity === "yes" && !!siteHost;
  // Before Explore the team's font is the starting pairing; coming back after Explore it
  // is the matched Direction's own font and colours.
  const dirn = directionById(draft.selectedDirection);
  const proposedFont = (FONT_PAIRINGS[draft.selectedDirection] ?? DEFAULT_PAIRING).thai;
  const [fontPreview, setFontPreview] = useState(false);
  const [fontBrowse, setFontBrowse] = useState(false);
  const interestFont: string = fontByFamily(draft.fontInterest ?? "") ? draft.fontInterest : "";
  useGoogleFont(SHOW_CI_FONT_CARD && !keepCi && interestFont ? previewFamily(interestFont) : undefined, [400, 600]);
  useGoogleFont(SHOW_CI_FONT_CARD && !keepCi ? proposedFont : undefined, [400, 600]);
  useEffect(() => {
    // a picked answer is kept as is (everything downstream also checks the link)
    if (draft.ciPicked) return;
    const want = siteHost ? "yes" : "no";
    if (draft.hasCorporateIdentity !== want) updateDraft({ hasCorporateIdentity: want });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteHost, draft.ciPicked]);
  const [askLink] = useState(!siteHost);

  return (
    <>
      <Head n={2} title="สีและฟอนต์ของแบรนด์ (CI)" sub="ใช้สีและฟอนต์เดิมจากเว็บไซต์ปัจจุบัน หรือปรับให้ทันสมัยขึ้น" />
      {/* Corporate identity: colours AND font, one decision, and "keep" only means "take them
          from the current website" (no hex codes, no font picking: IR teams don't pick fonts,
          they follow their site — user tests BTS / AOT / CPALL). Two equal cards; keeping the
          CI needs the website link above. hasCorporateIdentity "yes" = from the website,
          "no" = the team proposes new colours and font. */}
      <div>
        {/* no link yet: ask for it here, since keeping the CI needs it (stays open once shown) */}
        {askLink && (
          <div className="mb-5">
            <div className="flex items-baseline gap-2">
              <SectionLabel>ลิงก์เว็บไซต์ปัจจุบัน</SectionLabel>
              <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
            </div>
            <input
              aria-label="ลิงก์เว็บไซต์ปัจจุบัน"
              value={draft.website ?? ""}
              onChange={(e) => updateDraft({ website: e.target.value })}
              placeholder="https://www.irplus.in.th"
              className="mt-2 w-full border border-ir-border rounded-md px-4 py-3 text-body outline-none focus:border-ir-accent transition-colors"
            />
          </div>
        )}
        <SectionLabel>ต้องการใช้สีและฟอนต์แบบไหน</SectionLabel>
        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          <OptionCard
            alignTop
            icon={IconPalette}
            title="ใช้ CI เดิม"
            desc={siteHost ? `ใช้สี ฟอนต์ และโลโก้แบบเดิมจากเว็บไซต์ปัจจุบัน · ${siteHost}` : "ใส่ลิงก์เว็บไซต์ปัจจุบันด้านบนก่อน จึงเลือกข้อนี้ได้"}
            selected={keepCi}
            disabled={!siteHost}
            onSelect={() => updateDraft({ hasCorporateIdentity: "yes", ciPicked: true })}
          />
          <OptionCard
            alignTop
            icon={IconSparkle}
            title="ปรับ CI ให้ทันสมัย"
            desc="อยากให้เว็บต่างจาก CI เดิม จะปรับบางส่วนหรือทั้งหมดก็ได้"
            selected={!keepCi}
            onSelect={() => updateDraft({ hasCorporateIdentity: "no", ciPicked: true })}
          />
        </div>
        {/* keep the CI: logo, colours and font all come from the linked website, so only a
            note (19 Nov 2026: the logo upload went — the team takes it from the site) */}
        {keepCi && (
          <NoteField className="mt-4" label="หมายเหตุเพิ่มเติม" hint="หากมีส่วนที่อยากปรับจาก CI เดิม หรือรายละเอียดที่อยากให้ทีมออกแบบทราบ สามารถระบุไว้ได้เลย"
            value={draft.ciKeepNote ?? ""} onChange={(v) => updateDraft({ ciKeepNote: v })}
            links={draft.noteLinks?.ciKeep} onLinksChange={(l) => updateDraft({ noteLinks: { ...draft.noteLinks, ciKeep: l } })}
            placeholder="ระบุสิ่งที่อยากปรับ…" />
        )}
        {/* refresh the CI: attach what they already have; whatever is missing, the team proposes */}
        {!keepCi && (
          <div className="mt-5">
            <ReferenceEditor variant="ci" draft={draft} updateDraft={updateDraft} />
          </div>
        )}
        {/* The team's font as a specimen card (internal review 18 Nov 2026: the old one-row
            layout with a button and an underlined link read as odd). Specimen on top in the
            font itself, then a footer: what it is on the left, two equal pill buttons on the
            right in the order they're used (look at it, then browse others). Before Explore
            it's the starting pairing; after Explore, the matched Direction's font and colours. */}
        {SHOW_CI_FONT_CARD && !keepCi && (
          <div className="mt-3 overflow-hidden rounded-xl border border-ir-border bg-ir-card">
            <div className="border-b border-ir-border-soft bg-white px-5 py-5 sm:px-6" style={{ fontFamily: familyStack(proposedFont) }}>
              <p className="truncate text-heading font-semibold leading-snug text-ir-t1 sm:text-display-sm">{draft.company?.trim() || "บริษัท ตัวอย่าง จำกัด (มหาชน)"}</p>
              <p className="mt-1 text-lead text-ir-t2">นักลงทุนสัมพันธ์ · กขค Aa 0123456789</p>
            </div>
            <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-caption text-ir-t3">{dirn ? `ฟอนต์ตามแนวทาง ${dirn.label}` : "ฟอนต์ตั้งต้นที่ทีมเสนอ"}</p>
                <p className="text-body font-semibold text-ir-t1">{proposedFont}</p>
                {dirn ? (
                  <p className="mt-1 flex items-center gap-1.5 text-caption text-ir-t3">
                    <span className="flex gap-1" aria-hidden="true">
                      {dirn.colors.map((c: string) => <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />)}
                    </span>
                    {dirn.palette}
                  </p>
                ) : (
                  <p className="mt-0.5 text-caption leading-snug text-ir-t3">ทีมจะปรับสีและฟอนต์ให้เข้ากับแนวทางที่ได้ในขั้นสำรวจแนวทาง</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <button type="button" onClick={() => setFontPreview(true)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-ir-dark px-4 text-small font-semibold text-white transition-[background-color,scale] hover:bg-ir-dark/90 active:scale-[0.98] focus-ring">
                  ดูตัวอย่างเต็ม
                </button>
                <button type="button" onClick={() => setFontBrowse(true)}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-ir-border bg-white px-4 text-small font-semibold text-ir-t1 transition-[border-color,scale] hover:border-ir-border-hi active:scale-[0.98] focus-ring">
                  เลือกฟอนต์ที่สนใจ
                </button>
              </div>
            </div>
            {/* a font they liked while browsing: a preference for the team, not a choice */}
            {interestFont && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ir-border-soft bg-primary-50/60 px-5 py-2 text-small text-ir-t2 sm:px-6">
                <span>สนใจ: <span className="font-semibold text-ir-t1" style={{ fontFamily: familyStack(interestFont) }}>{interestFont}</span></span>
                <span className="text-caption text-ir-t3">· ทีมจะนำไปพิจารณา</span>
                <button type="button" onClick={() => updateDraft({ fontInterest: "" })} aria-label="ล้างฟอนต์ที่สนใจ"
                  className="ml-auto inline-flex h-11 items-center rounded-full px-2.5 text-caption font-semibold text-ir-t3 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring">ล้าง</button>
              </div>
            )}
          </div>
        )}
        {/* the note for the team comes last (user feedback) */}
        {!keepCi && (
          <NoteField className="mt-2" label="หมายเหตุเพิ่มเติม" hint="หากมีโทนสีหรือฟอนต์ในใจ หรือรายละเอียดที่อยากให้ทีมออกแบบทราบ สามารถระบุไว้ได้เลย"
            value={draft.ciNote ?? ""} onChange={(v) => updateDraft({ ciNote: v })}
            links={draft.noteLinks?.ci} onLinksChange={(l) => updateDraft({ noteLinks: { ...draft.noteLinks, ci: l } })}
            placeholder="ระบุโทนสีหรือฟอนต์ที่อยากได้…" />
        )}
        {fontPreview && <FontPreviewSheet family={proposedFont} company={draft.company} onClose={() => setFontPreview(false)} />}
        {fontBrowse && (
          <FontPickerSheet interest initialFamily={interestFont || undefined} value={interestFont || undefined} teamFont={proposedFont}
            company={draft.company?.trim() || "บริษัท ตัวอย่าง จำกัด (มหาชน)"}
            onClose={() => setFontBrowse(false)}
            onChoose={(family) => { updateDraft({ fontInterest: family }); setFontBrowse(false); }} />
        )}
      </div>

      <StepNav onBack={() => go(1)} next={<NextButton onClick={() => go(3)}>ถัดไป</NextButton>} />
    </>
  );
}

// A line above a pick list that opened with suggested answers: says they were picked for
// the client and can be changed; once changed, offers to go back to the suggested set.
// Same idea as the homepage step's "หน้าแรกที่ AI จัดให้คุณ" card, quieter.
function SuggestedBar({ suggested, onUse, count, max, unit }: { suggested: boolean; onUse: () => void; count: number; max?: number; unit: string }) {
  return (
    // Same height in both states (audit 24 Nov 2026: it grew when a pick changed, so the
    // cards jumped under the finger). Phones: message on one line, count + button on a
    // second row the same 32px height as the count. Wider: one row. The button is drawn at
    // the count's height (32px) but its hit area stretches to 44px. The pick count
    // lives here, so the list below starts straight away. Radius matches the cards (20px).
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-ir-muted py-2 pl-3 pr-2 sm:flex-nowrap sm:pl-4">
      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ir-dark text-small text-ir-accent">✦</span>
      <p key={String(suggested)} role="status" className="swap-in min-w-0 flex-1 text-body leading-snug text-ir-t1">
        {suggested ? "แนะนำตามเว็บ IR ทั่วไป · ปรับได้" : "ปรับจากที่แนะนำแล้ว"}
      </p>
      <div className="flex min-h-8 w-full items-center gap-2 sm:w-auto sm:shrink-0">
        <PickCount count={count} max={max} unit={unit} />
        {!suggested && (
          <button type="button" onClick={onUse}
            className="swap-in relative ml-auto inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3 text-small font-semibold text-ir-t1 shadow-e1 transition-colors before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hover:bg-ir-accent focus-ring">
            ✦ ใช้ชุดที่แนะนำ
          </button>
        )}
      </div>
    </div>
  );
}

// ── S2 · Audience: who the site is for (its own step since user test CBG — it used to
// share step 1 with the company and brand questions) ──
function S2Audience({ go, draft, updateDraft, addNotebookEntry }: any) {
  // First pick = primaryAudience (the AI's tone / priority logic reads one main audience),
  // the rest = secondaryAudiences, in rank order.
  const selectedAudiences: string[] = [draft.primaryAudience, ...(draft.secondaryAudiences ?? [])].filter(Boolean);
  const nudge = useNudge();
  const audienceErr = nudge.field === "audience-field" && !draft.primaryAudience;
  const suggested = audienceIsSuggested(draft);
  const useSuggested = () => updateDraft({ primaryAudience: SUGGESTED_AUDIENCES[0], secondaryAudiences: SUGGESTED_AUDIENCES.slice(1) });
  // First visit: open with the suggested audiences already picked (user test: "อะไรแนะนำได้
  // ให้แนะนำ"), once per draft, so clearing them later is respected.
  useEffect(() => {
    if (draft.audiencePrefilled) return;
    updateDraft({ audiencePrefilled: true, ...(!draft.primaryAudience ? { primaryAudience: SUGGESTED_AUDIENCES[0], secondaryAudiences: SUGGESTED_AUDIENCES.slice(1) } : {}) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Head n={3} title="ใครจะเข้ามาดูเว็บไซต์" sub="เรียงจากกลุ่มที่สำคัญที่สุด · กดการ์ดเพื่อเพิ่มหรือเอาออก" />
      {/* Audience who the IR site speaks to — one flat multi-select, every
          card behaves the same way so nothing has to be picked "first" */}
      <SuggestedBar suggested={suggested} onUse={useSuggested} count={selectedAudiences.length} unit="กลุ่ม" />
      <div id="audience-field" className="scroll-mt-28">
        {audienceErr && <FieldError>เลือกกลุ่มผู้อ่านอย่างน้อย 1 กลุ่ม</FieldError>}
        <RankPicker
          items={AUDIENCE_LIST.map((aud) => ({ id: aud.id, label: aud.label, desc: aud.desc, icon: OPTION_ICONS[aud.id] }))}
          selected={selectedAudiences}
          onChange={(next) => updateDraft({ primaryAudience: next[0] ?? "", secondaryAudiences: next.slice(1) })}
          unit="กลุ่ม"
          hideCount
        />
      </div>

      <StepNav onBack={() => go(2)} next={
        <NextButton onClick={() => go(4)} blocked={!draft.primaryAudience} onBlocked={(b) => nudge.nudge("audience-field", b)}>{suggested ? "ใช้ตามที่แนะนำ" : "ถัดไป"}</NextButton>
      } />
    </>
  );
}

// ── S2 · Define objectives (what the IR site must achieve) ──
const GOALS_COLLAPSE_AT = 6;

function S2Define({ go, draft, updateDraft, addTimelineEntry, addNotebookEntry }: any) {
  const g = useGuide("strategy");
  // Mobile-only progressive disclosure — 10 goal cards is a long stack on a single mobile
  // column. Show the first 6 and a "show more" affordance; if a previously-chosen goal
  // lives past that cutoff (e.g. returning to this step with a saved draft), reveal
  // everything automatically so a selection is never hidden from the user.
  const [showAllGoals, setShowAllGoals] = useState(false);
  const hasHiddenSelection = VISIBLE_GOALS.slice(GOALS_COLLAPSE_AT).some((bg: any) => draft.businessGoals.includes(bg.id));
  const goalsExpanded = showAllGoals || hasHiddenSelection;
  // Collapsing is only offered when it wouldn't hide a goal the user already picked.
  const canCollapseGoals = showAllGoals && !hasHiddenSelection;

  const ok = draft.businessGoals.length >= RULES.goals.min;
  const nudge = useNudge();
  const goalsErr = nudge.field === "goals-field" && !ok;
  const suggested = goalsAreSuggested(draft);
  const useSuggested = () => updateDraft({ businessGoals: SUGGESTED_GOALS });
  // First visit: open with the suggested goals already picked, once per draft.
  useEffect(() => {
    if (draft.goalsPrefilled) return;
    updateDraft({ goalsPrefilled: true, ...(draft.businessGoals.length === 0 ? { businessGoals: SUGGESTED_GOALS } : {}) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Head n={3} title="เว็บไซต์ต้องทำอะไรได้บ้าง" sub="เรียงจากเรื่องที่สำคัญที่สุด · กดการ์ดเพื่อเพิ่มหรือเอาออก" />
      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      <SuggestedBar suggested={suggested} onUse={useSuggested} count={draft.businessGoals.length} max={RULES.goals.max} unit="ข้อ" />
      <div id="goals-field" className="scroll-mt-28">
        {goalsErr && <FieldError>เลือกเป้าหมายอีก {RULES.goals.min - draft.businessGoals.length} ข้อ</FieldError>}
        <RankPicker
          items={VISIBLE_GOALS.map((goal) => ({ id: goal.id, label: goal.label, desc: goal.desc, icon: OPTION_ICONS[goal.id] }))}
          selected={draft.businessGoals}
          max={RULES.goals.max}
          topLabel="เป้าหมายหลัก"
          unit="ข้อ"
          hideCount
          cols="md:grid-cols-2"
          onChange={(next) => updateDraft({ businessGoals: next })}
          itemClassName={(_id, i) => (i >= GOALS_COLLAPSE_AT && !goalsExpanded ? "max-md:hidden" : "")}
        />
        {/* Expand/collapse toggle — stays in place after expanding (rather than vanishing,
            which read as "something disappeared") so the disclosure is reversible. Hidden
            only when collapsing would hide an already-selected goal, since a selection must
            never end up out of sight. */}
        {VISIBLE_GOALS.length > GOALS_COLLAPSE_AT && (!goalsExpanded || canCollapseGoals) && (
          <button
            type="button"
            onClick={() => setShowAllGoals((v) => !v)}
            aria-expanded={goalsExpanded}
            className="md:hidden mt-2.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-dashed border-ir-border text-body font-medium text-ir-t2 active:bg-ir-hover"
          >
            {goalsExpanded ? "ย่อรายการ" : `ดูเป้าหมายเพิ่มเติมอีก ${VISIBLE_GOALS.length - GOALS_COLLAPSE_AT} รายการ`}
            <svg
              width="24" height="24" viewBox="0 0 12 12" fill="none"
              className={`shrink-0 transition-transform duration-fast ${goalsExpanded ? "rotate-180" : ""}`}
            >
              <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <StepNav onBack={() => go(3)} next={
        <NextButton onClick={() => go(5)} blocked={!ok} onBlocked={(b) => nudge.nudge("goals-field", b)}>{suggested ? "ใช้ตามที่แนะนำ" : "ถัดไป"}</NextButton>
      } />
    </>
  );
}

// Website mock at the top of each quiz card — a flat illustration (ExploreMock) of the
// choice, so the pair can be told apart at a glance.
// `live` plays the mock's motion (globals.css .em-*): while hovered with a mouse or picked.
function QuizVisual({ mock, live = false }: { mock: string; live?: boolean }) {
  return (
    // 16:9 inset frame. Height comes from the padding-box ratio (56.42% = 677/1200) rather
    // than `aspect-ratio`, which some mobile WebViews don't lock in. Nothing sits on top of
    // the mock — on a phone it's only ~150px wide and every pixel of it is the comparison.
    <div className={`relative overflow-hidden rounded-sm sm:rounded-md border border-ir-border select-none ${live ? "em-live" : ""}`} style={{ paddingTop: "56.42%" }}>
      <div className="absolute inset-0"><ExploreMock id={mock} /></div>
    </div>
  );
}

const LetterBadge = ({ letter }: { letter: string }) => (
  <span className="grid place-items-center w-6 h-6 rounded-full bg-ir-dark text-white text-small font-bold shrink-0" aria-hidden="true">{letter}</span>
);

// The phone-only "ดูภาพใหญ่" button under the A/B cards. Off (19 Nov 2026): the cards are
// picked as they are; the big view stays in the code in case it's wanted back.
const SHOW_QUIZ_BIG_VIEW = false;

// ── S2 Smart Discovery Quiz (A/B) ──
function S2quiz({ q, idx, total, onAnswer, onBack, addTimelineEntry, addNotebookEntry, quizIdx, answered }: any) {
  const opts: [QuizOption, string][] = [[q.optionA, "A"], [q.optionB, "B"]];
  // Pick first, then "ข้อถัดไป" (user test #1: auto-advancing on tap left them unsure what
  // happened — they tapped A and B, then scrolled looking for a next button). The pick is
  // keyed to the question so it resets when the question changes. A question answered
  // before (coming back to Explore) opens with that answer already picked, so "ข้อถัดไป"
  // walks through unchanged answers and only the ones being revised need a tap.
  const [chosen, setChosen] = useState<{ q: string; letter: string } | null>(null);
  const quizNudge = useNudge();
  const prevLetter = answered ? (answered === q.optionA ? "A" : answered === q.optionB ? "B" : null) : null;
  const pending = chosen && chosen.q === q.id ? chosen.letter : prevLetter;
  // Phones only (off since 19 Nov 2026, see SHOW_QUIZ_BIG_VIEW): the two-up mocks are ~150px wide each, too small to read the details that
  // tell A from B. "ดูภาพใหญ่" shows both full width, stacked, right under the cards —
  // inline, no modal, and it stays open across questions once opened.
  const [bigView, setBigView] = useState(false);
  // Mouse hover plays a card's picture too; touch never sets this (pointerType check), so
  // on phones and tablets only the picked card moves.
  const [hovered, setHovered] = useState<string | null>(null);
  const isLast = idx === total - 1;

  const selectOption = (_o: QuizOption, letter: string) => setChosen({ q: q.id, letter });
  const confirm = () => {
    const pair = opts.find(([, l]) => l === pending);
    if (!pair) return;
    const [o] = pair;
    if (isLast) {
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
    setChosen(null);
    onAnswer(o);
  };

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
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-base ${i < idx ? "bg-ir-accent" : i === idx ? "bg-ir-dark" : "bg-ir-border"}`} />
          ))}
        </div>
        <span className="font-mono text-small text-ir-t3 shrink-0 tabular-nums">ข้อ {idx + 1}/{total}</span>
      </div>
      <p className="text-center text-body font-semibold text-ir-accent-text">{idx + 1} {q.topic}</p>
      <p className="text-center text-heading font-semibold tracking-[-0.02em] text-ir-t1 mt-1.5 mb-6 leading-snug" style={{ textWrap: "balance" } as CSSProperties}>{q.question}</p>
      {/* Always two-up, even on phones, so A and B are compared side by side — stacking
          them pushed B below the fold and biased answers toward A. */}
      <div id="quiz-options" className="grid scroll-mt-28 grid-cols-2 gap-2 sm:gap-4">
        {opts.map(([o, letter]) => (
          <button key={letter} type="button" onClick={() => selectOption(o, letter)}
            onPointerEnter={(e) => { if (e.pointerType === "mouse") setHovered(letter); }}
            onPointerLeave={() => setHovered(null)}
            aria-pressed={pending === letter}
            aria-label={`ตัวเลือก ${letter}: ${o.label}`}
            className={[
              "group/sel relative flex flex-col rounded-md sm:rounded-xl border p-1 sm:p-2.5 text-left select-none transition-[background-color,border-color,box-shadow,opacity,filter,transform,scale] duration-fast focus-ring",
              pending === letter
                ? "wrs-quiz-selected border-ir-select bg-primary-50 shadow-selected"
                : pending
                // The other option recedes, but stays tappable to switch.
                ? "border-ir-border bg-ir-card opacity-70 hover:opacity-100 hover:border-ir-select-soft"
                : "border-ir-border bg-ir-card hover:border-ir-select-soft hover:bg-primary-50/60 hover:shadow-e2 active:scale-[0.98]",
            ].join(" ")}>
            {/* Name, then the picture (internal review 18 Nov 2026: no description line, the
                picture shows the difference itself). The mock is pinned to the card's foot
                so A and B line up whatever the label length. */}
            <div className="px-1.5 sm:px-2 pt-1.5 sm:pt-1 pb-2.5 sm:pb-3">
              {/* phones: badge and select dot share the top row, the label takes the full width
                  below (beside the badge, Thai labels broke one word per line). The selected
                  state is the dot, the same as on desktop. */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <LetterBadge letter={letter} />
                <span className="order-last w-full min-w-0 text-lead sm:order-none sm:w-auto sm:flex-1 sm:text-heading font-bold tracking-[-0.01em] text-ir-t1 leading-snug">{o.label}</span>
                <SelectDot on={pending === letter} className="ml-auto sm:ml-0" />
              </div>
            </div>
            <div className="mt-auto"><QuizVisual mock={o.mock} live={pending === letter || hovered === letter} /></div>
          </button>
        ))}
      </div>
      {SHOW_QUIZ_BIG_VIEW && <div className="sm:hidden mt-3">
        <button type="button" onClick={() => setBigView((v) => !v)} aria-expanded={bigView}
          className="w-full min-h-11 rounded-full border border-ir-border text-body font-semibold text-ir-t1 bg-ir-card">
          {bigView ? "ย่อภาพ" : "ดูภาพใหญ่"}
        </button>
        {bigView && (
          <div className="mt-3 space-y-3">
            {opts.map(([o, letter]) => (
              <figure key={letter} className="m-0">
                {/* same order as the cards: words first, picture under them */}
                <figcaption className="mb-2">
                  <span className="flex items-center gap-2 text-lead font-bold text-ir-t1"><LetterBadge letter={letter} />{o.label}</span>
                </figcaption>
                <QuizVisual mock={o.mock} live={pending === letter} />
                {/* choose straight from the big view — no scrolling back up to the small cards */}
                <button
                  type="button"
                  onClick={() => selectOption(o, letter)}
                  aria-pressed={pending === letter}
                  className={`mt-2 w-full min-h-12 rounded-full text-body font-semibold transition-[scale] active:scale-[0.98] ${pending === letter ? "bg-ir-accent-soft text-ir-t1" : "bg-ir-dark text-white"}`}
                >
                  {pending === letter ? `✓ เลือก ${letter} แล้ว` : `เลือก ${letter} แบบนี้`}
                </button>
              </figure>
            ))}
          </div>
        )}
      </div>}
      <p className="mt-4 text-center text-small text-ir-t3" aria-live="polite">
        {pending ? `เลือก ${pending} แล้ว · กด${isLast ? "ดูผลลัพธ์" : "ข้อถัดไป"}เพื่อไปต่อ หรือกดอีกแบบเพื่อเปลี่ยน` : "เลือกแบบที่ใกล้กับเว็บไซต์ที่อยากได้มากกว่า"}
      </p>
      {/* nothing picked: the button stays clickable and says what's missing, like every other step (user test SCGP) */}
      {quizNudge.field === "quiz-options" && !pending && <div className="-mb-2 mt-3 flex justify-center"><FieldError>เลือกภาพ A หรือ B ก่อน แล้วกด{isLast ? "ดูผลลัพธ์" : "ข้อถัดไป"}</FieldError></div>}
      <StepNav onBack={onBack} next={<NextButton onClick={confirm} blocked={!pending} onBlocked={(b) => quizNudge.nudge("quiz-options", b)}>{isLast ? "ดูผลลัพธ์" : "ข้อถัดไป"}</NextButton>} />
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
      <div className="sc-rise text-center">
        <span className="text-body font-semibold text-ir-accent-text">ผลการสำรวจ</span>
        <h2 className="mt-2 text-heading sm:text-display-sm font-semibold tracking-[-0.02em] text-ir-t1" style={{ textWrap: "balance" } as CSSProperties}>
          {isTop ? "แนวทางที่ใกล้กับองค์กรคุณที่สุด" : "แนวทางที่คุณเลือก"}
        </h2>
      </div>

      {/* Matched Direction — drenched in its own gradient. Scroll-motion tier A (globals.css). */}
      <div className="sc-stage mt-6">
      <div className="sc-show rounded-2xl p-6 sm:p-8 text-white" style={{ background: d.bg }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-body font-semibold text-white/75">Design Direction</p>
            <p className="mt-1 text-display-sm sm:text-display-lg font-semibold leading-tight tracking-[-0.03em] text-white">{d.label}</p>
            <p className="mt-1 text-lead text-white/85">{d.tagline}</p>
          </div>
          <span className="rounded-full bg-white/15 px-3.5 py-1.5 font-mono text-body font-bold text-white backdrop-blur-sm">
            {current.confidence}% match
          </span>
        </div>
        <p className="mt-4 max-w-[60ch] text-lead leading-relaxed text-white/85">{d.desc}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              {d.colors.map((c: string) => <span key={c} className="w-7 h-7 rounded-full ring-1 ring-white/30" style={{ background: c }} />)}
            </div>
            <span className="text-body text-white/85">{d.palette}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {d.mood.map((m: string) => (
              <span key={m} className="rounded-full border border-white/25 px-3 py-1 text-body text-white/90">{m}</span>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Why — the five picks, each with the photo that was chosen */}
      {picks.length > 0 && (
        <div className="sc-reveal mt-8">
          <p className="text-lead font-semibold text-ir-t1">มาจากคำตอบของคุณ</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {picks.map((p, i) => {
              const q = QUIZ.find((x) => x.id === p.questionId);
              if (!q) return null;
              const o = p.letter === "A" ? q.optionA : q.optionB;
              return (
                <li key={p.questionId} className="flex lg:flex-col gap-3 rounded-lg border border-ir-border bg-ir-card p-2">
                  {/* Outer box fixes the width; the inner padding ratio is a % of that width */}
                  <div className="w-24 lg:w-full shrink-0">
                    <div className="relative overflow-hidden rounded-sm border border-ir-border" style={{ paddingTop: "56.42%" }}>
                      <div className="absolute inset-0"><ExploreMock id={o.mock} /></div>
                    </div>
                  </div>
                  <div className="min-w-0 py-1 lg:px-1">
                    <p className="text-small text-ir-t3 truncate">ข้อ {i + 1} · {q.topic}</p>
                    <p className="text-body font-semibold leading-snug text-ir-t1">{o.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Other Directions — ranked, switchable */}
      <div className="sc-reveal mt-8">
        <p className="text-lead font-semibold text-ir-t1">แนวทางอื่นที่ใกล้เคียง</p>
        <p className="mt-1 text-body text-ir-t3">ถ้าแนวทางอื่นตรงกับองค์กรมากกว่า เลือกแทนได้เลย</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {ranked.filter((r) => r.direction.id !== d.id).map((r) => (
            <OptionCard
              key={r.direction.id}
              title={r.direction.label}
              desc={r.direction.tagline}
              selected={false}
              onSelect={() => onChoose(r.direction.id)}
              aside={<span className="font-mono text-body font-semibold text-ir-t2">{r.confidence}%</span>}
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
        <NextButton onClick={onContinue}>ไปจัดหน้าแรก</NextButton>
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
        { duration: DUR.base, easing: EASE.out }
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
// Sheet for one added link/file: bottom sheet on phones, centred dialog from sm up.
function ItemSheet({ title, preview, children, footer, onClose }: { title: string; preview: ReactNode; children: ReactNode; footer: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    // Esc closes; Tab and Shift+Tab stay inside the sheet (audit 19 Nov 2026)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeRef.current(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute("disabled"));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      // back to the tile that opened it (when it's still on the page)
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="ปิด" tabIndex={-1} onClick={onClose} className="sheet-backdrop absolute inset-0 bg-ir-dark/45 backdrop-blur-[2px]" />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="sheet-in relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-ir-card shadow-e3 outline-none sm:max-w-[520px] sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-ir-border-soft py-2 pl-5 pr-2">
          <p className="min-w-0 flex-1 truncate text-body font-semibold text-ir-t1">{title}</p>
          <button type="button" onClick={onClose} aria-label="ปิด" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ir-t2 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring">
            <IconClose width={14} height={14} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {preview}
          <div className="mt-4">{children}</div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ir-border-soft px-4 pt-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Full-screen pause between Inspiration and the summary: three ticks, then the summary.
function SummaryLoader({ onSkip }: { onSkip: () => void }) {
  return <PageLoader overlay onSkip={onSkip} title="กำลังสรุปคำตอบของคุณ" message="รวบรวมคำตอบทั้งหมด เป็นสรุปแนวทางเว็บไซต์ในหน้าเดียว" />;
}

function FloatingPreviewToast() {
  const preview = useFloatingPreview((s) => s.preview);
  if (!preview) return null;
  return (
    <div className="wrs-floating-preview-pos fixed inset-x-0 z-[10002] flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-ir-dark text-white shadow-e3 ${
          preview.leaving ? "wrs-floating-preview-out" : "wrs-floating-preview-in"
        }`}
      >
        <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-white/10 text-body">
          {preview.swatch}
        </span>
        <span className="text-small font-medium leading-tight">
          {preview.label}
          {preview.sub && <span className="text-white/50 font-normal"> · {preview.sub}</span>}
        </span>
      </div>
    </div>
  );
}

// ── S4 Structure (current) — StructureBuilder in the step frame ──
function S4Structure({ go, draft, updateDraft }: any) {
  const optional = (draft.selectedSections ?? []).filter((id: string) => !REQUIRED_SECTION_IDS.includes(id)).length;
  const short = STRUCTURE_MIN_OPTIONAL - optional;
  const nudge = useNudge();
  return (
    <>
      <Head n={5} title="จัดหน้าแรกของเว็บไซต์" sub="ส่วนต่างๆ บนหน้าแรก AI จัดไว้ให้แล้ว สามารถปรับได้" />
      <div id="structure-field" className="scroll-mt-28">
        {nudge.field === "structure-field" && short > 0 && <FieldError>เลือกเนื้อหาเพิ่มอีก {short} เรื่อง</FieldError>}
        <StructureBuilder draft={draft} updateDraft={updateDraft} />
      </div>
      <StepNav onBack={() => go(5)} next={<NextButton onClick={() => go(7)} blocked={short > 0} onBlocked={(b) => nudge.nudge("structure-field", b)}>{isRecommendedHomepage(draft) ? "ใช้หน้าแรกนี้" : "ถัดไป"}</NextButton>} />
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

// Video links (user test CPALL: "Ref เป็น Video ได้มั้ย?"). Many videos share one host, so
// duplicates are judged by the full link there, not by domain.
const VIDEO_HOST = /^(?:www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|facebook\.com\/watch|fb\.watch)/i;
// Google Drive links (user request: clients share their own video this way). Treated like a
// video link: matched by the full link, not the domain, so several Drive files can be added.
const DRIVE_HOST = /^(?:drive|docs)\.google\.com\//i;
function isDriveUrl(raw: string) {
  return DRIVE_HOST.test(raw.trim().replace(/^https?:\/\//i, ""));
}
function isVideoUrl(raw: string) {
  const v = raw.trim().replace(/^https?:\/\//i, "");
  return VIDEO_HOST.test(v) || DRIVE_HOST.test(v) || /\.(mp4|mov|webm)(\?|$)/i.test(v);
}
/** Label for a link tile: "Google Drive" rather than the bare domain. */
const linkLabel = (raw: string) => (isDriveUrl(raw) ? "Google Drive" : domainOf(raw));
const normLink = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "").toLowerCase();
// A link that works but isn't a web page (user test BTS pasted a non-page link): a direct
// file, or a search / image-results page. Still addable; a hint says what fits better.
function linkKindHint(raw: string): string {
  const v = raw.trim();
  let u: URL;
  try { u = new URL(/^[a-z][a-z\d+\-.]*:\/\//i.test(v) ? v : `https://${v}`); } catch { return ""; }
  const path = u.pathname.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|heic)$/.test(path)) return "ลิงก์นี้เป็นไฟล์รูป · บันทึกรูปแล้วแนบในช่องรูปภาพด้านล่างจะเห็นชัดกว่า";
  if (/\.pdf$/.test(path)) return "ลิงก์นี้เป็นไฟล์ PDF · แนบไฟล์ในช่องด้านล่างได้เลย";
  if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && (path.startsWith("/search") || path.startsWith("/imgres") || u.searchParams.has("q")))
    return "ลิงก์นี้เป็นหน้าผลการค้นหา · เปิดเว็บที่ชอบแล้วคัดลอกลิงก์จากหน้านั้นแทน";
  return "";
}

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
  const isDuplicate = isVideoUrl(value)
    ? existing.some((u) => normLink(u.value) === normLink(value))
    : existing.some((u) => !isVideoUrl(u.value) && domainOf(u.value).toLowerCase() === normalized);
  if (isDuplicate) return "existing";

  return "valid";
}

const URL_VALIDATION_COPY: Record<Exclude<UrlValidationState, "empty">, { label: string; textClass: string; dotClass: string }> = {
  valid:       { label: "ลิงก์ใช้ได้ · กด “เพิ่มลิงก์” เพื่อใส่ในรายการ", textClass: "text-ir-accent-text", dotClass: "bg-ir-accent" },
  invalid:     { label: "รูปแบบลิงก์ไม่ถูกต้อง ตรวจสอบอีกครั้ง",       textClass: "text-ir-error",       dotClass: "bg-ir-error" },
  unsupported: { label: "ไม่รองรับลิงก์ประเภทนี้ ใช้ http:// หรือ https://", textClass: "text-ir-warn", dotClass: "bg-ir-warn" },
  existing:    { label: "มีลิงก์นี้อยู่ในรายการแล้ว",                   textClass: "text-ir-t2",          dotClass: "bg-ir-t2" },
};

const MAX_REFERENCE_URLS = 8;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

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
      <p className="text-body text-ir-t3 mt-1 mb-4 leading-relaxed">
        ทีม IR Plus คัดเว็บไซต์นักลงทุนสัมพันธ์จริงที่ใกล้เคียงกับแนวทาง <span className="text-ir-t2 font-medium">{dir?.label}</span> มาให้ดู
        เปิดดูเว็บจริงได้ แล้วเลือกเว็บที่ใช่ที่สุด 1 แบบ
      </p>
      {/* Always paired 2-up so all four options stay comparable at a glance (same as the
          quiz step), even on mobile. */}
      <div className="sc-reveal grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 sm:gap-3">
        {sites.map((s) => {
          const isSelected = activeDomain === s.domain;
          return (
            <div
              key={s.domain}
              // Once one is picked, the others recede (sel-recede) and come back on hover.
              className={`group/sel rounded-lg sm:rounded-xl border p-1.5 sm:p-2 transition-[background-color,border-color,box-shadow] duration-fast ${
                isSelected
                  ? "border-ir-select bg-primary-50 shadow-selected"
                  : `border-ir-border bg-ir-card hover:border-ir-select-soft hover:bg-primary-50/60 ${activeDomain ? "sel-recede" : ""}`
              }`}
            >
              {/* Monogram tile in the Direction's own gradient — identifies the company
                  without reproducing its website. Clicking it selects, like the button. */}
              <button
                type="button"
                onClick={() => pick(s.domain)}
                aria-pressed={isSelected}
                aria-label={`เลือก ${s.name} เป็นเว็บอ้างอิง`}
                className="relative block w-full overflow-hidden rounded-md sm:rounded-md text-left transition-[scale] duration-fast active:scale-[0.98] focus-ring"
                style={{ paddingTop: "56.42%", background: dir?.bg ?? "#141613" }}
              >
                <span className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 text-white">
                  <span className="text-small font-medium text-white/75">{s.market} · {s.sector}</span>
                  <span className="font-mono text-heading sm:text-display-sm font-bold leading-none tracking-tight">{s.symbol}</span>
                </span>
                <SelectDot on={isSelected} className="absolute top-2 right-2" />
              </button>
              <div className="px-1.5 sm:px-2 pt-2.5 pb-1">
                <p className="text-body sm:text-lead font-semibold text-ir-t1 leading-snug truncate">{s.name}</p>
                <p className="text-small text-ir-t3 truncate">{s.domain}</p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`เปิดเว็บ IR ของ ${s.name} ในแท็บใหม่`}
                    aria-label={`เปิดเว็บ IR ของ ${s.name} ในแท็บใหม่`}
                    className="shrink-0 inline-flex items-center justify-center gap-1 h-11 min-w-11 px-2.5 sm:px-3 rounded-full bg-ir-muted text-ir-t2 text-body font-medium hover:bg-ir-border hover:text-ir-t1 transition-colors"
                  >
                    <IconExternalLink width={24} height={24} className="-my-1" />
                    <span className="hidden sm:inline">เปิดเว็บ IR</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => pick(s.domain)}
                    aria-pressed={isSelected}
                    className={`flex-1 inline-flex items-center justify-center gap-1 h-11 min-w-0 rounded-full border text-body font-semibold transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${
                      isSelected ? "border-ir-select bg-ir-accent-soft text-ir-accent-text" : "border-ir-border text-ir-t2 hover:border-ir-select-soft hover:text-ir-t1"
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

// The "ตัวอย่างสิ่งที่ใส่ได้" box above the inspiration links. Off (20 Nov 2026): the step's
// subtitle now lists the same examples in one sentence. Code kept.
const SHOW_REF_EXAMPLES = false;

// variant "ci" is the same editor reused in step 2 for what the client already has of their
// CI (logo, CI guide, colours, font): stored on draft.ciAssets instead of draft.references,
// no "what do you like" chips and no examples box.
function ReferenceEditor({ draft, updateDraft, variant = "inspiration" }: any) {
  const ci = variant === "ci";
  const field: "references" | "ciAssets" = ci ? "ciAssets" : "references";
  // ── URL list state ── committed immediately on Enter/blur, no separate save step
  const [urls, setUrls] = useState<{ id: string; value: string; note?: string; likes?: string[]; noteLinks?: string[] }[]>(() =>
    (draft[field] ?? [])
      .filter((r: any) => r.type === "url")
      .map((r: any) => ({ id: r.id, value: r.value, note: r.note, likes: r.likes, noteLinks: r.noteLinks }))
  );
  const [urlInput, setUrlInput] = useState("");
  // Recomputed every keystroke — pure parsing against the current list, no debounce needed.
  const urlValidation = useMemo(() => validateUrlInput(urlInput, urls), [urlInput, urls]);
  // Inspiration only: a Google Drive link belongs in the note below (20 Nov 2026), so this
  // field won't take one. The CI field (step 2) still does.
  const driveHere = !ci && urlValidation === "valid" && isDriveUrl(urlInput.trim());

  // ── Image + document list state (base64 data-uri) ── PDFs ride in the same gallery
  // (user test BTS: "แนบได้ทั้งเอกสาร รูป และลิงก์"), stored as type "file".
  const [images, setImages] = useState<{ id: string; src: string; name: string; note?: string; likes?: string[]; noteLinks?: string[]; kind?: "pdf" }[]>(() =>
    (draft[field] ?? [])
      .filter((r: any) => r.type === "image" || r.type === "file")
      .map((r: any) => ({ id: r.id, src: r.value, name: r.label ?? "", note: r.note, likes: r.likes, noteLinks: r.noteLinks, kind: r.type === "file" ? "pdf" as const : undefined }))
  );
  const [uploadError, setUploadError] = useState("");

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
  // A removal can be undone for 5 s (a bar at the bottom) instead of asking first
  type Removed =
    | { kind: "url"; item: (typeof urls)[number]; index: number }
    | { kind: "image"; item: (typeof images)[number]; index: number };
  const [undo, setUndo] = useState<Removed | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(undoTimer.current), []);
  const offerUndo = (removed: Removed) => {
    clearTimeout(undoTimer.current);
    setUndo(removed);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };
  const undoRemove = () => {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    if (undo.kind === "url") {
      const next = [...urls];
      next.splice(Math.min(undo.index, next.length), 0, undo.item);
      setUrls(next);
      syncToDraft(next, images);
    } else {
      const next = [...images];
      next.splice(Math.min(undo.index, next.length), 0, undo.item);
      setImages(next);
      syncToDraft(urls, next);
    }
    setUndo(null);
  };
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
      .map((u) => ({ id: u.id, type: "url" as const, category: "favorite" as const, value: u.value, label: u.value, note: u.note?.trim() || undefined, likes: u.likes?.length ? u.likes : undefined, noteLinks: u.noteLinks?.length ? u.noteLinks : undefined }));
    const imgItems = nextImages
      .map((img) => ({ id: img.id, type: img.kind === "pdf" ? "file" as const : "image" as const, category: "favorite" as const, value: img.src, label: img.name, note: img.note?.trim() || undefined, likes: img.likes?.length ? img.likes : undefined, noteLinks: img.noteLinks?.length ? img.noteLinks : undefined }));
    updateDraft({ [field]: [...urlItems, ...imgItems] });
  }, [updateDraft, field]);

  // Note handlers — typing updates the item's note immediately (no separate save step).
  // Unlike remove (above), these fire straight from a textarea `onChange` inside a React
  // event handler, where a functional setState updater is queued rather than run inline —
  // reading its result on the very next line would still see the pre-update value. So this
  // computes `next` directly off the current `urls`/`images` closure (same as `commitUrl`'s
  // plain-value commit) instead of that "capture inside the updater" pattern.
  // "ชอบอะไรในเว็บนี้" chips — same direct-commit pattern as the notes below.
  const toggleLike = (id: string, like: string) => {
    const flip = (l?: string[]) => (l?.includes(like) ? l.filter((x) => x !== like) : [...(l ?? []), like]);
    if (urls.some((u) => u.id === id)) {
      const next = urls.map((u) => (u.id === id ? { ...u, likes: flip(u.likes) } : u));
      setUrls(next);
      syncToDraft(next, images);
    } else {
      const next = images.map((img) => (img.id === id ? { ...img, likes: flip(img.likes) } : img));
      setImages(next);
      syncToDraft(urls, next);
    }
  };
  // An item's note text and its link tags can change in the same event (a paste with a
  // link in it): both go through this live copy so neither overwrites the other.
  const live = useRef({ urls, images });
  useEffect(() => { live.current = { urls, images }; });
  const patchItem = (id: string, patch: { note?: string; noteLinks?: string[] }) => {
    const cur = live.current;
    if (cur.urls.some((u) => u.id === id)) {
      const next = cur.urls.map((u) => (u.id === id ? { ...u, ...patch } : u));
      live.current = { ...cur, urls: next };
      setUrls(next);
      syncToDraft(next, cur.images);
    } else {
      const next = cur.images.map((img) => (img.id === id ? { ...img, ...patch } : img));
      live.current = { ...cur, images: next };
      setImages(next);
      syncToDraft(cur.urls, next);
    }
  };
  // "ล้าง" in the item sheet: the note and the picked likes go, the item stays
  const clearItem = (id: string) => {
    if (urls.some((u) => u.id === id)) {
      const next = urls.map((u) => (u.id === id ? { ...u, note: "", likes: [], noteLinks: [] } : u));
      setUrls(next);
      syncToDraft(next, images);
    } else {
      const next = images.map((img) => (img.id === id ? { ...img, note: "", likes: [], noteLinks: [] } : img));
      setImages(next);
      syncToDraft(urls, next);
    }
  };

  // URL handlers — one input, commit on Enter/blur, appears straight in the board.
  // A short "loading" beat runs before the card actually lands (see isCommittingUrl above).
  // A valid link still sitting in the box when the step is left (Next, Back, a step pill)
  // is added rather than lost.
  const pendingRef = useRef({ input: urlInput, urls, images });
  useEffect(() => { pendingRef.current = { input: urlInput, urls, images }; });
  useEffect(() => () => {
    const { input, urls: u, images: im } = pendingRef.current;
    const value = input.trim();
    if (value && u.length < MAX_REFERENCE_URLS && validateUrlInput(value, u) === "valid" && (ci || !isDriveUrl(value))) {
      syncToDraft([...u, { id: Math.random().toString(36).slice(2), value }], im);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "เพิ่มลิงก์" is never greyed out (user test 24 Nov 2026: the grey button beside an empty
  // field read as "this step is locked"). Pressed before a usable link is in the field, it
  // puts the cursor in the field and, when it's empty, says what to do.
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [askPaste, setAskPaste] = useState(false);
  const urlReady = urlValidation === "valid" && !driveHere;
  const pressAddUrl = () => {
    if (urlReady) { commitUrl(); return; }
    urlInputRef.current?.focus();
    if (urlValidation === "empty") setAskPaste(true);
  };
  const commitUrl = () => {
    if (isCommittingUrl) return;
    const value = urlInput.trim();
    if (!value || urlValidation !== "valid" || driveHere) return;
    setIsCommittingUrl(true);
    clearTimeout(commitUrlTimer.current);
    commitUrlTimer.current = setTimeout(() => {
      const id = Math.random().toString(36).slice(2);
      const next = [...urls, { id, value }];
      setUrls(next);
      setUrlInput("");
      syncToDraft(next, images);
      flashNew(id);
      setNoteEditing(id);
      // Floating preview (all widths) — shows the actual favicon-style swatch rather than
      // a bare checkmark, so it's a genuine visual preview, not only a confirmation message.
      useFloatingPreview.getState().show(
        <span className="w-full h-full flex items-center justify-center" style={{ background: URL_THUMB_THEMES[0] }}>
          {isVideoUrl(value) ? <span className="text-[9px] text-white">▶</span> : <IconGlobe width={11} height={11} className="text-white/80" />}
        </span>,
        isDriveUrl(value) ? "เพิ่มลิงก์ Google Drive แล้ว" : isVideoUrl(value) ? "เพิ่มวิดีโอแล้ว" : "เพิ่มเว็บไซต์แล้ว",
        linkLabel(value)
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
    const removedAt = urls.findIndex((u) => u.id === id);
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
      if (removed) offerUndo({ kind: "url", item: removed, index: removedAt });
    }, 220);
  };

  // Image handlers
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    Array.from(files).forEach((file) => {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      // video files can't be kept here (answers stay in this browser): point to a link instead
      if (file.type.startsWith("video/")) { setUploadError(`${file.name}: ไฟล์วิดีโอแนบตรงไม่ได้ · อัปโหลดไว้ที่ Google Drive หรือ YouTube แล้ววางลิงก์ในช่องด้านบน`); return; }
      if (!file.type.startsWith("image/") && !isPdf) { setUploadError(`${file.name}: รองรับเฉพาะรูปภาพและไฟล์ PDF`); return; }
      // the demo keeps files in the browser, so documents are capped
      if (isPdf && file.size > MAX_PDF_BYTES) { setUploadError(`${file.name}: ไฟล์ PDF ต้องไม่เกิน 5 MB`); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const newImg = { id: Math.random().toString(36).slice(2), src, name: file.name, ...(isPdf ? { kind: "pdf" as const } : {}) };
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
        setNoteEditing(newImg.id);
        // Floating preview (all widths) — an actual thumbnail crop of the uploaded image,
        // the clearest possible confirmation of what just got added.
        useFloatingPreview.getState().show(
          isPdf
            ? <span className="w-full h-full grid place-items-center bg-red-50 text-[9px] font-bold text-red-700">PDF</span>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={src} alt="" draggable={false} className="w-full h-full object-cover block select-none wrs-no-callout" />,
          isPdf ? "เพิ่มเอกสารแล้ว" : "เพิ่มรูปภาพแล้ว",
          file.name
        );
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (id: string) => {
    if (removingIds.has(id)) return; // already fading out
    const removed = images.find((img) => img.id === id);
    const removedAt = images.findIndex((img) => img.id === id);
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
      if (removed) offerUndo({ kind: "image", item: removed, index: removedAt });
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
  // examples box: a hand toggle wins (remembered per browser); otherwise open until something is added
  const examplesId = useId();
  const [examplesPref, setExamplesPref] = useState<boolean | null>(() => {
    try { const v = localStorage.getItem("wrs-ref-examples"); return v === null ? null : v === "1"; } catch { return null; }
  });
  const examplesOpen = examplesPref ?? total === 0;
  const toggleExamples = () => {
    const next = !examplesOpen;
    setExamplesPref(next);
    try { localStorage.setItem("wrs-ref-examples", next ? "1" : "0"); } catch { /* private mode: this visit only */ }
  };
  const urlCapReached = urls.length >= MAX_REFERENCE_URLS;

  return (
    <div>
      {/* No intro sentence here: the step's own subtitle already says what to add (the
          two read as a repeat once the mode picker was gone). */}
      {/* What to put here — user tests: people tried hard but weren't sure what counts. */}
      {/* Collapsible (19 Nov 2026): open while nothing is added, folded once something is;
          a toggle by hand is remembered in this browser. */}
      {SHOW_REF_EXAMPLES && !ci && <div className="mb-5 rounded-xl bg-ir-sunken">
        <button type="button" onClick={toggleExamples} aria-expanded={examplesOpen} aria-controls={examplesId}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left focus-ring">
          <span className="flex-1 text-small font-semibold text-ir-t1">ตัวอย่างสิ่งที่ใส่ได้</span>
          <svg width={18} height={18} viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`shrink-0 text-ir-t2 transition-transform duration-fast ${examplesOpen ? "rotate-180" : ""}`}>
            <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {examplesOpen && <ul id={examplesId} className="-mt-1 grid gap-1 px-4 pb-3 text-small text-ir-t2 sm:grid-cols-2">
          {["เว็บ IR ของบริษัทที่ชอบ ทั้งในและต่างประเทศ", "เว็บของบริษัทในเครือหรือแบรนด์หลักของคุณ", "วิดีโอแนะนำองค์กร หรือคลิปที่ชอบ (ลิงก์ YouTube หรือ Google Drive)", "ภาพหน้าจอ รายงานประจำปี หรือคู่มือ CI (PDF)"].map((t) => (
            <li key={t} className="flex items-start gap-1.5"><span aria-hidden="true" className="text-ir-accent-text">•</span>{t}</li>
          ))}
        </ul>}
      </div>}

      {/* Mobile/tablet (<768px): Input → Gallery → Upload, so a newly added reference lands
          right under the input with no scrolling — the floating preview + counter confirm
          success without needing the gallery to be the sole signal. Desktop (md+):
          Input → Upload → Gallery, unchanged — only the `order-*`/`md:order-*` pairs below
          reorder. */}
      <div className="flex flex-col">
        {/* ── Website links — unified input+button as one control, no visual seam ── */}
        <div className="order-1 mb-4">
          <div className="flex items-baseline gap-2">
            <SectionLabel>{ci ? "แนบลิงก์" : "เว็บไซต์หรือวิดีโอที่ชอบ"}</SectionLabel>
            <span className="whitespace-nowrap text-small text-ir-t3">(ไม่บังคับ)</span>
            <span role="status" className={`ml-auto inline-flex h-6 shrink-0 self-baseline items-center rounded-full px-2 text-caption font-semibold leading-none tabular-nums ${urls.length ? "bg-ir-accent-soft text-ir-accent-text" : "bg-ir-muted text-ir-t2"}`}>
              {urls.length}/{MAX_REFERENCE_URLS} ลิงก์
            </span>
          </div>
          <div
            // 4px inset all round and radii that nest (12 outside, 8 on the button), so the
            // button sits inside the field at every width instead of jammed into its corner
            // (19 Nov 2026: on phones it touched the edge and looked cut off)
            // the focus ring belongs to the whole field (the input's own ring drew a box inside it)
            className={`flex items-center gap-1 rounded-xl border bg-ir-card p-1 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_rgba(215,224,39,0.28)] ${
              {
                empty: "border-ir-border focus-within:border-ir-accent/50",
                valid: "border-ir-accent/50",
                existing: "border-ir-t2/40",
                unsupported: "border-ir-warn/50",
                invalid: "border-ir-error/50",
              }[driveHere ? "unsupported" : urlValidation]
            }`}
          >
            <IconGlobe width={18} height={18} aria-hidden="true" className="ml-2.5 shrink-0 text-ir-t3" />
            {/* short enough to show whole on a phone; what counts is in the examples box */}
            <input
              type="url"
              aria-label={ci ? "ลิงก์ CI" : "ลิงก์เว็บไซต์หรือวิดีโอ"}
              placeholder={urlCapReached ? `ครบ ${MAX_REFERENCE_URLS} ลิงก์แล้ว` : ci ? "วางลิงก์ เช่น โลโก้ คู่มือ หรือ Google Drive" : "วางลิงก์ที่นี่"}
              ref={urlInputRef}
              value={urlInput}
              disabled={urlCapReached}
              aria-invalid={urlValidation === "invalid" || urlValidation === "unsupported"}
              onChange={(e) => { setUrlInput(e.target.value); setAskPaste(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); }}
              className="h-11 flex-1 min-w-0 bg-transparent px-1 text-body text-ir-t1 placeholder:text-ir-t3 outline-none !shadow-none disabled:cursor-not-allowed"
            />
            {/* lime once the pasted link is usable; before that a white outlined button that
                still reads as pressable (only the link cap disables it) */}
            <button
              onClick={pressAddUrl}
              disabled={urlCapReached}
              data-pulse={urlReady || undefined}
              aria-busy={isCommittingUrl}
              className={`h-11 shrink-0 flex items-center gap-1.5 rounded-lg px-4 text-body font-semibold whitespace-nowrap active:scale-[0.97] transition-[background-color,color,box-shadow,scale] disabled:bg-transparent disabled:text-ir-t3 disabled:shadow-[inset_0_0_0_1px_var(--color-ir-border)] disabled:cursor-not-allowed disabled:active:scale-100 ${urlReady ? "text-ir-on-accent bg-ir-accent hover:bg-ir-accent-hi" : "bg-white text-ir-t1 shadow-[inset_0_0_0_1px_var(--color-ir-border)] hover:bg-ir-muted"}`}
            >
              {/* Icon swaps between four states — idle (+) / loading (spinner) / completed
                  (check) — each mount plays a short, non-bouncy fade+scale so the swap reads
                  as one smooth transition rather than an abrupt pixel-swap. The button's own
                  disabled state (empty input / link cap) is unaffected — it's a separate,
                  persistent condition, not one of these three transient icon states. */}
              {isCommittingUrl ? (
                <Spinner key="loading" size={16} className="ref-btn-icon-in" />
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
          {/* nothing under an empty field (20 Nov 2026: the ①② steps went); a usable link
              turns the button lime and says to press it */}
          {urlValidation === "empty" ? (askPaste && !urlCapReached ? (
            <p role="status" className="hint-in mt-1.5 flex items-start gap-1.5 text-small text-ir-t2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ir-t3" />
              วางลิงก์ในช่องก่อน แล้วกด “เพิ่มลิงก์” · ไม่มีลิงก์ ข้ามขั้นนี้ได้
            </p>
          ) : null) : driveHere ? (
            <p role="status" className="mt-1.5 flex items-center gap-1.5 text-small text-ir-warn">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ir-warn" />
              ลิงก์ Google Drive ใส่ในช่องหมายเหตุเพิ่มเติมด้านล่าง
            </p>
          ) : (
            <p role="status" className={`text-small mt-1.5 flex items-center gap-1.5 ${URL_VALIDATION_COPY[urlValidation].textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${URL_VALIDATION_COPY[urlValidation].dotClass}`} />
              {URL_VALIDATION_COPY[urlValidation].label}
            </p>
          )}
          {urlValidation === "valid" && !driveHere && linkKindHint(urlInput) && (
            <p className="mt-1 flex items-start gap-1.5 text-small text-ir-t2"><span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ir-warn" />{linkKindHint(urlInput)}</p>
          )}
          {/* A Drive file the team can't open is useless — remind them to share it. */}
          {urlValidation === "valid" && ci && isDriveUrl(urlInput) && (
            <p className="mt-1 text-small text-ir-t2">ตั้งค่าการแชร์ไฟล์ใน Google Drive เป็น “ทุกคนที่มีลิงก์” ก่อน เพื่อให้ทีมเปิดดูได้</p>
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
                <span className="text-small font-semibold text-ir-t2">เพิ่มแล้ว</span>
                <span className={`text-small font-bold w-5 h-5 flex items-center justify-center rounded-full bg-ir-accent text-ir-on-accent leading-none tabular-nums ${(lastAddedId || removePulse) ? "wrs-counter-pop" : ""}`}>{total}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {urls.map((u, i) => (
                  <div
                    key={u.id}
                    className={`relative group rounded-sm overflow-hidden border border-ir-border shrink-0 ${u.id === lastAddedId ? "reference-card-insert" : ""} ${removingIds.has(u.id) ? "wrs-row-removing pointer-events-none" : ""}`}
                    style={{ width: 72, height: 72, animationDelay: u.id === lastAddedId ? `${GALLERY_TILE_DELAY_MS}ms` : undefined }}
                  >
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1 px-1 pb-6 text-center"
                      style={{ background: URL_THUMB_THEMES[i % URL_THUMB_THEMES.length] }}
                    >
                      {isVideoUrl(u.value)
                        ? <span aria-label="วิดีโอ" className="grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[9px] text-ir-t1">▶</span>
                        : <IconGlobe width={12} height={12} className="text-white/70" />}
                      <span className="text-white text-[8px] font-medium truncate max-w-full px-1">{isVideoUrl(u.value) && !isDriveUrl(u.value) ? "วิดีโอ · " : ""}{linkLabel(u.value)}</span>
                    </div>
                    {/* No per-tile checkmark — every tile in this gallery is, by definition,
                        already added (that's what the "เพิ่มแล้ว N" header above it means),
                        so a checkmark repeated on each one added nothing a viewer didn't
                        already know from the section it's sitting in. */}
                    {/* Corner ✕: a hover shortcut for mouse screens only. On touch screens it was
                        too small to hit and easy to tap by mistake, so deleting lives in the
                        item sheet there (19 Nov 2026). */}
                    {/* the whole tile opens the item sheet (likes, note, delete) */}
                    <button type="button" onClick={() => setNoteEditing(u.id)} aria-label={`เปิด ${linkLabel(u.value)}`} className="absolute inset-0 focus-ring" />
                    <button
                      onClick={() => removeUrl(u.id)}
                      aria-label="ลบเว็บไซต์นี้"
                      className="absolute -top-0.5 -left-0.5 rounded-full bg-black/50 text-white hidden items-center justify-center [@media(hover:hover)]:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-[opacity,transform] hover:bg-red-500 active:bg-red-500 active:scale-90"
                      style={{ width: 24, height: 24 }}
                    >
                      <IconClose width={8} height={8} />
                    </button>
                    {/* Note toggle — mirrors the remove button (same size/visibility rules),
                        opposite corner. A filled accent dot stays visible even when this
                        button itself is hover-hidden, so "this one has a note" reads at a
                        glance without needing to hover every tile. */}
                    {/* note: an always-visible band on the tile (user test AOT couldn't find the old
                        hover-only pencil) — "+ โน้ต" when empty, "✎ โน้ต" once written */}
                    <button
                      onClick={() => setNoteEditing(noteEditing === u.id ? null : u.id)}
                      aria-label={u.note ? "แก้ไขโน้ต" : "เพิ่มโน้ต"}
                      aria-expanded={noteEditing === u.id}
                      className={`absolute inset-x-0 bottom-0 flex h-6 items-center justify-center text-[10px] font-semibold transition-colors focus-ring ${
                        noteEditing === u.id || (u.note || u.likes?.length) ? "bg-ir-accent text-ir-on-accent" : "bg-black/60 text-white hover:bg-black/75"
                      }`}
                    >
                      {(u.note || u.likes?.length) ? "✎ โน้ต" : "+ โน้ต"}
                    </button>
                  </div>
                ))}
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`relative group rounded-sm overflow-hidden border border-ir-border shrink-0 ${img.id === lastAddedId ? "reference-card-insert" : ""} ${removingIds.has(img.id) ? "wrs-row-removing pointer-events-none" : ""}`}
                    style={{ width: 72, height: 72, animationDelay: img.id === lastAddedId ? `${GALLERY_TILE_DELAY_MS}ms` : undefined }}
                  >
                    {img.kind === "pdf" ? (
                      <span className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-50 px-1 text-center select-none">
                        <span className="rounded-xs bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">PDF</span>
                        <span className="w-full truncate text-[8px] font-medium text-red-900">{img.name}</span>
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.src}
                        alt={img.name}
                        draggable={false}
                        className="w-full h-full object-cover block select-none wrs-no-callout"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    <button type="button" onClick={() => setNoteEditing(img.id)} aria-label={`เปิด ${img.name}`} className="absolute inset-0 focus-ring" />
                    <button
                      onClick={() => removeImage(img.id)}
                      aria-label="ลบรูปภาพนี้"
                      className="absolute -top-0.5 -left-0.5 rounded-full bg-black/50 text-white hidden items-center justify-center [@media(hover:hover)]:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-[opacity,transform] hover:bg-red-500 active:bg-red-500 active:scale-90"
                      style={{ width: 24, height: 24 }}
                    >
                      <IconClose width={8} height={8} />
                    </button>
                    {/* note: an always-visible band on the tile (user test AOT couldn't find the old
                        hover-only pencil) — "+ โน้ต" when empty, "✎ โน้ต" once written */}
                    <button
                      onClick={() => setNoteEditing(noteEditing === img.id ? null : img.id)}
                      aria-label={img.note ? "แก้ไขโน้ต" : "เพิ่มโน้ต"}
                      aria-expanded={noteEditing === img.id}
                      className={`absolute inset-x-0 bottom-0 flex h-6 items-center justify-center text-[10px] font-semibold transition-colors focus-ring ${
                        noteEditing === img.id || (img.note || img.likes?.length) ? "bg-ir-accent text-ir-on-accent" : "bg-black/60 text-white hover:bg-black/75"
                      }`}
                    >
                      {(img.note || img.likes?.length) ? "✎ โน้ต" : "+ โน้ต"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Item sheet (19 Nov 2026): opens right after an add, or on a tile tap. Bottom
                  sheet on phones, centred dialog from sm up: what was added, what they like in
                  it, a note, clear, and delete (the only delete on touch screens). Everything
                  saves as it's typed, so closing never loses anything. */}
              {(() => {
                const editingUrl = urls.find((u) => u.id === noteEditing);
                const editingImage = images.find((img) => img.id === noteEditing);
                if (!editingUrl && !editingImage) return null;
                const id = noteEditing!;
                const hasNote = !!((editingUrl ? editingUrl.note : editingImage!.note) || (editingUrl ? editingUrl.likes : editingImage!.likes)?.length || (editingUrl ? editingUrl.noteLinks : editingImage!.noteLinks)?.length);
                const remove = () => { setNoteEditing(null); if (editingUrl) removeUrl(id); else removeImage(id); };
                return (
                  <ItemSheet
                    title={editingUrl ? linkLabel(editingUrl.value) : editingImage!.name}
                    onClose={() => setNoteEditing(null)}
                    preview={editingUrl ? (
                      <div className="flex items-start gap-3 rounded-xl border border-ir-border-soft bg-ir-sunken p-3">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg" style={{ background: URL_THUMB_THEMES[Math.max(0, urls.indexOf(editingUrl)) % URL_THUMB_THEMES.length] }}>
                          {isVideoUrl(editingUrl.value) ? <span className="text-small text-white">▶</span> : <IconGlobe width={20} height={20} className="text-white/85" />}
                        </span>
                        <span className="min-w-0 flex-1 self-center">
                          <span className="block truncate text-body font-semibold text-ir-t1">{linkLabel(editingUrl.value)}</span>
                          <span className="mt-0.5 block truncate text-small text-ir-t3">{editingUrl.value}</span>
                        </span>
                        <a href={editingUrl.value} target="_blank" rel="noopener noreferrer" aria-label="เปิดเว็บไซต์" title="เปิดเว็บไซต์"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ir-border bg-white text-ir-t2 transition-colors hover:border-ir-border-hi hover:text-ir-t1 focus-ring">
                          <IconExternalLink width={16} height={16} />
                        </a>
                      </div>
                    ) : editingImage!.kind === "pdf" ? (
                      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                        <span className="rounded-sm bg-red-600 px-2 py-1 text-small font-bold text-white">PDF</span>
                        <span className="min-w-0 flex-1 truncate text-body font-semibold text-red-900">{editingImage!.name}</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editingImage!.src} alt={editingImage!.name} className="max-h-56 w-full rounded-xl bg-ir-sunken object-contain" />
                    )}
                    footer={<>
                      <button type="button" onClick={remove}
                        className="inline-flex h-11 items-center rounded-full px-3 text-body font-semibold text-ir-error transition-colors hover:bg-red-50 focus-ring">
                        ลบรายการนี้
                      </button>
                      <button type="button" onClick={() => setNoteEditing(null)}
                        className="inline-flex h-11 items-center rounded-full bg-ir-dark px-7 text-body font-semibold text-white transition-[background-color,scale] hover:bg-neutral-800 active:scale-[0.98] focus-ring">
                        เสร็จ
                      </button>
                    </>}
                  >
                    {!ci && <>
                    <p className="mb-1.5 text-small font-semibold text-ir-t1">ชอบอะไรใน{editingUrl ? (isDriveUrl(editingUrl.value) ? "ไฟล์นี้" : isVideoUrl(editingUrl.value) ? "วิดีโอนี้" : "เว็บนี้") : editingImage!.kind === "pdf" ? "เอกสารนี้" : "ภาพนี้"}?</p>
                    <div role="group" aria-label="สิ่งที่ชอบ" className="mb-2.5 flex flex-wrap gap-1.5">
                      {REFERENCE_LIKES.map((like) => {
                        const on = (editingUrl ? editingUrl.likes : editingImage!.likes)?.includes(like) ?? false;
                        return (
                          <button
                            key={like}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleLike(noteEditing!, like)}
                            className={`inline-flex min-h-11 min-w-11 justify-center items-center gap-1 rounded-full border px-3 text-small sm:min-h-9 sm:min-w-0 font-medium transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${
                              on ? "border-ir-select bg-ir-accent-soft text-ir-t1" : "border-ir-border bg-white text-ir-t2 hover:border-ir-select-soft"
                            }`}
                          >
                            {on && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className="sel-check text-ir-accent-text" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" /></svg>}
                            {like}
                          </button>
                        );
                      })}
                    </div>
                    </>}
                    <NoteField key={noteEditing ?? ""} className="mt-1" label="หมายเหตุเพิ่มเติม" rows={2}
                      hint="หากมีสิ่งที่ชอบในรายการนี้ หรือรายละเอียดที่อยากให้ทีมออกแบบทราบ สามารถระบุไว้ได้เลย"
                      value={editingUrl ? (editingUrl.note ?? "") : (editingImage!.note ?? "")}
                      onChange={(v) => patchItem(id, { note: v })}
                      links={editingUrl ? editingUrl.noteLinks : editingImage!.noteLinks}
                      onLinksChange={(l) => patchItem(id, { noteLinks: l })}
                      placeholder="ระบุรายละเอียดของรายการนี้…" />
                    {hasNote && (
                      <button type="button" onClick={() => clearItem(id)}
                        className="mt-1 inline-flex h-9 items-center rounded-full px-2 text-small font-semibold text-ir-t3 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring">
                        ล้างโน้ตและสิ่งที่เลือก
                      </button>
                    )}
                  </ItemSheet>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Image upload — centered dropzone, standard upload-card pattern ── */}
        <div className="order-3 md:order-2">
          <div className="flex items-baseline gap-2">
            <SectionLabel>{ci ? "รูปหรือไฟล์" : "รูปภาพหรือเอกสารที่ชอบ"}</SectionLabel>
            <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDropZoneDragOver}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDropZoneDrop}
            className={`flex flex-col items-center text-center gap-1.5 rounded-lg border-2 border-dashed cursor-pointer px-5 py-6 mb-6 transition-colors select-none ${
              isDragOver ? "border-ir-accent bg-ir-accent/[0.06]" : "border-ir-border bg-ir-card hover:border-ir-accent/40 hover:bg-ir-accent/[0.03] active:border-ir-accent/40 active:bg-ir-accent/[0.03]"
            }`}
          >
            <span className="w-10 h-10 rounded-md bg-ir-accent/10 flex items-center justify-center text-title mb-1">🖼️</span>
            <p className="text-body font-semibold text-ir-t1">ลากรูปหรือไฟล์ PDF มาวางที่นี่</p>
            <p className="text-small text-ir-t3">หรือ <span className="text-ir-accent-text font-medium">เลือกจากเครื่อง</span></p>
            <p className="text-small text-ir-t3">รองรับ PNG, JPG, WEBP และ PDF (ไม่เกิน 5 MB) · เพิ่มได้หลายไฟล์พร้อมกัน</p>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {uploadError && <div className="-mt-4 mb-6"><FieldError>{uploadError}</FieldError></div>}
        </div>
      </div>
      {undo && createPortal(
        <div className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}>
          <div role="status"
            onMouseEnter={() => clearTimeout(undoTimer.current)} onMouseLeave={() => offerUndo(undo)}
            onFocus={() => clearTimeout(undoTimer.current)} onBlur={() => offerUndo(undo)}
            className="wrs-floating-preview-in pointer-events-auto flex items-center gap-3 rounded-full bg-ir-dark py-1.5 pl-4 pr-1.5 text-small font-medium text-white shadow-e3">
            ลบ{undo.kind === "url" ? "ลิงก์" : undo.item.kind === "pdf" ? "เอกสาร" : "รูป"}แล้ว
            <button type="button" onClick={undoRemove} className="h-9 rounded-full bg-white/15 px-3.5 font-semibold transition-colors hover:bg-white/25 focus-ring">เลิกทำ</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── Mode picker — replaces the old "both sections shown, loser dims" layout. The
// customer commits to one path up front (their own references, or AI-curated examples)
// and only that section renders below — the other path's data (if any) is kept, not
// cleared, so switching back and forth never loses work already done in it.
function ReferenceModePicker({ mode, setMode, hasCustom, hasCurated }: { mode: "custom" | "curated" | null; setMode: (m: "custom" | "curated") => void; hasCustom: boolean; hasCurated: boolean }) {
  const OPTIONS: { id: "custom" | "curated"; title: string; desc: string; hasData: boolean }[] = [
    { id: "custom", title: "วางลิงก์หรือรูปเว็บที่ชอบ", desc: "มีเว็บหรือรูปในใจอยู่แล้ว อยากให้ทีมดูของจริง", hasData: hasCustom },
    { id: "curated", title: "ให้ทีมช่วยหาเว็บไซต์ตัวอย่าง", desc: "ยังไม่มีตัวอย่างในใจ ให้ทีม IR Plus คัดมาให้เลือก", hasData: hasCurated },
  ];
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <SectionLabel>วิธีเพิ่มแรงบันดาลใจ</SectionLabel>
        <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
      </div>
      <p className="-mt-1 mb-3 text-body text-ir-t3">เลือกวิธีที่สะดวก สลับไปอีกแบบได้ทุกเมื่อ ข้อมูลไม่หาย</p>
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
  // With the curated path off there's nothing to choose: the editor shows straight away
  // and old curated picks (never sent to the team anyway) don't count as content.
  const hasCurated = SHOW_CURATED_REFERENCES && (draft?.curatedSelected?.length ?? 0) > 0;
  // Persisted on draft so leaving and returning to this step remembers the choice. Never
  // defaulted to either option on a genuinely fresh draft — only inferred from content
  // that already exists, so a first-time visitor sees the picker, not a path pre-chosen
  // for them.
  const mode: "custom" | "curated" | null = !SHOW_CURATED_REFERENCES ? "custom" : draft?.referenceMode ?? (hasCustom ? "custom" : hasCurated ? "curated" : null);
  const setMode = (m: "custom" | "curated") => updateDraft({ referenceMode: m });

  return (
    <div>
      <Head
        n={5}
        title="เพิ่มเติมแรงบันดาลใจ"
        sub="แนบเว็บ IR ที่ชอบ เว็บในเครือ ภาพหน้าจอ รายงานประจำปี หรือคู่มือ CI"
        optional
      />
      {/* "Skippable" is said in plain text, not a badge: "(ไม่บังคับ)" on the title, the
          subtitle, and the next button reading "ข้ามขั้นนี้" until something is added. The
          earlier pill badge read as a button or tab, and a hint beside the button repeated
          the subtitle, so both are gone. */}

      {/* Same rhythm as the other steps (user test BTS: this page looked unlike the rest):
          a section label + one-line description per group, dividers between groups. */}
      {SHOW_CURATED_REFERENCES && <ReferenceModePicker mode={mode} setMode={setMode} hasCustom={hasCustom} hasCurated={hasCurated} />}

      {mode === "custom" && (
        <>
          {SHOW_CURATED_REFERENCES && <SectionDivider />}
          <ReferenceEditor draft={draft} updateDraft={updateDraft} />
        </>
      )}

      {SHOW_CURATED_REFERENCES && mode === "curated" && (
        <>
          <SectionDivider />
          <div className="mb-2">
            <SectionLabel>เว็บไซต์ตัวอย่างที่ทีมคัดมา</SectionLabel>
            <CuratedReferenceBoard dir={dir} draft={draft} updateDraft={updateDraft} />
          </div>
        </>
      )}

      {/* Text-only inspiration (user test AOT: "Note เป็น Text ได้") — describe what they
          like without needing a link or picture. Available whichever way they chose above. */}
      <SectionDivider />
      <NoteField id="inspiration-note" className="mb-6" label="หมายเหตุเพิ่มเติม"
        hint="หากมีสไตล์ที่ชอบ ลิงก์ Google Drive หรือรายละเอียดที่อยากให้ทีมออกแบบทราบ สามารถระบุไว้ได้เลย"
        value={draft.inspirationNote ?? ""} onChange={(v) => updateDraft({ inspirationNote: v })}
        links={draft.noteLinks?.inspiration} onLinksChange={(l) => updateDraft({ noteLinks: { ...draft.noteLinks, inspiration: l } })}
        placeholder="ระบุสิ่งที่ชอบ…" />

      <StepNav
        onBack={() => go(6)}
        next={<NextButton onClick={() => go(8)}>{hasCustom || hasCurated || draft.inspirationNote?.trim() ? "ดูสรุปของคุณ" : "ข้ามไปดูสรุป"}</NextButton>}
      />
    </div>
  );
}

// "ผู้ร่วมตัดสินใจ (ไม่บังคับ)" on the deliver step: off (19 Nov 2026), code kept. Names
// already typed into an older draft still reach the team.
const SHOW_CO_DECIDERS = false;

// Moodboard / document switch (23 Nov 2026): a floating viewer control at the bottom of the
// screen, not part of the sheet (inside the sheet's header it read as part of the design).
// Same look as the homepage's mode switch (white blurred pill), centred so it clears the
// back-to-top button. Shown only while the summary is on screen, so on a phone it never
// covers the contact form below it. Both views show the same answers.
function SheetViewSwitch({ value, onChange, targetId }: { value: SheetView; onChange: (v: SheetView) => void; targetId: string }) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    // shown while the summary fills at least a third of the screen (a sliver of it at the
    // top while reading the form does not count)
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      setOnScreen(Math.min(r.bottom, vh) - Math.max(r.top, 0) >= vh / 3);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll, { capture: true }); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [targetId]);
  const opts: { v: SheetView; label: string; icon: ReactNode }[] = [
    { v: "board", label: "Moodboard", icon: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></> },
    { v: "doc", label: "เอกสาร", icon: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></> },
  ];
  return (
    <div className={`no-print fixed left-1/2 z-30 -translate-x-1/2 transition-[opacity,translate] duration-200 ${onScreen ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }} inert={!onScreen}>
      <div role="radiogroup" aria-label="ดูสรุปแบบ" className="flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 text-caption sm:pl-3.5 font-medium shadow-e2 backdrop-blur">
        <span className="hidden whitespace-nowrap pr-1 text-ir-t3 sm:inline" aria-hidden="true">ดูสรุปแบบ</span>
        {opts.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 font-semibold transition-colors focus-ring ${value === o.v ? "bg-ir-dark text-white" : "text-ir-t2 hover:text-ir-t1"}`}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{o.icon}</svg>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function S6Deliver({ go, draft, updateDraft, submit, addTimelineEntry, addNotebookEntry, router }: any) {
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  // Name, position and email are required — the send button stops until they're filled
  // (user decision after the CPALL test). Phone and LINE stay optional: only a malformed
  // phone number is an error.
  const contactErrors = {
    name: draft.name.trim() ? "" : "กรุณากรอกชื่อ-นามสกุล",
    position: draft.position?.trim() ? "" : "กรุณากรอกตำแหน่ง",
    email: emailError(draft.email),
    phone: phoneError(draft.phone), // phone is always shown now; only a malformed number is an error
  };
  const showError = (field: keyof typeof contactErrors) => (touched[field] || attempted) ? contactErrors[field] : "";
  const markTouched = (field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  const firstInvalid = (["name", "position", "email", "phone"] as const).find((k) => contactErrors[k]);
  const contactComplete = !firstInvalid;
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
    if (submitting) return;
    if (firstInvalid) {
      // Blocked: show every missing field and take them to the first one.
      setAttempted(true);
      const el = document.getElementById(`contact-${firstInvalid}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setSubmitting(true);
    addTimelineEntry?.({
      step: 5, type: "submitted",
      decision: `Requirement ส่งแล้ว ${draft.company}`,
      reasoning: `${draft.directionLabel || "Direction ที่เลือก"} · ${draft.selectedSections.length} Sections · ส่งโดย ${draft.name || draft.email} ทีม IR Plus จะติดต่อกลับโดยเร็ว`,
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
  // which view of the summary is on screen (and in the saved file)
  const [sheetView, setSheetView] = useState<SheetView>("board"); // Moodboard first (23 Nov 2026)

  // Long hesitation nudge if contact fields still empty after 15 s
  const shownHesitation = useRef(false);
  useHesitation(15000, () => {
    if (shownHesitation.current || contactComplete) return;
    shownHesitation.current = true;
    const missing = !draft.name ? "ชื่อ-นามสกุล" : !draft.position?.trim() ? "ตำแหน่ง" : !draft.email ? "Email" : "ข้อมูลติดต่อ";
    g.show(`ใกล้เสร็จแล้วครับ ใส่ ${missing} ไว้ด้วย ทีมจะติดต่อกลับได้ทันที`, { mode: "tip", expert: "analyst", autohide: 10000 });
  });

  return (
    <div>
      {/* Header — full width above the two columns. Same title role as every other step's
          `Head()` (size, mobile/desktop spacing) even though this step's own body breaks
          into its wide two-column layout right below. No divider line for the same reason
          `Head()` no longer has one — the heading is already visually distinct. */}
      <div className="mb-4 pb-4 md:mb-5 md:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-heading font-semibold text-ir-t1 tracking-tight leading-tight" style={{ textWrap: "balance" } as CSSProperties}>ส่งมอบ</h2>
            <p className="text-lead text-ir-t2 leading-relaxed mt-2">ขั้นสุดท้าย · ตรวจสรุปจากคำตอบของคุณ แล้วใส่ช่องทางติดต่อเพื่อส่งให้ทีม IR Plus</p>
          </div>
          {/* keep a copy before sending — a one-page moodboard sheet, downloaded straight
              away (no print dialog, nothing to set up) */}
          <div className="no-print flex shrink-0 items-center gap-2">
            <SaveSheetButton source={draft} kind="pdf" view={sheetView} />
            <SaveSheetButton source={draft} kind="png" view={sheetView} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT: project overview (main visual) ──
            The sheet sits on a dark backdrop like a printed document laid out for review, so
            it reads as the finished result, nothing to fill in, apart from the contact form
            on the right. Not the homepage step's dark card: no rows or controls here, just
            the paper. Print drops the backdrop. */}
        <div className="flex-1 min-w-0 w-full">
          <div className="rounded-2xl bg-ir-dark p-3 pb-18 sm:p-5 sm:pb-18 md:p-7 md:pb-18 print:bg-transparent print:p-0">
            <div className="no-print mb-4 flex min-w-0 items-center gap-3 px-1 sm:mb-5">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ir-accent text-ir-on-accent">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-title font-semibold leading-tight text-white">สรุปผลจากคำตอบของคุณ</p>
                                <p className="mt-0.5 text-small text-white/65">รวบรวมจากคำตอบทั้ง {FLOW_STEPS.length - 1} ขั้นก่อนหน้า</p>
              </div>
            </div>
            {/* two ways to see the same summary (switch floats at the bottom of the screen);
                the PDF / PNG saves the one on screen */}
            <SheetViewSwitch value={sheetView} onChange={setSheetView} targetId="deliver-summary" />
            {/* faint light outline so a dark cover colour still separates from the backdrop */}
            <div id="deliver-summary" className="rounded-sm shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 print:shadow-none print:ring-0">
              <ProjectOverview draft={draft} view={sheetView} />
            </div>
          </div>
        </div>

        {/* ── RIGHT: contact + confirm CTA (sticky sidebar) ── */}
        <aside className="no-print w-full lg:w-[380px] shrink-0 lg:sticky lg:top-4 space-y-4">
          {/* Contact */}
          <div className="rounded-xl border border-ir-border bg-ir-card px-5 pt-5 pb-6 shadow-e1">
            {/* the only thing left to do on this step lives here */}
            <p className="text-lead font-semibold text-ir-t1 mb-1">ข้อมูลติดต่อ</p>
            <p className="text-body text-ir-t3 mb-4">ทีม IR Plus จะติดต่อกลับภายใน {CONTACT_DAYS}</p>
            {/* space-y-4 (not -3) — these are three distinct fields, not tightly related
                sub-parts of one field, so they get a touch more breathing room between them. */}
            <div className="space-y-4">
              <F id="contact-name" required label="ชื่อ-นามสกุล" value={draft.name} onChange={(v) => updateDraft({ name: v })} onBlur={() => markTouched("name")} error={showError("name")} placeholder="ชื่อและนามสกุลผู้ประสานงาน" autoComplete="name" />
              <F id="contact-position" required label="ตำแหน่ง" value={draft.position ?? ""} onChange={(v) => updateDraft({ position: v })} onBlur={() => markTouched("position")} error={showError("position")} placeholder="เช่น ผู้จัดการฝ่ายนักลงทุนสัมพันธ์" autoComplete="organization-title" />
              <F id="contact-email" required label="Email" type="email" autoComplete="email" value={draft.email} onChange={(v) => updateDraft({ email: sanitizeEmailInput(v) })} onBlur={() => markTouched("email")} error={showError("email")} placeholder="name@company.co.th" />
              {/* Phone and LINE always shown, both optional; whether a call suits them is a tick
                  at the foot of this card (19 Nov 2026, replacing the สะดวก / ทางอีเมลพอ pair). */}
<F id="contact-phone" label="โทรศัพท์ (ไม่บังคับ)" type="tel" autoComplete="tel" value={draft.phone} onChange={(v) => updateDraft({ phone: sanitizePhoneInput(v) })} onBlur={() => markTouched("phone")} error={showError("phone")} placeholder="08X-XXX-XXXX" />
              <F label="LINE ID (ไม่บังคับ)" value={draft.lineId ?? ""} onChange={(v) => updateDraft({ lineId: v.trim() })} placeholder="เช่น @irplus หรือ LINE ID ของคุณ" />
            </div>
            {/* unticked until the client ticks it (20 Nov 2026): no nudge towards a call */}
            <label className="group mt-5 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={draft.callbackOk === true} onChange={(e) => updateDraft({ callbackOk: e.target.checked })} className="peer sr-only" />
              {/* lime when ticked, like every other picked thing in the flow */}
              <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border-2 border-ir-border-hi bg-white text-transparent transition-colors group-hover:border-ir-select peer-checked:border-ir-accent peer-checked:bg-ir-accent peer-checked:text-ir-on-accent peer-focus-visible:ring-3 peer-focus-visible:ring-ir-ring/40">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
              </span>
              <span className="text-body text-ir-t1">สะดวกให้ทีมติดต่อกลับ เพื่อคุย<span className="whitespace-nowrap">รายละเอียดเพิ่มเติม</span></span>
            </label>
            <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mt-4 mb-0" />
          </div>

          {/* Others who help decide (user test CPALL: some roles can't decide alone). No shared
              editing here (answers live in this browser), so the team gets their names and
              contacts, and the PDF / PNG above can be passed to them first. */}
          {SHOW_CO_DECIDERS && <CoDeciders draft={draft} updateDraft={updateDraft} />}

          {/* Confirm + submit — one CTA, since "confirm" and "submit" were saying the
              same thing to the customer. The confirm copy now lives as a caption below
              the button instead of its own separate checkbox card. */}
          <div className="rounded-xl border border-ir-border bg-ir-card p-5 shadow-e1">
            <div>
              <button
                onClick={doSubmit}
                disabled={submitting}
                // Same black pill + lime arrow disc as the landing CTA — this is the flow's
                // final primary action. Disabled keeps a readable label on a gray fill.
                className={`group w-full flex items-center justify-between gap-3 h-[52px] rounded-full pl-6 pr-2 text-lead font-semibold transition-[background-color,color,transform] duration-fast focus-ring ${
                  !submitting
                    ? "text-white bg-ir-dark hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
                    : "bg-ir-dark/80 text-white cursor-wait"
                }`}
              >
                {submitting ? <span className="inline-flex items-center gap-2"><Spinner size={18} />กำลังส่ง…</span> : "ยืนยันและส่งให้ทีม IR Plus"}
                <span className={`grid w-9 h-9 place-items-center rounded-full transition-transform duration-fast ${!submitting ? "bg-ir-accent text-ir-on-accent group-hover:translate-x-0.5" : "bg-ir-accent/70 text-ir-on-accent"}`}>
                  <IconArrowRight width={24} height={24} />
                </span>
              </button>
            </div>
            {/* one quiet line: what sending means and what happens next (19 Nov 2026: the
                caption, a grey box and a back button inside the card all weighed the same) */}
            <p className="mt-3 text-center text-small leading-relaxed text-ir-t3">
              เมื่อกดส่ง ถือว่าคุณตรวจภาพรวมแล้ว · ทีมจะติดต่อกลับภายใน <span className="whitespace-nowrap">{CONTACT_DAYS}</span>
            </p>
          </div>
          {/* back: outside the card, as a text link, so it never competes with sending */}
          <div className="flex justify-center">
            <button type="button" onClick={() => go(7)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-body font-medium text-ir-t2 transition-colors hover:text-ir-t1 focus-ring">
              <span aria-hidden="true">←</span> ย้อนกลับไปแก้ไข
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function F({
  label, value, onChange, onBlur, error, placeholder, type = "text", autoComplete, id, required,
}: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string; placeholder?: string; type?: string; autoComplete?: string; id?: string; required?: boolean }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      <label htmlFor={inputId} className="text-body font-medium block mb-1.5">{label}{required && <RequiredMark />}</label>
      <input
        id={inputId}
        required={required}
        aria-required={required || undefined}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={`w-full border rounded-md px-3 py-3 text-body outline-none transition-colors ${error ? "border-red-400 focus:border-red-500" : "border-ir-border focus:border-ir-accent"}`}
      />
      {/* tied to the field and announced (missing-field re-test, user test SCGP) */}
      {error && <p id={`${inputId}-err`} role="alert" className="text-small text-red-600 mt-1">{error}</p>}
    </div>
  );
}
