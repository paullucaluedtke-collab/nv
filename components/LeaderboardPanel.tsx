"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Award, TrendingUp } from "lucide-react";
import type { UserStats } from "../lib/gamificationRepository";
import { getLeaderboard, getTopCreators, getTopJoiners } from "../lib/gamificationRepository";

interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

type LeaderboardType = "points" | "creators" | "joiners";

export default function LeaderboardPanel({ isOpen, onClose, currentUserId }: LeaderboardPanelProps) {
  const [type, setType] = useState<LeaderboardType>("points");
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      setLoading(true);
      try {
        let data: UserStats[] = [];
        switch (type) {
          case "points":
            data = await getLeaderboard(10);
            break;
          case "creators":
            data = await getTopCreators(10);
            break;
          case "joiners":
            data = await getTopJoiners(10);
            break;
        }
        setLeaderboard(data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isOpen, type]);

  if (!isOpen) return null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
    return <span className="text-white/60 font-bold">{rank}</span>;
  };

  const getDisplayValue = (stats: UserStats) => {
    switch (type) {
      case "points":
        return stats.totalPoints.toLocaleString();
      case "creators":
        return stats.activitiesCreated;
      case "joiners":
        return stats.activitiesJoined;
    }
  };

  const getLabel = () => {
    switch (type) {
      case "points":
        return "Punkte";
      case "creators":
        return "Erstellt";
      case "joiners":
        return "Teilgenommen";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-black via-gray-900 to-black border border-white/20 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Leaderboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Schließen"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-white/60"
                />
              </svg>
            </button>
          </div>

          {/* Type Selector */}
          <div className="flex gap-2">
            {[
              { value: "points" as LeaderboardType, label: "Punkte", icon: TrendingUp },
              { value: "creators" as LeaderboardType, label: "Ersteller", icon: Award },
              { value: "joiners" as LeaderboardType, label: "Teilnehmer", icon: Trophy },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  type === value
                    ? "bg-brand text-white shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>Noch keine Einträge im Leaderboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((stats, index) => {
                const rank = index + 1;
                const isCurrentUser = currentUserId === stats.userId;

                return (
                  <motion.div
                    key={stats.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-brand/30 to-brand/20 border-brand/50 shadow-lg"
                        : rank <= 3
                        ? "bg-white/5 border-white/20"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                      {getRankIcon(rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${isCurrentUser ? "text-brand" : "text-white"}`}>
                          User {stats.userId.slice(0, 8)}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                        <span>Level {stats.level}</span>
                        {type === "points" && (
                          <>
                            <span>•</span>
                            <span>{stats.activitiesCreated} erstellt</span>
                            <span>•</span>
                            <span>{stats.activitiesJoined} teilgenommen</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-white">{getDisplayValue(stats)}</p>
                      <p className="text-xs text-white/50">{getLabel()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


