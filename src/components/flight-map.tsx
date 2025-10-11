'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAllAirports } from '@/lib/airports-data'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface Flight {
  id: string
  lat: number
  lng: number
  callsign: string
  altitude: number
  speed: number
  heading: number
}

interface FlightMapProps {
  flights?: Flight[]
  center?: [number, number]
  zoom?: number
}

// SVG plane icon as a string
const PLANE_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5"/>
</svg>`

export function FlightMap({ 
  flights = [], 
  center = [39.8283, -98.5795], // Center of USA
  zoom = 5 
}: FlightMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const flightMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const router = useRouter()
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!mapRef.current) {
      // Initialize map
      const map = L.map('flight-map', {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      })

      // Add dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map)

      // Create layer group for markers
      const markersLayer = L.layerGroup().addTo(map)
      
      mapRef.current = map
      markersRef.current = markersLayer

      // Add ALL major airports from airports database
      const airports = getAllAirports()
      airports.forEach((airport) => {
        const airportIcon = L.divIcon({
          html: `
            <div class="airport-marker clickable" data-code="${airport.code}">
              <div class="airport-dot"></div>
              <span class="airport-label">${airport.code}</span>
            </div>`,
          className: 'custom-airport-marker',
          iconSize: [40, 20],
          iconAnchor: [20, 10],
        })

        const marker = L.marker([airport.lat, airport.lon], { icon: airportIcon })
          .bindPopup(`
            <div class="airport-popup">
              <strong>${airport.code}</strong><br/>
              ${airport.name}<br/>
              ${airport.city}, ${airport.state}
            </div>
          `)
          .addTo(map)
          
        // Add click handler to navigate to airport details
        marker.on('click', (e) => {
          e.originalEvent.stopPropagation()
          router.push(`/airports/${airport.code}`)
        })
      })
    }

    // Clear and update flight markers
    if (markersRef.current) {
      // Clear existing flight markers
      flightMarkersRef.current.forEach(marker => {
        markersRef.current?.removeLayer(marker)
      })
      flightMarkersRef.current.clear()

      flights.forEach((flight) => {
        // Create airplane icon with rotation using SVG
        const svgIcon = `
          <div class="flight-marker" id="flight-${flight.id}" style="transform: rotate(${flight.heading}deg)">
            ${PLANE_SVG}
          </div>`
        
        const planeIcon = L.divIcon({
          html: svgIcon,
          className: 'custom-flight-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([flight.lat, flight.lng], { icon: planeIcon })
          .bindPopup(`
            <div class="flight-popup">
              <strong>${flight.callsign}</strong><br/>
              Altitude: ${flight.altitude.toLocaleString()} ft<br/>
              Speed: ${flight.speed} kts<br/>
              Heading: ${flight.heading}°
            </div>
          `)

        markersRef.current?.addLayer(marker)
        flightMarkersRef.current.set(flight.id, marker)
      })
    }

    // Animate flight movements
    const animateFlights = () => {
      flights.forEach((flight) => {
        const marker = flightMarkersRef.current.get(flight.id)
        if (marker) {
          // Calculate movement based on speed and heading
          const speedInDegreesPerSecond = (flight.speed / 60) * 0.00001 // Approximate conversion
          const radians = (flight.heading - 90) * (Math.PI / 180)
          const deltaLat = Math.sin(radians) * speedInDegreesPerSecond
          const deltaLng = Math.cos(radians) * speedInDegreesPerSecond
          
          const currentPos = marker.getLatLng()
          const newLat = currentPos.lat + deltaLat
          const newLng = currentPos.lng + deltaLng
          
          // Smoothly move the marker
          marker.setLatLng([newLat, newLng])
          
          // Update rotation if needed
          const iconElement = document.getElementById(`flight-${flight.id}`)
          if (iconElement) {
            iconElement.style.transition = 'transform 0.5s ease'
            iconElement.style.transform = `rotate(${flight.heading}deg)`
          }
        }
      })
      
      animationFrameRef.current = requestAnimationFrame(animateFlights)
    }

    // Start animation
    if (flights.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateFlights)
    }

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Don't destroy map on every re-render, only on unmount
    }
  }, [flights, center, zoom, router])

  return (
    <>
      <style jsx global>{`
        #flight-map {
          height: 600px;
          width: 100%;
          background: #000000;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }

        .custom-airport-marker {
          background: none !important;
          border: none !important;
        }

        .airport-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .airport-marker.clickable:hover .airport-dot {
          width: 10px;
          height: 10px;
          background: #3b82f6;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
        }
        
        .airport-marker.clickable:hover .airport-label {
          font-size: 11px;
          color: #60a5fa;
          text-shadow: 0 0 6px rgba(59, 130, 246, 0.8);
        }

        .airport-dot {
          width: 6px;
          height: 6px;
          background: #10B981;
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
          transition: all 0.3s ease;
          position: absolute;
        }

        .airport-label {
          position: absolute;
          top: -18px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.85);
          font-size: 9px;
          font-weight: 600;
          text-shadow: 
            0 0 3px rgba(0, 0, 0, 0.9),
            0 1px 2px rgba(0, 0, 0, 0.7);
          white-space: nowrap;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .custom-flight-marker {
          background: none !important;
          border: none !important;
        }

        .flight-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))
                  drop-shadow(0 0 6px rgba(96, 165, 250, 0.5));
        }

        .flight-marker svg {
          width: 24px;
          height: 24px;
        }

        .flight-popup, .airport-popup {
          padding: 10px;
          font-size: 12px;
          line-height: 1.5;
          min-width: 150px;
        }

        .airport-popup {
          font-size: 11px;
        }

        .leaflet-popup-content-wrapper {
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid rgba(96, 165, 250, 0.4);
          border-radius: 8px;
          color: white;
          backdrop-filter: blur(10px);
        }

        .leaflet-popup-tip {
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid rgba(96, 165, 250, 0.4);
        }

        .leaflet-control-zoom {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 8px;
        }

        .leaflet-control-zoom a {
          background: transparent;
          color: #60a5fa;
          border-bottom: 1px solid rgba(96, 165, 250, 0.2);
        }

        .leaflet-control-zoom a:last-child {
          border-bottom: none;
        }

        .leaflet-control-zoom a:hover {
          background: rgba(96, 165, 250, 0.1);
          color: #93c5fd;
        }
      `}</style>
      <div id="flight-map" />
    </>
  )
}