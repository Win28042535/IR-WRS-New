"use client";
// ── One style for every free-text note (หมายเหตุ / เล่าเป็นข้อความ / โน้ต) ───────────────
// The DNA of the homepage step's หมายเหตุ: a body-size bold label + grey "(ไม่บังคับ)", one
// short grey line saying what to write, then a white rounded box at body size whose
// placeholder starts with "เช่น …". Same look wherever a client can leave the team a note.
import { useId } from "react";

export function NoteField({
  label, hint, value, onChange, placeholder, rows = 3, optional = true, id, className = "",
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string;
  rows?: number; optional?: boolean; id?: string; className?: string;
}) {
  const auto = useId();
  const fieldId = id ?? `note-${auto}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={fieldId} className="flex items-baseline gap-2">
        <span className="text-body font-semibold text-ir-t1">{label}</span>
        {optional && <span className="text-small text-ir-t3">(ไม่บังคับ)</span>}
      </label>
      {hint && <p id={hintId} className="mt-0.5 text-small text-ir-t3">{hint}</p>}
      <textarea
        id={fieldId}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-describedby={hintId}
        className="mt-2 w-full resize-y rounded-md border border-ir-border bg-white px-3.5 py-3 text-body leading-relaxed text-ir-t1 outline-none transition-colors placeholder:text-ir-t3 focus:border-ir-accent"
      />
    </div>
  );
}
