"use client";
// ── Homepage: leave a message ─────────────────────────────────────────────────────
// The form inside the "ยังมีคำถาม?" section (title + subtitle live on the page, same DNA as
// the FAQ). A tinted panel, a secondary (outline) button, so it never competes with the main
// CTAs. Saved via lib/contact.ts.
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { IconCheck } from "@/components/icons";
import { saveContactMessage } from "@/lib/contact";
import { emailError, phoneError } from "@/lib/validation";

const balance = { textWrap: "balance" } as CSSProperties;

export function HomeContact() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);

  // Only a way to reply is required; it can be an email or a phone number.
  const c = contact.trim();
  const contactErr = !c ? "ใส่อีเมลหรือเบอร์โทร เพื่อให้ทีมติดต่อกลับได้"
    : c.includes("@") ? emailError(c)
    : /\d/.test(c) ? phoneError(c) : "ใส่เป็นอีเมลหรือเบอร์โทร";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (contactErr) { setTried(true); return; }
    setSending(true);
    const saved = await saveContactMessage({ name: name.trim(), company: company.trim(), contact: c, topic: "ทั่วไป", message: message.trim() });
    setSending(false);
    setSentId(saved.id);
  };

  const reset = () => { setSentId(null); setMessage(""); setTried(false); };

  const field = "h-11 w-full rounded-full border border-black/10 bg-white px-4 text-body text-ir-t1 outline-none transition-[border-color,box-shadow] placeholder:text-ir-t3 focus:border-ir-select focus:ring-3 focus:ring-ir-ring/30";
  const label = "text-small font-medium text-ir-t2";

  const shell = (children: ReactNode) => (
    <div className="rounded-2xl border border-ir-select-soft/70 bg-ir-accent-soft/45 p-5 sm:p-7 lg:p-8">{children}</div>
  );

  if (sentId) {
    return shell(
      <div role="status" className="flex items-start gap-3 rounded-xl bg-white px-5 py-5">
        <span className="ir-grad-fill grid w-9 h-9 shrink-0 place-items-center rounded-full text-ir-on-accent"><IconCheck width={20} height={20} className="sel-check" /></span>
        <div className="min-w-0">
          <p className="text-body font-semibold text-ir-t1">รับเรื่องไว้แล้ว</p>
          <p className="mt-0.5 text-small leading-relaxed text-ir-t2" style={balance}>
            ทีม IR Plus จะติดต่อกลับทาง <span className="font-semibold text-ir-t1">{c}</span> ภายใน 1–2 วันทำการ · <span className="font-mono text-caption text-ir-t3">{sentId}</span>
          </p>
          <button type="button" onClick={reset} className="mt-1 min-h-10 text-small font-medium text-ir-t2 underline underline-offset-4 hover:text-ir-t1">ฝากเรื่องอื่นเพิ่ม</button>
        </div>
      </div>
    );
  }

  return shell(
    <form onSubmit={submit} noValidate aria-label="ฝากเรื่องไว้ ทีมติดต่อกลับ">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className={label}>ชื่อ</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="ชื่อและนามสกุลผู้ประสานงาน" className={`mt-1 ${field}`} />
        </label>
        <label className="block">
          <span className={label}>บริษัท</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" placeholder="บริษัท ตัวอย่าง จำกัด (มหาชน)" className={`mt-1 ${field}`} />
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className={label}>อีเมลหรือเบอร์โทร สำหรับติดต่อกลับ</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete="email"
            placeholder="name@company.co.th หรือ 08X-XXX-XXXX"
            aria-invalid={tried && !!contactErr}
            aria-describedby={tried && contactErr ? "contact-msg-err" : undefined}
            className={`mt-1 ${field} ${tried && contactErr ? "border-red-400" : ""}`}
          />
          {tried && contactErr && <span id="contact-msg-err" role="alert" className="mt-1 block pl-4 text-small text-red-700">{contactErr}</span>}
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={label}>ข้อความ (ไม่บังคับ)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="เช่น อยากทราบระยะเวลาและงบประมาณโดยประมาณ"
            className="mt-1 w-full resize-y rounded-lg border border-black/10 bg-white px-4 py-2.5 text-body leading-relaxed text-ir-t1 outline-none transition-[border-color,box-shadow] placeholder:text-ir-t3 focus:border-ir-select focus:ring-3 focus:ring-ir-ring/30"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-11 items-center rounded-full border border-ir-border-hi bg-white px-5 text-small font-semibold text-ir-t1 transition-[border-color,background-color,scale] duration-200 hover:border-ir-t1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ir-ring/50 disabled:cursor-wait disabled:opacity-70"
        >
          {sending ? "กำลังส่ง..." : "ฝากเรื่อง"}
        </button>
      </div>
    </form>
  );
}
