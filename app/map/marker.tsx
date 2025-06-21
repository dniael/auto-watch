import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";

interface FeatureGeometry {
  coordinates: [number, number]; // [longitude, latitude]
}

interface Feature {
  geometry: FeatureGeometry;
}

interface MarkerProps {
  map: MapboxMap;
  feature: Feature;
}

const Marker: React.FC<MarkerProps> = ({ map, feature }) => {
  const { geometry } = feature;
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    markerRef.current = new mapboxgl.Marker()
      .setLngLat([geometry.coordinates[0], geometry.coordinates[1]])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
    };
  }, [geometry.coordinates, map]);

  return null;
};

export default Marker;
