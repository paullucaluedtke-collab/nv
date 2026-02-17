"use client";

import { useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";

type MapCursorTrackerProps = {
  onCursorMove: (pos: { lat: number; lng: number } | null) => void;
  isActive: boolean;
};

export default function MapCursorTracker({ onCursorMove, isActive }: MapCursorTrackerProps) {
  useMapEvents({
    mousemove: (e) => {
      if (isActive) {
        onCursorMove({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
    mouseout: () => {
      onCursorMove(null);
    },
  });

  return null;
}

