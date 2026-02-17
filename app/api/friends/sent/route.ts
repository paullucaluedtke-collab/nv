import { NextRequest, NextResponse } from "next/server";
import { fetchSentRequests } from "@/lib/friendsRepository";

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

    const requests = await fetchSentRequests(userId);

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("[api/friends/sent] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sent requests" },
      { status: 500 }
    );
  }
}

