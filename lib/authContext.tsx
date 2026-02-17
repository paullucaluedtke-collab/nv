"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "./supabaseClient";

export type AuthUser = {
  id: string;
  email: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithFacebook: () => Promise<{ error?: string }>;
  linkFacebookAccount: (redirectTo?: string, userId?: string) => Promise<{ error?: string }>;
  linkGoogleAccount: (redirectTo?: string, userId?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("[Auth] signUp error", error);
        return { error: error.message };
      }
      return {};
    },
    []
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[Auth] signIn error", error);
        return { error: error.message };
      }
      return {};
    },
    []
  );

  const signInWithFacebook = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email public_profile",
      },
    });
    if (error) {
      console.error("[Auth] Facebook signIn error", error);
      return { error: error.message };
    }
    return {};
  }, []);

  const linkFacebookAccount = useCallback(async (redirectTo?: string, userId?: string) => {
    // Store current user ID in cookie for server-side access
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = userId || session?.user?.id;
    
    if (currentUserId) {
      // Store in cookie for callback handler
      document.cookie = `link_facebook_user_id=${currentUserId}; path=/; max-age=600; SameSite=Lax`;
      // Also store in sessionStorage as backup
      sessionStorage.setItem("link_facebook_user_id", currentUserId);
    }

    const finalRedirectTo = redirectTo || `${window.location.origin}/auth/callback?link_account=true&user_id=${encodeURIComponent(currentUserId || "")}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: finalRedirectTo,
        scopes: "email public_profile",
      },
    });
    if (error) {
      console.error("[Auth] Facebook link error", error);
      return { error: error.message };
    }
    return {};
  }, []);

  const linkGoogleAccount = useCallback(async (redirectTo?: string, userId?: string) => {
    // Store current user ID in cookie for server-side access
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = userId || session?.user?.id;
    
    if (currentUserId) {
      // Store in cookie for callback handler
      document.cookie = `link_google_user_id=${currentUserId}; path=/; max-age=600; SameSite=Lax`;
      // Also store in sessionStorage as backup
      sessionStorage.setItem("link_google_user_id", currentUserId);
    }

    const finalRedirectTo = redirectTo || `${window.location.origin}/auth/callback?link_account=true&user_id=${encodeURIComponent(currentUserId || "")}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: finalRedirectTo,
        scopes: "email profile",
      },
    });
    if (error) {
      console.error("[Auth] Google link error", error);
      return { error: error.message };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithFacebook,
    linkFacebookAccount,
    linkGoogleAccount,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

