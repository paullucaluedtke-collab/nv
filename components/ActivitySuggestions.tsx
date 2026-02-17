"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, TrendingUp, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { Activity } from "@/types/activity";

interface ActivitySuggestionsProps {
  activities: Activity[];
  userLocation: { latitude: number; longitude: number } | null;
  onActivityClick: (activityId: string) => void;
}

export default function ActivitySuggestions({
  activities,
  userLocation,
  onActivityClick,
}: ActivitySuggestionsProps) {
  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get suggestions based on different criteria
  const suggestions = useMemo(() => {
    if (activities.length === 0) return { active: [] as Activity[], upcoming: [] as Activity[], popular: [] as Activity[], nearby: [] as Activity[] };

    const now = new Date();
    const activeActivities = activities.filter((a) => {
      if (a.isClosed) return false;
      if (!a.startTime) return true;
      const start = new Date(a.startTime);
      const end = a.endTime ? new Date(a.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
      return now >= start && now <= end;
    });

    const upcomingActivities = activities.filter((a) => {
      if (a.isClosed) return false;
      if (!a.startTime) return false;
      const start = new Date(a.startTime);
      return start > now && start.getTime() - now.getTime() < 2 * 60 * 60 * 1000; // Next 2 hours
    });

    const popularActivities = [...activities]
      .filter((a) => !a.isClosed)
      .sort((a, b) => (b.joinedUserIds?.length ?? 0) - (a.joinedUserIds?.length ?? 0))
      .slice(0, 3);

    const nearbyActivities = userLocation
      ? [...activities]
        .filter((a) => !a.isClosed && a.latitude && a.longitude)
        .map((a) => ({
          activity: a,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude!,
            a.longitude!
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map((item) => item.activity)
      : [];

    return {
      active: activeActivities.slice(0, 3),
      upcoming: upcomingActivities.slice(0, 3),
      popular: popularActivities,
      nearby: nearbyActivities,
    };
  }, [activities, userLocation]);

  const hasSuggestions =
    suggestions.active.length > 0 ||
    suggestions.upcoming.length > 0 ||
    suggestions.popular.length > 0 ||
    suggestions.nearby.length > 0;

  if (!hasSuggestions) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-yellow-400" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Für dich empfohlen
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Active Now */}
      {suggestions.active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/80 px-1">Läuft gerade</p>
          <div className="space-y-2">
            {suggestions.active.map((activity) => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => onActivityClick(activity.id)}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30 cursor-pointer hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      <h4 className="font-semibold text-white text-sm truncate">{activity.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {activity.joinedUserIds?.length ?? 0}
                      </span>
                      {activity.locationName && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{activity.locationName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Soon */}
      {suggestions.upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/80 px-1">Startet bald</p>
          <div className="space-y-2">
            {suggestions.upcoming.map((activity) => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => onActivityClick(activity.id)}
                className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-500/30 cursor-pointer hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <h4 className="font-semibold text-white text-sm truncate">{activity.title}</h4>
                    </div>
                    {activity.startTime && (
                      <p className="text-xs text-white/70 mb-1">
                        {new Date(activity.startTime).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {activity.joinedUserIds?.length ?? 0}
                      </span>
                      {activity.locationName && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{activity.locationName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Popular */}
      {suggestions.popular.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/80 px-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Beliebte Activities
          </p>
          <div className="space-y-2">
            {suggestions.popular.map((activity) => (
              <motion.div
                key={activity.id}
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => onActivityClick(activity.id)}
                className="bg-white/5 rounded-xl p-3 border border-white/10 cursor-pointer hover:border-brand/30 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate mb-1">{activity.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                      <span className="flex items-center gap-1 font-medium text-brand">
                        <Users className="h-3 w-3" />
                        {activity.joinedUserIds?.length ?? 0} Teilnehmer
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby */}
      {suggestions.nearby.length > 0 && userLocation && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/80 px-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            In deiner Nähe
          </p>
          <div className="space-y-2">
            {suggestions.nearby.map((activity) => {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                activity.latitude!,
                activity.longitude!
              );
              return (
                <motion.div
                  key={activity.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  onClick={() => onActivityClick(activity.id)}
                  className="bg-white/5 rounded-xl p-3 border border-white/10 cursor-pointer hover:border-brand/30 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm truncate mb-1">{activity.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-white/70">
                        <span className="text-brand">{distance.toFixed(1)} km entfernt</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {activity.joinedUserIds?.length ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

