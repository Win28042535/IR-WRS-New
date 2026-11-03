// Supabase client created only when env vars are present, so the app keeps working
// on localStorage until the team plugs in credentials (see .env.local.example).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null =
  isSupabaseConfigured ? createClient(url as string, anon as string) : null;
