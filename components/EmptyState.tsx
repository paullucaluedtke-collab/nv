"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Sparkles, Users } from "lucide-react";
import clsx from "clsx";

interface EmptyStateProps {
  type: "activities" | "my-activities" | "joined";
  onCreateClick?: () => void;
  onExploreClick?: () => void;
}

const examples = {
  activities: [
    { emoji: "☕", text: "Kaffee trinken im Park" },
    { emoji: "🏃", text: "Joggen gehen" },
    { emoji: "🎮", text: "Zocken im Café" },
    { emoji: "📚", text: "Lernen in der Bibliothek" },
  ],
  "my-activities": [
    { emoji: "🎯", text: "Erstelle deine erste Activity" },
    { emoji: "⭐", text: "Teile, was du vorhast" },
    { emoji: "🤝", text: "Lass andere teilnehmen" },
  ],
  joined: [
    { emoji: "🔍", text: "Entdecke Activities in deiner Nähe" },
    { emoji: "👥", text: "Tritt interessanten Activities bei" },
    { emoji: "💫", text: "Lerne neue Leute kennen" },
  ],
};

export default function EmptyState({ type, onCreateClick, onExploreClick }: EmptyStateProps) {
  const exampleList = examples[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-brand-light/20 rounded-full blur-2xl" />
        <div className="relative bg-gradient-to-br from-brand/30 to-brand-light/30 rounded-full p-6 border border-brand/50">
          {type === "activities" && <MapPin className="h-12 w-12 text-white" />}
          {type === "my-activities" && <Plus className="h-12 w-12 text-white" />}
          {type === "joined" && <Users className="h-12 w-12 text-white" />}
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="h-6 w-6 text-yellow-400" />
        </motion.div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        {type === "activities" && "Noch keine Activities hier"}
        {type === "my-activities" && "Starte deine erste Activity"}
        {type === "joined" && "Noch nicht teilgenommen"}
      </h3>

      <p className="text-white/70 text-sm mb-6 max-w-sm">
        {type === "activities" &&
          "Sei der Erste und starte eine Activity! Andere werden es sehen und können teilnehmen."}
        {type === "my-activities" &&
          "Teile, was du gerade vorhast, und lass andere spontan dazustoßen."}
        {type === "joined" &&
          "Entdecke spannende Activities in deiner Nähe und tritt bei!"}
      </p>

      {/* Example Activities */}
      <div className="mb-6 w-full max-w-md">
        <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Beispiele:</p>
        <div className="grid grid-cols-2 gap-2">
          {exampleList.map((example, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-brand/30 transition-colors"
            >
              <div className="text-2xl mb-1">{example.emoji}</div>
              <div className="text-xs text-white/80">{example.text}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {onCreateClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateClick}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2",
              "px-6 py-3 rounded-full font-semibold text-sm",
              "bg-gradient-to-r from-brand to-brand-light text-white",
              "shadow-lg shadow-brand/30 hover:shadow-xl hover:shadow-brand/40",
              "transition-all duration-200"
            )}
          >
            <Plus className="h-4 w-4" />
            Activity erstellen
          </motion.button>
        )}
        {onExploreClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExploreClick}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2",
              "px-6 py-3 rounded-full font-semibold text-sm",
              "bg-white/10 text-white border border-white/20",
              "hover:bg-white/15 hover:border-white/30",
              "transition-all duration-200"
            )}
          >
            <MapPin className="h-4 w-4" />
            Erkunden
          </motion.button>
        )}
      </div>

      {/* Motivational Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xs text-white/50 italic"
      >
        {type === "activities" && "💡 Tipp: Je mehr Activities du erstellst, desto mehr Punkte sammelst du!"}
        {type === "my-activities" && "💡 Tipp: Activities mit klarem Titel und Beschreibung werden öfter gejoint!"}
        {type === "joined" && "💡 Tipp: Tritt Activities bei, um Streaks zu sammeln und Achievements zu erhalten!"}
      </motion.p>
    </motion.div>
  );
}

