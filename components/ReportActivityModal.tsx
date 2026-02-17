// components/ReportActivityModal.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { createReport } from "@/lib/reportRepository";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activityId: string | null;
  hostUserId: string | null;
  reporterUserId: string; // current userId (getOrCreateUserId)
  showToast?: (message: string, variant?: "success" | "error" | "info") => void;
};

const REASONS = [
  "Spam",
  "Beleidigung oder Hate",
  "Fake oder irreführend",
  "Sonstiges",
];

export default function ReportActivityModal({
  isOpen,
  onClose,
  activityId,
  hostUserId,
  reporterUserId,
  showToast,
}: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Bitte wähle einen Grund aus.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createReport({
        activityId,
        reportedUserId: hostUserId,
        reporterUserId,
        reason,
        comment: comment.trim() || null,
      });

      showToast?.("Danke, wir schauen uns das an 🙏", "success");
      setComment("");
      setReason(null);
      onClose();
    } catch (err) {
      console.error("[ReportActivityModal] submit error", err);
      setError("Meldung konnte nicht gesendet werden.");
      showToast?.("Meldung konnte nicht gesendet werden.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !activityId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              onClose();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <motion.div 
            className="w-full max-w-md rounded-3xl bg-neutral-950/95 border border-white/10 p-4 shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
        <div className="flex items-center justify-between mb-3">
          <h2 id="report-modal-title" className="text-sm font-semibold text-white">
            Aktion melden
          </h2>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            aria-label="Modal schließen"
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Schließen
          </motion.button>
        </div>

        <p className="mb-3 text-xs text-white/60">
          Wenn dir etwas komisch vorkommt oder gegen die Regeln verstößt,
          kannst du es hier melden.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-white/60">Grund</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={clsx(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    reason === r
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  {r}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-white/60">
              Kurz beschreiben (optional)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was genau ist das Problem?"
              className="w-full min-h-[80px] rounded-2xl bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300" role="alert">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="rounded-full px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </motion.button>
            <motion.button
              type="submit"
              disabled={submitting || !reason}
              whileHover={!submitting && reason ? { scale: 1.05 } : {}}
              whileTap={!submitting && reason ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                submitting || !reason
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:bg-neutral-100"
              )}
            >
              {submitting ? "Sende…" : "Melden"}
            </motion.button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

