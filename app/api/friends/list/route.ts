import { NextRequest, NextResponse } from "next/server";
import { fetchFriends } from "@/lib/friendsRepository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const friends = await fetchFriends(userId);

    return NextResponse.json({ friends });
  } catch (error: any) {
    console.error("[api/friends/list] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

