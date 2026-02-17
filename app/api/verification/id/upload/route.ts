import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Datei muss ein Bild sein (JPG, PNG, etc.)" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB for ID documents)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Bild ist zu groß (max. 10MB)" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Upload to id-verifications bucket
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("id-verifications")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[verification/id/upload] upload error", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Upload fehlgeschlagen" },
        { status: 500 }
      );
    }

    // Get the public URL (or signed URL for private bucket)
    const { data: urlData } = supabaseAdmin.storage
      .from("id-verifications")
      .getPublicUrl(filePath);

    const imageUrl = urlData?.publicUrl || `id-verifications/${filePath}`;

    // Update user profile with ID verification image and set status to pending
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        id_verification_image_url: imageUrl,
        id_verification_status: "pending",
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[verification/id/upload] update error", updateError);
      // Try to delete the uploaded file
      await supabaseAdmin.storage
        .from("id-verifications")
        .remove([filePath]);
      
      return NextResponse.json(
        { error: updateError.message || "Fehler beim Speichern der Verifikation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "ID-Dokument erfolgreich hochgeladen. Die Verifikation wird von einem Administrator geprüft.",
    });
  } catch (err: any) {
    console.error("[verification/id/upload] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

