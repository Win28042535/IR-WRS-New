// Personalized real content for High-Fidelity Preview (UX #12 + Branding & Realistic Preview).
// Realistic, industry-specific copy & data not generic Lorem ipsum so the mockup
// reads like the website the client will actually receive.

export interface NewsItem {
  date: string;
  tag: string;
  title: string;
}
export interface Exec {
  name: string;
  title: string;
}
export interface ProductItem {
  name: string;
  desc: string;
}
export interface StockInfo {
  symbol: string;
  price: string;
  change: string;   // e.g. "+1.25 (+2.8%)"
  up: boolean;
  marketCap: string;
}
export interface IndustryContent {
  heroTitle: string;
  heroSub: string;
  cta: string;
  about: string;
  businessDesc: string;
  stats: { value: string; label: string }[];
  products: ProductItem[];
  execs: Exec[];
  news: NewsItem[];
  stock: StockInfo;
  contact: { address: string; phone: string; email: string };
}

const MAP: Record<string, IndustryContent> = {
  "Energy & Power": {
    heroTitle: "ขับเคลื่อนอนาคตพลังงานที่ยั่งยืน",
    heroSub: "ผู้นำด้านการผลิตและจัดจำหน่ายพลังงานสะอาดของประเทศ",
    cta: "ดูผลการดำเนินงาน",
    about: "เรามุ่งมั่นพัฒนาโครงสร้างพื้นฐานด้านพลังงานเพื่อความมั่นคงของประเทศ ด้วยเทคโนโลยีสะอาดและการบริหารจัดการที่เป็นเลิศ",
    businessDesc: "ดำเนินธุรกิจผลิตไฟฟ้าจากพลังงานหมุนเวียนและก๊าซธรรมชาติ ครอบคลุมตั้งแต่ต้นน้ำถึงปลายน้ำ",
    stats: [{ value: "2,400 MW", label: "กำลังการผลิต" }, { value: "15 ปี", label: "ประสบการณ์" }, { value: "98%", label: "ความเสถียร" }],
    products: [
      { name: "โรงไฟฟ้าพลังงานแสงอาทิตย์", desc: "กำลังผลิตรวมกว่า 900 MW" },
      { name: "โรงไฟฟ้าพลังงานลม", desc: "ฟาร์มกังหันลมชายฝั่ง" },
      { name: "ระบบกักเก็บพลังงาน", desc: "Battery Energy Storage System" },
    ],
    execs: [{ name: "สมชาย วัฒนกุล", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "ปิยะ ธีรวัฒน์", title: "ประธานเจ้าหน้าที่การเงิน" }, { name: "อรพรรณ ศรีสุข", title: "รองกรรมการผู้จัดการ" }],
    news: [
      { date: "12 มิ.ย. 2026", tag: "โครงการ", title: "เปิดดำเนินการโรงไฟฟ้าพลังงานแสงอาทิตย์เฟส 3 กำลังผลิต 300 MW" },
      { date: "28 พ.ค. 2026", tag: "การเงิน", title: "ประกาศผลประกอบการไตรมาส 1/2569 กำไรเติบโต 18%" },
      { date: "15 พ.ค. 2026", tag: "ESG", title: "รับรางวัล Sustainability Excellence ระดับประเทศ" },
    ],
    stock: { symbol: "PWR", price: "42.50", change: "+1.25 (+3.0%)", up: true, marketCap: "฿85,000 ลบ." },
    contact: { address: "อาคารพลังงาน ถนนวิภาวดีรังสิต กรุงเทพฯ 10900", phone: "02-123-4567", email: "ir@energy.co.th" },
  },
  "Finance & Banking": {
    heroTitle: "บริหารความมั่งคั่งอย่างมั่นใจ",
    heroSub: "สถาบันการเงินที่ลูกค้าไว้วางใจมากว่า 30 ปี",
    cta: "เปิดบัญชีลงทุน",
    about: "บริการทางการเงินครบวงจรด้วยเทคโนโลยีและความเชี่ยวชาญ มุ่งสร้างความมั่นคงทางการเงินให้ลูกค้าทุกระดับ",
    businessDesc: "ให้บริการธนาคารพาณิชย์ บริหารสินทรัพย์ และวาณิชธนกิจ ครอบคลุมลูกค้าบุคคลและองค์กร",
    stats: [{ value: "฿1.2T", label: "สินทรัพย์รวม" }, { value: "5M+", label: "ลูกค้า" }, { value: "AAA", label: "Credit Rating" }],
    products: [
      { name: "Wealth Management", desc: "บริหารพอร์ตการลงทุนส่วนบุคคล" },
      { name: "Corporate Banking", desc: "สินเชื่อและบริการธุรกิจ" },
      { name: "Digital Banking", desc: "ธนาคารดิจิทัลครบวงจร" },
    ],
    execs: [{ name: "วิชัย รุ่งเรือง", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "นภาพร จันทร์เพ็ญ", title: "ประธานเจ้าหน้าที่การเงิน" }, { name: "ธนกร อภิชาติ", title: "ประธานเจ้าหน้าที่ปฏิบัติการ" }],
    news: [
      { date: "10 มิ.ย. 2026", tag: "ผลิตภัณฑ์", title: "เปิดตัวแพลตฟอร์มการลงทุนอัจฉริยะด้วย AI" },
      { date: "01 มิ.ย. 2026", tag: "การเงิน", title: "ประกาศจ่ายเงินปันผลระหว่างกาล ฿1.50 ต่อหุ้น" },
      { date: "20 พ.ค. 2026", tag: "รางวัล", title: "คว้ารางวัล Best Bank in Thailand 2026" },
    ],
    stock: { symbol: "BNK", price: "128.00", change: "+2.50 (+2.0%)", up: true, marketCap: "฿420,000 ลบ." },
    contact: { address: "อาคารสำนักงานใหญ่ ถนนสาทร กรุงเทพฯ 10120", phone: "02-200-1000", email: "investor@bank.co.th" },
  },
  "ESG & Sustainability": {
    heroTitle: "ธุรกิจที่เติบโตไปพร้อมกับโลก",
    heroSub: "มุ่งสู่ Net Zero ด้วยความรับผิดชอบต่อสังคมและสิ่งแวดล้อม",
    cta: "อ่านรายงานความยั่งยืน",
    about: "เราเชื่อว่าธุรกิจที่ดีต้องสร้างคุณค่าให้สังคมและสิ่งแวดล้อมควบคู่กัน ตามกรอบ ESG ระดับสากล",
    businessDesc: "ดำเนินธุรกิจบนหลักความยั่งยืน ลดผลกระทบสิ่งแวดล้อม และสร้างผลกระทบเชิงบวกต่อชุมชน",
    stats: [{ value: "-42%", label: "ลดคาร์บอน" }, { value: "100%", label: "พลังงานหมุนเวียน" }, { value: "50K", label: "ชีวิตที่เปลี่ยน" }],
    products: [
      { name: "Carbon Neutral Program", desc: "โครงการชดเชยคาร์บอน" },
      { name: "Community Development", desc: "พัฒนาชุมชนอย่างยั่งยืน" },
      { name: "Green Supply Chain", desc: "ห่วงโซ่อุปทานสีเขียว" },
    ],
    execs: [{ name: "ศิริพร เกียรติคุณ", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "ภาคภูมิ วงศ์ทอง", title: "ประธานเจ้าหน้าที่ความยั่งยืน" }, { name: "กมลชนก แสงทอง", title: "ผู้อำนวยการ ESG" }],
    news: [
      { date: "14 มิ.ย. 2026", tag: "ESG", title: "ได้รับการคัดเลือกเข้าดัชนีความยั่งยืน DJSI ต่อเนื่องปีที่ 5" },
      { date: "30 พ.ค. 2026", tag: "สิ่งแวดล้อม", title: "บรรลุเป้าหมายลดการปล่อยก๊าซเรือนกระจก 42%" },
      { date: "18 พ.ค. 2026", tag: "ชุมชน", title: "เปิดตัวโครงการพัฒนาชุมชน 25 พื้นที่ทั่วประเทศ" },
    ],
    stock: { symbol: "GRN", price: "36.75", change: "+0.50 (+1.4%)", up: true, marketCap: "฿62,000 ลบ." },
    contact: { address: "อาคารกรีนทาวเวอร์ ถนนพระราม 9 กรุงเทพฯ 10310", phone: "02-300-2000", email: "esg@green.co.th" },
  },
  "Listed Company (SET)": {
    heroTitle: "สร้างการเติบโตอย่างยั่งยืนให้ผู้ถือหุ้น",
    heroSub: "บริษัทจดทะเบียนในตลาดหลักทรัพย์ที่มุ่งสร้างมูลค่าระยะยาว",
    cta: "ข้อมูลนักลงทุน",
    about: "ด้วยธรรมาภิบาลที่โปร่งใสและกลยุทธ์การเติบโตที่ชัดเจน เรามุ่งสร้างผลตอบแทนที่ยั่งยืนแก่ผู้ถือหุ้น",
    businessDesc: "ประกอบธุรกิจหลากหลายภายใต้กลุ่มบริษัท สร้างการเติบโตอย่างมีคุณภาพและกระจายความเสี่ยง",
    stats: [{ value: "+18%", label: "Revenue YoY" }, { value: "฿4.50", label: "EPS" }, { value: "6.2%", label: "Dividend Yield" }],
    products: [
      { name: "ธุรกิจหลัก", desc: "Core Business ที่สร้างรายได้หลัก" },
      { name: "ธุรกิจใหม่", desc: "New S-Curve เพื่อการเติบโต" },
      { name: "การลงทุนเชิงกลยุทธ์", desc: "Strategic Investment Portfolio" },
    ],
    execs: [{ name: "ประเสริฐ มั่นคง", title: "ประธานกรรมการ" }, { name: "สุรชัย พัฒนา", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "วันดี ศรีวิไล", title: "ประธานเจ้าหน้าที่การเงิน" }],
    news: [
      { date: "13 มิ.ย. 2026", tag: "SET", title: "แจ้งมติคณะกรรมการอนุมัติงบการเงินไตรมาส 1/2569" },
      { date: "05 มิ.ย. 2026", tag: "นักลงทุน", title: "จัดประชุมนักวิเคราะห์ Opportunity Day ประจำไตรมาส" },
      { date: "22 พ.ค. 2026", tag: "การเงิน", title: "ประกาศจ่ายเงินปันผล ฿2.20 ต่อหุ้น XD 6 มิ.ย." },
    ],
    stock: { symbol: "SET", price: "58.25", change: "-0.75 (-1.3%)", up: false, marketCap: "฿175,000 ลบ." },
    contact: { address: "อาคารตลาดทุน ถนนรัชดาภิเษก กรุงเทพฯ 10400", phone: "02-009-9000", email: "ir@listed.co.th" },
  },
  "Technology & Digital": {
    heroTitle: "เทคโนโลยีที่เปลี่ยนวิธีการทำธุรกิจ",
    heroSub: "Digital Solutions สำหรับองค์กรยุคใหม่",
    cta: "เริ่มต้นใช้งาน",
    about: "เราสร้างแพลตฟอร์มที่ช่วยให้องค์กรทำงานได้เร็วและฉลาดขึ้น ด้วยทีมวิศวกรระดับโลก",
    businessDesc: "พัฒนาซอฟต์แวร์และแพลตฟอร์มคลาวด์สำหรับองค์กร ครอบคลุม SaaS, AI และ Data Analytics",
    stats: [{ value: "99.9%", label: "Uptime" }, { value: "10M+", label: "Users" }, { value: "120+", label: "Enterprise" }],
    products: [
      { name: "Cloud Platform", desc: "โครงสร้างพื้นฐานคลาวด์" },
      { name: "AI Suite", desc: "เครื่องมือ AI สำหรับธุรกิจ" },
      { name: "Data Analytics", desc: "วิเคราะห์ข้อมูลแบบเรียลไทม์" },
    ],
    execs: [{ name: "กิตติ เทคโน", title: "Chief Executive Officer" }, { name: "พิมพ์ชนก ดิจิทัล", title: "Chief Technology Officer" }, { name: "ณัฐพล โค้ด", title: "Chief Product Officer" }],
    news: [
      { date: "11 มิ.ย. 2026", tag: "ผลิตภัณฑ์", title: "เปิดตัว AI Copilot รุ่นใหม่ รองรับภาษาไทยเต็มรูปแบบ" },
      { date: "02 มิ.ย. 2026", tag: "ธุรกิจ", title: "ขยายศูนย์ข้อมูลแห่งใหม่รองรับการเติบโต 3 เท่า" },
      { date: "19 พ.ค. 2026", tag: "รางวัล", title: "ติดอันดับ Best Place to Work in Tech 2026" },
    ],
    stock: { symbol: "TECH", price: "215.00", change: "+8.00 (+3.9%)", up: true, marketCap: "฿310,000 ลบ." },
    contact: { address: "อาคารดิจิทัลฮับ ถนนสุขุมวิท กรุงเทพฯ 10110", phone: "02-555-8888", email: "ir@tech.co.th" },
  },
  "Healthcare & Pharma": {
    heroTitle: "ดูแลสุขภาพด้วยนวัตกรรมที่เชื่อถือได้",
    heroSub: "ยกระดับคุณภาพชีวิตด้วยการวิจัยและพัฒนา",
    cta: "บริการของเรา",
    about: "มุ่งมั่นพัฒนาผลิตภัณฑ์ทางการแพทย์ที่ปลอดภัยและมีประสิทธิภาพ ภายใต้มาตรฐานสากล",
    businessDesc: "วิจัย ผลิต และจัดจำหน่ายเวชภัณฑ์และอุปกรณ์การแพทย์ ครอบคลุมโรงพยาบาลและร้านขายยา",
    stats: [{ value: "200+", label: "ผลิตภัณฑ์" }, { value: "30 ปี", label: "R&D" }, { value: "GMP", label: "Certified" }],
    products: [
      { name: "เวชภัณฑ์", desc: "ยาคุณภาพมาตรฐานสากล" },
      { name: "อุปกรณ์การแพทย์", desc: "เครื่องมือแพทย์ทันสมัย" },
      { name: "บริการสุขภาพ", desc: "Health Solutions ครบวงจร" },
    ],
    execs: [{ name: "นพ. ธีระ สุขเวช", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "ภญ. อรอนงค์ ยาดี", title: "ผู้อำนวยการฝ่ายวิจัย" }, { name: "สมหญิง การเงิน", title: "ประธานเจ้าหน้าที่การเงิน" }],
    news: [
      { date: "09 มิ.ย. 2026", tag: "วิจัย", title: "ได้รับการรับรองยาสามัญใหม่ 3 รายการจาก อย." },
      { date: "29 พ.ค. 2026", tag: "ธุรกิจ", title: "ขยายกำลังการผลิตโรงงานมาตรฐาน PIC/S GMP" },
      { date: "16 พ.ค. 2026", tag: "การเงิน", title: "รายงานผลประกอบการรายได้เติบโต 12% YoY" },
    ],
    stock: { symbol: "MED", price: "74.50", change: "+1.00 (+1.4%)", up: true, marketCap: "฿98,000 ลบ." },
    contact: { address: "อาคารเฮลท์แคร์ ถนนพหลโยธิน กรุงเทพฯ 10400", phone: "02-444-3333", email: "ir@health.co.th" },
  },
};

const DEFAULT: IndustryContent = {
  heroTitle: "สร้างความน่าเชื่อถือให้องค์กรของคุณ",
  heroSub: "เว็บไซต์องค์กรที่สื่อสารตัวตนได้อย่างมืออาชีพ",
  cta: "ติดต่อเรา",
  about: "เรามุ่งมั่นส่งมอบคุณค่าที่ดีที่สุดให้กับลูกค้าและพันธมิตร ด้วยประสบการณ์และความเชี่ยวชาญ",
  businessDesc: "ดำเนินธุรกิจด้วยความเป็นมืออาชีพ มุ่งสร้างคุณค่าที่ยั่งยืนแก่ผู้มีส่วนได้เสียทุกฝ่าย",
  stats: [{ value: "20+", label: "ปีประสบการณ์" }, { value: "500+", label: "โครงการ" }, { value: "98%", label: "ความพึงพอใจ" }],
  products: [
    { name: "บริการหลัก", desc: "โซลูชันสำหรับองค์กร" },
    { name: "บริการที่ปรึกษา", desc: "ให้คำปรึกษาโดยผู้เชี่ยวชาญ" },
    { name: "บริการสนับสนุน", desc: "ดูแลลูกค้าตลอด 24 ชั่วโมง" },
  ],
  execs: [{ name: "ผู้บริหาร 1", title: "ประธานเจ้าหน้าที่บริหาร" }, { name: "ผู้บริหาร 2", title: "ประธานเจ้าหน้าที่การเงิน" }, { name: "ผู้บริหาร 3", title: "ประธานเจ้าหน้าที่ปฏิบัติการ" }],
  news: [
    { date: "12 มิ.ย. 2026", tag: "ข่าวสาร", title: "บริษัทประกาศแผนกลยุทธ์การเติบโตประจำปี 2569" },
    { date: "01 มิ.ย. 2026", tag: "กิจกรรม", title: "ร่วมงานแสดงสินค้าและนวัตกรรมระดับประเทศ" },
    { date: "20 พ.ค. 2026", tag: "รางวัล", title: "รับรางวัลองค์กรดีเด่นด้านการบริหารจัดการ" },
  ],
  stock: { symbol: "CORP", price: "25.00", change: "+0.25 (+1.0%)", up: true, marketCap: "฿40,000 ลบ." },
  contact: { address: "สำนักงานใหญ่ กรุงเทพมหานคร", phone: "02-000-0000", email: "contact@company.co.th" },
};

export function contentFor(industry: string): IndustryContent {
  return MAP[industry] || DEFAULT;
}
