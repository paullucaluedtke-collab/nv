import { NextResponse } from "next/server";
import { updateReportStatus, type ReportStatus } from "@/lib/reportRepository";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    await updateReportStatus(params.id, status as ReportStatus);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/admin/reports] update error", err);
    return NextResponse.json(
      { error: err?.message || "Fehler beim Aktualisieren des Reports" },
      { status: 500 }
    );
  }
}

