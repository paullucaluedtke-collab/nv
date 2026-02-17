"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { fetchRemoteUserProfile } from "@/lib/userProfileRepository";
import type { UserProfile } from "@/lib/userProfileRepository";
import { DEFAULT_EMOJI } from "@/lib/constants";
import Image from "next/image";

type Props = {
  participantIds: string[];
  onParticipantClick?: (userId: string) => void;
};

export default function ActivityParticipantsList({ participantIds, onParticipantClick }: Props) {
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (participantIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProfiles() {
      setLoading(true);
      const profileMap = new Map<string, UserProfile>();

      // Load profiles in parallel
      const promises = participantIds.map(async (userId) => {
        try {
          const profile = await fetchRemoteUserProfile(userId);
          if (profile && !cancelled) {
            profileMap.set(userId, profile);
          }
        } catch (err) {
          console.warn(`Failed to load profile for ${userId}`, err);
        }
      });

      await Promise.all(promises);

      if (!cancelled) {
        setProfiles(profileMap);
        setLoading(false);
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [participantIds]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/60">
        <div className="h-3 w-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
        <span>Lade Teilnehmer...</span>
      </div>
    );
  }

  if (participantIds.length === 0) {
    return (
      <div className="text-xs text-white/60">
        Noch keine Teilnehmer
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {participantIds.map((userId) => {
        const profile = profiles.get(userId);
        const displayName = profile?.displayName ?? "Unbekannt";
        const emoji = profile?.emoji ?? DEFAULT_EMOJI;
        const profileImageUrl = profile?.profileImageUrl;

        return (
          <button
            key={userId}
            type="button"
            onClick={() => onParticipantClick?.(userId)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-2 py-1",
              "bg-white/5 hover:bg-white/10 border border-white/10",
              "transition-colors text-xs text-white/90",
              "min-h-[28px]"
            )}
          >
            {profileImageUrl ? (
              <div className="relative h-5 w-5 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={profileImageUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <span className="text-sm flex-shrink-0">{emoji}</span>
            )}
            <span className="truncate max-w-[100px]">{displayName}</span>
          </button>
        );
      })}
    </div>
  );
}

