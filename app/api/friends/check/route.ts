import { NextRequest, NextResponse } from "next/server";
import { areFriends } from "@/lib/friendsRepository";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const friendId = searchParams.get("friendId");

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: "userId and friendId are required" },
        { status: 400 }
      );
    }

    const isFriend = await areFriends(userId, friendId);

    return NextResponse.json({ areFriends: isFriend });
  } catch (error: any) {
    console.error("[api/friends/check] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to check friendship" },
      { status: 500 }
    );
  }
}

