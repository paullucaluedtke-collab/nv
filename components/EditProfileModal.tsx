"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { uploadProfileImage, uploadGalleryImage } from "../lib/profileImageUpload";
import { useAuth } from "../lib/authContext";
import VerificationModal from "./VerificationModal";
import TrustBadge from "./TrustBadge";
import type { TrustProfile } from "@/types/trust";
import { fetchTrustProfile } from "@/lib/trustRepository";
import { supabase } from "@/lib/supabaseClient";

// Local type for EditProfileModal (simplified version of UserProfile from userProfileRepository)
export type EditProfileFormData = {
  name: string;
  username: string | null;
  emoji: string | null; // deaktiviert
  bio?: string | null;
  profileGalleryUrls?: string[] | null;
};

type Props = {
  open: boolean;
  initialProfile: EditProfileFormData | null;
  initialProfileImageUrl?: string | null;
  initialGalleryUrls?: string[] | null;
  onClose: () => void;
  onSave: (profile: EditProfileFormData & { profileImageUrl: string | null }) => Promise<void>;
  trustProfile?: TrustProfile | null;
  onTrustProfileRefresh?: () => Promise<void>;
};

export default function EditProfileModal({
  open,
  initialProfile,
  initialProfileImageUrl,
  initialGalleryUrls,
  onClose,
  onSave,
  trustProfile,
  onTrustProfileRefresh,
}: Props) {
  const { user: authUser } = useAuth();
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  // Emoji deaktiviert
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(initialProfileImageUrl ?? null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialGalleryUrls ?? []);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [trustState, setTrustState] = useState<TrustProfile | null>(trustProfile ?? null);
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [idVerificationStatus, setIdVerificationStatus] = useState<"pending" | "verified" | "failed" | "not_started" | "rejected" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialProfile?.name ?? "");
      setUsername(initialProfile?.username ?? "");
      setBio(initialProfile?.bio ?? "");
      setProfileImageUrl(initialProfileImageUrl ?? null);
      setGalleryUrls(initialGalleryUrls ?? []);
      setNameError(null);
    }
  }, [open, initialProfile, initialProfileImageUrl, initialGalleryUrls]);

  useEffect(() => {
    setTrustState(trustProfile ?? null);
  }, [trustProfile]);

  const loadVerificationData = async () => {
    if (!authUser) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("age_verified, birth_date, id_verification_status")
        .eq("user_id", authUser.id)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        console.error("[EditProfileModal] load verification data error", error);
        return;
      }
      
      if (data) {
        setAgeVerified(data.age_verified ?? null);
        setBirthDate(data.birth_date ?? null);
        setIdVerificationStatus(data.id_verification_status ?? null);
      }
    } catch (err) {
      console.error("[EditProfileModal] load verification data error", err);
    }
  };

  useEffect(() => {
    if (open && authUser) {
      loadVerificationData();
    }
  }, [open, authUser]);

  const handleRefreshTrust = useMemo(() => {
    return async () => {
      if (!authUser) return;
      try {
        const updated = await fetchTrustProfile(authUser.id);
        setTrustState(updated);
        await loadVerificationData();
        await onTrustProfileRefresh?.();
      } catch (err) {
        console.error("[EditProfileModal] refresh trust error", err);
      }
    };
  }, [authUser, onTrustProfileRefresh]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Bitte gib einen Namen ein");
      return;
    }
    if (uploading || galleryUploading) {
      setNameError("Bitte warte, bis Uploads abgeschlossen sind.");
      return;
    }

    // Validate username if provided
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(trimmedUsername)) {
        setNameError("Username muss 3-20 Zeichen lang sein und darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten");
        return;
      }
    }

    setNameError(null);
    setSaving(true);
    try {
      await onSave({
        name: trimmed,
        username: trimmedUsername || null,
        emoji: null,
        bio: bio.trim() || null,
        profileImageUrl: profileImageUrl,
        profileGalleryUrls: galleryUrls.length ? galleryUrls : null,
      });
    } catch (err: any) {
      console.error("[EditProfileModal] Save error", err);
      const errorMsg = err?.message || err?.error?.message || "Fehler beim Speichern";
      setNameError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authUser) return;

    setUploadError(null);
    setUploading(true);
    try {
      const publicUrl = await uploadProfileImage(authUser.id, file);
      if (publicUrl) {
        setProfileImageUrl(publicUrl);
      } else {
        setUploadError("Bild konnte nicht hochgeladen werden. Bitte versuche es erneut.");
      }
    } catch (err: any) {
      console.error("[EditProfileModal] Image upload error", err);
      const errorMsg = err?.message || "Bild konnte nicht hochgeladen werden.";
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authUser) return;
    setUploadError(null);
    setGalleryUploading(true);
    try {
      const url = await uploadGalleryImage(authUser.id, file);
      if (url) {
        setGalleryUrls((prev) => [...prev, url].slice(0, 5));
      }
    } catch (err: any) {
      const msg = err?.message || "Bild konnte nicht hochgeladen werden.";
      setUploadError(msg);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };

  const initials = name.trim()?.[0]?.toUpperCase() ?? "U";
  const canAddMoreGallery = galleryUrls.length < 5;

  // Handle ESC key to close modal
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving && !uploading && !galleryUploading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, saving, uploading, galleryUploading, onClose]);

  const social = trustState?.socialVerifications ?? [];
  const face = trustState?.faceVerification;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving && !uploading && !galleryUploading) {
              onClose();
            }
          }}
        >
          <motion.div
            className={clsx(
              "w-full rounded-2xl bg-neutral-950/95 p-4 md:p-6 text-neutral-100 shadow-2xl ring-1 ring-white/10",
              "max-h-[90vh] overflow-y-auto",
              "md:max-w-md"
            )}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            aria-describedby="profile-modal-description"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="profile-modal-title" className="text-lg font-semibold">Dein nearvibe Profil</h2>
                <p id="profile-modal-description" className="mt-1 text-xs text-neutral-400">
                  So sehen dich andere in nearvibe.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                aria-label="Modal schließen"
              >
                Schließen
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dein Name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Username (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                      setUsername(value);
                    }}
                    placeholder="username"
                    maxLength={20}
                    className="w-full pl-8 pr-3 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-white/50">
                  Dein eindeutiger Username für Freunde-Anfragen. 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Profilbild
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 overflow-hidden">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profilbild"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-neutral-300">{initials}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      aria-label={uploading ? "Bild wird hochgeladen" : profileImageUrl ? "Profilbild ändern" : "Profilbild hochladen"}
                      className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? "Lädt…" : profileImageUrl ? "Bild ändern" : "Bild hochladen"}
                    </button>
                    {profileImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImageUrl(null);
                          setUploadError(null);
                        }}
                        className="rounded-full px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>
                </div>
                {uploadError && (
                  <p className="text-[11px] text-red-400 mt-1" role="alert">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-neutral-900/70 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-2xl overflow-hidden">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Vorschau"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-300">{initials}</span>
                )}
              </div>
              <div className="text-xs text-neutral-300">
                <div className="font-medium">
                  {name.trim() || "Dein Name hier"}
                </div>
                <div className="text-neutral-500">
                  So sehen dich andere in nearvibe.
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">
                  Weitere Fotos (max. 5)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={galleryInputRef}
                    onChange={handleGalleryUpload}
                    disabled={!canAddMoreGallery || galleryUploading}
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={!canAddMoreGallery || galleryUploading}
                    className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {galleryUploading ? "Lädt…" : "Foto hinzufügen"}
                  </button>
                  {!canAddMoreGallery && (
                    <span className="text-[11px] text-neutral-500">Limit erreicht</span>
                  )}
                </div>
              </div>
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {galleryUrls.map((url, idx) => (
                    <div
                      key={url}
                      className={clsx(
                        "relative overflow-hidden rounded-xl border border-white/10 bg-neutral-800",
                        idx === 0 ? "col-span-3 h-32" : "h-20"
                      )}
                    >
                      <img src={url} alt={`Galerie ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGalleryUrls((prev) => prev.filter((u) => u !== url))}
                        className="absolute top-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] text-white hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500">Füge bis zu 5 Fotos hinzu.</p>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="z.B. Paul"
                  aria-label="Name"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "name-error" : undefined}
                  className={`w-full rounded-xl border bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none focus:ring-2 transition-colors ${
                    nameError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-neutral-800 focus:border-neutral-500 focus:ring-neutral-500/50"
                  }`}
                />
                {nameError && (
                  <p id="name-error" className="text-[11px] text-red-400 mt-1" role="alert">
                    {nameError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Username (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                      setUsername(value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="username"
                    maxLength={20}
                    aria-label="Username"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/70 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Dein eindeutiger Username für Freunde-Anfragen. 3-20 Zeichen, nur Buchstaben, Zahlen, _ und -.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Profil-Icon
                </label>
                <div className="text-[11px] text-neutral-500">
                  Icons/Emojis sind deaktiviert. Bitte Profilbild nutzen.
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Über dich (optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Schreib kurz, wer du bist oder was du magst…"
                  rows={3}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 resize-none"
                />
              </div>
            </div>

            {/* Trust / Verification */}
            <div className="mt-6 space-y-3 rounded-xl bg-neutral-900/70 border border-white/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-200">Verifikation</span>
                  {trustState && (
                    <TrustBadge trustLevel={trustState.trustLevel} trustScore={trustState.trustScore} size="sm" showScore />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="text-[11px] text-brand underline underline-offset-2 hover:text-brand/80"
                >
                  Verifizieren →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {social.length === 0 && <span className="text-white/60">Noch keine Social-Verifikation</span>}
                {social.map((v) => (
                  <span
                    key={v.platform}
                    className={clsx(
                      "px-2 py-1 rounded-full border",
                      v.status === "verified"
                        ? "bg-green-500/15 text-green-300 border-green-500/30"
                        : v.status === "pending"
                        ? "bg-yellow-500/15 text-yellow-200 border-yellow-500/30"
                        : "bg-white/5 text-white/60 border-white/15"
                    )}
                  >
                    {v.platform === "phone" && "Telefon"}
                    {v.platform === "google" && "Google"}
                    {v.platform === "facebook" && "Facebook"}
                    {v.status === "verified" ? " ✓" : v.status === "pending" ? " ⏳" : " ∘"}
                  </span>
                ))}
                {face && (
                  <span
                    className={clsx(
                      "px-2 py-1 rounded-full border",
                      face.status === "verified"
                        ? "bg-green-500/15 text-green-300 border-green-500/30"
                        : face.status === "pending"
                        ? "bg-yellow-500/15 text-yellow-200 border-yellow-500/30"
                        : "bg-white/5 text-white/60 border-white/15"
                    )}
                  >
                    ✨ Face {face.status === "verified" ? "✓" : face.status === "pending" ? "⏳" : "∘"}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs text-neutral-300 hover:bg-neutral-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || saving || uploading || galleryUploading}
                aria-label={saving ? "Profil wird gespeichert" : "Profil speichern"}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-neutral-950 shadow-sm hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-500 disabled:text-neutral-900/70 transition-colors"
              >
                {saving ? "Speichere…" : "Speichern"}
              </button>
            </div>
          </motion.div>

          <VerificationModal
            isOpen={isVerificationModalOpen}
            onClose={() => setIsVerificationModalOpen(false)}
            userId={authUser?.id || ""}
            currentVerifications={trustState?.socialVerifications}
            currentFaceVerification={trustState?.faceVerification}
            ageVerified={ageVerified}
            birthDate={birthDate}
            idVerificationStatus={idVerificationStatus}
            onVerificationUpdate={handleRefreshTrust}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
