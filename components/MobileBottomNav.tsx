"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { Map, List, MessageCircle } from "lucide-react";

type Tab = "map" | "activities" | "chat";

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  showChat?: boolean;
};

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  showChat = false,
}: Props) {
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "map" as Tab, label: "Karte", icon: Map },
      { id: "activities" as Tab, label: "Aktionen", icon: List },
    ];
    if (showChat) {
      baseTabs.push({ id: "chat" as Tab, label: "Chat", icon: MessageCircle });
    }
    return baseTabs;
  }, [showChat]);

  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-30",
        "md:hidden",
        "bg-void-card/90 backdrop-blur-xl border-t border-white/10",
        "safe-area-inset-bottom",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              "flex flex-col items-center justify-center",
              "flex-1 h-full rounded-xl",
              "transition-all duration-300",
              "min-h-[44px] min-w-[44px]", // Touch target size
              "will-change-[background-color,color,transform]",
              activeTab === tab.id
                ? "text-brand-light bg-white/5 shadow-[0_0_15px_rgba(41,121,255,0.2)] scale-105"
                : "text-white/40 hover:text-white/80 hover:bg-white/5"
            )}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <tab.icon className={clsx("h-5 w-5 mb-0.5 transition-transform duration-300", activeTab === tab.id && "scale-110 drop-shadow-[0_0_8px_rgba(41,121,255,0.6)]")} />
            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

