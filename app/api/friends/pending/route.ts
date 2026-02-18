import { NextRequest, NextResponse } from "next/server";
import { fetchPendingRequests } from "@/lib/friendsRepository";

export const dynamic = 'force-dynamic';

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

    const requests = await fetchPendingRequests(userId);

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("[api/friends/pending] error", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending requests" },
      { status: 500 }
    );
  }
}

