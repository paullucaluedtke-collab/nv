import { NextRequest, NextResponse } from "next/server";
import { removeFriend } from "@/lib/friendsRepository";

export async function POST(request: NextRequest) {
  try {
    const { userId, friendId } = await request.json();

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: "userId and friendId are required" },
        { status: 400 }
      );
    }

    await removeFriend(userId, friendId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/friends/remove] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove friend" },
      { status: 500 }
    );
  }
}

