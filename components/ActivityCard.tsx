"use client";

import React from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Heart, MapPin } from "lucide-react";
import type { Activity, ActivityVisibility } from "@/types/activity";
import type { BusinessProfile } from "@/types/business";
import ActivityParticipantsList from "@/components/ActivityParticipantsList";

/* ---------- types ---------- */

export interface EnhancedActivity extends Activity {
    _isHost: boolean;
    _hasJoined: boolean;
    _joinedCount: number;
    _status: string;
    _hide: boolean;
    _isClosed: boolean;
}

export interface ActivityCardProps {
    activity: EnhancedActivity;
    isSelected: boolean;
    currentUserName: string;
    sidebarMode: "all" | "mine";
    favorites: Set<string>;
    businessProfilesMap: Record<string, BusinessProfile>;
    visibilityLabelMap: Record<ActivityVisibility, string>;
    onSelect: (activityId: string) => void;
    onToggleJoin: (activityId: string) => void;
    onToggleFavorite: (activityId: string) => void;
    onShare: (activityId: string) => void;
    onReport: (activityId: string, hostUserId: string | null) => void;
    onEnd: (activityId: string) => void;
    onDelete: (activityId: string) => void;
    onParticipantClick: (userId: string) => void;
    cardRef?: (node: HTMLElement | null) => void;
}

/* ---------- component ---------- */

export default function ActivityCard({
    activity,
    isSelected,
    currentUserName,
    sidebarMode,
    favorites,
    businessProfilesMap,
    visibilityLabelMap,
    onSelect,
    onToggleJoin,
    onToggleFavorite,
    onShare,
    onReport,
    onEnd,
    onDelete,
    onParticipantClick,
    cardRef,
}: ActivityCardProps) {
    const isJoined = activity._hasJoined;
    const isHost = activity._isHost;
    const participantsCount = activity.joinedUserIds.length;
    const joinLabel = isJoined ? "Teilgenommen" : "Teilnehmen";

    const joinButtonClasses = clsx(
        "rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all duration-200 shadow-md",
        isJoined
            ? "bg-gradient-to-r from-gray-50 to-white text-gray-700 border-gray-200 hover:from-gray-100 hover:to-gray-50 hover:shadow-lg hover:-translate-y-0.5"
            : "bg-gradient-to-r from-brand to-brand-light text-white border-brand/30 hover:from-brand-light hover:to-brand hover:shadow-lg hover:shadow-brand/30 hover:-translate-y-0.5"
    );

    const isBusiness =
        activity.isBusinessActivity &&
        activity.businessId &&
        businessProfilesMap[activity.businessId];

    return (
        <motion.div
            ref={cardRef}
            data-activity-id={activity.id}
            onClick={() => onSelect(activity.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(activity.id);
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Aktion: ${activity.title}`}
            whileHover={{ scale: 1.01, y: -1 }}
            transition={{ type: "spring", stiffness: 250, damping: 22 }}
            className={clsx(
                "flex w-full flex-col gap-2 rounded-2xl border px-4 sm:px-5 py-4 sm:py-5 text-left transition-all duration-300 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/50",
                isSelected
                    ? "border-brand/40 bg-gradient-to-br from-white via-white to-brand/5 text-black shadow-xl shadow-brand/20 ring-2 ring-brand/30 backdrop-blur-sm"
                    : isBusiness
                        ? "border-amber-400/40 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/80 backdrop-blur-xl text-black shadow-xl shadow-amber-500/20 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-1 ring-1 ring-amber-300/20"
                        : "border-white/10 bg-white/95 backdrop-blur-xl text-black shadow-lg shadow-black/5 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/10 hover:-translate-y-1"
            )}
        >
            {/* Title row */}
            <div className="flex items-center justify-between gap-2">
                <p className="text-[17px] font-bold tracking-tight text-black leading-tight">
                    {activity.title}
                </p>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(activity.id);
                        }}
                        className={clsx(
                            "p-2 rounded-full transition-all duration-200",
                            favorites.has(activity.id)
                                ? "text-red-500 bg-red-50 hover:bg-red-100 hover:scale-110"
                                : "text-black/30 hover:text-red-500 hover:bg-red-50/50 hover:scale-110"
                        )}
                        aria-label={
                            favorites.has(activity.id)
                                ? "Aus Favoriten entfernen"
                                : "Zu Favoriten hinzufügen"
                        }
                    >
                        <Heart
                            className={clsx(
                                "h-4 w-4 transition-all",
                                favorites.has(activity.id) && "fill-current scale-110"
                            )}
                        />
                    </button>

                    {/* Status badges */}
                    {activity._isClosed ? (
                        <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-semibold bg-gradient-to-r from-gray-400/20 to-gray-500/20 text-gray-700 border border-gray-300/30 shadow-sm">
                            Beendet
                        </span>
                    ) : activity._status && activity._status !== "unknown" ? (
                        <span
                            className={clsx(
                                "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-semibold border shadow-sm",
                                activity._status === "ongoing"
                                    ? "bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-700 border-green-300/30"
                                    : activity._status === "upcoming"
                                        ? "bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-blue-700 border-blue-300/30"
                                        : "bg-gradient-to-r from-gray-400/20 to-gray-500/20 text-gray-600 border-gray-300/30"
                            )}
                        >
                            {activity._status === "ongoing"
                                ? "Läuft gerade"
                                : activity._status === "upcoming"
                                    ? "Bevorstehend"
                                    : "Vorbei"}
                        </span>
                    ) : null}

                    {/* Promotion badge */}
                    {activity.promotionLevel &&
                        activity.promotionLevel !== "none" && (
                            <span
                                className={clsx(
                                    "rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-bold border shadow-md",
                                    activity.promotionLevel === "sponsored"
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400/50"
                                        : activity.promotionLevel === "boost"
                                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400/50"
                                            : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-yellow-300/50"
                                )}
                            >
                                {activity.promotionLevel === "sponsored"
                                    ? "⭐ SPONSORED"
                                    : activity.promotionLevel === "boost"
                                        ? "🚀 BOOST"
                                        : "✨ FEATURED"}
                            </span>
                        )}

                    {/* Business badge */}
                    {isBusiness && (
                        <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] border-2 border-amber-400/50 shadow-lg shadow-amber-500/30">
                            ✓ VERIFIED BUSINESS
                        </span>
                    )}

                    <span className="rounded-full bg-gradient-to-r from-black to-gray-800 px-2.5 py-1 text-[10px] font-semibold text-white border border-black/30 shadow-md">
                        {visibilityLabelMap[activity.visibility]}
                    </span>
                </div>
            </div>

            {/* Category + host row */}
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-black/60">
                <span className="rounded-full bg-gradient-to-r from-brand/15 to-brand/25 text-brand-dark px-3 py-1 text-[11px] font-semibold capitalize border border-brand/20 shadow-sm">
                    {activity.category}
                </span>

                {isBusiness && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open business profile view
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-[11px] font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 border-2 border-amber-400/50 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 hover:scale-105"
                    >
                        <span className="text-sm">✓</span>
                        <span className="truncate max-w-[140px]">
                            {businessProfilesMap[activity.businessId!].businessName}
                        </span>
                        {businessProfilesMap[activity.businessId!].promotionCredits > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">
                                {businessProfilesMap[activity.businessId!].promotionCredits}{" "}
                                Credits
                            </span>
                        )}
                    </button>
                )}

                <span className="text-black/50 normal-case tracking-normal flex items-center gap-1">
                    <span>Ersteller:</span>
                    {activity.hostUserId ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onParticipantClick(activity.hostUserId!);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20 transition-colors font-medium text-black"
                        >
                            <span>{isHost ? currentUserName : activity.hostName}</span>
                        </button>
                    ) : (
                        <span className="font-medium text-black">
                            {isHost ? currentUserName : activity.hostName}
                        </span>
                    )}
                    {sidebarMode === "mine" && (
                        <span
                            className={clsx(
                                "ml-1 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] font-medium",
                                activity._isHost
                                    ? "bg-blue-500/20 text-blue-700"
                                    : "bg-purple-500/20 text-purple-700"
                            )}
                        >
                            {activity._isHost ? "Erstellt" : "Teilgenommen"}
                        </span>
                    )}
                </span>
            </div>

            {/* Description */}
            {activity.description && (
                <p className="text-[13px] text-black/70 leading-snug line-clamp-2">
                    {activity.description}
                </p>
            )}

            {/* Time + location */}
            <div className="text-[12px] text-black/55">
                {activity.startTime && activity.endTime ? (
                    <span>
                        {(() => {
                            const start = new Date(activity.startTime);
                            const end = new Date(activity.endTime);
                            const startStr = start.toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            const endStr = end.toLocaleTimeString("de-DE", {
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            return `Heute, ${startStr} – ${endStr}`;
                        })()}
                    </span>
                ) : (
                    <span>{activity.time}</span>
                )}
                <span className="ml-2 truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activity.locationName}
                </span>
            </div>

            {/* Bottom section */}
            <div className="mt-1.5 space-y-2">
                {/* Participants + actions */}
                <div className="flex items-center justify-between text-[12px] text-black/55">
                    <div className="flex items-center gap-1">
                        <span
                            className={clsx(
                                "inline-flex h-1.5 w-1.5 rounded-full",
                                isJoined ? "bg-brand" : "bg-black/20"
                            )}
                        />
                        <span className={isJoined ? "text-brand" : ""}>
                            {participantsCount}
                            {activity.maxParticipants
                                ? ` / ${activity.maxParticipants}`
                                : ""}{" "}
                            Teilnehmende
                        </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        {!activity._isClosed ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleJoin(activity.id);
                                }}
                                className={joinButtonClasses}
                            >
                                {joinLabel}
                            </button>
                        ) : (
                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-black/70">
                                Beendet
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare(activity.id);
                            }}
                            aria-label="Aktion teilen"
                            className="rounded-full bg-gradient-to-r from-blue-50 to-blue-100/80 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-blue-200/50"
                            title="Link kopieren"
                        >
                            Teilen
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onReport(activity.id, activity.hostUserId ?? null);
                            }}
                            aria-label="Aktion melden"
                            className="rounded-full bg-gradient-to-r from-gray-50 to-gray-100/80 px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-gray-200/50"
                            title="Aktion melden"
                        >
                            Melden
                        </button>
                    </div>
                </div>

                {/* Participants list */}
                {activity.joinedUserIds.length > 0 && (
                    <div className="pt-2 border-t border-black/5">
                        <ActivityParticipantsList
                            participantIds={activity.joinedUserIds}
                            onParticipantClick={onParticipantClick}
                        />
                    </div>
                )}

                {/* Host actions */}
                {isHost && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5">
                        {!activity._isClosed && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEnd(activity.id);
                                }}
                                aria-label="Aktion beenden"
                                className="rounded-full bg-gradient-to-r from-red-50 to-red-100 border border-red-200/80 px-4 py-1.5 text-[11px] font-semibold text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                title="Aktion beenden"
                            >
                                Beenden
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(activity.id);
                            }}
                            aria-label="Aktion löschen"
                            className="rounded-full border border-red-300/80 bg-gradient-to-r from-red-50 to-red-100 px-4 py-1.5 text-[11px] font-semibold text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        >
                            Löschen
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
