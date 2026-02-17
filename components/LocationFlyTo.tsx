"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface LocationFlyToProps {
  location: { latitude: number; longitude: number };
}

export default function LocationFlyTo({ location }: LocationFlyToProps) {
  const map = useMap();

  useEffect(() => {
    if (location && map) {
      map.setView([location.latitude, location.longitude], 15, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [location.latitude, location.longitude, map]);

  return null;
}

