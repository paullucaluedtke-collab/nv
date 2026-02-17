import { NextResponse } from "next/server";
import { verifyIDDocument, rejectIDDocument } from "@/lib/verificationRepository";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { action, reason } = await request.json();
    
    if (action === "verify") {
      await verifyIDDocument(params.userId);
      return NextResponse.json({ success: true, message: "ID-Verifikation bestätigt" });
    } else if (action === "reject") {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: "Ablehnungsgrund erforderlich" },
          { status: 400 }
        );
      }
      await rejectIDDocument(params.userId, reason);
      return NextResponse.json({ success: true, message: "ID-Verifikation abgelehnt" });
    } else {
      return NextResponse.json(
        { error: "Ungültige Aktion" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("[api/admin/verifications/id] error", err);
    return NextResponse.json(
      { error: err?.message || "Fehler bei der ID-Verifikation" },
      { status: 500 }
    );
  }
}

