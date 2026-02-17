import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { updateSocialVerification } from "@/lib/trustRepository";

const bodySchema = z.object({
  phone: z.string().min(6).max(30),
  token: z.string().min(4).max(10),
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { phone, token, userId } = bodySchema.parse(json);

    // Verify OTP (server-side, isolated session)
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      console.error("[phone/verify] verify otp error", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update trust profile
    await updateSocialVerification(userId, "phone", {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      phoneNumber: phone,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[phone/verify] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

