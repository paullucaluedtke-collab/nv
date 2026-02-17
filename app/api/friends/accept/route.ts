import { NextRequest, NextResponse } from "next/server";
import { acceptFriendRequest } from "@/lib/friendsRepository";

export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json();

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: "userId and friendId are required" },
        { status: 400 }
      );
    }

    const friend = await acceptFriendRequest(userId, friendId);

    return NextResponse.json({ friend });
  } catch (error: any) {
    console.error("[api/friends/accept] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept friend request" },
      { status: 500 }
    );
  }
}

