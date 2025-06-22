import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface FeatureGeometry {
  coordinates: [number, number]; // [longitude, latitude]
}

type FeatureProps = {
    geometry:{
        coordinates: [number, number];
    };
    properties:{
        mag: string | number;
    }
}

interface MarkerProps {
  map: mapboxgl.Map;
  feature: FeatureProps;
  onClick?: () => void;
}

interface SightMarkerProps {
  map: mapboxgl.Map;
  sighting: any;
  isSelected: boolean;
  isFaded: boolean;
  onClick: () => void;
}

const SightMarker: React.FC<SightMarkerProps> = ({ map, sighting, isSelected, isFaded, onClick }) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const { latitude, longitude } = sighting.location.coordinates;

    // Create the marker element
    const markerElement = document.createElement("div");
    markerElement.style.width = '2vw';
    markerElement.style.height = '2vw';
    markerElement.style.backgroundImage = 'url(../sightingsymbol.svg)';
    markerElement.style.backgroundSize = 'cover';
    markerElement.style.cursor = 'pointer';
    markerElement.style.opacity = isFaded ? '0.3' : '1';
    markerElement.style.transform = isSelected ? 'scale(1.25)' : 'scale(1)';

    // Create the marker
    markerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([longitude, latitude])
      .addTo(map);

    // Add click event listener
    if (onClick) {
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, sighting, isSelected, isFaded, onClick]);

  return null;
};

export default SightMarker;
