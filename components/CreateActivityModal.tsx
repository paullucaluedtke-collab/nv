"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type {
  ActivityCategory,
  ActivityVisibility,
} from "../types/activity";

type CreateActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    time: string;
    category: ActivityCategory;
    visibility: ActivityVisibility;
    maxParticipants: number;
  }) => void;
  pendingLocation: { latitude: number; longitude: number } | null;
};

export default function CreateActivityModal({
  isOpen,
  onClose,
  onCreate,
  pendingLocation,
}: CreateActivityModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("chill");
  const [visibility, setVisibility] = useState<ActivityVisibility>("public");
  const [maxParticipants, setMaxParticipants] = useState<number>(10);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setTime("");
      setCategory("chill");
      setVisibility("public");
      setMaxParticipants(10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const canSubmit =
    title.trim() !== "" &&
    time.trim() !== "" &&
    !!pendingLocation &&
    maxParticipants > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      time: time.trim(),
      category,
      visibility,
      maxParticipants,
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0.9 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl bg-white text-slate-900 border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-black">Create a PopOut</h2>
          <button
            type="button"
            className="text-xs text-neutral-500 hover:text-black transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 tracking-wide">
              Title *
            </label>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
              placeholder="e.g. Chill im Park"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 tracking-wide">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
              rows={3}
              placeholder="What are you planning?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 tracking-wide">
              Time *
            </label>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
              placeholder="e.g. Today 19:00"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="text-xs text-neutral-500">
            {pendingLocation ? (
              <span>
                Location selected at{" "}
                <span className="font-mono">
                  {pendingLocation.latitude.toFixed(4)}, {pendingLocation.longitude.toFixed(4)}
                </span>
              </span>
            ) : (
              <span className="text-neutral-500">
                Tap on the map to choose a location for this PopOut.
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 tracking-wide">
              Category
            </label>
            <select
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
            >
              <option value="chill">Chill</option>
              <option value="sport">Sport</option>
              <option value="party">Party</option>
              <option value="study">Study</option>
              <option value="gaming">Gaming</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 tracking-wide">
              Visibility
            </label>
            <select
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as ActivityVisibility)
              }
            >
              <option value="public">Public</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>

  <div className="space-y-1">
    <label className="text-xs font-medium text-neutral-700 tracking-wide">
      Max participants
    </label>
    <input
      type="number"
      min={1}
      max={50}
      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black focus:ring-0 bg-white text-black"
      value={maxParticipants}
      onChange={(e) =>
        setMaxParticipants(
          Math.max(1, Math.min(50, Number(e.target.value) || 1))
        )
      }
    />
  </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
