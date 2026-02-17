import { NextResponse } from "next/server";
import { deleteActivity } from "@/lib/activitiesRepository";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteActivity(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/admin/activities] delete error", err);
    return NextResponse.json(
      { error: err?.message || "Fehler beim Löschen der Aktivität" },
      { status: 500 }
    );
  }
}

