import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  userId: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datumsformat (YYYY-MM-DD)"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { userId, birthDate } = bodySchema.parse(json);

    // Validate age (must be at least 18 years old)
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      return NextResponse.json(
        { error: "Du musst mindestens 18 Jahre alt sein, um Aktivitäten zu nutzen." },
        { status: 400 }
      );
    }

    if (actualAge > 120) {
      return NextResponse.json(
        { error: "Ungültiges Geburtsdatum." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update user profile with birth date and set age_verified to true (Stufe 1)
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        birth_date: birthDate,
        age_verified: true,
        age_verified_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[verification/age] update error", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern des Geburtsdatums" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      age: actualAge,
      message: "Altersverifikation Stufe 1 erfolgreich. Du hast jetzt Zugriff auf Aktivitäten."
    });
  } catch (err: any) {
    console.error("[verification/age] unexpected error", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

