// ── Homepage "ฝากเรื่องไว้ ทีมติดต่อกลับ" ───────────────────────────────────────
export const CONTACT_TOPICS = ["สอบถามบริการและราคา", "นัดคุยกับทีม", "ติดปัญหาตอนกรอกแบบฟอร์ม", "เรื่องอื่น"] as const;

export type ContactMessage = {
  id: string;
  createdAt: number;
  name: string;
  company: string;
  contact: string; // email or phone, whichever the visitor gave
  topic: string;
  message: string;
};

const LOCAL_KEY = "irp-wrs-messages";

// Kept on this device like the Requirement draft (local-first), and inserted into
// Supabase `contact_messages` when Supabase is configured (no-op otherwise).
export async function saveContactMessage(msg: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage> {
  const full: ContactMessage = { ...msg, id: `MSG-${Date.now().toString(36).toUpperCase()}`, createdAt: Date.now() };
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as ContactMessage[];
    localStorage.setItem(LOCAL_KEY, JSON.stringify([full, ...prev].slice(0, 50)));
  } catch { /* storage unavailable: still try the server */ }
  const { insertContactMessage } = await import("./supabaseRepo");
  await insertContactMessage(full);
  return full;
}
