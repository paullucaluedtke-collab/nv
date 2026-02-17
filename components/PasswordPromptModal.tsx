"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Lock } from "lucide-react";

type PasswordPromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  activityTitle: string;
  requiresFriendship?: boolean;
};

export default function PasswordPromptModal({
  isOpen,
  onClose,
  onSubmit,
  activityTitle,
  requiresFriendship = false,
}: PasswordPromptModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Bitte gib ein Passwort ein");
      return;
    }
    onSubmit(password);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-black border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Passwort erforderlich</h2>
            <p className="text-sm text-white/60">{activityTitle}</p>
          </div>
        </div>

        {requiresFriendship && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400">
              Diese Aktion ist nur für Freunde des Hosts. Du musst mit dem Host befreundet sein, um beizutreten.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Passwort eingeben"
              autoFocus
              className={clsx(
                "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition min-h-[44px]",
                error ? "border-red-400 focus:border-red-500 focus:ring-red-500/50" : "border-white/10"
              )}
            />
            {error && (
              <p className="mt-1 text-xs text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-full px-4 text-sm font-medium text-white bg-white/10 border border-white/20 hover:bg-white/15 transition min-h-[44px]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full px-4 text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition min-h-[44px]"
            >
              Beitreten
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

