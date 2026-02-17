"use server";

import {
    saveActivity,
    joinActivity,
    leaveActivity,
    deleteActivity,
    closeActivity,
} from "@/lib/activitiesRepository";
import type { Activity } from "@/types/activity";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Create/Update Activity
export async function createActivityAction(activity: Activity): Promise<Activity> {
    try {
        const admin = getSupabaseAdmin();
        const result = await saveActivity(activity, admin);
        return result;
    } catch (error) {
        console.error("[createActivityAction] Error:", error);
        throw new Error("Failed to create activity");
    }
}

// Join Activity
export async function joinActivityAction(activity: Activity, userId: string): Promise<Activity> {
    try {
        const admin = getSupabaseAdmin();
        const result = await joinActivity(activity, userId, admin);
        return result;
    } catch (error) {
        console.error("[joinActivityAction] Error:", error);
        throw new Error("Failed to join activity");
    }
}

// Leave Activity
export async function leaveActivityAction(activity: Activity, userId: string): Promise<Activity> {
    try {
        const admin = getSupabaseAdmin();
        const result = await leaveActivity(activity, userId, admin);
        return result;
    } catch (error) {
        console.error("[leaveActivityAction] Error:", error);
        throw new Error("Failed to leave activity");
    }
}

// Delete Activity
export async function deleteActivityAction(activityId: string, userId: string): Promise<void> {
    try {
        const admin = getSupabaseAdmin();
        await deleteActivity(activityId, userId, admin);
    } catch (error) {
        console.error("[deleteActivityAction] Error:", error);
        throw new Error("Failed to delete activity");
    }
}

// Close/End Activity
export async function closeActivityAction(activityId: string, userId: string): Promise<void> {
    try {
        const admin = getSupabaseAdmin();
        await closeActivity(activityId, userId, admin);
    } catch (error) {
        console.error("[closeActivityAction] Error:", error);
        throw new Error("Failed to close activity");
    }
}
