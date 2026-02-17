"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { MapPin, Loader2, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type {
  ActivityCategory,
  ActivityVisibility,
} from "../types/activity";

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-white/5"><div className="h-6 w-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>
  }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const MapCursorTracker = dynamic(
  () => import("./MapCursorTracker"),
  { ssr: false }
);
const MapClickHandler = dynamic(
  () => import("./MapClickHandler"),
  { ssr: false }
);
const LocationFlyTo = dynamic(
  () => import("./LocationFlyTo"),
  { ssr: false }
);
const LocationMarker = dynamic(
  () => import("./LocationMarker"),
  { ssr: false }
);

type CreateActivityPayload = {
  title: string;
  description: string;
  time: string;
  locationName: string;
  category: ActivityCategory;
  visibility: ActivityVisibility;
  location: { latitude: number; longitude: number } | null;
  startTime: string;
  endTime: string;
  password?: string | null;
  maxParticipants?: number | null;
  isBusinessActivity?: boolean;
  businessId?: string | null;
};

type CreateActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateActivityPayload) => void;
  pendingLocation: { latitude: number; longitude: number } | null;
  onValidationError?: (message: string) => void;
  initialTitle?: string;
  initialCategory?: ActivityCategory;
  businessProfile?: {
    id: string;
    status: string;
    promotionCredits: number;
    canCreateActivities: boolean;
    businessName: string;
  } | null;
};

// Location Search Component
function LocationSearchInput({
  onLocationSelect,
  initialLocation,
}: {
  onLocationSelect: (coords: { latitude: number; longitude: number }, name: string) => void;
  initialLocation: { latitude: number; longitude: number } | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string; place_id: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performGeocodeSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NearVibe App',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performGeocodeSearch(value);
      }, 500);
    } else {
      setSearchResults([]);
    }
  }, [performGeocodeSearch]);

  const handleSelectResult = useCallback((result: { display_name: string; lat: string; lon: string }) => {
    const coords = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    onLocationSelect(coords, result.display_name.split(',')[0]);
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
    setIsFocused(false);
  }, [onLocationSelect]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className={`
        relative flex items-center
        rounded-xl border transition-all duration-200
        ${isFocused
          ? 'bg-white/10 border-brand/50 shadow-lg shadow-brand/10'
          : 'bg-white/5 border-white/10'
        }
      `}>
        <div className="absolute left-3 flex items-center pointer-events-none">
          <Search className={`h-4 w-4 transition-colors ${isFocused ? 'text-brand' : 'text-white/40'}`} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Ort suchen (z.B. Berlin, Alexanderplatz)..."
          className={`
            w-full pl-10 pr-10 py-2.5
            bg-transparent
            text-sm text-white placeholder-white/40
            focus:outline-none
            transition-all duration-200
          `}
        />
        {(searchQuery || isSearching) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Suche löschen"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
            ) : (
              <X className="h-4 w-4 text-white/40 hover:text-white/60" />
            )}
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {(searchResults.length > 0 || (isSearching && searchQuery.length >= 3)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 max-h-64 overflow-hidden z-[60]"
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <span>Suche Orte...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-white/10 active:bg-white/15 transition-colors flex items-start gap-3 group border-b border-white/5 last:border-0"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center group-hover:bg-brand/30 transition-colors">
                        <MapPin className="h-4 w-4 text-brand" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate group-hover:text-brand transition-colors">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 line-clamp-2">
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
  );
}

function validate(payload: CreateActivityPayload): {
  valid: boolean;
  errors: Partial<Record<keyof CreateActivityPayload, string>>;
} {
  const errors: Partial<Record<keyof CreateActivityPayload, string>> = {};

  if (payload.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (!payload.startTime || !payload.endTime) {
    errors.time = "Zeit ist erforderlich";
  }

  if (payload.locationName.trim().length < 3) {
    errors.locationName = "Location name must be at least 3 characters";
  }

  if (!payload.category) {
    errors.category = "Category is required";
  }


  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export default function CreateActivityModal({
  isOpen,
  onClose,
  onCreate,
  pendingLocation,
  onValidationError,
  initialTitle,
  initialCategory,
  businessProfile,
}: CreateActivityModalProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [category, setCategory] = useState<ActivityCategory>(initialCategory || "Chill");
  const [visibility, setVisibility] = useState<ActivityVisibility>("public");
  const [activityType, setActivityType] = useState<"normal" | "business">("normal");

  // Check if user can create business activities
  const canCreateBusinessActivity = businessProfile &&
    businessProfile.status === "verified" &&
    (businessProfile.promotionCredits > 0 || businessProfile.canCreateActivities);
  const [password, setPassword] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [startOption, setStartOption] = useState<"now" | "later">("now");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateActivityPayload, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    pendingLocation
  );
  const [darkMap, setDarkMap] = useState(false); // Mini-Map Dark Mode (optional, kann später mit Hauptkarte syncen)
  const [cursorPosition, setCursorPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isMouseOverMap, setIsMouseOverMap] = useState(false);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [nearbyPOIs, setNearbyPOIs] = useState<Array<{ name: string; lat: number; lon: number; type: string }>>([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);

  useEffect(() => {
    if (pendingLocation) {
      setLocation(pendingLocation);
    }
  }, [pendingLocation]);

  // Load nearby POIs when location is set
  useEffect(() => {
    if (!location) {
      setNearbyPOIs([]);
      return;
    }

    setIsLoadingPOIs(true);
    const timeoutId = setTimeout(async () => {
      try {
        // Use Nominatim reverse geocoding to find nearby places
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=16&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'NearVibe App',
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        // Then search for nearby POIs
        const poiResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=&lat=${location.latitude}&lon=${location.longitude}&radius=500&limit=5&amenity=restaurant|bar|cafe|park|theatre|cinema|sports_centre|gym`,
          {
            headers: {
              'User-Agent': 'NearVibe App',
            },
          }
        );

        if (poiResponse.ok) {
          const poiData = await poiResponse.json();
          setNearbyPOIs(
            poiData.slice(0, 5).map((poi: any) => ({
              name: poi.display_name.split(',')[0] || poi.name || 'Unbekannter Ort',
              lat: parseFloat(poi.lat),
              lon: parseFloat(poi.lon),
              type: poi.type || 'place',
            }))
          );
        }
      } catch (error) {
        console.warn('Failed to load nearby POIs', error);
      } finally {
        setIsLoadingPOIs(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [location]);

  // Dynamically import Leaflet only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        setLeaflet(L.default);
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTitle(initialTitle || "");
      setDescription("");
      setTime("");
      setLocationName("");
      setCategory(initialCategory || "Chill");
      setVisibility("public");
      setPassword("");
      setMaxParticipants("");
      setStartOption("now");
      setStartTimeInput("");
      setDurationMinutes(60);
      setErrors({});
      setIsSubmitting(false);
      setActivityType("normal");
    } else {
      // Update when modal opens with new initial values
      if (initialTitle !== undefined) setTitle(initialTitle);
      if (initialCategory !== undefined) setCategory(initialCategory);
      // Reset to normal activity type when opening (user can change if they have business)
      setActivityType("normal");
    }
  }, [isOpen, initialTitle, initialCategory]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Build startTime and endTime from user input
  const buildTimes = (): { startTime: string; endTime: string } => {
    const now = new Date();
    let start = new Date(now);

    if (startOption === "later" && startTimeInput) {
      const [hh, mm] = startTimeInput.split(":").map(Number);
      const later = new Date(now);
      later.setHours(hh ?? now.getHours(), mm ?? 0, 0, 0);
      start = later;
    }

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!location) {
      setErrors({ locationName: "Please select a location on the map" });
      onValidationError?.("Please select a location on the map");
      return;
    }

    const { startTime, endTime } = buildTimes();

    // Check if user selected business activity but doesn't have permission
    const wantsBusinessActivity = activityType === "business";
    const isVerifiedBusiness = businessProfile && businessProfile.status === "verified";
    const hasCredits = businessProfile && (businessProfile.promotionCredits > 0 || businessProfile.canCreateActivities);

    if (wantsBusinessActivity && (!isVerifiedBusiness || !hasCredits)) {
      setErrors({ category: "Du benötigst ein verifiziertes Business-Profil mit Credits, um Business-Activities zu erstellen." });
      onValidationError?.("Business-Activity nicht möglich");
      setIsSubmitting(false);
      return;
    }

    const payload: CreateActivityPayload = {
      title: title.trim(),
      description: description.trim(),
      time: "", // deprecated, kept for compatibility
      locationName: locationName.trim(),
      category,
      visibility,
      location,
      startTime,
      endTime,
      password: password.trim() || null,
      maxParticipants: maxParticipants.trim() ? parseInt(maxParticipants.trim(), 10) || null : null,
      isBusinessActivity: !!(wantsBusinessActivity && isVerifiedBusiness && hasCredits),
      businessId: wantsBusinessActivity && isVerifiedBusiness && hasCredits ? businessProfile?.id ?? null : null,
    };

    const validation = validate(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      onValidationError?.("Please fix the highlighted fields");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    onCreate(payload);
    setIsSubmitting(false);
  };

  // Build payload for validation (used for canSubmit check)
  const validationPayload: CreateActivityPayload = (() => {
    const { startTime, endTime } = buildTimes();
    const wantsBusinessActivity = activityType === "business";
    const isVerifiedBusiness = businessProfile && businessProfile.status === "verified";
    const hasCredits = businessProfile && (businessProfile.promotionCredits > 0 || businessProfile.canCreateActivities);

    return {
      title: title.trim(),
      description: description.trim(),
      time: "", // deprecated, kept for compatibility
      locationName: locationName.trim(),
      category,
      visibility,
      location: location ?? null,
      startTime,
      endTime,
      password: password.trim() || null,
      isBusinessActivity: !!(wantsBusinessActivity && isVerifiedBusiness && hasCredits),
      businessId: wantsBusinessActivity && isVerifiedBusiness && hasCredits ? businessProfile?.id ?? null : null,
    };
  })();

  const validation = validate(validationPayload);
  const canSubmit = validation.valid && !!location && !isSubmitting;

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center px-0 md:px-4 safe-area-inset-top safe-area-inset-bottom"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-activity-title"
      aria-describedby="create-activity-description"
    >
      <motion.div
        initial={{ opacity: 0, y: "100%", scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: "100%", scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={clsx(
          "relative z-10 w-full",
          "md:mx-auto md:max-w-md md:rounded-3xl",
          "bg-gradient-to-b from-black via-black to-gray-900 border-t md:border border-white/20",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.6)] md:shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
          "backdrop-blur-2xl",
          "overflow-hidden",
          "max-h-[95vh] md:max-h-[90vh]",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/15 bg-gradient-to-b from-white/5 to-transparent flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 id="create-activity-title" className="text-lg font-bold text-white bg-gradient-to-r from-white to-white/90 bg-clip-text">Neue Aktion starten</h2>
            <p id="create-activity-description" className="mt-1 text-xs text-white/70 hidden sm:block">
              Teile, was du vorhast, und lass andere teilnehmen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Modal schließen"
            className="ml-3 p-2 -mr-2 text-white/60 hover:text-white transition-all duration-200 rounded-full hover:bg-white/15 active:bg-white/20 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110 active:scale-95"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          {/* Location Search Bar */}
          <div className="px-4 pt-4 pb-2">
            <LocationSearchInput
              onLocationSelect={(coords, name) => {
                setLocation(coords);
                setLocationName(name);
              }}
              initialLocation={location}
            />
          </div>

          {/* Map Section */}
          <section className="px-4 md:px-6 pt-4">
            <div
              className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm shadow-lg"
              onMouseEnter={() => setIsMouseOverMap(true)}
              onMouseLeave={() => {
                setIsMouseOverMap(false);
                setCursorPosition(null);
              }}
            >
              {typeof window !== "undefined" && (
                <MapContainer
                  center={location ? [location.latitude, location.longitude] : [52.52, 13.405]} // Default: Berlin
                  zoom={location ? 15 : 13}
                  scrollWheelZoom={true}
                  className="h-full w-full z-0"
                  key={location ? `map-${location.latitude}-${location.longitude}` : 'map-no-location'}
                  zoomControl={false}
                  minZoom={10}
                  maxZoom={19}
                  preferCanvas={false}
                  doubleClickZoom={true}
                  dragging={true}
                  touchZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    tileSize={256}
                    zoomOffset={0}
                    maxZoom={19}
                  />
                  <MapClickHandler
                    onMapClick={(lat, lng) => {
                      setLocation({ latitude: lat, longitude: lng });
                      // Try to get location name via reverse geocoding
                      fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                        {
                          headers: {
                            'User-Agent': 'NearVibe App',
                          },
                        }
                      )
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.display_name) {
                            const name = data.display_name.split(',')[0];
                            if (name) setLocationName(name);
                          }
                        })
                        .catch((err) => console.warn('Reverse geocoding failed', err));
                    }}
                  />
                  <MapCursorTracker
                    onCursorMove={setCursorPosition}
                    isActive={isMouseOverMap}
                  />
                  {location && (
                    <>
                      <LocationMarker
                        position={[location.latitude, location.longitude]}
                        onDragEnd={(lat, lng) => {
                          setLocation({ latitude: lat, longitude: lng });
                          // Update location name after drag
                          fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                            {
                              headers: {
                                'User-Agent': 'NearVibe App',
                              },
                            }
                          )
                            .then((res) => res.json())
                            .then((data) => {
                              if (data.display_name) {
                                const name = data.display_name.split(',')[0];
                                if (name) setLocationName(name);
                              }
                            })
                            .catch((err) => console.warn('Reverse geocoding failed', err));
                        }}
                      />
                      <LocationFlyTo location={location} />
                    </>
                  )}
                  {cursorPosition && isMouseOverMap && leaflet && (
                    <Marker
                      position={[cursorPosition.lat, cursorPosition.lng]}
                      icon={leaflet.divIcon({
                        className: 'map-cursor',
                        html: '<div class="map-cursor-inner"></div>',
                        iconSize: [12, 12],
                        iconAnchor: [6, 6],
                      })}
                      interactive={false}
                      zIndexOffset={1000}
                    />
                  )}
                </MapContainer>
              )}
              {/* Overlay mit Info */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_60%)]" />
              <div className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-white/90 backdrop-blur-sm border border-white/10">
                {location ? "Marker verschieben" : "Auf Karte klicken"}
              </div>
            </div>
            {location && (
              <p className="mt-2 text-[11px] text-white/60">
                Standort ausgewählt bei{" "}
                <span className="font-medium text-white/80">
                  {location.latitude.toFixed(4)} · {location.longitude.toFixed(4)}
                </span>{" "}
                (Marker verschieben zum Anpassen).
              </p>
            )}

            {/* Nearby POIs Suggestions */}
            {nearbyPOIs.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-white/80">Vorschläge in der Nähe:</p>
                <div className="flex flex-wrap gap-2">
                  {nearbyPOIs.map((poi, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocation({ latitude: poi.lat, longitude: poi.lon });
                        setLocationName(poi.name);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 hover:bg-white/10 hover:border-white/20 transition-colors"
                    >
                      <MapPin className="h-3 w-3 text-white/60" />
                      <span className="truncate max-w-[150px]">{poi.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isLoadingPOIs && (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Suche Orte in der Nähe...</span>
              </div>
            )}
          </section>

          <form
            id="create-nearvibe-form"
            onSubmit={handleSubmit}
            className="px-4 md:px-6 pt-4 pb-5 space-y-4"
          >
            {/* TITLE */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white">
                Titel <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                placeholder="z.B. Chill im Park"
                aria-label="Titel der Aktion"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
                className={clsx(
                  "w-full rounded-xl border border-white/10 bg-void/50 px-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]",
                  errors.title && "border-red-400 focus:border-red-500 focus:ring-red-500/50"
                )}
              />
              {errors.title && (
                <p id="title-error" className="text-[11px] text-red-400 mt-1" role="alert">
                  {errors.title}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white">
                Beschreibung
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Schreib kurz, worum es geht"
                className="w-full rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 focus:bg-white/10 transition-all duration-200 resize-none shadow-sm"
              />
            </div>

            {/* TIME */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-white">
                Zeit <span className="text-red-400">*</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStartOption("now")}
                  className={clsx(
                    "rounded-full px-4 py-2.5 transition-colors min-h-[44px] font-medium",
                    startOption === "now"
                      ? "bg-brand text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                  )}
                >
                  Jetzt
                </button>
                <button
                  type="button"
                  onClick={() => setStartOption("later")}
                  className={clsx(
                    "rounded-full px-4 py-2.5 transition-colors min-h-[44px] font-medium",
                    startOption === "later"
                      ? "bg-brand text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                  )}
                >
                  Später heute
                </button>
              </div>

              {startOption === "later" && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition min-h-[44px]"
                  />
                  <span className="text-xs text-white/60">heute</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/70">Dauer</span>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition min-h-[44px]"
                >
                  <option value={30} className="bg-black text-white">30 Minuten</option>
                  <option value={60} className="bg-black text-white">1 Stunde</option>
                  <option value={120} className="bg-black text-white">2 Stunden</option>
                  <option value={180} className="bg-black text-white">3 Stunden</option>
                </select>
              </div>
            </div>

            {/* LOCATION NAME */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white">
                Wo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value);
                  if (errors.locationName) {
                    setErrors((prev) => ({ ...prev, locationName: undefined }));
                  }
                }}
                placeholder="z.B. Tiergarten, Alexanderplatz"
                aria-label="Standort-Name"
                aria-invalid={!!errors.locationName}
                aria-describedby={errors.locationName ? "location-error" : undefined}
                className={clsx(
                  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]",
                  errors.locationName && "border-red-400 focus:border-red-500 focus:ring-red-500/50"
                )}
              />
              {errors.locationName && (
                <p id="location-error" className="text-[11px] text-red-400 mt-1" role="alert">
                  {errors.locationName}
                </p>
              )}
              <p className="text-[11px] text-white/50">
                Die genauen Koordinaten kommen von der Karte oben – der Name ist das, was andere sehen.
              </p>
            </div>

            {/* ACTIVITY TYPE SELECTOR - Only show if user can create business activities */}
            {canCreateBusinessActivity && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white">
                  Activity-Typ <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActivityType("normal")}
                    className={clsx(
                      "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px]",
                      activityType === "normal"
                        ? "bg-white text-black border-white/30 shadow-lg"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">👤</span>
                      <span>Normale Activity</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityType("business")}
                    className={clsx(
                      "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px]",
                      activityType === "business"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 shadow-lg"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">🏢</span>
                      <span>Business Activity</span>
                      {businessProfile && businessProfile.promotionCredits > 0 && (
                        <span className="text-[10px] opacity-80">
                          {businessProfile.promotionCredits} Credits
                        </span>
                      )}
                    </div>
                  </button>
                </div>
                {activityType === "business" && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <p className="text-xs text-amber-200">
                      <strong className="text-amber-100">Business Activity:</strong> Diese Activity wird mit deinem verifizierten Business-Profil verknüpft und erhält ein spezielles Badge.
                      {businessProfile && businessProfile.promotionCredits > 0 && (
                        <span className="block mt-1">Verfügbare Credits: {businessProfile.promotionCredits}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CATEGORY + VISIBILITY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ActivityCategory);
                    if (errors.category) {
                      setErrors((prev) => ({ ...prev, category: undefined }));
                    }
                  }}
                  className={clsx(
                    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition min-h-[44px]",
                    errors.category && "border-red-400 focus:border-red-500 focus:ring-red-500/50"
                  )}
                >
                  <option value="Chill" className="bg-black text-white">Chill</option>
                  <option value="Sport" className="bg-black text-white">Sport</option>
                  <option value="Party" className="bg-black text-white">Party</option>
                  <option value="Study" className="bg-black text-white">Study</option>
                  <option value="Gaming" className="bg-black text-white">Gaming</option>
                  <option value="Other" className="bg-black text-white">Other</option>
                </select>
                {errors.category && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.category}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white">
                  Sichtbarkeit
                </label>
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as ActivityVisibility)
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition min-h-[44px]"
                >
                  <option value="public" className="bg-black text-white">Öffentlich</option>
                  <option value="friends" className="bg-black text-white">Nur Freunde</option>
                  <option value="private" className="bg-black text-white">Privat</option>
                </select>
              </div>
            </div>

            {/* PASSWORD (optional, shown for friends/private) */}
            {(visibility === "friends" || visibility === "private") && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white">
                  Passwort (optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort zum Beitreten"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]"
                />
                <p className="text-[11px] text-white/50">
                  {visibility === "friends"
                    ? "Nur Freunde des Hosts können beitreten. Optional kann ein Passwort zusätzlich erforderlich sein."
                    : "Nur mit korrektem Passwort kann beigetreten werden."}
                </p>
              </div>
            )}

            {/* MAX PARTICIPANTS (optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white">
                Max. Teilnehmer (optional)
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (parseInt(value, 10) > 0 && parseInt(value, 10) <= 1000)) {
                    setMaxParticipants(value);
                  }
                }}
                placeholder="Kein Limit"
                min="1"
                max="1000"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-colors min-h-[44px]"
              />
              <p className="text-[11px] text-white/50">
                Maximale Anzahl an Teilnehmern. Leer lassen für kein Limit.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/95 px-4 md:px-6 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0 safe-area-inset-bottom">
          <p className="text-[11px] text-white/60 hidden sm:block">
            Du kannst diese Aktion später jederzeit bearbeiten oder löschen.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none h-11 sm:h-9 rounded-full px-4 text-xs font-medium text-white bg-white/10 border border-white/20 hover:bg-white/15 transition min-h-[44px] sm:min-h-[36px]"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              form="create-nearvibe-form"
              disabled={!canSubmit}
              className="flex-1 sm:flex-none h-11 sm:h-9 rounded-full px-4 text-xs font-semibold text-white bg-brand hover:bg-brand-hover shadow-sm transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:hover:bg-white/10 disabled:text-white/40 min-h-[44px] sm:min-h-[36px]"
            >
              Starten
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
