"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ShoppingBag, Rocket, Briefcase, Building2, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import type { BusinessProfile } from "@/types/business";
import { supabase } from "@/lib/supabaseClient";

type BusinessShopModalProps = {
  isOpen: boolean;
  onClose: () => void;
  businessProfile: BusinessProfile;
  onCreditsPurchased: () => void;
};

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  icon: React.ElementType;
  description: string;
  color: string;
  popular?: boolean;
};

const PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: 499,
    icon: ShoppingBag,
    description: "Perfekt für den Einstieg. Reicht für 2 Featured Activities.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "pro",
    name: "Business Pro",
    credits: 50,
    price: 1999,
    icon: Rocket,
    description: "Für aktive Businesses. Boost deine Events regelmäßig.",
    color: "from-purple-500 to-pink-500",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 200,
    price: 4999,
    icon: Building2,
    description: "Maximale Sichtbarkeit. Sponsored Status für alle Events.",
    color: "from-amber-500 to-orange-500",
  },
];

export default function BusinessShopModal({
  isOpen,
  onClose,
  businessProfile,
  onCreditsPurchased,
}: BusinessShopModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedPackage(null);
      setIsProcessing(false);
      setSuccessMode(false);
    }
  }, [isOpen]);

  const handleBuy = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);

    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch("/api/products/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessProfile.id,
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          credits: selectedPackage.credits
        }),
      });

      if (!response.ok) {
        throw new Error("Kauf fehlgeschlagen");
      }

      setSuccessMode(true);
      setTimeout(() => {
        onCreditsPurchased();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Buy credits error:", error);
      alert("Fehler beim Kauf. Bitte versuche es später erneut.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-void/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {successMode ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-2 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white glow-text">Zahlung erfolgreich!</h2>
            <p className="text-white/60">
              Deine Credits wurden deinem Account gutgeschrieben.
            </p>
          </div>
        ) : (
          <>
            <div className="relative p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white glow-text">Credits aufladen</h2>
                <button
                  onClick={onClose}
                  className="p-1 text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-white/60">
                Lade Credits auf, um deine Business-Activities zu promoten und mehr Sichtbarkeit zu erhalten.
              </p>

              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand shadow-[0_0_15px_rgba(41,121,255,0.3)]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Aktuelles Guthaben</div>
                  <div className="text-lg font-bold text-white">{businessProfile.promotionCredits} Credits</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const Icon = pkg.icon;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={clsx(
                        "relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                        isSelected
                          ? "bg-white/10 border-brand/50 shadow-[0_0_20px_rgba(41,121,255,0.15)]"
                          : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/8 hover:-translate-y-0.5"
                      )}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink text-[10px] font-bold text-white shadow-lg shadow-neon-purple/30 border border-neon-purple/30">
                          POPULAR
                        </div>
                      )}

                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg relative overflow-hidden",
                        "bg-gradient-to-br", pkg.color
                      )}>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                        <Icon size={24} className="relative z-10" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white group-hover:text-brand-light transition-colors">{pkg.name}</h3>
                          <span className="font-bold text-white">{(pkg.price / 100).toFixed(2).replace('.', ',')} €</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-brand-light font-bold text-sm">+{pkg.credits} Credits</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 line-clamp-1">{pkg.description}</p>
                      </div>

                      <div className={clsx(
                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-brand bg-brand text-white shadow-[0_0_10px_rgba(41,121,255,0.5)]"
                          : "border-white/20 bg-transparent group-hover:border-white/40"
                      )}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleBuy}
                  disabled={!selectedPackage || isProcessing}
                  className={clsx(
                    "w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all relative overflow-hidden",
                    !selectedPackage || isProcessing
                      ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                      : "bg-gradient-to-r from-brand to-brand-light hover:shadow-brand/30 active:scale-[0.98] border border-white/10"
                  )}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Wird verarbeitet...
                    </span>
                  ) : selectedPackage ? (
                    `Jetzt kaufen für ${(selectedPackage.price / 100).toFixed(2).replace('.', ',')} €`
                  ) : (
                    "Bitte Paket wählen"
                  )}
                </button>
                <p className="mt-3 text-center text-[10px] text-white/30">
                  Dies ist eine Demo-Zahlung. Es werden keine echten Kosten berechnet.
                </p>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
