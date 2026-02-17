'use client';

import { Activity } from '@/types/activity';
import clsx from 'clsx';

interface Props {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  loading?: boolean;
  isMobileView?: boolean;
}

export default function ActivityList({
  activities,
  onSelectActivity,
  loading = false,
  isMobileView = false,
}: Props) {
  return (
    <div className={clsx("h-full w-full flex flex-col bg-transparent", isMobileView && "pb-safe")}>
      {/* Header - Only show on Desktop or if not in mobile view (optional) */}
      {!isMobileView && (
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-white/5 bg-void/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white glow-text">Activities</h2>
        </div>
      )}

      {/* Scrollable Activities List */}
      <div className={clsx("flex-1 overflow-y-auto custom-scrollbar", isMobileView ? "px-4 pt-2" : "px-4 sm:px-6 py-5 sm:py-6")}>
        {activities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/60 text-sm font-medium">No active vibes nearby</p>
            <p className="text-white/40 text-xs mt-2">Create your first activity to start the wave!</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                className="glass-card p-5 sm:p-6 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                {/* Title and PUBLIC tag */}
                <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
                  <h3 className="font-bold text-white text-lg sm:text-xl leading-tight flex-1 group-hover:text-brand-light transition-colors">
                    {activity.title}
                  </h3>
                  <span className="px-3 py-1 bg-brand/20 border border-brand/30 text-brand-light text-[10px] font-bold rounded-full whitespace-nowrap shadow-sm">
                    PUBLIC
                  </span>
                </div>

                {/* Time */}
                <p className="text-sm sm:text-base text-brand font-semibold mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
                  {activity.time}
                </p>

                {/* Description */}
                <p className="text-sm sm:text-base text-white/70 line-clamp-2 leading-relaxed group-hover:text-white/90 transition-colors">
                  {activity.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
