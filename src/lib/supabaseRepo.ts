// Requirement repository backed by Supabase (Realtime-ready). All functions no-op
// gracefully when Supabase isn't configured, so wiring this into the store is safe.
//
// Migration path (one step): in lib/store.ts, after each mutation call
//   upsertRequirement(changedReq)  // fire-and-forget
// and hydrate via listRequirements()/subscribeRequirements() on app mount.
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Requirement } from "./types";
import type { ContactMessage } from "./contact";

const TABLE = "requirements";

export async function listRequirements(): Promise<Requirement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(TABLE).select("data").order("updated_at", { ascending: false });
  if (error) { console.error("[supabase] list", error); return []; }
  return (data ?? []).map((r) => (r as { data: Requirement }).data);
}

export async function upsertRequirement(req: Requirement): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert({
    id: req.id,
    data: req,
    status: req.status,
    company: req.company,
    industry: req.industry,
    updated_at: new Date(req.updatedAt || Date.now()).toISOString(),
  });
  if (error) console.error("[supabase] upsert", error);
}

/** Homepage "ฝากเรื่อง" form → public.contact_messages (see supabase/schema.sql). */
export async function insertContactMessage(msg: ContactMessage): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("contact_messages").insert({
    id: msg.id,
    name: msg.name,
    company: msg.company,
    contact: msg.contact,
    topic: msg.topic,
    message: msg.message,
    created_at: new Date(msg.createdAt).toISOString(),
  });
  if (error) console.error("[supabase] contact insert", error);
}

export async function deleteRequirement(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) console.error("[supabase] delete", error);
}

/** Realtime subscription calls onChange on any INSERT/UPDATE/DELETE. Returns an unsubscribe fn. */
export function subscribeRequirements(onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};
  const ch = client
    .channel("wrs-requirements")
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, onChange)
    .subscribe();
  return () => { client.removeChannel(ch); };
}

export { isSupabaseConfigured };
