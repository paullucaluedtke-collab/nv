import { NextResponse } from "next/server";
import { fetchAllVerifications } from "@/lib/verificationRepository";

export async function GET() {
  try {
    const verifications = await fetchAllVerifications();
    return NextResponse.json(verifications);
  } catch (err: any) {
    console.error("[api/admin/verifications] error", err);
    const errorMessage = err?.message || "Fehler beim Laden der Verifizierungen";
    
    // Check if it's an environment variable error
    if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { 
          error: "Server-Konfiguration fehlt. Bitte SUPABASE_SERVICE_ROLE_KEY in .env.local setzen und Server neu starten.",
          details: "Die Umgebungsvariable SUPABASE_SERVICE_ROLE_KEY ist nicht verfügbar. Bitte überprüfe deine .env.local Datei und starte den Server neu."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

