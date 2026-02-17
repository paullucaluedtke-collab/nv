"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Target, Flame, TrendingUp, Award } from "lucide-react";
import type { UserStats, UserAchievement } from "../lib/gamificationRepository";
import { getUserStats, getUserAchievements } from "../lib/gamificationRepository";
import { getPointsForLevel } from "../lib/gamificationRepository";

interface UserStatsPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserStatsPanel({ userId, isOpen, onClose }: UserStatsPanelProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    async function load() {
      setLoading(true);
      try {
        const [statsData, achievementsData] = await Promise.all([
          getUserStats(userId),
          getUserAchievements(userId),
        ]);
        setStats(statsData);
        setAchievements(achievementsData);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const pointsForNextLevel = stats ? getPointsForLevel(stats.level + 1) : 0;
  const pointsForCurrentLevel = stats ? getPointsForLevel(stats.level) : 0;
  const progressToNextLevel = stats
    ? Math.min(
        100,
        ((stats.totalPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100
      )
    : 0;

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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Deine Stats
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Level & Points */}
              <div className="bg-gradient-to-br from-brand/20 to-brand/10 rounded-2xl p-6 border border-brand/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Level</p>
                    <p className="text-4xl font-bold text-white">{stats.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/60 mb-1">Punkte</p>
                    <p className="text-3xl font-bold text-brand">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Fortschritt zu Level {stats.level + 1}</span>
                    <span>
                      {stats.totalPoints - pointsForCurrentLevel} / {pointsForNextLevel - pointsForCurrentLevel}
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNextLevel}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <p className="text-sm text-white/60">Erstellt</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.activitiesCreated}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <p className="text-sm text-white/60">Teilgenommen</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.activitiesJoined}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-5 w-5 text-orange-400" />
                    <p className="text-sm text-white/60">Aktueller Streak</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.currentStreak} Tage</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <p className="text-sm text-white/60">Bester Streak</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats.longestStreak} Tage</p>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Achievements</h3>
                  <span className="text-sm text-white/60">({achievements.length})</span>
                </div>
                {achievements.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <p>Noch keine Achievements freigeschaltet</p>
                    <p className="text-sm mt-2">Erstelle oder nimm an Aktivitäten teil, um Achievements zu erhalten!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {achievements.map((userAchievement) => (
                      <div
                        key={userAchievement.achievementId}
                        className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-400/30"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{userAchievement.achievement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm">{userAchievement.achievement.title}</p>
                            <p className="text-xs text-white/70 mt-1 line-clamp-2">
                              {userAchievement.achievement.description}
                            </p>
                            <p className="text-[10px] text-white/50 mt-2">
                              {new Date(userAchievement.unlockedAt).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-white/60">
              <p>Stats konnten nicht geladen werden</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


