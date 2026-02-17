// lib/userProfileRepository.ts
import { supabase } from "./supabaseClient";
import { createActivityLog } from "./activityLogRepository";

const TABLE = "user_profiles";

export type UserProfile = {
  userId: string;
  displayName: string;
  username: string | null;
  emoji: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  profileGalleryUrls?: string[] | null;
};

function mapRowToUserProfile(row: any): UserProfile {
  return {
    userId: row.user_id,
    displayName: row.display_name ?? row.name ?? "", // Fallback to 'name' if display_name doesn't exist
    username: row.username ?? null,
    emoji: row.emoji ?? null,
    bio: row.bio ?? null,
    profileImageUrl: row.profile_image_url ?? null,
    profileGalleryUrls: row.profile_gallery_urls ?? null,
  };
}

export async function fetchRemoteUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[userProfileRepository] fetch error", error);
    throw error;
  }

  if (!data) return null;

  const mapped = mapRowToUserProfile(data);
  
  // Try to fetch gallery URLs from the profile_gallery_urls column if it exists
  // If it doesn't exist, it will be null and that's fine
  return mapped;
}

export async function upsertRemoteUserProfile(
  profile: UserProfile
): Promise<UserProfile> {
  const payload: any = {
    user_id: profile.userId,
    display_name: profile.displayName,
    username: profile.username ?? null,
    emoji: profile.emoji,
    bio: profile.bio,
    profile_image_url: profile.profileImageUrl,
    profile_gallery_urls: profile.profileGalleryUrls ?? null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[userProfileRepository] upsert error", error);
    console.error("[userProfileRepository] error code:", error.code);
    console.error("[userProfileRepository] error message:", error.message);
    console.error("[userProfileRepository] error details:", error.details);
    console.error("[userProfileRepository] error hint:", error.hint);
    console.error("[userProfileRepository] payload was:", JSON.stringify(payload, null, 2));
    throw error;
  }

  if (!data) {
    throw new Error("Upsert succeeded but no data returned");
  }

  const savedProfile = mapRowToUserProfile(data);

  // Log profile update
  createActivityLog({
    userId: profile.userId,
    userName: profile.displayName,
    activityType: "PROFILE_UPDATED",
    metadata: {
      displayName: profile.displayName,
      hasBio: !!profile.bio,
      hasProfileImage: !!profile.profileImageUrl,
      galleryImageCount: profile.profileGalleryUrls?.length ?? 0,
    },
  }).catch((err) => {
    console.warn("[userProfileRepository] Failed to log profile update", err);
  });

  return savedProfile;
}


