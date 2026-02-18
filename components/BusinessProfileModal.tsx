"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import Image from "next/image";
import {
  PartyPopper,
  Beer,
  UtensilsCrossed,
  Trophy,
  Coffee,
  Tent,
  Dumbbell,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock3
} from "lucide-react";
import type { BusinessProfile, BusinessType } from "@/types/business";
import { upsertBusinessProfile, fetchBusinessProfileByUserId } from "@/lib/businessRepository";
import { supabase } from "@/lib/supabaseClient";

type BusinessProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: BusinessProfile) => void;
  userId: string;
  initialProfile?: BusinessProfile | null;
};

const BUSINESS_TYPES: { value: BusinessType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "club", label: "Club", icon: PartyPopper },
  { value: "bar", label: "Bar", icon: Beer },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "sport_club", label: "Sportverein", icon: Trophy },
  { value: "cafe", label: "Café", icon: Coffee },
  { value: "event_venue", label: "Event-Location", icon: Tent },
  { value: "gym", label: "Fitnessstudio", icon: Dumbbell },
  { value: "other", label: "Sonstiges", icon: Building2 },
];

const BUCKET = "business-profiles";

export default function BusinessProfileModal({
  isOpen,
  onClose,
  onSave,
  userId,
  initialProfile,
}: BusinessProfileModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("restaurant");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialProfile) {
        setBusinessName(initialProfile.businessName);
        setBusinessType(initialProfile.businessType);
        setDescription(initialProfile.description ?? "");
        setWebsite(initialProfile.website ?? "");
        setPhone(initialProfile.phone ?? "");
        setEmail(initialProfile.email ?? "");
        setAddress(initialProfile.address ?? "");
        setCity(initialProfile.city ?? "");
        setPostalCode(initialProfile.postalCode ?? "");
        setLatitude(initialProfile.latitude);
        setLongitude(initialProfile.longitude);
        setLogoPreview(initialProfile.logoUrl);
        setCoverPreview(initialProfile.coverImageUrl);
      } else {
        // Load existing profile if available
        setIsLoading(true);
        fetchBusinessProfileByUserId(userId)
          .then((profile) => {
            if (profile) {
              setBusinessName(profile.businessName);
              setBusinessType(profile.businessType);
              setDescription(profile.description ?? "");
              setWebsite(profile.website ?? "");
              setPhone(profile.phone ?? "");
              setEmail(profile.email ?? "");
              setAddress(profile.address ?? "");
              setCity(profile.city ?? "");
              setPostalCode(profile.postalCode ?? "");
              setLatitude(profile.latitude);
              setLongitude(profile.longitude);
              setLogoPreview(profile.logoUrl);
              setCoverPreview(profile.coverImageUrl);
            }
          })
          .catch((err) => {
            console.error("[BusinessProfileModal] load error", err);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [isOpen, userId, initialProfile]);

  useEffect(() => {
    if (!isOpen) {
      setBusinessName("");
      setBusinessType("restaurant");
      setDescription("");
      setWebsite("");
      setPhone("");
      setEmail("");
      setAddress("");
      setCity("");
      setPostalCode("");
      setLatitude(null);
      setLongitude(null);
      setLogoFile(null);
      setLogoPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[BusinessProfileModal] upload error", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (businessName.trim().length < 3) {
      newErrors.businessName = "Business-Name muss mindestens 3 Zeichen lang sein";
    }
    if (address && !city) {
      newErrors.city = "Stadt ist erforderlich wenn Adresse angegeben wird";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload images if provided
      let logoUrl = logoPreview;
      let coverImageUrl = coverPreview;

      if (logoFile) {
        const logoPath = `${userId}/logo-${Date.now()}.${logoFile.name.split(".").pop()}`;
        logoUrl = await uploadImage(logoFile, logoPath);
      }

      if (coverFile) {
        const coverPath = `${userId}/cover-${Date.now()}.${coverFile.name.split(".").pop()}`;
        coverImageUrl = await uploadImage(coverFile, coverPath);
      }

      const profile = await upsertBusinessProfile({
        userId,
        businessName: businessName.trim(),
        businessType,
        description: description.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        postalCode: postalCode.trim() || null,
        latitude,
        longitude,
        logoUrl,
        coverImageUrl,
      });

      onSave(profile);
      onClose();
    } catch (err: any) {
      console.error("[BusinessProfileModal] save error", err);
      setErrors({ submit: err?.message || "Profil konnte nicht gespeichert werden" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 safe-area-inset-top safe-area-inset-bottom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border border-white/10 rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">
              Business-Profil {initialProfile ? "bearbeiten" : "erstellen"}
            </h2>
            {initialProfile && (
              <div className="inline-flex items-center gap-2 text-[11px] text-white/70">
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 border text-[11px]",
                    initialProfile.status === "verified" && "border-green-500/60 bg-green-500/10 text-green-200",
                    initialProfile.status === "pending" && "border-amber-400/60 bg-amber-400/10 text-amber-100",
                    initialProfile.status === "rejected" && "border-red-400/60 bg-red-400/10 text-red-100",
                    initialProfile.status === "suspended" && "border-red-500/60 bg-red-500/10 text-red-50"
                  )}
                >
                  {initialProfile.status === "verified" ? (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  ) : initialProfile.status === "pending" ? (
                    <Clock3 className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {initialProfile.status === "verified"
                    ? "Verifiziert"
                    : initialProfile.status === "pending"
                      ? "In Prüfung"
                      : initialProfile.status === "rejected"
                        ? "Abgelehnt"
                        : "Gesperrt"}
                </span>
                {initialProfile.updatedAt && (
                  <span className="text-white/50">
                    Zuletzt aktualisiert: {new Date(initialProfile.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
            aria-label="Schließen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Business Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Business-Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errors.businessName) {
                        setErrors((prev) => { const next = { ...prev }; delete next.businessName; return next; });
                      }
                    }}
                    placeholder="z.B. Club XYZ"
                    className={clsx(
                      "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors",
                      errors.businessName && "border-red-400"
                    )}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-red-400">{errors.businessName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    Business-Typ <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BUSINESS_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = businessType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setBusinessType(type.value)}
                          className={clsx(
                            "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-sm transition-all",
                            isSelected
                              ? "border-brand bg-brand/20 text-white"
                              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                          )}
                        >
                          <Icon className={clsx(
                            "h-5 w-5",
                            isSelected ? "text-brand" : "text-white/60"
                          )} />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Beschreibe dein Business..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Website</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Standort</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-white">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Straße und Hausnummer"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">PLZ</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="12345"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Stadt</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) {
                        setErrors((prev) => { const next = { ...prev }; delete next.city; return next; });
                      }
                    }}
                    placeholder="Berlin"
                    className={clsx(
                      "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors",
                      errors.city && "border-red-400"
                    )}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-400">{errors.city}</p>
                  )}
                </div>
                <p className="text-xs text-white/50">
                  💡 Koordinaten werden automatisch gesetzt, wenn du eine Activity erstellst
                </p>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Bilder</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Logo</label>
                    <div className="relative">
                      {logoPreview ? (
                        <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <Image
                            src={logoPreview}
                            alt="Logo preview"
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(null);
                              setLogoFile(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-white hover:bg-black transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:border-white/30 transition-colors cursor-pointer">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/40 mb-2">
                            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="text-xs text-white/60">Logo hochladen</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Cover-Bild</label>
                    <div className="relative">
                      {coverPreview ? (
                        <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <Image
                            src={coverPreview}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCoverPreview(null);
                              setCoverFile(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-white hover:bg-black transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-32 w-full rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:border-white/30 transition-colors cursor-pointer">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/40 mb-2">
                            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span className="text-xs text-white/60">Cover hochladen</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-sm font-medium text-white bg-white/10 hover:bg-white/15 transition-colors"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !businessName.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Speichern..." : "Speichern"}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}

