import { NextResponse } from "next/server";
import { updateFaceVerificationStatus, type VerificationStatus } from "@/lib/verificationRepository";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { status, confidence } = await request.json();
    
    await updateFaceVerificationStatus(
      params.userId,
      status as VerificationStatus,
      confidence
    );
    
    return NextResponse.json({ 
      success: true, 
      message: `Face-Verifikation ${status === "verified" ? "bestätigt" : "abgelehnt"}` 
    });
  } catch (err: any) {
    console.error("[api/admin/verifications/face] error", err);
    return NextResponse.json(
      { error: err?.message || "Fehler bei der Face-Verifikation" },
      { status: 500 }
    );
  }
}

