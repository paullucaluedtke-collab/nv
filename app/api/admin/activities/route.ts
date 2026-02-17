import { NextResponse } from "next/server";
import { fetchAllActivitiesForAdmin } from "@/lib/activitiesRepository";

export async function GET() {
  try {
    const activities = await fetchAllActivitiesForAdmin();
    return NextResponse.json(activities);
  } catch (err: any) {
    console.error("[api/admin/activities] error", err);
    const errorMessage = err?.message || "Fehler beim Laden der Aktivitäten";
    
    if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json(
        { 
          error: "Server-Konfiguration fehlt. Bitte SUPABASE_SERVICE_ROLE_KEY in .env.local setzen und Server neu starten."
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

