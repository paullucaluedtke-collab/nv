'use client';

import { Activity } from '@/types/activity';

interface ActivityListProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
}

export default function ActivityList({ activities, onActivityClick }: ActivityListProps) {
  return (
    <div className="h-full w-full flex flex-col bg-white/90 backdrop-blur-sm lg:bg-white/95">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200/50">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Activities</h2>
      </div>

      {/* Scrollable Activities List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No activities available</p>
            <p className="text-gray-400 text-xs mt-2">Create your first activity to get started!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => onActivityClick(activity)}
                className="p-4 sm:p-5 bg-white rounded-xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] border border-gray-100/50"
              >
                {/* Title and PUBLIC tag */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight flex-1">
                    {activity.title}
                  </h3>
                  <span className="px-2.5 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold rounded-full whitespace-nowrap">
                    PUBLIC
                  </span>
                </div>
                
                {/* Time */}
                <p className="text-xs sm:text-sm text-primary font-medium mb-2.5">
                  {activity.time}
                </p>
                
                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
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

