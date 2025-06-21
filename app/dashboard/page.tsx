"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, AlertTriangle, Eye, Bell, MapPin, Clock, Users } from "lucide-react"
import Link from "next/link"

// Mock user data
const mockUserData = {
  name: "John Doe",
  reports: [
    {
      id: 1,
      licensePlate: "ABC-123",
      make: "Toyota",
      model: "Camry",
      status: "active",
      sightings: 3,
      dateReported: "2024-01-15",
      lastSighting: "2 hours ago",
    },
  ],
  sightings: [
    {
      id: 1,
      licensePlate: "XYZ-789",
      location: "Downtown LA",
      dateReported: "2024-01-14",
      status: "verified",
    },
  ],
  alerts: [
    {
      id: 1,
      type: "sighting",
      message: "Your Toyota Camry (ABC-123) was spotted in Beverly Hills",
      time: "30 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "new_theft",
      message: "New theft reported 2 miles from your location",
      time: "2 hours ago",
      read: true,
    },
  ],
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/map">View Map</Link>
            </Button>
            <Button size="sm" asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/report">Report Theft</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {mockUserData.name}</h2>
          <p className="text-gray-600">Here's your CrisisLens activity and alerts.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{mockUserData.reports.length}</p>
                  <p className="text-sm text-gray-600">Active Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{mockUserData.sightings.length}</p>
                  <p className="text-sm text-gray-600">Sightings Reported</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-gray-600">Community Helps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{mockUserData.alerts.filter((a) => !a.read).length}</p>
                  <p className="text-sm text-gray-600">New Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">My Reports</TabsTrigger>
            <TabsTrigger value="sightings">My Sightings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Your Theft Reports</CardTitle>
                <CardDescription>Track the status of your reported stolen vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                {mockUserData.reports.length > 0 ? (
                  <div className="space-y-4">
                    {mockUserData.reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-600">{report.licensePlate}</Badge>
                            <span className="font-semibold">
                              {report.make} {report.model}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {report.sightings} sightings
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Reported: {report.dateReported}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Last sighting: {report.lastSighting}
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            Share Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No theft reports yet</p>
                    <Button asChild>
                      <Link href="/report">Report a Theft</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sightings">
            <Card>
              <CardHeader>
                <CardTitle>Your Community Sightings</CardTitle>
                <CardDescription>Sightings you've reported to help other victims</CardDescription>
              </CardHeader>
              <CardContent>
                {mockUserData.sightings.length > 0 ? (
                  <div className="space-y-4">
                    {mockUserData.sightings.map((sighting) => (
                      <div key={sighting.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{sighting.licensePlate}</Badge>
                            <Badge
                              variant="outline"
                              className={sighting.status === "verified" ? "bg-green-50 text-green-700" : ""}
                            >
                              {sighting.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Location: {sighting.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Reported: {sighting.dateReported}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No sightings reported yet</p>
                    <Button asChild>
                      <Link href="/sighting">Report a Sighting</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Notifications about your reports and local activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUserData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${!alert.read ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        {alert.type === "sighting" ? (
                          <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                        {!alert.read && (
                          <Badge variant="secondary" className="bg-blue-600 text-white">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
