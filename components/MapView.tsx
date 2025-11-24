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

// Fix for default marker icon in Next.js - only run once
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Create icons only once - outside component
const defaultIcon = new L.Icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new L.Icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [48, 48],
  className: 'selected-marker',
});

type MapViewProps = {
  activities: Activity[];
  selectedActivityId?: string | null;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
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
}: {
  activity: Activity;
  isSelected: boolean;
}) {
  return (
    <Fragment>
      {isSelected && (
        <CircleMarker
          center={[activity.latitude, activity.longitude]}
          radius={25}
          pathOptions={{
            color: '#f472b6',
            fillColor: '#f472b6',
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      )}
      <Marker
        position={[activity.latitude, activity.longitude]}
        icon={isSelected ? selectedIcon : defaultIcon}
      >
        <Popup>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{activity.title}</h3>
            <p className="text-xs text-gray-600">{activity.time}</p>
            <p className="text-xs text-gray-700">{activity.description}</p>
          </div>
        </Popup>
      </Marker>
    </Fragment>
  );
});

function MapView({ activities, selectedActivityId, onMapClick }: MapViewProps) {
  // Memoize the markers to prevent recreation
  const markers = useMemo(() => {
    return activities.map((activity) => (
      <ActivityMarker
        key={activity.id}
        activity={activity}
        isSelected={selectedActivityId === activity.id}
      />
    ));
  }, [activities, selectedActivityId]);

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
    <MapContainer
      center={[52.52, 13.405]}
      zoom={12}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      key="map-container"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers}
      <SelectedActivityFlyTo
        activities={activities}
        selectedActivityId={selectedActivityId}
      />
      <MapClickHandler onMapClick={handleMapClick} />
    </MapContainer>
  );
}

export default memo(MapView);
