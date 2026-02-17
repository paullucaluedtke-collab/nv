"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { supabase } from "../lib/supabaseClient";
import { updateSocialVerification } from "../lib/trustRepository";
import { useAuth } from "../lib/authContext";
import type { SocialVerification, FaceVerification } from "../types/trust";

type VerificationTab = "phone" | "google" | "facebook" | "face" | "age";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentVerifications?: SocialVerification[];
  currentFaceVerification?: FaceVerification | null;
  ageVerified?: boolean | null;
  birthDate?: string | null;
  idVerificationStatus?: "pending" | "verified" | "failed" | "not_started" | "rejected" | null;
  onVerificationUpdate?: () => void;
};

export default function VerificationModal({
  isOpen,
  onClose,
  userId,
  currentVerifications = [],
  currentFaceVerification = null,
  ageVerified = null,
  birthDate = null,
  idVerificationStatus = null,
  onVerificationUpdate,
}: Props) {
  const searchParams = useSearchParams();
  const { linkFacebookAccount, linkGoogleAccount } = useAuth();

  const [activeTab, setActiveTab] = useState<VerificationTab>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"send" | "verify">("send");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceUploading, setFaceUploading] = useState(false);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  
  // Age verification state
  const [birthDateInput, setBirthDateInput] = useState(birthDate || "");
  const [ageStep, setAgeStep] = useState<"birthdate" | "id">(ageVerified ? "id" : "birthdate");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const getVerificationStatus = (platform: SocialVerification["platform"]) =>
    currentVerifications.find((v) => v.platform === platform)?.status || "not_started";

  const tabs: { id: VerificationTab; label: string; full: string }[] = useMemo(
    () => [
      { id: "phone", label: "📱", full: "Telefon" },
      { id: "google", label: "🔍", full: "Google" },
      { id: "facebook", label: "👤", full: "Facebook" },
      { id: "age", label: "🎂", full: "Alter" },
      { id: "face", label: "✨", full: "Face Scan" },
    ],
    []
  );

  // Handle OAuth return messages (facebook / google)
  useEffect(() => {
    if (!isOpen) return;

    const oauthSuccess = searchParams.get("oauth_success");
    const oauthError = searchParams.get("auth_error") || searchParams.get("oauth_error");
    const oauthMessage = searchParams.get("message");

    if (oauthSuccess) {
      const platform = oauthSuccess as "facebook" | "google";
      const applyUpdate = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const currentStatus = getVerificationStatus(platform);
          if (currentStatus !== "verified") {
            await updateSocialVerification(userId, platform, {
              status: "verified",
              verifiedAt: new Date().toISOString(),
              username: session?.user?.user_metadata?.full_name || session?.user?.email || undefined,
            });
          }

          const platformName = platform === "google" ? "Google" : "Facebook";
          setSuccess(`${platformName} erfolgreich mit deinem Konto verbunden! ✓`);
          setError(null);
          onVerificationUpdate?.();
        } catch (err: any) {
          const platformName = platform === "google" ? "Google" : "Facebook";
          setError(
            `${platformName} wurde verbunden, aber Trust-Profil konnte nicht aktualisiert werden: ${
              err?.message || String(err)
            }`
          );
        } finally {
          window.history.replaceState({}, "", window.location.pathname);
        }
      };
      applyUpdate();
    }

    if (oauthError) {
      setError(`OAuth-Fehler: ${oauthMessage || oauthError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [isOpen, searchParams, userId, onVerificationUpdate]);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError("Bitte gib eine Telefonnummer ein.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber.trim(), userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Senden des Codes");
      setSuccess("Verifikations-Code wurde gesendet. Bitte prüfe deine SMS.");
      setPhoneStep("verify");
    } catch (err: any) {
      setError(err?.message || "Fehler beim Senden des Codes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError("Bitte gib den Verifikations-Code ein.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber.trim(), token: otpCode.trim(), userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Prüfen des Codes");
      setSuccess("Telefonnummer erfolgreich verifiziert! ✓");
      setPhoneStep("send");
      setOtpCode("");
      onVerificationUpdate?.();
    } catch (err: any) {
      setError(err?.message || "Verifikation fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialVerification = async (platform: "facebook" | "google") => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?link_account=true&next=${encodeURIComponent(
        window.location.pathname
      )}`;
      if (platform === "facebook") {
        const { error } = await linkFacebookAccount(redirectTo, userId);
        if (error) throw new Error(error);
      } else {
        const { error } = await linkGoogleAccount(redirectTo, userId);
        if (error) throw new Error(error);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || `Fehler beim Starten der ${platform}-Verifikation`);
    }
  };

  const handleAgeVerificationStep1 = async () => {
    if (!birthDateInput.trim()) {
      setError("Bitte gib dein Geburtsdatum ein.");
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDateInput)) {
      setError("Bitte verwende das Format YYYY-MM-DD (z.B. 2000-01-15)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/verification/age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, birthDate: birthDateInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler bei der Altersverifikation");
      
      setSuccess(data.message || "Altersverifikation Stufe 1 erfolgreich! Du hast jetzt Zugriff auf Aktivitäten.");
      setAgeStep("id");
      onVerificationUpdate?.();
    } catch (err: any) {
      setError(err?.message || "Altersverifikation fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Datei muss ein Bild sein (JPG, PNG, etc.)");
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Bild ist zu groß (max. 10MB)");
      return;
    }

    setIdFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleIdUpload = async () => {
    if (!idFile) {
      setError("Bitte wähle ein Bild deines Ausweises aus.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", idFile);
      formData.append("userId", userId);

      const res = await fetch("/api/verification/id/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Hochladen des Ausweises");
      
      setSuccess(data.message || "ID-Dokument erfolgreich hochgeladen. Die Verifikation wird geprüft.");
      setIdFile(null);
      setIdPreview(null);
      onVerificationUpdate?.();
    } catch (err: any) {
      setError(err?.message || "Upload fehlgeschlagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (activeTab === "phone") {
      return (
        <div className="space-y-3">
          {phoneStep === "send" && (
            <div className="space-y-2">
              <label className="text-xs text-white/70">Telefonnummer</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="+49 170 1234567"
              />
              <p className="text-xs text-white/50">Wir senden dir einen Verifikations-Code per SMS.</p>
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                disabled={isSubmitting || !phoneNumber.trim()}
                onClick={handleSendOtp}
                className={clsx(
                  "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
                  isSubmitting || !phoneNumber.trim()
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-brand text-black hover:opacity-90"
                )}
              >
                {isSubmitting ? "Wird gesendet..." : "Code senden"}
              </motion.button>
            </div>
          )}
          {phoneStep === "verify" && (
            <div className="space-y-2">
              <label className="text-xs text-white/70">Verifikations-Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="XXXXXX"
              />
              <p className="text-xs text-white/50">Gib den Code ein, den du per SMS erhalten hast.</p>
              <div className="flex flex-col gap-2">
                <motion.button
                  whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                  disabled={isSubmitting || !otpCode.trim()}
                  onClick={handleVerifyOtp}
                  className={clsx(
                    "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
                    isSubmitting || !otpCode.trim()
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-brand text-black hover:opacity-90"
                  )}
                >
                  {isSubmitting ? "Wird geprüft..." : "Code prüfen"}
                </motion.button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPhoneStep("send")}
                  className="text-xs text-white/60 underline underline-offset-2 disabled:opacity-40 text-left"
                >
                  Code erneut senden
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "google") {
      const status = getVerificationStatus("google");
      return (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-4 border border-white/10 text-white/80 text-sm">
            Verbinde dein Google-Konto über OAuth. Nach der Verbindung wird dein Trust-Level aktualisiert.
          </div>
          <motion.button
            whileHover={!isSubmitting && status !== "verified" ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && status !== "verified" ? { scale: 0.98 } : {}}
            disabled={isSubmitting || status === "verified"}
            onClick={() => handleSocialVerification("google")}
            className={clsx(
              "w-full rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              isSubmitting || status === "verified"
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-[#4285F4] text-white hover:opacity-90"
            )}
          >
            {status === "verified" ? "✓ Google verbunden" : isSubmitting ? "Wird weitergeleitet..." : "Mit Google verbinden"}
          </motion.button>
        </div>
      );
    }

    if (activeTab === "facebook") {
      const status = getVerificationStatus("facebook");
      return (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/5 p-4 border border-white/10 text-white/80 text-sm">
            Verbinde dein Facebook-Konto über OAuth. Nach der Verbindung wird dein Trust-Level aktualisiert.
          </div>
          <motion.button
            whileHover={!isSubmitting && status !== "verified" ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && status !== "verified" ? { scale: 0.98 } : {}}
            disabled={isSubmitting || status === "verified"}
            onClick={() => handleSocialVerification("facebook")}
            className={clsx(
              "w-full rounded-xl py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              isSubmitting || status === "verified"
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-[#1877F2] text-white hover:opacity-90"
            )}
          >
            {status === "verified"
              ? "✓ Facebook verbunden"
              : isSubmitting
              ? "Wird weitergeleitet..."
              : "Mit Facebook verbinden"}
          </motion.button>
        </div>
      );
    }

    if (activeTab === "age") {
      const showStep1 = !ageVerified || ageStep === "birthdate";
      const showStep2 = ageVerified && (ageStep === "id" || idVerificationStatus);

      return (
        <div className="space-y-4">
          {/* Step 1: Birth Date */}
          {showStep1 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">1️⃣</span>
                  <h3 className="text-sm font-semibold text-white">Stufe 1: Geburtsdatum</h3>
                </div>
                <p className="text-xs text-white/70 mb-3">
                  Gib dein Geburtsdatum ein, um Zugriff auf Aktivitäten zu erhalten. Du musst mindestens 18 Jahre alt sein.
                </p>
                {ageVerified && (
                  <div className="mb-3 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200">
                    ✓ Stufe 1 abgeschlossen
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs text-white/70">Geburtsdatum</label>
                  <input
                    type="date"
                    value={birthDateInput}
                    onChange={(e) => setBirthDateInput(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
                    disabled={ageVerified || isSubmitting}
                  />
                  <p className="text-xs text-white/50">
                    Format: TT.MM.JJJJ (z.B. 15.01.2000)
                  </p>
                  {!ageVerified && (
                    <motion.button
                      whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                      disabled={isSubmitting || !birthDateInput.trim()}
                      onClick={handleAgeVerificationStep1}
                      className={clsx(
                        "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
                        isSubmitting || !birthDateInput.trim()
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-brand text-black hover:opacity-90"
                      )}
                    >
                      {isSubmitting ? "Wird verifiziert..." : "Geburtsdatum bestätigen"}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: ID Document */}
          {showStep2 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">2️⃣</span>
                  <h3 className="text-sm font-semibold text-white">Stufe 2: Ausweisdokument</h3>
                </div>
                <p className="text-xs text-white/70 mb-3">
                  Lade ein Foto deines Personalausweises, Reisepasses oder Führerscheins hoch. Die Verifikation wird von einem Administrator geprüft.
                </p>
                {idVerificationStatus === "verified" && (
                  <div className="mb-3 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200">
                    ✓ Ausweis verifiziert
                  </div>
                )}
                {idVerificationStatus === "pending" && (
                  <div className="mb-3 rounded-lg bg-yellow-500/15 border border-yellow-400/30 px-3 py-2 text-xs text-yellow-200">
                    ⏳ Ausweis wird geprüft...
                  </div>
                )}
                {idVerificationStatus === "rejected" && (
                  <div className="mb-3 rounded-lg bg-red-500/15 border border-red-400/30 px-3 py-2 text-xs text-red-200">
                    ✗ Ausweis wurde abgelehnt. Bitte lade ein neues Bild hoch.
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs text-white/70">Ausweisdokument (JPG, PNG, max. 10MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdFileSelect}
                    className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand file:text-black hover:file:bg-brand-hover file:cursor-pointer"
                    disabled={isSubmitting || idVerificationStatus === "verified"}
                  />
                  {idPreview && (
                    <div className="relative rounded-lg overflow-hidden border border-white/15">
                      <img src={idPreview} alt="Ausweis Vorschau" className="w-full h-auto max-h-48 object-contain" />
                    </div>
                  )}
                  {idFile && idVerificationStatus !== "verified" && (
                    <motion.button
                      whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                      disabled={isSubmitting}
                      onClick={handleIdUpload}
                      className={clsx(
                        "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
                        isSubmitting
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-brand text-black hover:opacity-90"
                      )}
                    >
                      {isSubmitting ? "Wird hochgeladen..." : "Ausweis hochladen"}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "face") {
      const status = currentFaceVerification?.status || "not_started";
      const statusBadge = (() => {
        if (status === "verified") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
        if (status === "pending") return "bg-amber-500/15 text-amber-100 border-amber-400/30";
        if (status === "rejected" || status === "failed") return "bg-red-500/15 text-red-100 border-red-400/30";
        return "bg-white/5 text-white/70 border-white/15";
      })();

      const hiddenInputId = "face-capture-input";

      const requestFaceVerification = async () => {
        setFaceLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const res = await fetch("/api/verification/face/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Face-Scan konnte nicht gestartet werden");
          setSuccess(data.message || "Face-Scan angefragt. Ein Admin prüft dich manuell.");
          onVerificationUpdate?.();
        } catch (err: any) {
          setError(err?.message || "Face-Scan konnte nicht gestartet werden");
        } finally {
          setFaceLoading(false);
        }
      };

      const handleFaceCapture = async (file: File) => {
        setFaceUploading(true);
        setError(null);
        setSuccess(null);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", userId);
          const res = await fetch("/api/verification/face/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen");
          setSuccess(data.message || "Foto hochgeladen. Admin prüft dein Face-Scan.");
          if (data.imageUrl) setFacePreview(data.imageUrl);
          onVerificationUpdate?.();
        } catch (err: any) {
          setError(err?.message || "Face-Upload fehlgeschlagen");
        } finally {
          setFaceUploading(false);
        }
      };

      const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // basic checks
        if (!file.type.startsWith("image/")) {
          setError("Bitte ein Foto aufnehmen (kein anderes Dateiformat).");
          return;
        }
        if (file.size > 8 * 1024 * 1024) {
          setError("Bild zu groß (max. 8MB).");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setFacePreview(reader.result as string);
        reader.readAsDataURL(file);
        void handleFaceCapture(file);
      };

      return (
        <div className="space-y-4 text-white/80 text-sm">
          <div
            className={clsx(
              "rounded-xl border px-3 py-2 text-xs inline-flex items-center gap-2",
              statusBadge
            )}
          >
            <span>Face-Scan Status:</span>
            <span className="font-semibold">
              {status === "verified"
                ? "Verifiziert"
                : status === "pending"
                ? "Wartet auf Admin-Check"
                : status === "rejected" || status === "failed"
                ? "Abgelehnt"
                : "Nicht gestartet"}
            </span>
            {currentFaceVerification?.verifiedAt && (
              <span className="text-white/50">
                {new Date(currentFaceVerification.verifiedAt).toLocaleDateString()}
              </span>
            )}
            {currentFaceVerification?.confidence != null && (
              <span className="text-white/60">Confidence: {currentFaceVerification.confidence}</span>
            )}
          </div>

          <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-2">
            <p>Starte die Face-Verifikation per Kamera und lass sie von einem Admin bestätigen.</p>
            <p className="text-white/60 text-xs">
              Bitte nimm ein aktuelles Foto mit der Kamera auf (keine Galerie). Admin vergleicht es mit deinem Profilbild.
            </p>
          </div>

          <input
            id={hiddenInputId}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onFileInputChange}
          />

          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={!faceUploading ? { scale: 1.01 } : {}}
              whileTap={!faceUploading ? { scale: 0.99 } : {}}
              disabled={faceUploading}
              onClick={() => document.getElementById(hiddenInputId)?.click()}
              className={clsx(
                "w-full rounded-xl py-2.5 text-sm font-medium transition-colors",
                faceUploading
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-brand text-black hover:opacity-90"
              )}
            >
              {faceUploading ? "Upload läuft..." : "Mit Kamera aufnehmen"}
            </motion.button>

            <motion.button
              whileHover={!faceLoading && status !== "pending" ? { scale: 1.01 } : {}}
              whileTap={!faceLoading && status !== "pending" ? { scale: 0.99 } : {}}
              disabled={faceLoading || status === "pending"}
              onClick={requestFaceVerification}
              className={clsx(
                "w-full rounded-xl py-2.5 text-sm font-medium transition-colors border",
                faceLoading || status === "pending"
                  ? "border-white/10 text-white/40 cursor-not-allowed bg-white/5"
                  : "border-white/20 text-white hover:bg-white/10"
              )}
            >
              {status === "pending"
                ? "Wartet auf Admin-Bestätigung"
                : faceLoading
                ? "Status setzen..."
                : status === "verified"
                ? "Bereits verifiziert"
                : "Status auf 'pending' setzen"}
            </motion.button>

            {facePreview && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <img src={facePreview} alt="Face Preview" className="w-full h-auto max-h-64 object-contain" />
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900/90 p-4 sm:p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Profil-Verifikation</h2>
                <p className="text-xs text-white/60">
                  Baue Vertrauen auf und zeige anderen, dass du echt bist.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70 hover:bg-white/15"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex gap-1 rounded-full bg-white/5 p-1 border border-white/10 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                let status: string = "not_started";
                if (tab.id === "face") {
                  status = currentFaceVerification?.status || "not_started";
                } else if (tab.id === "age") {
                  if (idVerificationStatus === "verified") {
                    status = "verified";
                  } else if (ageVerified) {
                    status = "pending";
                  } else {
                    status = "not_started";
                  }
                } else {
                  status = getVerificationStatus(tab.id as SocialVerification["platform"]);
                }
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "flex-1 rounded-full py-2 text-xs sm:text-sm flex flex-col items-center gap-0.5 min-w-[50px] sm:min-w-0 flex-shrink-0",
                      activeTab === tab.id ? "bg-white text-black" : "text-white/70"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] hidden sm:block">{tab.full}</span>
                    {status === "verified" && <span className="text-[9px]">✓</span>}
                    {status === "pending" && tab.id === "age" && <span className="text-[9px]">⏳</span>}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-xs text-red-100"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100"
                >
                  {success}
                </motion.div>
              )}

              {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
