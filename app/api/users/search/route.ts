import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search by username (case-insensitive) or display name
    const searchTerm = query.trim().toLowerCase();
    
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, profile_image_url")
      .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error("[api/users/search] error", error);
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: (data ?? []).map((user: any) => ({
        userId: user.user_id,
        displayName: user.display_name,
        username: user.username,
        profileImageUrl: user.profile_image_url,
      })),
    });
  } catch (error: any) {
    console.error("[api/users/search] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to search users" },
      { status: 500 }
    );
  }
}

