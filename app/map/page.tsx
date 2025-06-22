"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, AlertTriangle, Eye, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRef, useEffect } from "react"
import mapboxgl from "mapbox-gl"
// import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css"
import StolenMarker from "./stolen-marker"
import SightMarker from "./sighting-marker"
import LocationMarker from "./location-marker"
import { collection, getDocs } from "firebase/firestore"
import { theftCollection , sightingCollection } from "@/lib/controller"


// Mock data for demonstration
const mockReports = [
  {
    id: 1,
    type: "theft",
    licensePlate: "ABC-123",
    make: "Toyota",
    model: "Camry",
    color: "White",
    year: 2020,
    location: "North York Centre",
    timeAgo: "2 hours ago",
    sightings: 3,
    lat: 43.7690,
    lng: -79.4120,
  },
  {
    id: 2,
    type: "theft",
    licensePlate: "XYZ-789",
    make: "Honda",
    model: "Civic",
    color: "Black",
    year: 2019,
    location: "Fairview Mall",
    timeAgo: "5 hours ago",
    sightings: 1,
    lat: 43.7765,
    lng: -79.3468,
  },
  {
    id: 3,
    type: "sighting",
    licensePlate: "ABC-123",
    location: "York Mills & Bayview",
    timeAgo: "30 minutes ago",
    reportedBy: "Community Member",
    lat: 43.7466,
    lng: -79.3832,
  },
];

mapboxgl.accessToken = "pk.eyJ1IjoicGxhdGludW1jb3AiLCJhIjoiY21jNXU4bmoyMHR3ZjJsbzR0OWxpNjFkYSJ9.OHvYs3NyOpLGSMj1CMI1xg"

export default function MapPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [theftsData, setTheftsData] = useState<any[]>([])
  const [theftsClusters, setTheftsClusters] = useState<any[]>([])
  const [theftsLocations, setTheftsLocations] = useState<any[]>([])
  const [sightsLocations, setSightsLocations] = useState<any[]>([])
  const [sightings, setSightings] = useState<any[]>([])
  
  const [filter, setFilter] = useState("all")

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


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLng = position.coords.longitude
          const userLat = position.coords.latitude

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
    }
  }
  , [selectedReport]);

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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
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
        {(mapReady && mapRef.current && theftsLocations) &&  (
          theftsLocations.map((loc, index)  => (
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
          />
        ))
        )}

        {(mapReady && mapRef.current && sightsLocations) && (
(
          sightsLocations.map((loc, index) => (
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
            />
          ))
        )
        )}
        {/* Sidebar */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Search by license plate..." />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Recent Reports</h3>

              {/* shit i added */}

              {theftsData.map((data, index) => (
                <Card
                  key = {index}
                  className={`cursor-pointer transition-all duration-200 relative group hover:shadow-md ${
                    selectedReport?.id === data.id ? "ring-2 ring-blue-500" : ""
                  }`}
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
                      <span className="text-xs text-gray-500">{Date.now() - data.info.date} {"hours ago"} </span> 
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

              {sightings.map((data, index) => (
                <Card
                  key = {index}
                  className={`cursor-pointer transition-all duration-200 relative group hover:shadow-md ${
                    selectedReport?.id === data.id ? "ring-2 ring-blue-500" : ""
                  }`}
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
                      <span className="text-xs text-gray-500">{Date.now() - data.info.date} {"hours ago"} </span> 
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
