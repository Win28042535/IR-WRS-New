/**
 * แบบประเมินลูกค้า IR Plus WRS
 * สร้าง Google Form 2 ตอน + Google Sheet ที่คำนวณ KPI และเกรดให้อัตโนมัติ
 *
 * วิธีใช้ (ทำครั้งเดียว):
 *   1. เปิด https://script.google.com แล้วกด "โปรเจ็กต์ใหม่"
 *   2. ลบโค้ดเดิม วางไฟล์นี้ทั้งไฟล์ แล้วกดบันทึก
 *   3. เลือกฟังก์ชัน setup ด้านบน แล้วกด "เรียกใช้" (Run) และกดอนุญาตสิทธิ์
 *   4. เปิดโฟลเดอร์ "IR Plus WRS · แบบประเมินลูกค้า" ใน Google Drive
 *
 * ตัวเลขทุกตัว (เป้าหมาย น้ำหนัก เกณฑ์เกรด) ตรงกับเอกสาร
 * "แนวทางประเมินผลและ KPI จากลูกค้า IR Plus WRS"
 */

const CFG = {
  folderName: 'IR Plus WRS · แบบประเมินลูกค้า',
  sheetTitle: 'KPI แบบประเมินลูกค้า IR Plus WRS',
  part1Sheet: 'คำตอบตอน1',
  part2Sheet: 'คำตอบตอน2',
  companySheet: 'รายบริษัท',
  kpiSheet: 'KPI',
  linkSheet: 'ส่งลิงก์',
  feedbackSheet: 'ข้อเสนอแนะ',
  rows: 200, // จำนวนบริษัทสูงสุดที่ชีตรายบริษัทรองรับ
  linkRows: 100,
  placeholder: '__COMPANY__',
  stages: ['ข้อมูลบริษัท', 'ผู้อ่านหลัก', 'โครงสร้างหลัก', 'โครงหน้าแรก',
    'สีและฟอนต์', 'แนวทางดีไซน์', 'สรุป', 'ไม่ติดเลย'],
  minCompanies: 5,
  navy: '#1F3A5F',
  input: '#FFF4CC',
  soft: '#EEF3F8',
};

// อ้างอิงช่วงวันที่ที่ใช้คำนวณ (อยู่ในชีต KPI)
const START = 'KPI!$B$4';
const END = 'KPI!$B$5';

function setup() {
  const folder = DriveApp.createFolder(CFG.folderName);

  const p1 = buildPart1();
  const p2 = buildPart2();

  const ss = SpreadsheetApp.create(CFG.sheetTitle);
  const ssId = ss.getId();
  ss.getSheets()[0].setName(CFG.kpiSheet);

  // ผูกฟอร์มเข้ากับชีตทีละตัว แล้วเปลี่ยนชื่อชีตคำตอบที่เพิ่งเกิด
  p1.form.setDestination(FormApp.DestinationType.SPREADSHEET, ssId);
  nameNewResponseSheet(ssId, CFG.part1Sheet);
  p2.form.setDestination(FormApp.DestinationType.SPREADSHEET, ssId);
  nameNewResponseSheet(ssId, CFG.part2Sheet);

  const book = SpreadsheetApp.openById(ssId);
  const url1 = prefilledUrl(p1.form, p1.company);
  const url2 = prefilledUrl(p2.form, p2.company);

  buildCompanySheet(book);
  buildKpiSheet(book);
  buildFeedbackSheet(book);
  buildLinkSheet(book, p1.form, p2.form, url1, url2);
  arrangeSheets(book);

  [ssId, p1.form.getId(), p2.form.getId()].forEach(id => DriveApp.getFileById(id).moveTo(folder));

  Logger.log('โฟลเดอร์: ' + folder.getUrl());
  Logger.log('ชีต KPI: ' + book.getUrl());
  Logger.log('ฟอร์มตอนที่ 1 (ส่งลูกค้า): ' + p1.form.getPublishedUrl());
  Logger.log('ฟอร์มตอนที่ 2 (ส่งลูกค้า): ' + p2.form.getPublishedUrl());
}

/* ---------------- ฟอร์ม ---------------- */

function baseForm(title, description) {
  const f = FormApp.create(title);
  f.setDescription(description);
  f.setConfirmationMessage('ขอบคุณที่สละเวลาตอบแบบประเมิน คำตอบทั้งหมดใช้ภายในทีม IR Plus เท่านั้น');
  f.setShowLinkToRespondAgain(false);
  f.setAllowResponseEdits(false);
  f.setCollectEmail(false);
  return f;
}

function scale(f, title, lo, hi, loLabel, hiLabel, required, help) {
  const item = f.addScaleItem().setTitle(title).setBounds(lo, hi)
    .setLabels(loLabel, hiLabel).setRequired(required);
  if (help) item.setHelpText(help);
  return item;
}

function buildPart1() {
  const f = baseForm('แบบประเมินลูกค้า IR Plus · ตอนที่ 1',
    'ขอบคุณที่ใช้ระบบวางแผนเว็บไซต์กับ IR Plus\n' +
    'คำตอบของคุณช่วยให้ทีมปรับปรุงระบบและงานออกแบบให้ดีขึ้น ใช้เวลาไม่เกิน 1 นาที');

  f.addSectionHeaderItem().setTitle('ข้อมูลผู้ตอบ');
  const company = f.addTextItem().setTitle('บริษัท').setRequired(true);
  f.addTextItem().setTitle('ชื่อผู้ตอบ');
  f.addTextItem().setTitle('ตำแหน่ง');

  f.addSectionHeaderItem().setTitle('การใช้งานระบบ');
  scale(f, '1.1 โดยรวมคุณพอใจกับการใช้ระบบนี้แค่ไหน', 1, 5, 'ไม่พอใจมาก', 'พอใจมาก', true);
  scale(f, '1.2 การกำหนดความต้องการเว็บไซต์ครั้งนี้ทำได้ง่าย', 1, 7, 'ไม่เห็นด้วยอย่างยิ่ง', 'เห็นด้วยอย่างยิ่ง', true);
  scale(f, '1.3 ฉันมั่นใจว่าสิ่งที่เลือกสะท้อนตัวตนบริษัท', 1, 7, 'ไม่เห็นด้วยอย่างยิ่ง', 'เห็นด้วยอย่างยิ่ง', true);
  scale(f, '1.4 คำแนะนำในระบบช่วยให้ตัดสินใจได้ดีขึ้นไหม', 1, 5, 'ไม่ช่วยเลย', 'ช่วยมาก', false,
    'ถ้าไม่ได้ใช้คำแนะนำในระบบ ข้ามข้อนี้ได้');
  f.addMultipleChoiceItem().setTitle('1.5 ขั้นตอนไหนที่คุณลังเลหรือติดที่สุด')
    .setChoiceValues(CFG.stages).setRequired(true);
  f.addParagraphTextItem().setTitle('1.6 อยากบอกอะไรเพิ่มเติม (ไม่บังคับ)');

  return { form: f, company: company };
}

function buildPart2() {
  const f = baseForm('แบบประเมินลูกค้า IR Plus · ตอนที่ 2',
    'ตอนนี้ถามหลังคุณได้เห็นดีไซน์รอบแรก ใช้เวลาไม่เกิน 1 นาที');

  f.addSectionHeaderItem().setTitle('ข้อมูลผู้ตอบ');
  const company = f.addTextItem().setTitle('บริษัท').setRequired(true);
  f.addTextItem().setTitle('ชื่อผู้ตอบ');

  f.addSectionHeaderItem().setTitle('ผลงานที่ได้รับ');
  scale(f, '2.1 ดีไซน์ที่ได้ตรงกับสิ่งที่เลือกไว้ในระบบแค่ไหน', 1, 5, 'ไม่ตรงเลย', 'ตรงมาก', true);
  f.addMultipleChoiceItem().setTitle('2.2 คุณต้องอธิบายความต้องการซ้ำกับทีมไหม')
    .setChoiceValues(['ไม่ต้องเลย', 'นิดหน่อย', 'เยอะ']).setRequired(true);
  scale(f, '2.3 คุณจะแนะนำ IR Plus ให้บริษัทอื่นมากแค่ไหน', 0, 10, 'ไม่แนะนำเลย', 'แนะนำแน่นอน', true);
  f.addParagraphTextItem().setTitle('2.4 สิ่งที่อยากให้ปรับปรุง (ไม่บังคับ)');

  return { form: f, company: company };
}

// ลิงก์ที่กรอกชื่อบริษัทไว้ให้แล้ว ชื่อจะตรงกันทั้งสองตอนและนับเป็นบริษัทเดียวกัน
function prefilledUrl(form, companyItem) {
  return form.createResponse()
    .withItemResponse(companyItem.createResponse(CFG.placeholder))
    .toPrefilledUrl();
}

function nameNewResponseSheet(ssId, name) {
  SpreadsheetApp.flush();
  const known = [CFG.part1Sheet, CFG.part2Sheet];
  for (let i = 0; i < 10; i++) {
    const sheet = SpreadsheetApp.openById(ssId).getSheets()
      .find(s => s.getFormUrl() && known.indexOf(s.getName()) === -1);
    if (sheet) {
      sheet.setName(name).setFrozenRows(1);
      return;
    }
    Utilities.sleep(1000);
  }
  throw new Error('ไม่พบชีตคำตอบสำหรับ ' + name);
}

/* ---------------- ชีตรายบริษัท ---------------- */

// คอลัมน์ในชีตคำตอบ
// ตอน 1: A เวลา, B บริษัท, C ชื่อ, D ตำแหน่ง, E 1.1, F 1.2, G 1.3, H 1.4, I 1.5, J 1.6
// ตอน 2: A เวลา, B บริษัท, C ชื่อ, D 2.1, E 2.2, F 2.3, G 2.4
// อ้างทั้งคอลัมน์ เพราะ Google Forms แทรกแถวใหม่ทุกครั้งที่มีคำตอบ ช่วงแบบ $B$2:$B จะถูกเลื่อนจนข้อมูลหลุด
// แถวหัวตารางไม่ถูกนับ เพราะทุกสูตรกรองด้วยช่วงวันที่ และหัวตารางไม่ใช่วันที่
function col(sheet, letter) {
  return "'" + sheet + "'!$" + letter + ':$' + letter;
}

function inRange(sheet) {
  const t = col(sheet, 'A');
  return t + ',">="&' + START + ',' + t + ',"<"&(' + END + '+1)';
}

function buildCompanySheet(book) {
  const sh = book.insertSheet(CFG.companySheet);
  const p1 = CFG.part1Sheet, p2 = CFG.part2Sheet;
  sh.getRange(1, 1, 1, 10).setValues([[
    'บริษัท', 'ผู้ตอบตอน 1', '1.1 CSAT (สัดส่วน 4–5)', '1.2 CES (เฉลี่ย)', '1.3 ความมั่นใจ (เฉลี่ย)',
    '1.4 คำแนะนำ (เฉลี่ย)', 'ผู้ตอบตอน 2', '2.1 ดีไซน์ตรง (เฉลี่ย)', '2.2 ไม่ต้องอธิบายซ้ำ (0–100)', '2.3 NPS',
  ]]);

  const names = '{' + col(p1, 'B') + ';' + col(p2, 'B') + '}';
  const times = '{' + col(p1, 'A') + ';' + col(p2, 'A') + '}';
  sh.getRange('A2').setFormula('=IFERROR(SORT(UNIQUE(FILTER(' + names + ',' + names + '<>"",' +
    times + '>=' + START + ',' + times + '<(' + END + '+1)))),"")');

  const rows = [];
  for (let r = 2; r <= CFG.rows + 1; r++) {
    const a = '$A' + r;
    const c1 = col(p1, 'B') + ',' + a + ',' + inRange(p1);
    const c2 = col(p2, 'B') + ',' + a + ',' + inRange(p2);
    const blank1 = 'OR(' + a + '="",$B' + r + '=0)';
    const blank2 = 'OR(' + a + '="",$G' + r + '=0)';
    rows.push([
      '=IF(' + a + '="","",COUNTIFS(' + c1 + '))',
      '=IF(' + blank1 + ',"",IFERROR(COUNTIFS(' + c1 + ',' + col(p1, 'E') + ',">=4")/COUNTIFS(' + c1 + ',' + col(p1, 'E') + ',"<>"),""))',
      '=IF(' + blank1 + ',"",IFERROR(AVERAGEIFS(' + col(p1, 'F') + ',' + c1 + '),""))',
      '=IF(' + blank1 + ',"",IFERROR(AVERAGEIFS(' + col(p1, 'G') + ',' + c1 + '),""))',
      '=IF(' + blank1 + ',"",IFERROR(AVERAGEIFS(' + col(p1, 'H') + ',' + c1 + '),""))',
      '=IF(' + a + '="","",COUNTIFS(' + c2 + '))',
      '=IF(' + blank2 + ',"",IFERROR(AVERAGEIFS(' + col(p2, 'D') + ',' + c2 + '),""))',
      '=IF(' + blank2 + ',"",IFERROR((COUNTIFS(' + c2 + ',' + col(p2, 'E') + ',"ไม่ต้องเลย")*100+COUNTIFS(' + c2 + ',' +
        col(p2, 'E') + ',"นิดหน่อย")*50)/COUNTIFS(' + c2 + ',' + col(p2, 'E') + ',"<>"),""))',
      '=IF(' + blank2 + ',"",IFERROR((COUNTIFS(' + c2 + ',' + col(p2, 'F') + ',">=9")-COUNTIFS(' + c2 + ',' +
        col(p2, 'F') + ',"<=6"))/COUNTIFS(' + c2 + ',' + col(p2, 'F') + ',"<>")*100,""))',
    ]);
  }
  sh.getRange(2, 2, CFG.rows, 9).setFormulas(rows);

  const last = CFG.rows + 1;
  sh.getRange('C2:C' + last).setNumberFormat('0%');
  sh.getRange('D2:F' + last).setNumberFormat('0.00');
  sh.getRange('H2:H' + last).setNumberFormat('0.00');
  sh.getRange('I2:I' + last).setNumberFormat('0');
  sh.getRange('J2:J' + last).setNumberFormat('+0;-0;0');
  styleHeader(sh.getRange(1, 1, 1, 10));
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 220);
  sh.setColumnWidths(2, 9, 150);
}

/* ---------------- ชีต KPI ---------------- */

function buildKpiSheet(book) {
  const sh = book.getSheetByName(CFG.kpiSheet);
  const co = "'" + CFG.companySheet + "'!";
  const last = CFG.rows + 1;

  sh.getRange('A1').setValue('KPI จากแบบประเมินลูกค้า IR Plus WRS').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('คำนวณจากคำตอบลูกค้าเท่านั้น · เฉลี่ยรายบริษัทก่อน แล้วเฉลี่ยรวม · แก้ได้เฉพาะช่องสีเหลือง')
    .setFontColor('#5F6B7A');

  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0);
  sh.getRange('A4:B7').setValues([
    ['วันเริ่ม', qStart],
    ['วันสิ้นสุด', qEnd],
    ['บริษัทที่ตอบตอนที่ 1', ''],
    ['บริษัทที่ตอบตอนที่ 2', ''],
  ]);
  sh.getRange('B4:B5').setNumberFormat('d mmm yyyy').setBackground(CFG.input);
  sh.getRange('B6').setFormula('=COUNTIF(' + co + 'B2:B' + last + ',">0")');
  sh.getRange('B7').setFormula('=COUNTIF(' + co + 'G2:G' + last + ',">0")');
  sh.getRange('A4:A7').setFontWeight('bold');

  sh.getRange('A9:J9').setValues([[
    'ข้อ', 'ตัวชี้วัด', 'ค่าที่ได้', 'เป้าหมาย', 'คะแนน (0–100)', 'น้ำหนัก',
    'คะแนน × น้ำหนัก', 'น้ำหนักที่ใช้', 'ทีมออกแบบ', 'ทีมพัฒนา',
  ]]);
  styleHeader(sh.getRange('A9:J9'));

  const metrics = [
    ['1.1', 'ความพอใจ (CSAT สัดส่วนที่ตอบ 4–5)', 'C', 0.8, 0.15, 1, 1],
    ['1.2', 'ความง่าย (CES เฉลี่ยจาก 7)', 'D', 5.5, 0.15, 1, 1],
    ['1.3', 'ความมั่นใจในสิ่งที่เลือก (เฉลี่ยจาก 7)', 'E', 5.5, 0.15, 1, 0],
    ['1.4', 'คำแนะนำในระบบ (เฉลี่ยจาก 5)', 'F', 4, 0.05, 0, 1],
    ['2.1', 'ดีไซน์ตรงกับที่เลือก (เฉลี่ยจาก 5)', 'H', 4, 0.20, 1, 0],
    ['2.2', 'ไม่ต้องอธิบายซ้ำ (0–100)', 'I', 70, 0.15, 1, 1],
    ['2.3', 'การแนะนำต่อ (NPS)', 'J', 30, 0.15, 1, 1],
  ];
  metrics.forEach((m, i) => {
    const r = 10 + i;
    sh.getRange(r, 1, 1, 2).setValues([[m[0], m[1]]]);
    sh.getRange(r, 3).setFormula('=IFERROR(AVERAGE(' + co + m[2] + '2:' + m[2] + last + '),"")');
    sh.getRange(r, 4).setValue(m[3]);
    sh.getRange(r, 5).setFormula('=IF(C' + r + '="","",MAX(0,MIN(100,C' + r + '/D' + r + '*100)))');
    sh.getRange(r, 6).setValue(m[4]);
    sh.getRange(r, 7).setFormula('=IF(E' + r + '="",0,E' + r + '*F' + r + ')');
    sh.getRange(r, 8).setFormula('=IF(E' + r + '="",0,F' + r + ')');
    sh.getRange(r, 9, 1, 2).setValues([[m[5], m[6]]]);
  });
  sh.getRange('A17:B17').setValues([['', 'รวมน้ำหนัก']]);
  sh.getRange('F17').setFormula('=SUM(F10:F16)');
  sh.getRange('A17:J17').setFontWeight('bold').setBackground(CFG.soft);

  sh.getRange('C10:D10').setNumberFormat('0%');
  sh.getRange('C11:D14').setNumberFormat('0.00');
  sh.getRange('C15:D15').setNumberFormat('0');
  sh.getRange('C16:D16').setNumberFormat('+0;-0;0');
  sh.getRange('E10:E16').setNumberFormat('0.0');
  sh.getRange('F10:F17').setNumberFormat('0%');
  sh.getRange('G10:H16').setNumberFormat('0.00');
  sh.getRange('D10:D16').setBackground(CFG.input);
  sh.getRange('F10:F16').setBackground(CFG.input);
  sh.getRange('I10:J16').setBackground(CFG.input).setHorizontalAlignment('center');
  sh.getRange('A10:A16').setHorizontalAlignment('center');

  // ผลรวม: ถ้าข้อไหนยังไม่มีคำตอบ น้ำหนักที่เหลือจะถูกปรับให้รวมเป็น 100% เอง
  sh.getRange('A19:C19').setValues([['ผลลัพธ์', 'คะแนน', 'เกรด']]);
  styleHeader(sh.getRange('A19:C19'));
  sh.getRange('A20:A22').setValues([['KPI รวม'], ['ทีมออกแบบ'], ['ทีมพัฒนา']]).setFontWeight('bold');
  sh.getRange('B20').setFormula('=IF(SUM(H10:H16)=0,"",SUM(G10:G16)/SUM(H10:H16))');
  sh.getRange('B21').setFormula('=IF(SUMPRODUCT(H10:H16,I10:I16)=0,"",SUMPRODUCT(G10:G16,I10:I16)/SUMPRODUCT(H10:H16,I10:I16))');
  sh.getRange('B22').setFormula('=IF(SUMPRODUCT(H10:H16,J10:J16)=0,"",SUMPRODUCT(G10:G16,J10:J16)/SUMPRODUCT(H10:H16,J10:J16))');
  ['B20', 'B21', 'B22'].forEach(cell => {
    sh.getRange('C' + cell.slice(1)).setFormula(gradeFormula(cell));
  });
  sh.getRange('B20:B22').setNumberFormat('0.00');
  sh.getRange('B20:C20').setFontSize(14).setFontWeight('bold');
  sh.getRange('C20:C22').setHorizontalAlignment('center').setFontWeight('bold');

  sh.getRange('A24:C24').setValues([['คะแนน', 'เกรด', 'ความหมาย']]);
  styleHeader(sh.getRange('A24:C24'));
  sh.getRange('A25:C28').setValues([
    ['85 ขึ้นไป', 'A', 'ลูกค้าได้ผลตามเป้า'],
    ['70–84', 'B', 'ดี มีจุดต้องปรับ'],
    ['55–69', 'C', 'ต่ำกว่าเป้า ต้องมีแผนแก้'],
    ['ต่ำกว่า 55', 'D', 'ต้องทบทวนการออกแบบและระบบใหม่'],
  ]);
  sh.getRange('B25:B28').setHorizontalAlignment('center');
  sh.getRange('A30').setValue('ให้เกรดเมื่อมีบริษัทตอบตอนที่ 1 อย่างน้อย ' + CFG.minCompanies +
    ' บริษัท · ช่องสีเหลืองคอลัมน์ I–J: 1 = นับในเกรดของทีมนั้น').setFontColor('#5F6B7A');

  const grades = sh.getRange('C20:C22');
  const rules = [['A', '#D9EAD3'], ['B', '#DDEBF7'], ['C', '#FFF2CC'], ['D', '#F4CCCC']].map(g =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(g[0]).setBackground(g[1]).setRanges([grades]).build());
  sh.setConditionalFormatRules(rules);

  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 280);
  sh.setColumnWidths(3, 8, 110);
  sh.setFrozenRows(0);
}

function gradeFormula(cell) {
  return '=IF(' + cell + '="","",IF($B$6<' + CFG.minCompanies + ',"ยังไม่ให้เกรด (ตอบไม่ถึง ' + CFG.minCompanies +
    ' บริษัท)",IFS(' + cell + '>=85,"A",' + cell + '>=70,"B",' + cell + '>=55,"C",TRUE,"D")))';
}

/* ---------------- ชีตข้อเสนอแนะ (ไม่คิดคะแนน) ---------------- */

function buildFeedbackSheet(book) {
  const sh = book.insertSheet(CFG.feedbackSheet);
  const p1 = CFG.part1Sheet, p2 = CFG.part2Sheet;

  sh.getRange('A1:B1').setValues([['ขั้นตอนที่ลูกค้าติด (ข้อ 1.5)', 'จำนวนคำตอบ']]);
  CFG.stages.forEach((s, i) => {
    const r = 2 + i;
    sh.getRange(r, 1).setValue(s);
    sh.getRange(r, 2).setFormula('=COUNTIFS(' + col(p1, 'I') + ',$A' + r + ',' + inRange(p1) + ')');
  });

  sh.getRange('D1:E1').setValues([['บริษัท', 'ความเห็นเพิ่มเติม (ข้อ 1.6)']]);
  sh.getRange('D2').setFormula('=IFERROR(FILTER({' + col(p1, 'B') + ',' + col(p1, 'J') + '},' + col(p1, 'J') + '<>"",' +
    col(p1, 'A') + '>=' + START + ',' + col(p1, 'A') + '<(' + END + '+1)),"ยังไม่มีความเห็น")');

  sh.getRange('G1:H1').setValues([['บริษัท', 'สิ่งที่อยากให้ปรับปรุง (ข้อ 2.4)']]);
  sh.getRange('G2').setFormula('=IFERROR(FILTER({' + col(p2, 'B') + ',' + col(p2, 'G') + '},' + col(p2, 'G') + '<>"",' +
    col(p2, 'A') + '>=' + START + ',' + col(p2, 'A') + '<(' + END + '+1)),"ยังไม่มีความเห็น")');

  [sh.getRange('A1:B1'), sh.getRange('D1:E1'), sh.getRange('G1:H1')].forEach(styleHeader);
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(4, 180);
  sh.setColumnWidth(5, 360);
  sh.setColumnWidth(7, 180);
  sh.setColumnWidth(8, 360);
  sh.getRange('E:E').setWrap(true);
  sh.getRange('H:H').setWrap(true);
}

/* ---------------- ชีตส่งลิงก์ ---------------- */

function buildLinkSheet(book, form1, form2, url1, url2) {
  const sh = book.insertSheet(CFG.linkSheet);
  sh.getRange('A1').setValue('พิมพ์ชื่อบริษัทในคอลัมน์ A แล้วคัดลอกลิงก์ไปส่งลูกค้า ชื่อบริษัทจะกรอกไว้ให้ในฟอร์ม')
    .setFontColor('#5F6B7A');
  sh.getRange('A3:C3').setValues([['บริษัท', 'ลิงก์ตอนที่ 1 (ส่งหลังกดส่งความต้องการ)', 'ลิงก์ตอนที่ 2 (ส่ง 2–3 วันทำการหลังเห็นดีไซน์รอบแรก)']]);
  styleHeader(sh.getRange('A3:C3'));

  const rows = [];
  for (let r = 4; r < 4 + CFG.linkRows; r++) {
    rows.push([
      '=IF($A' + r + '="","",SUBSTITUTE("' + url1 + '","' + CFG.placeholder + '",ENCODEURL(TRIM($A' + r + '))))',
      '=IF($A' + r + '="","",SUBSTITUTE("' + url2 + '","' + CFG.placeholder + '",ENCODEURL(TRIM($A' + r + '))))',
    ]);
  }
  sh.getRange(4, 2, CFG.linkRows, 2).setFormulas(rows);
  sh.getRange(4, 1, CFG.linkRows, 1).setBackground(CFG.input);

  sh.getRange('E3:F3').setValues([['ไฟล์', 'ลิงก์']]);
  styleHeader(sh.getRange('E3:F3'));
  sh.getRange('E4:F7').setValues([
    ['ฟอร์มตอนที่ 1 (สำหรับลูกค้า)', form1.getPublishedUrl()],
    ['ฟอร์มตอนที่ 1 (แก้ไขคำถาม/ธีม)', form1.getEditUrl()],
    ['ฟอร์มตอนที่ 2 (สำหรับลูกค้า)', form2.getPublishedUrl()],
    ['ฟอร์มตอนที่ 2 (แก้ไขคำถาม/ธีม)', form2.getEditUrl()],
  ]);

  sh.setFrozenRows(3);
  sh.setColumnWidth(1, 220);
  sh.setColumnWidths(2, 2, 320);
  sh.setColumnWidth(5, 220);
  sh.setColumnWidth(6, 320);
}

/* ---------------- ทั่วไป ---------------- */

function styleHeader(range) {
  range.setBackground(CFG.navy).setFontColor('#FFFFFF').setFontWeight('bold')
    .setVerticalAlignment('middle').setWrap(true);
}

function arrangeSheets(book) {
  const order = [CFG.kpiSheet, CFG.linkSheet, CFG.feedbackSheet, CFG.companySheet, CFG.part1Sheet, CFG.part2Sheet];
  order.forEach((name, i) => {
    const sh = book.getSheetByName(name);
    book.setActiveSheet(sh);
    book.moveActiveSheet(i + 1);
  });
  book.getSheetByName(CFG.companySheet).setTabColor('#9AA7B5');
  book.getSheetByName(CFG.part1Sheet).setTabColor('#9AA7B5');
  book.getSheetByName(CFG.part2Sheet).setTabColor('#9AA7B5');
  book.getSheetByName(CFG.kpiSheet).setTabColor(CFG.navy);
  book.setActiveSheet(book.getSheetByName(CFG.kpiSheet));
}

/* ---------------- ทดสอบ (ใช้ก่อนส่งลูกค้าจริงเท่านั้น) ---------------- */

// ใส่ ID ของชีต KPI ที่ setup สร้าง (อยู่ใน URL ของชีต) ก่อนรัน testSubmit หรือ clearTestData
const TEST_SHEET_ID = '';

function testForms() {
  const book = SpreadsheetApp.openById(TEST_SHEET_ID);
  return [CFG.part1Sheet, CFG.part2Sheet].map(n => FormApp.openByUrl(book.getSheetByName(n).getFormUrl()));
}

function answer(form, values) {
  const items = form.getItems().filter(i => i.getType() !== FormApp.ItemType.SECTION_HEADER);
  let r = form.createResponse();
  values.forEach((v, i) => {
    if (v === null || v === '') return;
    const it = items[i];
    switch (it.getType()) {
      case FormApp.ItemType.TEXT: r = r.withItemResponse(it.asTextItem().createResponse(v)); break;
      case FormApp.ItemType.PARAGRAPH_TEXT: r = r.withItemResponse(it.asParagraphTextItem().createResponse(v)); break;
      case FormApp.ItemType.SCALE: r = r.withItemResponse(it.asScaleItem().createResponse(v)); break;
      case FormApp.ItemType.MULTIPLE_CHOICE: r = r.withItemResponse(it.asMultipleChoiceItem().createResponse(v)); break;
    }
  });
  r.submit();
}

// ส่งคำตอบทดสอบ 5 บริษัท (ชื่อขึ้นต้นด้วย "ทดสอบ")
function testSubmit() {
  const [f1, f2] = testForms();
  [
    ['ทดสอบ A', 'ผู้ทดสอบ 1', 'IR Manager', 5, 6, 6, 4, 'สีและฟอนต์', 'ทดสอบความเห็น'],
    ['ทดสอบ A', 'ผู้ทดสอบ 2', 'CFO', 3, 4, 5, null, 'แนวทางดีไซน์', ''],
    ['ทดสอบ B', 'ผู้ทดสอบ 3', 'IR Manager', 4, 5, 6, 3, 'ไม่ติดเลย', ''],
    ['ทดสอบ C', 'ผู้ทดสอบ 4', 'Marketing', 5, 6, 7, 5, 'โครงหน้าแรก', ''],
    ['ทดสอบ D', 'ผู้ทดสอบ 5', 'CEO', 4, 5, 5, null, 'สีและฟอนต์', ''],
    ['ทดสอบ E', 'ผู้ทดสอบ 6', 'IR Manager', 2, 3, 4, 2, 'โครงสร้างหลัก', ''],
  ].forEach(v => answer(f1, v));
  [
    ['ทดสอบ A', 'ผู้ทดสอบ 1', 4, 'ไม่ต้องเลย', 9, 'ทดสอบข้อเสนอแนะ'],
    ['ทดสอบ B', 'ผู้ทดสอบ 3', 5, 'นิดหน่อย', 10, ''],
    ['ทดสอบ C', 'ผู้ทดสอบ 4', 4, 'ไม่ต้องเลย', 8, ''],
    ['ทดสอบ D', 'ผู้ทดสอบ 5', 3, 'เยอะ', 6, ''],
    ['ทดสอบ E', 'ผู้ทดสอบ 6', 4, 'นิดหน่อย', 7, ''],
  ].forEach(v => answer(f2, v));
}

// สร้างชีตรายบริษัท ข้อเสนอแนะ และสูตรในชีต KPI ใหม่ (ใช้กับชีตที่สร้างจากสคริปต์รุ่นก่อนแก้ col)
// ช่วงวันที่ เป้าหมาย และน้ำหนักในชีต KPI จะกลับเป็นค่าเริ่มต้น
function rebuildCalcSheets() {
  const book = SpreadsheetApp.openById(TEST_SHEET_ID);
  [CFG.companySheet, CFG.feedbackSheet].forEach(n => {
    const sh = book.getSheetByName(n);
    if (sh) book.deleteSheet(sh);
  });
  buildCompanySheet(book);
  buildKpiSheet(book);
  buildFeedbackSheet(book);
  arrangeSheets(book);
}

// ลบคำตอบทั้งหมดในฟอร์มและแถวคำตอบในชีต ใช้หลังทดสอบเสร็จ ก่อนส่งลูกค้าจริง
function clearTestData() {
  const book = SpreadsheetApp.openById(TEST_SHEET_ID);
  testForms().forEach(f => f.deleteAllResponses());
  [CFG.part1Sheet, CFG.part2Sheet].forEach(n => {
    const sh = book.getSheetByName(n);
    if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  book.getSheetByName(CFG.linkSheet).getRange('A4:A' + (3 + CFG.linkRows)).clearContent();
}
