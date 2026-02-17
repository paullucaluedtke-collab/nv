// app/auth/callback/route.ts
/**
 * Supabase Auth Callback Handler
 * 
 * Diese Route verarbeitet OAuth-Callbacks von Supabase Auth.
 * Nach erfolgreicher Authentifizierung wird der Benutzer zur Hauptseite weitergeleitet.
 * Wenn link_account=true, wird Facebook, Google oder Apple mit dem bestehenden Account verknüpft.
 * Wenn trust_only=true (für Apple), wird nur das Trust-Profil aktualisiert, nicht die Session.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateSocialVerification } from "@/lib/trustRepository";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const linkAccount = requestUrl.searchParams.get("link_account") === "true";
  const trustOnly = requestUrl.searchParams.get("trust_only") === "true";
  const userIdFromQuery = requestUrl.searchParams.get("user_id");

  if (code) {
    // Create a Supabase client to exchange the code for a session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Exchange the code for a session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error);
      // Redirect to home with error
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, request.url));
    }

    // If linking account, update trust profile
    // Since Supabase automatically links identities with the same email,
    // we can use the session user ID directly
    // For Apple with trust_only=true, we only update trust, not the session
    if (linkAccount && session?.user) {
      try {
        // Get the original user ID from cookie or query parameter, fallback to session user ID
        const facebookUserId = request.cookies.get("link_facebook_user_id")?.value;
        const googleUserId = request.cookies.get("link_google_user_id")?.value;
        const originalUserId = facebookUserId || googleUserId || userIdFromQuery;
        
        const targetUserId = originalUserId || session.user.id;
        
        // Determine which provider was used
        const identities = session.user.identities || [];
        const googleIdentity = identities.find((id: any) => id.provider === "google");
        const facebookIdentity = identities.find((id: any) => id.provider === "facebook");
        
        const provider = googleIdentity ? "google" : facebookIdentity ? "facebook" : null;
        
        if (!provider) {
          console.warn("[Auth Callback] No provider identity found in session");
        }
        
        console.log(`[Auth Callback] Linking ${provider || "unknown"} account`);
        console.log("[Auth Callback] Original user ID from cookie/query:", originalUserId);
        console.log("[Auth Callback] Session user ID:", session.user.id);
        console.log("[Auth Callback] Target user ID for trust update:", targetUserId);
        console.log("[Auth Callback] Session identities:", JSON.stringify(session.user.identities, null, 2));
        
        // Always try to update trust profile if we have a target user ID
        // Check if user profile exists first
        const { data: existingProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, social_verifications")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("[Auth Callback] Error checking user profile:", profileError);
        }

        if (!existingProfile) {
          console.warn("[Auth Callback] User profile does not exist, creating it first");
          // Create user profile if it doesn't exist
          const { error: createError } = await supabase
            .from("user_profiles")
            .insert({
              user_id: targetUserId,
              trust_level: "unverified",
              trust_score: 0,
              social_verifications: [],
              face_verification: null,
            });

          if (createError) {
            console.error("[Auth Callback] Error creating user profile:", createError);
          }
        }

        if (provider) {
          try {
            console.log(`[Auth Callback] Updating trust profile for user:`, targetUserId, `with provider:`, provider);
            
            // Update trust profile with provider verification
            await updateSocialVerification(targetUserId, provider, {
              status: "verified",
              verifiedAt: new Date().toISOString(),
              username: session.user.user_metadata?.full_name || session.user.email || undefined,
            });

            console.log("[Auth Callback] Trust profile updated successfully for user:", targetUserId);

            // Verify the update worked
            const { data: updatedProfile } = await supabase
              .from("user_profiles")
              .select("social_verifications, trust_score, trust_level")
              .eq("user_id", targetUserId)
              .single();

            console.log("[Auth Callback] Updated profile data:", JSON.stringify(updatedProfile, null, 2));

            // Clear the cookies
            const response = NextResponse.redirect(
              new URL(`/?oauth_success=${provider}&linked=true&user_id=${targetUserId}`, request.url)
            );
            response.cookies.delete("link_facebook_user_id");
            response.cookies.delete("link_google_user_id");
            
            return response;
          } catch (updateError: any) {
            console.error("[Auth Callback] Error updating trust profile:", updateError);
            console.error("[Auth Callback] Error details:", JSON.stringify(updateError, null, 2));
            console.error("[Auth Callback] Error stack:", updateError?.stack);
            
            // Still redirect but with error info
            const response = NextResponse.redirect(
              new URL(`/?oauth_success=${provider}&linked=true&error=trust_update_failed&message=${encodeURIComponent(updateError?.message || String(updateError))}`, request.url)
            );
            response.cookies.delete("link_facebook_user_id");
            response.cookies.delete("link_google_user_id");
            response.cookies.delete("link_apple_user_id");
            return response;
          }
        } else {
          console.warn("[Auth Callback] No provider found, redirecting without trust update");
          const response = NextResponse.redirect(
            new URL(`/?oauth_success=unknown&linked=true&user_id=${targetUserId}`, request.url)
          );
          response.cookies.delete("link_facebook_user_id");
          response.cookies.delete("link_google_user_id");
          response.cookies.delete("link_apple_user_id");
          return response;
        }
      } catch (err: any) {
        console.error("[Auth Callback] Unexpected error:", err);
        console.error("[Auth Callback] Error details:", JSON.stringify(err, null, 2));
        // Redirect with error but don't break the flow
        return NextResponse.redirect(
          new URL(`/?auth_error=trust_update_failed&message=${encodeURIComponent(err?.message || String(err))}`, request.url)
        );
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, request.url));
}

