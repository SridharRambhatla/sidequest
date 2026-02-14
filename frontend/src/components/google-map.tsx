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
import { MapPin, Navigation, Clock, IndianRupee, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Libraries needed for Places API
const libraries: ("places")[] = ["places"];

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

// Cache for place photos to avoid repeated API calls
const placePhotoCache = new Map<string, string>();

// Cache for generated coordinates to ensure consistency across reorders
const coordinatesCache = new Map<string, { lat: number; lng: number }>();

// Generate a deterministic hash from a string (for consistent coordinate generation)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default function ItineraryGoogleMap({
  experiences,
  focusedIndex,
  onMarkerClick,
  className,
}: ItineraryGoogleMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [placePhoto, setPlacePhoto] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Fetch place photo when a marker is selected
  useEffect(() => {
    if (selectedMarker === null || !isLoaded || !map) {
      setPlacePhoto(null);
      return;
    }

    const experience = experiences[selectedMarker];
    if (!experience) return;

    const cacheKey = `${experience.name}-${experience.location}`;
    
    // Check cache first
    if (placePhotoCache.has(cacheKey)) {
      setPlacePhoto(placePhotoCache.get(cacheKey) || null);
      return;
    }

    setIsLoadingPhoto(true);
    setPlacePhoto(null);

    // Use Places Service to find the place and get its photo
    const service = new google.maps.places.PlacesService(map);
    
    service.findPlaceFromQuery(
      {
        query: `${experience.name}, ${experience.location}, Bangalore`,
        fields: ['photos', 'name', 'formatted_address'],
      },
      (results, status) => {
        setIsLoadingPhoto(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          if (place.photos && place.photos.length > 0) {
            const photoUrl = place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
            setPlacePhoto(photoUrl);
            placePhotoCache.set(cacheKey, photoUrl);
          }
        }
      }
    );
  }, [selectedMarker, isLoaded, map, experiences]);

  // Generate coordinates if not provided - uses deterministic hash for consistency
  const experiencesWithCoords = useMemo(() => {
    return experiences.map((exp) => {
      // If coordinates already exist, use them
      if (exp.coordinates?.lat && exp.coordinates?.lng) return exp;
      
      // Create a unique key for this experience
      const cacheKey = `${exp.name}-${exp.location}`;
      
      // Check cache first for consistent coordinates across reorders
      if (coordinatesCache.has(cacheKey)) {
        return { ...exp, coordinates: coordinatesCache.get(cacheKey)! };
      }
      
      // Generate deterministic coordinates based on experience name/location hash
      const hash = hashString(cacheKey);
      const angle = (hash % 360) * (Math.PI / 180); // Convert to radians
      const radius = 0.015 + (hash % 100) / 4000; // 0.015 to 0.040 range
      
      const coordinates = {
        lat: defaultCenter.lat + radius * Math.cos(angle),
        lng: defaultCenter.lng + radius * Math.sin(angle),
      };
      
      // Cache for future use
      coordinatesCache.set(cacheKey, coordinates);
      
      return { ...exp, coordinates };
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
            onCloseClick={() => { setSelectedMarker(null); setPlacePhoto(null); }}
            options={{ maxWidth: 320 }}
          >
            <div className="min-w-[280px] max-w-[300px]">
              {/* Place Image */}
              <div className="w-full h-[140px] bg-gray-100 rounded-t-lg overflow-hidden mb-2 -mt-2 -mx-2" style={{ width: 'calc(100% + 16px)' }}>
                {isLoadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                      <span className="text-xs text-gray-400">Loading image...</span>
                    </div>
                  </div>
                ) : placePhoto ? (
                  <img 
                    src={placePhoto} 
                    alt={experiencesWithCoords[selectedMarker].name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-blue-300 mx-auto mb-1" />
                      <span className="text-xs text-blue-400">{experiencesWithCoords[selectedMarker].category}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="px-1">
                {/* Title & Location */}
                <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                  {experiencesWithCoords[selectedMarker].name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {experiencesWithCoords[selectedMarker].location}
                </p>

                {/* Description */}
                {experiencesWithCoords[selectedMarker].description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {experiencesWithCoords[selectedMarker].description}
                  </p>
                )}

                {/* Timing & Cost */}
                <div className="flex items-center gap-3 mb-2 text-xs">
                  {experiencesWithCoords[selectedMarker].timing && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>{experiencesWithCoords[selectedMarker].timing}</span>
                    </div>
                  )}
                  {experiencesWithCoords[selectedMarker].budget > 0 && (
                    <div className="flex items-center gap-0.5 text-gray-600">
                      <IndianRupee className="h-3 w-3 text-green-500" />
                      <span>{experiencesWithCoords[selectedMarker].budget}</span>
                    </div>
                  )}
                </div>

                {/* Directions Button */}
                <button
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md py-1.5 transition-colors"
                  onClick={() => {
                    const exp = experiencesWithCoords[selectedMarker];
                    const destination = encodeURIComponent(`${exp.name}, ${exp.location}, Bangalore`);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                  }}
                >
                  <Navigation className="h-3 w-3" />
                  Get Directions
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
