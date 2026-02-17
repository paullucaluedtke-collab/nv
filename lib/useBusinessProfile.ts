import { useCallback, useEffect, useState } from "react";
import type { BusinessProfile } from "@/types/business";
import { fetchBusinessProfileByUserId } from "./businessRepository";

type UseBusinessProfileResult = {
  businessProfile: BusinessProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setBusinessProfile: React.Dispatch<React.SetStateAction<BusinessProfile | null>>;
};

/**
 * Loads the current user's business profile and exposes a refresh helper.
 * Keeps the logic in one place to avoid duplicate fetches and inconsistent UI states.
 */
export function useBusinessProfile(userId: string | null | undefined): UseBusinessProfileResult {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchBusinessProfileByUserId(userId);
      setBusinessProfile(profile);
    } catch (err: any) {
      console.error("[useBusinessProfile] load error", err);
      setError(err?.message ?? "Business-Profil konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    businessProfile,
    loading,
    error,
    refresh: load,
    setBusinessProfile,
  };
}

