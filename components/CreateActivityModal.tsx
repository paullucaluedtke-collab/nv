"use client";

import React, { useState, FormEvent } from "react";

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    time: string;
  }) => void;
  pendingLocation: { latitude: number; longitude: number } | null;
}

export default function CreateActivityModal({
  isOpen,
  onClose,
  onCreate,
  pendingLocation,
}: CreateActivityModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!pendingLocation || !title.trim() || !time.trim()) {
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      time: time.trim(),
    });

    // Reset form
    setTitle("");
    setDescription("");
    setTime("");
  };

  const canSubmit = pendingLocation !== null && title.trim() !== "" && time.trim() !== "";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-2xl font-bold text-slate-50 mb-6">
          Create a PopOut
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  placeholder="Enter activity title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none"
                  placeholder="Enter activity description (optional)"
                />
              </div>

              {/* Time */}
              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Time *
                </label>
                <input
                  type="text"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  placeholder="e.g., Today 19:00"
                  required
                />
              </div>

              {/* Location Display */}
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                {pendingLocation ? (
                  <p className="text-sm text-slate-300">
                    Location: {pendingLocation.latitude.toFixed(6)},{" "}
                    {pendingLocation.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Tap on the map to choose a location.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-all shadow-lg hover:shadow-xl"
                >
                  Create
                </button>
              </div>
            </form>
      </div>
    </div>
  );
}
