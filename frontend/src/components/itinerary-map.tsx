'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ExperienceItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Clock, UserCheck } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface ItineraryMapProps {
  experiences: ExperienceItem[];
  focusedIndex: number | null;
  onMarkerClick?: (index: number) => void;
}

// Custom numbered marker icon
function createNumberedIcon(number: number, isActive: boolean): L.DivIcon {
  return L.divIcon({
    html: `
      <div class="custom-marker ${isActive ? 'active' : ''}">
        ${number}
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Component to handle map view updates
function MapController({ 
  experiences, 
  focusedIndex 
}: { 
  experiences: ExperienceItem[];
  focusedIndex: number | null;
}) {
  const map = useMap();

  // Fit bounds to all markers on initial load
  useEffect(() => {
    const validExperiences = experiences.filter(
      (exp) => exp.coordinates?.lat && exp.coordinates?.lng
    );
    
    if (validExperiences.length > 0) {
      const bounds = L.latLngBounds(
        validExperiences.map((exp) => [exp.coordinates!.lat, exp.coordinates!.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [experiences, map]);

  // Focus on specific marker when focusedIndex changes
  useEffect(() => {
    if (focusedIndex !== null) {
      const exp = experiences[focusedIndex];
      if (exp?.coordinates?.lat && exp?.coordinates?.lng) {
        map.setView([exp.coordinates.lat, exp.coordinates.lng], 15, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [focusedIndex, experiences, map]);

  return null;
}

export default function ItineraryMap({
  experiences,
  focusedIndex,
  onMarkerClick,
}: ItineraryMapProps) {
  // Generate mock coordinates for demo if not provided
  const experiencesWithCoords = useMemo(() => {
    // Bangalore city center coordinates
    const centerLat = 12.9716;
    const centerLng = 77.5946;
    
    return experiences.map((exp, index) => {
      if (exp.coordinates?.lat && exp.coordinates?.lng) {
        return exp;
      }
      // Generate coordinates in a rough circle around Bangalore
      const angle = (index / experiences.length) * 2 * Math.PI;
      const radius = 0.02 + Math.random() * 0.03; // Random radius for variety
      return {
        ...exp,
        coordinates: {
          lat: centerLat + radius * Math.cos(angle),
          lng: centerLng + radius * Math.sin(angle),
        },
      };
    });
  }, [experiences]);

  // Create route line coordinates
  const routeCoordinates = experiencesWithCoords
    .filter((exp) => exp.coordinates?.lat && exp.coordinates?.lng)
    .map((exp) => [exp.coordinates!.lat, exp.coordinates!.lng] as [number, number]);

  // Default center (Bangalore)
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  return (
    <div className="h-full w-full relative">
      {/* Custom styles for markers */}
      <style jsx global>{`
        .custom-marker-container {
          background: none !important;
          border: none !important;
        }
        .custom-marker {
          width: 32px;
          height: 32px;
          background: var(--sidequest-primary, #4A90A4);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid white;
          transition: all 0.2s ease;
        }
        .custom-marker.active {
          transform: scale(1.2);
          background: var(--sidequest-accent, #C4846C);
          box-shadow: 0 4px 12px rgba(196, 132, 108, 0.4);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* Map tiles - using a clean, minimal style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Map controller for view updates */}
        <MapController 
          experiences={experiencesWithCoords} 
          focusedIndex={focusedIndex} 
        />

        {/* Route line connecting all points */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#4A90A4',
              weight: 3,
              opacity: 0.6,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Markers for each experience */}
        {experiencesWithCoords.map((experience, index) => {
          if (!experience.coordinates?.lat || !experience.coordinates?.lng) {
            return null;
          }

          return (
            <Marker
              key={index}
              position={[experience.coordinates.lat, experience.coordinates.lng]}
              icon={createNumberedIcon(index + 1, focusedIndex === index)}
              eventHandlers={{
                click: () => onMarkerClick?.(index),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-semibold text-base mb-1">
                    {experience.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {experience.location}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {experience.timing}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <IndianRupee className="h-3 w-3 mr-1" />
                      {experience.budget.toLocaleString('en-IN')}
                    </Badge>
                    {experience.solo_friendly && (
                      <Badge variant="secondary" className="text-xs bg-secondary/20">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Solo-sure
                      </Badge>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border border-border z-[1000]">
        <div className="text-xs font-medium mb-2">Your Route</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>{experiences.length} stops</span>
        </div>
      </div>
    </div>
  );
}
