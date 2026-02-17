import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendFriendRequest } from "@/lib/friendsRepository";

export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json();

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: "userId and friendId are required" },
        { status: 400 }
      );
    }

    if (userId === friendId) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 }
      );
    }

    const friend = await sendFriendRequest(userId, friendId);

    return NextResponse.json({ friend });
  } catch (error: any) {
    console.error("[api/friends/request] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to send friend request" },
      { status: 500 }
    );
  }
}

