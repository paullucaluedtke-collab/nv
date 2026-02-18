'use client';

import { useEffect, useMemo, useCallback, memo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  CircleMarker,
  ZoomControl,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '@/types/activity';
import type { BusinessProfile } from '@/types/business';
import { Search, X, MapPin, Loader2, Building2 } from 'lucide-react';

// Fix Leaflet default icon paths to prevent 404 errors
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+',
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9zdmc+',
});

// Category color mapping
const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  Chill: { bg: '#10b981', border: '#059669', text: '#ffffff' },
  Sport: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  Party: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  Study: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
  Gaming: { bg: '#ec4899', border: '#db2777', text: '#ffffff' },
  Other: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
};

// Create cluster custom icon
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 50 ? 50 : 60;

  return L.divIcon({
    html: `
      <div class="nearvibe-cluster-marker" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; background-color: rgba(37, 99, 235, 0.9); border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <span class="nearvibe-cluster-count" style="color: white; font-weight: bold; font-size: ${size / 3}px;">${count}</span>
      </div>
    `,
    className: 'nearvibe-cluster',
    iconSize: L.point(size, size, true),
  });
};

// Create marker icon with category color and participant count - Memoized outside component
const createActivityMarkerIcon = (
  category: string,
  participantCount: number,
  isSelected: boolean,
  isOngoing: boolean,
  isBusinessActivity: boolean = false
) => {
  const colors = categoryColors[category] || categoryColors.Other;
  const bgColor = isBusinessActivity ? '#f59e0b' : colors.bg;
  const borderColor = isBusinessActivity ? '#d97706' : colors.border;
  const size = isSelected ? 32 : 28;
  // Use simple classes, avoid complex DOM manipulation in strings if possible
  const pulseClass = isOngoing ? 'nearvibe-marker-pulse' : '';
  const businessClass = isBusinessActivity ? 'nearvibe-business-activity-marker' : '';
  const selectedClass = isSelected ? 'nearvibe-activity-marker--selected' : '';

  return L.divIcon({
    className: `nearvibe-activity-marker ${selectedClass} ${pulseClass} ${businessClass}`,
    html: `
      <div class="nearvibe-activity-marker-inner" style="background: ${bgColor}; border-color: ${borderColor}; ${isBusinessActivity ? 'border-width: 3px; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);' : ''}">
        <span class="nearvibe-activity-marker-count">${participantCount}</span>
        ${isBusinessActivity ? '<span class="nearvibe-business-badge">✓</span>' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Pre-create business marker icon since it's static
const businessMarkerIcon = L.divIcon({
  className: 'nearvibe-business-marker',
  html: '<div class="nearvibe-business-marker-inner"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type MapViewProps = {
  activities: Activity[];
  selectedActivityId?: string | null;
  selectedLocation?: { latitude: number; longitude: number } | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerSelect?: (activityId: string) => void;
  onSearchChange?: (searchQuery: string) => void;
  searchQuery?: string;
  businesses?: BusinessProfile[];
};

type GeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

// Separate component for flying to selection to avoid re-rendering entire map
const SelectedActivityFlyTo = memo(function SelectedActivityFlyTo({
  activities,
  selectedActivityId,
}: {
  activities: Activity[];
  selectedActivityId?: string | null;
}) {
  const map = useMap(); // This is safe inside MapContainer

  useEffect(() => {
    if (!selectedActivityId) return;
    const activity = activities.find((act) => act.id === selectedActivityId);
    if (activity && activity.latitude !== null && activity.longitude !== null) {
      map.flyTo([activity.latitude, activity.longitude], 14, {
        duration: 0.7,
      });
    }
  }, [activities, selectedActivityId, map]);

  return null;
});

const MapClickHandler = memo(function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
}) {
  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      onMapClick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
    [onMapClick]
  );

  useMapEvents({
    click: handleClick,
  });

  return null;
});

// Helper to determine if activity is ongoing
const isActivityOngoing = (activity: Activity): boolean => {
  if (!activity.startTime || !activity.endTime) return false;
  const now = new Date();
  const start = new Date(activity.startTime);
  const end = new Date(activity.endTime);
  return now >= start && now <= end && !activity.isClosed;
};

// Dedicated component for each activity marker to prevent recreation
const ActivityMarker = memo(function ActivityMarker({
  activity,
  isSelected,
  onMarkerSelect,
}: {
  activity: Activity;
  isSelected: boolean;
  onMarkerSelect?: (activityId: string) => void;
}) {
  const participantCount = activity.joinedUserIds?.length || 0;
  const isOngoing = isActivityOngoing(activity);
  const colors = categoryColors[activity.category] || categoryColors.Other;

  // Memoize date formatting
  const timeString = useMemo(() => {
    if (activity.startTime && activity.endTime) {
      const start = new Date(activity.startTime);
      const end = new Date(activity.endTime);
      const startStr = start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const endStr = end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      return `${startStr} – ${endStr}`;
    }
    return activity.time || 'Zeit nicht angegeben';
  }, [activity.startTime, activity.endTime, activity.time]);

  // Memoize icon creation
  const icon = useMemo(() => {
    return createActivityMarkerIcon(
      activity.category,
      participantCount,
      isSelected,
      isOngoing,
      activity.isBusinessActivity ?? false
    );
  }, [activity.category, participantCount, isSelected, isOngoing, activity.isBusinessActivity]);

  if (activity.latitude === null || activity.longitude === null) return null;

  return (
    <>
      <Marker
        position={[activity.latitude, activity.longitude]}
        icon={icon}
        eventHandlers={{
          click: () => onMarkerSelect?.(activity.id),
        }}
        zIndexOffset={isSelected ? 1000 : (activity.isBusinessActivity ? 600 : 500)}
      >
        <Popup className="custom-popup" maxWidth={280}>
          <div className="space-y-2 p-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base text-black leading-tight flex-1">{activity.title}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: colors.bg }}
              >
                {activity.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="font-medium">{timeString}</span>
            </div>
            {activity.description && (
              <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">{activity.description}</p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-700">
                  {participantCount}{activity.maxParticipants ? ` / ${activity.maxParticipants}` : ''} Teilnehmer
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activity.isBusinessActivity && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wide">
                    ✓ Business
                  </span>
                )}
                {isOngoing && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                    Läuft jetzt
                  </span>
                )}
                {activity.isClosed && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
                    Beendet
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{activity.locationName}</span>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Circle marker for selection */}
      {isSelected && (
        <CircleMarker
          center={[activity.latitude, activity.longitude]}
          radius={30}
          pathOptions={{
            color: colors.border,
            fillColor: colors.bg,
            fillOpacity: 0.25,
            weight: 3,
          }}
        />
      )}
    </>
  );
});

// Business marker component
const BusinessMarker = memo(function BusinessMarker({
  business,
}: {
  business: BusinessProfile;
}) {
  if (business.latitude === null || business.longitude === null) return null;

  return (
    <Marker
      position={[business.latitude, business.longitude]}
      icon={businessMarkerIcon}
    >
      <Popup className="custom-popup">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            <h3 className="font-semibold text-sm text-black">{business.businessName}</h3>
          </div>
          {business.businessType && (
            <p className="text-xs text-neutral-500 capitalize">{business.businessType.replace('_', ' ')}</p>
          )}
          {business.address && (
            <p className="text-xs text-neutral-600">{business.address}</p>
          )}
          {business.description && (
            <p className="text-xs text-neutral-600 line-clamp-2">{business.description}</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

// Component to handle map fly-to for search results
const SearchLocationFlyTo = memo(function SearchLocationFlyTo({
  location,
}: {
  location: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    map.flyTo([location.latitude, location.longitude], 15, {
      duration: 1.0,
    });
  }, [location, map]);

  return null;
});

// Search location marker icon - Constant
const searchLocationIcon = L.divIcon({
  className: 'nearvibe-search-marker',
  html: '<div class="nearvibe-search-marker-inner"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapView({
  activities,
  selectedActivityId,
  selectedLocation,
  onMapClick,
  onMarkerSelect,
  onSearchChange,
  searchQuery = '',
  businesses = [],
}: MapViewProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Geocoding search
  const performGeocodeSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setSelectedSearchLocation(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'NearVibe App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data: GeocodeResult[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);

    // Debounce geocoding search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performGeocodeSearch(value);
      }, 500);
    } else {
      setSearchResults([]);
      setSelectedSearchLocation(null);
    }
  }, [onSearchChange, performGeocodeSearch]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    onSearchChange?.('');
    setSearchResults([]);
    setSelectedSearchLocation(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, [onSearchChange]);

  const handleSelectSearchResult = useCallback((result: GeocodeResult) => {
    const location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      name: result.display_name,
    };
    setSelectedSearchLocation(location);
    setLocalSearchQuery(result.display_name);
    setSearchResults([]);
    setIsSearchFocused(false);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Filter valid activities once
  const validActivities = useMemo(() => {
    return activities.filter((a) => a.latitude !== null && a.longitude !== null);
  }, [activities]);

  const validBusinesses = useMemo(() => {
    return businesses.filter((b) => b.latitude !== null && b.longitude !== null);
  }, [businesses]);

  const handleMapClick = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      onMapClick?.(coords);
    },
    [onMapClick]
  );

  const tileUrl = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png";

  return (
    <div className="relative h-[60vh] min-h-[360px] max-h-[720px] w-full rounded-3xl border border-white/10 bg-void-card shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
      {/* Search Bar */}
      <div className="absolute top-20 left-4 right-4 z-[10] flex justify-center pointer-events-none">
        <div className="relative w-full max-w-md pointer-events-auto">
          <div className={`
            relative flex items-center
            rounded-2xl border transition-all duration-300
            ${isSearchFocused
              ? 'bg-void-card shadow-[0_0_20px_rgba(41,121,255,0.2)] border-brand/50 ring-1 ring-brand/50'
              : 'glass-panel shadow-lg border-white/10 hover:border-white/20'
            }
          `}>
            <div className="absolute left-4 flex items-center pointer-events-none">
              <Search className={`h-4 w-4 transition-colors ${isSearchFocused ? 'text-brand' : 'text-white/40'}`} />
            </div>
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Ort suchen..."
              className={`
                w-full pl-11 pr-11 py-3
                bg-transparent
                text-sm text-white placeholder-white/40
                focus:outline-none
                transition-all duration-200
              `}
            />
            {(localSearchQuery || isSearching) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Suche löschen"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                ) : (
                  <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                )}
              </button>
            )}
          </div>
          <AnimatePresence>
            {(searchResults.length > 0 || (isSearching && localSearchQuery.length >= 3)) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/50 max-h-72 overflow-hidden z-[11] backdrop-blur-xl"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    <span>Suche Orte...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-start gap-3 group border-b border-gray-100/50 last:border-0"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center group-hover:bg-brand/20 transition-colors">
                            <MapPin className="h-4 w-4 text-brand" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand transition-colors">
                            {result.display_name.split(',')[0]}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {result.display_name.split(',').slice(1).join(',').trim()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
            <span className="text-xs text-gray-600">Karte wird geladen…</span>
          </div>
        </div>
      )}

      <MapContainer
        center={[52.52, 13.405]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        key="map-container"
        zoomControl={false}
        preferCanvas={true}
        whenReady={() => setMapLoaded(true)}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors, &copy; Stadia Maps'
          url={tileUrl}
          tileSize={256}
          zoomOffset={0}
          maxZoom={19}
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={2}
        />

        <ZoomControl position="bottomright" />

        {mapLoaded && (
          <>
            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
            >
              {validActivities.map((activity) => (
                <ActivityMarker
                  key={activity.id}
                  activity={activity}
                  isSelected={selectedActivityId === activity.id}
                  onMarkerSelect={onMarkerSelect}
                />
              ))}
              {validBusinesses.map((business) => (
                <BusinessMarker key={business.id} business={business} />
              ))}
            </MarkerClusterGroup>

            {selectedLocation && (
              <CircleMarker
                center={[selectedLocation.latitude, selectedLocation.longitude]}
                radius={16}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#2563eb",
                  fillOpacity: 0.25,
                  weight: 2,
                }}
              />
            )}

            {selectedSearchLocation && (
              <>
                <Marker
                  position={[selectedSearchLocation.latitude, selectedSearchLocation.longitude]}
                  icon={searchLocationIcon}
                >
                  <Popup className="custom-popup">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-black">{selectedSearchLocation.name}</h3>
                    </div>
                  </Popup>
                </Marker>
                <CircleMarker
                  center={[selectedSearchLocation.latitude, selectedSearchLocation.longitude]}
                  radius={20}
                  pathOptions={{
                    color: "#10b981",
                    fillColor: "#10b981",
                    fillOpacity: 0.15,
                    weight: 2,
                  }}
                />
                <SearchLocationFlyTo location={selectedSearchLocation} />
              </>
            )}

            <SelectedActivityFlyTo
              activities={activities}
              selectedActivityId={selectedActivityId}
            />
            <MapClickHandler onMapClick={handleMapClick} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default memo(MapView);
