"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
import ActivityCard from "@/components/ActivityCard";
import type { EnhancedActivity } from "@/components/ActivityCard";
import { List } from "lucide-react";
import type { Activity, ActivityVisibility, ActivityCategory } from "../types/activity";
import CreateActivityModal from "../components/CreateActivityModal";
import EditProfileModal from "../components/EditProfileModal";
import BusinessProfileModal from "../components/BusinessProfileModal";
import BusinessShopModal from "../components/BusinessShopModal";
import AccountMenu from "../components/AccountMenu";
import ActivityChatPanel from "../components/ActivityChatPanel";
import GlobalChatPanel from "../components/GlobalChatPanel";
import UserProfileSheet from "../components/UserProfileSheet";
import ReportActivityModal from "../components/ReportActivityModal";
import OnboardingOverlay from "../components/OnboardingOverlay";
import AuthModal from "../components/AuthModal";
import BottomSheet from "../components/BottomSheet";
import GlassSheet from "@/components/GlassSheet";
import MobileBottomNav from "@/components/MobileBottomNav";
import ActivityList from "@/components/ActivityList";
import ActivityDetailsSheet from "@/components/ActivityDetailsSheet";
import DesktopFilterBar from "@/components/DesktopFilterBar";
import {
  ActivityFilterCategory,
  ActivityFilterJoined,
  ActivityFilterVisibility,
  OwnershipFilter,
  SortOption,
  HistoryFilter,
  BusinessFilter
} from "@/types/filters";
import PasswordPromptModal from "../components/PasswordPromptModal";
import FriendsPanel from "../components/FriendsPanel";
import ActivityParticipantsList from "../components/ActivityParticipantsList";
import UserStatsPanel from "../components/UserStatsPanel";
import LeaderboardPanel from "../components/LeaderboardPanel";
import EmptyState from "../components/EmptyState";
import QuickActions from "../components/QuickActions";
import ActivitySuggestions from "../components/ActivitySuggestions";
import {
  fetchActivities,
} from "../lib/activitiesRepository";
import {
  createActivityAction,
  joinActivityAction,
  leaveActivityAction,
  deleteActivityAction,
  closeActivityAction,
} from "@/app/actions/activityActions";
import { getOrCreateUserId } from "../lib/userIdentity";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchRemoteUserProfile,
  upsertRemoteUserProfile,
  type UserProfile,
} from "../lib/userProfileRepository";
import { fetchTrustProfile } from "../lib/trustRepository";
import type { TrustProfile } from "../types/trust";
import { useAuth } from "../lib/authContext";
import { STORAGE_KEYS } from "../lib/storageKeys";
import { DEFAULT_EMOJI } from "../lib/constants";
import {
  fetchVerifiedBusinesses,
  type BusinessProfile,
} from "../lib/businessRepository";
import { useBusinessProfile } from "../lib/useBusinessProfile";

type SidebarMode = "all" | "mine";
type ActivityStatus = "past" | "ongoing" | "upcoming" | "unknown";
type MobileTab = "map" | "activities" | "chat";

// ToastVariant and Toast types are now in hooks/useToast.ts

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[60vh] min-h-[360px] max-h-[720px] w-full rounded-3xl border border-white/10 bg-void-card flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-purple-500/5 animate-pulse" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="h-10 w-10 border-2 border-white/10 border-t-brand rounded-full animate-spin shadow-[0_0_15px_rgba(41,121,255,0.3)]" />
        <span className="text-xs font-medium text-white/40 tracking-wider uppercase">Karte wird geladen…</span>
      </div>
    </div>
  ),
});

type MainAppProps = {
  initialSelectedActivityId?: string | null;
};

export default function MainApp({ initialSelectedActivityId = null }: MainAppProps) {
  // Auth state from context
  const { user: authUser, loading: authLoading, signOut: authSignOut } = useAuth();

  // main userId: must be authUser.id (we can still keep deviceId as a fallback for legacy data)
  const deviceId = typeof window !== "undefined" ? getOrCreateUserId() : null;
  const userId = authUser?.id ?? deviceId ?? "";
  const isAdmin = useMemo(() => {
    if (!authUser?.email) return false;
    const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return list.includes(authUser.email.toLowerCase());
  }, [authUser?.email]);

  // All state hooks
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    initialSelectedActivityId
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ActivityFilterCategory>("all");
  const [joinedFilter, setJoinedFilter] = useState<ActivityFilterJoined>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<ActivityFilterVisibility>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("all");
  const { toasts, showToast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [trustProfile, setTrustProfile] = useState<TrustProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileSheetUserId, setProfileSheetUserId] = useState<string | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [reportActivityId, setReportActivityId] = useState<string | null>(null);
  const [reportHostUserId, setReportHostUserId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("all");
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [isActivitiesSheetOpen, setIsActivitiesSheetOpen] = useState(false);
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [isBusinessProfileModalOpen, setIsBusinessProfileModalOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [verifiedBusinesses, setVerifiedBusinesses] = useState<BusinessProfile[]>([]);
  const [businessProfilesMap, setBusinessProfilesMap] = useState<Record<string, BusinessProfile>>({});
  const [passwordPromptActivity, setPasswordPromptActivity] = useState<Activity | null>(null);
  const [passwordPromptRequiresFriendship, setPasswordPromptRequiresFriendship] = useState(false);
  const [isFriendsPanelOpen, setIsFriendsPanelOpen] = useState(false);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(false);
  const [isLeaderboardPanelOpen, setIsLeaderboardPanelOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [quickActionTitle, setQuickActionTitle] = useState<string | null>(null);
  const [quickActionCategory, setQuickActionCategory] = useState<ActivityCategory | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("active");
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>("all");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const {
    businessProfile,
    loading: businessProfileLoading,
    error: businessProfileError,
    refresh: refreshBusinessProfile,
    setBusinessProfile,
  } = useBusinessProfile(authUser?.id);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  // Derive current user name from profile
  const currentUserName = userProfile?.displayName ?? "Gast";

  // Helper: Calculate activity status based on startTime/endTime
  const getActivityStatus = useCallback((activity: Activity): ActivityStatus => {
    const now = new Date();

    if (!activity.startTime && !activity.endTime) {
      return "unknown";
    }

    const start = activity.startTime ? new Date(activity.startTime) : null;
    const end = activity.endTime ? new Date(activity.endTime) : null;

    if (start && end) {
      if (now < start) return "upcoming";
      if (now > end) return "past";
      return "ongoing";
    }

    if (start && !end) {
      if (now < start) return "upcoming";
      return "ongoing";
    }

    if (!start && end) {
      if (now > end) return "past";
      return "ongoing";
    }

    return "unknown";
  }, []);

  // Helper: Check if activity should be hidden (ended more than 6 hours ago)
  const shouldHideActivity = useCallback((activity: Activity): boolean => {
    if (!activity.endTime) return false;
    const end = new Date(activity.endTime);
    const now = new Date();

    // Hide activities that ended more than 6 hours ago
    const sixHoursMs = 6 * 60 * 60 * 1000;
    return now.getTime() - end.getTime() > sixHoursMs;
  }, []);

  // Helper: Enhance activities with isHost, hasJoined, status, hide, and isClosed flags
  const enhanceActivities = useCallback((activities: Activity[], userId: string, currentUserName: string) => {
    return activities
      .map((activity) => {
        const joinedIds = activity.joinedUserIds ?? [];

        // Host-Check primär über hostUserId, Fallback über hostId/Name für alte Datensätze
        const isHostById = activity.hostUserId != null && activity.hostUserId === userId;
        const isHostByLegacyId = activity.hostId && activity.hostId === userId;
        const isHostByName = activity.hostName === currentUserName;
        const isHost = isHostById || isHostByLegacyId || isHostByName;

        // Join-Check über userId
        const hasJoined = joinedIds.includes(userId);

        const joinedCount = joinedIds.length;
        const status = getActivityStatus(activity);
        const hide = shouldHideActivity(activity);
        const isClosed = !!activity.isClosed;

        return {
          ...activity,
          _isHost: isHost,
          _hasJoined: hasJoined,
          _joinedCount: joinedCount,
          _status: status,
          _hide: hide,
          _isClosed: isClosed,
        };
      })
      .filter((a) => !a._hide);
  }, [getActivityStatus, shouldHideActivity]);

  // All memoized data
  const enhancedActivities = useMemo(() => {
    const currentUserId = authUser?.id ?? userId;
    return enhanceActivities(activities, currentUserId, currentUserName);
  }, [activities, enhanceActivities, authUser?.id, userId, currentUserName]);

  // Build "Meine Aktionen" list (hosted + joined)
  const myActivities = useMemo(() => {
    return enhancedActivities.filter(
      (a) => a._isHost || a._hasJoined
    );
  }, [enhancedActivities]);

  // Base list depends on sidebar mode
  const baseList = sidebarMode === "mine" ? myActivities : enhancedActivities;

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const filteredActivities = useMemo(() => {
    let filtered = baseList.filter((activity) => {
      // History filter
      if (historyFilter === "active" && (activity._status === "past" || activity._isClosed)) {
        return false;
      }
      if (historyFilter === "past" && activity._status !== "past" && !activity._isClosed) {
        return false;
      }

      // Hide closed activities in "all" mode, but show them in "mine" mode (unless history filter is set)
      if (sidebarMode === "all" && activity._isClosed && historyFilter === "active") {
        return false;
      }

      // Business-Filter
      if (businessFilter === "business" && !activity.isBusinessActivity) return false;
      if (businessFilter === "user" && activity.isBusinessActivity) return false;

      // Category-Filter
      if (categoryFilter !== "all") {
        // Convert filter value (lowercase) to Activity category format (capitalized)
        const filterToCategory: Record<string, ActivityCategory> = {
          chill: "Chill",
          sport: "Sport",
          party: "Party",
          study: "Study",
          gaming: "Gaming",
          other: "Other",
        };
        const expectedCategory = filterToCategory[categoryFilter];
        if (expectedCategory && activity.category !== expectedCategory) return false;
      }

      // Visibility-Filter
      if (visibilityFilter !== "all" && activity.visibility !== visibilityFilter) return false;

      // Status-Filter (joined / notJoined)
      if (joinedFilter === "joined" && !activity._hasJoined) return false;
      if (joinedFilter === "not_joined" && activity._hasJoined) return false;

      // Host-Filter (mine / others)
      if (ownershipFilter === "mine" && !activity._isHost) return false;
      if (ownershipFilter === "others" && activity._isHost) return false;

      return true;
    });

    // Sort activities
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "distance":
          if (!userLocation || !a.latitude || !a.longitude || !b.latitude || !b.longitude) {
            return 0; // Can't sort by distance without location
          }
          const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
          const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
          return distA - distB;

        case "time":
          const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
          const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
          return timeA - timeB;

        case "participants":
          return (b._joinedCount ?? 0) - (a._joinedCount ?? 0);

        case "popularity":
          // Combine participants and recency
          const popularityA = (a._joinedCount ?? 0) * 10 + (a.createdAt ? new Date(a.createdAt).getTime() / 1000000 : 0);
          const popularityB = (b._joinedCount ?? 0) * 10 + (b.createdAt ? new Date(b.createdAt).getTime() / 1000000 : 0);
          return popularityB - popularityA;

        case "newest":
        default:
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return createdB - createdA;
      }
    });

    // Sort promoted activities first
    const promotedFirst = [...sorted].sort((a, b) => {
      const promotionOrder: Record<string, number> = { sponsored: 3, boost: 2, featured: 1, none: 0 };
      const aPromo = promotionOrder[a.promotionLevel ?? "none"] ?? 0;
      const bPromo = promotionOrder[b.promotionLevel ?? "none"] ?? 0;
      if (aPromo !== bPromo) return bPromo - aPromo;
      return 0; // Keep original order if same promotion level
    });

    return promotedFirst;
  }, [baseList, sidebarMode, categoryFilter, joinedFilter, visibilityFilter, ownershipFilter, sortOption, userLocation, calculateDistance, historyFilter, businessFilter]);

  const selectedActivity = useMemo(
    () =>
      selectedActivityId
        ? enhancedActivities.find((a) => a.id === selectedActivityId) ?? null
        : null,
    [selectedActivityId, enhancedActivities]
  );

  // All useCallback handlers
  const handleMarkerSelect = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    if (isCreateOpen) {
      setIsCreateOpen(false);
    }
    // On mobile, open activities sheet when selecting marker
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileTab("activities");
      setIsActivitiesSheetOpen(true);
    }
  }, [isCreateOpen]);

  const handleActivityClick = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    if (isCreateOpen) {
      setIsCreateOpen(false);
    }
    // On mobile, switch to activities tab when clicking an activity
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileTab("activities");
      setIsActivitiesSheetOpen(true);
    }
  }, [isCreateOpen]);

  // showToast is now provided by useToast() hook above

  const handleShareActivity = useCallback(
    async (activityId: string) => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/a/${activityId}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: "nearvibe",
            text: "Schau dir diese Aktion in deiner Nähe an:",
            url,
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          showToast("Link kopiert ✨", "success");
        } else {
          // fallback: prompt
          window.prompt("Kopiere diesen Link:", url);
        }
      } catch (err) {
        // User cancelled share dialog - that's fine, don't show error
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("[nearvibe] share error", err);
        showToast("Link konnte nicht geteilt werden.", "error");
      }
    },
    [showToast]
  );

  const handleReportActivity = useCallback(
    (activityId: string, hostUserId: string | null) => {
      if (!authUser) {
        showToast("Bitte melde dich an, um Aktionen zu melden.", "info");
        return;
      }

      setReportActivityId(activityId);
      setReportHostUserId(hostUserId);
      setIsReportModalOpen(true);
    },
    [authUser, showToast]
  );

  const handleEndActivity = useCallback(
    async (activityId: string) => {
      if (!authUser) {
        showToast("Bitte melde dich an, um Aktionen zu beenden.", "info");
        return;
      }

      const confirmEnd = window.confirm(
        "Willst du diese Aktion wirklich beenden? Neue Leute können dann nicht mehr teilnehmen."
      );
      if (!confirmEnd) return;

      try {
        await closeActivityAction(activityId, authUser.id);
        setActivities((prev) =>
          prev.map((a) =>
            a.id === activityId ? { ...a, isClosed: true } : a
          )
        );
        showToast("Aktion wurde beendet.", "success");
      } catch (err) {
        console.error("[MainApp] handleEndActivity error", err);
        showToast("Aktion konnte nicht beendet werden.", "error");
      }
    },
    [authUser, showToast]
  );

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      if (!authUser) {
        showToast("Bitte melde dich an, um Aktionen zu löschen.", "info");
        return;
      }

      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      // Host-Check: primär über hostUserId, Fallback über hostId
      const isHost = (activity.hostUserId != null && activity.hostUserId === authUser.id) ||
        (activity.hostId && activity.hostId === authUser.id);

      if (!isHost) {
        console.warn("User is not host, cannot delete");
        return;
      }

      const prev = activities;
      setActivities((all) => all.filter((a) => a.id !== activityId));
      setSelectedActivityId((current) => (current === activityId ? null : current));
      showToast("Aktion entfernt");

      try {
        await deleteActivityAction(activityId, authUser.id);
      } catch (err) {
        console.error("handleDeleteActivity error", err);
        // Rollback bei Fehler
        setActivities(prev);
        showToast("Failed to delete activity", "error");
      }
    },
    [activities, authUser, showToast]
  );

  const handleToggleJoin = useCallback(
    async (activityId: string, providedPassword?: string) => {
      if (!authUser) {
        showToast("Bitte melde dich an, um teilzunehmen.", "info");
        return;
      }

      if (!userProfile) {
        setIsProfileModalOpen(true);
        showToast("Lege zuerst dein nearvibe Profil an", "info");
        return;
      }

      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      // Don't allow joining closed activities
      if (activity.isClosed) {
        showToast("Diese Aktion wurde bereits beendet.", "info");
        return;
      }

      // Check max participants limit
      if (activity.maxParticipants && activity.joinedUserIds.length >= activity.maxParticipants) {
        showToast("Diese Aktion ist bereits voll.", "info");
        return;
      }

      const isJoined = activity.joinedUserIds.includes(authUser.id);

      // If leaving, no need to check access
      if (isJoined) {
        const optimistic: Activity = {
          ...activity,
          joinedUserIds: activity.joinedUserIds.filter((id) => id !== authUser.id),
        };

        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? optimistic : a))
        );

        showToast("Du hast die Aktion verlassen", "info");

        try {
          const updated = await leaveActivityAction(activity, authUser.id);
          setActivities((prev) =>
            prev.map((a) => (a.id === activity.id ? updated : a))
          );
        } catch (err) {
          console.error("handleToggleJoin error", err);
          setActivities((prev) =>
            prev.map((a) => (a.id === activity.id ? activity : a))
          );
          showToast("Teilnahme konnte nicht aktualisiert werden", "error");
        }
        return;
      }

      // Check access before joining
      try {
        const response = await fetch("/api/activities/check-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId: activity.id,
            userId: authUser.id,
            password: providedPassword || null,
          }),
        });

        const data = await response.json();

        if (!data.canJoin) {
          if (data.requiresFriendship) {
            setPasswordPromptRequiresFriendship(true);
            setPasswordPromptActivity(activity);
            showToast("Du musst mit dem Host befreundet sein, um beizutreten.", "info");
            return;
          }
          if (data.requiresPassword) {
            setPasswordPromptRequiresFriendship(false);
            setPasswordPromptActivity(activity);
            return;
          }
          showToast("Du kannst dieser Aktion nicht beitreten.", "error");
          return;
        }

        // Access granted, proceed with join
        const optimistic: Activity = {
          ...activity,
          joinedUserIds: [...activity.joinedUserIds, authUser.id],
        };

        setActivities((prev) =>
          prev.map((a) => (a.id === activity.id ? optimistic : a))
        );

        showToast("Du nimmst jetzt teil");

        try {
          const updated = await joinActivityAction(activity, authUser.id);
          setActivities((prev) =>
            prev.map((a) => (a.id === activity.id ? updated : a))
          );
        } catch (err) {
          console.error("handleToggleJoin error", err);
          setActivities((prev) =>
            prev.map((a) => (a.id === activity.id ? activity : a))
          );
          showToast("Teilnahme konnte nicht aktualisiert werden", "error");
        }
      } catch (err) {
        console.error("handleToggleJoin access check error", err);
        showToast("Zugriff konnte nicht geprüft werden", "error");
      }
    },
    [activities, authUser, userProfile, showToast]
  );

  const handleOpenProfile = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const handleViewOwnProfile = useCallback(() => {
    if (authUser) {
      setProfileSheetUserId(authUser.id);
      setIsProfileSheetOpen(true);
    }
  }, [authUser]);

  const handleCloseProfile = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const handleSaveProfile = useCallback(async (profile: { name: string; username?: string | null; emoji: string | null; bio?: string | null; profileImageUrl?: string | null; profileGalleryUrls?: string[] | null }) => {
    if (!authUser) {
      showToast("Bitte melde dich an, um dein Profil zu speichern.", "error");
      return;
    }

    // Preserve existing profileImageUrl if not explicitly changed
    const profileToSave: UserProfile = {
      userId: authUser.id,
      displayName: profile.name.trim(),
      username: profile.username ?? null,
      emoji: profile.emoji ?? null,
      bio: profile.bio ?? null,
      profileImageUrl: profile.profileImageUrl ?? userProfile?.profileImageUrl ?? null,
      profileGalleryUrls: profile.profileGalleryUrls ?? userProfile?.profileGalleryUrls ?? null,
    };

    try {
      const saved = await upsertRemoteUserProfile(profileToSave);

      // Gallery URLs are now saved directly in the database via upsertRemoteUserProfile
      setUserProfile(saved);
      const refreshedTrust = await fetchTrustProfile(authUser.id);
      setTrustProfile(refreshedTrust);
      setIsProfileModalOpen(false);
      showToast("Profil gespeichert ✨", "success");
    } catch (err: any) {
      console.error("[MainApp] save profile error", err);
      const errorMsg =
        err?.message ||
        err?.error?.message ||
        err?.error_description ||
        "Profil konnte nicht mit dem Server synchronisiert werden.";
      showToast(`Profil-Sync-Fehler: ${errorMsg}`, "error");
      // Re-throw so the modal can handle it
      throw err;
    }
  }, [authUser, userProfile, showToast]);

  const handleFinishOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.ONBOARDED, "1");
    }
    setShowOnboarding(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await authSignOut();
    setUserProfile(null);
    setBusinessProfile(null);
    showToast("Du wurdest abgemeldet.", "info");
  }, [authSignOut, showToast]);

  const handleManageBusiness = useCallback(() => {
    setIsBusinessProfileModalOpen(true);
  }, []);

  const handleBusinessProfileSave = useCallback(async (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    // Refresh to pull server-calculated fields (status, timestamps)
    refreshBusinessProfile();
    showToast("Business-Profil gespeichert ✨", "success");
  }, [refreshBusinessProfile, showToast]);

  // Surface business profile load errors once
  useEffect(() => {
    if (businessProfileError) {
      showToast(businessProfileError, "error");
    }
  }, [businessProfileError, showToast]);

  // All useEffect hooks
  // Load activities from Supabase on mount (only if authenticated)
  useEffect(() => {
    if (authLoading || !authUser) return; // Only load if authenticated

    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const [activitiesData, businessesData] = await Promise.all([
          fetchActivities(),
          fetchVerifiedBusinesses().catch((err) => {
            console.warn("Failed to load businesses", err);
            return [];
          }),
        ]);
        if (isMounted) {
          setActivities(activitiesData);
          setVerifiedBusinesses(businessesData);
          // Create map for quick lookup
          const businessMap: Record<string, BusinessProfile> = {};
          businessesData.forEach((business) => {
            businessMap[business.id] = business;
          });
          setBusinessProfilesMap(businessMap);
          setError(null);
        }
      } catch (err: any) {
        console.error("load activities error", err);
        if (isMounted) setError("Aktionen konnten nicht geladen werden.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [authLoading, authUser]); // Depend on authLoading and authUser

  // Load filters and favorites from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.FILTERS);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          categoryFilter?: ActivityFilterCategory;
          joinedFilter?: ActivityFilterJoined;
          visibilityFilter?: ActivityFilterVisibility;
          ownershipFilter?: OwnershipFilter;
          sortOption?: SortOption;
          businessFilter?: "all" | "business" | "user";
        };
        if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter);
        if (parsed.joinedFilter) setJoinedFilter(parsed.joinedFilter);
        if (parsed.visibilityFilter) setVisibilityFilter(parsed.visibilityFilter);
        if (parsed.ownershipFilter) setOwnershipFilter(parsed.ownershipFilter);
        if (parsed.sortOption) setSortOption(parsed.sortOption);
        if (parsed.businessFilter) setBusinessFilter(parsed.businessFilter);
      }

      // Load favorites
      const storedFavorites = window.localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites) as string[];
          setFavorites(new Set(parsed));
        } catch (e) {
          console.warn("Failed to parse favorites", e);
        }
      }
    } catch (error) {
      console.warn("Failed to parse stored filters", error);
    }
  }, []);

  // Get user location for distance sorting
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Failed to get user location", error);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Persist filters to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.FILTERS,
        JSON.stringify({ categoryFilter, joinedFilter, visibilityFilter, ownershipFilter, sortOption, businessFilter })
      );
    } catch (error) {
      console.warn("Failed to store filters", error);
    }
  }, [categoryFilter, joinedFilter, visibilityFilter, ownershipFilter, sortOption, businessFilter]);

  // Persist favorites to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.FAVORITES,
        JSON.stringify(Array.from(favorites))
      );
    } catch (error) {
      console.warn("Failed to store favorites", error);
    }
  }, [favorites]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((activityId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
        showToast("Aus Favoriten entfernt", "info");
      } else {
        newSet.add(activityId);
        showToast("Zu Favoriten hinzugefügt", "success");
      }
      return newSet;
    });
  }, [showToast]);

  // Clear selected activity if it's filtered out
  useEffect(() => {
    if (selectedActivityId) {
      const isVisible = filteredActivities.some((act) => act.id === selectedActivityId);
      if (!isVisible) {
        setSelectedActivityId(null);
      }
    }
  }, [filteredActivities, selectedActivityId]);

  // Scroll to selected activity when it appears
  useEffect(() => {
    if (!selectedActivityId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-activity-id="${selectedActivityId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedActivityId, filteredActivities]);

  // Also use cardRefs for scrolling (fallback)
  useEffect(() => {
    if (!selectedActivityId) return;
    const target = cardRefs.current[selectedActivityId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedActivityId]);

  // Check if onboarding should be shown (first visit)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onboarded = window.localStorage.getItem(STORAGE_KEYS.ONBOARDED);
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Initialize profile from Supabase (only if authenticated)
  useEffect(() => {
    if (authLoading) return;
    if (!authUser) return; // auth gate will handle UI

    const currentUserId = authUser.id;
    let cancelled = false;

    async function initProfile() {
      setProfileLoading(true);
      try {
        const remote = await fetchRemoteUserProfile(currentUserId);
        const trust = await fetchTrustProfile(currentUserId);

        if (cancelled) return;

        if (remote) {
          // Gallery URLs are now loaded from database via fetchRemoteUserProfile
          setUserProfile(remote);
          setTrustProfile(trust);
          return;
        }

        // no remote profile: open modal
        setUserProfile(null);
        setTrustProfile(trust);
        setIsProfileModalOpen(true);
      } catch (err) {
        console.error("[MainApp] initProfile error", err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    initProfile();

    return () => {
      cancelled = true;
    };
  }, [authUser, authLoading]);


  // Constants
  const visibilityLabelMap: Record<ActivityVisibility, string> = {
    public: "ÖFFENTLICH",
    friends: "FREUNDE",
    private: "PRIVAT",
  };

  // Helper component for full-screen messages
  const FullScreenMessage = ({ text }: { text: string }) => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <p className="text-white/60 text-xs">{text}</p>
    </div>
  );

  if (authLoading) {
    return <FullScreenMessage text="Lädt…" />;
  }

  if (!authUser) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <AuthModal isOpen={true} />
      </div>
    );
  }

  if (profileLoading) {
    return <FullScreenMessage text="Profil wird geladen…" />;
  }

  if (!userProfile) {
    return (
      <EditProfileModal
        open={true}
        initialProfile={null}
        onClose={() => {
          // prevent closing if there is still no profile
        }}
        onSave={async (partial) => {
          if (!authUser) return;
          const newProfile: UserProfile = {
            userId: authUser.id,
            displayName: partial.name.trim(),
            username: partial.username ?? null,
            emoji: partial.emoji ?? null,
            bio: partial.bio ?? null,
            profileImageUrl: partial.profileImageUrl ?? null,
            profileGalleryUrls: partial.profileGalleryUrls ?? null,
          };
          try {
            const saved = await upsertRemoteUserProfile(newProfile);
            setUserProfile(saved);
            const refreshedTrust = await fetchTrustProfile(authUser.id);
            setTrustProfile(refreshedTrust);
          } catch (err: any) {
            console.error("[MainApp] save profile error (gate)", err);
            const errorMsg =
              err?.message ||
              err?.error?.message ||
              err?.error_description ||
              "Profil konnte nicht gespeichert werden.";
            showToast(`Profil-Fehler: ${errorMsg}`, "error");
          }
        }}
      />
    );
  }

  // Derived state for selected activity
  const isHost = selectedActivity?.hostUserId === authUser?.id;
  const isJoined = selectedActivity?.joinedUserIds.includes(authUser?.id ?? "") ?? false;
  const participantsCount = selectedActivity?.joinedUserIds.length ?? 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 md:px-8">
        {/* Top bar */}
        <header
          className={clsx(
            "fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 sm:gap-4",
            "glass-panel rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
            "transition-all duration-300 ease-out"
          )}
        >
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            {/* Logo with Icon */}
            <div className="relative flex-shrink-0">
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-gradient-to-br from-brand/20 to-brand/10 border border-brand/30 shadow-lg shadow-brand/20 backdrop-blur-sm">
                <Image
                  src="/icon-192x192.png"
                  alt="nearvibe"
                  width={40}
                  height={40}
                  className="object-contain p-1.5"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base sm:text-[17px] font-bold tracking-tight truncate text-white bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                nearvibe
              </span>
              <span className="hidden sm:block text-[11px] text-white/60 leading-tight truncate">
                Find people near you who are currently active — meet, connect, vibe.
              </span>
            </div>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-gradient-to-r from-purple-600/30 to-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-1 text-[10px] font-semibold shadow-md backdrop-blur-sm">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Mobile: Activities button */}
            <button
              type="button"
              onClick={() => {
                setMobileTab("activities");
                setIsActivitiesSheetOpen(true);
              }}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 transition-all duration-200 min-h-[44px] min-w-[44px] border border-white/15 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              aria-label="Aktionen öffnen"
            >
              <List className="h-5 w-5 text-white" />
            </button>
            {userProfile && authUser && (
              <AccountMenu
                profile={userProfile}
                email={authUser.email ?? null}
                onEditProfile={handleOpenProfile}
                onViewProfile={handleViewOwnProfile}
                onLogout={handleLogout}
                onManageBusiness={handleManageBusiness}
                onOpenFriends={() => setIsFriendsPanelOpen(true)}
                onOpenStats={() => setIsStatsPanelOpen(true)}
                onOpenLeaderboard={() => setIsLeaderboardPanelOpen(true)}
                hasBusiness={!!businessProfile}
                businessStatus={businessProfile?.status ?? null}
                businessLoading={businessProfileLoading}
                onOpenShop={() => setIsShopOpen(true)}
              />
            )}
            <span className="hidden sm:inline-flex items-center rounded-full border border-white/20 bg-gradient-to-r from-white/10 to-white/5 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-white/70 backdrop-blur-sm shadow-sm">
              BETA
            </span>
          </div>
        </header>

        {/* Main grid */}
        <div className="pt-20 sm:pt-24 pb-6 flex flex-1 flex-col gap-4 sm:gap-6 lg:flex-row lg:h-[calc(100vh-100px)] lg:overflow-hidden">

          {/* LEFT SIDEBAR: Global Chat (Desktop) */}
          <AnimatePresence mode="wait">
            {isLeftSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden lg:flex flex-col shrink-0 h-full pb-safe pl-2"
              >
                <div className="h-full rounded-3xl glass-panel overflow-hidden flex flex-col">
                  <GlobalChatPanel userId={authUser?.id ?? "anon"} userProfile={userProfile} dense={true} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* CENTER: Map + FilterBar */}
          <section
            className={clsx(
              "flex-1 relative flex flex-col",
              "h-[calc(100vh-180px)] lg:h-full lg:rounded-3xl lg:overflow-hidden",
            )}
            aria-label="Karte mit Aktionen"
          >
            {/* Desktop Filter Bar (Floating) */}
            <div className="hidden lg:block absolute top-4 left-4 right-4 z-[400]">
              <DesktopFilterBar
                sortOption={sortOption}
                setSortOption={setSortOption}
                historyFilter={historyFilter}
                setHistoryFilter={setHistoryFilter}
                businessFilter={businessFilter}
                setBusinessFilter={setBusinessFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                joinedFilter={joinedFilter}
                setJoinedFilter={setJoinedFilter}
                visibilityFilter={visibilityFilter}
                setVisibilityFilter={setVisibilityFilter}
                ownershipFilter={ownershipFilter}
                setOwnershipFilter={setOwnershipFilter}
                onToggleList={() => setIsRightSidebarOpen(prev => !prev)}
                isListOpen={isRightSidebarOpen}
                onToggleChat={() => setIsLeftSidebarOpen(prev => !prev)}
                isChatOpen={isLeftSidebarOpen}
              />
            </div>

            <MapView
              activities={filteredActivities}
              selectedActivityId={selectedActivityId}
              selectedLocation={pendingLocation}
              onMapClick={(coords) => setPendingLocation(coords)}
              onMarkerSelect={handleMarkerSelect}
              searchQuery={mapSearchQuery}
              onSearchChange={setMapSearchQuery}
              businesses={verifiedBusinesses}
            />
          </section>

          {/* RIGHT SIDEBAR: List */}
          <AnimatePresence mode="wait">
            {isRightSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={clsx(
                  "hidden lg:flex",
                  "shrink-0 h-full overflow-hidden flex-col gap-3 pr-2"
                )}
                aria-label="Aktionen-Liste"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full bg-white/5 p-1 text-[11px] border border-white/10" role="tablist" aria-label="Ansicht wechseln">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sidebarMode === "all"}
                      aria-controls="activities-list"
                      onClick={() => setSidebarMode("all")}
                      className={clsx(
                        "px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50",
                        sidebarMode === "all"
                          ? "bg-white text-black"
                          : "text-white/70 hover:text-white/90"
                      )}
                    >
                      Alle
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sidebarMode === "mine"}
                      aria-controls="activities-list"
                      onClick={() => setSidebarMode("mine")}
                      className={clsx(
                        "px-3 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50",
                        sidebarMode === "mine"
                          ? "bg-white text-black"
                          : "text-white/70 hover:text-white/90"
                      )}
                    >
                      Meine Aktionen
                    </button>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-neutral-400 transition-all duration-200">
                    Öffentlich · In deiner Nähe
                  </span>
                </div>



                <div
                  ref={listRef}
                  id="activities-list"
                  role="tabpanel"
                  aria-label={sidebarMode === "all" ? "Alle Aktionen" : "Meine Aktionen"}
                  className={clsx(
                    "flex-1 space-y-3 rounded-3xl border p-3 sm:p-4 transition-all duration-300",
                    "border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/20"
                  )}
                >
                  {/* Quick Actions - Show when no activities or at top */}
                  {!isLoading && !error && sidebarMode === "all" && (
                    <QuickActions
                      onSelect={(category, title) => {
                        setQuickActionTitle(title);
                        setQuickActionCategory(category);
                        setIsCreateOpen(true);
                      }}
                    />
                  )}

                  {/* Activity Suggestions - Show when activities exist */}
                  {!isLoading && !error && filteredActivities.length > 0 && sidebarMode === "all" && (
                    <ActivitySuggestions
                      activities={filteredActivities}
                      userLocation={userLocation}
                      onActivityClick={handleActivityClick}
                    />
                  )}

                  {isLoading && (
                    <div className="text-center py-8 text-white/60 text-sm" role="status" aria-live="polite">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        <span>Lade Aktionen…</span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="text-center py-8 text-red-400 text-sm" role="alert">
                      {error}
                    </div>
                  )}
                  {!isLoading && !error && filteredActivities.length === 0 && (
                    <div className="text-center py-8 text-white/60 text-sm">
                      <p>Gerade gibt es hier nichts – starte doch die erste Aktion ✨</p>
                    </div>
                  )}
                  {filteredActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity as EnhancedActivity}
                      isSelected={selectedActivityId === activity.id}
                      currentUserName={currentUserName}
                      sidebarMode={sidebarMode}
                      favorites={favorites}
                      businessProfilesMap={businessProfilesMap}
                      visibilityLabelMap={visibilityLabelMap}
                      onSelect={handleActivityClick}
                      onToggleJoin={handleToggleJoin}
                      onToggleFavorite={handleToggleFavorite}
                      onShare={handleShareActivity}
                      onReport={handleReportActivity}
                      onEnd={handleEndActivity}
                      onDelete={handleDeleteActivity}
                      onParticipantClick={(userId) => {
                        setProfileSheetUserId(userId);
                        setIsProfileSheetOpen(true);
                      }}
                      cardRef={(node) => {
                        if (node) {
                          cardRefs.current[activity.id] = node;
                        } else {
                          delete cardRefs.current[activity.id];
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Chat Panel - Desktop only */}
                {authUser && (
                  <>
                    {selectedActivity && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4"
                      >
                        <ActivityChatPanel
                          activityId={selectedActivity.id}
                          activityTitle={selectedActivity.title}
                          userId={authUser.id}
                          userProfile={userProfile}
                          isClosed={selectedActivity._isClosed}
                        />
                      </motion.div>
                    )}


                  </>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={(tab) => {
            // Prevent flickering by batching state updates
            requestAnimationFrame(() => {
              setMobileTab(tab);
              if (tab === "activities") {
                setIsActivitiesSheetOpen(true);
                setIsChatSheetOpen(false);
              } else if (tab === "chat") {
                setIsChatSheetOpen(true);
                setIsActivitiesSheetOpen(false);
              } else {
                setIsActivitiesSheetOpen(false);
                setIsChatSheetOpen(false);
              }
            });
          }}
          showChat={!!authUser}
        />

        {/* --- MOBILE OVERLAYS (Fluid Glass Sheets) --- */}

        {/* 1. Activities Sheet */}
        <GlassSheet
          isOpen={mobileTab === "activities"}
          onClose={() => setMobileTab("map")}
          title="Aktionen"
          height="auto" // Default to ~75% or auto
        >
          <ActivityList
            activities={filteredActivities}
            onSelectActivity={(activity) => {
              setSelectedActivityId(activity.id);
              setMobileTab("map");
            }}
            loading={isLoading}
            isMobileView={true}
          />
        </GlassSheet>

        {/* 2. Global Chat Sheet */}
        <GlassSheet
          isOpen={mobileTab === "chat"}
          onClose={() => setMobileTab("map")}
          title="Global Chat"
          height="full"
        >
          <div className="h-full flex flex-col pb-safe">
            <GlobalChatPanel userId={authUser?.id ?? "anon"} userProfile={userProfile} dense={true} />
          </div>
        </GlassSheet>

        {/* 3. Activity Details Sheet (Mobile) */}
        <ActivityDetailsSheet
          activity={selectedActivity}
          isOpen={!!selectedActivity && mobileTab === "map" && !isChatSheetOpen && !isCreateOpen && !isProfileModalOpen}
          onClose={() => setSelectedActivityId(null)}
          currentUserId={authUser?.id || ""}
          onToggleJoin={handleToggleJoin}
          onDelete={handleDeleteActivity}
          onEnd={handleEndActivity}
          isHost={isHost}
          isJoined={isJoined}
          participantsCount={participantsCount}
          onParticipantClick={(userId) => {
            setProfileSheetUserId(userId);
            setIsProfileSheetOpen(true);
          }}
        />

        {/* Mobile Chat Bottom Sheet (Activity Specific) */}
        {
          selectedActivity && selectedActivity._hasJoined && authUser && (
            <BottomSheet
              isOpen={isChatSheetOpen && mobileTab !== "chat" && mobileTab !== "activities"}
              onClose={() => {
                setIsChatSheetOpen(false);
              }}
              title={selectedActivity.title}
              maxHeight="85vh"
            >
              <div className="px-3 pb-4 space-y-4">
                <div>
                  <ActivityChatPanel
                    activityId={selectedActivity.id}
                    activityTitle={selectedActivity.title}
                    userId={authUser.id}
                    userProfile={userProfile}
                    isClosed={selectedActivity._isClosed}
                  />
                </div>
              </div>
            </BottomSheet>
          )
        }

        {/* Floating action button - Position adjusted for mobile bottom nav */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateOpen(true)}
          aria-label="Neue Aktion erstellen"
          className={clsx(
            "fixed right-4 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand via-brand-light to-brand px-5 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-brand/40 hover:shadow-2xl hover:shadow-brand/50 active:scale-[0.95] transition-all duration-300 z-40 backdrop-blur-sm border border-brand/30",
            "bottom-20 md:bottom-8", // Mobile: Above bottom nav, Desktop: normal position
            "safe-area-inset-bottom"
          )}
        >
          <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/20 text-base sm:text-lg font-bold shadow-inner">
            +
          </span>
          <span className="hidden sm:inline">Neue Aktion starten</span>
          <span className="sm:hidden font-semibold">Neu</span>
        </motion.button>

        {/* Create Activity Modal */}
        <AnimatePresence>
          {isCreateOpen && (
            <CreateActivityModal
              isOpen={isCreateOpen}
              onClose={() => {
                setIsCreateOpen(false);
                setPendingLocation(null);
                setQuickActionTitle(null);
                setQuickActionCategory(null);
              }}
              initialTitle={quickActionTitle || undefined}
              initialCategory={quickActionCategory || undefined}
              businessProfile={businessProfile ? {
                id: businessProfile.id,
                status: businessProfile.status,
                promotionCredits: businessProfile.promotionCredits,
                canCreateActivities: businessProfile.canCreateActivities ?? false,
                businessName: businessProfile.businessName,
              } : null}
              onCreate={async (payload: {
                title: string;
                description: string;
                time: string;
                locationName: string;
                category: ActivityCategory;
                visibility: ActivityVisibility;
                location: { latitude: number; longitude: number } | null;
                startTime: string;
                endTime: string;
                password?: string | null;
                maxParticipants?: number | null;
                isBusinessActivity?: boolean;
                businessId?: string | null;
              }) => {
                const {
                  title,
                  description,
                  time,
                  category,
                  visibility,
                  location: modalLocation,
                  startTime,
                  endTime,
                  password,
                  maxParticipants,
                } = payload;

                if (!modalLocation) return;

                if (!authUser) {
                  showToast("Bitte melde dich an, um Aktionen zu erstellen.", "info");
                  return;
                }

                if (!userProfile) {
                  setIsProfileModalOpen(true);
                  showToast("Lege zuerst dein nearvibe Profil an", "info");
                  return;
                }

                // Extract business activity info from payload (set by modal)
                const isBusinessActivity = payload.isBusinessActivity ?? false;
                const businessId = payload.businessId ?? null;

                // Validate business activity creation
                if (isBusinessActivity) {
                  const isVerifiedBusiness = businessProfile && businessProfile.status === "verified";
                  const hasCredits = businessProfile && (businessProfile.promotionCredits > 0 || businessProfile.canCreateActivities);

                  if (!isVerifiedBusiness || !hasCredits) {
                    showToast("Du benötigst ein verifiziertes Business-Profil mit Credits, um Business-Activities zu erstellen.", "error");
                    return;
                  }
                }

                const formData = {
                  title,
                  description: description ?? "",
                  time,
                  locationName: payload.locationName,
                  latitude: modalLocation.latitude,
                  longitude: modalLocation.longitude,
                  category,
                  visibility,
                };

                const optimistic: Activity = {
                  id: `temp-${Date.now()}`,
                  ...formData,
                  hostName: currentUserName,
                  hostId: authUser.id,
                  hostUserId: authUser.id,
                  joinedUserIds: [],
                  createdAt: new Date().toISOString(),
                  startTime,
                  endTime,
                  isClosed: false,
                  password: password || null,
                  maxParticipants: maxParticipants || null,
                  businessId: businessId,
                  isBusinessActivity: isBusinessActivity,
                  promotionLevel: "none",
                };

                setActivities((prev) => [optimistic, ...prev]);
                setIsCreateOpen(false);
                setPendingLocation(null);
                setSelectedActivityId(optimistic.id);
                showToast("Aktion erstellt");

                try {
                  const created = await createActivityAction({
                    ...optimistic,
                    id: "", // leere ID -> Supabase generiert
                  });

                  setActivities((prev) =>
                    prev.map((a) => (a.id === optimistic.id ? created : a))
                  );
                  setSelectedActivityId(created.id);
                } catch (err) {
                  console.error("handleCreateActivity error", err);
                  setActivities((prev) => prev.filter((a) => a.id !== optimistic.id));
                  showToast("Aktion konnte nicht gespeichert werden", "error");
                }
              }}
              onValidationError={(message) => {
                showToast(message, "error");
              }}
              pendingLocation={pendingLocation}
            />
          )}
        </AnimatePresence>

        {/* Password Prompt Modal */}
        <PasswordPromptModal
          isOpen={!!passwordPromptActivity}
          onClose={() => {
            setPasswordPromptActivity(null);
            setPasswordPromptRequiresFriendship(false);
          }}
          onSubmit={(password) => {
            if (passwordPromptActivity) {
              handleToggleJoin(passwordPromptActivity.id, password);
              setPasswordPromptActivity(null);
              setPasswordPromptRequiresFriendship(false);
            }
          }}
          activityTitle={passwordPromptActivity?.title || ""}
          requiresFriendship={passwordPromptRequiresFriendship}
        />

        {/* Friends Panel */}
        {authUser && (
          <FriendsPanel
            isOpen={isFriendsPanelOpen}
            onClose={() => setIsFriendsPanelOpen(false)}
            userId={authUser.id}
          />
        )}

        {/* User Stats Panel */}
        {authUser && (
          <UserStatsPanel
            userId={authUser.id}
            isOpen={isStatsPanelOpen}
            onClose={() => setIsStatsPanelOpen(false)}
          />
        )}

        {/* Leaderboard Panel */}
        <LeaderboardPanel
          isOpen={isLeaderboardPanelOpen}
          onClose={() => setIsLeaderboardPanelOpen(false)}
          currentUserId={authUser?.id ?? null}
        />

        {/* Edit Profile Modal */}
        <EditProfileModal
          open={isProfileModalOpen}
          initialProfile={userProfile ? {
            name: userProfile.displayName,
            username: userProfile.username ?? null,
            emoji: userProfile.emoji ?? DEFAULT_EMOJI,
            bio: userProfile.bio ?? null,
            profileGalleryUrls: userProfile.profileGalleryUrls ?? null,
          } : null}
          initialProfileImageUrl={userProfile?.profileImageUrl ?? null}
          initialGalleryUrls={userProfile?.profileGalleryUrls ?? null}
          onClose={handleCloseProfile}
          onSave={handleSaveProfile}
          trustProfile={trustProfile}
          onTrustProfileRefresh={async () => {
            const refreshed = await fetchTrustProfile(authUser.id);
            setTrustProfile(refreshed);
          }}
        />

        {/* User Profile Sheet */}
        {profileSheetUserId && (
          <UserProfileSheet
            userId={profileSheetUserId}
            isOpen={isProfileSheetOpen}
            onClose={() => {
              setIsProfileSheetOpen(false);
              setTimeout(() => setProfileSheetUserId(null), 150);
            }}
          />
        )}

        {/* Report Activity Modal */}
        {authUser && (
          <ReportActivityModal
            isOpen={isReportModalOpen}
            activityId={reportActivityId}
            hostUserId={reportHostUserId}
            reporterUserId={authUser.id}
            onClose={() => {
              setIsReportModalOpen(false);
              setTimeout(() => {
                setReportActivityId(null);
                setReportHostUserId(null);
              }, 150);
            }}
            showToast={showToast}
          />
        )}

        {/* Onboarding Overlay */}
        {showOnboarding && (
          <OnboardingOverlay onFinish={handleFinishOnboarding} />
        )}

        {/* Business Profile Modal */}
        {authUser && (
          <BusinessProfileModal
            isOpen={isBusinessProfileModalOpen}
            onClose={() => setIsBusinessProfileModalOpen(false)}
            onSave={handleBusinessProfileSave}
            userId={authUser.id}
            initialProfile={businessProfile}
          />
        )}

        {/* Toast notifications */}
        <div
          className={clsx(
            "pointer-events-none fixed inset-x-0 flex justify-center z-50",
            "bottom-20 md:bottom-6",
            "safe-area-inset-bottom"
          )}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={clsx(
                    "pointer-events-auto rounded-full px-4 py-2 text-sm shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-white/10 bg-white/95 text-black backdrop-blur transition-all",
                    toast.variant === "error" && "border-red-400 text-red-800",
                    toast.variant === "info" && "border-black/20 text-black/80"
                  )}
                  role="alert"
                >
                  {toast.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Business Shop Modal */}
        {businessProfile && (
          <BusinessShopModal
            isOpen={isShopOpen}
            onClose={() => setIsShopOpen(false)}
            businessProfile={businessProfile}
            onCreditsPurchased={() => {
              refreshBusinessProfile();
              showToast("Credits wurden aufgeladen! 🚀", "success");
            }}
          />
        )}
      </div>
    </main>
  );
}



