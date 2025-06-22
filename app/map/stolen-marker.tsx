import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface StolenMarkerProps {
  map: mapboxgl.Map;
  theft: any;
  isSelected: boolean;
  isFaded: boolean;
  onClick: () => void;
}

const StolenMarker: React.FC<StolenMarkerProps> = ({ map, theft, isSelected, isFaded, onClick }) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    const { latitude, longitude } = theft.location.coordinates;

    // Create the marker element
    const markerElement = document.createElement("div");
    markerElement.style.width = '2vw';
    markerElement.style.height = '2vw';
    markerElement.style.backgroundImage = 'url(../cartheftsymbol.svg)';
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
  }, [map, theft, isSelected, isFaded, onClick]);

  return null;
};

export default StolenMarker;
