"use client";

// Hydrates the store from Supabase and subscribes to realtime changes but ONLY when
// Supabase is configured. Without keys this is a no-op, so the app keeps using localStorage.
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { isSupabaseConfigured, listRequirements, subscribeRequirements } from "@/lib/supabaseRepo";

export function RealtimeSync() {
  const hydrate = useStore((s) => s.hydrateFromRemote);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const pull = async () => {
      const reqs = await listRequirements();
      if (active) hydrate(reqs);
    };
    pull();
    const unsub = subscribeRequirements(pull);
    return () => { active = false; unsub(); };
  }, [hydrate]);
  return null;
}
