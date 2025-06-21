import { useEffect, useRef, useState } from "react";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";

interface LocationMarkerProps {
  map: MapboxMap;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ map }) => {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'active' | 'error'>('idle');
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);

  useEffect(() => {
    // Create the geolocate control
    geolocateControlRef.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000
      },
      trackUserLocation: true, // This enables continuous tracking
      showUserHeading: true, // Shows user's heading/direction
      showUserLocation: true, // Shows the user's location
      showAccuracyCircle: true, // Shows accuracy circle
      fitBoundsOptions: {
        maxZoom: 15
      }
    });

    // Add event listeners
    geolocateControlRef.current.on('geolocate', (e: any) => {
      console.log('Location acquired:', e.coords);
      setLocationStatus('active');
    });

    geolocateControlRef.current.on('trackuserlocationstart', () => {
      console.log('Started tracking user location');
      setLocationStatus('active');
    });

    geolocateControlRef.current.on('trackuserlocationend', () => {
      console.log('Stopped tracking user location');
      setLocationStatus('idle');
    });

    geolocateControlRef.current.on('error', (e: any) => {
      console.error('Geolocate error:', e);
      setLocationStatus('error');
    });

    // Add the control to the map
    map.addControl(geolocateControlRef.current);

    // Cleanup function
    return () => {
      if (geolocateControlRef.current && map && !map._removed) {
        try {
          map.removeControl(geolocateControlRef.current);
        } catch (error) {
          console.warn('Error removing geolocate control:', error);
        }
      }
    };
  }, [map]);

  return null;
};

export default LocationMarker; 