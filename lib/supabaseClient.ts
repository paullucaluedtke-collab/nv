import { createClient } from "@supabase/supabase-js";

// Supabase config – always use environment variables, never hardcode
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_URL.startsWith("http")) {
  console.error("Aktueller SUPABASE_URL:", SUPABASE_URL);
  throw new Error("SUPABASE_URL ist kein gültiger http(s)-String.");
}

if (!SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht gesetzt!");
  throw new Error("Supabase Anon Key fehlt. Bitte setze NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);