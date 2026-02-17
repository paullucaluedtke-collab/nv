// components/UserProfileSheet.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import type { UserProfile } from "@/lib/userProfileRepository";
import { fetchRemoteUserProfile } from "@/lib/userProfileRepository";
import { DEFAULT_EMOJI } from "@/lib/constants";
import TrustBadge from "./TrustBadge";
import { fetchTrustProfile } from "@/lib/trustRepository";
import type { TrustProfile, SocialVerification, VerificationStatus } from "@/types/trust";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function UserProfileSheet({ userId, isOpen, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trust, setTrust] = useState<TrustProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [remote, trustProfile, verificationData] = await Promise.all([
          fetchRemoteUserProfile(userId),
          fetchTrustProfile(userId),
          supabase
            .from("user_profiles")
            .select("birth_date, age_verified")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);
        if (!cancelled) {
          // Gallery URLs are now loaded from database via fetchRemoteUserProfile
          if (remote) {
            console.log("[UserProfileSheet] Loaded profile with gallery URLs:", remote.profileGalleryUrls);
          }
          setProfile(remote);
          setTrust(trustProfile);
          if (verificationData.data) {
            setBirthDate(verificationData.data.birth_date ?? null);
            setAgeVerified(verificationData.data.age_verified ?? null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  // All hooks must be called before any early returns
  const profileImageUrl = profile?.profileImageUrl ?? null;
  const gallery = useMemo(() => {
    if (!profile) return [];
    // Get gallery URLs - prioritize profileGalleryUrls, but don't include profileImageUrl in gallery
    const urls = profile.profileGalleryUrls?.filter(Boolean) ?? [];
    // Only return gallery URLs, not the profile image itself
    return urls.slice(0, 5);
  }, [profile?.profileGalleryUrls]);

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      const ageYears = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? ageYears - 1 : ageYears;
      return actualAge > 0 && actualAge < 120 ? actualAge : null;
    } catch {
      return null;
    }
  }, [birthDate]);

  // Early return after all hooks
  if (!isOpen) return null;

  const name = profile?.displayName ?? "nearvibe Nutzer";
  const bio = profile?.bio || "Keine Beschreibung vorhanden.";
  const initials = name.trim()[0]?.toUpperCase() ?? "N";

  const socialVerifications = trust?.socialVerifications ?? [];

  const renderVerificationPills = (verifications: SocialVerification[]) => {
    if (!verifications.length) {
      return <span className="text-xs text-white/60">Keine Verifikationen vorhanden.</span>;
    }
    const statusLabel = (status: VerificationStatus) =>
      status === "verified" ? "verifiziert" : status === "pending" ? "ausstehend" : "nicht verifiziert";
    const platformLabel = (platform: SocialVerification["platform"]) =>
      platform === "phone" ? "Telefon" : platform === "google" ? "Google" : "Facebook";

    return (
      <div className="flex flex-wrap gap-1.5">
        {verifications.map((v) => (
          <span
            key={v.platform}
            className={clsx(
              "px-2 py-1 rounded-full text-[10px] border",
              v.status === "verified"
                ? "bg-green-500/15 text-green-300 border-green-500/30"
                : v.status === "pending"
                  ? "bg-yellow-500/15 text-yellow-200 border-yellow-500/30"
                  : "bg-white/5 text-white/60 border-white/15"
            )}
          >
            {platformLabel(v.platform)} • {statusLabel(v.status)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Profile Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="profile-backdrop"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              role="button"
              aria-label="Profil schließen"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                  onClose();
                }
              }}
            />
            <motion.div
              key="profile-sheet"
              className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-sheet-title"
            >
              <div
                className="w-full max-w-md rounded-t-3xl bg-void-card border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] pointer-events-auto max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative p-4 sm:p-6">
                  {/* Decorative Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-full mt-2" />

                  <div className="flex items-center justify-between mb-6 gap-3 pt-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-xl sm:text-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/20">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white/80">{initials}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span id="profile-sheet-title" className="text-lg font-bold text-white truncate leading-tight">
                          {name}
                          {age !== null && (
                            <span className="ml-2 text-sm font-normal text-white/50">
                              {age}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-brand-light font-medium mt-0.5">
                          Community Member
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {trust && (
                        <TrustBadge trustLevel={trust.trustLevel} trustScore={trust.trustScore} size="md" showScore />
                      )}
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Profil schließen"
                        className="rounded-full h-8 w-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-12 text-center" role="status" aria-live="polite">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-2 border-white/10 border-t-brand rounded-full animate-spin shadow-[0_0_15px_rgba(41,121,255,0.3)]" />
                        <p className="text-xs font-medium text-white/40 tracking-wider uppercase">Lade Profil…</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Gallery */}
                      {gallery.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em] pl-1">Fotos</p>
                          <div className="grid grid-cols-3 gap-2">
                            {gallery.slice(0, 5).map((url, idx) => (
                              <motion.button
                                key={`${url}-${idx}`}
                                type="button"
                                onClick={() => setSelectedImageIndex(idx)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={clsx(
                                  "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 cursor-pointer transition-all hover:border-brand/50 hover:shadow-[0_0_15px_rgba(41,121,255,0.15)] active:scale-95 group",
                                  idx === 0 ? "col-span-3 h-48 sm:h-56 md:h-64" : "h-28 sm:h-32 md:h-36"
                                )}
                                aria-label={`Foto ${idx + 1} anzeigen`}
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  loading={idx < 3 ? "eager" : "lazy"}
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-white/5 px-6 py-8 text-center border border-white/10 border-dashed">
                          <p className="text-xs text-white/40 italic">Noch keine Fotos geteilt.</p>
                        </div>
                      )}

                      {/* Bio */}
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-xs font-bold text-white/40 mb-2 uppercase tracking-[0.15em]">Über</p>
                        <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{bio}</p>
                      </div>

                      {/* Verifikationen */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em]">Verifikationen</p>
                          {trust && (
                            <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full border border-brand/20 font-medium">
                              Score: {trust.trustScore}
                            </span>
                          )}
                        </div>
                        <div className="rounded-2xl bg-white/5 px-4 py-4 border border-white/10">
                          {renderVerificationPills(socialVerifications)}
                          {trust?.faceVerification && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                              <div
                                className={clsx(
                                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] border shadow-sm transition-all",
                                  trust.faceVerification.status === "verified"
                                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-emerald-500/10"
                                    : trust.faceVerification.status === "pending"
                                      ? "bg-amber-500/10 text-amber-200 border-amber-500/30"
                                      : "bg-white/5 text-white/60 border-white/15"
                                )}
                              >
                                <span className="text-base">✨</span> Face Scan
                                {trust.faceVerification.status === "verified"
                                  ? " ✓"
                                  : trust.faceVerification.status === "pending"
                                    ? " ⏳"
                                    : " ∘"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal - Separate AnimatePresence */}
      <AnimatePresence>
        {selectedImageIndex !== null && gallery.length > 0 && (
          <>
            <motion.div
              key="lightbox-backdrop"
              className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImageIndex(null)}
              role="button"
              aria-label="Lightbox schließen"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSelectedImageIndex(null);
                }
              }}
            />
            <motion.div
              key="lightbox-content"
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center pointer-events-auto p-4">
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-white backdrop-blur-sm transition-colors"
                  aria-label="Schließen"
                >
                  <span className="hidden sm:inline">✕ Schließen</span>
                  <span className="sm:hidden">✕</span>
                </button>

                {/* Navigation Buttons */}
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev !== null ? (prev > 0 ? prev - 1 : gallery.length - 1) : null
                        );
                      }}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-2 sm:p-3 text-white backdrop-blur-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Vorheriges Foto"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) =>
                          prev !== null ? (prev < gallery.length - 1 ? prev + 1 : 0) : null
                        );
                      }}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/10 hover:bg-white/20 p-2 sm:p-3 text-white backdrop-blur-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Nächstes Foto"
                    >
                      →
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {gallery.length > 1 && (
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-white">
                    {selectedImageIndex + 1} / {gallery.length}
                  </div>
                )}

                {/* Main Image */}
                <img
                  src={gallery[selectedImageIndex]}
                  alt={`Foto ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[85vh] sm:max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


