import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: "file und userId sind erforderlich" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const path = `${userId}/face-${Date.now()}.jpg`;

    const supabaseAdmin = getSupabaseAdmin();

    const BUCKET = "face-verifications";

    // Ensure bucket exists (public for admin viewing)
    const { data: listBuckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = listBuckets?.some((b) => b.name === BUCKET);
    if (!bucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
      });
      if (bucketError && bucketError.message?.includes("already exists") === false) {
        console.error("[face/upload] bucket create error", bucketError);
        return NextResponse.json(
          { error: bucketError.message || "Bucket konnte nicht angelegt werden" },
          { status: 500 }
        );
      }
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[face/upload] upload error", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Upload fehlgeschlagen" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData?.publicUrl ?? null;

    // Mark as pending with reference image
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        face_verification: {
          status: "pending",
          verifiedAt: null,
          confidence: null,
          imageUrl,
          submittedAt: new Date().toISOString(),
        },
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[face/upload] update error", updateError);
      return NextResponse.json(
        { error: updateError.message || "Face-Verifikation konnte nicht gestartet werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Foto hochgeladen. Ein Admin vergleicht und bestätigt.",
      imageUrl,
    });
  } catch (err: any) {
    console.error("[face/upload] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unbekannter Fehler bei Face-Upload" },
      { status: 500 }
    );
  }
}

