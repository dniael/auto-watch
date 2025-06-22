import { useEffect, useRef } from "react";
import mapboxgl, { Map as MapboxMap } from "mapbox-gl";
import {createPortal} from "react-dom"

interface FeatureGeometry {
  coordinates: [number, number]; // [longitude, latitude]
}

type FeatureProps ={
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
}

const SightMarker: React.FC<MarkerProps> = ({ map, feature }) => {
  const { geometry, properties } = feature;
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const contentRef = useRef(document.createElement("div"));

  useEffect(() => {
    markerRef.current = new mapboxgl.Marker(contentRef.current)
      .setLngLat([geometry.coordinates[0], geometry.coordinates[1]])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
    };
  }, [geometry.coordinates, map]);

  return (
        <>
            {createPortal(
                <div
                    style={{
                        width: '2vw',
                        height: '2vw',
                        backgroundImage: 'url(../sightingsymbol.svg)',
                        backgroundSize: 'cover',
                        position: 'static'
                    }}
                >
                </div>,
                contentRef.current
            )}
        </>
    );
};

export default SightMarker;
