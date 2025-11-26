'use client';

import { useEffect, Fragment, useMemo, useCallback, memo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '@/types/activity';

const minimalMarkerIcon = L.divIcon({
  className: 'popout-marker',
  html: '<div class="popout-marker-inner"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const minimalMarkerIconSelected = L.divIcon({
  className: 'popout-marker popout-marker--selected',
  html: '<div class="popout-marker-inner popout-marker-inner--selected"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type MapViewProps = {
  activities: Activity[];
  selectedActivityId?: string | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerSelect?: (activityId: string) => void;
};

function SelectedActivityFlyTo({
  activities,
  selectedActivityId,
}: {
  activities: Activity[];
  selectedActivityId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedActivityId) return;
    const activity = activities.find((act) => act.id === selectedActivityId);
    if (activity) {
      map.flyTo([activity.latitude, activity.longitude], 14, {
        duration: 0.7,
      });
    }
  }, [activities, selectedActivityId, map]);

  return null;
}

const MapClickHandler = memo(function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
}) {
  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
    [onMapClick]
  );

  useMapEvents({
    click: handleClick,
  });

  return null;
});

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
  return (
    <Fragment>
      {isSelected && (
        <CircleMarker
          center={[activity.latitude, activity.longitude]}
          radius={26}
          pathOptions={{
            color: '#000000',
            fillColor: '#000000',
            fillOpacity: 0.08,
            weight: 1,
          }}
        />
      )}
      <Marker
        position={[activity.latitude, activity.longitude]}
        icon={isSelected ? minimalMarkerIconSelected : minimalMarkerIcon}
        eventHandlers={{
          click: () => onMarkerSelect?.(activity.id),
        }}
      >
        <Popup className="custom-popup">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-black">{activity.title}</h3>
            <p className="text-xs text-neutral-600">{activity.time}</p>
            {activity.description && (
              <p className="text-xs text-neutral-600">{activity.description}</p>
            )}
            <p className="text-xs text-neutral-600">
              {activity.participantsCount} / {activity.maxParticipants} joined
            </p>
          </div>
        </Popup>
      </Marker>
    </Fragment>
  );
});

function MapView({
  activities,
  selectedActivityId,
  onMapClick,
  onMarkerSelect,
}: MapViewProps) {
  // Memoize the markers to prevent recreation
  const markers = useMemo(() => {
    return activities.map((activity) => (
      <ActivityMarker
        key={activity.id}
        activity={activity}
        isSelected={selectedActivityId === activity.id}
        onMarkerSelect={onMarkerSelect}
      />
    ));
  }, [activities, selectedActivityId, onMarkerSelect]);

  // Memoize the click handler
  const handleMapClick = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      if (onMapClick) {
        onMapClick(coords);
      }
    },
    [onMapClick]
  );

  return (
    <div className="h-full w-full rounded-3xl border border-black/10 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <MapContainer
        center={[52.52, 13.405]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        key="map-container"
      >
        <TileLayer
          url="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {markers}
        <SelectedActivityFlyTo
          activities={activities}
          selectedActivityId={selectedActivityId}
        />
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>
    </div>
  );
}

export default memo(MapView);
