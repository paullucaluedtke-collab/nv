// lib/reportRepository.ts
import { supabase } from "./supabaseClient";
import { createActivityLog } from "./activityLogRepository";

export type CreateReportInput = {
  activityId: string | null;
  reportedUserId: string | null;
  reporterUserId: string;
  reason: string;
  comment?: string | null;
};

export type ReportStatus = "open" | "reviewed" | "dismissed";

export type Report = {
  id: string;
  createdAt: string;
  activityId: string | null;
  reportedUserId: string | null;
  reporterUserId: string | null;
  reason: string;
  comment: string | null;
  status: ReportStatus;
};

const TABLE = "reports";

function mapRowToReport(row: any): Report {
  return {
    id: row.id,
    createdAt: row.created_at,
    activityId: row.activity_id ?? null,
    reportedUserId: row.reported_user_id ?? null,
    reporterUserId: row.reporter_user_id ?? null,
    reason: row.reason,
    comment: row.comment ?? null,
    status: (row.status ?? "open") as ReportStatus,
  };
}

export async function createReport(input: CreateReportInput): Promise<void> {
  const payload = {
    activity_id: input.activityId,
    reported_user_id: input.reportedUserId,
    reporter_user_id: input.reporterUserId,
    reason: input.reason,
    comment: input.comment ?? null,
  };

  const { error } = await supabase.from(TABLE).insert(payload);

  if (error) {
    console.error("[reportRepository] createReport error", error);
    throw error;
  }

  // Log report creation
  createActivityLog({
    userId: input.reporterUserId,
    activityType: "REPORT_CREATED",
    activityId: input.activityId ?? null,
    metadata: {
      reason: input.reason,
      reportedUserId: input.reportedUserId,
      hasComment: !!input.comment,
    },
  }).catch((err) => {
    console.warn("[reportRepository] Failed to log report creation", err);
  });
}

export async function fetchAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reportRepository] fetchAllReports error", error);
    throw error;
  }

  return (data ?? []).map(mapRowToReport);
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq("id", reportId);

  if (error) {
    console.error("[reportRepository] updateReportStatus error", error);
    throw error;
  }
}

