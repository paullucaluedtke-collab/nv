// lib/trustRepository.ts
import { getSupabaseAdmin } from "./supabaseAdmin";
import { supabase } from "./supabaseClient";
import type { SocialVerification, TrustProfile } from "../types/trust";

export async function updateSocialVerification(
  userId: string,
  platform: "phone" | "google" | "facebook",
  verification: {
    status: "pending" | "verified" | "failed" | "not_started";
    verifiedAt: string | null;
    username?: string;
    phoneNumber?: string;
  }
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Fetch current profile
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("user_profiles")
    .select("social_verifications")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("[trustRepository] fetch error", fetchError);
    throw fetchError;
  }

  // Get current social verifications array
  const currentVerifications: SocialVerification[] =
    Array.isArray(profile?.social_verifications)
      ? profile.social_verifications
      : [];

  // Update or add the verification for this platform
  const updatedVerifications = [...currentVerifications];
  const existingIndex = updatedVerifications.findIndex(
    (v) => v.platform === platform
  );

  const newVerification: SocialVerification = {
    platform,
    status: verification.status,
    verifiedAt: verification.verifiedAt,
    ...(verification.username && { username: verification.username }),
    ...(verification.phoneNumber && { phoneNumber: verification.phoneNumber }),
  };

  if (existingIndex >= 0) {
    updatedVerifications[existingIndex] = newVerification;
  } else {
    updatedVerifications.push(newVerification);
  }

  // Update the profile
  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ social_verifications: updatedVerifications })
    .eq("user_id", userId);

  if (updateError) {
    console.error("[trustRepository] update error", updateError);
    throw updateError;
  }
}

export async function fetchTrustProfile(userId: string): Promise<TrustProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, trust_level, trust_score, social_verifications, face_verification, created_at, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[trustRepository] fetchTrustProfile error", error);
    throw error;
  }

  if (!data) return null;

  return {
    userId: data.user_id,
    trustLevel: data.trust_level ?? "unverified",
    trustScore: data.trust_score ?? 0,
    socialVerifications: Array.isArray(data.social_verifications) ? data.social_verifications : [],
    faceVerification: data.face_verification ?? null,
    createdAt: data.created_at ?? "",
    updatedAt: data.updated_at ?? "",
  };
}
