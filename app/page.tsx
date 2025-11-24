"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Activity } from "../types/activity";
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
  },
  {
    id: "2",
    title: "Basketball 3vs3",
    description: "Brauchen noch 2 Leute für ein schnelles Game.",
    time: "Today · 19:00",
    locationName: "Alexanderplatz",
    latitude: 52.5219,
    longitude: 13.4132,
  },
  {
    id: "3",
    title: "Spontan in die Stadt",
    description: "Barhopping in der Innenstadt, alle entspannten Menschen willkommen.",
    time: "Tonight · 21:00",
    locationName: "Friedrichshain",
    latitude: 52.5145,
    longitude: 13.4531,
  },
];

const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
});

export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [pendingLocation, setPendingLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );

  const handleActivityClick = (activityId: string) => {
    setSelectedActivityId(activityId);
    if (isCreateOpen) {
      setIsCreateOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-sm font-bold shadow-md">
              PO
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight">PopOut</h1>
              <p className="text-[11px] text-slate-300">
                Find people who are out right now.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-300">
            BETA
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 pt-3 md:flex-row">
        {/* Map area */}
        <section className="relative flex-1 overflow-hidden rounded-3xl bg-slate-900 shadow-xl min-h-[320px] md:min-h-[500px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4 text-[11px] text-slate-100 z-10">
            <span className="rounded-full bg-black/40 px-3 py-1">
              Live map · Berlin area
            </span>
            <span className="hidden rounded-full bg-black/30 px-3 py-1 md:inline">
              Tap any spot to create a PopOut
            </span>
          </div>
          <div className="h-full w-full">
            <MapView
              activities={activities}
              selectedActivityId={selectedActivityId}
              onMapClick={(coords) => {
                setPendingLocation(coords);
              }}
            />
          </div>
        </section>

        {/* Activities list */}
        <section className="mt-4 flex w-full flex-col gap-3 md:mt-0 md:w-80 md:flex-none">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open PopOuts</h2>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              Public · Nearby
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-slate-900/70 p-2 shadow-inner">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => handleActivityClick(activity.id)}
                className={`flex w-full flex-col items-start gap-1 rounded-xl bg-slate-800/80 p-3 text-left shadow-md transition hover:-translate-y-0.5 hover:bg-slate-700/90 hover:shadow-lg ${
                  selectedActivityId === activity.id
                    ? 'ring-1 ring-fuchsia-400/60'
                    : ''
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{activity.title}</h3>
                  <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                    PUBLIC
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {activity.description}
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 w-full">
                  <span>{activity.time}</span>
                  <span className="truncate">📍 {activity.locationName}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Floating action button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold shadow-xl transition hover:shadow-2xl md:bottom-6 md:right-6"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-lg">
            +
          </span>
          <span>Create Activity</span>
        </button>
      </main>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setPendingLocation(null);
        }}
        onCreate={({ title, description, time }) => {
          if (!pendingLocation) return;

          const newActivity: Activity = {
            id: Date.now().toString(),
            title,
            description,
            time,
            locationName: "Custom spot",
            latitude: pendingLocation.latitude,
            longitude: pendingLocation.longitude,
          };

          setActivities((prev) => [newActivity, ...prev]);
          setIsCreateOpen(false);
          setPendingLocation(null);
        }}
        pendingLocation={pendingLocation}
      />
    </div>
  );
}
