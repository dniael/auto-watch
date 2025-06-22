"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, AlertTriangle, Eye, Search, Filter, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState, useCallback } from "react"
import { useRef, useEffect, useLayoutEffect } from "react"
import mapboxgl from "mapbox-gl"
// import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css"
import StolenMarker from "./stolen-marker"
import SightMarker from "./sighting-marker"
import LocationMarker from "./location-marker"
import { collection, getDocs, Timestamp } from "firebase/firestore"
import { theftCollection , sightingCollection } from "@/lib/controller"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Popup from "./popup"


mapboxgl.accessToken = "pk.eyJ1IjoicGxhdGludW1jb3AiLCJhIjoiY21jNXU4bmoyMHR3ZjJsbzR0OWxpNjFkYSJ9.OHvYs3NyOpLGSMj1CMI1xg"

// Utility function to format time difference
const formatTimeAgo = (timestamp: any): string => {
  let timestampMs: number;
  
  // Handle different date formats from Firestore
  if (timestamp instanceof Timestamp) {
    // Firestore Timestamp object
    timestampMs = timestamp.toDate().getTime();
  } else if (timestamp?.seconds) {
    // Firestore Timestamp object with seconds
    timestampMs = timestamp.seconds * 1000;
  } else if (timestamp?.toDate) {
    // Firestore Timestamp object with toDate method
    timestampMs = timestamp.toDate().getTime();
  } else if (timestamp instanceof Date) {
    // JavaScript Date object
    timestampMs = timestamp.getTime();
  } else if (typeof timestamp === 'number') {
    // Already in milliseconds
    timestampMs = timestamp;
  } else {
    console.warn('Unknown timestamp format:', timestamp);
    return 'Unknown time';
  }
  
  const now = Date.now();
  const diffInMs = now - timestampMs;
  
  // Debug logging
  console.log('Timestamp object:', timestamp, 'Converted to ms:', timestampMs, 'Now:', now, 'Difference (ms):', diffInMs);
  console.log('Timestamp date:', new Date(timestampMs), 'Current date:', new Date(now));
  
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
};

export default function MapPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [selectedLicensePlate, setSelectedLicensePlate] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false)
  const [theftsData, setTheftsData] = useState<any[]>([])
  const [theftsClusters, setTheftsClusters] = useState<any[]>([])
  const [theftsLocations, setTheftsLocations] = useState<any[]>([])
  const [sightsLocations, setSightsLocations] = useState<any[]>([])
  const [sightings, setSightings] = useState<any[]>([])
  const [selectionCounter, setSelectionCounter] = useState(0)
  
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"time" | "alphabetical" | "distance">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const reportsContainerRef = useRef<HTMLDivElement>(null)
  const lineCoordsRef = useRef<string | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(theftCollection);
      const querySnapshot2 = await getDocs(sightingCollection);
      const thefts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sights = querySnapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      console.log("Raw thefts data from Firestore:", thefts);
      console.log("Raw sights data from Firestore:", sights);
      
      // Log detailed info about date fields
      thefts.forEach((theft: any, index) => {
        console.log(`Theft ${index} date info:`, {
          date: theft.info?.date,
          dateType: typeof theft.info?.date,
          hasSeconds: !!theft.info?.date?.seconds,
          hasToDate: !!theft.info?.date?.toDate,
          isDate: theft.info?.date instanceof Date,
          dateKeys: theft.info?.date ? Object.keys(theft.info.date) : 'no date'
        });
      });
      
      sights.forEach((sighting: any, index) => {
        console.log(`Sighting ${index} date info:`, {
          date: sighting.info?.date,
          dateType: typeof sighting.info?.date,
          hasSeconds: !!sighting.info?.date?.seconds,
          hasToDate: !!sighting.info?.date?.toDate,
          isDate: sighting.info?.date instanceof Date,
          dateKeys: sighting.info?.date ? Object.keys(sighting.info.date) : 'no date'
        });
      });
      
      setTheftsData(thefts);
      setSightings(sights);
      setTheftsLocations(thefts.map((theft: any) => theft.location));
      setSightsLocations(sights.map((sighting: any) => sighting.location))
      console.log("Fetched thefts locations:", thefts.map((theft: any) => theft.location));
      console.log("Fetched sights locations:", sights.map((sighting: any) => sighting.location));
      console.log("Fetched thefts data:", thefts);
      console.log("Fetched sights data:", sights);
    } catch (error) {
      console.error("Error fetching fire data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fuzzy search function
  const fuzzySearch = (query: string, text: string): boolean => {
    if (!query) return true;
    const normalizedQuery = query.toLowerCase().replace(/\s/g, '');
    const normalizedText = text.toLowerCase().replace(/\s/g, '');
    
    // Simple fuzzy search - check if query characters appear in order in text
    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === normalizedQuery.length;
  };

  // Filter data based on selected filter and search query
  const getFilteredThefts = () => {
    let filtered = theftsData;
    
    // Apply type filter
    if (filter === "sightings") {
      return [];
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((theft: any) => 
        fuzzySearch(searchQuery, theft.info?.licensePlate || '')
      );
    }
    
    // Apply sorting
    return sortData(filtered);
  };

  const getFilteredSightings = () => {
    let filtered = sightings;
    
    // Apply type filter
    if (filter === "thefts") {
      return [];
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((sighting: any) => 
        fuzzySearch(searchQuery, sighting.info?.licensePlate || '')
      );
    }
    
    // Apply sorting
    return sortData(filtered);
  };

  // Get unified sorted list of all reports (thefts + sightings)
  const getAllFilteredReports = () => {
    let allReports: any[] = [];
    
    // Add thefts with type indicator
    const filteredThefts = getFilteredThefts().map((theft: any) => ({
      ...theft,
      reportType: 'theft'
    }));
    
    // Add sightings with type indicator
    const filteredSightings = getFilteredSightings().map((sighting: any) => ({
      ...sighting,
      reportType: 'sighting'
    }));
    
    // Combine both arrays
    allReports = [...filteredThefts, ...filteredSightings];
    
    // Sort the combined array
    return sortData(allReports);
  };

  const getFilteredTheftLocations = () => {
    if (filter === "sightings") {
      return [];
    }
    
    if (searchQuery) {
      const filteredThefts = theftsData.filter((theft: any) => 
        fuzzySearch(searchQuery, theft.info?.licensePlate || '')
      );
      return filteredThefts.map((theft: any) => theft.location);
    }
    
    return theftsLocations;
  };

  const getFilteredSightLocations = () => {
    if (filter === "thefts") {
      return [];
    }
    
    if (searchQuery) {
      const filteredSightings = sightings.filter((sighting: any) => 
        fuzzySearch(searchQuery, sighting.info?.licensePlate || '')
      );
      return filteredSightings.map((sighting: any) => sighting.location);
    }
    
    return sightsLocations;
  };

  // Get filter display text
  const getFilterText = () => {
    switch (filter) {
      case "thefts":
        return "Thefts Only";
      case "sightings":
        return "Sightings Only";
      default:
        return "All Reports";
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Sort data based on selected criteria
  const sortData = (data: any[]): any[] => {
    if (!data.length) return data;

    console.log('Sorting data:', { sortBy, sortOrder, dataLength: data.length });
    console.log('Sample data item:', data[0]);

    const sorted = [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "time":
          // Handle different date formats from Firestore
          let timeA = 0;
          let timeB = 0;
          
          console.log('Sorting by time - Item A date:', a.info?.date);
          console.log('Sorting by time - Item B date:', b.info?.date);
          
          // Handle Firestore Timestamp objects
          if (a.info?.date instanceof Timestamp) {
            timeA = a.info.date.toDate().getTime(); // Convert Firestore Timestamp to milliseconds
            console.log('Item A: Using Firestore Timestamp, timeA:', timeA);
          } else if (a.info?.date?.seconds) {
            timeA = a.info.date.seconds * 1000; // Convert to milliseconds
            console.log('Item A: Using seconds format, timeA:', timeA);
          } else if (a.info?.date?.toDate) {
            timeA = a.info.date.toDate().getTime(); // Convert Firestore Timestamp to milliseconds
            console.log('Item A: Using toDate format, timeA:', timeA);
          } else if (a.info?.date instanceof Date) {
            timeA = a.info.date.getTime(); // JavaScript Date object
            console.log('Item A: Using Date object, timeA:', timeA);
          } else if (typeof a.info?.date === 'number') {
            timeA = a.info.date; // Already in milliseconds
            console.log('Item A: Using number format, timeA:', timeA);
          } else {
            console.log('Item A: No valid date found, using 0');
          }
          
          if (b.info?.date instanceof Timestamp) {
            timeB = b.info.date.toDate().getTime(); // Convert Firestore Timestamp to milliseconds
            console.log('Item B: Using Firestore Timestamp, timeB:', timeB);
          } else if (b.info?.date?.seconds) {
            timeB = b.info.date.seconds * 1000; // Convert to milliseconds
            console.log('Item B: Using seconds format, timeB:', timeB);
          } else if (b.info?.date?.toDate) {
            timeB = b.info.date.toDate().getTime(); // Convert Firestore Timestamp to milliseconds
            console.log('Item B: Using toDate format, timeB:', timeB);
          } else if (b.info?.date instanceof Date) {
            timeB = b.info.date.getTime(); // JavaScript Date object
            console.log('Item B: Using Date object, timeB:', timeB);
          } else if (typeof b.info?.date === 'number') {
            timeB = b.info.date; // Already in milliseconds
            console.log('Item B: Using number format, timeB:', timeB);
          } else {
            console.log('Item B: No valid date found, using 0');
          }
          
          comparison = timeA - timeB;
          console.log('Time comparison:', { timeA, timeB, comparison });
          break;

        case "alphabetical":
          const plateA = (a.info?.licensePlate || "").toLowerCase();
          const plateB = (b.info?.licensePlate || "").toLowerCase();
          comparison = plateA.localeCompare(plateB);
          console.log('Alphabetical comparison:', { plateA, plateB, comparison });
          break;

        case "distance":
          if (!currentLocation) {
            console.log('No current location for distance sorting');
            return 0;
          }
          const [userLng, userLat] = currentLocation;
          
          const distA = calculateDistance(
            userLat, userLng,
            a.location.coordinates.latitude,
            a.location.coordinates.longitude
          );
          const distB = calculateDistance(
            userLat, userLng,
            b.location.coordinates.latitude,
            b.location.coordinates.longitude
          );
          comparison = distA - distB;
          console.log('Distance comparison:', { distA, distB, comparison });
          break;
      }

      const finalComparison = sortOrder === "asc" ? comparison : -comparison;
      console.log('Final comparison:', { comparison, sortOrder, finalComparison });
      return finalComparison;
    });

    console.log('Sorted data:', sorted);
    return sorted;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLng = position.coords.longitude
          const userLat = position.coords.latitude
          setCurrentLocation([userLng, userLat])

          // Double-check container exists before creating map
          if (!mapContainerRef.current) {
            console.error("Map container not available when creating map");
            return;
          }

          try {
            mapRef.current = new mapboxgl.Map({
              container: mapContainerRef.current,
              center: [userLng, userLat],
              zoom: 15,
              minZoom: 10,
              style: "mapbox://styles/mapbox/streets-v11",
            })

            mapRef.current.on("load", () => {
              fetchAllData() // Fetch thefts data when map loads
              setMapReady(true) // Enable marker once map is loaded
            })
          } catch (error) {
            console.error("Error creating map:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error)

          // Double-check container exists before creating map
          if (!mapContainerRef.current) {
            console.error("Map container not available when creating map (fallback)");
            return;
          }

          try {
            mapRef.current = new mapboxgl.Map({
              container: mapContainerRef.current,
              center: [-79.3755984780575, 43.74082538389782],
              zoom: 15,
              minZoom: 10,
              style: "mapbox://styles/mapbox/streets-v11",
            })

            mapRef.current.on("load", () => {
              fetchAllData() // Fetch thefts data when map loads
              setMapReady(true) // Enable marker once map is loaded
            })
          } catch (error) {
            console.error("Error creating map (fallback):", error);
          }
        },
        { enableHighAccuracy: true },
      )
    } else {
      // Fallback for browsers without geolocation
      if (!mapContainerRef.current) {
        console.error("Map container not available");
        return;
      }

      try {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          center: [-79.3755984780575, 43.74082538389782],
          zoom: 15,
          minZoom: 10,
          style: "mapbox://styles/mapbox/streets-v11",
        })

        mapRef.current.on("load", () => {
          fetchAllData() // Fetch thefts data when map loads
          setMapReady(true) // Enable marker once map is loaded
        })
      } catch (error) {
        console.error("Error creating map (no geolocation):", error);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    // Update map center when selected report changes
    if (selectedReport && mapRef.current) {
      const { latitude, longitude } = selectedReport.location.coordinates;
      if (isNaN(latitude) || isNaN(longitude)) return;
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true, // This ensures the animation is not interrupted
      });
      //scroll sidebar to selected report
    
    }
  }
  , [selectedReport]);

  useLayoutEffect(() => {
    // Scroll to selected report in sidebar
    if (selectedReport && reportsContainerRef.current) {
      console.log("Attempting to scroll to report:", selectedReport.id);
      
      // Add a small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const selectedCard = document.getElementById(selectedReport.id);
        if (selectedCard) {
          console.log("Found card, scrolling to it");
          selectedCard.scrollIntoView({ 
            behavior: "smooth", 
            block: "center",
            inline: "nearest"
          });
        } else {
          console.log("Card not found in DOM");
        }
      }, 50); // Small delay to ensure DOM is updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedReport]);

  const findTheftByLocation = (location: any) => {
    console.log("Searching for theft at location:", location);
    console.log("Available thefts:", theftsData.length);
    
    const found = theftsData.find((report) => {
      const reportLocation = report.location?.coordinates;
      if (!reportLocation) {
        console.warn("Report missing location coordinates:", report);
        return false;
      }
      
      // Use exact matching for now to debug
      const latMatch = reportLocation.latitude === location.coordinates.latitude;
      const lngMatch = reportLocation.longitude === location.coordinates.longitude;
      
      console.log("Comparing:", {
        reportLat: reportLocation.latitude,
        reportLng: reportLocation.longitude,
        clickLat: location.coordinates.latitude,
        clickLng: location.coordinates.longitude,
        latMatch,
        lngMatch,
        licensePlate: report.info?.licensePlate
      });
      
      return latMatch && lngMatch;
    });
    
    console.log("Found theft:", found);
    return found;
  }

  const findSightingByLocation = (location: any) => {
    console.log("Searching for sighting at location:", location);
    console.log("Available sightings:", sightings.length);
    
    const found = sightings.find((report) => {
      const reportLocation = report.location?.coordinates;
      if (!reportLocation) {
        console.warn("Report missing location coordinates:", report);
        return false;
      }
      
      // Use exact matching for now to debug
      const latMatch = reportLocation.latitude === location.coordinates.latitude;
      const lngMatch = reportLocation.longitude === location.coordinates.longitude;
      
      console.log("Comparing:", {
        reportLat: reportLocation.latitude,
        reportLng: reportLocation.longitude,
        clickLat: location.coordinates.latitude,
        clickLng: location.coordinates.longitude,
        latMatch,
        lngMatch,
        licensePlate: report.info?.licensePlate
      });
      
      return latMatch && lngMatch;
    });
    
    console.log("Found sighting:", found);
    return found;
  }

  // Handle popup close
  const handlePopupClose = () => {
    console.log("Popup close triggered")
    setSelectedReport(null)
    setSelectedLicensePlate(null);
  }

  // When a report card is clicked in the sidebar
  const selectReport = (report: any, reportType: 'theft' | 'sighting') => {
    if (!report) {
      console.log('Clearing selection');
      setSelectedReport(null);
      setSelectedLicensePlate(null);
      return;
    }

    const licensePlate = report.info?.licensePlate;
    console.log(`Report selected. Type: ${reportType}, Report:`, report);
    console.log(`License Plate: ${licensePlate}`);
    
    // Set the selected report with its type
    setSelectedReport({ ...report, reportType });
    setSelectedLicensePlate(licensePlate);

    setSelectionCounter(prev => prev + 1);

    if (mapRef.current && report.location?.coordinates) {
      const { latitude, longitude } = report.location.coordinates;
      if (latitude && longitude) {
        console.log(`Flying to [${longitude}, ${latitude}]`);
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          essential: true,
        });
      }
    } else {
      console.log('Map or coordinates not available for flying.');
    }
  };

  // Separate effect for line creation/removal
  useEffect(() => {
    if (mapRef.current && selectedLicensePlate) {
      // Find the original theft report
      const theftReport = theftsData.find(theft => theft.info?.licensePlate === selectedLicensePlate);
      
      // Find all related sightings
      const relatedSightings = sightings.filter(sighting => sighting.info?.licensePlate === selectedLicensePlate);

      if (theftReport && relatedSightings.length > 0) {
        const theftCoordinates = [
          theftReport.location.coordinates.longitude,
          theftReport.location.coordinates.latitude
        ];

        const lineFeatures = relatedSightings.map(sighting => {
          const sightingCoordinates = [
            sighting.location.coordinates.longitude,
            sighting.location.coordinates.latitude
          ];
          return {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [theftCoordinates, sightingCoordinates]
            }
          } as GeoJSON.Feature<GeoJSON.LineString>;
        });

        const lineData: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
          type: "FeatureCollection",
          features: lineFeatures
        };
        
        const coordsString = JSON.stringify(lineData.features.map(f => f.geometry.coordinates));

        // Only update data if coordinates have changed
        if (coordsString !== lineCoordsRef.current) {
          lineCoordsRef.current = coordsString;

          const source = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData(lineData);
          } else {
            mapRef.current.addSource('route', {
              type: 'geojson',
              data: lineData
            });

            mapRef.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#ff5733',
                'line-width': 3,
                'line-opacity': 0.9,
                'line-dasharray': [2, 2] // Static dashed line
              }
            });
          }
        }
      } else {
        // if no theft report or no sightings, clear the line
        if (mapRef.current && mapRef.current.getSource('route')) {
            mapRef.current.removeLayer('route');
            mapRef.current.removeSource('route');
        }
        lineCoordsRef.current = null;
      }
    } else {
      // Clear line if no license plate is selected
      if (mapRef.current && mapRef.current.getSource('route')) {
        mapRef.current.removeLayer('route');
        mapRef.current.removeSource('route');
      }
      lineCoordsRef.current = null;
    }
  }, [selectedLicensePlate, theftsData, sightings, mapReady]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // No animation frame to cancel, just in case
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Live Theft Map</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {getFilterText()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter("all")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    All Reports
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("thefts")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Thefts Only
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("sightings")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Sightings Only
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {sortBy === "time" ? "⏰" : sortBy === "alphabetical" ? "🔤" : "📍"}
                    </span>
                    <span className="font-medium">
                      {sortBy === "time" ? "Time" : sortBy === "alphabetical" ? "License" : "Distance"}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Sort by
                </div>
                <DropdownMenuItem 
                  onClick={() => setSortBy("time")}
                  className={`flex items-center gap-3 px-3 py-2.5 ${sortBy === "time" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">⏰</span>
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-xs text-gray-500">Most recent first</div>
                    </div>
                  </div>
                  {sortBy === "time" && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">
                        {sortOrder === "desc" ? "Newest" : "Oldest"}
                      </span>
                      <span className="text-lg">{sortOrder === "desc" ? "↓" : "↑"}</span>
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("alphabetical")}
                  className={`flex items-center gap-3 px-3 py-2.5 ${sortBy === "alphabetical" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">🔤</span>
                    <div>
                      <div className="font-medium">License Plate</div>
                      <div className="text-xs text-gray-500">A-Z order</div>
                    </div>
                  </div>
                  {sortBy === "alphabetical" && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">
                        {sortOrder === "asc" ? "A-Z" : "Z-A"}
                      </span>
                      <span className="text-lg">{sortOrder === "asc" ? "↓" : "↑"}</span>
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("distance")}
                  className={`flex items-center gap-3 px-3 py-2.5 ${sortBy === "distance" ? "bg-blue-50 text-blue-700" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">📍</span>
                    <div>
                      <div className="font-medium">Distance</div>
                      <div className="text-xs text-gray-500">Nearest first</div>
                    </div>
                  </div>
                  {sortBy === "distance" && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">
                        {sortOrder === "asc" ? "Nearest" : "Farthest"}
                      </span>
                      <span className="text-lg">{sortOrder === "asc" ? "↓" : "↑"}</span>
                    </div>
                  )}
                </DropdownMenuItem>
                <div className="border-t border-gray-100 my-1"></div>
                <DropdownMenuItem 
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">🔄</span>
                    <div>
                      <div className="font-medium">Reverse Order</div>
                      <div className="text-xs text-gray-500">Flip current sort</div>
                    </div>
                  </div>
                  <span className="text-lg font-medium">
                    {sortOrder === "asc" ? "↓" : "↑"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button size="sm" asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/report">Report Theft</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Map Area */}
        <div className="flex-1 relative bg-gray-200" ref={mapContainerRef} />
        {mapReady && mapRef.current && (<LocationMarker map={mapRef.current} />)}
        {(mapReady && mapRef.current && getFilteredTheftLocations()) &&  (
          getFilteredTheftLocations().map((location, index) => {
            const theft = findTheftByLocation(location)
            if (!theft || !mapRef.current) return null
            const isSelected = selectedReport?.id === theft.id;
            const isFaded = !!(selectedLicensePlate && selectedLicensePlate !== theft.info.licensePlate);

            console.log('Rendering theft marker:', theft.id, theft.info.licensePlate, location);

            return (
              <StolenMarker
                key={`theft-${theft.id}`}
                map={mapRef.current}
                theft={theft}
                isSelected={isSelected}
                isFaded={isFaded}
                onClick={() => selectReport(theft, 'theft')}
              />
            )
          })
        )}
        
        {/* Popup - Only render when we have a selected report and map is ready */}
        {mapReady && mapRef.current && selectedReport && (
          <Popup
            key={`popup-${selectedReport.id}-${selectedReport.reportType}-${selectionCounter}`}
            map={mapRef.current}
            coordinates={[
              selectedReport.location.coordinates.longitude,
              selectedReport.location.coordinates.latitude,
            ]}
            reportData={selectedReport}
            onClose={handlePopupClose}
          />
        )}

        {(mapReady && mapRef.current && getFilteredSightLocations()) && (
          getFilteredSightLocations().map((location, index) => {
            const sighting = findSightingByLocation(location)
            if (!sighting || !mapRef.current) return null
            const isSelected = selectedReport?.id === sighting.id;
            const isFaded = !!(selectedLicensePlate && selectedLicensePlate !== sighting.info.licensePlate);
            
            console.log('Rendering sighting marker:', sighting.id, sighting.info.licensePlate, location);

            return (
              <SightMarker
                key={`sighting-${sighting.id}`}
                map={mapRef.current}
                sighting={sighting}
                isSelected={isSelected}
                isFaded={isFaded}
                onClick={() => selectReport(sighting, 'sighting')}
              />
            )
          })
        )}
        {/* Sidebar */}
        <div className="w-96 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by license plate..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  // focus the input when typing
                  e.target.focus()                  
                }}
              />
            </div>

            <div className="space-y-4 w-50" ref={reportsContainerRef}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Recent Reports</h3>
                {searchQuery && (
                  <span className="text-xs text-gray-500">
                    {getAllFilteredReports().length} results
                  </span>
                )}
              </div>

              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* All Reports */}
                  {getAllFilteredReports().map((data, index) => (
                    <Card
                      key={`${data.id}-${data.reportType}`}
                      id={data.id}
                      className={`cursor-pointer transition-all duration-200 relative group hover:shadow-md ${
                        selectedReport?.id === data.id && selectedReport?.reportType === data.reportType 
                          ? "ring-2 ring-blue-500 bg-blue-50" 
                          : ""
                      }`}
                      onClick={() => {
                        console.log("Card clicked:", data);
                        console.log("Current selectedReport:", selectedReport);
                        console.log("Comparison:", {
                          selectedId: selectedReport?.id,
                          dataId: data.id,
                          selectedType: selectedReport?.reportType,
                          dataType: data.reportType,
                          idMatch: selectedReport?.id === data.id,
                          typeMatch: selectedReport?.reportType === data.reportType
                        });
                        selectReport(data, data.reportType as 'theft' | 'sighting');
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={data.reportType === 'theft' ? "destructive" : "secondary"}
                            className={data.reportType === 'theft' ? "bg-red-600" : "bg-yellow-600"}
                          >
                            <>
                              {data.reportType === 'theft' ? (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Theft
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Sighting
                                </>
                              )}
                            </>
                          </Badge>
                          <span className="text-xs text-gray-500">{formatTimeAgo(data.info.date)}</span> 
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <>
                          <div className="font-semibold">
                            {data.reportType === 'sighting' ? 'Sighting: ' : ''}{data.info.licensePlate}
                          </div>
                          <div className="text-sm text-gray-600">
                            {data.reportType === 'theft' ? (
                              <>
                                {data.info.year} {data.info.color} {data.info.brand} {data.info.model}
                              </>
                            ) : (
                              <>
                                Reported by {data.contact.name}
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {data.location.address}
                          </div>
                        </>
                      </CardContent>

                      {data.reportType === 'theft' && (
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Navigate to sighting page with vehicle data
                              const vehicleData = encodeURIComponent(
                                JSON.stringify({
                                  licensePlate: data.info.licensePlate,
                                  make: data.info.brand,
                                  model: data.info.model,
                                  color: data.info.color,
                                  year: data.info.year,
                                }),
                              )
                              window.location.href = `/sighting?vehicle=${vehicleData}`
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />I Saw This Car
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}

                  {/* No results message */}
                  {!isLoading && getAllFilteredReports().length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">
                        {searchQuery ? "No reports found matching your search." : "No reports available."}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/sighting">
                  <Eye className="h-4 w-4 mr-2" />
                  Report a Sighting
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
