import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient;

  if (!SUPABASE_URL || !SUPABASE_URL.startsWith("http")) {
    throw new Error("SUPABASE_URL ist nicht gesetzt oder ungültig");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY fehlt in Umgebungsvariablen");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in .env.local setzen und Server neu starten.");
  }

  _adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}
