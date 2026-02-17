import { supabase } from "./supabaseClient";
import type { Activity } from "@/types/activity";
import { createActivityLog } from "./activityLogRepository";
import { onActivityCreated, onActivityJoined } from "./gamificationRepository";

const TABLE = "activities";

/**
 * Mapping von DB -> Activity-Type
 * 
 * DB-Spalten: id, title, description, location_name, latitude, longitude,
 *             host_user_id, joined_user_ids, category, visibility, host_name,
 *             start_time, end_time, is_closed
 * 
 * Note: 'time' column does not exist in DB (deprecated, use start_time/end_time)
 */
function mapRowToActivity(row: any): Activity {
  const hostUserId = row.host_user_id ?? row.host_id ?? null;
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    time: row.time ?? "",
    locationName: row.location_name ?? "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    hostId: hostUserId ?? "", // deprecated, für Kompatibilität
    hostUserId: hostUserId, // primär
    hostName: row.host_name ?? "Host",
    visibility: row.visibility ?? "public",
    category: row.category ?? "Other",
    joinedUserIds: row.joined_user_ids ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    isClosed: row.is_closed ?? false,
    // Business fields
    businessId: row.business_id ?? null,
    isBusinessActivity: row.is_business_activity ?? false,
    promotionLevel: row.promotion_level ?? "none",
    // Access control
    password: row.password ?? null,
    maxParticipants: row.max_participants ?? null,
  };
}

/**
 * Alle Activities holen
 */
export async function fetchActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("id", { ascending: false }); // Sortiere nach id, da created_at nicht existiert

  if (error) {
    console.error("[activitiesRepository] fetchActivities error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToActivity);
}

/**
 * Eine Activity speichern (insert oder update)
 * 
 * Verwendet nur die tatsächlich vorhandenen DB-Spalten:
 * id, title, description, location_name, latitude, longitude,
 * host_user_id, joined_user_ids, category, visibility, host_name,
 * start_time, end_time, is_closed
 * 
 * Note: 'time' column does not exist in DB (deprecated, use start_time/end_time)
 */
export async function saveActivity(activity: Activity, customClient?: any): Promise<Activity> {
  // Verwende hostUserId (primär) oder hostId (Fallback für Kompatibilität)
  const hostUserId = activity.hostUserId ?? activity.hostId ?? null;

  // Build payload - only include fields that exist in the database
  // Based on errors, time, is_host and is_joined don't exist in DB
  const payload: any = {
    title: activity.title,
    description: activity.description || "",
    location_name: activity.locationName,
    latitude: activity.latitude,
    longitude: activity.longitude,
    host_user_id: hostUserId,
    joined_user_ids: activity.joinedUserIds ?? [],
  };

  // Only include id if it's a valid UUID (not empty string)
  if (activity.id && activity.id.trim() !== "" && activity.id !== "undefined" && !activity.id.startsWith("temp-")) {
    payload.id = activity.id;
  }

  // Include optional fields if they exist
  if (activity.startTime) {
    payload.start_time = activity.startTime;
  }
  if (activity.endTime) {
    payload.end_time = activity.endTime;
  }
  if (activity.isClosed !== undefined && activity.isClosed !== null) {
    payload.is_closed = activity.isClosed;
  }

  // Include category and visibility if they exist in the activity
  if (activity.category) {
    payload.category = activity.category;
  }
  if (activity.visibility) {
    payload.visibility = activity.visibility;
  }
  if (activity.hostName) {
    payload.host_name = activity.hostName;
  }

  // Include business fields if they exist
  if (activity.businessId) {
    payload.business_id = activity.businessId;
  }
  if (activity.isBusinessActivity !== undefined) {
    payload.is_business_activity = activity.isBusinessActivity;
  }
  if (activity.promotionLevel) {
    payload.promotion_level = activity.promotionLevel;
  }

  // Include password if it exists (can be empty string to clear password)
  if (activity.password !== undefined) {
    payload.password = activity.password || null;
  }

  // Include maxParticipants if it exists
  if (activity.maxParticipants !== undefined) {
    payload.max_participants = activity.maxParticipants || null;
  }



  // Use insert for new activities (no id), update for existing ones
  const client = customClient || supabase;
  let query;
  if (payload.id) {
    query = client
      .from(TABLE)
      .upsert(payload, { onConflict: "id" });
  } else {
    query = client
      .from(TABLE)
      .insert(payload);
  }

  const { data, error } = await query
    .select()
    .single();

  if (error) {
    console.error("[activitiesRepository] saveActivity error", error);
    console.error("[activitiesRepository] error details:", JSON.stringify(error, null, 2));
    throw error;
  }

  const savedActivity = mapRowToActivity(data);

  // Log activity creation
  if (!payload.id) {
    // Only log if it's a new activity (not an update)
    createActivityLog({
      userId: hostUserId ?? null,
      userName: activity.hostName ?? null,
      activityType: "ACTIVITY_CREATED",
      activityId: savedActivity.id,
      metadata: {
        title: activity.title,
        category: activity.category,
        visibility: activity.visibility,
        locationName: activity.locationName,
      },
    }).catch((err) => {
      console.warn("[activitiesRepository] Failed to log activity creation", err);
    });

    // Award points for creating activity
    if (hostUserId) {
      onActivityCreated(hostUserId, savedActivity.id).catch((err) => {
        console.warn("[activitiesRepository] Failed to award points for activity creation", err);
      });
    }
  }

  return savedActivity;
}

/**
 * User einer Activity beitreten
 */
export async function joinActivity(activity: Activity, userId: string, customClient?: any): Promise<Activity> {
  const existing = new Set(activity.joinedUserIds ?? []);
  existing.add(userId);
  const updatedJoinedUserIds = Array.from(existing);

  const client = customClient || supabase;

  const { data, error } = await client
    .from(TABLE)
    .update({ joined_user_ids: updatedJoinedUserIds })
    .eq("id", activity.id)
    .select("*")
    .single();

  if (error) {
    console.error("[activitiesRepository] joinActivity error", error);
    throw error;
  }

  const updatedActivity = mapRowToActivity(data);

  // Log activity join
  createActivityLog({
    userId,
    activityType: "ACTIVITY_JOINED",
    activityId: activity.id,
    metadata: {
      activityTitle: activity.title,
    },
  }).catch((err) => {
    console.warn("[activitiesRepository] Failed to log activity join", err);
  });

  // Award points for joining activity
  onActivityJoined(userId, activity.id).catch((err) => {
    console.warn("[activitiesRepository] Failed to award points for activity join", err);
  });

  return updatedActivity;
}

/**
 * User eine Activity verlassen
 */
export async function leaveActivity(activity: Activity, userId: string, customClient?: any): Promise<Activity> {
  const updatedJoinedUserIds = (activity.joinedUserIds ?? []).filter(
    (id) => id !== userId
  );

  const client = customClient || supabase;

  const { data, error } = await client
    .from(TABLE)
    .update({ joined_user_ids: updatedJoinedUserIds })
    .eq("id", activity.id)
    .select("*")
    .single();

  if (error) {
    console.error("[activitiesRepository] leaveActivity error", error);
    throw error;
  }

  const updatedActivity = mapRowToActivity(data);

  // Log activity leave
  createActivityLog({
    userId,
    activityType: "ACTIVITY_LEFT",
    activityId: activity.id,
    metadata: {
      activityTitle: activity.title,
    },
  }).catch((err) => {
    console.warn("[activitiesRepository] Failed to log activity leave", err);
  });

  return updatedActivity;
}

/**
 * Activity löschen
 */
export async function deleteActivity(id: string, userId?: string, customClient?: any): Promise<void> {
  const client = customClient || supabase;

  // Fetch activity before deleting to get metadata for logging
  let activityTitle: string | null = null;
  try {
    const { data } = await client.from(TABLE).select("title, host_user_id").eq("id", id).single();
    if (data) {
      activityTitle = data.title;
    }
  } catch (err) {
    // Ignore errors when fetching for logging
  }

  const { error } = await client.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[activitiesRepository] deleteActivity error", error);
    throw error;
  }

  // Log activity deletion
  createActivityLog({
    userId: userId ?? null,
    activityType: "ACTIVITY_DELETED",
    activityId: id,
    metadata: {
      activityTitle: activityTitle,
    },
  }).catch((err) => {
    console.warn("[activitiesRepository] Failed to log activity deletion", err);
  });
}

/**
 * Activity beenden (is_closed = true setzen)
 */
export async function closeActivity(activityId: string, userId?: string, customClient?: any): Promise<void> {
  const client = customClient || supabase;

  // Fetch activity before closing to get metadata for logging
  let activityTitle: string | null = null;
  try {
    const { data } = await client.from(TABLE).select("title").eq("id", activityId).single();
    if (data) {
      activityTitle = data.title;
    }
  } catch (err) {
    // Ignore errors when fetching for logging
  }

  const { error } = await client
    .from(TABLE)
    .update({ is_closed: true })
    .eq("id", activityId);

  if (error) {
    console.error("[activitiesRepository] closeActivity error", error);
    throw error;
  }

  // Log activity closure
  createActivityLog({
    userId: userId ?? null,
    activityType: "ACTIVITY_CLOSED",
    activityId: activityId,
    metadata: {
      activityTitle: activityTitle,
    },
  }).catch((err) => {
    console.warn("[activitiesRepository] Failed to log activity closure", err);
  });
}

/**
 * Alle Activities für Admin-Zwecke holen (inkl. host_user_id)
 */
export async function fetchAllActivitiesForAdmin(): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("[activitiesRepository] fetchAllActivitiesForAdmin error", error);
    throw error;
  }

  return data ?? [];
}
