"use client";

import React, { memo } from "react";
import Image from "next/image";
import type { UserProfile } from "../lib/userProfileRepository";
import clsx from "clsx";

type Props = {
  profile: UserProfile | null;
  onClick: () => void;
};

function ProfileButton({ profile, onClick }: Props) {
  const hasProfile = !!profile;
  const label = hasProfile ? profile!.displayName : "Profil anlegen";
  const initials = hasProfile && profile!.displayName
    ? profile!.displayName.trim()[0]?.toUpperCase() ?? "U"
    : "U";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors",
        hasProfile
          ? "bg-neutral-900/80 text-neutral-100 shadow-sm ring-1 ring-white/10 hover:bg-neutral-800 hover:ring-white/20"
          : "bg-brand/20 text-white shadow-sm ring-1 ring-brand/60 hover:bg-brand/30 animate-pulse"
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-sm overflow-hidden">
        {hasProfile && profile!.profileImageUrl ? (
          <Image
            src={profile!.profileImageUrl}
            alt={label}
            width={20}
            height={20}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[10px] font-medium">{initials}</span>
        )}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export default memo(ProfileButton);

