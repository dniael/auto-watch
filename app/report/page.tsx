"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowLeft, MapPin, Upload, X, Camera, Video } from "lucide-react"
import { AddressAutofill } from '@mapbox/search-js-react'
import { addTheftMarker } from '@/lib/controller'
import { useToast } from "@/hooks/use-toast"

const AddressAutofillAny = AddressAutofill as any;

// Firebase Database Type Definition
type TheftReport = {
  Contact: {
    Name: string
    Phone: string
    Context: string
  }
  Info: {
    Brand: string
    Color: string
    Date: Date
    LicensePlate: string
    Model: string
    PlateProvince: string
    Type: string
    Year: number
    Photo: string
  }
  location: {
    Address: string
    Coordinates: {
      latitude: number
      longitude: number
    }
  }
}

export default function ReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addressError, setAddressError] = useState("")

  // Form field states
  const [licensePlate, setLicensePlate] = useState("")
  const [state, setState] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [color, setColor] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [address, setAddress] = useState("")
  const [theftDate, setTheftDate] = useState("")
  const [theftTime, setTheftTime] = useState("")
  const [details, setDetails] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Ref for debouncing
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    if (theftDate) {
      if (theftTime) {
        // Combine date and time
        const dateTimeString = `${theftDate}T${theftTime}`
        combinedDateTime = new Date(dateTimeString)
      } else {
        // Only date provided, use start of day
        combinedDateTime = new Date(theftDate)
      }
    }

    // Convert uploaded images to BLOB format
    let photoBlob = ""
    if (uploadedFiles.length > 0) {
      const image = uploadedFiles[0] // Use the first uploaded file
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        photoBlob = reader.result as string
        
        // Create the theft report data with BLOB image
        const theftData = {
          contact: {
            name: contactName,
            phone: contactPhone,
            context: details
          },
          info: {
            brand: make,
            color: color,
            date: combinedDateTime,
            licensePlate: licensePlate,
            model: model,
            plateProvince: state,
            type: vehicleType,
            year: year ? parseInt(year) : 0,
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
        addTheftMarker(theftData)
        console.log('Saved theft report with photo.')
        
        // Redirect to map page
        toast({
          title: "Report submitted successfully!",
          description: "The community has been alerted."
        })
        router.push('/map')
        setIsSubmitting(false)
      }
      
      reader.readAsDataURL(image)
    } else {
      // No image uploaded, submit without photo
      const theftData = {
        contact: {
          name: contactName,
          phone: contactPhone,
          context: details
        },
        info: {
          brand: make,
          color: color,
          date: combinedDateTime,
          licensePlate: licensePlate,
          model: model,
          plateProvince: state,
          type: vehicleType,
          year: year ? parseInt(year) : 0,
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
      addTheftMarker(theftData)
      console.log('Saved theft report without photo.')
      
      // Redirect to map page
      toast({
        title: "Report submitted successfully!",
        description: "The community has been alerted."
      })
      router.push('/map')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h1 className="text-xl font-semibold">Report Stolen Vehicle</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Vehicle Information
            </CardTitle>
            <CardDescription>
              Provide as much detail as possible to help the community identify your vehicle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-plate">License Plate *</Label>
                  <Input 
                    id="license-plate" 
                    placeholder="ABC-1234" 
                    required 
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ab">Alberta</SelectItem>
                      <SelectItem value="bc">British Columbia</SelectItem>
                      <SelectItem value="mb">Manitoba</SelectItem>
                      <SelectItem value="nb">New Brunswick</SelectItem>
                      <SelectItem value="nl">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="ns">Nova Scotia</SelectItem>
                      <SelectItem value="nt">Northwest Territories</SelectItem>
                      <SelectItem value="nu">Nunavut</SelectItem>
                      <SelectItem value="on">Ontario</SelectItem>
                      <SelectItem value="pe">Prince Edward Island</SelectItem>
                      <SelectItem value="qc">Quebec</SelectItem>
                      <SelectItem value="sk">Saskatchewan</SelectItem>
                      <SelectItem value="yt">Yukon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input 
                    id="make" 
                    placeholder="Toyota, Honda, Ford..." 
                    required 
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input 
                    id="model" 
                    placeholder="Camry, Civic, F-150..." 
                    required 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year" 
                    placeholder="2020" 
                    type="number" 
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="coupe">Coupe</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label>Last Known Location *</Label>
                <div className="flex gap-2 w-full">
                  <AddressAutofillAny
                    accessToken='pk.eyJ1IjoicGxhdGludW1jb3AiLCJhIjoiY21jNXU4bmoyMHR3ZjJsbzR0OWxpNjFkYSJ9.OHvYs3NyOpLGSMj1CMI1xg'
                  >
                    <Input 
                      placeholder="Address or intersection" 
                      className="flex-1" 
                      required
                      value={address}
                      onChange={handleAddressChange}
                      autoComplete="address-line1"
                    />
                  </AddressAutofillAny>
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current
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
                  <Label htmlFor="theft-date">Date Stolen</Label>
                  <Input 
                    id="theft-date" 
                    type="date" 
                    value={theftDate}
                    onChange={(e) => setTheftDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theft-time">Approximate Time</Label>
                  <Input 
                    id="theft-time" 
                    type="time" 
                    value={theftTime}
                    onChange={(e) => setTheftTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <Label>Photos/Video (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="flex justify-center gap-4 mb-4">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">Upload photos or video of your vehicle</p>
                  <p className="text-sm text-gray-500">Drag and drop files here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => document.getElementById('file-upload')?.click()}
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
                              <Video className="h-4 w-4 text-gray-500" />
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
                  placeholder="Any distinctive features, damage, modifications, or circumstances of the theft..."
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              {/* Contact Info */}
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
                  Providing contact info helps law enforcement and community members reach you with sightings.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting Report..." : "🚨 Submit Theft Report"}
                </Button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Your report will be immediately visible to the community and law enforcement.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
