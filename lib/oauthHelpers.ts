// lib/oauthHelpers.ts
/**
 * OAuth Helper Functions for Social Media Integration
 * 
 * This file contains helper functions to initiate OAuth flows
 * for Instagram, Snapchat, and Facebook.
 */

export type OAuthPlatform = "instagram" | "snapchat" | "facebook";

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * Get OAuth authorization URL for Instagram
 * 
 * Instagram Basic Display API:
 * https://developers.facebook.com/docs/instagram-basic-display-api
 */
export function getInstagramAuthUrl(config: OAuthConfig & { state?: string }): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(","),
    response_type: "code",
  });
  
  if (config.state) {
    params.set("state", config.state);
  }

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Get OAuth authorization URL for Snapchat
 * 
 * Snapchat Login Kit:
 * https://docs.snapchat.com/docs/login-kit/
 */
export function getSnapchatAuthUrl(config: OAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state: generateState(), // CSRF protection
  });

  return `https://accounts.snapchat.com/login/oauth2/authorize?${params.toString()}`;
}

/**
 * Get OAuth authorization URL for Facebook
 * 
 * Facebook Login:
 * https://developers.facebook.com/docs/facebook-login/web
 */
export function getFacebookAuthUrl(config: OAuthConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(","),
    response_type: "code",
    state: generateState(), // CSRF protection
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Store OAuth state in sessionStorage for verification
 */
export function storeOAuthState(platform: OAuthPlatform, state: string, userId: string): void {
  if (typeof window === "undefined") return;
  
  sessionStorage.setItem(`oauth_${platform}_state`, state);
  sessionStorage.setItem(`oauth_${platform}_userId`, userId);
}

/**
 * Retrieve and verify OAuth state
 */
export function verifyOAuthState(platform: OAuthPlatform, state: string): string | null {
  if (typeof window === "undefined") return null;
  
  const storedState = sessionStorage.getItem(`oauth_${platform}_state`);
  if (storedState !== state) {
    return null; // State mismatch - possible CSRF attack
  }
  
  const userId = sessionStorage.getItem(`oauth_${platform}_userId`);
  sessionStorage.removeItem(`oauth_${platform}_state`);
  sessionStorage.removeItem(`oauth_${platform}_userId`);
  
  return userId;
}

/**
 * Initiate OAuth flow by redirecting to provider
 */
export async function initiateOAuthFlow(
  platform: OAuthPlatform,
  userId: string
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("OAuth flow can only be initiated in the browser");
  }

  // Get environment variables for OAuth credentials
  const env = {
    instagram: {
      clientId: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || "",
      redirectUri: `${window.location.origin}/api/oauth/instagram/callback`,
      scopes: ["user_profile", "user_media"],
    },
    snapchat: {
      clientId: process.env.NEXT_PUBLIC_SNAPCHAT_CLIENT_ID || "",
      redirectUri: `${window.location.origin}/api/oauth/snapchat/callback`,
      scopes: ["user.external_id", "user.display_name", "user.bitmoji.avatar"],
    },
    facebook: {
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
      redirectUri: `${window.location.origin}/api/oauth/facebook/callback`,
      scopes: ["public_profile", "email"],
    },
  };

  const config = env[platform];
  
  if (!config.clientId) {
    throw new Error(`${platform} OAuth is not configured. Please set NEXT_PUBLIC_${platform.toUpperCase()}_CLIENT_ID`);
  }

  let authUrl: string;
  const state = generateState();
  storeOAuthState(platform, state, userId);

  switch (platform) {
    case "instagram":
      authUrl = getInstagramAuthUrl({ ...config, state });
      break;
    case "snapchat":
      authUrl = getSnapchatAuthUrl(config);
      break;
    case "facebook":
      authUrl = getFacebookAuthUrl(config);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Redirect to OAuth provider
  window.location.href = authUrl;
}

