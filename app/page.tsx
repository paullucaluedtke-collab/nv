"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import type { Activity, ActivityVisibility } from "../types/activity";
import CreateActivityModal from "../components/CreateActivityModal";

const initialActivities: Activity[] = [
  {
    id: "1",
    title: "Chillen im Park",
    description: "Wir sind zu dritt im Park und hören Musik. Komm einfach dazu.",
    time: "Today · 18:30",
    locationName: "Tiergarten",
    latitude: 52.5145,
    longitude: 13.3500,
    category: "chill",
    visibility: "public",
    maxParticipants: 8,
    participantsCount: 3,
    joined: false,
    hostName: "Alex",
  },
  {
    id: "2",
    title: "Basketball 3vs3",
    description: "Brauchen noch 2 Leute für ein schnelles Game.",
    time: "Today · 19:00",
    locationName: "Alexanderplatz",
    latitude: 52.5219,
    longitude: 13.4132,
    category: "sport",
    visibility: "public",
    maxParticipants: 6,
    participantsCount: 4,
    joined: false,
    hostName: "Mia",
  },
  {
    id: "3",
    title: "Spontan in die Stadt",
    description: "Barhopping in der Innenstadt, alle entspannten Menschen willkommen.",
    time: "Tonight · 21:00",
    locationName: "Friedrichshain",
    latitude: 52.5145,
    longitude: 13.4531,
    category: "party",
    visibility: "friends",
    maxParticipants: 12,
    participantsCount: 5,
    joined: false,
    hostName: "Jonas",
  },
];

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!selectedActivityId) return;
    const target = cardRefs.current[selectedActivityId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedActivityId]);

  const handleMarkerSelect = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    if (isCreateOpen) {
      setIsCreateOpen(false);
    }
  }, [isCreateOpen]);

  const handleActivityClick = (activityId: string) => {
    setSelectedActivityId(activityId);
    if (isCreateOpen) {
      setIsCreateOpen(false);
    }
  };

  const handleToggleJoin = useCallback((id: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id !== id) return activity;
        const alreadyJoined = !!activity.joined;
        const isFull =
          !alreadyJoined &&
          activity.participantsCount >= activity.maxParticipants;
        if (isFull) return activity;

        const joined = !alreadyJoined;
        const delta = joined ? 1 : -1;
        const participantsCount = Math.min(
          activity.maxParticipants,
          Math.max(0, activity.participantsCount + delta)
        );

        return {
          ...activity,
          joined,
          participantsCount,
        };
      })
    );
  }, []);

  const visibilityLabelMap: Record<ActivityVisibility, string> = {
    public: "PUBLIC",
    friends: "FRIENDS",
    private: "PRIVATE",
  };

  return (
    <div
      className={clsx(
        "min-h-screen flex flex-col font-sans tracking-[0.015em] transition-all duration-200 ease-out",
        highContrast ? "bg-black text-white" : "bg-black text-white"
      )}
    >
      {/* Top bar */}
      <header
        className={clsx(
          "sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl transition-all duration-200 ease-out",
          highContrast && "border-white/40 bg-black backdrop-blur-none"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black text-xs font-semibold tracking-tight">
              PO
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-medium tracking-tight">
                PopOut
              </span>
              <span className="text-[11px] text-neutral-400 leading-tight">
                Find people who are out right now.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-white/10 p-1 border border-white/20 text-[11px]">
              <button
                type="button"
                onClick={() => setHighContrast(false)}
                className={clsx(
                  "px-3 py-1 rounded-full transition-all",
                  !highContrast
                    ? "bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                    : "text-white/60"
                )}
              >
                Contrast Off
              </button>
              <button
                type="button"
                onClick={() => setHighContrast(true)}
                className={clsx(
                  "px-3 py-1 rounded-full transition-all",
                  highContrast
                    ? "bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                    : "text-white/60"
                )}
              >
                Contrast On
              </button>
            </div>
            <span className="rounded-full border border-white/25 px-3 py-1 text-[11px] font-medium text-neutral-300">
              BETA
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Map section */}
        <section
          className={clsx(
            "relative z-0 flex-1 min-h-[360px] md:min-h-[540px] overflow-hidden rounded-[24px] border bg-black transition-all duration-200 ease-out",
            highContrast
              ? "border-white/40 shadow-none"
              : "border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          )}
        >
          <div
            className={clsx(
              "absolute inset-x-0 top-0 flex items-center justify-between px-5 py-3 text-[11px] pointer-events-none",
              highContrast ? "text-white" : "text-neutral-400"
            )}
          >
            <span
              className={clsx(
                "rounded-full px-3 py-1 border transition-all duration-200",
                highContrast
                  ? "bg-black border-white/40"
                  : "bg-black/70 border-white/10"
              )}
            >
              Live map · Berlin
            </span>
            <span
              className={clsx(
                "hidden rounded-full px-3 py-1 border md:inline transition-all duration-200",
                highContrast
                  ? "bg-black border-white/35"
                  : "bg-black/50 border-white/10"
              )}
            >
              Click on the map to pick a spot
            </span>
          </div>
          <div className="h-full w-full">
            <MapView
              activities={activities}
              selectedActivityId={selectedActivityId}
              onMapClick={(coords) => setPendingLocation(coords)}
              onMarkerSelect={handleMarkerSelect}
            />
          </div>
        </section>

        {/* Activities section */}
        <section className="mt-4 flex w-full flex-col gap-3 md:mt-0 md:w-80 md:flex-none">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Open PopOuts</h2>
            <span
              className={clsx(
                "rounded-full border px-3 py-1 text-[11px] transition-all duration-200",
                highContrast
                  ? "border-white/40 text-white"
                  : "border-white/15 text-neutral-400"
              )}
            >
              Public · Nearby
            </span>
          </div>

          <div
            className={clsx(
              "flex-1 space-y-3 rounded-[20px] border p-4 transition-all duration-200",
              highContrast
                ? "border-white/45 bg-black"
                : "border-white/10 bg-white/5 backdrop-blur-2xl"
            )}
          >
            {activities.map((activity) => {
              const isSelected = selectedActivityId === activity.id;
              const isFull =
                activity.participantsCount >= activity.maxParticipants;
              const joinLabel = activity.joined
                ? "Joined"
                : isFull
                ? "Full"
                : "Join";

              const joinButtonClasses = clsx(
                "rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium transition",
                activity.joined
                  ? "bg-white text-black hover:bg-black/5"
                  : isFull
                  ? "bg-white text-black/40 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              );

              return (
              <motion.div
                ref={(node) => {
                  if (node) {
                    cardRefs.current[activity.id] = node;
                  } else {
                    delete cardRefs.current[activity.id];
                  }
                }}
                key={activity.id}
                onClick={() => handleActivityClick(activity.id)}
                whileHover={{ scale: 1.01, y: -1 }}
                transition={{ type: "spring", stiffness: 250, damping: 22 }}
                className={clsx(
                  "flex w-full flex-col gap-1.5 rounded-2xl border px-5 py-4 text-left transition-transform transition-shadow duration-200 ease-out",
                  highContrast
                    ? "border-white/30 bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                    : "border-black/5 bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
                  isSelected &&
                    (highContrast ? "ring-1 ring-black/25" : "ring-1 ring-black/15")
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold tracking-tight text-black">
                    {activity.title}
                  </h3>
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white border border-black/20">
                    {visibilityLabelMap[activity.visibility]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-black/60">
                  <span className="rounded-full border border-black/10 bg-black text-white px-2 py-0.5 font-medium capitalize">
                    {activity.category}
                  </span>
                  {activity.hostName && (
                    <span className="text-black/50 normal-case tracking-normal">
                      Host: {activity.hostName}
                    </span>
                  )}
                </div>
                {activity.description && (
                  <p className="text-[13px] text-black/70 leading-snug line-clamp-2">
                    {activity.description}
                  </p>
                )}
                <div className="text-[12px] text-black/55">
                  <span>{activity.time}</span>
                  <span className="ml-2 truncate"> · 📍 {activity.locationName}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[12px] text-black/55">
                  <span>
                    {activity.participantsCount} / {activity.maxParticipants} joined
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!activity.joined && isFull) return;
                      handleToggleJoin(activity.id);
                    }}
                    disabled={!activity.joined && isFull}
                    className={joinButtonClasses}
                  >
                    {joinLabel}
                  </button>
                </div>
              </motion.div>
            );
            })}
          </div>
        </section>

        {/* Floating action button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsCreateOpen(true)}
          className={clsx(
            "fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold text-black shadow-[0_4px_14px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all",
            highContrast
              ? "border border-black/20"
              : ""
          )}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white text-lg leading-none">
            +
          </span>
          <span>Create activity</span>
        </motion.button>
      </main>

      {/* Create Activity Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <CreateActivityModal
            isOpen={isCreateOpen}
            onClose={() => {
              setIsCreateOpen(false);
              setPendingLocation(null);
            }}
          onCreate={({
            title,
            description,
            time,
            category,
            visibility,
            maxParticipants,
          }) => {
              if (!pendingLocation) return;

              const newActivity: Activity = {
                id: Date.now().toString(),
                title,
                description,
                time,
                locationName: "Custom spot",
                latitude: pendingLocation.latitude,
                longitude: pendingLocation.longitude,
              category,
              visibility,
              maxParticipants,
              participantsCount: 1,
              joined: true,
              hostName: "You",
              };

              setActivities((prev) => [newActivity, ...prev]);
              setIsCreateOpen(false);
              setPendingLocation(null);
            setSelectedActivityId(newActivity.id);
            }}
            pendingLocation={pendingLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

