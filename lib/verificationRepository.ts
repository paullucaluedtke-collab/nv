// lib/verificationRepository.ts
import { getSupabaseAdmin } from "./supabaseAdmin";

export type VerificationType = "social" | "face" | "age" | "id";

export type SocialVerificationPlatform = "phone" | "google" | "facebook";

export type VerificationStatus = "pending" | "verified" | "failed" | "not_started" | "rejected";

export interface UserVerification {
  userId: string;
  displayName: string | null;
  email: string | null;
  emoji: string | null;
  profileImageUrl: string | null;
  // Social Verifications
  socialVerifications: Array<{
    platform: SocialVerificationPlatform;
    status: VerificationStatus;
    verifiedAt: string | null;
    username?: string;
    phoneNumber?: string;
  }>;
  // Face Verification
  faceVerification: {
    status: VerificationStatus;
    verifiedAt: string | null;
    confidence?: number;
    verificationId?: string;
    imageUrl?: string | null;
    submittedAt?: string | null;
  } | null;
  // Age Verification
  ageVerified: boolean | null;
  ageVerifiedAt: string | null;
  birthDate: string | null;
  // ID Verification
  idVerificationStatus: VerificationStatus | null;
  idVerificationImageUrl: string | null;
  idVerificationVerifiedAt: string | null;
  idVerificationRejectionReason: string | null;
  faceAgeEstimate: number | null;
}

export async function fetchAllVerifications(): Promise<UserVerification[]> {
  const supabaseAdmin = getSupabaseAdmin();

  // Fetch all user profiles with verification data
  const { data: profiles, error } = await supabaseAdmin
    .from("user_profiles")
    .select(`
      user_id,
      display_name,
      emoji,
      profile_image_url,
      social_verifications,
      face_verification,
      age_verified,
      age_verified_at,
      birth_date,
      id_verification_status,
      id_verification_image_url,
      id_verification_verified_at,
      id_verification_rejection_reason,
      face_age_estimate
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[verificationRepository] fetch error", error);
    throw error;
  }

  // Fetch emails from auth.users
  const userIds = profiles?.map((p) => p.user_id) || [];
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailMap = new Map(
    authUsers?.users.map((u) => [u.id, u.email]) || []
  );

  return (profiles || []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name ?? null,
    email: emailMap.get(row.user_id) ?? null,
    emoji: row.emoji ?? null,
    profileImageUrl: row.profile_image_url ?? null,
    socialVerifications: Array.isArray(row.social_verifications)
      ? row.social_verifications
      : [],
    faceVerification: row.face_verification || null,
    ageVerified: row.age_verified ?? null,
    ageVerifiedAt: row.age_verified_at ?? null,
    birthDate: row.birth_date ?? null,
    idVerificationStatus: row.id_verification_status ?? null,
    idVerificationImageUrl: row.id_verification_image_url ?? null,
    idVerificationVerifiedAt: row.id_verification_verified_at ?? null,
    idVerificationRejectionReason: row.id_verification_rejection_reason ?? null,
    faceAgeEstimate: row.face_age_estimate ?? null,
  }));
}

export async function updateFaceVerificationStatus(
  userId: string,
  status: VerificationStatus,
  confidence?: number
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const faceVerification = {
    status,
    verifiedAt: status === "verified" ? new Date().toISOString() : null,
    confidence: confidence ?? null,
  };

  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({ face_verification: faceVerification })
    .eq("user_id", userId);

  if (error) {
    console.error("[verificationRepository] update face verification error", error);
    throw error;
  }
}

export async function getIDDocumentSignedUrl(
  userId: string,
  imageUrl: string
): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();

  // Extract bucket and path from the full URL or path
  const pathMatch = imageUrl.match(/id-verifications\/(.+)/);
  if (!pathMatch) return null;

  const path = pathMatch[1];
  const { data, error } = await supabaseAdmin.storage
    .from("id-verifications")
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    console.error("[verificationRepository] get signed URL error", error);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function verifyIDDocument(
  userId: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({
      id_verification_status: "verified",
      id_verification_verified_at: new Date().toISOString(),
      id_verification_rejection_reason: null,
      age_verified: true,
      age_verified_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[verificationRepository] verify ID document error", error);
    throw error;
  }
}

export async function rejectIDDocument(
  userId: string,
  reason: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from("user_profiles")
    .update({
      id_verification_status: "rejected",
      id_verification_rejection_reason: reason,
      id_verification_verified_at: null,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[verificationRepository] reject ID document error", error);
    throw error;
  }
}

