import { NextResponse } from "next/server";
import { fetchAllReports } from "@/lib/reportRepository";

export async function GET() {
  try {
    const reports = await fetchAllReports();
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error("[api/admin/reports] error", err);
    const errorMessage = err?.message || "Fehler beim Laden der Reports";
    
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

