// components/OnboardingOverlay.tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  onFinish: () => void;
};

export default function OnboardingOverlay({ onFinish }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  const next = () => {
    if (step === 1) setStep(2);
    else onFinish();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-neutral-950/95 border border-white/10 p-6 shadow-2xl">
        <div className="mb-4">
          <span className="text-xs uppercase tracking-[0.16em] text-white/50">
            nearvibe
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h1 id="onboarding-title" className="text-lg font-semibold text-white">
              Finde Leute, die gerade was machen
            </h1>
            <p className="text-sm text-white/70">
              nearvibe zeigt dir spontane Aktionen in deiner Nähe –
              z.&nbsp;B. kurz rausgehen, was trinken, zocken, lernen oder
              einfach draußen sitzen.
            </p>
            <p className="text-xs text-white/50">
              Du kannst eigene Aktionen starten oder bei anderen kurz
              dazustoßen. Alles ist anonym über dein nearvibe Profil.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-lg font-semibold text-white">
              Standort & Profil
            </h1>
            <p className="text-sm text-white/70">
              nearvibe nutzt deinen Standort nur, um Aktionen in deiner
              Nähe anzuzeigen. Du kannst später jederzeit den Radius
              anpassen oder den Standort ändern.
            </p>
            <p className="text-xs text-white/50">
              Dein Profil ist einfach: Name, Emoji und optional eine
              kurze Beschreibung. Keine E-Mail, kein echter Name nötig.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1">
            {[1, 2].map((i) => (
              <span
                key={i}
                className={clsx(
                  "h-1.5 w-4 rounded-full",
                  step === i ? "bg-white" : "bg-white/20"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            aria-label={step === 1 ? "Zum nächsten Schritt" : "Onboarding beenden"}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {step === 1 ? "Weiter" : "Loslegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

