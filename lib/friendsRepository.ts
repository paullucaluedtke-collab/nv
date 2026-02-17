import { supabase } from "./supabaseClient";
import type { Friend, FriendWithProfile, FriendStatus } from "@/types/friend";

const TABLE = "friends";

/**
 * Mapping von DB -> Friend-Type
 */
function mapRowToFriend(row: any): Friend {
  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status: row.status,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Friend-Request senden
 */
export async function sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
  // Check if relationship already exists (both directions)
  const { data: existingData } = await supabase
    .from(TABLE)
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .limit(10);

  const existing = existingData?.find(
    (r: any) =>
      (r.user_id === userId && r.friend_id === friendId) ||
      (r.user_id === friendId && r.friend_id === userId)
  );

  if (existing) {
    // If already friends or request pending, return existing
    if (existing.status === "accepted") {
      throw new Error("Already friends");
    }
    if (existing.status === "pending") {
      throw new Error("Friend request already pending");
    }
    if (existing.status === "blocked") {
      throw new Error("Cannot send friend request");
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[friendsRepository] sendFriendRequest error", error);
    throw error;
  }

  return mapRowToFriend(data);
}

/**
 * Friend-Request akzeptieren
 */
export async function acceptFriendRequest(userId: string, friendId: string): Promise<Friend> {
  // Find the request (could be from either direction)
  const { data: existingData } = await supabase
    .from(TABLE)
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .limit(10);

  const existing = existingData?.find(
    (r: any) =>
      (r.user_id === userId && r.friend_id === friendId) ||
      (r.user_id === friendId && r.friend_id === userId)
  );

  if (!existing) {
    throw new Error("Friend request not found");
  }

  // Update status to accepted
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    console.error("[friendsRepository] acceptFriendRequest error", error);
    throw error;
  }

  return mapRowToFriend(data);
}

/**
 * Friend-Request ablehnen oder Freundschaft entfernen
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  // Find the relationship first
  const { data: existingData } = await supabase
    .from(TABLE)
    .select("id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .limit(10);

  const relationship = existingData?.find(
    (r: any) =>
      (r.user_id === userId && r.friend_id === friendId) ||
      (r.user_id === friendId && r.friend_id === userId)
  );

  if (!relationship) {
    return; // Nothing to remove
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", relationship.id);

  if (error) {
    console.error("[friendsRepository] removeFriend error", error);
    throw error;
  }
}

/**
 * Prüfen ob zwei User befreundet sind
 */
export async function areFriends(userId: string, friendId: string): Promise<boolean> {
  // Check both directions: user_id -> friend_id and friend_id -> user_id
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted")
    .limit(10);

  if (error || !data || data.length === 0) {
    return false;
  }

  // Verify the relationship is between the two users
  const relationship = data.find(
    (r: any) =>
      (r.user_id === userId && r.friend_id === friendId) ||
      (r.user_id === friendId && r.friend_id === userId)
  );

  return !!relationship;
}

/**
 * Alle Freunde eines Users holen
 */
export async function fetchFriends(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");

  if (error) {
    console.error("[friendsRepository] fetchFriends error", error);
    throw error;
  }

  // Fetch profile data for all friend IDs
  const friendIds = (data ?? []).map((row: any) => 
    row.user_id === userId ? row.friend_id : row.user_id
  );

  if (friendIds.length === 0) {
    return [];
  }

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, profile_image_url")
    .in("user_id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.user_id, p])
  );

  return (data ?? []).map((row: any) => {
    const friend = mapRowToFriend(row);
    const friendId = friend.userId === userId ? friend.friendId : friend.userId;
    const profile = profileMap.get(friendId);
    
    return {
      ...friend,
      friendDisplayName: profile?.display_name ?? null,
      friendProfileImageUrl: profile?.profile_image_url ?? null,
      userDisplayName: null,
      userProfileImageUrl: null,
    };
  });
}

/**
 * Alle ausstehenden Friend-Requests holen (empfangen)
 */
export async function fetchPendingRequests(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("friend_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("[friendsRepository] fetchPendingRequests error", error);
    throw error;
  }

  if ((data ?? []).length === 0) {
    return [];
  }

  const userIds = (data ?? []).map((row: any) => row.user_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, profile_image_url")
    .in("user_id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.user_id, p])
  );

  return (data ?? []).map((row: any) => {
    const friend = mapRowToFriend(row);
    const profile = profileMap.get(friend.userId);
    return {
      ...friend,
      friendDisplayName: profile?.display_name ?? null,
      friendProfileImageUrl: profile?.profile_image_url ?? null,
      userDisplayName: null,
      userProfileImageUrl: null,
    };
  });
}

/**
 * Alle gesendeten Friend-Requests holen
 */
export async function fetchSentRequests(userId: string): Promise<FriendWithProfile[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    console.error("[friendsRepository] fetchSentRequests error", error);
    throw error;
  }

  if ((data ?? []).length === 0) {
    return [];
  }

  const friendIds = (data ?? []).map((row: any) => row.friend_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, profile_image_url")
    .in("user_id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.user_id, p])
  );

  return (data ?? []).map((row: any) => {
    const friend = mapRowToFriend(row);
    const profile = profileMap.get(friend.friendId);
    return {
      ...friend,
      friendDisplayName: profile?.display_name ?? null,
      friendProfileImageUrl: profile?.profile_image_url ?? null,
      userDisplayName: null,
      userProfileImageUrl: null,
    };
  });
}

