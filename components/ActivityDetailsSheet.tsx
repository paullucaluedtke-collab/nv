'use client';

import { Activity } from '@/types/activity';
import GlassSheet from './GlassSheet';
import { MapPin, Clock, Users } from 'lucide-react';
import clsx from 'clsx';
import ActivityParticipantsList from './ActivityParticipantsList';

interface Props {
    activity: Activity | null;
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onToggleJoin: (id: string) => void;
    onDelete?: (id: string) => void;
    onEnd?: (id: string) => void;
    isHost: boolean;
    isJoined: boolean;
    participantsCount: number;
    onParticipantClick?: (userId: string) => void;
}

export default function ActivityDetailsSheet({
    activity,
    isOpen,
    onClose,
    currentUserId,
    onToggleJoin,
    onDelete,
    onEnd,
    isHost,
    isJoined,
    participantsCount,
    onParticipantClick
}: Props) {
    if (!activity) return null;

    return (
        <GlassSheet
            isOpen={isOpen}
            onClose={onClose}
            title={activity.title}
            height="auto"
        >
            <div className="space-y-6 pb-safe">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <span className="rounded-full bg-brand-subtle px-3 py-1 text-xs font-bold text-brand-dark uppercase tracking-wider">
                        {activity.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        <MapPin className="h-3.5 w-3.5 text-brand" />
                        {activity.locationName}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        <Clock className="h-3.5 w-3.5 text-brand" />
                        {activity.time}
                    </span>
                </div>

                {/* Description */}
                {activity.description && (
                    <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5">
                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                            {activity.description}
                        </p>
                    </div>
                )}

                {/* Stats & Actions Row */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/50" />
                        <span className="text-sm font-medium text-white/90">
                            {participantsCount} {activity.maxParticipants ? `/ ${activity.maxParticipants}` : ""}
                            <span className="text-white/50 ml-1">Teilnehmende</span>
                        </span>
                    </div>

                    {!activity.isClosed && (
                        <button
                            onClick={() => onToggleJoin(activity.id)}
                            className={clsx(
                                "rounded-full px-6 py-2.5 text-sm font-bold transition-all shadow-lg active:scale-95",
                                isJoined
                                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                    : "bg-brand text-white hover:bg-brand-hover shadow-brand/20"
                            )}
                        >
                            {isJoined ? "Verlassen" : "Teilnehmen"}
                        </button>
                    )}
                </div>

                {/* Participants List */}
                {activity.joinedUserIds && activity.joinedUserIds.length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Dabei sind</h4>
                        <ActivityParticipantsList
                            participantIds={activity.joinedUserIds}
                            onParticipantClick={onParticipantClick}
                        />
                    </div>
                )}

                {/* Host Controls */}
                {isHost && (
                    <div className="border-t border-white/10 pt-4 flex gap-3 justify-end">
                        {onEnd && !activity.isClosed && (
                            <button
                                onClick={() => onEnd(activity.id)}
                                className="text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/10"
                            >
                                Beenden
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(activity.id)}
                                className="text-xs font-bold text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 bg-transparent px-4 py-2 rounded-lg transition-colors"
                            >
                                Löschen
                            </button>
                        )}
                    </div>
                )}

            </div>
        </GlassSheet>
    );
}
