"use client";
// ── Others who help decide (Deliver, optional, up to 2) ──────────────────────────────
// User test CPALL: the person filling the form often can't decide alone. Answers live in
// this browser, so co-deciders can't edit the same draft; instead the client names up to two
// of them (name, position, email) and can pass them the PDF / PNG first. The team sees them
// with the requirement and contacts everyone.
import type { CoDecider, Requirement } from "@/lib/types";
import { emailError, sanitizeEmailInput } from "@/lib/validation";

const MAX = 2;
const EMPTY: CoDecider = { name: "", position: "", email: "" };

export function CoDeciders({ draft, updateDraft }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void }) {
  const list: CoDecider[] = draft.coDeciders ?? [];
  const set = (next: CoDecider[]) => updateDraft({ coDeciders: next });
  const change = (i: number, patch: Partial<CoDecider>) => set(list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <div className="rounded-xl border border-ir-border bg-ir-card px-5 pb-5 pt-5 shadow-e1">
      <p className="text-lead font-semibold text-ir-t1">ผู้ร่วมตัดสินใจ <span className="text-body font-normal text-ir-t3">(ไม่บังคับ)</span></p>
      <p className="mt-1 text-small leading-relaxed text-ir-t3">
        ถ้ามีคนอื่นร่วมตัดสินใจ ใส่ไว้ได้สูงสุด {MAX} คน ทีมจะติดต่อทุกคน · ส่งไฟล์ PDF ด้านบนให้ดูก่อนกดส่งก็ได้
      </p>
      {list.map((p, i) => {
        const err = p.email ? emailError(p.email) : "";
        return (
          <fieldset key={i} className="mt-4 rounded-lg border border-ir-border-soft bg-white p-3">
            <legend className="sr-only">ผู้ร่วมตัดสินใจคนที่ {i + 1}</legend>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-small font-semibold text-ir-t1">คนที่ {i + 1}</span>
              <button type="button" onClick={() => set(list.filter((_, j) => j !== i))} aria-label={`ลบผู้ร่วมตัดสินใจคนที่ ${i + 1}`}
                className="inline-flex h-11 items-center rounded-full px-2.5 text-caption font-semibold text-ir-t3 transition-colors hover:bg-ir-error-soft hover:text-ir-error focus-ring">ลบ</button>
            </div>
            <div className="grid gap-2">
              <input aria-label={`ชื่อ-นามสกุล คนที่ ${i + 1}`} value={p.name} onChange={(e) => change(i, { name: e.target.value })} placeholder="ชื่อ-นามสกุล"
                className="h-11 w-full rounded-md border border-ir-border px-3 text-body outline-none transition-colors focus:border-ir-accent" />
              <input aria-label={`ตำแหน่ง คนที่ ${i + 1}`} value={p.position} onChange={(e) => change(i, { position: e.target.value })} placeholder="ตำแหน่ง เช่น CFO"
                className="h-11 w-full rounded-md border border-ir-border px-3 text-body outline-none transition-colors focus:border-ir-accent" />
              <input aria-label={`Email คนที่ ${i + 1}`} type="email" value={p.email} onChange={(e) => change(i, { email: sanitizeEmailInput(e.target.value) })} placeholder="name@company.co.th"
                aria-invalid={!!err || undefined}
                className="h-11 w-full rounded-md border border-ir-border px-3 text-body outline-none transition-colors focus:border-ir-accent aria-invalid:border-ir-error" />
              {err && <p className="text-caption text-ir-error">{err}</p>}
            </div>
          </fieldset>
        );
      })}
      {list.length < MAX && (
        <button type="button" onClick={() => set([...list, { ...EMPTY }])}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-dashed border-ir-border text-small font-semibold text-ir-t1 transition-colors hover:border-ir-border-hi hover:bg-white focus-ring">
          + เพิ่มผู้ร่วมตัดสินใจ
        </button>
      )}
    </div>
  );
}
