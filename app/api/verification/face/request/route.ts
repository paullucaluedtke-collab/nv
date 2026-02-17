import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId ist erforderlich" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        face_verification: {
          status: "pending",
          verifiedAt: null,
          confidence: null,
        },
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[face/request] update error", error);
      return NextResponse.json(
        { error: error.message || "Face-Verifikation konnte nicht gestartet werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Face-Scan angefragt. Ein Admin prüft und bestätigt manuell.",
    });
  } catch (err: any) {
    console.error("[face/request] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unbekannter Fehler bei Face-Verifikation" },
      { status: 500 }
    );
  }
}

