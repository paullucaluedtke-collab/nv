import { NextResponse } from "next/server";
import { getIDDocumentSignedUrl } from "@/lib/verificationRepository";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl Parameter fehlt" },
        { status: 400 }
      );
    }
    
    const signedUrl = await getIDDocumentSignedUrl(params.userId, imageUrl);
    
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Signed URL konnte nicht generiert werden" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ signedUrl });
  } catch (err: any) {
    console.error("[api/admin/verifications/id-image] error", err);
    return NextResponse.json(
      { error: err?.message || "Fehler beim Laden des ID-Bildes" },
      { status: 500 }
    );
  }
}

