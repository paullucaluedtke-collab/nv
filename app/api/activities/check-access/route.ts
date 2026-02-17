import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { areFriends } from "@/lib/friendsRepository";

export async function POST(request: NextRequest) {
  try {
    const { activityId, userId, password } = await request.json();

    if (!activityId || !userId) {
      return NextResponse.json(
        { error: "activityId and userId are required" },
        { status: 400 }
      );
    }

    // Fetch activity
    const { data: activity, error } = await supabase
      .from("activities")
      .select("host_user_id, visibility, password")
      .eq("id", activityId)
      .single();

    if (error || !activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    // If user is the host, always allow
    if (activity.host_user_id === userId) {
      return NextResponse.json({ canJoin: true });
    }

    // Check visibility
    if (activity.visibility === "public") {
      // Public activities: only check password if set
      if (activity.password) {
        return NextResponse.json({
          canJoin: activity.password === password,
          requiresPassword: true,
        });
      }
      return NextResponse.json({ canJoin: true });
    }

    if (activity.visibility === "friends") {
      // Friends-only: check if user is friends with host
      const isFriend = await areFriends(userId, activity.host_user_id);
      
      if (!isFriend) {
        return NextResponse.json({
          canJoin: false,
          requiresFriendship: true,
        });
      }

      // If password is also set, check it
      if (activity.password) {
        return NextResponse.json({
          canJoin: activity.password === password,
          requiresPassword: true,
        });
      }

      return NextResponse.json({ canJoin: true });
    }

    if (activity.visibility === "private") {
      // Private: requires password
      if (!activity.password) {
        return NextResponse.json({
          canJoin: false,
          requiresPassword: true,
        });
      }

      return NextResponse.json({
        canJoin: activity.password === password,
        requiresPassword: true,
      });
    }

    return NextResponse.json({ canJoin: false });
  } catch (error: any) {
    console.error("[api/activities/check-access] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to check access" },
      { status: 500 }
    );
  }
}

