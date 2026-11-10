import type {
  Direction,
  SectionDef,
  BusinessGoalDef,
  QuizQuestion,
  SelectionRule,
  StakeholderRole,
} from "./types";

// ── Selection rules (UX #5) ──
export const RULES: Record<string, SelectionRule> = {
  moods: { min: 1, max: 3 },
  sections: { min: 4, max: 9 },
  goals: { min: 1, max: 4 },
  references: { min: 0, max: 8 },
};

// Fixed structure every site has — always present, never user-toggleable or reorderable.
// Split by dock position: header/hero pin to the very top of the page, footer pins to the
// very bottom — everything the user picks lives in between and stays freely reorderable.
// Shared by the Structure picker (flow2) and the live workspace list (PreviewPanel) so both
// agree on which rows are locked and where.
export const LEADING_REQUIRED_IDS = ["header", "hero"];
export const TRAILING_REQUIRED_IDS = ["footer"];
export const REQUIRED_SECTION_IDS = [...LEADING_REQUIRED_IDS, ...TRAILING_REQUIRED_IDS];

export const ESTIMATED_MINUTES: Record<string, number> = {
  flow1: 12,
  flow2: 18,
};

// ── Industries (UX #6: business category only, website type kept separate) ──
export const INDUSTRIES = [
  "Energy & Power",
  "Finance & Banking",
  "Industrial & Manufacturing",
  "ESG & Sustainability",
  "Listed Company (SET)",
  "Technology & Digital",
  "Healthcare & Pharma",
  "Real Estate & Property",
  "Consumer & Retail",
  "Government & Public Sector",
];

// Short description per industry (shown with an image in Business Discovery)
export const INDUSTRY_DESC: Record<string, string> = {
  "Energy & Power": "ผลิต/จัดจำหน่ายพลังงาน โครงสร้างพื้นฐาน",
  "Finance & Banking": "ธนาคาร หลักทรัพย์ บริการการเงิน",
  "Industrial & Manufacturing": "การผลิต โรงงาน อุตสาหกรรม",
  "ESG & Sustainability": "ความยั่งยืน สิ่งแวดล้อม สังคม",
  "Listed Company (SET)": "บริษัทจดทะเบียนในตลาดหลักทรัพย์",
  "Technology & Digital": "ซอฟต์แวร์ ดิจิทัล นวัตกรรม",
  "Healthcare & Pharma": "การแพทย์ เวชภัณฑ์ สุขภาพ",
  "Real Estate & Property": "อสังหาริมทรัพย์ พัฒนาโครงการ",
  "Consumer & Retail": "สินค้าอุปโภคบริโภค ค้าปลีก",
  "Government & Public Sector": "หน่วยงานรัฐ รัฐวิสาหกิจ",
};

export const COMPANY_TYPES = [
  "Public Company (Listed / SET)",
  "Public Company (Non-listed)",
  "Private Company",
  "Holding Company",
  "Joint Venture",
  "Family Business",
  "SME",
  "Startup",
  "Government / State Enterprise",
  "Non-profit / Foundation",
];

// Website Type (separated from business category UX #6)
export const WEBSITE_TYPES = [
  "Corporate Website",
  "Investor Relations Site",
  "Product / Service Site",
  "Campaign / Microsite",
  "ESG / Sustainability Site",
];

// ── Mood & Tone (UX #3 visual-first) ──
export const MOODS = [
  { id: "professional", label: "Professional & Clean", swatch: "#0D1B4B" },
  { id: "luxury", label: "Luxury & Premium", swatch: "#C8A855" },
  { id: "modern", label: "Modern & Minimal", swatch: "#03041C" },
  { id: "esg", label: "ESG & Sustainable", swatch: "#2D5A2D" },
  { id: "warm", label: "Warm & Approachable", swatch: "#E08A3C" },
  { id: "creative", label: "Creative & Innovative", swatch: "#7C3AED" },
  { id: "data", label: "Data-Driven", swatch: "#0D3080" },
  { id: "bold", label: "Bold & Dynamic", swatch: "#008080" },
];

// ── Hashtag system for layout discovery (UX #8) ──
export const LAYOUT_TAGS = [
  "#Corporate",
  "#InvestorRelations",
  "#Minimal",
  "#Modern",
  "#DataDriven",
  "#B2B",
  "#Storytelling",
  "#ESG",
  "#Premium",
  "#TechForward",
];

import type { ImageRole } from "./images";

export interface LayoutDef {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  previewRole: ImageRole;     // representative photo for the layout card
  highlights: string[];       // จุดเด่นของ Layout
  popularFor: string[];       // ธุรกิจที่นิยมใช้งาน
  refSites: string[];         // ตัวอย่างเว็บไซต์อ้างอิง
  contentGuide: string;       // แนวทางการจัดวาง Content
  bestForIndustry: string[];  // ranking signal
}
export const LAYOUTS: LayoutDef[] = [
  {
    id: "full-elegant", name: "Full-Width Elegant Grid",
    desc: "Hero เต็มจอ + Grid โปร่ง เหมาะกับองค์กรขนาดใหญ่", tags: ["#Corporate", "#Premium", "#B2B"],
    previewRole: "office",
    highlights: ["Hero เต็มจอสร้าง First Impression", "Grid โปร่งดูพรีเมียม", "เหมาะกับ Brand Story ที่ชัดเจน"],
    popularFor: ["บริษัทจดทะเบียน", "กลุ่มธุรกิจขนาดใหญ่", "สถาบันการเงิน"],
    refSites: ["scc.co.th (SCG)", "pttgcgroup.com"],
    contentGuide: "Hero → About → ธุรกิจ → ผู้บริหาร → ข่าวสาร → ติดต่อ",
    bestForIndustry: ["Listed Company (SET)", "Finance & Banking", "Energy & Power", "Real Estate & Property"],
  },
  {
    id: "story-journey", name: "Storytelling Journey",
    desc: "เล่าเรื่องแบบ Scroll ทีละ Section", tags: ["#Storytelling", "#ESG", "#Modern"],
    previewRole: "esg",
    highlights: ["เล่าเรื่องต่อเนื่องด้วย Scroll", "เหมาะกับเนื้อหา ESG / Impact", "อารมณ์อบอุ่น เข้าถึงง่าย"],
    popularFor: ["องค์กรด้านความยั่งยืน", "พลังงานสะอาด", "มูลนิธิ / CSR"],
    refSites: ["set.or.th (Sustainability)", "scg.com/sustainability"],
    contentGuide: "Hero → พันธกิจ → เรื่องราว ESG → Impact Numbers → ข่าว → ติดต่อ",
    bestForIndustry: ["ESG & Sustainability", "Energy & Power", "Government & Public Sector"],
  },
  {
    id: "split-dynamic", name: "Split Screen Dynamic",
    desc: "แบ่งครึ่งจอ + Animation", tags: ["#Modern", "#TechForward", "#Creative"],
    previewRole: "product",
    highlights: ["Layout แบ่งครึ่งดูทันสมัย", "รองรับ Animation / Interaction", "เน้นภาพคู่ข้อความ"],
    popularFor: ["บริษัทเทคโนโลยี", "ดิจิทัล / สตาร์ทอัพ", "สินค้านวัตกรรม"],
    refSites: ["agoda.com", "kbtg.tech"],
    contentGuide: "Hero แบ่งครึ่ง → Features → Use Cases → Case Studies → ติดต่อ",
    bestForIndustry: ["Technology & Digital", "Consumer & Retail", "Healthcare & Pharma"],
  },
  {
    id: "data-grid", name: "Data & Metrics Grid",
    desc: "เน้นตัวเลข Charts และ KPI", tags: ["#DataDriven", "#InvestorRelations", "#B2B"],
    previewRole: "investor",
    highlights: ["นำเสนอตัวเลขและ KPI ชัดเจน", "เหมาะกับ Performance / Growth", "ตาราง + Chart อ่านง่าย"],
    popularFor: ["บริษัทจดทะเบียน", "สถาบันการเงิน", "B2B Enterprise"],
    refSites: ["set.or.th", "settrade.com"],
    contentGuide: "Hero → Financial Highlights → Charts → ธุรกิจ → IR → ติดต่อ",
    bestForIndustry: ["Listed Company (SET)", "Finance & Banking", "Technology & Digital"],
  },
  {
    id: "minimal-focus", name: "Minimal Focus",
    desc: "พื้นที่ว่างเยอะ เน้น Content สำคัญ", tags: ["#Minimal", "#Modern", "#Premium"],
    previewRole: "hero",
    highlights: ["พื้นที่ว่างเยอะ ดูหรู สงบ", "โฟกัส Content สำคัญทีละจุด", "โหลดเร็ว อ่านสบาย"],
    popularFor: ["แบรนด์พรีเมียม", "บริษัทที่ปรึกษา", "องค์กรที่เน้นภาพลักษณ์"],
    refSites: ["apple.com", "linear.app"],
    contentGuide: "Hero เรียบ → จุดเด่น 3 ข้อ → ผลงาน → ติดต่อ",
    bestForIndustry: ["Technology & Digital", "Real Estate & Property", "Consumer & Retail"],
  },
  {
    id: "ir-dashboard", name: "IR Dashboard Style",
    desc: "Stock ticker + Financial Highlights ด้านหน้า", tags: ["#InvestorRelations", "#DataDriven", "#Corporate", "#SETInspired"],
    previewRole: "investor",
    highlights: ["Stock Ticker เด่นบนหน้าแรก", "โครงสร้างแบบ SET IR Site", "นักลงทุนหาข้อมูลได้เร็ว"],
    popularFor: ["บริษัทจดทะเบียนในตลาดหลักทรัพย์", "Holding Company", "สถาบันการเงิน"],
    refSites: ["set.or.th (IR)", "cpall.co.th/ir"],
    contentGuide: "Stock Strip → Financial Highlights → รายงาน → IR Calendar → ธรรมาภิบาล → ติดต่อ",
    bestForIndustry: ["Listed Company (SET)", "Finance & Banking", "Energy & Power"],
  },
];

// ── Sections library (UX #9) ──
export const SECTIONS: SectionDef[] = [
  // ── Core / โครงสร้างหลัก ──
  { id: "header", name: "Header / เมนูหลัก", category: "Core", desc: "เมนูนำทางและ Logo", popular: true, icon: "🔝", businessPurpose: "ระบบนำทางหลักของเว็บไซต์ รวม Logo เมนู และลิงก์สำคัญ ผู้เข้าชมทุกคนเห็นในทุกหน้า", example: "Logo · เมนูหลัก · ปุ่มภาษา · ปุ่ม Contact IR" },
  { id: "hero", name: "Hero Section", category: "Core", desc: "ภาพหลัก + ข้อความ + CTA", popular: true, icon: "🖼️", businessPurpose: "สร้าง First Impression ที่จดจำได้ สื่อสารตัวตนองค์กรและจุดยืนของ IR ในไม่กี่วินาที", example: "SCG · PTTGC · Banpu" },
  { id: "about", name: "เกี่ยวกับบริษัท / About Us", category: "Core", desc: "แนะนำองค์กร วิสัยทัศน์ พันธกิจ", popular: true, icon: "🏢", businessPurpose: "สร้างความน่าเชื่อถือ บอกเล่าประวัติ พันธกิจ โครงสร้างธุรกิจ และจุดยืนขององค์กร", example: "ประวัติบริษัท · วิสัยทัศน์ · โครงสร้างธุรกิจ" },
  { id: "history", name: "ประวัติองค์กร / Company History", category: "Core", desc: "ประวัติและ Milestone สำคัญ", icon: "📅", businessPurpose: "แสดง Heritage ขององค์กร ความมั่นคงและประสบการณ์ที่สั่งสมมา ด้วย Timeline ที่น่าประทับใจ", example: "ก่อตั้ง 2530 · จดทะเบียน SET 2545 · ขยายต่างประเทศ 2558" },
  { id: "chairman-message", name: "สารจากประธานกรรมการ", category: "Core", desc: "บทความจากผู้นำระดับสูงสุด", icon: "🧑‍💼", businessPurpose: "สื่อสารวิสัยทัศน์และทิศทางองค์กรโดยตรงจาก Chairman สร้างความเชื่อมั่นในระดับผู้นำแก่นักลงทุน", example: "สารประจำปี · ทิศทางกลยุทธ์ · ข้อความถึงผู้ถือหุ้น" },
  { id: "contact", name: "ช่องทางการติดต่อ / Contact", category: "Core", desc: "ข้อมูลติดต่อ IR และทีมงาน", popular: true, icon: "📞", businessPurpose: "ช่องทางติดต่อครบถ้วน Form, แผนที่, เบอร์โทร, Email ทีม IR เพื่ออำนวยความสะดวกนักลงทุน", example: "Contact Form · Office Map · IR Contact · Email" },
  { id: "footer", name: "Footer / ส่วนท้ายเว็บ", category: "Core", desc: "ลิงก์ท้ายเว็บ ข้อมูลกฎหมาย สิทธิ์", popular: true, icon: "⬇️", businessPurpose: "รวมลิงก์สำคัญ นโยบายความเป็นส่วนตัว ข้อมูลลิขสิทธิ์ และ Social Media ที่ท้ายทุกหน้า", example: "Site Map · Social Links · Privacy Policy · ©2568" },

  // ── People / บุคลากร ──
  { id: "board", name: "คณะกรรมการบริษัทและผู้บริหาร", category: "People", desc: "โครงสร้างคณะกรรมการและผู้บริหารระดับสูง", popular: true, icon: "👔", businessPurpose: "แสดงธรรมาภิบาลและโครงสร้างการบริหารตามมาตรฐาน SET/SEC ครอบคลุมทั้ง Board และ Executive Team", example: "Board of Directors · Independent Directors · C-Suite · Committee" },

  // ── Investor / ข้อมูลนักลงทุน ──
  { id: "ir-calendar", name: "ปฏิทินกิจกรรม และข่าวสารล่าสุด", category: "Investor", desc: "กิจกรรม IR และข่าวสารใหม่", popular: true, icon: "🗓️", businessPurpose: "ประกาศกิจกรรมล่วงหน้า ผลประกอบการ AGM Analyst Meeting พร้อมข่าวสารล่าสุดสำหรับนักลงทุน", example: "Q4/67 Results · AGM 2568 · Roadshow · ข่าวล่าสุด" },
  { id: "reports", name: "เอกสารนักลงทุน / IR Documents", category: "Investor", desc: "รายงานและเอกสาร IR สำหรับดาวน์โหลด", popular: true, icon: "📄", businessPurpose: "ดาวน์โหลด Annual Report, 56-1 One Report, Analyst Presentation และเอกสาร IR ตามข้อกำหนด SEC", example: "Annual Report 2024 · 56-1 · Proxy · Analyst Presentation" },
  { id: "financial", name: "ข้อมูลสำคัญทางเงิน / Financial Highlights", category: "Investor", desc: "ตัวเลขการเงินและ KPI สำคัญ", popular: true, icon: "📈", businessPurpose: "นำเสนอข้อมูลการเงินที่สำคัญสำหรับนักลงทุน Revenue, EPS, Dividend และ Financial Ratio เข้าถึงได้ทันที", example: "Revenue 2024 · ROE · DPS · EPS · P/E Ratio" },
  { id: "ir-info", name: "ข้อมูลหลักทรัพย์ / Stock Information", category: "Investor", desc: "ราคาหุ้น SET และข้อมูลหลักทรัพย์", icon: "💹", businessPurpose: "ข้อมูล IR ทั่วไป รวมราคาหุ้น Real-time ข้อมูลหลักทรัพย์ และศูนย์กลางข้อมูลสำหรับนักลงทุน", example: "SET Ticker · Volume · Market Cap · IR Contacts" },
  { id: "shareholder-info", name: "ข้อมูลผู้ถือหุ้น / Shareholder Info", category: "Investor", desc: "โครงสร้างผู้ถือหุ้นและสิทธิประโยชน์", icon: "🤝", businessPurpose: "แสดงโครงสร้างผู้ถือหุ้น ปันผล สิทธิ AGM และข้อมูลสิทธิประโยชน์สำหรับผู้ถือหุ้น", example: "Major Shareholders · Dividend History · AGM Rights" },

  { id: "analyst", name: "บทวิเคราะห์ / Analyst Coverage", category: "Investor", desc: "บทวิเคราะห์และประมาณการจากโบรกเกอร์", icon: "🔎", businessPurpose: "รวมรายชื่อโบรกเกอร์ที่ออกบทวิเคราะห์ ราคาเป้าหมาย และ Consensus ให้นักวิเคราะห์และนักลงทุนสถาบันหาได้ในที่เดียว", example: "Broker Coverage · Target Price · Consensus · Analyst Presentation" },

  // ── Sustainability & Governance / ความยั่งยืนและธรรมาภิบาล ──
  { id: "sustainability", name: "ความยั่งยืน / ESG", category: "Sustainability", desc: "การพัฒนาอย่างยั่งยืนด้านสิ่งแวดล้อม สังคม และธรรมาภิบาล", icon: "🌿", businessPurpose: "สื่อสารเป้าหมาย ESG ผลการดำเนินงานด้านความยั่งยืน และรายงานตามมาตรฐาน GRI / TCFD ที่นักลงทุน ESG ใช้ประกอบการตัดสินใจ", example: "ESG Highlights · Sustainability Report · SET ESG Ratings · Net Zero Target" },
  { id: "governance", name: "การกำกับดูแลกิจการ / CG", category: "Sustainability", desc: "นโยบายธรรมาภิบาล จรรยาบรรณ และการต่อต้านคอร์รัปชัน", icon: "⚖️", businessPurpose: "แสดงความโปร่งใสตามหลักการกำกับดูแลกิจการที่ดีของ ก.ล.ต. และ SET ให้ผู้กำกับดูแลและนักลงทุนตรวจสอบได้", example: "CG Policy · Code of Conduct · Anti-Corruption (CAC) · Whistleblowing" },

  // ── Engagement / Section เสริม ──
  { id: "cta", name: "CTA หรือ Section อื่นๆ", category: "Engagement", desc: "Call to Action พิเศษหรือ Section เสริม", icon: "🎯", businessPurpose: "เพิ่ม Section พิเศษตามความต้องการ เช่น Download Kit, IR Subscription, Quick Contact หรือ Highlight Campaign", example: "Subscribe IR · Download IR Kit · Contact IR Team" },
];

// ── Contextual "AI recommends" graph (Structure step) ──
// After a user picks a section, these are the sections that most commonly pair with it —
// shown as lightweight chips right after the pick, not another full card grid. Keys/values
// are SECTIONS ids; header/hero/footer are excluded since they're the fixed Foundation.
export const RELATED_SECTIONS: Record<string, string[]> = {
  about: ["history", "chairman-message", "board"],
  history: ["about", "chairman-message", "board"],
  "chairman-message": ["about", "history", "board"],
  board: ["chairman-message", "about", "reports"],
  contact: ["ir-info", "cta", "ir-calendar"],
  "ir-calendar": ["reports", "financial", "cta"],
  reports: ["financial", "ir-calendar", "shareholder-info"],
  financial: ["reports", "ir-info", "shareholder-info"],
  "ir-info": ["financial", "contact", "reports"],
  "shareholder-info": ["financial", "reports", "ir-calendar"],
  analyst: ["financial", "reports", "ir-calendar"],
  sustainability: ["governance", "reports", "board"],
  governance: ["board", "sustainability", "reports"],
  cta: ["contact", "ir-calendar"],
};

export const SECTION_CATEGORIES = ["Core", "People", "Investor", "Sustainability", "Engagement"];
export const SECTION_CATEGORY_LABEL: Record<string, string> = {
  "Core": "โครงสร้างหลัก",
  "People": "คณะกรรมการ / ผู้บริหาร",
  "Investor": "ข้อมูลนักลงทุน (IR)",
  "Sustainability": "ความยั่งยืนและธรรมาภิบาล",
  "Engagement": "Section เสริม / CTA",
};

// Sections each business goal calls for, most important first. "ใช้คำแนะนำ" in Structure
// adds these ahead of the audience/Direction picks, so a goal the customer named (e.g. ESG)
// always shows up as an actual section rather than only shaping the copy.
export const GOAL_SECTIONS: Record<string, string[]> = {
  credibility: ["about", "board", "history"],
  ir: ["financial", "ir-info", "reports", "ir-calendar"],
  lead: ["contact", "cta"],
  awareness: ["about", "ir-calendar"],
  digital: ["ir-info", "cta"],
  esg: ["sustainability", "governance"],
  talent: ["about", "board"],
  product: ["about", "cta"],
  intl: ["about", "ir-info", "reports"],
  compliance: ["governance", "reports", "board"],
};

// ── Business goals (Flow 2) ──
export const BUSINESS_GOALS: BusinessGoalDef[] = [
  { id: "credibility", label: "สร้างความน่าเชื่อถือ", emoji: "🏆", desc: "เสริมภาพลักษณ์องค์กรให้ดูมั่นคง น่าเชื่อถือ ระดับสากล", impact: "เว็บไซต์ดูมั่นคง เป็นทางการ และน่าเชื่อถือในสายตาลูกค้าและนักลงทุน", comps: ["Executive Team", "Awards", "Company Timeline", "Testimonials"] },
  { id: "ir", label: "นักลงทุนสัมพันธ์ (IR)", emoji: "📈", desc: "สื่อสารข้อมูลการเงินให้นักลงทุนเข้าถึงง่าย", impact: "นักลงทุนหาข้อมูลได้เร็ว ลด IR workload และสร้างความเชื่อมั่น", comps: ["Financial Highlights", "Stock Ticker", "Annual Reports", "IR Calendar"] },
  { id: "lead", label: "หาลูกค้าใหม่ / Lead Generation", emoji: "🎯", desc: "ดึงดูดผู้สนใจและเปลี่ยนเป็นลูกค้า", impact: "ผู้เยี่ยมชมติดต่อได้ง่ายขึ้น ได้ Lead มากขึ้น ลด Sales Cycle", comps: ["Hero + CTA", "Services", "Contact Form", "Testimonials"], hidden: true },
  { id: "awareness", label: "สร้างการรับรู้แบรนด์", emoji: "📣", desc: "เพิ่มการรับรู้แบรนด์ในตลาด", impact: "แบรนด์ถูกจดจำมากขึ้น เพิ่มการค้นหาชื่อองค์กรใน Google", comps: ["Hero Banner", "Brand Story", "News & Media"] },
  { id: "digital", label: "แสดงความเป็นองค์กรดิจิทัล", emoji: "⚡", desc: "สื่อสารว่าองค์กรก้าวทันเทคโนโลยี", impact: "องค์กรดูล้ำหน้า ดิจิทัล ทันสมัย ดึงดูดทั้งลูกค้าและบุคลากร Tech", comps: ["Animated Hero", "Feature Comparison", "Case Studies"] },
  { id: "esg", label: "ESG / ความยั่งยืน", emoji: "🌱", desc: "สื่อสารความรับผิดชอบต่อสังคมและสิ่งแวดล้อม", impact: "ตอบโจทย์นักลงทุน ESG รายงานตามมาตรฐาน GRI / TCFD", comps: ["ESG Overview", "Sustainability Report", "CSR Activities"] },
  { id: "talent", label: "ดึงดูดบุคลากร", emoji: "👥", desc: "สร้างแรงดึงดูดให้คนเก่งอยากร่วมงาน", impact: "เพิ่มคุณภาพ Applicant ลด Time-to-hire แสดงวัฒนธรรมองค์กร", comps: ["Careers", "Company Culture", "Team Photos"] },
  { id: "product", label: "เปิดตัวสินค้า / บริการ", emoji: "🚀", desc: "นำเสนอสินค้าหรือบริการใหม่อย่างน่าสนใจ", impact: "ลูกค้าเข้าใจ Value Proposition ชัดขึ้น ตัดสินใจซื้อได้เร็วขึ้น", comps: ["Product Catalog", "Feature Comparison", "Pricing"], hidden: true },
  { id: "intl", label: "ขยายตลาดต่างประเทศ", emoji: "🌐", desc: "เตรียมรองรับลูกค้าและนักลงทุนต่างชาติ", impact: "เว็บไซต์ดูเป็นสากล ตอบสนองความคาดหวังของ International Partners", comps: ["About Us", "Global Offices", "Awards"] },
  { id: "compliance", label: "ความโปร่งใส / Compliance", emoji: "⚖️", desc: "แสดงความโปร่งใสตามกฎระเบียบ SEC, SET, ก.ล.ต.", impact: "ลด Compliance Risk สร้างความเชื่อมั่นให้ผู้กำกับดูแลและนักลงทุน", comps: ["Annual Reports", "Board of Directors", "Governance"] },
];

// ── IR Audiences who the site speaks to (shapes tone, data density, IA) ──
export interface AudienceDef {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  shapes: string;        // how this audience shapes the design fed to the Blueprint
  prioritizes: string[]; // section ids this audience cares about most
}

export const IR_AUDIENCES: AudienceDef[] = [
  { id: "retail", label: "นักลงทุนรายย่อย", emoji: "👤", desc: "นักลงทุนบุคคลทั่วไป ผู้ถือหุ้นรายย่อย", shapes: "เน้นเข้าใจง่าย เล่าเรื่องชัด สรุปตัวเลขสำคัญแบบไม่ซับซ้อน", prioritizes: ["financial", "ir-calendar", "ir-info", "shareholder-info"] },
  { id: "institutional", label: "นักลงทุนสถาบัน", emoji: "🏛️", desc: "กองทุน สถาบันการเงิน ผู้ถือหุ้นรายใหญ่", shapes: "เน้นข้อมูลเชิงลึก ตัวเลขครบ ดาวน์โหลดเอกสารได้ครบถ้วน", prioritizes: ["financial", "reports", "shareholder-info", "ir-info"] },
  { id: "analyst", label: "นักวิเคราะห์", emoji: "📊", desc: "Sell-side / Buy-side analysts นักวิเคราะห์หลักทรัพย์", shapes: "เน้น Data density สูง ตาราง KPI Historical data และ Presentation", prioritizes: ["financial", "analyst", "reports", "ir-calendar", "ir-info"] },
  { id: "regulator", label: "ผู้กำกับดูแล", emoji: "⚖️", desc: "SET, ก.ล.ต. และหน่วยงานกำกับ", shapes: "เน้นความโปร่งใส ธรรมาภิบาล และการเปิดเผยตามข้อกำหนด", prioritizes: ["governance", "reports", "board", "financial"] },
  { id: "shareholder", label: "ผู้ถือหุ้นปัจจุบัน", emoji: "🤝", desc: "ผู้ถือหุ้นที่ลงทุนอยู่แล้ว", shapes: "เน้นข่าวสาร ปันผล การประชุมผู้ถือหุ้น และสิทธิประโยชน์", prioritizes: ["ir-calendar", "financial", "shareholder-info", "contact"] },
  { id: "potential", label: "นักลงทุนที่สนใจ", emoji: "🌱", desc: "ผู้ที่กำลังพิจารณาลงทุน", shapes: "เน้นสร้างความน่าเชื่อถือ วิสัยทัศน์ การเติบโต และโอกาส", prioritizes: ["about", "history", "financial", "chairman-message"] },
];

export function audienceById(id: string): AudienceDef | undefined {
  return IR_AUDIENCES.find((a) => a.id === id);
}

// ── Directions ──
export const DIRECTIONS: Direction[] = [
  {
    id: "premium-corporate", label: "Premium Corporate", badge: "A",
    tagline: "มั่นคง น่าเชื่อถือ ระดับสากล",
    desc: "กรอบองค์กรที่แข็งแกร่ง น่าเชื่อถือ เหมาะกับองค์กรขนาดใหญ่ที่ต้องการสื่อสารความเป็น Professional ระดับนานาชาติ",
    mood: ["Professional & Clean", "Luxury & Premium"],
    palette: "Deep Navy & Gold", colors: ["#0D1B4B", "#C8A855", "#FFFFFF"],
    layout: "Full-Width Elegant Grid",
    sections: ["header", "hero", "about", "history", "chairman-message", "board", "reports", "financial", "ir-info", "contact", "footer"],
    bestFor: ["Listed Company (SET)", "Finance & Banking", "Energy & Power"],
    bg: "linear-gradient(135deg,#0D1B4B,#1A2E6B)",
    tags: ["#Corporate", "#Premium", "#B2B"],
  },
  {
    id: "esg-focused", label: "ESG-focused", badge: "B",
    tagline: "ยั่งยืน รับผิดชอบ ใส่ใจสังคม",
    desc: "เน้นการสื่อสารความยั่งยืนและความรับผิดชอบต่อสังคม เหมาะกับองค์กรที่ให้ความสำคัญกับ ESG",
    mood: ["ESG & Sustainable", "Warm & Approachable"],
    palette: "Forest Green & Earth", colors: ["#1E3A1E", "#4A8C4A", "#F0F7EC"],
    layout: "Storytelling Journey",
    sections: ["header", "hero", "about", "history", "chairman-message", "ir-calendar", "cta", "contact", "footer"],
    bestFor: ["ESG & Sustainability", "Energy & Power", "Industrial & Manufacturing", "Government & Public Sector"],
    bg: "linear-gradient(135deg,#1E3A1E,#2D5A2D)",
    tags: ["#ESG", "#Storytelling", "#Modern"],
  },
  {
    id: "modern-tech", label: "Modern Tech", badge: "C",
    tagline: "ทันสมัย ดิจิทัล น่าเชื่อถือ",
    desc: "สำหรับองค์กรที่ต้องการสื่อสารความเป็น Digital & Innovation ผสานความทันสมัยกับ Technical Credibility",
    mood: ["Professional & Clean", "Creative & Innovative"],
    palette: "Royal Blue & Cyan", colors: ["#0D3080", "#00B4D8", "#F5F8FF"],
    layout: "Split Screen Dynamic",
    sections: ["header", "hero", "about", "financial", "ir-info", "reports", "contact", "footer"],
    bestFor: ["Technology & Digital", "Healthcare & Pharma", "Consumer & Retail"],
    bg: "linear-gradient(135deg,#0D3080,#1A5090)",
    tags: ["#Modern", "#TechForward", "#B2B"],
  },
  {
    id: "growth-oriented", label: "Growth-oriented", badge: "D",
    tagline: "เน้นตัวเลขและผลประกอบการที่ชัดเจน",
    desc: "เน้นการแสดงตัวเลข ผลการดำเนินงาน และ Growth Metrics ด้วย Visual Data Design ที่ชัดเจน",
    mood: ["Data-Driven", "Bold & Dynamic"],
    palette: "Deep Navy & Cream", colors: ["#03041C", "#FFEEAA", "#FFFFFF"],
    layout: "Data & Metrics Grid",
    sections: ["header", "hero", "financial", "reports", "ir-calendar", "ir-info", "shareholder-info", "contact", "footer"],
    bestFor: ["Listed Company (SET)", "Finance & Banking", "Technology & Digital"],
    bg: "linear-gradient(135deg,#03041C,#0D0D2A)",
    tags: ["#DataDriven", "#InvestorRelations", "#Corporate"],
  },
];

// ── Smart Discovery Quiz (UX #1) ──
// Questions, topics and A/B choices follow the design team's Explore spec (Drive:
// "Explore 5 ข้อ / รายละเอียด"); each choice is drawn by ExploreMock (flat UI illustration).
// `value` points each choice at its axis pole: +1 = corporate / dark / data-heavy / bold.
export const QUIZ: QuizQuestion[] = [
  {
    id: "q1", topic: "บุคลิกแบรนด์", question: "เว็บไซต์ควรให้ความรู้สึกเป็นแบบไหน?", axis: "toneCorporate",
    optionA: { label: "เข้าถึงง่าย", desc: "Approachable", value: -1, preview: "linear-gradient(135deg,#00B4D8,#7C3AED)", mock: "q1-a" },
    optionB: { label: "เป็นทางการ", desc: "Formal", value: 1, preview: "linear-gradient(135deg,#0D1B4B,#1A2E6B)", mock: "q1-b" },
  },
  {
    id: "q2", topic: "โทนภาพรวม", question: "ภาพรวมของเว็บไซต์ควรให้อารมณ์แบบไหน?", axis: "contrastDark",
    optionA: { label: "สว่าง", desc: "Light", value: -1, preview: "linear-gradient(135deg,#F5F8FF,#E4E6E9)", mock: "q2-a" },
    optionB: { label: "เข้ม", desc: "Dark", value: 1, preview: "linear-gradient(135deg,#03041C,#0D0D2A)", mock: "q2-b" },
  },
  {
    id: "q3", topic: "การเน้นเนื้อหา", question: "คุณอยากให้ผู้เข้าชม “รับข้อมูล” จากเว็บไซต์แบบไหน?", axis: "densityData",
    optionA: { label: "เล่าเรื่อง", desc: "Story-driven", value: -1, preview: "linear-gradient(135deg,#2D5A2D,#4A8C4A)", mock: "q3-a" },
    optionB: { label: "เน้นข้อมูล", desc: "Data-driven", value: 1, preview: "linear-gradient(135deg,#0D3080,#03041C)", mock: "q3-b" },
  },
  {
    id: "q4", topic: "ความหนาแน่นข้อมูล", question: "คุณอยากให้หนึ่งหน้ามีข้อมูลมากน้อยแค่ไหน?", axis: "densityData",
    optionA: { label: "โล่ง", desc: "Spacious", value: -1, preview: "linear-gradient(135deg,#FFFFFF,#E6E7EC)", mock: "q4-a" },
    optionB: { label: "ข้อมูลแน่น", desc: "Dense", value: 1, preview: "linear-gradient(135deg,#0D3080,#00B4D8)", mock: "q4-b" },
  },
  {
    id: "q5", topic: "การแสดงออกทางภาพ", question: "เว็บไซต์ควรแสดงตัวตนมากแค่ไหน?", axis: "energyBold",
    optionA: { label: "เรียบ / สุขุม", desc: "Subtle", value: -1, preview: "linear-gradient(135deg,#0D1B4B,#C8A855)", mock: "q5-a" },
    optionB: { label: "โดดเด่น / มีการเคลื่อนไหว", desc: "Expressive", value: 1, preview: "linear-gradient(135deg,#FFEEAA,#45460C)", mock: "q5-b" },
  },
];

export const APPROVAL_LEVELS: StakeholderRole[] = [
  "Project Owner",
  "Marketing",
  "IR Team",
  "Executive",
  "CEO",
];

// Representative person per approval role shows name / title / department on Status.
export const APPROVER_PROFILES: Record<StakeholderRole, { name: string; title: string; department: string }> = {
  "Project Owner": { name: "ปวิน ศรีสุข", title: "Project Owner", department: "Digital Project" },
  "Marketing": { name: "สมชาย ใจดี", title: "Marketing Manager", department: "Marketing" },
  "IR Team": { name: "วิภา สุขสันต์", title: "IR Manager", department: "Investor Relations" },
  "Department Manager": { name: "อรพรรณ วงศ์ทอง", title: "Department Manager", department: "Corporate Affairs" },
  "Executive": { name: "ธนา วัฒนกุล", title: "Executive Vice President", department: "Executive" },
  "CEO": { name: "ประเสริฐ มั่นคง", title: "Chief Executive Officer", department: "Executive" },
};

export function sectionById(id: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.id === id);
}
export function directionById(id: string): Direction | undefined {
  return DIRECTIONS.find((d) => d.id === id);
}
