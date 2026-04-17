'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExperienceItem } from '@/lib/types';
import { MapPin, Navigation, Clock, IndianRupee, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

interface ItineraryGoogleMapProps {
  experiences: ExperienceItem[];
  focusedIndex: number | null;
  onMarkerClick?: (index: number) => void;
  className?: string;
  cityCoordinates?: { lat: number; lng: number };
}

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const coordinatesCache = new Map<string, { lat: number; lng: number }>();

function LeafletMapInner({
  experiences,
  focusedIndex,
  onMarkerClick,
  className,
  cityCoordinates,
}: ItineraryGoogleMapProps) {
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [L, setL] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const mapCenter = cityCoordinates || defaultCenter;

  const experiencesWithCoords = useMemo(() => {
    return experiences.map((exp) => {
      if (exp.coordinates?.lat && exp.coordinates?.lng) return exp;

      const cacheKey = `${exp.name}-${exp.location}`;
      if (coordinatesCache.has(cacheKey)) {
        return { ...exp, coordinates: coordinatesCache.get(cacheKey)! };
      }

      const hash = hashString(cacheKey);
      const angle = (hash % 360) * (Math.PI / 180);
      const radius = 0.015 + (hash % 100) / 4000;
      const coordinates = {
        lat: mapCenter.lat + radius * Math.cos(angle),
        lng: mapCenter.lng + radius * Math.sin(angle),
      };
      coordinatesCache.set(cacheKey, coordinates);
      return { ...exp, coordinates };
    });
  }, [experiences, mapCenter]);

  useEffect(() => {
    if (!L || !mapRef.current) return;
    if (mapReady) return;

    // Import CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const container = mapRef.current;
    if ((container as any)._leaflet_id) return;

    const map = L.map(container, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    (container as any)._leaflet_map = map;
    setMapReady(true);

    return () => {
      map.remove();
      link.remove();
    };
  }, [L, mapCenter]);

  // Add markers
  useEffect(() => {
    if (!L || !mapReady || !mapRef.current) return;
    const map = (mapRef.current as any)._leaflet_map;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const validExps = experiencesWithCoords.filter(
      (e) => e.coordinates?.lat && e.coordinates?.lng
    );

    // Route line
    if (validExps.length > 1) {
      const path = validExps.map((e) => [e.coordinates!.lat, e.coordinates!.lng]);
      L.polyline(path, { color: '#4A90A4', weight: 2, opacity: 0.6 }).addTo(map);
    }

    // Markers
    validExps.forEach((exp, index) => {
      const isActive = focusedIndex === index;
      const size = isActive ? 28 : 22;
      const color = isActive ? '#C4846C' : '#4A90A4';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};color:white;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">${index + 1}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([exp.coordinates!.lat, exp.coordinates!.lng], { icon })
        .addTo(map);

      marker.on('click', () => {
        setSelectedMarker(index);
        onMarkerClick?.(index);
      });

      const popup = L.popup({ maxWidth: 260, closeButton: true }).setContent(`
        <div style="font-family:system-ui;min-width:200px">
          <h3 style="font-size:14px;font-weight:600;margin:0 0 4px">${exp.name}</h3>
          <p style="font-size:12px;color:#666;margin:0 0 6px">${exp.location}</p>
          ${exp.description ? `<p style="font-size:11px;color:#555;margin:0 0 8px">${exp.description.slice(0, 100)}...</p>` : ''}
          <div style="display:flex;gap:12px;font-size:11px;color:#666;margin-bottom:8px">
            ${exp.timing ? `<span>${exp.timing}</span>` : ''}
            ${exp.budget ? `<span>₹${exp.budget}</span>` : ''}
          </div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${exp.coordinates!.lat},${exp.coordinates!.lng}"
             target="_blank" rel="noopener"
             style="display:block;text-align:center;background:#2563eb;color:white;
                    padding:6px;border-radius:6px;text-decoration:none;font-size:12px">
            Get Directions
          </a>
        </div>
      `);
      marker.bindPopup(popup);
    });

    // Fit bounds
    if (validExps.length > 0) {
      const bounds = L.latLngBounds(
        validExps.map((e) => [e.coordinates!.lat, e.coordinates!.lng])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [L, mapReady, experiencesWithCoords, focusedIndex, onMarkerClick]);

  // Pan to focused marker
  useEffect(() => {
    if (!L || !mapReady || !mapRef.current || focusedIndex === null) return;
    const map = (mapRef.current as any)._leaflet_map;
    const exp = experiencesWithCoords[focusedIndex];
    if (map && exp?.coordinates?.lat && exp?.coordinates?.lng) {
      map.setView([exp.coordinates.lat, exp.coordinates.lng], 15, { animate: true });
    }
  }, [focusedIndex, experiencesWithCoords, L, mapReady]);

  if (!L) {
    return (
      <div className={cn('h-full w-full flex items-center justify-center bg-muted', className)}>
        <MapPin className="h-5 w-5 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function ItineraryGoogleMap(props: ItineraryGoogleMapProps) {
  return <LeafletMapInner {...props} />;
}
