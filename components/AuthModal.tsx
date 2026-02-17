"use client";

import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";

type Props = {
  isOpen: boolean;
};

export default function AuthModal({ isOpen }: Props) {
  const { signInWithEmail, signUpWithEmail, signInWithFacebook } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Handle ESC key to prevent closing (auth is required)
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault(); // Prevent closing auth modal
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setError(error);
        } else {
          setInfo(
            "Account erstellt. Bitte prüfe deine E-Mails und bestätige deine Adresse."
          );
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setError(error);
        } else {
          // on successful login, the AuthProvider will update and the parent
          // will stop rendering this modal because user is no longer null
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          aria-describedby="auth-modal-description"
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-void-card border border-white/10 p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />

            <div className="mb-6 relative">
              <h2 id="auth-modal-title" className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">nearvibe Account</h2>
              <p id="auth-modal-description" className="text-sm text-white/50 mt-1">
                Melde dich mit E-Mail &amp; Passwort an, um Aktionen zu erstellen und
                beizutreten.
              </p>
            </div>

            <div className="mb-6 inline-flex w-full rounded-xl bg-black/40 p-1 text-xs border border-white/5">
              <motion.button
                type="button"
                onClick={() => setMode("login")}
                className={clsx(
                  "flex-1 py-2 rounded-lg transition-all duration-300 font-medium",
                  mode === "login" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                Login
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setMode("register")}
                className={clsx(
                  "flex-1 py-2 rounded-lg transition-all duration-300 font-medium",
                  mode === "register" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                )}
              >
                Registrieren
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail-Adresse"
                  aria-label="E-Mail-Adresse"
                  autoComplete="email"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand/50 focus:bg-white/10 focus:ring-1 focus:ring-brand/50 transition-all duration-200"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort"
                  aria-label="Passwort"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand/50 focus:bg-white/10 focus:ring-1 focus:ring-brand/50 transition-all duration-200"
                />
              </div>

              {error && <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20" role="alert">{error}</p>}
              {info && <p className="text-xs text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20" role="status">{info}</p>}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={clsx(
                  "w-full rounded-xl py-3.5 text-sm font-bold transition-all shadow-lg",
                  submitting
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-brand to-brand-light text-white shadow-brand/20 hover:shadow-brand/40"
                )}
              >
                {submitting
                  ? "Bitte warten…"
                  : mode === "login"
                    ? "Login"
                    : "Registrieren"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-void-card px-3 text-white/40">oder weiter mit</span>
              </div>
            </div>

            {/* Facebook Login Button */}
            <motion.button
              type="button"
              onClick={async () => {
                setSubmitting(true);
                setError(null);
                const { error } = await signInWithFacebook();
                if (error) {
                  setError(error);
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={clsx(
                "w-full rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-3 border",
                submitting
                  ? "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
                  : "bg-[#1877F2]/10 border-[#1877F2]/30 text-[#1877F2] hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50"
              )}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

