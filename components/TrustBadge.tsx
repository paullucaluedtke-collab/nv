// components/TrustBadge.tsx
"use client";

import { memo } from "react";
import clsx from "clsx";
import type { TrustLevel } from "../types/trust";

type Props = {
  trustLevel: TrustLevel;
  trustScore?: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
};

const TRUST_CONFIG: Record<TrustLevel, { label: string; color: string; icon: string }> = {
  unverified: {
    label: "Unverifiziert",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: "⚪",
  },
  basic: {
    label: "Basic",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: "🔵",
  },
  verified: {
    label: "Verifiziert",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: "✅",
  },
  trusted: {
    label: "Trusted",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: "🛡️",
  },
  premium: {
    label: "Premium",
    color: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30",
    icon: "⭐",
  },
};

function TrustBadge({ trustLevel, trustScore, size = "md", showScore = false }: Props) {
  const config = TRUST_CONFIG[trustLevel];

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[9px]",
    md: "px-2 py-1 text-[10px]",
    lg: "px-3 py-1.5 text-xs",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.color,
        sizeClasses[size]
      )}
      title={showScore && trustScore !== undefined ? `Trust Score: ${trustScore}/100` : config.label}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showScore && trustScore !== undefined && (
        <span className="opacity-70">({trustScore})</span>
      )}
    </div>
  );
}

export default memo(TrustBadge);








