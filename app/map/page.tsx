"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, AlertTriangle, Eye, Search, Filter, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRef, useEffect, useLayoutEffect } from "react"
import mapboxgl from "mapbox-gl"
// import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css"
import StolenMarker from "./stolen-marker"
import SightMarker from "./sighting-marker"
import LocationMarker from "./location-marker"
import { collection, getDocs } from "firebase/firestore"
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
  
  // Handle Firestore Timestamp object
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    // Convert Firestore Timestamp to milliseconds
    timestampMs = timestamp.seconds * 1000;
  } else if (typeof timestamp === 'number') {
    // Handle regular number (milliseconds)
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
  const [mapReady, setMapReady] = useState(false)
  const [theftsData, setTheftsData] = useState<any[]>([])
  const [theftsClusters, setTheftsClusters] = useState<any[]>([])
  const [theftsLocations, setTheftsLocations] = useState<any[]>([])
  const [sightsLocations, setSightsLocations] = useState<any[]>([])
  const [sightings, setSightings] = useState<any[]>([])
  
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"time" | "alphabetical" | "distance">("time")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<any>(null)

  const fetchAllData = async () => {
    try {
      const querySnapshot = await getDocs(theftCollection);
      const querySnapshot2 = await getDocs(sightingCollection);
      const thefts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sights = querySnapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTheftsData(thefts);
      setSightings(sights);
      setTheftsLocations(thefts.map((theft: any) => theft.location));
      setSightsLocations(sights.map((sighting: any) => sighting.location))
      console.log("Fetched thefts locations:", thefts.map((theft: any) => theft.location));
      console.log("Fetched sights locations:", sights.map((sighting: any) => sighting.location));
      console.log("Fetched thefts data:", thefts);
      console.log("Fetched thefts data:", sights);
    } catch (error) {
      console.error("Error fetching fire data:", error);
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
        fuzzySearch(searchQuery, sighting.info?.licemsePlate || '') // Note: typo in original data
      );
    }
    
    // Apply sorting
    return sortData(filtered);
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
        fuzzySearch(searchQuery, sighting.info?.licemsePlate || '') // Note: typo in original data
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

    const sorted = [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "time":
          const timeA = a.info?.date?.seconds || 0;
          const timeB = b.info?.date?.seconds || 0;
          comparison = timeA - timeB;
          break;

        case "alphabetical":
          const plateA = (a.info?.licensePlate || a.info?.licemsePlate || "").toLowerCase();
          const plateB = (b.info?.licensePlate || b.info?.licemsePlate || "").toLowerCase();
          comparison = plateA.localeCompare(plateB);
          break;

        case "distance":
          if (!currentLocation) return 0;
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
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

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

  const reportsContainerRef = useRef<HTMLDivElement>(null)

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
      const selectedCard = document.getElementById(selectedReport.id);
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedReport]);

  const findTheftByLocation = (location: any) => {
    return theftsData.find((report) => {
      const reportLocation = report.location.coordinates;
      return (
        reportLocation.latitude === location.coordinates.latitude &&
        reportLocation.longitude === location.coordinates.longitude
      );
    }
    );
  }

  const findSightingByLocation = (location: any) => {
    return sightings.find((report) => {
      const reportLocation = report.location.coordinates;
      return (
        reportLocation.latitude === location.coordinates.latitude &&
        reportLocation.longitude === location.coordinates.longitude
      );
    }
    );
  }


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
          getFilteredTheftLocations().map((loc, index)  => (
          <StolenMarker
            key={index}
            map={mapRef.current}
            feature={{
              geometry: {
                coordinates: [loc.coordinates.longitude, loc.coordinates.latitude],
              },
              properties:{
                mag: 0
              }
            }}
            onClick={() => {
              console.log("Clicked on marker at location:", loc);
              setSelectedReport(findTheftByLocation(loc))
            }}
          />
        ))
        )}
          {mapRef.current && selectedReport && (
            <Popup
            
              map={mapRef.current}
              coordinates={[
                selectedReport.location.coordinates.longitude,
                selectedReport.location.coordinates.latitude,
              ]}
              licensePlate={selectedReport.info.licensePlate}
              photoUrl={selectedReport.info.photo}
              />)}

        {(mapReady && mapRef.current && getFilteredSightLocations()) && (
(
          getFilteredSightLocations().map((loc, index) => (
            <SightMarker
              key = {index}
              map = {mapRef.current}
              feature = {{
                geometry: {
                  coordinates: [loc.coordinates.longitude, loc.coordinates.latitude],
                },
                properties: {
                  mag: 0
                }
              }}

              onClick={() => {
              console.log("Clicked on marker at location:", loc);
              setSelectedReport(findSightingByLocation(loc))
            }}
            />
          ))
        )
        )}
        {/* Sidebar */}
        <div className="w-80 bg-white border-l overflow-y-auto">
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
                    {getFilteredThefts().length + getFilteredSightings().length} results
                  </span>
                )}
              </div>

              {/* shit i added */}

              {getFilteredThefts().map((data, index) => (
                <Card
                  key = {index}
                  className={`cursor-pointer transition-all duration-200 relative group hover:shadow-md ${
                    selectedReport?.id === data.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  id={data.id}
                  onClick={() => setSelectedReport(data)}
                >
                  <CardHeader className = "pb-2">
                    <div className = "flex items-center justify-between">
                      <Badge 
                        variant = "destructive"
                        className = "bg-red-600"
                      >
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Theft
                        </>
                      </Badge>
                      <span className="text-xs text-gray-500">{formatTimeAgo(data.info.date)}</span> 
                    </div>
                  </CardHeader>
                  <CardContent className = "pt-0">
                    <>
                        <div className="font-semibold">{data.info.licensePlate}</div>
                        <div className="text-sm text-gray-600">
                          {data.info.year} {data.info.color} {data.info.brand} {data.info.model}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {data.location.address}
                        </div>
                      </>
                  </CardContent>

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
                </Card>
              ))}

              {getFilteredSightings().map((data, index) => (
                <Card
                  key = {index}
                  className={`cursor-pointer transition-all duration-200 relative group hover:shadow-md ${
                    selectedReport?.id === data.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  id={data.id}
                  onClick={() => setSelectedReport(data)}
                >
                  <CardHeader className = "pb-2">
                    <div className = "flex items-center justify-between">
                      <Badge
                        variant = "secondary"
                        className = "bg-yellow-600"
                      >
                        <>
                            <Eye className="h-3 w-3 mr-1" />
                            Sighting
                        </>
                      </Badge>
                      <span className="text-xs text-gray-500">{formatTimeAgo(data.info.date)}</span> 
                    </div>
                  </CardHeader>
                  <CardContent className = "pt-0">
                    <>
                        <div className="font-semibold">Sighting: {data.info.licemsePlate}</div>
                        <div className="text-sm text-gray-600">Reported by {data.contact.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {data.location.address}
                        </div>
                      </>
                  </CardContent>
                </Card>
              ))}

              {/* stuff i added ends*/}


              
              {/* {mockReports.map((report) => (
                <Card 
                  key={report.id}
                  className={`cursor-pointer transition-all duration-200 relative group ${
                    selectedReport?.id === report.id ? "ring-2 ring-blue-500" : ""
                  } ${report.type === "theft" ? "hover:shadow-md" : ""}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={report.type === "theft" ? "destructive" : "secondary"}
                        className={report.type === "theft" ? "bg-red-600" : "bg-yellow-600"}
                      >
                        {report.type === "theft" ? (
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
                      </Badge>
                      <span className="text-xs text-gray-500">{report.timeAgo}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {report.type === "theft" ? (
                      <>
                        <div className="font-semibold">{report.licensePlate}</div>
                        <div className="text-sm text-gray-600">
                          {report.year} {report.color} {report.make} {report.model}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {report.location}
                        </div>
                        {report.sightings! > 0 && (
                          <Badge variant="outline" className="mt-2">
                            {report.sightings} sighting{report.sightings !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        
                        <div className="font-semibold">Sighting: {report.licensePlate}</div>
                        <div className="text-sm text-gray-600">Reported by {report.reportedBy}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {report.location}
                        </div>
                      </>
                    )}
                  </CardContent>

                  //Hover Button for Theft Reports

                  {report.type === "theft" && (
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to sighting page with vehicle data
                          const vehicleData = encodeURIComponent(
                            JSON.stringify({
                              licensePlate: report.licensePlate,
                              make: report.make,
                              model: report.model,
                              color: report.color,
                              year: report.year,
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
              ))} */}

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
