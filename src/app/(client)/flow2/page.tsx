"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BUSINESS_GOALS, QUIZ, REFERENCE_LIKES, RULES, REQUIRED_SECTION_IDS, RETIRED_SECTION_IDS, IR_AUDIENCES, VISUAL_STYLES, FLOW_STEPS, FLOW_STEPS_EN, unsplashUrl, audienceById, directionById, sectionById } from "@/lib/data";
import { rankDirections, buildProfile, profileToDirection, rankProfileDirections } from "@/lib/recommend";
import { StepIndicator, SectionLabel, SectionDivider, StepNav, NextButton, BackButton, OptionCard, OptionTag, SelectDot, FieldError, useNudge } from "@/components/ui";
import { IconCheck, IconClose, IconPlus, IconArrowRight, IconExternalLink, IconGlobe, IconEdit, OPTION_ICONS } from "@/components/icons";
import { ExploreMock } from "@/components/ExploreMock";
import { RankPicker } from "@/components/RankPicker";
import { StructureBuilder, STRUCTURE_MIN_OPTIONAL, isRecommendedHomepage } from "@/components/StructureBuilder";
import { FONT_PAIRINGS, DEFAULT_PAIRING, fontStack } from "@/lib/fonts";
import { FontChoice } from "@/components/FontPicker";
import { BrandColorInput } from "@/components/BrandColors";
import { BackToTop } from "@/components/BackToTop";
import { chosenThaiFont, familyStack, fontByFamily, previewFamily } from "@/lib/fontCatalog";
import { useGoogleFont } from "@/lib/useGoogleFont";
import type { DesignProfile, QuizOption } from "@/lib/types";
import type { SheetData } from "@/lib/moodboardExport";
import AIJourneyGuide from "@/components/AIJourneyGuide";
import { useGuide } from "@/hooks/useGuide";
import { useHesitation } from "@/hooks/useHesitation";
import { ProjectContextProvider } from "@/components/ProjectContextProvider";
import { useProjectContext } from "@/hooks/useProjectContext";
import { usePreviewPanel } from "@/components/PreviewPanel";
import { AIMascot } from "@/components/AIMascot";
import { useSectionFx } from "@/lib/sectionFx";
import { useFloatingPreview } from "@/lib/floatingPreview";
import { emailError, phoneError, sanitizeEmailInput, sanitizePhoneInput } from "@/lib/validation";
import { DUR, EASE } from "@/lib/motion";

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
const VISIBLE_GOALS = BUSINESS_GOALS.filter((g) => !g.hidden);


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
    let resume = st.draft.flowStep ?? 1;
    if (resume > 3 && !st.draft.selectedDirection) resume = 3;
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <AIMascot mood="insight" size={44} />
        <p className="text-body text-ir-t2 mt-1">กำลังเตรียมระบบ...</p>
      </div>
    );
  }

  const go = (n: number) => {
    // Back moves a whole step: from a later step, Explore reopens at question 1 (not the
    // last question), with the earlier answers still picked.
    if (n === 3 && prevStep.current > 3 && !SHOW_QUIZ_RESULT) setQuizIdx(0);
    setDir(n > prevStep.current ? "forward" : "backward");
    prevStep.current = n;
    setStep(n);
    updateDraft({ flowStep: n });
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
      else go(4);
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
      <div className="no-print"><StepIndicator steps={STEPS} stepsEn={STEPS_EN} current={step} /></div>

      {/* ── Full-width split workspace ── */}
      <BackToTop scrollRef={leftPanelRef} threshold={600} />
      <div className="flex-1 min-h-0 flex md:overflow-hidden print:overflow-visible">

        {/* ── Left: scrollable questionnaire ── */}
        <div
          ref={leftPanelRef}
          className="w-full min-w-0 md:overflow-y-auto print:overflow-visible"
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
                  className={`outline-none bg-ir-card border border-ir-border rounded-xl shadow-e1 p-6 md:p-8 ${dir === "forward" ? "step-enter-forward" : "step-enter-backward"}`}
                  key={`${step}-${quizIdx}-${quizDone}`}
                >
                  {step === 1 && <S1 go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} router={router} />}
                  {step === 2 && <S2Define go={go} draft={draft} updateDraft={updateDraft} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} />}
                  {step === 3 && quizDone && <QuizResult draft={draft} onContinue={() => go(4)} onRetake={retakeQuiz} onChoose={chooseDirection} />}
                  {step === 3 && !quizDone && <S2quiz q={QUIZ[quizIdx]} idx={quizIdx} total={QUIZ.length} onAnswer={(opt: QuizOption) => { answerQuiz(opt); }} onBack={() => (quizIdx > 0 ? setQuizIdx(quizIdx - 1) : go(2))} addTimelineEntry={addTimelineEntry} addNotebookEntry={addNotebookEntry} quizIdx={quizIdx} answered={answers[quizIdx]?.option} />}
                  {step === 4 && <S4Structure go={go} draft={draft} updateDraft={updateDraft} />}
                  {step === 5 && <S5DesignBlueprint go={go} draft={draft} updateDraft={updateDraft} />}
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

function Head({ n: _n, title, sub, optional }: { n: number; title: string; sub?: string; optional?: boolean }) {
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
  // Audience: one flat multi-select — no forced "pick primary first" step.
  // Whichever audience is picked first is still kept as primaryAudience
  // behind the scenes (all the AI tone/priority/density logic downstream
  // reads a single "main" audience), and later picks land in
  // secondaryAudiences. Removing a card promotes the next selected one so
  // primaryAudience is only ever empty when nothing is selected at all.
  const selectedAudiences: string[] = [draft.primaryAudience, ...(draft.secondaryAudiences ?? [])].filter(Boolean);
  // RankPicker does the picking and re-ranking: first pick = primaryAudience, the rest =
  // secondaryAudiences, in rank order.
  const ok = !!(draft.company.trim() && draft.projectType && draft.primaryAudience);
  const nudge = useNudge();
  const companyErr = nudge.field === "company-field" && !draft.company.trim();
  const audienceErr = nudge.field === "audience-field" && !draft.primaryAudience;

  // Older drafts never answered the CI question; existing colours are the default now.
  useEffect(() => {
    if (!draft.hasCorporateIdentity) updateDraft({ hasCorporateIdentity: "yes" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Head n={1} title="ทำความเข้าใจ" sub="บริษัทของคุณ ใครจะเข้ามาดูเว็บ และสีกับฟอนต์ของแบรนด์" />

      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      {/* Company identity grouped */}
      <div className="mb-0 space-y-4">
        <div>
          <SectionLabel>ชื่อบริษัท / องค์กร <span className="text-red-500 font-normal">*</span></SectionLabel>
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

      <SectionDivider />

      {/* Audience who the IR site speaks to — one flat multi-select, every
          card behaves the same way so nothing has to be picked "first" */}
      <div id="audience-field" className="scroll-mt-28">
        <SectionLabel>ใครจะเข้ามาดูเว็บไซต์ <span className="text-red-500 font-normal">*</span></SectionLabel>
        {audienceErr && <FieldError>เลือกกลุ่มผู้อ่านอย่างน้อย 1 กลุ่ม</FieldError>}
        <p className="text-body text-ir-t3 mb-4 mt-1">เลือกกลุ่มผู้อ่าน แล้วเรียงจากกลุ่มที่สำคัญที่สุด</p>
        <RankPicker
          items={IR_AUDIENCES.map((aud) => ({ id: aud.id, label: aud.label, desc: aud.desc, icon: OPTION_ICONS[aud.id] }))}
          selected={selectedAudiences}
          onChange={(next) => updateDraft({ primaryAudience: next[0] ?? "", secondaryAudiences: next.slice(1) })}
        />
      </div>

      <SectionDivider />

      {/* Corporate identity — keep the existing brand colours, or have the team propose new ones.
          Stored as hasCorporateIdentity: "yes" = keep existing, "no" = propose new (unchanged
          values, so earlier answers carry over). */}
      <div>
        <div className="flex items-baseline gap-2">
          <SectionLabel>สีของเว็บไซต์</SectionLabel>
          <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
        </div>
        {/* Existing brand colours are the default (user tests #1–2: two equal choices
            confused people; CPALL: "base it on the corporate colours, and make 'team
            proposes' a note"). The team-proposal path is a secondary link with a note. */}
        {draft.hasCorporateIdentity !== "no" ? (
          <>
            <p className="text-body text-ir-t3 mt-1">เว็บไซต์ใหม่จะใช้ชุดสีเดิมของแบรนด์</p>
            {/* With a current website the team takes the colours from it, so nothing to fill
                in; without one, they can give the codes (else the team works from the logo). */}
            {draft.website?.trim()
              ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-ir-select-soft bg-primary-50 px-4 py-3 text-small leading-relaxed text-ir-t2">
                  <span aria-hidden="true" className="mt-0.5 shrink-0">🎨</span>
                  <span>ทีมจะใช้สีจากเว็บไซต์ <span className="font-semibold text-ir-t1">{draft.website.trim().replace(/^https?:\/\//, "")}</span> ของคุณ ไม่ต้องกรอกสีเพิ่ม</span>
                </p>
              )
              : <BrandColorInput draft={draft} updateDraft={updateDraft} />}
            <button type="button" onClick={() => updateDraft({ hasCorporateIdentity: "no" })}
              className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-small font-semibold text-ir-t2 underline underline-offset-4 transition-colors hover:text-ir-t1 focus-ring">
              อยากให้ทีมเสนอชุดสีใหม่แทน
            </button>
          </>
        ) : (
          <div className="mt-2 rounded-xl border border-ir-border bg-ir-card p-4">
            <p className="text-body font-semibold text-ir-t1">ให้ทีมเสนอชุดสีใหม่</p>
            <p className="mt-0.5 text-small text-ir-t3">ทีมจะเสนอชุดสีที่เข้ากับแนวทางและกลุ่มผู้อ่าน · ถ้ามีโทนในใจ บอกไว้ได้</p>
            <textarea
              aria-label="โทนสีที่อยากได้"
              rows={2}
              value={draft.ciNote ?? ""}
              onChange={(e) => updateDraft({ ciNote: e.target.value })}
              placeholder="เช่น อยากให้ดูสดใสขึ้น หรือยังคงสีน้ำเงินไว้แต่ให้ทันสมัยกว่าเดิม"
              className="mt-2.5 w-full resize-y rounded-md border border-ir-border bg-white px-3.5 py-2.5 text-body leading-relaxed outline-none transition-colors focus:border-ir-accent"
            />
            <button type="button" onClick={() => updateDraft({ hasCorporateIdentity: "yes" })}
              className="mt-1.5 inline-flex min-h-11 items-center px-1 text-small font-semibold text-ir-t2 underline underline-offset-4 transition-colors hover:text-ir-t1 focus-ring">
              กลับไปใช้ชุดสีเดิม
            </button>
          </div>
        )}
      </div>

      {/* Font — sits with the CI question (brand look in one place). It used to live at the
          bottom of the optional Inspiration step, where user test #1 never saw it. */}
      <div className="mt-6">
        <FontChoice draft={draft} updateDraft={updateDraft} dir={directionById(draft.selectedDirection)} />
      </div>

      {/* Missing info clicking Next when form is incomplete shows specific guide */}
      <StepNav onBack={() => router.push("/")} backLabel="หน้าหลัก" next={
        <NextButton onClick={() => go(2)} blocked={!ok} onBlocked={(b) => nudge.nudge(!draft.company.trim() ? "company-field" : "audience-field", b)}>ถัดไป</NextButton>
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
      <Head n={2} title="กำหนดเป้าหมาย" sub="เว็บไซต์ต้องทำอะไรให้บริษัทได้บ้าง" />
      <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mb-5" />

      <div id="goals-field" className="scroll-mt-28">
        <SectionLabel>สิ่งที่เว็บไซต์ต้องทำได้</SectionLabel>
        {goalsErr && <FieldError>เลือกเป้าหมายอีก {RULES.goals.min - draft.businessGoals.length} ข้อ</FieldError>}
        <p className="text-body text-ir-t3 mb-4 mt-1">เลือกผลลัพธ์ที่อยากได้ แล้วเรียงจากสำคัญที่สุด</p>
        <RankPicker
          items={VISIBLE_GOALS.map((goal) => ({ id: goal.id, label: goal.label, desc: goal.desc, icon: OPTION_ICONS[goal.id] }))}
          selected={draft.businessGoals}
          max={RULES.goals.max}
          topLabel="เป้าหมายหลัก"
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

      <StepNav onBack={() => go(1)} next={
        <NextButton onClick={() => go(3)} blocked={!ok} onBlocked={(b) => nudge.nudge("goals-field", b)}>ถัดไป</NextButton>
      } />
    </>
  );
}

// Website mock at the top of each quiz card — a flat illustration (ExploreMock) of the
// choice, so the pair can be told apart at a glance.
function QuizVisual({ mock }: { mock: string }) {
  return (
    // 16:9 inset frame. Height comes from the padding-box ratio (56.42% = 677/1200) rather
    // than `aspect-ratio`, which some mobile WebViews don't lock in. Nothing sits on top of
    // the mock — on a phone it's only ~150px wide and every pixel of it is the comparison.
    <div className="relative overflow-hidden rounded-sm sm:rounded-md border border-ir-border select-none" style={{ paddingTop: "56.42%" }}>
      <div className="absolute inset-0"><ExploreMock id={mock} /></div>
    </div>
  );
}

const LetterBadge = ({ letter }: { letter: string }) => (
  <span className="grid place-items-center w-6 h-6 rounded-full bg-ir-dark text-white text-small font-bold shrink-0" aria-hidden="true">{letter}</span>
);

// ── S2 Smart Discovery Quiz (A/B) ──
function S2quiz({ q, idx, total, onAnswer, onBack, addTimelineEntry, addNotebookEntry, quizIdx, answered }: any) {
  const opts: [QuizOption, string][] = [[q.optionA, "A"], [q.optionB, "B"]];
  // Pick first, then "ข้อถัดไป" (user test #1: auto-advancing on tap left them unsure what
  // happened — they tapped A and B, then scrolled looking for a next button). The pick is
  // keyed to the question so it resets when the question changes. A question answered
  // before (coming back to Explore) opens with that answer already picked, so "ข้อถัดไป"
  // walks through unchanged answers and only the ones being revised need a tap.
  const [chosen, setChosen] = useState<{ q: string; letter: string } | null>(null);
  const prevLetter = answered ? (answered === q.optionA ? "A" : answered === q.optionB ? "B" : null) : null;
  const pending = chosen && chosen.q === q.id ? chosen.letter : prevLetter;
  // Phones only: the two-up mocks are ~150px wide each, too small to read the details that
  // tell A from B. "ดูภาพใหญ่" shows both full width, stacked, right under the cards —
  // inline, no modal, and it stays open across questions once opened.
  const [bigView, setBigView] = useState(false);
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
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {opts.map(([o, letter]) => (
          <button key={letter} type="button" onClick={() => selectOption(o, letter)}
            aria-pressed={pending === letter}
            aria-label={`ตัวเลือก ${letter}: ${o.label} — ${o.hint}`}
            className={[
              "group/sel relative flex flex-col rounded-md sm:rounded-xl border p-1 sm:p-2.5 text-left select-none transition-[background-color,border-color,box-shadow,opacity,filter,transform,scale] duration-fast focus-ring",
              pending === letter
                ? "wrs-quiz-selected border-ir-select bg-primary-50 shadow-selected"
                : pending
                // The other option recedes, but stays tappable to switch.
                ? "border-ir-border bg-ir-card opacity-70 hover:opacity-100 hover:border-ir-select-soft"
                : "border-ir-border bg-ir-card hover:border-ir-select-soft hover:bg-primary-50/60 hover:shadow-e2 active:scale-[0.98]",
            ].join(" ")}>
            {/* Words lead, the picture supports them (user feedback: the mock out-shouted the
                label). Name large, then one plain-Thai line on what this choice means for
                the people who visit the site; the mock sits below, pinned to the card's foot
                so A and B line up whatever the text length. */}
            <div className="px-1.5 sm:px-2 pt-1.5 sm:pt-1 pb-2.5 sm:pb-3">
              {/* phones: badge and select dot share the top row, the label takes the full width
                  below (beside the badge, Thai labels broke one word per line). The selected
                  state is the dot, the same as on desktop. */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <LetterBadge letter={letter} />
                <span className="order-last w-full min-w-0 text-lead sm:order-none sm:w-auto sm:flex-1 sm:text-heading font-bold tracking-[-0.01em] text-ir-t1 leading-snug">{o.label}</span>
                <SelectDot on={pending === letter} className="ml-auto sm:ml-0" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-small sm:text-lead leading-snug sm:leading-relaxed text-ir-t1/80">{o.hint}</p>
            </div>
            <div className="mt-auto"><QuizVisual mock={o.mock} /></div>
          </button>
        ))}
      </div>
      <div className="sm:hidden mt-3">
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
                  <span className="mt-1 block text-body leading-snug text-ir-t1/80">{o.hint}</span>
                </figcaption>
                <QuizVisual mock={o.mock} />
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
      </div>
      <p className="mt-4 text-center text-small text-ir-t3" aria-live="polite">
        {pending ? `เลือก ${pending} แล้ว · กด${isLast ? "ดูผลลัพธ์" : "ข้อถัดไป"}เพื่อไปต่อ หรือกดอีกแบบเพื่อเปลี่ยน` : "เลือกแบบที่ใกล้กับเว็บไซต์ที่อยากได้มากกว่า"}
      </p>
      <StepNav onBack={onBack} next={<NextButton onClick={confirm} disabled={!pending}>{isLast ? "ดูผลลัพธ์" : "ข้อถัดไป"}</NextButton>} />
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
      <Head n={4} title="จัดหน้าแรกของเว็บไซต์" sub="ส่วนต่าง ๆ บนหน้าแรก เรียงจากบนลงล่าง · AI จัดไว้ให้แล้ว ปรับได้" />
      <div id="structure-field" className="scroll-mt-28">
        {nudge.field === "structure-field" && short > 0 && <FieldError>เลือกเนื้อหาเพิ่มอีก {short} เรื่อง</FieldError>}
        <StructureBuilder draft={draft} updateDraft={updateDraft} />
      </div>
      <StepNav onBack={() => go(3)} next={<NextButton onClick={() => go(5)} blocked={short > 0} onBlocked={(b) => nudge.nudge("structure-field", b)}>{isRecommendedHomepage(draft) ? "ใช้หน้าแรกนี้" : "ถัดไป"}</NextButton>} />
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
  valid:       { label: "ลิงก์ใช้ได้",                              textClass: "text-ir-accent-text", dotClass: "bg-ir-accent" },
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

function ReferenceEditor({ draft, updateDraft }: any) {
  // ── URL list state ── committed immediately on Enter/blur, no separate save step
  const [urls, setUrls] = useState<{ id: string; value: string; note?: string; likes?: string[] }[]>(() =>
    (draft.references ?? [])
      .filter((r: any) => r.type === "url")
      .map((r: any) => ({ id: r.id, value: r.value, note: r.note, likes: r.likes }))
  );
  const [urlInput, setUrlInput] = useState("");
  // Recomputed every keystroke — pure parsing against the current list, no debounce needed.
  const urlValidation = useMemo(() => validateUrlInput(urlInput, urls), [urlInput, urls]);

  // ── Image + document list state (base64 data-uri) ── PDFs ride in the same gallery
  // (user test BTS: "แนบได้ทั้งเอกสาร รูป และลิงก์"), stored as type "file".
  const [images, setImages] = useState<{ id: string; src: string; name: string; note?: string; likes?: string[]; kind?: "pdf" }[]>(() =>
    (draft.references ?? [])
      .filter((r: any) => r.type === "image" || r.type === "file")
      .map((r: any) => ({ id: r.id, src: r.value, name: r.label ?? "", note: r.note, likes: r.likes, kind: r.type === "file" ? "pdf" as const : undefined }))
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
      .map((u) => ({ id: u.id, type: "url" as const, category: "favorite" as const, value: u.value, label: u.value, note: u.note?.trim() || undefined, likes: u.likes?.length ? u.likes : undefined }));
    const imgItems = nextImages
      .map((img) => ({ id: img.id, type: img.kind === "pdf" ? "file" as const : "image" as const, category: "favorite" as const, value: img.src, label: img.name, note: img.note?.trim() || undefined, likes: img.likes?.length ? img.likes : undefined }));
    updateDraft({ references: [...urlItems, ...imgItems] });
  }, [updateDraft]);

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
        removed ? linkLabel(removed.value) : undefined
      );
    }, 220);
  };

  // Image handlers
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    Array.from(files).forEach((file) => {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
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
          <span className="text-body leading-none opacity-60">🖼️</span>
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
      {/* No intro sentence here: the step's own subtitle already says what to add (the
          two read as a repeat once the mode picker was gone). */}
      {/* What to put here — user tests: people tried hard but weren't sure what counts. */}
      <div className="mb-5 rounded-xl bg-ir-sunken px-4 py-3">
        <p className="text-small font-semibold text-ir-t1">ตัวอย่างสิ่งที่ใส่ได้</p>
        <ul className="mt-1.5 grid gap-1 text-small text-ir-t2 sm:grid-cols-2">
          {["เว็บ IR ของบริษัทที่ชอบ ทั้งในและต่างประเทศ", "เว็บของบริษัทในเครือหรือแบรนด์หลักของคุณ", "วิดีโอแนะนำองค์กร หรือคลิปที่ชอบ (ลิงก์ YouTube หรือ Google Drive)", "ภาพหน้าจอ รายงานประจำปี หรือคู่มือ CI (PDF)"].map((t) => (
            <li key={t} className="flex items-start gap-1.5"><span aria-hidden="true" className="text-ir-accent-text">•</span>{t}</li>
          ))}
        </ul>
      </div>

      {/* Mobile/tablet (<768px): Input → Gallery → Upload, so a newly added reference lands
          right under the input with no scrolling — the floating preview + counter confirm
          success without needing the gallery to be the sole signal. Desktop (md+):
          Input → Upload → Gallery, unchanged — only the `order-*`/`md:order-*` pairs below
          reorder. */}
      <div className="flex flex-col">
        {/* ── Website links — unified input+button as one control, no visual seam ── */}
        <div className="order-1 mb-4">
          <div className="flex items-baseline gap-2">
            <SectionLabel>เว็บไซต์หรือวิดีโอที่ชอบ</SectionLabel>
            <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
          </div>
          <div
            className={`flex items-stretch rounded-lg border bg-ir-card overflow-hidden transition-colors ${
              {
                empty: "border-ir-border focus-within:border-ir-accent/50",
                valid: "border-ir-accent/50",
                existing: "border-ir-t2/40",
                unsupported: "border-ir-warn/50",
                invalid: "border-ir-error/50",
              }[urlValidation]
            }`}
          >
            <span className="shrink-0 flex items-center pl-4 pr-2 text-lead text-ir-t3">🌐</span>
            <input
              type="url"
              placeholder={urlCapReached ? `ครบ ${MAX_REFERENCE_URLS} ลิงก์แล้ว` : "วางลิงก์เว็บไซต์ YouTube / Vimeo หรือ Google Drive..."}
              value={urlInput}
              disabled={urlCapReached}
              aria-invalid={urlValidation === "invalid" || urlValidation === "unsupported"}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); }}
              className="flex-1 min-w-0 bg-transparent text-body text-ir-t1 placeholder:text-ir-t3 outline-none py-3 disabled:cursor-not-allowed"
            />
            <button
              onClick={commitUrl}
              disabled={urlValidation !== "valid" || urlCapReached}
              aria-busy={isCommittingUrl}
              className="shrink-0 flex items-center gap-1.5 text-body font-semibold text-ir-on-accent bg-ir-accent px-4 my-1.5 mr-1.5 rounded-md hover:bg-ir-accent-hi active:scale-[0.97] transition-all disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
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
            <p className="text-small text-ir-t3 mt-1.5">วางทีละลิงก์ แล้วกด "เพิ่มลิงก์" · {urls.length === 0 ? `ใส่ได้สูงสุด ${MAX_REFERENCE_URLS} ลิงก์` : urlCapReached ? `ครบ ${MAX_REFERENCE_URLS} ลิงก์แล้ว` : `เพิ่มแล้ว ${urls.length} ลิงก์ · ใส่ได้อีก ${MAX_REFERENCE_URLS - urls.length}`}</p>
          ) : (
            <p role="status" className={`text-small mt-1.5 flex items-center gap-1.5 ${URL_VALIDATION_COPY[urlValidation].textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${URL_VALIDATION_COPY[urlValidation].dotClass}`} />
              {URL_VALIDATION_COPY[urlValidation].label}
            </p>
          )}
          {/* A Drive file the team can't open is useless — remind them to share it. */}
          {urlValidation === "valid" && isDriveUrl(urlInput) && (
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
                      className="w-full h-full flex flex-col items-center justify-center gap-1 px-1 text-center"
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
                      className={`absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center transition-[opacity,transform,scale] active:scale-[0.95] focus-ring ${
                        noteEditing === u.id
                          ? "bg-ir-accent text-ir-on-accent opacity-100"
                          : "bg-black/50 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/70 active:bg-black/70"
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      <IconEdit width={8} height={8} />
                    </button>
                    {(u.note || u.likes?.length) && noteEditing !== u.id && (
                      <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-ir-accent ring-1 ring-white/70" />
                    )}
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
                      className={`absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center transition-[opacity,transform,scale] active:scale-[0.95] focus-ring ${
                        noteEditing === img.id
                          ? "bg-ir-accent text-ir-on-accent opacity-100"
                          : "bg-black/50 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/70 active:bg-black/70"
                      }`}
                      style={{ width: 24, height: 24 }}
                    >
                      <IconEdit width={8} height={8} />
                    </button>
                    {(img.note || img.likes?.length) && noteEditing !== img.id && (
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
                  <div className="mt-3 rounded-md border border-ir-accent/30 bg-ir-accent/[0.04] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {editingUrl ? (
                        <span className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0" style={{ background: URL_THUMB_THEMES[0] }}>
                          <IconGlobe width={10} height={10} className="text-white/80" />
                        </span>
                      ) : (
                        editingImage!.kind === "pdf"
                          ? <span className="w-6 h-6 rounded-sm grid place-items-center shrink-0 bg-red-600 text-[8px] font-bold text-white">PDF</span>
                          // eslint-disable-next-line @next/next/no-img-element
                          : <img src={editingImage!.src} alt="" className="w-6 h-6 rounded-sm object-cover shrink-0" />
                      )}
                      <span className="text-small font-medium text-ir-t2 truncate flex-1">
                        {editingUrl ? linkLabel(editingUrl.value) : editingImage!.name}
                      </span>
                      <button
                        onClick={() => setNoteEditing(null)}
                        aria-label="ปิดการแก้ไขโน้ต"
                        className="text-ir-t3 hover:text-ir-t1 active:text-ir-t1 shrink-0"
                      >
                        <IconClose width={9} height={9} />
                      </button>
                    </div>
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
                            className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-small font-medium transition-[background-color,border-color,color,scale] duration-fast active:scale-[0.95] focus-ring ${
                              on ? "border-ir-select bg-ir-accent-soft text-ir-t1" : "border-ir-border bg-white text-ir-t2 hover:border-ir-select-soft"
                            }`}
                          >
                            {on && <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className="sel-check text-ir-accent-text" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" /></svg>}
                            {like}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      rows={2}
                      value={editingUrl ? (editingUrl.note ?? "") : (editingImage!.note ?? "")}
                      onChange={(e) =>
                        editingUrl ? updateUrlNote(editingUrl.id, e.target.value) : updateImageNote(editingImage!.id, e.target.value)
                      }
                      placeholder="โน้ตเพิ่มเติม (ไม่บังคับ)"
                      className="w-full bg-ir-card border border-ir-border rounded-sm text-small text-ir-t1 placeholder:text-ir-t3 outline-none focus:border-ir-accent/50 px-3 py-2 resize-none"
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Image upload — centered dropzone, standard upload-card pattern ── */}
        <div className="order-3 md:order-2">
          <div className="flex items-baseline gap-2">
            <SectionLabel>รูปภาพหรือเอกสารที่ชอบ</SectionLabel>
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
        sub="แนบเว็บไซต์ วิดีโอ รูป หรือเอกสารที่ชอบ ถ้ามี · ไม่มีก็กดข้ามไปได้เลย"
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
      <div className="mb-6">
        <label htmlFor="inspiration-note" className="flex items-baseline gap-2">
          <SectionLabel>เล่าเป็นข้อความ</SectionLabel>
          <span className="text-small text-ir-t3">(ไม่บังคับ)</span>
        </label>
        <p className="-mt-1 text-body text-ir-t3">ไม่มีลิงก์หรือรูปก็ได้ เขียนบอกว่าชอบแบบไหน</p>
        <textarea
          id="inspiration-note"
          rows={3}
          value={draft.inspirationNote ?? ""}
          onChange={(e) => updateDraft({ inspirationNote: e.target.value })}
          placeholder="เช่น ชอบเว็บที่ดูสะอาด ตัวเลขผลประกอบการเห็นชัดตั้งแต่หน้าแรก และมีวิดีโอแนะนำองค์กร"
          className="mt-2 w-full resize-y rounded-md border border-ir-border bg-white px-3.5 py-3 text-body leading-relaxed outline-none transition-colors focus:border-ir-accent"
        />
      </div>

      <StepNav
        onBack={() => go(4)}
        next={<NextButton onClick={() => go(6)}>{hasCustom || hasCurated || draft.inspirationNote?.trim() ? "ถัดไป" : "ข้ามขั้นนี้"}</NextButton>}
      />
    </div>
  );
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
  const colors: string[] = dir?.colors ?? ["#151823", "#BCC416", "#FFFFFF"];
  const parts = String(dir?.palette ?? "").split(/\s*&\s*/);
  const fallback = ["Primary", "Accent", "Surface"];
  return colors.slice(0, 3).map((hex, i) => ({
    hex: hex.toUpperCase(),
    name: (parts[i] || fallback[i] || `Color ${i + 1}`).trim(),
    main: i === 0,
  }));
}

const NEUTRAL_RAMP = ["#F5F5F5", "#D9DBDE", "#B4B7BD", "#8A8F99", "#5A5F6B", "#33383F", "#151823"];


// ── The design concept the client co-authored, worked out from their real choices
// (Direction palette or their own brand colours, font, mood, homepage structure). Feeds
// sheetData(), which both the on-screen overview and the PDF / PNG sheet draw from, so
// the two never disagree. ──
function conceptData(draft: any) {
  const dir = directionById(draft.selectedDirection);
  // the Thai face follows their step-5 choice when they picked one themselves
  const basePairing = FONT_PAIRINGS[draft.selectedDirection] ?? DEFAULT_PAIRING;
  const thaiPick = chosenThaiFont(draft);
  const pairing = thaiPick.source === "selected"
    ? { ...basePairing, thai: thaiPick.family, note: `ฟอนต์ภาษาไทยที่เลือกเอง คู่กับ ${basePairing.heading}` }
    : basePairing;
  // a picked catalog font (incl. an IR Plus face drawn by its preview) vs a pairing var font
  const thaiStack = thaiPick.source === "selected" ? familyStack(pairing.thai) : fontStack(pairing.thai);
  const mainFont = pairing.thai;
  const mainFontNote = fontByFamily(mainFont)?.note ?? basePairing.note;

  const p: DesignProfile | undefined = draft.designProfile;
  const dataDriven = p?.densityData ?? 0;
  // "ใช้ชุดสีเดิม": their own colours from step 1 drive the whole board. Without codes, the
  // board says the team will take them from the site/logo instead of passing the
  // Direction's palette off as theirs (user test #1: BTS is red, the board showed navy & gold).
  // With a current website the colours come from the site, so typed codes aren't used.
  const keepOwn = draft.hasCorporateIdentity === "yes";
  const siteUrl = (draft.website ?? "").trim().replace(/^https?:\/\//, "");
  const own: string[] = keepOwn && !siteUrl ? ((draft.brandColors as string[] | undefined) ?? []).filter(Boolean) : [];
  const ownPending = keepOwn && own.length === 0;
  const swatches = own.length
    ? own.map((hex, i) => ({ hex: hex.toUpperCase(), name: ["สีหลัก", "สีรอง", "สีเสริม"][i] ?? `สี ${i + 1}`, main: i === 0 }))
    : namedPalette(dir);
  const primary = swatches[0]?.hex ?? "#151823";
  const accent = own.length ? (own[1] ?? own[0]).toUpperCase() : swatches[1]?.hex ?? "#BCC416";
  const surface = own.length ? (own[2] && isLightHex(own[2]) ? own[2].toUpperCase() : "#FFFFFF") : swatches[2]?.hex ?? "#FFFFFF";
  const moodBg = own.length
    ? `linear-gradient(135deg, ${primary}, color-mix(in srgb, ${primary} 70%, #000))`
    : ownPending ? "linear-gradient(135deg,#151823,#33383F)" : dir?.bg ?? primary;
  const moodInk = own.length && isLightHex(primary) ? "#151823" : "#fff";
  const ink = NEUTRAL_RAMP[6];
  const muted = NEUTRAL_RAMP[3];
  // Five colours, each with the job it does on the site — so the palette reads as a plan
  // for the page, not just a row of hex codes.
  const paletteRoles = [
    { hex: primary, role: "Primary", use: "หัวเว็บ ปุ่มหลัก หัวข้อสำคัญ" },
    { hex: accent, role: "Accent", use: "ไฮไลต์ ตัวเลขเด่น เส้นกราฟ" },
    { hex: surface, role: "Background", use: "พื้นหลังหน้าและการ์ด" },
    { hex: ink, role: "Text", use: "ตัวหนังสือหลัก" },
    { hex: muted, role: "Muted", use: "คำบรรยาย เส้นแบ่ง" },
  ];
  const onPrimary = isLightHex(primary) ? ink : "#FFFFFF";
  const onAccent = isLightHex(accent) ? ink : "#FFFFFF";
  // Mood: one main feeling, the second only supports it — two equal words left the client
  // unsure which one the site is really about.
  const moods: string[] = dir?.mood ?? ["Professional & Clean"];
  const [mainMood, ...supportMoods] = moods;

  // The exact structure picked in "จัดหน้าแรก" (Structure step), in the order the
  // client arranged it — this board should mirror that decision, not restate it.
  const homepageSections = ((draft.selectedSections as string[] | undefined) ?? [])
    .filter((id) => !RETIRED_SECTION_IDS.includes(id))
    .map((id) => ({ id, name: sectionById(id)?.name ?? id }));
  return { dir, thaiPick, pairing, thaiStack, mainFont, mainFontNote, p, dataDriven, keepOwn, siteUrl, own, ownPending, swatches, primary, accent, surface, moodBg, moodInk, ink, muted, paletteRoles, onPrimary, onAccent, moods, mainMood, supportMoods, homepageSections };
}

// ── Save the summary as a one-page moodboard sheet (PDF or PNG) ──
// Click → the file downloads, no print dialog. The button itself reports the result:
// spinner + "กำลังบันทึก…", then a check + "บันทึกแล้ว" for a few seconds.
const SHEET_ROLE_TH: Record<string, string> = { Primary: "สีหลัก", Accent: "สีเน้น", Background: "พื้นหลัง", Text: "ตัวอักษร", Muted: "สีรอง" };

function sheetData(draft: any): SheetData {
  const c = conceptData(draft);
  const vs = VISUAL_STYLES[draft.selectedDirection];
  const picks = (draft.quizPicks ?? []) as { questionId: string; letter: "A" | "B" }[];
  return {
    company: draft.company ?? "",
    directionLabel: c.dir?.label ?? "Design Direction",
    tagline: c.dir?.tagline,
    mainMood: c.mainMood,
    supportMoods: c.supportMoods,
    answers: picks.flatMap((p) => {
      const q = QUIZ.find((x) => x.id === p.questionId);
      return q ? [{ topic: q.topic, choice: (p.letter === "A" ? q.optionA : q.optionB).label }] : [];
    }),
    ownPending: c.ownPending,
    colorSource: c.keepOwn ? "ชุดสีเดิมของแบรนด์" : "ทีมเสนอชุดสีตามแนวทาง",
    // three colours only — main, accent, background; text/muted greys add nothing here
    swatches: c.paletteRoles.slice(0, 3).map((r) => ({ hex: r.hex, role: SHEET_ROLE_TH[r.role] ?? r.role, use: r.use })),
    primary: c.primary,
    moodInk: c.moodInk,
    coverBg: c.moodBg,
    inspiration: {
      links: ((draft.references ?? []) as { type: string }[]).filter((r) => r.type === "url").length,
      files: ((draft.references ?? []) as { type: string }[]).filter((r) => r.type !== "url").length,
      note: draft.inspirationNote?.trim() || undefined,
    },
    fontName: c.mainFont,
    fontStack: c.thaiStack,
    fontNote: c.mainFontNote,
    sections: c.homepageSections.map((s) => s.name),
    note: draft.structureNote?.trim() || undefined,
    visualMood: vs?.mood,
    shots: (vs?.shots ?? []).map((s) => ({ url: unsplashUrl(s.id, 700), cap: s.cap })),
  };
}

// One numbered chapter of the overview: label column, hairline above.
function Chapter({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-t border-black/[0.08] py-6 md:grid-cols-[150px_minmax(0,1fr)] md:gap-8 md:py-8">
      <p className="flex items-baseline gap-2.5 md:block">
        <span className="font-mono text-small text-[#8A8578]">{n}</span>
        <span className="text-body font-semibold text-[#2B2A26] md:mt-1 md:block">{title}</span>
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── Project overview — the result, not a form ──
// One section replacing the old "สรุปแนวทางการออกแบบ" + "ภาพรวมโปรเจกต์" pair (they
// repeated each other and both looked like the questionnaire: bordered rounded cards,
// chips, sample buttons — testers wondered if they still had to fill something in).
// It reads as a printed brand sheet instead: paper background, a cover band in the
// client's own colour, the chosen heading font at display size, numbered chapters split
// by hairlines, flat colour fields and captioned photos. Nothing here is a control, so
// nothing looks like one. The PDF / PNG download draws the same content (sheetData).
function ProjectOverview({ draft }: { draft: any }) {
  const thaiPick = chosenThaiFont(draft);
  useGoogleFont(thaiPick.source === "selected" ? previewFamily(thaiPick.family) : undefined, [400, 500, 600, 700]);
  const d = sheetData(draft);
  const head = { fontFamily: d.fontStack } as CSSProperties;
  const moods = [d.mainMood, ...d.supportMoods].filter(Boolean);
  const insp = [
    d.inspiration.links ? `${d.inspiration.links} ลิงก์` : "",
    d.inspiration.files ? `${d.inspiration.files} ไฟล์` : "",
  ].filter(Boolean).join(" · ");

  return (
    <section aria-label="ภาพรวมผลลัพธ์" className="cursor-default overflow-clip rounded-sm bg-[#FBFAF6] text-[#2B2A26] ring-1 ring-black/[0.06]">
      {/* cover */}
      <div className="px-6 pb-9 pt-7 md:px-10 md:pb-12 md:pt-9" style={{ background: d.coverBg, color: d.moodInk }}>
        <p className="text-small font-medium opacity-75">แนวทางเว็บไซต์นักลงทุนสัมพันธ์{d.company ? ` · ${d.company}` : ""}</p>
        <p className="mt-10 text-small font-medium opacity-75 md:mt-14">แนวทางที่ได้จากคำตอบของคุณ</p>
        <h3 className="mt-1 font-bold leading-[1.05] tracking-[-0.02em]" style={{ ...head, color: d.moodInk, fontSize: "clamp(40px, 9vw, 68px)", textWrap: "balance" } as CSSProperties}>{d.directionLabel}</h3>
        {d.tagline && <p className="mt-3 max-w-[34rem] text-lead leading-relaxed opacity-90" style={head}>{d.tagline}</p>}
        {moods.length > 0 && <p className="mt-6 text-small opacity-75">อารมณ์ของเว็บไซต์ · {moods.join(" · ")}</p>}
      </div>

      <div className="px-6 md:px-10">
        <Chapter n="01" title="คำตอบของคุณ">
          {d.answers.length ? (
            <p className="text-lead leading-[1.9]">
              {d.answers.map((a, i) => (
                <Fragment key={a.topic}>
                  {i > 0 && <span className="px-1 text-[#B5B0A3]"> · </span>}
                  <span className="whitespace-nowrap"><span className="text-[#8A8578]">{a.topic}</span> <span className="font-semibold">{a.choice}</span></span>
                </Fragment>
              ))}
            </p>
          ) : <p className="text-body text-[#8A8578]">ยังไม่ได้ตอบคำถามสำรวจแนวทาง</p>}
        </Chapter>

        <Chapter n="02" title="สี">
          {d.ownPending ? (
            <p className="text-lead leading-relaxed"><span className="font-semibold">ใช้ชุดสีเดิมของแบรนด์</span> <span className="text-[#6F6A5E]">· ทีมจะใช้สีจากเว็บไซต์หรือโลโก้ปัจจุบันของคุณ</span></p>
          ) : (
            <>
              <div className="grid grid-cols-3">
                {d.swatches.map((s) => (
                  <div key={s.role}>
                    <div className="h-20 md:h-28" style={{ background: s.hex, boxShadow: isLightHex(s.hex) ? "inset 0 0 0 1px rgba(0,0,0,0.08)" : undefined }} />
                    <p className="mt-2 text-small font-semibold">{s.role}</p>
                    <p className="font-mono text-caption text-[#8A8578]">{s.hex.toUpperCase()}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-small text-[#8A8578]">{d.colorSource}</p>
            </>
          )}
        </Chapter>

        <Chapter n="03" title="ตัวอักษร">
          <p className="font-bold leading-tight" style={{ ...head, fontSize: "clamp(32px, 6vw, 48px)" }}>{d.fontName}</p>
          <p className="mt-2 text-title leading-snug text-[#4A473F]" style={head}>นักลงทุนสัมพันธ์ · ข้อมูลสำคัญทางการเงิน</p>
          {d.fontNote && <p className="mt-2 text-small text-[#8A8578]">{d.fontNote}</p>}
        </Chapter>

        {d.shots.length > 0 && (
          <Chapter n="04" title="แนวภาพ">
            {d.visualMood && <p className="mb-4 text-body leading-relaxed text-[#4A473F]">{d.visualMood}</p>}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4">
              {d.shots.slice(0, 4).map((s) => (
                <figure key={s.url} className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt={s.cap} loading="lazy" draggable={false} className="pointer-events-none block w-full select-none object-cover" style={{ aspectRatio: "4 / 3" }} />
                  <figcaption className="mt-1.5 text-caption text-[#8A8578]">{s.cap}</figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-small text-[#8A8578]">ภาพตัวอย่างเพื่อบอกโทนภาพ · ทีมจะเลือกภาพที่ตรงกับธุรกิจของคุณอีกครั้ง</p>
          </Chapter>
        )}

        <Chapter n={d.shots.length ? "05" : "04"} title="หน้าแรก">
          {d.sections.length ? (
            <ol className="grid gap-x-8 sm:grid-cols-2">
              {d.sections.map((name, i) => (
                <li key={name} className="flex items-baseline gap-3 py-1.5 text-body">
                  <span className="w-5 shrink-0 text-right font-mono text-small text-[#8A8578]">{i + 1}</span>
                  <span>{name.split(" / ")[0]}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-body text-[#8A8578]">ยังไม่ได้จัดหน้าแรก</p>}
          {d.note && <p className="mt-4 text-body leading-relaxed"><span className="text-[#8A8578]">หมายเหตุ · </span>{d.note}</p>}
          {(insp || d.inspiration.note) && (
            <p className="mt-3 text-body leading-relaxed">
              <span className="text-[#8A8578]">แรงบันดาลใจที่แนบ · </span>{[insp, d.inspiration.note].filter(Boolean).join(" · ")}
            </p>
          )}
        </Chapter>

        <p className="border-t border-black/[0.08] py-5 text-small text-[#8A8578]">
          เอกสารสรุปแนวทางจากคำตอบของคุณ ไม่ใช่งานออกแบบจริง · ทีม IR Plus จะคุยรายละเอียดกับคุณอีกครั้ง
        </p>
      </div>
    </section>
  );
}

function SaveSheetButton({ draft, kind }: { draft: any; kind: "pdf" | "png" }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const name = kind === "pdf" ? "PDF" : "PNG";
  const save = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      const { saveMoodboard } = await import("@/lib/moodboardExport");
      await saveMoodboard(sheetData(draft), kind);
      setState("done");
    } catch {
      setState("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 3000);
  };
  const label = state === "busy" ? "กำลังบันทึก…" : state === "done" ? "บันทึกแล้ว" : state === "error" ? "บันทึกไม่สำเร็จ ลองอีกครั้ง" : `บันทึก ${name}`;
  return (
    <button type="button" onClick={save} aria-busy={state === "busy"} aria-live="polite"
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-body font-semibold transition-colors focus-ring ${
        state === "done" ? "border-ir-select bg-primary-50 text-ir-t1"
          : state === "error" ? "border-red-300 bg-red-50 text-red-700"
          : "border-ir-border bg-white text-ir-t1 hover:border-ir-border-hi"
      } ${state === "busy" ? "cursor-wait" : ""}`}>
      {state === "busy" ? (
        <span aria-hidden="true" className="h-[18px] w-[18px] rounded-full border-2 border-ir-t3/30 border-t-ir-t1 animate-spin" />
      ) : state === "done" ? (
        <IconCheck width={18} height={18} className="text-ir-accent-text" />
      ) : (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
      )}
      {label}
    </button>
  );
}

// ── S6 · Deliver references + finalize + submit ──
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
    phone: (draft.callbackOk ?? true) ? phoneError(draft.phone) : "", // hidden when they chose email only
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
            <p className="text-lead text-ir-t2 leading-relaxed mt-2">ตรวจภาพรวมที่สรุปจากคำตอบของคุณ แล้วยืนยันเพื่อส่งให้ทีม IR Plus</p>
          </div>
          {/* keep a copy before sending — a one-page moodboard sheet, downloaded straight
              away (no print dialog, nothing to set up) */}
          <div className="no-print flex shrink-0 items-center gap-2">
            <SaveSheetButton draft={draft} kind="pdf" />
            <SaveSheetButton draft={draft} kind="png" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT: project overview (main visual) ── */}
        <div className="flex-1 min-w-0 w-full">
          <ProjectOverview draft={draft} />
        </div>

        {/* ── RIGHT: contact + confirm CTA (sticky sidebar) ── */}
        <aside className="no-print w-full lg:w-[380px] shrink-0 lg:sticky lg:top-4 space-y-4">
          {/* Contact */}
          <div className="rounded-xl border border-ir-border bg-ir-card px-5 pt-5 pb-6 shadow-e1">
            <p className="text-lead font-semibold text-ir-t1 mb-1">ข้อมูลติดต่อ</p>
            <p className="text-body text-ir-t3 mb-4">ทีม IR Plus จะติดต่อกลับโดยเร็ว</p>
            {/* space-y-4 (not -3) — these are three distinct fields, not tightly related
                sub-parts of one field, so they get a touch more breathing room between them. */}
            <div className="space-y-4">
              <F id="contact-name" required label="ชื่อ-นามสกุล" value={draft.name} onChange={(v) => updateDraft({ name: v })} onBlur={() => markTouched("name")} error={showError("name")} placeholder="ชื่อและนามสกุลผู้ประสานงาน" autoComplete="name" />
              <F id="contact-position" required label="ตำแหน่ง" value={draft.position ?? ""} onChange={(v) => updateDraft({ position: v })} onBlur={() => markTouched("position")} error={showError("position")} placeholder="เช่น ผู้จัดการฝ่ายนักลงทุนสัมพันธ์" autoComplete="organization-title" />
              <F id="contact-email" required label="Email" type="email" autoComplete="email" value={draft.email} onChange={(v) => updateDraft({ email: sanitizeEmailInput(v) })} onBlur={() => markTouched("email")} error={showError("email")} placeholder="name@company.co.th" />
              {/* Phone is no longer a bare field: ask first whether a call-back suits them
                  (user test CPALL), then where — phone or LINE. */}
              <div role="group" aria-labelledby="callback-q">
                <p id="callback-q" className="text-body font-medium mb-1.5">สะดวกให้ทีมติดต่อกลับ เพื่อคุยรายละเอียดเพิ่มไหม</p>
                <div className="grid grid-cols-2 gap-2">
                  {([[true, "สะดวก"], [false, "ทางอีเมลพอ"]] as const).map(([v, label]) => {
                    const on = (draft.callbackOk ?? true) === v;
                    return (
                      <button key={label} type="button" aria-pressed={on} onClick={() => updateDraft({ callbackOk: v })}
                        className={`min-h-11 rounded-md border px-3 text-body font-medium transition-colors focus-ring ${on ? "border-ir-select bg-primary-50 text-ir-t1" : "border-ir-border text-ir-t2 hover:border-ir-border-hi"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {(draft.callbackOk ?? true) && (
                <>
                  <F id="contact-phone" label="โทรศัพท์ (ไม่บังคับ)" type="tel" autoComplete="tel" value={draft.phone} onChange={(v) => updateDraft({ phone: sanitizePhoneInput(v) })} onBlur={() => markTouched("phone")} error={showError("phone")} placeholder="08X-XXX-XXXX" />
                  <F label="LINE ID (ไม่บังคับ)" value={draft.lineId ?? ""} onChange={(v) => updateDraft({ lineId: v.trim() })} placeholder="เช่น @irplus หรือ LINE ID ของคุณ" />
                </>
              )}
            </div>
            <AIJourneyGuide visible={g.visible} message={g.message} mode={g.mode} actions={g.actions} expert={g.expert} className="mt-4 mb-0" />
          </div>

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
                {submitting ? "กำลังส่ง..." : "ยืนยันและส่งให้ทีม IR Plus"}
                <span className={`grid w-9 h-9 place-items-center rounded-full transition-transform duration-fast ${!submitting ? "bg-ir-accent text-ir-on-accent group-hover:translate-x-0.5" : "bg-ir-accent/70 text-ir-on-accent"}`}>
                  <IconArrowRight width={24} height={24} />
                </span>
              </button>
            </div>
            <p className="text-body text-ir-t3 text-center leading-relaxed mt-3">
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
  label, value, onChange, onBlur, error, placeholder, type = "text", autoComplete, id, required,
}: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string; placeholder?: string; type?: string; autoComplete?: string; id?: string; required?: boolean }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      <label htmlFor={inputId} className="text-body font-medium block mb-1.5">{label}</label>
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
        className={`w-full border rounded-md px-3 py-3 text-body outline-none transition-colors ${error ? "border-red-400 focus:border-red-500" : "border-ir-border focus:border-ir-accent"}`}
      />
      {error && <p className="text-small text-red-600 mt-1">{error}</p>}
    </div>
  );
}
