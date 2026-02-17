import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    const { status, canCreateActivities, canPromoteActivities, promotionCredits } =
      await request.json();

    const payload: Record<string, any> = {};
    if (status) payload.status = status;
    if (canCreateActivities !== undefined) payload.can_create_activities = canCreateActivities;
    if (canPromoteActivities !== undefined) payload.can_promote_activities = canPromoteActivities;
    if (promotionCredits !== undefined) payload.promotion_credits = promotionCredits;
    if (status === "verified") {
      payload.verified_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("business_profiles")
      .update(payload)
      .eq("id", params.businessId);

    if (error) {
      console.error("[admin/business status] update error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/business status] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

