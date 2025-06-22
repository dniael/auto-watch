import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";

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
  map: MapboxMap;
  feature: FeatureProps;
  onClick?: () => void;
}

const SightMarker: React.FC<MarkerProps> = ({ map, feature, onClick }) => {
  const { geometry, properties } = feature;
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Create the marker element
    const markerElement = document.createElement("div");
    markerElement.style.width = '2vw';
    markerElement.style.height = '2vw';
    markerElement.style.backgroundImage = 'url(../sightingsymbol.svg)';
    markerElement.style.backgroundSize = 'cover';
    markerElement.style.cursor = 'pointer';
    
    // Create the marker
    markerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat([geometry.coordinates[0], geometry.coordinates[1]])
      .addTo(map);

    // Add click event listener with improved handling
    if (onClick) {
      markerElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Sighting marker clicked');
        onClick();
      });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [geometry.coordinates, map, onClick]);

  return null;
};

export default SightMarker;
