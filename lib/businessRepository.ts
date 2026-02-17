// lib/businessRepository.ts
import { supabase } from "./supabaseClient";
import type { BusinessProfile, BusinessOffer, ActivityPromotion, BusinessHours } from "@/types/business";
import { createActivityLog } from "./activityLogRepository";

// Re-export types for convenience
export type { BusinessProfile, BusinessOffer, ActivityPromotion, BusinessHours } from "@/types/business";

const BUSINESS_TABLE = "business_profiles";
const OFFERS_TABLE = "business_offers";
const PROMOTIONS_TABLE = "activity_promotions";

function mapRowToBusinessProfile(row: any): BusinessProfile {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    businessType: row.business_type,
    description: row.description ?? null,
    website: row.website ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    postalCode: row.postal_code ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    logoUrl: row.logo_url ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    galleryUrls: row.gallery_urls ? (Array.isArray(row.gallery_urls) ? row.gallery_urls : typeof row.gallery_urls === "string" ? JSON.parse(row.gallery_urls) : null) : null,
    openingHours: row.opening_hours ? (typeof row.opening_hours === "string" ? JSON.parse(row.opening_hours) : row.opening_hours) : null,
    status: row.status ?? "pending",
    verifiedAt: row.verified_at ?? null,
    verifiedBy: row.verified_by ?? null,
    taxId: row.tax_id ?? null,
    registrationNumber: row.registration_number ?? null,
    canCreateActivities: row.can_create_activities ?? true,
    canPromoteActivities: row.can_promote_activities ?? false,
    promotionCredits: row.promotion_credits ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapRowToBusinessOffer(row: any): BusinessOffer {
  return {
    id: row.id,
    businessId: row.business_id,
    activityId: row.activity_id,
    title: row.title,
    description: row.description ?? null,
    discountType: row.discount_type,
    discountValue: row.discount_value ?? null,
    terms: row.terms ?? null,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function mapRowToActivityPromotion(row: any): ActivityPromotion {
  return {
    id: row.id,
    activityId: row.activity_id,
    businessId: row.business_id,
    promotionType: row.promotion_type,
    startDate: row.start_date,
    endDate: row.end_date,
    cost: row.cost,
    status: row.status ?? "pending",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Create or update a business profile
 */
export async function upsertBusinessProfile(profile: Partial<BusinessProfile> & { userId: string; businessName: string; businessType: string }): Promise<BusinessProfile> {
  const payload: any = {
    user_id: profile.userId,
    business_name: profile.businessName,
    business_type: profile.businessType,
    description: profile.description ?? null,
    website: profile.website ?? null,
    phone: profile.phone ?? null,
    email: profile.email ?? null,
    address: profile.address ?? null,
    city: profile.city ?? null,
    postal_code: profile.postalCode ?? null,
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    logo_url: profile.logoUrl ?? null,
    cover_image_url: profile.coverImageUrl ?? null,
    gallery_urls: profile.galleryUrls && Array.isArray(profile.galleryUrls) ? JSON.stringify(profile.galleryUrls) : null,
    opening_hours: profile.openingHours ? JSON.stringify(profile.openingHours) : null,
    tax_id: profile.taxId ?? null,
    registration_number: profile.registrationNumber ?? null,
    updated_at: new Date().toISOString(),
  };

  // Only include id if updating existing profile
  if (profile.id) {
    payload.id = profile.id;
  }

  const { data, error } = await supabase
    .from(BUSINESS_TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[businessRepository] upsertBusinessProfile error", error);
    throw error;
  }

  const savedProfile = mapRowToBusinessProfile(data);

  // Log business profile creation/update
  createActivityLog({
    userId: profile.userId,
    activityType: profile.id ? "BUSINESS_PROFILE_UPDATED" : "BUSINESS_PROFILE_CREATED",
    metadata: {
      businessId: savedProfile.id,
      businessName: savedProfile.businessName,
      businessType: savedProfile.businessType,
    },
  }).catch((err) => {
    console.warn("[businessRepository] Failed to log business profile update", err);
  });

  return savedProfile;
}

/**
 * Get business profile by user ID
 */
export async function fetchBusinessProfileByUserId(userId: string): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from(BUSINESS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[businessRepository] fetchBusinessProfileByUserId error", error);
    throw error;
  }

  if (!data) return null;

  return mapRowToBusinessProfile(data);
}

/**
 * Get business profile by ID
 */
export async function fetchBusinessProfileById(businessId: string): Promise<BusinessProfile | null> {
  const { data, error } = await supabase
    .from(BUSINESS_TABLE)
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[businessRepository] fetchBusinessProfileById error", error);
    throw error;
  }

  if (!data) return null;

  return mapRowToBusinessProfile(data);
}

/**
 * Get all verified businesses
 */
export async function fetchVerifiedBusinesses(): Promise<BusinessProfile[]> {
  const { data, error } = await supabase
    .from(BUSINESS_TABLE)
    .select("*")
    .eq("status", "verified")
    .order("business_name", { ascending: true });

  if (error) {
    console.error("[businessRepository] fetchVerifiedBusinesses error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToBusinessProfile);
}

/**
 * Create a business offer for an activity
 */
export async function createBusinessOffer(offer: Omit<BusinessOffer, "id" | "createdAt" | "updatedAt">): Promise<BusinessOffer> {
  const payload = {
    business_id: offer.businessId,
    activity_id: offer.activityId,
    title: offer.title,
    description: offer.description ?? null,
    discount_type: offer.discountType,
    discount_value: offer.discountValue ?? null,
    terms: offer.terms ?? null,
    valid_from: offer.validFrom,
    valid_until: offer.validUntil,
    is_active: offer.isActive ?? true,
  };

  const { data, error } = await supabase
    .from(OFFERS_TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[businessRepository] createBusinessOffer error", error);
    throw error;
  }

  return mapRowToBusinessOffer(data);
}

/**
 * Get offers for an activity
 */
export async function fetchOffersByActivityId(activityId: string): Promise<BusinessOffer[]> {
  const { data, error } = await supabase
    .from(OFFERS_TABLE)
    .select("*")
    .eq("activity_id", activityId)
    .eq("is_active", true)
    .gte("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[businessRepository] fetchOffersByActivityId error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToBusinessOffer);
}

/**
 * Create an activity promotion
 */
export async function createActivityPromotion(promotion: Omit<ActivityPromotion, "id" | "createdAt">): Promise<ActivityPromotion> {
  const payload = {
    activity_id: promotion.activityId,
    business_id: promotion.businessId,
    promotion_type: promotion.promotionType,
    start_date: promotion.startDate,
    end_date: promotion.endDate,
    cost: promotion.cost,
    status: promotion.status ?? "pending",
  };

  const { data, error } = await supabase
    .from(PROMOTIONS_TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[businessRepository] createActivityPromotion error", error);
    throw error;
  }

  return mapRowToActivityPromotion(data);
}

/**
 * Get active promotions for an activity
 */
export async function fetchActivePromotionsByActivityId(activityId: string): Promise<ActivityPromotion[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(PROMOTIONS_TABLE)
    .select("*")
    .eq("activity_id", activityId)
    .eq("status", "active")
    .lte("start_date", now)
    .gte("end_date", now)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[businessRepository] fetchActivePromotionsByActivityId error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToActivityPromotion);
}


/**
 * Add promotion credits to a business
 */
export async function addCredits(businessId: string, amount: number): Promise<BusinessProfile> {
  // First get current credits
  const { data: current, error: fetchError } = await supabase
    .from(BUSINESS_TABLE)
    .select("promotion_credits, user_id, business_name")
    .eq("id", businessId)
    .single();

  if (fetchError || !current) {
    throw new Error("Business not found");
  }

  const newBalance = (current.promotion_credits || 0) + amount;

  const { data, error } = await supabase
    .from(BUSINESS_TABLE)
    .update({ promotion_credits: newBalance, updated_at: new Date().toISOString() })
    .eq("id", businessId)
    .select("*")
    .single();

  if (error) {
    console.error("[businessRepository] addCredits error", error);
    throw error;
  }

  // Log credit purchase
  createActivityLog({
    userId: current.user_id,
    activityType: "CREDITS_PURCHASED",
    metadata: {
      businessId,
      amount,
      newBalance,
      businessName: current.business_name
    },
  }).catch((err) => {
    console.warn("[businessRepository] Failed to log credit purchase", err);
  });

  return mapRowToBusinessProfile(data);
}
