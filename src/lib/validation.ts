// Shared contact-field format rules — used by every "ข้อมูลติดต่อ" contact form
// across the two Requirement flows (flow1's Step5, flow2's S6Deliver) so the rule
// for what counts as a valid email/phone can't drift between them.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^0\d[\d-]{7,10}\d$/;

export function emailError(value: string): string {
  const v = value.trim();
  if (!v) return "กรุณากรอกอีเมล";
  if (!EMAIL_RE.test(v)) return "รูปแบบอีเมลไม่ถูกต้อง เช่น name@company.co.th";
  return "";
}

// Phone is optional almost everywhere it appears, so an empty value is never an error —
// only a filled-in value that doesn't look like a Thai phone number is.
export function phoneError(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (!PHONE_RE.test(v)) return "รูปแบบเบอร์โทรไม่ถูกต้อง เช่น 08X-XXX-XXXX";
  return "";
}

// Keeps phone input to what a Thai phone number can actually contain while typing,
// instead of only complaining about it after the fact on blur.
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 12);
}

// Email can't contain whitespace — strip it as it's typed rather than waiting for blur.
export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s/g, "");
}
