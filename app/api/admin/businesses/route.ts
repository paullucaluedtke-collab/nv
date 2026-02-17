import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data: businesses, error } = await supabaseAdmin
      .from("business_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/businesses] fetch error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = (businesses ?? []).map((b) => b.user_id);
    const { data: users, error: usersError } = await supabaseAdmin
      .from("user_profiles")
      .select("user_id, display_name, profile_image_url")
      .in("user_id", userIds);

    if (usersError) {
      console.error("[admin/businesses] users fetch error", usersError);
    }

    const userMap = new Map(
      (users ?? []).map((u) => [u.user_id, u])
    );

    const result = (businesses ?? []).map((b) => {
      const owner = userMap.get(b.user_id);
      return {
        id: b.id,
        userId: b.user_id,
        businessName: b.business_name,
        businessType: b.business_type,
        description: b.description,
        website: b.website,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city,
        postalCode: b.postal_code,
        latitude: b.latitude,
        longitude: b.longitude,
        logoUrl: b.logo_url,
        coverImageUrl: b.cover_image_url,
        galleryUrls: b.gallery_urls,
        openingHours: b.opening_hours,
        status: b.status,
        verifiedAt: b.verified_at,
        verifiedBy: b.verified_by,
        taxId: b.tax_id,
        registrationNumber: b.registration_number,
        canCreateActivities: b.can_create_activities,
        canPromoteActivities: b.can_promote_activities,
        promotionCredits: b.promotion_credits,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        ownerDisplayName: owner?.display_name ?? null,
        ownerProfileImageUrl: owner?.profile_image_url ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[admin/businesses] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

