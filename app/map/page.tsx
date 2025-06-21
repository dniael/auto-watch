"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, MapPin, AlertTriangle, Eye, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

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
    location: "Downtown LA",
    timeAgo: "2 hours ago",
    sightings: 3,
    lat: 34.0522,
    lng: -118.2437,
  },
  {
    id: 2,
    type: "theft",
    licensePlate: "XYZ-789",
    make: "Honda",
    model: "Civic",
    color: "Black",
    year: 2019,
    location: "Hollywood",
    timeAgo: "5 hours ago",
    sightings: 1,
    lat: 34.0928,
    lng: -118.3287,
  },
  {
    id: 3,
    type: "sighting",
    licensePlate: "ABC-123",
    location: "Beverly Hills",
    timeAgo: "30 minutes ago",
    reportedBy: "Community Member",
    lat: 34.0736,
    lng: -118.4004,
  },
]

export default function MapPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [filter, setFilter] = useState("all")

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
        <div className="flex-1 relative bg-gray-200">
          {/* Placeholder for map */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
              <p className="text-gray-600 mb-4">Real-time theft reports and community sightings</p>
              <div className="flex gap-4 justify-center">
                <Badge className="bg-red-600">🚨 Theft Reports</Badge>
                <Badge className="bg-yellow-600">👁️ Community Sightings</Badge>
              </div>
            </div>
          </div>

          {/* Map pins overlay (simulated) */}
          <div className="absolute inset-0 pointer-events-none">
            {mockReports.map((report, index) => (
              <div
                key={report.id}
                className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer pointer-events-auto ${
                  report.type === "theft" ? "bg-red-600" : "bg-yellow-500"
                }`}
                style={{
                  left: `${20 + index * 15}%`,
                  top: `${30 + index * 10}%`,
                }}
                onClick={() => setSelectedReport(report)}
              >
                {report.type === "theft" ? (
                  <AlertTriangle className="h-3 w-3 text-white m-0.5" />
                ) : (
                  <Eye className="h-3 w-3 text-white m-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Search by license plate..." />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Recent Reports</h3>

              {mockReports.map((report) => (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-colors ${
                    selectedReport?.id === report.id ? "ring-2 ring-blue-500" : ""
                  }`}
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
                        {report.sightings > 0 && (
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
                </Card>
              ))}
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
