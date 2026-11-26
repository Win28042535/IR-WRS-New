// Checks the direction-logic sources for updates and reports them — it never changes code.
//
//   npx tsx scripts/check-direction-logic.ts            → report only
//   npx tsx scripts/check-direction-logic.ts --accept   → after a person approved and the
//                                                         code was updated: save the sources
//                                                         as the new baseline
//
// Sources
//   • Sheet "IR_Primary_Goal_32_Mapping_UX_Writing_Revised" (published, read via gviz)
//   • Direction Tester site (one HTML file; its data arrays sit in an inline script)
// What it compares
//   1. The 32 mapping rows (sheet and tester) against src/lib/directionMapping.ts — must match
//   2. The tester's goal list against our visible goals (labels, descriptions, order) — must match
//   3. Everything else (rules, UX writing, UAT, personas, quiz wording, audiences, the
//      tester's own logic code) against the last approved snapshot — reported when it changes
// Output: a Thai markdown report on stdout and in reports/direction-logic/latest.md.
// Exit code: 0 nothing new · 1 changes found (needs a person's approval) · 2 a source failed.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DIRECTION_MAPPINGS, FEEL_LABEL, TELLING_LABEL } from "../src/lib/directionMapping";
import { BUSINESS_GOALS, SUGGESTED_GOALS } from "../src/lib/data";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(ROOT, "scripts", "direction-logic.snapshot.json");
const REPORT = join(ROOT, "reports", "direction-logic", "latest.md");
const SHEET_ID = "1oaPibMYckLqWPFSgXi5O0KCVrDHr4VW452mEjvzWZ1w";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/htmlview`;
const TESTER_URL = "https://ir-requirement-direction-tester.ig-workspace888.chatgpt.site/";
const MAPPING_TAB = "เปรียบเทียบก่อนหลัง"; // ID, goal, feel, telling, …, headline (now), …, sentence (now)
const WATCH_TABS = ["สรุปกฎใหม่", "32 แนวทางหลัก", "Persona จำลอง", "UAT ที่ควรทดสอบ", "หลักการ UX Writing"];
const accept = process.argv.includes("--accept");

type Row = { id: string; goal: string; feel: string; telling: string; headline: string; sentence: string };
type Snapshot = { savedAt: string; tester: { goals: string[][]; audiences: string[][]; questions: string; logicHash: string }; sheetTabs: Record<string, string> };

// sheet goal names → our goal ids (the sheet calls the IR goal by its category name)
const GOAL_ALIAS: Record<string, string> = { "นักลงทุนสัมพันธ์ (IR)": "ir", "สื่อสารข้อมูลกับนักลงทุน": "ir" };
const goalIdOf = (name: string) => GOAL_ALIAS[name] ?? BUSINESS_GOALS.find((g) => g.label === name)?.id ?? `?${name}`;
const goalLabel = (id: string) => BUSINESS_GOALS.find((g) => g.id === id)?.label ?? id;
const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

async function get(url: string) {
  const r = await fetch(url, { headers: { "user-agent": "direction-logic-check" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

// ── sheet ──
async function sheetRows(tab: string): Promise<unknown[][]> {
  const t = await get(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`);
  const j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  if (j.status === "error") throw new Error(`sheet tab "${tab}": ${j.errors?.[0]?.detailed_message ?? "error"}`);
  return j.table.rows.map((r: any) => (r.c ?? []).map((c: any) => (c ? (c.v ?? c.f ?? "") : "")));
}
async function sheetMapping(): Promise<Row[]> {
  return (await sheetRows(MAPPING_TAB))
    .filter((r) => /^\d\d$/.test(norm(r[0])))
    .map((r) => ({ id: norm(r[0]), goal: goalIdOf(norm(r[1])), feel: norm(r[2]), telling: norm(r[3]), headline: norm(r[5]), sentence: norm(r[7]) }));
}

// ── tester ──
function literal(js: string, name: string): string {
  const start = js.indexOf(`const ${name}`);
  if (start < 0) throw new Error(`tester: "${name}" not found`);
  const open = js.indexOf("[", start);
  let depth = 0, i = open, inStr: string | null = null;
  for (; i < js.length; i++) {
    const ch = js[i];
    if (inStr) { if (ch === "\\") i++; else if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
    else if (ch === "[") depth++;
    else if (ch === "]" && --depth === 0) break;
  }
  return js.slice(open, i + 1);
}
async function tester() {
  const html = await get(TESTER_URL);
  // the page's own scripts only — the host injects a Cloudflare tag that changes every load
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => !s.includes("__CF$cv$params") && !s.includes("/cdn-cgi/")).join("\n");
  const rows: string[][] = JSON.parse(literal(js, "mappingRows"));
  const goals: string[][] = JSON.parse(literal(js, "goals"));
  const audiences: string[][] = JSON.parse(literal(js, "audiences"));
  const questions = norm(literal(js, "questions"));
  // the logic = the script without its data arrays
  const logic = [ "mappingRows", "goals", "audiences", "questions" ].reduce((s, n) => s.replace(literal(s, n), "[]"), js);
  return {
    mapping: rows.map((r) => ({ id: norm(r[0]), goal: goalIdOf(norm(r[1])), feel: norm(r[2]), telling: norm(r[3]), headline: norm(r[4]), sentence: norm(r[5]) })),
    goals, audiences, questions, logicHash: hash(norm(logic)),
  };
}

// ── ours ──
const ours: Row[] = DIRECTION_MAPPINGS.map((m) => ({ id: m.id, goal: m.goal, feel: FEEL_LABEL[m.feel], telling: TELLING_LABEL[m.telling], headline: m.headline, sentence: m.sentence }));
const sug = SUGGESTED_GOALS as readonly string[];
const ourGoals = BUSINESS_GOALS.filter((g) => !g.hidden)
  .sort((a, b) => (sug.includes(a.id) ? sug.indexOf(a.id) : sug.length) - (sug.includes(b.id) ? sug.indexOf(b.id) : sug.length));

function compareMapping(source: string, theirs: Row[], out: string[]) {
  const byId = new Map(theirs.map((r) => [r.id, r]));
  if (theirs.length !== ours.length) out.push(`- ${source}: มี ${theirs.length} แถว (ระบบเรามี ${ours.length})`);
  for (const t of theirs) if (!ours.some((o) => o.id === t.id)) out.push(`- ${source}: มี ID ${t.id} ใหม่ — ${goalLabel(t.goal)} · ${t.feel} · ${t.telling} · "${t.headline}"`);
  for (const o of ours) {
    const t = byId.get(o.id);
    if (!t) { out.push(`- ${source}: ไม่มี ID ${o.id} แล้ว (ของเรา: "${o.headline}")`); continue; }
    if (t.goal !== o.goal || t.feel !== o.feel || t.telling !== o.telling)
      out.push(`- ${source} ID ${o.id}: เงื่อนไขเปลี่ยน — ${goalLabel(o.goal)} · ${o.feel} · ${o.telling} → ${goalLabel(t.goal)} · ${t.feel} · ${t.telling}`);
    if (t.headline !== o.headline) out.push(`- ${source} ID ${o.id} Headline: "${o.headline}" → "${t.headline}"`);
    if (t.sentence !== o.sentence) out.push(`- ${source} ID ${o.id} ประโยคแนวทาง: "${o.sentence}" → "${t.sentence}"`);
  }
}

function lineDiff(before: string, after: string): string[] {
  const a = before.split("\n"), b = after.split("\n");
  const removed = a.filter((l) => l && !b.includes(l)), added = b.filter((l) => l && !a.includes(l));
  return [...removed.map((l) => `  - ลบ: ${l}`), ...added.map((l) => `  - เพิ่ม: ${l}`)].slice(0, 40);
}

async function main() {
  const out: string[] = [];
  const impact = new Set<string>();
  let failed = false;
  const prev: Snapshot | null = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, "utf8")) : null;

  // sources
  let sheetMap: Row[] | null = null, tabs: Record<string, string> = {}, t: Awaited<ReturnType<typeof tester>> | null = null;
  try { sheetMap = await sheetMapping(); } catch (e) { failed = true; out.push(`- อ่าน sheet (แท็บ ${MAPPING_TAB}) ไม่ได้: ${(e as Error).message}`); }
  for (const tab of WATCH_TABS) {
    try { tabs[tab] = (await sheetRows(tab)).map((r) => r.map(norm).filter(Boolean).join(" | ")).filter(Boolean).join("\n"); }
    catch (e) { failed = true; out.push(`- อ่าน sheet แท็บ "${tab}" ไม่ได้: ${(e as Error).message}`); }
  }
  try { t = await tester(); } catch (e) { failed = true; out.push(`- อ่านเว็บ Tester ไม่ได้: ${(e as Error).message}`); }

  // 1. mapping vs our code
  const mapOut: string[] = [];
  if (sheetMap) compareMapping("Sheet", sheetMap, mapOut);
  if (t) compareMapping("Tester", t.mapping, mapOut);
  if (mapOut.length) { impact.add("ข้อความหัวข้อและประโยคแนวทางบนปกสรุป + ไฟล์ PDF / PNG (src/lib/directionMapping.ts)"); impact.add("บรรทัด Direction Mapping ในสรุปของทีม"); }

  // 2. goal list vs ours
  const goalOut: string[] = [];
  if (t) {
    const theirs = t.goals.map(([label, desc]) => ({ label: norm(label), desc: norm(desc) }));
    theirs.forEach((g, i) => {
      const o = ourGoals.find((x) => x.label === g.label);
      if (!o) goalOut.push(`- เป้าหมายใหม่ / เปลี่ยนชื่อ: "${g.label}" — ${g.desc}`);
      else {
        if (norm(o.desc) !== g.desc) goalOut.push(`- คำอธิบาย "${g.label}": "${o.desc}" → "${g.desc}"`);
        if (ourGoals[i]?.label !== g.label) goalOut.push(`- ลำดับ: "${g.label}" อยู่ลำดับ ${i + 1} ใน Tester (ของเรา ลำดับ ${ourGoals.indexOf(o) + 1})`);
      }
    });
    for (const o of ourGoals) if (!theirs.some((g) => g.label === o.label)) goalOut.push(`- Tester ไม่มี "${o.label}" แล้ว`);
    if (goalOut.length) impact.add("รายการเป้าหมายในขั้นที่ 4 (src/lib/data.ts · BUSINESS_GOALS)");
  }

  // 3. everything else vs the approved snapshot
  const snapOut: string[] = [];
  if (prev && t) {
    if (JSON.stringify(prev.tester.audiences) !== JSON.stringify(t.audiences)) { snapOut.push(`- Tester: รายการกลุ่มผู้อ่านเปลี่ยน`); impact.add("กลุ่มผู้อ่านในขั้นที่ 3"); }
    if (prev.tester.questions !== t.questions) { snapOut.push(`- Tester: คำถามสำรวจแนวทาง (ข้อ 1–5) เปลี่ยน`); impact.add("คำถามในขั้นที่ 5 และการอ่านคำตอบข้อ 1 / ข้อ 3"); }
    if (prev.tester.logicHash !== t.logicHash) { snapOut.push(`- Tester: โค้ดส่วนคำนวณผลเปลี่ยน (ไม่ใช่แค่ข้อมูล) — ควรเปิดดูว่ากฎการเลือกผลเปลี่ยนหรือไม่`); impact.add("กฎการเลือกผลลัพธ์ (directionMappingFor)"); }
  }
  if (prev) for (const tab of WATCH_TABS) {
    if (tabs[tab] === undefined || prev.sheetTabs[tab] === undefined || prev.sheetTabs[tab] === tabs[tab]) continue;
    snapOut.push(`- Sheet แท็บ "${tab}" เปลี่ยน:`, ...lineDiff(prev.sheetTabs[tab], tabs[tab]));
    if (tab === "สรุปกฎใหม่") impact.add("กฎการเลือกผลลัพธ์ (directionMappingFor)");
    if (tab === "UAT ที่ควรทดสอบ" || tab === "Persona จำลอง") impact.add("ชุดทดสอบ Persona / UAT");
    if (tab === "หลักการ UX Writing") impact.add("แนวทางการเขียนหัวข้อ (ความยาว, คำที่ห้ามใช้)");
  }

  // report
  const changed = mapOut.length + goalOut.length + snapOut.length > 0;
  const stamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const lines = [
    `# ตรวจ logic แนวทาง · ${stamp}`,
    "",
    failed ? "⚠️ อ่านแหล่งข้อมูลบางส่วนไม่ได้ ผลด้านล่างอาจไม่ครบ" : changed ? "**พบการเปลี่ยนแปลง — รอคนอนุมัติก่อนปรับระบบ**" : "ตรงกับระบบและฉบับที่อนุมัติล่าสุด ไม่มีอะไรต้องทำ",
    "",
    `แหล่งข้อมูล: [Sheet](${SHEET_URL}) · [Tester](${TESTER_URL})${prev ? ` · ฉบับที่อนุมัติล่าสุด ${prev.savedAt}` : " · ยังไม่มีฉบับอนุมัติ (รันด้วย --accept หลังตรวจครั้งแรก)"}`,
  ];
  if (failed) lines.push("", "## อ่านไม่ได้", ...out);
  if (mapOut.length) lines.push("", "## ตาราง 32 แบบ ไม่ตรงกับระบบ", ...mapOut);
  if (goalOut.length) lines.push("", "## รายการเป้าหมาย ไม่ตรงกับระบบ", ...goalOut);
  if (snapOut.length) lines.push("", "## เปลี่ยนจากฉบับที่อนุมัติล่าสุด", ...snapOut);
  if (impact.size) lines.push("", "## ส่วนของระบบที่จะกระทบ", ...[...impact].map((x) => `- ${x}`));
  if (changed) lines.push("", "## ขั้นตอนต่อไป", "1. คนตรวจรายการด้านบนแล้วตอบว่าข้อไหนให้ปรับตาม", "2. ปรับโค้ดตามที่อนุมัติ แล้วรันชุดทดสอบ Persona / UAT", "3. รัน `npx tsx scripts/check-direction-logic.ts --accept` เพื่อบันทึกเป็นฉบับอนุมัติใหม่");
  const report = lines.join("\n") + "\n";
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, report);
  console.log(report);

  if (accept) {
    if (failed || !t) { console.error("ไม่บันทึกฉบับอนุมัติ: อ่านแหล่งข้อมูลไม่ครบ"); process.exit(2); }
    if (mapOut.length || goalOut.length) { console.error("ไม่บันทึกฉบับอนุมัติ: ตาราง 32 แบบหรือรายการเป้าหมายยังไม่ตรงกับโค้ด — ปรับโค้ดก่อน"); process.exit(1); }
    const snap: Snapshot = { savedAt: stamp, tester: { goals: t.goals, audiences: t.audiences, questions: t.questions, logicHash: t.logicHash }, sheetTabs: tabs };
    writeFileSync(SNAPSHOT, JSON.stringify(snap, null, 2) + "\n");
    console.log(`บันทึกฉบับอนุมัติแล้ว: ${SNAPSHOT}`);
    process.exit(0);
  }
  process.exit(failed ? 2 : changed ? 1 : 0);
}

main();
