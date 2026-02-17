// lib/activityLogRepository.ts
import { supabase } from "./supabaseClient";

export type ActivityLogType =
  | "ACTIVITY_CREATED"
  | "ACTIVITY_JOINED"
  | "ACTIVITY_LEFT"
  | "ACTIVITY_DELETED"
  | "ACTIVITY_CLOSED"
  | "PROFILE_UPDATED"
  | "REPORT_CREATED"
  | "CHAT_MESSAGE_SENT"
  | "VERIFICATION_SUBMITTED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "BUSINESS_PROFILE_CREATED"
  | "BUSINESS_PROFILE_UPDATED"
  | "BUSINESS_OFFER_CREATED"
  | "ACTIVITY_PROMOTION_CREATED"
  | "CREDITS_PURCHASED";

export type ActivityLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  activityType: ActivityLogType;
  activityId: string | null; // ID der betroffenen Activity (falls vorhanden)
  metadata: Record<string, any> | null; // Zusätzliche Daten (z.B. Activity-Titel, Chat-Inhalt, etc.)
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

const TABLE = "activity_logs";

function mapRowToLog(row: any): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userName: row.user_name ?? null,
    userEmail: row.user_email ?? null,
    activityType: row.activity_type as ActivityLogType,
    activityId: row.activity_id ?? null,
    metadata: row.metadata ? (typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata) : null,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

type CreateLogInput = {
  userId: string | null;
  userName?: string | null;
  userEmail?: string | null;
  activityType: ActivityLogType;
  activityId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Erstellt einen neuen Activity-Log-Eintrag
 * Diese Funktion sollte nicht direkt aufgerufen werden, sondern über die Helper-Funktionen
 */
export async function createActivityLog(input: CreateLogInput): Promise<void> {
  // Versuche IP und User-Agent zu ermitteln (nur im Browser)
  const ipAddress = input.ipAddress ?? (typeof window !== "undefined" ? null : null);
  const userAgent = input.userAgent ?? (typeof window !== "undefined" ? navigator.userAgent : null);

  const payload: any = {
    user_id: input.userId,
    user_name: input.userName ?? null,
    user_email: input.userEmail ?? null,
    activity_type: input.activityType,
    activity_id: input.activityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    ip_address: ipAddress,
    user_agent: userAgent,
  };

  const { error } = await supabase.from(TABLE).insert(payload);

  if (error) {
    console.error("[activityLogRepository] createActivityLog error", error);
    // Nicht werfen, damit die Hauptfunktion nicht fehlschlägt wenn Logging fehlschlägt
    console.warn("[activityLogRepository] Failed to log activity:", input.activityType);
  }
}

/**
 * Holt alle Logs für Admin-Zwecke
 */
export async function fetchAllActivityLogs(limit: number = 1000): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[activityLogRepository] fetchAllActivityLogs error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToLog);
}

/**
 * Holt Logs für einen spezifischen User
 */
export async function fetchActivityLogsByUserId(userId: string, limit: number = 100): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[activityLogRepository] fetchActivityLogsByUserId error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToLog);
}

/**
 * Holt Logs für eine spezifische Activity
 */
export async function fetchActivityLogsByActivityId(activityId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[activityLogRepository] fetchActivityLogsByActivityId error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToLog);
}

/**
 * Filtert Logs nach Typ
 */
export async function fetchActivityLogsByType(activityType: ActivityLogType, limit: number = 500): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("activity_type", activityType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[activityLogRepository] fetchActivityLogsByType error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToLog);
}

