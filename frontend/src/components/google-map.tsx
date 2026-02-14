'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  InfoWindow,
} from '@react-google-maps/api';
import { ExperienceItem } from '@/lib/types';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItineraryGoogleMapProps {
  experiences: ExperienceItem[];
  focusedIndex: number | null;
  onMarkerClick?: (index: number) => void;
  className?: string;
}

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

// Clean, minimal map style
const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9e9e9' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5af' }] },
];

export default function ItineraryGoogleMap({
  experiences,
  focusedIndex,
  onMarkerClick,
  className,
}: ItineraryGoogleMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Generate coordinates if not provided
  const experiencesWithCoords = useMemo(() => {
    return experiences.map((exp, index) => {
      if (exp.coordinates?.lat && exp.coordinates?.lng) return exp;
      const angle = (index / experiences.length) * 2 * Math.PI;
      const radius = 0.02 + Math.random() * 0.03;
      return {
        ...exp,
        coordinates: {
          lat: defaultCenter.lat + radius * Math.cos(angle),
          lng: defaultCenter.lng + radius * Math.sin(angle),
        },
      };
    });
  }, [experiences]);

  const routePath = useMemo(() => {
    return experiencesWithCoords
      .filter((exp) => exp.coordinates?.lat && exp.coordinates?.lng)
      .map((exp) => ({ lat: exp.coordinates!.lat, lng: exp.coordinates!.lng }));
  }, [experiencesWithCoords]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    if (experiencesWithCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      experiencesWithCoords.forEach((exp) => {
        if (exp.coordinates?.lat && exp.coordinates?.lng) {
          bounds.extend({ lat: exp.coordinates.lat, lng: exp.coordinates.lng });
        }
      });
      map.fitBounds(bounds, 60);
    }
  }, [experiencesWithCoords]);

  useEffect(() => {
    if (map && focusedIndex !== null) {
      const exp = experiencesWithCoords[focusedIndex];
      if (exp?.coordinates?.lat && exp?.coordinates?.lng) {
        map.panTo({ lat: exp.coordinates.lat, lng: exp.coordinates.lng });
        map.setZoom(15);
        setSelectedMarker(focusedIndex);
      }
    }
  }, [focusedIndex, experiencesWithCoords, map]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <MapPin className="h-5 w-5 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        }}
      >
        {/* Route */}
        {routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{ strokeColor: '#4A90A4', strokeOpacity: 0.6, strokeWeight: 2 }}
          />
        )}

        {/* Markers */}
        {experiencesWithCoords.map((experience, index) => {
          if (!experience.coordinates?.lat || !experience.coordinates?.lng) return null;
          const isActive = focusedIndex === index;

          return (
            <Marker
              key={index}
              position={{ lat: experience.coordinates.lat, lng: experience.coordinates.lng }}
              onClick={() => { setSelectedMarker(index); onMarkerClick?.(index); }}
              label={{ text: String(index + 1), color: 'white', fontWeight: 'bold', fontSize: '12px' }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: isActive ? 16 : 12,
                fillColor: isActive ? '#C4846C' : '#4A90A4',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
            />
          );
        })}

        {/* Info window */}
        {selectedMarker !== null && experiencesWithCoords[selectedMarker] && (
          <InfoWindow
            position={{
              lat: experiencesWithCoords[selectedMarker].coordinates!.lat,
              lng: experiencesWithCoords[selectedMarker].coordinates!.lng,
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-1 min-w-[160px]">
              <p className="font-medium text-sm mb-1">{experiencesWithCoords[selectedMarker].name}</p>
              <p className="text-xs text-gray-600 mb-2">{experiencesWithCoords[selectedMarker].location}</p>
              <button
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                onClick={() => {
                  const exp = experiencesWithCoords[selectedMarker];
                  // Use place name search for accurate directions instead of coordinates
                  const destination = encodeURIComponent(`${exp.name}, ${exp.location}, Bangalore`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                }}
              >
                <Navigation className="h-3 w-3" />
                Directions
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
