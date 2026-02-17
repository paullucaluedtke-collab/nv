import { NextResponse } from "next/server";
import { fetchAllActivityLogs } from "@/lib/activityLogRepository";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    // Optional: Add authentication check here if needed
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "1000", 10);

    const logs = await fetchAllActivityLogs(limit);

    // Enrich logs with user emails if available
    const supabaseAdmin = getSupabaseAdmin();
    const userIds = Array.from(new Set(logs.map((log) => log.userId).filter((id): id is string => Boolean(id))));
    
    if (userIds.length > 0) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]));

      const enrichedLogs = logs.map((log) => ({
        ...log,
        userEmail: log.userEmail ?? emailMap.get(log.userId ?? "") ?? null,
      }));

      return NextResponse.json(enrichedLogs);
    }

    return NextResponse.json(logs);
  } catch (err: any) {
    console.error("[api/admin/logs] error", err);
    const errorMessage = err?.message || "Fehler beim Laden der Logs";
    
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

