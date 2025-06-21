"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, AlertTriangle, Eye, Bell, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">CrisisLens: AutoWatch</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/report">Report Theft</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Community-Powered Car Theft Alerts</h2>
          <p className="text-xl text-gray-600 mb-8">
            Report stolen vehicles instantly. Get real-time community sightings. Help recover cars faster with
            crowdsourced vigilance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/report">🚨 Report Stolen Car</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/map">🗺️ View Map</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-red-200">
            <CardHeader>
              <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Report Instantly</CardTitle>
              <CardDescription>
                Quick form with car details, photos, and GPS location. Get your alert out in under 2 minutes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <MapPin className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Real-Time Map</CardTitle>
              <CardDescription>
                See all reported thefts and community sightings on an interactive map with live updates.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <Eye className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Community Sightings</CardTitle>
              <CardDescription>
                Spotted a stolen car? Drop a pin, add a photo, and help reunite owners with their vehicles.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <Bell className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Instant Alerts</CardTitle>
              <CardDescription>
                Get notified when your car is spotted or when new thefts happen in your area.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-200">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Secure & Anonymous</CardTitle>
              <CardDescription>
                Your privacy matters. Report anonymously or create an account for personalized alerts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-indigo-200">
            <CardHeader>
              <MapPin className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Local Focus</CardTitle>
              <CardDescription>
                Hyper-local alerts and sightings. Your neighborhood watching out for your neighborhood.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Every Second Counts</h3>
          <p className="text-xl mb-8 opacity-90">The faster the community knows, the better the chance of recovery.</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/report">Start Your Report Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6" />
            <span className="font-semibold">CrisisLens: AutoWatch</span>
          </div>
          <p className="text-gray-400">Community-powered vehicle recovery. Built for speed, privacy, and results.</p>
        </div>
      </footer>
    </div>
  )
}
