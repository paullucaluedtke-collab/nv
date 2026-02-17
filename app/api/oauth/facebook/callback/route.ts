// app/api/oauth/facebook/callback/route.ts
/**
 * Facebook OAuth Callback Handler
 * 
 * This route handles the OAuth callback from Facebook after user authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { updateSocialVerification } from "@/lib/trustRepository";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[Facebook OAuth] Error:", error);
    return NextResponse.redirect(
      new URL(`/?oauth_error=facebook&message=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?oauth_error=facebook&message=missing_code_or_state", request.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Using URLSearchParams for GET request
    });

    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID || "");
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET || "");
    tokenUrl.searchParams.set("redirect_uri", `${request.nextUrl.origin}/api/oauth/facebook/callback`);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json();
      console.error("[Facebook OAuth] Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(`/?oauth_error=facebook&message=token_exchange_failed`, request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token } = tokenData;

    // Fetch user profile from Facebook
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${access_token}`
    );

    if (!profileResponse.ok) {
      console.error("[Facebook OAuth] Profile fetch failed");
      return NextResponse.redirect(
        new URL(`/?oauth_error=facebook&message=profile_fetch_failed`, request.url)
      );
    }

    const profileData = await profileResponse.json();
    const userId = request.cookies.get("oauth_user_id")?.value;

    if (!userId) {
      return NextResponse.redirect(
        new URL("/?oauth_error=facebook&message=user_not_found", request.url)
      );
    }

    // Update trust profile
    await updateSocialVerification(userId, "facebook", {
      status: "verified",
      verifiedAt: new Date().toISOString(),
      username: profileData.name,
    });

    return NextResponse.redirect(
      new URL(`/?oauth_success=facebook&username=${encodeURIComponent(profileData.name || "")}`, request.url)
    );
  } catch (err) {
    console.error("[Facebook OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL(`/?oauth_error=facebook&message=unexpected_error`, request.url)
    );
  }
}

