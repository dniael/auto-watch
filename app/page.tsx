"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, AlertTriangle, Eye, Bell, Shield, Car, Users, Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 bg-red-200 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${mounted ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute top-40 right-20 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-30 transition-all duration-1000 delay-300 ${mounted ? 'animate-bounce' : ''}`}></div>
        <div className={`absolute bottom-40 left-1/4 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-20 transition-all duration-1000 delay-500 ${mounted ? 'animate-pulse' : ''}`}></div>
      </div>

      {/* Header */}
      <header className={`border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-red-100 rounded-lg transition-all duration-500 ${mounted ? 'rotate-0 scale-100' : 'rotate-12 scale-75'}`}>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AutoWatch</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="transition-all duration-300 hover:scale-105">
              <Link href="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
              <Link href="/report">Report Theft</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="max-w-5xl mx-auto">
          <div className={`transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Community-Powered
              <br />
              <span className="text-red-600">Car Theft Alerts</span>
            </h2>
          </div>
          
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Report stolen vehicles instantly. Get real-time community sightings. Help recover cars faster with
              <span className="font-semibold text-red-600"> crowdsourced vigilance</span>.
            </p>
          </div>

          <div className={`flex gap-6 justify-center flex-wrap transition-all duration-1000 delay-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Button size="lg" asChild className="bg-red-600 hover:bg-red-700 text-lg px-8 py-6 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl">
              <Link href="/report" className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                Report Stolen Car
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 transition-all duration-300 hover:scale-110 border-2 hover:bg-white/50">
              <Link href="/map" className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                View Live Map
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 transition-all duration-1000 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">2 min</div>
              <div className="text-gray-600">Average Report Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Community Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">Real-time</div>
              <div className="text-gray-600">Instant Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className={`text-center mb-16 transition-all duration-1000 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Simple steps to protect your community</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: AlertTriangle,
              title: "Report Instantly",
              description: "Quick form with car details, photos, and GPS location. Get your alert out in under 2 minutes.",
              color: "red",
              bgColor: "bg-red-100",
              textColor: "text-red-600",
              borderColor: "border-red-200",
              hoverBorderColor: "hover:border-red-400",
              barGradient: "from-red-400 to-red-600",
              delay: 300
            },
            {
              icon: MapPin,
              title: "Real-Time Map",
              description: "See all reported thefts and community sightings on an interactive map with live updates.",
              color: "orange",
              bgColor: "bg-orange-100",
              textColor: "text-orange-600",
              borderColor: "border-orange-200",
              hoverBorderColor: "hover:border-orange-400",
              barGradient: "from-orange-400 to-orange-600",
              delay: 400
            },
            {
              icon: Eye,
              title: "Community Sightings",
              description: "Spotted a stolen car? Drop a pin, add a photo, and help reunite owners with their vehicles.",
              color: "blue",
              bgColor: "bg-blue-100",
              textColor: "text-blue-600",
              borderColor: "border-blue-200",
              hoverBorderColor: "hover:border-blue-400",
              barGradient: "from-blue-400 to-blue-600",
              delay: 500
            },
            {
              icon: Bell,
              title: "Instant Alerts",
              description: "Get notified when your car is spotted or when new thefts happen in your area.",
              color: "green",
              bgColor: "bg-green-100",
              textColor: "text-green-600",
              borderColor: "border-green-200",
              hoverBorderColor: "hover:border-green-400",
              barGradient: "from-green-400 to-green-600",
              delay: 600
            },
            {
              icon: Shield,
              title: "Secure & Anonymous",
              description: "Your privacy matters. Report anonymously or create an account for personalized alerts.",
              color: "purple",
              bgColor: "bg-purple-100",
              textColor: "text-purple-600",
              borderColor: "border-purple-200",
              hoverBorderColor: "hover:border-purple-400",
              barGradient: "from-purple-400 to-purple-600",
              delay: 700
            },
            {
              icon: Users,
              title: "Local Focus",
              description: "Hyper-local alerts and sightings. Your neighborhood watching out for your neighborhood.",
              color: "indigo",
              bgColor: "bg-indigo-100",
              textColor: "text-indigo-600",
              borderColor: "border-indigo-200",
              hoverBorderColor: "hover:border-indigo-400",
              barGradient: "from-indigo-400 to-indigo-600",
              delay: 800
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className={`${feature.borderColor} ${feature.hoverBorderColor} transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer group relative overflow-hidden ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${feature.delay}ms` }}
            >
              {/* Decorative Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.barGradient}`}></div>
              
              <CardHeader className="text-center pt-6">
                <div className={`inline-flex items-center justify-center p-4 ${feature.bgColor} rounded-full mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-8 w-8 ${feature.textColor}`} />
                </div>
                <CardTitle className="text-xl mb-3">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={`bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white py-20 relative overflow-hidden transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">Every Second Counts</h3>
            <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed">
              The faster the community knows, the better the chance of recovery.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-lg px-10 py-6 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl">
              <Link href="/report" className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Start Your Report Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-gray-900 text-white py-12 transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl">AutoWatch</span>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Community-powered vehicle recovery. Built for speed, privacy, and results.
          </p>
        </div>
      </footer>
    </div>
  )
}
