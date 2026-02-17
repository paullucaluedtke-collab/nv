"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Building2, Loader2, Plus, Users, Trophy, TrendingUp, ShoppingBag } from "lucide-react";
import type { UserProfile } from "@/lib/userProfileRepository";
import type { BusinessStatus } from "@/types/business";

type Props = {
  profile: UserProfile;
  email: string | null;
  onEditProfile: () => void;
  onViewProfile?: () => void;
  onLogout: () => void;
  onManageBusiness?: () => void;
  onOpenShop?: () => void;
  onOpenFriends?: () => void;
  onOpenStats?: () => void;
  onOpenLeaderboard?: () => void;
  hasBusiness?: boolean;
  businessStatus?: BusinessStatus | null;
  businessLoading?: boolean;
};

export default function AccountMenu({
  profile,
  email,
  onEditProfile,
  onViewProfile,
  onLogout,
  onManageBusiness,
  onOpenShop,
  onOpenFriends,
  onOpenStats,
  onOpenLeaderboard,
  hasBusiness,
  businessStatus,
  businessLoading,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  const initials =
    profile.displayName?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account-Menü öffnen"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm overflow-hidden">
          {profile.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium">{initials}</span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs font-medium text-white">
            {profile.displayName || "Profil"}
          </span>
          {email && (
            <span className="text-[10px] text-white/60 truncate max-w-[120px]">
              {email}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-void-card backdrop-blur-xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden ring-1 ring-white/5"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEditProfile();
              }}
              role="menuitem"
              className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              Profil bearbeiten
            </button>
            {onViewProfile && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onViewProfile();
                }}
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Profil anzeigen
              </button>
            )}
            {onOpenFriends && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenFriends();
                }}
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-light" />
                  Freunde
                </span>
              </button>
            )}
            {onOpenStats && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenStats();
                }}
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Meine Stats
                </span>
              </button>
            )}
            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenLeaderboard();
                }}
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Leaderboard
                </span>
              </button>
            )}
            {onManageBusiness && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onManageBusiness();
                }}
                role="menuitem"
                className={clsx(
                  "block w-full px-3 py-2.5 text-left transition-all rounded-xl mt-1",
                  hasBusiness
                    ? "text-white/80 hover:text-white hover:bg-white/5"
                    : "bg-brand/10 text-brand-light hover:bg-brand/20 border border-brand/20"
                )}
              >
                <span className="flex items-center gap-2">
                  {hasBusiness ? (
                    <>
                      <Building2 className="h-4 w-4 text-brand-light" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>Business</span>
                        <span className="text-[10px] text-white/60">
                          {businessLoading ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              lädt…
                            </span>
                          ) : businessStatus === "verified" ? (
                            <span className="text-green-400">verifiziert</span>
                          ) : businessStatus === "pending" ? (
                            <span className="text-yellow-400">in Prüfung</span>
                          ) : (
                            <span className="text-white/40">{businessStatus}</span>
                          )}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Business erstellen
                    </>
                  )}
                </span>
              </button>
            )}
            {hasBusiness && onOpenShop && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenShop();
                }}
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-neon-purple" />
                  Credits aufladen
                </span>
              </button>
            )}
          </div>

          <div className="h-px bg-white/5 my-0.5 mx-2" />

          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              role="menuitem"
              className="block w-full px-3 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

