"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Camera, Eye, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"

export default function SightingPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const searchParams = useSearchParams()

  // Use useMemo to parse vehicle data only when search params change
  const vehicleData = useMemo(() => {
    const vehicleParam = searchParams.get("vehicle")
    if (vehicleParam) {
      try {
        return JSON.parse(decodeURIComponent(vehicleParam))
      } catch (error) {
        console.error("Error parsing vehicle data:", error)
        return null
      }
    }
    return null
  }, [searchParams])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        },
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    alert("Sighting reported successfully! The owner has been notified.")
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/map">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Map
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Report a Sighting</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Alert */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Help Reunite Owners with Their Vehicles</h3>
                <p className="text-blue-800 text-sm mt-1">
                  Your sighting could be the key to recovering a stolen vehicle. Every report helps!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Sighting Details
            </CardTitle>
            <CardDescription>Provide information about the vehicle you spotted.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* License Plate */}
              <div className="space-y-2">
                <Label htmlFor="license-plate">License Plate *</Label>
                <Input
                  id="license-plate"
                  placeholder="ABC-1234"
                  required
                  className="text-lg font-mono"
                  defaultValue={vehicleData?.licensePlate || ""}
                />
                <p className="text-sm text-gray-500">Enter the license plate exactly as you saw it</p>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label>Sighting Location *</Label>
                <div className="flex gap-2">
                  <Input placeholder="Address, intersection, or landmark" className="flex-1" />
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Current
                  </Button>
                </div>
                {location && (
                  <Badge variant="secondary" className="w-fit">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </Badge>
                )}
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sighting-date">Date Seen</Label>
                  <Input id="sighting-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sighting-time">Time Seen</Label>
                  <Input id="sighting-time" type="time" />
                </div>
              </div>

              {/* Vehicle Details (Optional) */}
              <div className="space-y-4">
                <Label>Additional Vehicle Details (Optional)</Label>
                {vehicleData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Pre-filled from theft report</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      {vehicleData.year} {vehicleData.color} {vehicleData.make} {vehicleData.model}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Make (Toyota, Honda...)" defaultValue={vehicleData?.make || ""} />
                  <Input placeholder="Model (Camry, Civic...)" defaultValue={vehicleData?.model || ""} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Color" defaultValue={vehicleData?.color || ""} />
                  <Input placeholder="Year" type="number" defaultValue={vehicleData?.year || ""} />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-4">
                <Label>Photo Evidence (Recommended)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload a photo of the vehicle</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Photos greatly increase the chances of positive identification
                  </p>
                  <Button type="button" variant="outline">
                    Choose Photo
                  </Button>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea
                  id="details"
                  placeholder="Direction of travel, number of occupants, condition of vehicle, or any other relevant details..."
                  rows={4}
                />
              </div>

              {/* Contact (Optional) */}
              <div className="space-y-4">
                <Label>Contact Information (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Your name" />
                  <Input placeholder="Phone number" type="tel" />
                </div>
                <p className="text-sm text-gray-500">
                  In case law enforcement needs to follow up with you about this sighting.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting Sighting..." : "👁️ Submit Sighting Report"}
                </Button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  The vehicle owner and local authorities will be notified immediately.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
