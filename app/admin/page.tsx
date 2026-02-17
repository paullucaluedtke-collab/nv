// app/admin/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  type Report,
  type ReportStatus,
} from "@/lib/reportRepository";
import {
  type UserVerification,
  type VerificationStatus,
} from "@/lib/verificationRepository";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import Image from "next/image";
import type { ActivityLog } from "@/lib/activityLogRepository";
import type { BusinessProfile, BusinessStatus } from "@/types/business";

// Admin auth is now handled server-side via /api/admin/auth

type Tab = "reports" | "activities" | "verifications" | "businesses" | "logs";
type VerificationFilter = "all" | "pending" | "id" | "face";
type BusinessFilter = "all" | BusinessStatus;

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("reports");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>("all");
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null);
  const [idImageUrls, setIdImageUrls] = useState<Record<string, string>>({});
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
  const renderAvatar = (profileImageUrl: string | null, displayName: string | null) => {
    const initials =
      displayName?.trim()?.split(" ").map((n) => n[0]?.toUpperCase()).join("").slice(0, 2) || "U";
    if (profileImageUrl) {
      return (
        <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10">
          <Image
            src={profileImageUrl}
            alt={displayName ?? "Avatar"}
            width={80}
            height={80}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xs font-semibold">
        {initials}
      </div>
    );
  };
  const handleBusinessStatus = useCallback(
    async (
      businessId: string,
      status: BusinessStatus,
      opts?: { canCreateActivities?: boolean; canPromoteActivities?: boolean; promotionCredits?: number }
    ) => {
      try {
        setUpdatingId(businessId);
        const res = await fetch(`/api/admin/businesses/${businessId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...opts,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update fehlgeschlagen");
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === businessId
              ? {
                ...b,
                status: status,
                canCreateActivities:
                  opts?.canCreateActivities ?? b.canCreateActivities,
                canPromoteActivities:
                  opts?.canPromoteActivities ?? b.canPromoteActivities,
                promotionCredits:
                  opts?.promotionCredits ?? b.promotionCredits,
                verifiedAt: status === "verified" ? new Date().toISOString() : b.verifiedAt,
              }
              : b
          )
        );
        setSuccessMessage("Business-Status aktualisiert");
      } catch (err: any) {
        console.error("[AdminPage] business status error", err);
        setError(err?.message || "Business-Update fehlgeschlagen");
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );


  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Check localStorage flag on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = window.localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (flag === "1") {
      setAuthenticated(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    let cancelled = false;
    try {
      setLoading(true);
      setError(null);

      // Use API routes instead of direct function calls
      const [reportsRes, activitiesRes, verificationsRes, businessesRes, logsRes] = await Promise.all([
        fetch("/api/admin/reports"),
        fetch("/api/admin/activities"),
        fetch("/api/admin/verifications"),
        fetch("/api/admin/businesses"),
        fetch("/api/admin/logs?limit=1000"),
      ]);

      // Check each response individually for better error messages
      if (!reportsRes.ok) {
        const errorData = await reportsRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Reports (${reportsRes.status})`);
      }
      if (!activitiesRes.ok) {
        const errorData = await activitiesRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Aktivitäten (${activitiesRes.status})`);
      }
      if (!verificationsRes.ok) {
        const errorData = await verificationsRes.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Fehler beim Laden der Verifizierungen (${verificationsRes.status})`);
      }
      if (!businessesRes.ok) {
        const errorData = await businessesRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Fehler beim Laden der Businesses (${businessesRes.status})`);
      }
      if (!logsRes.ok) {
        const errorData = await logsRes.json().catch(() => ({}));
        // Don't throw for logs, just log the error
        console.warn("[AdminPage] Failed to load logs:", errorData.error);
      }

      const [reportsData, activitiesData, verificationsData, businessesData, logsData] = await Promise.all([
        reportsRes.json(),
        activitiesRes.json(),
        verificationsRes.json(),
        businessesRes.json(),
        logsRes.ok ? logsRes.json() : Promise.resolve([]),
      ]);

      if (!cancelled) {
        setReports(reportsData);
        setActivities(activitiesData);
        setVerifications(verificationsData);
        setBusinesses(businessesData);
        setLogs(logsData);
      }
    } catch (err: any) {
      console.error("[AdminPage] load error", err);
      if (!cancelled) {
        const errorMessage = err?.message || "";
        if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY") || errorMessage.includes("Server-Konfiguration")) {
          setError("Server-Konfiguration fehlt. Bitte Server neu starten nach .env.local Änderungen.");
        } else {
          setError(errorMessage || "Fehler beim Laden der Daten");
        }
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadData();
  }, [authenticated, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (res.ok && data.authenticated) {
        setAuthenticated(true);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "1");
        }
        setSuccessMessage("Erfolgreich angemeldet");
      } else {
        setError(data.error || "Falsches Passwort.");
      }
    } catch {
      setError("Netzwerkfehler bei der Anmeldung.");
    }
    setPasswordInput("");
  };

  const handleLogout = () => {
    setAuthenticated(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
    setSuccessMessage("Erfolgreich abgemeldet");
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(null);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccessMessage(null);
  };

  const handleChangeStatus = async (reportId: string, status: ReportStatus) => {
    try {
      setUpdatingId(reportId);
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status konnte nicht aktualisiert werden");
      }

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      showSuccess(`Status auf "${status}" geändert`);
    } catch (err: any) {
      console.error("[AdminPage] update status error", err);
      showError(err?.message || "Status konnte nicht aktualisiert werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Möchtest du diese Aktivität wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;

    try {
      setUpdatingId(activityId);
      const res = await fetch(`/api/admin/activities/${activityId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Aktivität konnte nicht gelöscht werden");
      }

      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      showSuccess("Aktivität erfolgreich gelöscht");
    } catch (err: any) {
      console.error("[AdminPage] delete activity error", err);
      showError(err?.message || "Aktivität konnte nicht gelöscht werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyID = async (userId: string) => {
    if (!confirm("ID-Verifikation bestätigen? Der Benutzer erhält Zugriff auf alle Funktionen.")) return;

    try {
      setUpdatingId(userId);
      const res = await fetch(`/api/admin/verifications/id/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ID-Verifikation konnte nicht bestätigt werden");
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.userId === userId
            ? {
              ...v,
              idVerificationStatus: "verified",
              idVerificationVerifiedAt: new Date().toISOString(),
              ageVerified: true,
              ageVerifiedAt: new Date().toISOString(),
            }
            : v
        )
      );
      showSuccess("ID-Verifikation erfolgreich bestätigt");
    } catch (err: any) {
      console.error("[AdminPage] verify ID error", err);
      showError(err?.message || "ID-Verifikation konnte nicht bestätigt werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectID = async (userId: string) => {
    const reason = rejectionReason[userId] || "";
    if (!reason.trim()) {
      showError("Bitte einen Ablehnungsgrund angeben.");
      return;
    }
    if (!confirm("ID-Verifikation ablehnen? Der Benutzer wird benachrichtigt.")) return;

    try {
      setUpdatingId(userId);
      const res = await fetch(`/api/admin/verifications/id/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ID-Verifikation konnte nicht abgelehnt werden");
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.userId === userId
            ? {
              ...v,
              idVerificationStatus: "rejected",
              idVerificationRejectionReason: reason,
              idVerificationVerifiedAt: null,
            }
            : v
        )
      );
      setRejectionReason((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      showSuccess("ID-Verifikation erfolgreich abgelehnt");
    } catch (err: any) {
      console.error("[AdminPage] reject ID error", err);
      showError(err?.message || "ID-Verifikation konnte nicht abgelehnt werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyFace = async (userId: string, confidence?: number) => {
    if (!confirm("Face-Scan-Verifikation bestätigen?")) return;

    try {
      setUpdatingId(userId);
      const res = await fetch(`/api/admin/verifications/face/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified", confidence }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Face-Scan-Verifikation konnte nicht bestätigt werden");
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.userId === userId
            ? {
              ...v,
              faceVerification: {
                status: "verified",
                verifiedAt: new Date().toISOString(),
                ...(confidence !== undefined
                  ? { confidence }
                  : v.faceVerification?.confidence !== undefined
                    ? { confidence: v.faceVerification.confidence }
                    : {}),
              },
            }
            : v
        )
      );
      showSuccess("Face-Scan-Verifikation erfolgreich bestätigt");
    } catch (err: any) {
      console.error("[AdminPage] verify face error", err);
      showError(err?.message || "Face-Scan-Verifikation konnte nicht bestätigt werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectFace = async (userId: string) => {
    if (!confirm("Face-Scan-Verifikation ablehnen?")) return;

    try {
      setUpdatingId(userId);
      const res = await fetch(`/api/admin/verifications/face/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Face-Scan-Verifikation konnte nicht abgelehnt werden");
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.userId === userId
            ? {
              ...v,
              faceVerification: {
                status: "failed",
                verifiedAt: null,
              },
            }
            : v
        )
      );
      showSuccess("Face-Scan-Verifikation erfolgreich abgelehnt");
    } catch (err: any) {
      console.error("[AdminPage] reject face error", err);
      showError(err?.message || "Face-Scan-Verifikation konnte nicht abgelehnt werden.");
    } finally {
      setUpdatingId(null);
    }
  };

  const renderFaceImage = (faceVerification: any) => {
    if (!faceVerification?.imageUrl) return null;
    return (
      <a
        href={faceVerification.imageUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-300 underline"
      >
        Referenzbild öffnen
      </a>
    );
  };

  const loadIDImage = async (userId: string, imageUrl: string | null) => {
    if (!imageUrl || idImageUrls[userId]) return;

    try {
      const res = await fetch(`/api/admin/verifications/id-image/${userId}?imageUrl=${encodeURIComponent(imageUrl)}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ID-Bild konnte nicht geladen werden");
      }

      const { signedUrl } = await res.json();
      if (signedUrl) {
        setIdImageUrls((prev) => ({ ...prev, [userId]: signedUrl }));
      }
    } catch (err: any) {
      console.error("[AdminPage] load ID image error", err);
      showError(err?.message || "ID-Bild konnte nicht geladen werden.");
    }
  };

  // Filter functions
  const filteredVerifications = verifications.filter((v) => {
    if (verificationFilter === "all") return true;
    if (verificationFilter === "pending") {
      return (
        v.idVerificationStatus === "pending" ||
        v.faceVerification?.status === "pending"
      );
    }
    if (verificationFilter === "id") {
      return v.idVerificationStatus !== null;
    }
    if (verificationFilter === "face") {
      return v.faceVerification !== null;
    }
    return true;
  }).filter((v) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.displayName?.toLowerCase().includes(query) ||
      v.email?.toLowerCase().includes(query) ||
      v.userId.toLowerCase().includes(query)
    );
  });

  const filteredReports = reports.filter((r) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.reason.toLowerCase().includes(query) ||
      r.comment?.toLowerCase().includes(query) ||
      r.activityId?.toLowerCase().includes(query) ||
      r.reportedUserId?.toLowerCase().includes(query) ||
      r.reporterUserId?.toLowerCase().includes(query)
    );
  });

  const filteredActivities = activities.filter((a) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query) ||
      a.location_name?.toLowerCase().includes(query) ||
      a.id?.toLowerCase().includes(query) ||
      a.host_user_id?.toLowerCase().includes(query)
    );
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-black to-neutral-950 text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-neutral-950/95 backdrop-blur-xl border border-white/10 p-8 shadow-2xl"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              nearvibe Admin
            </h1>
            <p className="text-sm text-white/60">
              Bitte Admin-Passwort eingeben
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Passwort"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                autoFocus
              />
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              type="submit"
              className="w-full rounded-xl bg-brand text-black py-3 text-sm font-semibold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
            >
              Anmelden
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-black to-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              nearvibe Admin
            </h1>
            <p className="text-xs text-white/60 mt-0.5">Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-full px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Daten aktualisieren"
            >
              {loading ? "⏳" : "🔄"}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full px-4 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-6 pb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("reports")}
            className={clsx(
              "px-4 py-3 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap",
              activeTab === "reports"
                ? "bg-white/10 text-white border-b-2 border-brand shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            Reports {reports.length > 0 && `(${reports.length})`}
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={clsx(
              "px-4 py-3 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap",
              activeTab === "activities"
                ? "bg-white/10 text-white border-b-2 border-brand shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            Aktivitäten {activities.length > 0 && `(${activities.length})`}
          </button>
          <button
            onClick={() => setActiveTab("verifications")}
            className={clsx(
              "px-4 py-3 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap",
              activeTab === "verifications"
                ? "bg-white/10 text-white border-b-2 border-brand shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            Verifizierungen {verifications.length > 0 && `(${verifications.length})`}
          </button>
          <button
            onClick={() => setActiveTab("businesses")}
            className={clsx(
              "px-4 py-3 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap",
              activeTab === "businesses"
                ? "bg-white/10 text-white border-b-2 border-brand shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            Businesses {businesses.length > 0 && `(${businesses.length})`}
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={clsx(
              "px-4 py-3 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap",
              activeTab === "logs"
                ? "bg-white/10 text-white border-b-2 border-brand shadow-lg"
                : "text-white/60 hover:text-white/80 hover:bg-white/5"
            )}
          >
            Aktivitäts-Logs {logs.length > 0 && `(${logs.length})`}
          </button>
        </div>
      </header>

      {/* Messages */}
      <AnimatePresence>
        {(error || successMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div
              className={clsx(
                "rounded-xl px-4 py-3 text-sm shadow-xl",
                error
                  ? "bg-red-500/20 border border-red-500/30 text-red-300"
                  : "bg-green-500/20 border border-green-500/30 text-green-300"
              )}
            >
              {error || successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-white/20 border-t-brand rounded-full animate-spin mb-4" />
            <p className="text-sm text-white/60">Lade Daten…</p>
          </div>
        ) : activeTab === "verifications" ? (
          <>
            {/* Filter */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/60 font-medium">Filter:</span>
              {(["all", "pending", "id", "face"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVerificationFilter(filter)}
                  className={clsx(
                    "px-3 py-1.5 text-[11px] rounded-full transition-all font-medium",
                    verificationFilter === filter
                      ? "bg-brand text-black shadow-lg shadow-brand/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  {filter === "all"
                    ? "Alle"
                    : filter === "pending"
                      ? "Ausstehend"
                      : filter === "id"
                        ? "ID-Verifikation"
                        : "Face-Scan"}
                </button>
              ))}
            </div>

            {/* Verifications List */}
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-white/60">
                  {searchQuery ? "Keine Ergebnisse gefunden." : "Keine Verifizierungen gefunden."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVerifications.map((v) => {
                  const isExpanded = expandedUserId === v.userId;
                  const hasPendingID = v.idVerificationStatus === "pending";
                  const hasPendingFace =
                    v.faceVerification?.status === "pending";

                  return (
                    <motion.div
                      key={v.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-neutral-950/80 backdrop-blur-sm border border-white/10 p-5 text-xs shadow-lg hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {renderAvatar(v.profileImageUrl ?? null, v.displayName ?? null)}
                            <span className="font-semibold text-white text-sm">
                              {v.displayName || "Unbekannt"}
                            </span>
                          </div>
                          <p className="text-white/50 text-[10px] font-mono break-all mb-2">
                            {v.userId}
                          </p>
                          {v.email && (
                            <p className="text-white/60 text-[11px] mb-3">
                              📧 {v.email}
                            </p>
                          )}

                          {/* Verification Status Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Social Verifications */}
                            {v.socialVerifications.map((sv) => (
                              <span
                                key={sv.platform}
                                className={clsx(
                                  "rounded-full px-2.5 py-1 text-[10px] font-medium",
                                  sv.status === "verified"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : "bg-white/10 text-white/60 border border-white/10"
                                )}
                              >
                                {sv.platform}
                              </span>
                            ))}

                            {/* Age Verification */}
                            {v.ageVerified && (
                              <span className="rounded-full px-2.5 py-1 text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                Alter verifiziert
                              </span>
                            )}
                            {v.birthDate && !v.ageVerified && (
                              <span className="rounded-full px-2.5 py-1 text-[10px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                Alter nicht verifiziert
                              </span>
                            )}

                            {/* ID Verification */}
                            {v.idVerificationStatus && (
                              <span
                                className={clsx(
                                  "rounded-full px-2.5 py-1 text-[10px] font-medium border",
                                  v.idVerificationStatus === "verified"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : v.idVerificationStatus === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                      : "bg-red-500/20 text-red-300 border-red-500/30"
                                )}
                              >
                                ID{" "}
                                {v.idVerificationStatus === "verified"
                                  ? "✓"
                                  : v.idVerificationStatus === "pending"
                                    ? "⏳"
                                    : "✗"}
                              </span>
                            )}

                            {/* Face Verification */}
                            {v.faceVerification && (
                              <span
                                className={clsx(
                                  "rounded-full px-2.5 py-1 text-[10px] font-medium border inline-flex items-center gap-1",
                                  v.faceVerification.status === "verified"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : v.faceVerification.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                      : "bg-red-500/20 text-red-300 border-red-500/30"
                                )}
                              >
                                Face
                                {v.faceVerification.status === "verified"
                                  ? "✓"
                                  : v.faceVerification.status === "pending"
                                    ? "⏳"
                                    : "✗"}
                                {v.faceVerification.imageUrl && (
                                  <span className="text-[9px] underline text-white/80">
                                    Foto
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setExpandedUserId(
                              isExpanded ? null : v.userId
                            )
                          }
                          className="rounded-full px-4 py-2 text-[11px] bg-white/5 text-white/70 hover:bg-white/10 transition-colors font-medium"
                        >
                          {isExpanded ? "Schließen" : "Details"}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/10 space-y-5"
                          >
                            {/* ID Verification Section */}
                            {hasPendingID && v.idVerificationImageUrl && (
                              <div>
                                <h4 className="font-semibold text-white mb-3 text-sm">
                                  🆔 ID-Verifikation
                                </h4>
                                <div className="space-y-3">
                                  {v.birthDate && (
                                    <p className="text-white/60 text-[11px]">
                                      <span className="font-medium">Geburtsdatum:</span>{" "}
                                      {new Date(v.birthDate).toLocaleDateString("de-DE")}
                                    </p>
                                  )}
                                  {v.faceAgeEstimate && (
                                    <p className="text-white/60 text-[11px]">
                                      <span className="font-medium">Geschätztes Alter:</span> {v.faceAgeEstimate} Jahre
                                    </p>
                                  )}
                                  <div className="relative w-full max-w-md aspect-[3/2] rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                    {idImageUrls[v.userId] ? (
                                      <Image
                                        src={idImageUrls[v.userId]}
                                        alt="ID Document"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full">
                                        <button
                                          onClick={() =>
                                            loadIDImage(
                                              v.userId,
                                              v.idVerificationImageUrl
                                            )
                                          }
                                          className="px-4 py-2 text-[11px] bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors"
                                        >
                                          Bild laden
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      placeholder="Ablehnungsgrund (optional)"
                                      value={rejectionReason[v.userId] || ""}
                                      onChange={(e) =>
                                        setRejectionReason((prev) => ({
                                          ...prev,
                                          [v.userId]: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleVerifyID(v.userId)}
                                        disabled={updatingId === v.userId}
                                        className="flex-1 rounded-full px-4 py-2 text-[11px] bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50 font-medium border border-green-500/30"
                                      >
                                        {updatingId === v.userId
                                          ? "Verifizieren…"
                                          : "✓ Verifizieren"}
                                      </button>
                                      <button
                                        onClick={() => handleRejectID(v.userId)}
                                        disabled={
                                          updatingId === v.userId ||
                                          !rejectionReason[v.userId]?.trim()
                                        }
                                        className="flex-1 rounded-full px-4 py-2 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 font-medium border border-red-500/30"
                                      >
                                        ✗ Ablehnen
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Face Verification Section */}
                            {hasPendingFace && (
                              <div>
                                <h4 className="font-semibold text-white mb-3 text-sm">
                                  Face-Scan-Verifikation
                                </h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <p className="text-white/60 text-[11px]">
                                      Vergleiche Referenzfoto mit dem Profilbild.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="rounded-lg border border-white/10 bg-white/5 aspect-square overflow-hidden flex items-center justify-center">
                                        {v.faceVerification?.imageUrl ? (
                                          <Image
                                            src={v.faceVerification.imageUrl}
                                            alt="Referenzfoto"
                                            width={400}
                                            height={400}
                                            className="object-cover w-full h-full"
                                            unoptimized
                                          />
                                        ) : (
                                          <span className="text-white/50 text-[11px] px-2 text-center">
                                            Kein Referenzfoto
                                          </span>
                                        )}
                                      </div>
                                      <div className="rounded-lg border border-white/10 bg-white/5 aspect-square overflow-hidden flex items-center justify-center">
                                        {v.profileImageUrl ? (
                                          <Image
                                            src={v.profileImageUrl}
                                            alt="Profilbild"
                                            width={400}
                                            height={400}
                                            className="object-cover w-full h-full"
                                            unoptimized
                                          />
                                        ) : (
                                          <span className="text-white/50 text-[11px] px-2 text-center">
                                            Kein Profilbild
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-white/70">
                                      {renderFaceImage(v.faceVerification)}
                                      {v.faceVerification?.confidence != null && (
                                        <span className="text-white/60">
                                          Confidence: {v.faceVerification.confidence}%
                                        </span>
                                      )}
                                      {v.faceVerification?.submittedAt && (
                                        <span className="text-white/50">
                                          Eingereicht: {new Date(v.faceVerification.submittedAt).toLocaleString("de-DE")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <textarea
                                      placeholder="Notizen zum Abgleich (optional)"
                                      value={rejectionReason[v.userId] || ""}
                                      onChange={(e) =>
                                        setRejectionReason((prev) => ({
                                          ...prev,
                                          [v.userId]: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/40 border border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all min-h-[80px]"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleVerifyFace(
                                            v.userId,
                                            v.faceVerification?.confidence
                                          )
                                        }
                                        disabled={updatingId === v.userId}
                                        className="flex-1 rounded-full px-4 py-2 text-[11px] bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50 font-medium border border-green-500/30"
                                      >
                                        {updatingId === v.userId
                                          ? "Verifizieren…"
                                          : "✓ Verifizieren"}
                                      </button>
                                      <button
                                        onClick={() => handleRejectFace(v.userId)}
                                        disabled={updatingId === v.userId}
                                        className="flex-1 rounded-full px-4 py-2 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 font-medium border border-red-500/30"
                                      >
                                        ✗ Ablehnen
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Additional Info */}
                            <div className="text-white/50 text-[11px] space-y-1.5 pt-2 border-t border-white/5">
                              {v.ageVerifiedAt && (
                                <p>
                                  <span className="font-medium">Alter verifiziert:</span>{" "}
                                  {new Date(v.ageVerifiedAt).toLocaleString("de-DE")}
                                </p>
                              )}
                              {v.idVerificationVerifiedAt && (
                                <p>
                                  <span className="font-medium">ID verifiziert:</span>{" "}
                                  {new Date(v.idVerificationVerifiedAt).toLocaleString("de-DE")}
                                </p>
                              )}
                              {v.faceVerification?.verifiedAt && (
                                <p>
                                  <span className="font-medium">Face-Scan verifiziert:</span>{" "}
                                  {new Date(v.faceVerification.verifiedAt).toLocaleString("de-DE")}
                                </p>
                              )}
                              {v.idVerificationRejectionReason && (
                                <p className="text-red-300">
                                  <span className="font-medium">Ablehnungsgrund:</span>{" "}
                                  {v.idVerificationRejectionReason}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === "reports" ? (
          filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-white/60">
                {searchQuery ? "Keine Ergebnisse gefunden." : "Aktuell gibt es keine Meldungen 🎉"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-neutral-950/80 backdrop-blur-sm border border-white/10 p-5 text-xs shadow-lg hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-white text-sm">{r.reason}</span>
                      <span className="text-white/50 text-[11px]">
                        {new Date(r.createdAt).toLocaleString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] font-semibold",
                        r.status === "open"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : r.status === "reviewed"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-white/10 text-white/60 border border-white/10"
                      )}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                    <p className="text-white/60">
                      <span className="font-medium text-white/80">Activity:</span>{" "}
                      <span className="font-mono text-[11px] break-all">
                        {r.activityId ?? "–"}
                      </span>
                    </p>
                    <p className="text-white/60">
                      <span className="font-medium text-white/80">Host:</span>{" "}
                      <span className="font-mono text-[11px] break-all">
                        {r.reportedUserId ?? "–"}
                      </span>
                    </p>
                    <p className="text-white/60">
                      <span className="font-medium text-white/80">Reporter:</span>{" "}
                      <span className="font-mono text-[11px] break-all">
                        {r.reporterUserId ?? "–"}
                      </span>
                    </p>
                  </div>

                  {r.comment && (
                    <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-white/50 mb-1 text-[10px] font-medium">Kommentar</p>
                      <p className="whitespace-pre-wrap text-[11px]">{r.comment}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(r.id, "open")}
                      disabled={updatingId === r.id}
                      className={clsx(
                        "rounded-full px-4 py-2 text-[11px] font-medium transition-all",
                        r.status === "open"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                      )}
                    >
                      Offen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(r.id, "reviewed")}
                      disabled={updatingId === r.id}
                      className={clsx(
                        "rounded-full px-4 py-2 text-[11px] font-medium transition-all",
                        r.status === "reviewed"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                      )}
                    >
                      Gesehen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeStatus(r.id, "dismissed")}
                      disabled={updatingId === r.id}
                      className={clsx(
                        "rounded-full px-4 py-2 text-[11px] font-medium transition-all",
                        r.status === "dismissed"
                          ? "bg-white/15 text-white/80 border border-white/20"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                      )}
                    >
                      Ignorieren
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : activeTab === "activities" ? (
          filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-white/60">
                {searchQuery ? "Keine Ergebnisse gefunden." : "Keine Aktivitäten gefunden."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-neutral-950/80 backdrop-blur-sm border border-white/10 p-5 text-xs shadow-lg hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-2 text-sm">{activity.title || "Kein Titel"}</h3>
                      <p className="text-white/60 text-[11px] mb-3 line-clamp-2">{activity.description || "Keine Beschreibung"}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <p className="text-white/60">
                          <span className="font-medium text-white/80">ID:</span>{" "}
                          <span className="font-mono text-[11px] break-all">{activity.id}</span>
                        </p>
                        <p className="text-white/60">
                          <span className="font-medium text-white/80">Host User ID:</span>{" "}
                          <span className="font-mono text-[11px] break-all">
                            {activity.host_user_id || "Kein Host"}
                          </span>
                        </p>
                        <p className="text-white/60">
                          <span className="font-medium text-white/80">Ort:</span> {activity.location_name || "–"}
                        </p>
                        <p className="text-white/60">
                          <span className="font-medium text-white/80">Status:</span>{" "}
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            activity.is_closed
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          )}>
                            {activity.is_closed ? "Beendet" : "Aktiv"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(activity.id)}
                      disabled={updatingId === activity.id}
                      className="rounded-full px-4 py-2 text-[11px] bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 font-medium border border-red-500/30"
                    >
                      {updatingId === activity.id ? "Löschen…" : "🗑️ Löschen"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : activeTab === "businesses" ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/60 font-medium">Status:</span>
              {(["all", "pending", "verified", "rejected", "suspended"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setBusinessFilter(f)}
                  className={clsx(
                    "px-3 py-1.5 text-[11px] rounded-full transition-all font-medium",
                    businessFilter === f
                      ? "bg-brand text-black shadow-lg shadow-brand/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {businesses.filter((b) => businessFilter === "all" ? true : b.status === businessFilter).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-white/60">
                  Keine Businesses gefunden.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {businesses
                  .filter((b) => businessFilter === "all" ? true : b.status === businessFilter)
                  .map((b) => {
                    const isExpanded = expandedBusinessId === b.id;
                    const statusColor =
                      b.status === "verified"
                        ? "bg-green-500/20 text-green-200 border-green-500/30"
                        : b.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-200 border-yellow-500/30"
                          : b.status === "suspended"
                            ? "bg-red-500/20 text-red-200 border-red-500/30"
                            : "bg-red-500/20 text-red-200 border-red-500/30";

                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl bg-neutral-950/80 border border-white/10 p-4 flex flex-col gap-3"
                      >
                        <div className="flex gap-3">
                          {b.logoUrl || b.coverImageUrl ? (
                            (() => {
                              const imageSrc = b.logoUrl || b.coverImageUrl || "";
                              return (
                                <div className="h-14 w-14 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                  <Image
                                    src={imageSrc}
                                    alt={b.businessName}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <div className="h-14 w-14 rounded-xl border border-dashed border-white/15 flex items-center justify-center text-white/40 text-xs">
                              Logo
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white truncate">
                                {b.businessName}
                              </p>
                              <span className={clsx("text-[10px] px-2 py-1 rounded-full border", statusColor)}>
                                {b.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/60">
                              {b.businessType} • {b.city || "keine Stadt"}
                            </p>
                            <p className="text-[10px] text-white/50">
                              Owner: {b.userId}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] text-white/70">
                          <span className="rounded-full px-2 py-1 border border-white/10">Create: {b.canCreateActivities ? "Ja" : "Nein"}</span>
                          <span className="rounded-full px-2 py-1 border border-white/10">Promote: {b.canPromoteActivities ? "Ja" : "Nein"}</span>
                          <span className="rounded-full px-2 py-1 border border-white/10">Credits: {b.promotionCredits ?? 0}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <button
                            onClick={() => handleBusinessStatus(b.id, "verified", { canCreateActivities: true })}
                            disabled={updatingId === b.id}
                            className="px-3 py-2 rounded-full bg-green-500/20 text-green-200 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                          >
                            ✓ Verifizieren
                          </button>
                          <button
                            onClick={() => handleBusinessStatus(b.id, "rejected", { canCreateActivities: false, canPromoteActivities: false })}
                            disabled={updatingId === b.id}
                            className="px-3 py-2 rounded-full bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                          >
                            ✗ Ablehnen
                          </button>
                          <button
                            onClick={() => handleBusinessStatus(b.id, "suspended", { canCreateActivities: false, canPromoteActivities: false })}
                            disabled={updatingId === b.id}
                            className="px-3 py-2 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50"
                          >
                            ⏸ Sperren
                          </button>
                          <button
                            onClick={() => setExpandedBusinessId(isExpanded ? null : b.id)}
                            className="px-3 py-2 rounded-full bg-white/10 text-white/80 border border-white/10 hover:bg-white/15"
                          >
                            {isExpanded ? "Schließen" : "Details"}
                          </button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-3 border-t border-white/10 pt-3 text-[11px] text-white/80"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-white/60">Adresse</p>
                                  <p>{b.address || "—"}</p>
                                  <p>{b.postalCode || ""} {b.city || ""}</p>
                                </div>
                                <div>
                                  <p className="text-white/60">Kontakt</p>
                                  <p>{b.phone || "—"}</p>
                                  <p>{b.email || "—"}</p>
                                  <p>{b.website || "—"}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() =>
                                    handleBusinessStatus(b.id, b.status, {
                                      canCreateActivities: !b.canCreateActivities,
                                    })
                                  }
                                  disabled={updatingId === b.id}
                                  className="px-3 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15"
                                >
                                  Create: {b.canCreateActivities ? "Deaktivieren" : "Aktivieren"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleBusinessStatus(b.id, b.status, {
                                      canPromoteActivities: !b.canPromoteActivities,
                                    })
                                  }
                                  disabled={updatingId === b.id}
                                  className="px-3 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15"
                                >
                                  Promote: {b.canPromoteActivities ? "Deaktivieren" : "Aktivieren"}
                                </button>
                                <button
                                  onClick={() =>
                                    handleBusinessStatus(b.id, b.status, {
                                      promotionCredits: (b.promotionCredits ?? 0) + 10,
                                    })
                                  }
                                  disabled={updatingId === b.id}
                                  className="px-3 py-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/15"
                                >
                                  +10 Credits
                                </button>
                              </div>
                              {b.description && (
                                <p className="text-white/70 text-[11px] leading-relaxed">
                                  {b.description}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        ) : activeTab === "logs" ? (
          <>
            {/* Filter */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-white/60 font-medium">Filter:</span>
              {(["all", "ACTIVITY_CREATED", "ACTIVITY_JOINED", "ACTIVITY_LEFT", "ACTIVITY_DELETED", "ACTIVITY_CLOSED", "PROFILE_UPDATED", "REPORT_CREATED", "CHAT_MESSAGE_SENT"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogTypeFilter(filter)}
                  className={clsx(
                    "px-3 py-1.5 text-[11px] rounded-full transition-all font-medium",
                    logTypeFilter === filter
                      ? "bg-brand text-black shadow-lg shadow-brand/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  {filter === "all"
                    ? "Alle"
                    : filter.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Logs List */}
            {(() => {
              const filteredLogs = logs.filter((log) => {
                if (logTypeFilter !== "all" && log.activityType !== logTypeFilter) return false;
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  log.userId?.toLowerCase().includes(query) ||
                  log.userName?.toLowerCase().includes(query) ||
                  log.userEmail?.toLowerCase().includes(query) ||
                  log.activityId?.toLowerCase().includes(query) ||
                  log.activityType.toLowerCase().includes(query)
                );
              });

              return filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-white/60">
                    {searchQuery || logTypeFilter !== "all" ? "Keine Ergebnisse gefunden." : "Keine Logs gefunden."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-neutral-950/80 backdrop-blur-sm border border-white/10 p-4 text-xs shadow-lg hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={clsx(
                              "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]",
                              log.activityType === "ACTIVITY_CREATED" || log.activityType === "ACTIVITY_JOINED"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : log.activityType === "ACTIVITY_DELETED" || log.activityType === "ACTIVITY_CLOSED"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : log.activityType === "REPORT_CREATED"
                                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            )}>
                              {log.activityType.replace(/_/g, " ")}
                            </span>
                            <span className="text-white/50 text-[10px] font-mono">
                              {new Date(log.createdAt).toLocaleString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                            {log.userId && (
                              <p className="text-white/60">
                                <span className="font-medium text-white/80">User ID:</span>{" "}
                                <span className="font-mono break-all">{log.userId}</span>
                              </p>
                            )}
                            {log.userName && (
                              <p className="text-white/60">
                                <span className="font-medium text-white/80">Name:</span> {log.userName}
                              </p>
                            )}
                            {log.userEmail && (
                              <p className="text-white/60">
                                <span className="font-medium text-white/80">Email:</span> {log.userEmail}
                              </p>
                            )}
                            {log.activityId && (
                              <p className="text-white/60">
                                <span className="font-medium text-white/80">Activity ID:</span>{" "}
                                <span className="font-mono break-all">{log.activityId}</span>
                              </p>
                            )}
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                              <p className="text-white/50 mb-1 text-[10px] font-medium">Metadata</p>
                              <pre className="text-[10px] text-white/70 font-mono whitespace-pre-wrap break-words">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })()}
          </>
        ) : null}
      </main>
    </div>
  );
}
