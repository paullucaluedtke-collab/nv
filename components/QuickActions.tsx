"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coffee, Dumbbell, Gamepad2, BookOpen, Music, UtensilsCrossed } from "lucide-react";
import clsx from "clsx";
import type { ActivityCategory } from "@/types/activity";

interface QuickAction {
  label: string;
  category: ActivityCategory;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Kaffee trinken",
    category: "Chill",
    icon: <Coffee className="h-5 w-5" />,
    color: "from-amber-500 to-orange-500",
    description: "Café, Park, oder draußen",
  },
  {
    label: "Sport machen",
    category: "Sport",
    icon: <Dumbbell className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
    description: "Joggen, Fitness, oder Team-Sport",
  },
  {
    label: "Zocken",
    category: "Gaming",
    icon: <Gamepad2 className="h-5 w-5" />,
    color: "from-pink-500 to-rose-500",
    description: "Gaming-Café oder zuhause",
  },
  {
    label: "Lernen",
    category: "Study",
    icon: <BookOpen className="h-5 w-5" />,
    color: "from-purple-500 to-indigo-500",
    description: "Bibliothek oder Café",
  },
  {
    label: "Musik hören",
    category: "Chill",
    icon: <Music className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
    description: "Konzert oder Session",
  },
  {
    label: "Essen gehen",
    category: "Chill",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    color: "from-red-500 to-pink-500",
    description: "Restaurant oder Food-Court",
  },
];

interface QuickActionsProps {
  onSelect: (category: ActivityCategory, title: string) => void;
}

export default function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          Schnell erstellen
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {quickActions.map((action, idx) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(action.category, action.label)}
            className={clsx(
              "flex flex-col items-center gap-2 p-4 rounded-xl",
              "bg-gradient-to-br",
              action.color,
              "text-white border border-white/20",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200",
              "hover:border-white/40"
            )}
          >
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              {action.icon}
            </div>
            <div className="text-center">
              <div className="font-semibold text-sm">{action.label}</div>
              <div className="text-xs text-white/80 mt-0.5">{action.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

