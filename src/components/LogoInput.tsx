"use client";
// ── Company logo (step 1, under the CI cards; optional) ──────────────────────────────
// User test CBG: the team wants the logo to see what the brand looks like, whether the CI is
// kept from the website or the team proposes a new one. Kept in the draft as a data URL
// (this demo stores everything in the browser), so raster images are scaled down to at most
// 640px; SVG is kept as is when small. Shown on the Deliver sheet and in the PDF / PNG.
import { useRef, useState } from "react";
import type { Requirement } from "@/lib/types";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_SVG_BYTES = 300 * 1024;
const MAX_SIDE = 640;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function shrink(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1) return dataUrl;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

export function LogoInput({ draft, updateDraft }: { draft: Requirement; updateDraft: (p: Partial<Requirement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError("");
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    if (!/^image\/(png|jpe?g|svg\+xml)$/.test(file.type) && !isSvg) { setError("รองรับไฟล์ PNG, JPG หรือ SVG"); return; }
    if (file.size > (isSvg ? MAX_SVG_BYTES : MAX_BYTES)) { setError(isSvg ? "ไฟล์ SVG ต้องไม่เกิน 300 KB" : "ไฟล์ต้องไม่เกิน 2 MB"); return; }
    setBusy(true);
    try {
      const raw = await readAsDataUrl(file);
      updateDraft({ logo: isSvg ? raw : await shrink(raw), logoName: file.name });
    } catch {
      setError("เปิดไฟล์นี้ไม่ได้ ลองไฟล์อื่น");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" className="sr-only" tabIndex={-1}
        onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      {draft.logo ? (
        <div className="flex items-center gap-3 rounded-xl border border-ir-border bg-ir-card px-3 py-2.5">
          <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-ir-border-soft bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.logo} alt="โลโก้บริษัท" className="max-h-full max-w-full object-contain" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-small font-semibold text-ir-t1">แนบโลโก้แล้ว</span>
            <span className="block truncate text-caption text-ir-t3">{draft.logoName || "โลโก้บริษัท"}</span>
          </span>
          <button type="button" onClick={() => inputRef.current?.click()}
            className="inline-flex h-11 items-center rounded-full px-3 text-small font-semibold text-ir-t2 transition-colors hover:bg-ir-muted hover:text-ir-t1 focus-ring">เปลี่ยน</button>
          <button type="button" onClick={() => updateDraft({ logo: "", logoName: "" })} aria-label="ลบโลโก้"
            className="inline-flex h-11 items-center rounded-full px-3 text-small font-semibold text-ir-t3 transition-colors hover:bg-ir-error-soft hover:text-ir-error focus-ring">ลบ</button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-ir-border px-4 py-3 text-left transition-colors hover:border-ir-border-hi hover:bg-ir-card focus-ring disabled:opacity-60">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ir-muted text-lead text-ir-t2">+</span>
          <span className="min-w-0">
            <span className="block text-small font-semibold text-ir-t1">{busy ? "กำลังแนบ…" : "แนบโลโก้"} <span className="font-normal text-ir-t3">(ไม่บังคับ)</span></span>
            <span className="block text-caption text-ir-t3">ช่วยให้ทีมเห็นหน้าตาแบรนด์ · PNG, JPG หรือ SVG ไม่เกิน 2 MB</span>
          </span>
        </button>
      )}
      {error && <p className="mt-1.5 text-small text-ir-error" role="alert">{error}</p>}
    </div>
  );
}
