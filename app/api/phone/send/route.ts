import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  phone: z.string().min(6).max(30),
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { phone, userId } = bodySchema.parse(json);

    // Send OTP via Supabase (server-side, no client session touched)
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone,
      options: {
        // Allow creation if the phone is not yet linked; trust update happens after verify
        shouldCreateUser: true,
        channel: "sms",
      },
    });

    if (error) {
      console.error("[phone/send] send otp error", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    console.error("[phone/send] unexpected error", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

