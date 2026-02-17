import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const bodySchema = z.object({
  userId: z.string().min(1),
  galleryUrls: z.array(z.string().url()).max(5).nullable(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { userId, galleryUrls } = bodySchema.parse(json);

    const supabaseAdmin = getSupabaseAdmin();

    // Update profile_gallery_urls column in database
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ profile_gallery_urls: galleryUrls })
      .eq("user_id", userId);

    if (error) {
      console.error("[profile/gallery] Could not save gallery URLs to DB:", error);
      return NextResponse.json(
        { error: error.message || "Fehler beim Speichern der Gallery-URLs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gallery-URLs gespeichert"
    });
  } catch (err: any) {
    console.error("[profile/gallery] unexpected error", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

