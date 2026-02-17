"use client";

import React from "react";
import clsx from "clsx";
import {
    ActivityFilterCategory,
    ActivityFilterJoined,
    ActivityFilterVisibility,
    OwnershipFilter,
    SortOption,
    HistoryFilter,
    BusinessFilter
} from "@/types/filters";

interface DesktopFilterBarProps {
    sortOption: SortOption;
    setSortOption: (opt: SortOption) => void;
    historyFilter: HistoryFilter;
    setHistoryFilter: (opt: HistoryFilter) => void;
    businessFilter: BusinessFilter;
    setBusinessFilter: (opt: BusinessFilter) => void;
    categoryFilter: ActivityFilterCategory;
    setCategoryFilter: (opt: ActivityFilterCategory) => void;
    joinedFilter: ActivityFilterJoined;
    setJoinedFilter: (opt: ActivityFilterJoined) => void;
    visibilityFilter: ActivityFilterVisibility;
    setVisibilityFilter: (opt: ActivityFilterVisibility) => void;
    ownershipFilter: OwnershipFilter;
    setOwnershipFilter: (opt: OwnershipFilter) => void;
    onToggleList: () => void;
    isListOpen: boolean;
    onToggleChat: () => void;
    isChatOpen: boolean;
}

export default function DesktopFilterBar({
    sortOption,
    setSortOption,
    historyFilter,
    setHistoryFilter,
    businessFilter,
    setBusinessFilter,
    categoryFilter,
    setCategoryFilter,
    joinedFilter,
    setJoinedFilter,
    visibilityFilter,
    setVisibilityFilter,
    ownershipFilter,
    onToggleList,
    isListOpen,
    onToggleChat,
    isChatOpen,
}: DesktopFilterBarProps) {
    return (
        // Changed to pointer-events-none for container so clicks pass through to map between islands
        <div className="flex w-full justify-between items-start pl-1 z-[500] relative pointer-events-none">

            {/* Left Island: Chat Toggle */}
            <div className="pointer-events-auto">
                <button
                    onClick={onToggleChat}
                    className={clsx(
                        "flex items-center justify-center w-10 h-10 rounded-full transition-all border shadow-lg backdrop-blur-xl",
                        isChatOpen
                            ? "bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
                            : "bg-brand text-white border-brand hover:brightness-110 shadow-brand/40"
                    )}
                    aria-label={isChatOpen ? "Chat ausblenden" : "Chat anzeigen"}
                >
                    <svg
                        className={clsx("w-5 h-5 transition-transform duration-300", isChatOpen ? "rotate-0" : "rotate-180")}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>


            {/* Center Island: Filters (Scrollable) */}
            {/* Center Island: Filters (Scrollable) */}
            <div className="flex-1 overflow-x-auto scrollbar-hide px-2 flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 bg-void-dark/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 shadow-2xl pointer-events-auto max-w-full">

                    {/* Sort & History */}
                    <div className="flex items-center gap-2 pr-2 border-r border-white/10 shrink-0">


                        {/* Time */}
                        <div className="inline-flex items-center gap-1.5">
                            {/* Label removed */}
                            <div className="flex gap-1 rounded-full bg-black/40 px-1 py-1 border border-white/5">
                                {[
                                    { value: "active", label: "Aktiv" },
                                    { value: "past", label: "Vergangen" },
                                    { value: "all", label: "Alle" },
                                ].map(({ value, label }) => {
                                    const active = historyFilter === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setHistoryFilter(value as HistoryFilter)}
                                            className={clsx(
                                                "rounded-full px-3 py-1 text-[11px] transition-all duration-300 font-medium whitespace-nowrap",
                                                active
                                                    ? "bg-brand text-white shadow-[0_0_15px_rgba(41,121,255,0.4)] border border-brand/50"
                                                    : "bg-transparent text-white/50 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>


                    {/* Main Filters Group */}
                    <div className="flex items-center gap-2 shrink-0">

                        {/* Business Filter */}
                        <div className="inline-flex items-center gap-1.5">
                            {/* Label removed */}
                            <div className="flex gap-1 rounded-full bg-black/40 px-1 py-1 border border-white/5">
                                {[
                                    { value: "all", label: "Alle" },
                                    { value: "business", label: "🏢" },
                                    { value: "user", label: "👤" },
                                ].map(({ value, label }) => {
                                    const active = businessFilter === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setBusinessFilter(value as BusinessFilter)}
                                            className={clsx(
                                                "rounded-full px-3 py-1 text-[11px] transition-all duration-200 whitespace-nowrap",
                                                active
                                                    ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-md border border-brand/40"
                                                    : "bg-transparent text-white/60 hover:bg-white/10"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="inline-flex items-center gap-1.5">
                            {/* Label removed */}
                            <div className="flex gap-1 rounded-full bg-black/40 px-1 py-1 border border-white/5">
                                {(["all", "Chill", "Sport", "Party", "Study", "Gaming", "Other"] as const).map((value) => {
                                    const label = value === "all" ? "Alle" : value;
                                    const filterValue = value === "all" ? "all" : value.toLowerCase() as ActivityFilterCategory;
                                    const active = categoryFilter === filterValue;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setCategoryFilter(filterValue)}
                                            className={clsx(
                                                "rounded-full px-3 py-1 text-[11px] transition-all duration-300 font-medium whitespace-nowrap",
                                                active
                                                    ? "bg-brand text-white shadow-[0_0_15px_rgba(41,121,255,0.4)] border border-brand/50"
                                                    : "bg-transparent text-white/50 hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                    {/* End main filters */}
                </div>
            </div>


            {/* Right Island: List Toggle */}
            <div className="pointer-events-auto">
                <button
                    onClick={onToggleList}
                    className={clsx(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all border shadow-lg backdrop-blur-xl h-10",
                        isListOpen
                            ? "bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
                            : "bg-brand text-white border-brand hover:brightness-110 shadow-brand/40"
                    )}
                    aria-label={isListOpen ? "Liste ausblenden" : "Liste anzeigen"}
                >
                    <span className="hidden sm:inline">{isListOpen ? "Hide List" : "List"}</span>
                    <svg
                        className={clsx("w-4 h-4 transition-transform duration-300", isListOpen ? "rotate-180" : "rotate-0")}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

        </div>
    );
}
