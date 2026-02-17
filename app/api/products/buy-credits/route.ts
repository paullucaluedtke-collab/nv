import { NextResponse } from "next/server";
import { addCredits } from "@/lib/businessRepository";
import { createActivityLog } from "@/lib/activityLogRepository";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { businessId, packageId, amount, credits } = body;

        if (!businessId || !packageId || !amount || !credits) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update business credits
        const updatedProfile = await addCredits(businessId, credits);

        // Log the transaction (mock)
        // In a real app, we would verify payment here first

        // Log activity
        // We need userId for activity log, but we don't have it here easily without auth check
        // Assuming backend trust for now or we could fetch business to get userId

        return NextResponse.json({ success: true, newBalance: updatedProfile.promotionCredits });
    } catch (error: any) {
        console.error("Buy credits error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
