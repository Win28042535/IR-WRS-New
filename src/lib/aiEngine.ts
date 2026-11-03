// AI Experience Layer pure logic, no React deps
import type { Requirement } from "./types";

// ── Confidence Score ──────────────────────────────────────────

export interface ConfidenceFactor {
  label: string;
  points: number;
  earned: boolean;
  action: string;
  why: string;   // why this factor matters to AI confidence
}

export interface ConfidenceResult {
  score: number;
  level: "low" | "medium" | "high" | "complete";
  levelLabel: string;
  breakdown: ConfidenceFactor[];
  topMissing: string[];
}

export function getConfidenceScore(draft: Partial<Requirement>): ConfidenceResult {
  const factors: ConfidenceFactor[] = [
    {
      label: "ชื่อบริษัท", points: 10, earned: !!(draft.company?.trim()),
      action: "กรอกชื่อบริษัท",
      why: "AI ต้องรู้จัก Brand ก่อนจะแนะนำ Tone และ Content ที่เหมาะสมกับภาพลักษณ์องค์กร",
    },
    {
      label: "เว็บไซต์เดิม", points: 5, earned: !!(draft.website?.trim()),
      action: "เพิ่ม URL เว็บไซต์เดิม",
      why: "วิเคราะห์สไตล์เดิมเพื่อรักษา Brand Consistency หรือแนะนำทิศทางที่ต่างออกไปอย่างมีเหตุผล",
    },
    {
      label: "Industry", points: 10, earned: !!(draft.industry),
      action: "เลือก Industry",
      why: "Industry กำหนดว่า Section ใดจำเป็น เช่น SET Listing ต้องมี Financial Data และ IR Section",
    },
    {
      label: "Website Type", points: 10, earned: !!(draft.projectType),
      action: "เลือก Website Type",
      why: "ประเภทเว็บกำหนด Structure หลัก IR Site ต้องการ Governance, Brand Site เน้น Storytelling",
    },
    {
      label: "Mood & Tone", points: 8, earned: !!(draft.selectedMoods && draft.selectedMoods.length >= 2),
      action: "เลือก Mood อย่างน้อย 2 แบบ",
      why: "AI ใช้ Mood เลือก Color Palette, Typography และ Visual Style ที่ตรงกับ Brand Feeling",
    },
    {
      label: "Direction", points: 15, earned: !!(draft.selectedDirection),
      action: "เลือก Direction เว็บไซต์",
      why: "Direction คือ Blueprint ที่ IR Plus ใช้เริ่มงาน ขาดตรงนี้ AI สร้าง Preview ไม่ได้",
    },
    {
      label: "Layout Style", points: 7, earned: !!(draft.selectedLayout),
      action: "เลือก Layout Style",
      why: "Layout กำหนด Visual Hierarchy และ Grid ที่ Designer จะ Implement ให้ตรงกับที่คาดหวัง",
    },
    {
      label: "Sections", points: 10, earned: !!(draft.selectedSections && draft.selectedSections.length >= 5),
      action: "เลือก Section อย่างน้อย 5 รายการ",
      why: "Sections คือ Scope จริงๆ ยิ่งครบยิ่งลดรอบ Revision และทีมวางแผนงบประมาณได้แม่นยำขึ้น",
    },
    {
      label: "Reference", points: 5, earned: !!(draft.references && draft.references.length > 0),
      action: "แนบ Reference เว็บไซต์",
      why: "รูปหรือ URL อ้างอิงบอก Designer ได้ชัดกว่าคำอธิบาย 100 คำ ลดความเข้าใจผิดตั้งแต่ต้น",
    },
    {
      label: "Business Goals", points: 10, earned: !!(draft.businessGoals && draft.businessGoals.length >= 2),
      action: "เลือก Business Goals อย่างน้อย 2 ข้อ",
      why: "Goals ช่วย AI จัดลำดับ CTA และ Section ที่สำคัญที่สุดให้ตรงกับวัตถุประสงค์ทางธุรกิจ",
    },
    {
      label: "ข้อมูลติดต่อ", points: 5, earned: !!(draft.name?.trim() && draft.email?.trim()),
      action: "กรอกชื่อและ Email",
      why: "ครบแล้วทีม IR Plus เริ่มงานได้ทันที โดยไม่ต้องรอถามข้อมูลเพิ่มเติมอีกรอบ",
    },
    {
      label: "Note / Comment", points: 5, earned: !!(draft.note?.trim() || draft.comments?.trim()),
      action: "เพิ่ม Note หรือ Comment",
      why: "Deadline, งบประมาณ หรือข้อจำกัดพิเศษที่ไม่อยู่ใน Form AI ใช้ประกอบการแนะนำ",
    },
  ];

  const score = factors.filter((f) => f.earned).reduce((sum, f) => sum + f.points, 0);
  const level: ConfidenceResult["level"] =
    score < 25 ? "low" : score < 55 ? "medium" : score < 80 ? "high" : "complete";
  const levelLabel =
    level === "low" ? "เริ่มต้น" : level === "medium" ? "กำลังดีขึ้น" : level === "high" ? "เกือบสมบูรณ์" : "พร้อมส่ง";
  const topMissing = factors.filter((f) => !f.earned).slice(0, 2).map((f) => f.action);

  return { score, level, levelLabel, breakdown: factors, topMissing };
}

// ── Capability Unlocks ────────────────────────────────────────────
// What AI can generate at each confidence level.

export interface Capability {
  label: string;
  detail: string;
}

export function getCapabilities(level: string): { unlocked: Capability[]; locked: Capability[] } {
  const ALL: { minLevel: number; label: string; detail: string }[] = [
    {
      minLevel: 1,
      label: "Layout Recommendation",
      detail: "แนะนำ Layout ที่เหมาะกับ Industry อัตโนมัติ",
    },
    {
      minLevel: 1,
      label: "Industry Analysis",
      detail: "ระบุ Section สำคัญตาม Business Priority",
    },
    {
      minLevel: 2,
      label: "Project Brief Draft",
      detail: "เขียน Brief ที่ทีม Designer เริ่มงานได้ทันที",
    },
    {
      minLevel: 3,
      label: "Visual Preview",
      detail: "Preview ตรงกับ Brand Direction ของคุณจริงๆ",
    },
  ];
  const ORD: Record<string, number> = { low: 0, medium: 1, high: 2, complete: 3 };
  const cur = ORD[level] ?? 0;
  return {
    unlocked: ALL.filter(c => c.minLevel <= cur),
    locked:   ALL.filter(c => c.minLevel > cur),
  };
}

// ── Contextual Confidence Explanation ───────────────────────────
// One sentence that dynamically explains the current AI confidence state.
// Changes as the user fills in information not a static label.

export function getContextualExplanation(breakdown: ConfidenceFactor[], score: number): string {
  const has = (label: string) => breakdown.find(f => f.label === label)?.earned ?? false;
  const missing = breakdown.filter(f => !f.earned).sort((a, b) => b.points - a.points);

  if (score < 15) {
    return "AI ยังไม่รู้จัก Brand หรือทิศทางเว็บของคุณเลย เริ่มจากชื่อบริษัทและ Industry ก่อนเลยครับ";
  }
  if (!has("Direction") && has("Industry") && has("Website Type")) {
    return "AI รู้จัก Industry และ Website Type แล้ว เลือก Direction เพื่อปลดล็อค Blueprint ที่ใช้สร้าง Preview ได้";
  }
  if (!has("Direction") && has("Industry")) {
    return "AI รู้จัก Industry แล้ว เลือก Direction เพื่อให้ AI สร้าง Preview ที่ตรงกับ Brand ของคุณได้";
  }
  if (has("Direction") && !has("Sections")) {
    return "Direction เลือกแล้ว เพิ่ม Sections เพื่อให้ AI รู้ Scope จริงๆ และวาง Brief ให้ทีม IR Plus ได้";
  }
  if (has("Direction") && has("Sections") && !has("Mood & Tone")) {
    return "โครงสร้างพร้อมแล้ว เพิ่ม Mood & Tone เพื่อให้ AI เลือก Color Palette และ Visual Style ที่ตรงกับ Brand";
  }
  if (score >= 80 && missing.length === 0) {
    return "AI มีข้อมูลครบสมบูรณ์ Brief และ Preview แม่นยำสูงสุด พร้อมส่งให้ทีม IR Plus ได้เลยครับ";
  }
  if (score >= 80) {
    const labels = missing.slice(0, 2).map(f => f.label).join(" และ ");
    return `AI มีข้อมูลเกือบครบแล้ว เพิ่ม ${labels} เพื่อลด Revision รอบแรกได้อีก`;
  }
  const top = missing.slice(0, 2);
  const pts = top.reduce((s, f) => s + f.points, 0);
  return `AI ยังขาด ${top.map(f => f.label).join(" และ ")} เพิ่มได้อีก +${pts} pts เพื่อให้ Preview แม่นยำขึ้น`;
}

// ── Contextual AI Messages ────────────────────────────────────

export function getIndustryContextMessage(industry: string, projectType: string): string {
  if (!industry || !projectType) return "";

  const combined: Record<string, string> = {
    "Listed Company (SET)|Investor Relations Site":
      "IR Plus ออกแบบ IR Website ให้บริษัทจดทะเบียนมากกว่า 200 ราย ระบบจะแนะนำโครงสร้างที่นักลงทุนสถาบันคาดหวัง",
    "Listed Company (SET)|Corporate Website":
      "Corporate Website ของบริษัทจดทะเบียนต้องสมดุลระหว่าง Brand Storytelling กับ Investor Credibility",
    "Finance & Banking|Corporate Website":
      "สถาบันการเงินต้องการ Website ที่แสดง Stability ผ่าน Design Professionalism ทุก Pixel สร้างความไว้วางใจ",
    "ESG & Sustainability|ESG / Sustainability Site":
      "ESG Site ที่มีประสิทธิภาพต้องเปลี่ยน Commitment เป็น Evidence ระบบจะแนะนำโครงสร้าง Data Storytelling",
    "Technology & Digital|Product / Service Site":
      "Product Site ที่ดีต้อง Convert Visitor ในไม่กี่วินาที ระบบจะแนะนำ Layout และ CTA ที่พิสูจน์แล้วว่าได้ผล",
  };

  const key = `${industry}|${projectType}`;
  if (combined[key]) return combined[key];

  const byType: Record<string, string> = {
    "Investor Relations Site":
      "IR Website ที่ดีสร้างความเชื่อมั่นให้นักลงทุน แสดงข้อมูลทางการเงินอย่างโปร่งใส และสื่อสาร Vision ขององค์กร",
    "Corporate Website":
      "Corporate Website คือ Digital Headquarters ต้องสื่อสาร Brand, Value, และ Story ขององค์กรได้ครบในที่เดียว",
    "ESG / Sustainability Site":
      "ESG Site ควรแสดงความมุ่งมั่นด้วยข้อมูลจริง มี Data Visualization และ Storytelling ที่ทำให้ Stakeholders เชื่อมั่น",
    "Product / Service Site":
      "Product Site ที่ดีช่วยให้ผู้เข้าชมเข้าใจ Value ขององค์กรและตัดสินใจติดต่อได้อย่างรวดเร็ว",
    "Campaign / Microsite":
      "Microsite ต้องมี Single Focus ที่ชัดเจน ระบบจะแนะนำโครงสร้างที่เพิ่ม Conversion",
  };

  return byType[projectType] || `ระบบจะช่วยออกแบบ ${projectType} ที่เหมาะกับ ${industry} โดยเฉพาะ`;
}

export function getMoodGuidance(industry: string): string {
  if (!industry) return "";

  const map: Record<string, string> = {
    "Listed Company (SET)":
      "บริษัทจดทะเบียนมักเลือก Professional & Clean เพื่อสร้างความน่าเชื่อถือ หรือ Data-Driven เพื่อสื่อสารข้อมูลทางการเงิน",
    "Finance & Banking":
      "สถาบันการเงินนิยม Luxury & Premium หรือ Professional & Clean เพื่อสร้างความไว้วางใจในระดับสถาบัน",
    "ESG & Sustainability":
      "องค์กร ESG เลือก ESG & Sustainable เพื่อสะท้อนคุณค่า หรือ Warm & Approachable เพื่อสื่อถึงมนุษยธรรม",
    "Technology & Digital":
      "Tech Company นิยม Modern & Minimal หรือ Creative & Innovative เพื่อแสดงความล้ำสมัยและนวัตกรรม",
    "Healthcare & Pharma":
      "สุขภาพและยา → Warm & Approachable หรือ Professional & Clean เพื่อสร้างความไว้วางใจกับผู้ป่วยและพันธมิตร",
    "Real Estate & Property":
      "อสังหาฯ เลือก Luxury & Premium เพื่อแสดงมูลค่าโครงการ หรือ Bold & Dynamic เพื่อแสดงความยิ่งใหญ่",
    "Consumer & Retail":
      "Retail นิยม Warm & Approachable เพื่อดึงดูดผู้บริโภค หรือ Bold & Dynamic เพื่อสร้าง Brand Excitement",
    "Energy & Power":
      "พลังงาน → Bold & Dynamic สะท้อนความแข็งแกร่ง หรือ ESG & Sustainable แสดงความมุ่งมั่นด้านสิ่งแวดล้อม",
    "Industrial & Manufacturing":
      "อุตสาหกรรม → Professional & Clean สื่อความน่าเชื่อถือด้านวิศวกรรม หรือ Data-Driven แสดง Capability ขององค์กร",
    "Government & Public Sector":
      "ภาครัฐ → Professional & Clean สื่อความเป็นทางการ หรือ Warm & Approachable ทำให้บริการเข้าถึงได้ง่ายขึ้น",
  };

  return map[industry] || "";
}

export function getDirectionGuidance(industry: string, moods: string[]): string {
  if (!moods.length) return "";

  const hasESG      = moods.includes("esg");
  const hasPremium  = moods.includes("luxury") || moods.includes("professional");
  const hasModern   = moods.includes("modern") || moods.includes("creative");
  const hasData     = moods.includes("data");
  const hasBold     = moods.includes("bold");

  if (hasESG)
    return "จาก Mood ที่เลือก ระบบแนะนำ ESG-focused Direction สื่อสาร Sustainability Story ผ่าน Visual Data ที่ทรงพลัง";
  if (hasPremium && (industry.includes("Finance") || industry.includes("SET")))
    return "สำหรับ Finance + Premium Mood ระบบแนะนำ Premium Corporate สร้าง Investor Confidence สูงสุด";
  if (hasModern)
    return "Modern/Creative Mood ตรงกับ Modern Tech Direction Geometric Layout ที่แสดงนวัตกรรมและความล้ำสมัย";
  if (hasData)
    return "Data-Driven Mood → Growth-Oriented Direction เหมาะสำหรับองค์กรที่ต้องการสื่อสาร Performance ด้วยตัวเลข";
  if (hasBold)
    return "Bold & Dynamic Mood สอดคล้องกับ Direction ที่มี Hero Section ขนาดใหญ่และ Visual Impact สูง";
  if (hasPremium)
    return "Professional/Luxury Mood → Premium Corporate Direction สะท้อนความเป็นองค์กรระดับนำในอุตสาหกรรม";

  return "เลือก Direction ที่ Mood สอดคล้องกัน และสะท้อน Brand Identity ขององค์กรได้ตรงที่สุด";
}

export function getSectionGuidance(direction: string, industry: string): string {
  if (!direction) return "";

  const dirMap: Record<string, string> = {
    "premium-corporate":
      "Premium Corporate มักต้องการ: Hero + About + Leadership + Milestones + Investors + News + Contact",
    "esg-focused":
      "ESG Site เน้น: Hero + ESG Overview + Environment + Social + Governance + Data Dashboard + Reports",
    "modern-tech":
      "Modern Tech ใช้: Hero + Features + How It Works + Case Studies + Integrations + Pricing + CTA",
    "growth-oriented":
      "Growth-Oriented: Hero + KPI Dashboard + Products/Services + Milestones + Partners + Investors + Contact",
  };

  return dirMap[direction] || `เลือก Section ที่ช่วยให้ผู้เข้าชมเข้าใจ ${industry} ขององค์กรได้อย่างสมบูรณ์`;
}

export function getBusinessGoalGuidance(industry: string, projectType: string): string {
  if (!industry) return "";

  const map: Record<string, string> = {
    "Listed Company (SET)":
      "บริษัทจดทะเบียนมักมีเป้าหมาย: สร้าง Investor Confidence, แสดง IR Performance, สื่อสาร Corporate Governance",
    "Finance & Banking":
      "สถาบันการเงิน: สร้าง Brand Trust, แสดง Financial Stability, ดึงดูด Corporate Clients",
    "ESG & Sustainability":
      "ESG Organization: แสดง Sustainability Commitment, สื่อสาร ESG Data, สร้าง Stakeholder Engagement",
    "Technology & Digital":
      "Tech Company: แสดง Innovation, สร้าง Developer Ecosystem, ดึงดูด Enterprise Clients",
  };

  return map[industry] || "";
}

// ── AI Reflection ─────────────────────────────────────────────

export interface StepReflection {
  understood: string[];
  decided: string[];
  missing: string[];
}

export function getStepReflection(draft: Partial<Requirement>, fromStep: number): StepReflection {
  const understood: string[] = [];
  const decided: string[] = [];
  const missing: string[] = [];

  // Context established
  if (draft.company?.trim())  understood.push(draft.company.trim());
  if (draft.industry)         understood.push(draft.industry);
  if (draft.projectType)      understood.push(draft.projectType);
  if (draft.companyType)      understood.push(draft.companyType);
  if (draft.website?.trim())  understood.push("มีเว็บไซต์เดิม");

  // Decisions made
  if (draft.selectedMoods?.length)
    decided.push(`Mood · ${draft.selectedMoods.length} แบบ`);
  if (draft.selectedDirection && draft.directionLabel)
    decided.push(`Direction · ${draft.directionLabel}`);
  if (draft.selectedLayout)
    decided.push(`Layout · ${draft.selectedLayout}`);
  if (draft.selectedSections?.length)
    decided.push(`${draft.selectedSections.length} Sections`);
  if (draft.businessGoals?.length)
    decided.push(`${draft.businessGoals.length} Business Goals`);
  if (draft.references?.length)
    decided.push(`${draft.references.length} References`);

  // Still missing (contextual per step)
  if (!draft.selectedMoods?.length && fromStep >= 2) missing.push("Mood & Tone");
  if (!draft.selectedDirection    && fromStep >= 2) missing.push("Direction");
  if (!draft.selectedSections?.length && fromStep >= 3) missing.push("Website Sections");
  if (!draft.selectedLayout       && fromStep >= 3) missing.push("Layout Style");
  if ((!draft.name?.trim() || !draft.email?.trim()) && fromStep >= 4) missing.push("ข้อมูลติดต่อ");

  return { understood, decided, missing };
}
