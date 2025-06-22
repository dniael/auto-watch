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
import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { addSightingMarker } from "@/lib/controller"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const AddressAutofillAny = dynamic(() => import('@mapbox/search-js-react').then(mod => mod.AddressAutofill) as any, {
  ssr: false // Disable server-side rendering for this component
}) as any


export default function SightingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [address, setAddress] = useState("")
  const [addressError, setAddressError] = useState("")

  // Form field states
  const [licensePlate, setLicensePlate] = useState("")
  const [sightingDate, setSightingDate] = useState("")
  const [sightingTime, setSightingTime] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [color, setColor] = useState("")
  const [year, setYear] = useState("")
  const [details, setDetails] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const searchParams = useSearchParams()

  // Ref for debouncing
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Pre-fill form fields with vehicle data from URL parameters
  useEffect(() => {
    if (vehicleData) {
      setLicensePlate(vehicleData.licensePlate || "")
      setMake(vehicleData.make || "")
      setModel(vehicleData.model || "")
      setColor(vehicleData.color || "")
      setYear(vehicleData.year?.toString() || "")
    }
  }, [vehicleData])

  // Forward geocoding function
  const geocodeAddress = async (searchText: string) => {
    if (!searchText.trim()) {
      setAddressError("")
      return
    }

    const accessToken = 'pk.eyJ1IjoicGxhdGludW1jb3AiLCJhIjoiY21jNXU4bmoyMHR3ZjJsbzR0OWxpNjFkYSJ9.OHvYs3NyOpLGSMj1CMI1xg'
    const encodedSearchText = encodeURIComponent(searchText)
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodedSearchText}&access_token=${accessToken}`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates
        const [longitude, latitude] = coordinates
        
        console.log('Geocoded coordinates:', { latitude, longitude })
        
        // Update the location state with the geocoded coordinates
        setLocation({ lat: latitude, lng: longitude })
        setAddressError("") // Clear any previous error
      } else {
        console.log('No coordinates found for address:', searchText)
        setLocation(null)
        setAddressError("Invalid address. Please enter a valid address or use current location.")
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      setLocation(null)
      setAddressError("Error validating address. Please try again or use current location.")
    }
  }

  // Handle address input change with debounced geocoding
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    setAddress(newAddress)
    setAddressError("") // Clear error when user starts typing
    
    // Clear existing timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current)
    }
    
    // Set new timeout for geocoding
    geocodeTimeoutRef.current = setTimeout(() => {
      if (newAddress.trim()) {
        geocodeAddress(newAddress)
      }
    }, 1000) // Wait 1 second after user stops typing
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current)
      }
    }
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setAddressError("") // Clear error when using current location
        },
        (error) => {
          console.error("Error getting location:", error)
          setAddressError("Could not get current location. Please enter a valid address.")
        },
      )
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      setUploadedFiles(prev => [...prev, ...fileArray])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that we have coordinates (either from geocoding or current location)
    if (!location) {
      setAddressError("Please enter a valid address or use current location.")
      return
    }
    
    setIsSubmitting(true)

    // Combine date and time into a single Date object
    let combinedDateTime = new Date()
    if (sightingDate) {
      if (sightingTime) {
        // Combine date and time
        const dateTimeString = `${sightingDate}T${sightingTime}`
        combinedDateTime = new Date(dateTimeString)
      } else {
        // Only date provided, use start of day
        combinedDateTime = new Date(sightingDate)
      }
    }

    // Convert uploaded images to BLOB format
    let photoBlob = ""
    if (uploadedFiles.length > 0) {
      const image = uploadedFiles[0] // Use the first uploaded file
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        photoBlob = reader.result as string
        
        // Create the sighting report data with BLOB image
        const sightingData = {
          contact: {
            name: contactName,
            phone: contactPhone,
            context: details
          },
          info: {
            licensePlate: licensePlate,
            date: combinedDateTime,
            photo: photoBlob
          },
          location: {
            address: address,
            coordinates: {
              latitude: location?.lat || 0,
              longitude: location?.lng || 0
            }
          }
        }
        
        // Submit to Firebase
        addSightingMarker(sightingData)
        console.log('Saved sighting report with photo.')
        
        // Redirect to map page
        toast({
          title: "Sighting Reported",
          description: "The sighting report has been successfully submitted. The owner has been notified."
        })
        router.push('/map')
        setIsSubmitting(false)
      }
      
      reader.readAsDataURL(image)
    } else {
      // No image uploaded, submit without photo
      const sightingData = {
        contact: {
          name: contactName,
          phone: contactPhone,
          context: details
        },
        info: {
          licensePlate: licensePlate,
          date: combinedDateTime,
          photo: ""
        },
        location: {
          address: address,
          coordinates: {
            latitude: location?.lat || 0,
            longitude: location?.lng || 0
          }
        }
      }
      
      // Submit to Firebase
      addSightingMarker(sightingData)
      console.log('Saved sighting report without photo.')
      
      // Redirect to map page
      toast({
        title: "Sighting Reported",
        description: "The sighting report has been successfully submitted. The owner has been notified."
      })
      router.push('/map')
      setIsSubmitting(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Suspense fallback={<div>Loading...</div>}>
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
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
                <p className="text-sm text-gray-500">Enter the license plate exactly as you saw it</p>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label>Sighting Location *</Label>
                <div className="flex gap-2">
                  <AddressAutofillAny
                    accessToken='pk.eyJ1IjoicGxhdGludW1jb3AiLCJhIjoiY21jNXU4bmoyMHR3ZjJsbzR0OWxpNjFkYSJ9.OHvYs3NyOpLGSMj1CMI1xg'
                  >
                    <Input 
                      placeholder="Address, intersection, or landmark" 
                      className="flex-1" 
                      value={address} 
                      onChange={handleAddressChange}
                      autoComplete="address-line1"
                    />
                  </AddressAutofillAny>
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Current
                  </Button>
                </div>
                {addressError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {addressError}
                  </p>
                )}
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
                  <Input 
                    id="sighting-date" 
                    type="date" 
                    value={sightingDate}
                    onChange={(e) => setSightingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sighting-time">Time Seen</Label>
                  <Input 
                    id="sighting-time" 
                    type="time" 
                    value={sightingTime}
                    onChange={(e) => setSightingTime(e.target.value)}
                  />
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
                  <Input 
                    placeholder="Make (Toyota, Honda...)" 
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                  <Input 
                    placeholder="Model (Camry, Civic...)" 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <Input 
                    placeholder="Year" 
                    type="number" 
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
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
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    ref={fileInputRef}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                
                {/* Display uploaded files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files:</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            {file.type.startsWith('image/') ? (
                              <Camera className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Camera className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="details">Additional Details</Label>
                <Textarea
                  id="details"
                  placeholder="Direction of travel, number of occupants, condition of vehicle, or any other relevant details..."
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              {/* Contact (Optional) */}
              <div className="space-y-4">
                <Label>Contact Information (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Your name" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                  <Input 
                    placeholder="Phone number" 
                    type="tel" 
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
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
    </Suspense>
  )
}
