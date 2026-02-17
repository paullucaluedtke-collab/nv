"use client";

import { useEffect, useState } from "react";
import { Marker } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

interface LocationMarkerProps {
  position: LatLngTuple;
  onDragEnd: (lat: number, lng: number) => void;
}

export default function LocationMarker({ position, onDragEnd }: LocationMarkerProps) {
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        setLeaflet(L.default);
      });
    }
  }, []);

  if (!leaflet) return null;

  const icon = leaflet.divIcon({
    className: "nearvibe-location-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  return (
    <Marker
      position={position}
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target as any;
          const pos = marker.getLatLng();
          onDragEnd(pos.lat, pos.lng);
        },
      }}
    />
  );
}

