"use client";

import { useMapEvents } from "react-leaflet";

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });

  return null;
}

