'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
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

interface Airport {
  code: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  status?: string
}

interface FlightMapProps {
  flights?: Flight[]
  airports?: Airport[]
  center?: [number, number]
  zoom?: number
}

// SVG plane icon as a string
const PLANE_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5"/>
</svg>`

// Get airport color based on status
const getAirportColor = (status?: string) => {
  const normalizedStatus = status?.toUpperCase()
  switch (normalizedStatus) {
    case 'NORMAL':
      return { bg: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' } // Green
    case 'BUSY':
      return { bg: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' } // Amber
    case 'SEVERE':
      return { bg: '#F97316', glow: 'rgba(249, 115, 22, 0.6)' } // Orange
    case 'CLOSED':
      return { bg: '#EF4444', glow: 'rgba(239, 68, 68, 0.6)' } // Red
    default:
      return { bg: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' } // Default to green
  }
}

export function FlightMap({ 
  flights = [],
  airports = [],
  center = [39.8283, -98.5795], // Center of USA
  zoom = 5 
}: FlightMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const airportMarkersRef = useRef<L.MarkerClusterGroup | null>(null)
  const flightMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const router = useRouter()
  const animationFrameRef = useRef<number>()
  const lastAnimationTime = useRef<number>(0)
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)

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
      
      // Create marker cluster group for airports (improves performance with 100+ airports)
      const airportClusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount()
          let size = 'small'
          if (count > 20) size = 'large'
          else if (count > 10) size = 'medium'
          
          return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40)
          })
        }
      })
      airportClusterGroup.addTo(map)
      
      mapRef.current = map
      markersRef.current = markersLayer
      airportMarkersRef.current = airportClusterGroup
      
      // Track map bounds for filtering
      map.on('moveend', () => {
        setMapBounds(map.getBounds())
      })
      map.on('zoomend', () => {
        setMapBounds(map.getBounds())
      })
      
      // Set initial bounds
      setMapBounds(map.getBounds())
    }

    // Update airport markers
    if (airportMarkersRef.current) {
      // Clear existing airport markers
      airportMarkersRef.current.clearLayers()

      // Add airports if provided
      if (airports.length > 0) {
        airports.forEach((airport) => {
          const colors = getAirportColor(airport.status)
          const isProblem = airport.status?.toUpperCase() === 'BUSY' || airport.status?.toUpperCase() === 'SEVERE'
          
          const airportIcon = L.divIcon({
            html: `
              <div class="airport-marker clickable ${isProblem ? 'pulsing' : ''}" data-code="${airport.code}">
                <div class="airport-dot" style="background: ${colors.bg}; box-shadow: 0 0 8px ${colors.glow}"></div>
                <span class="airport-label">${airport.code}</span>
              </div>`,
            className: 'custom-airport-marker',
            iconSize: [40, 20],
            iconAnchor: [20, 10],
          })

          const statusText = airport.status || 'Normal'
          const marker = L.marker([airport.latitude, airport.longitude], { icon: airportIcon })
            .bindPopup(`
              <div class="airport-popup">
                <strong>${airport.code}</strong><br/>
                ${airport.name}<br/>
                ${airport.city}, ${airport.state}<br/>
                <span style="color: ${colors.bg}">● ${statusText}</span>
              </div>
            `)
            
          // Add click handler to navigate to airport details
          marker.on('click', (e) => {
            e.originalEvent.stopPropagation()
            router.push(`/airports/${airport.code}`)
          })

          airportMarkersRef.current?.addLayer(marker)
        })
      } else {
        // Fallback: show airports from static data if no airport data provided
        const staticAirports = getAllAirports()
        staticAirports.forEach((airport) => {
          const colors = getAirportColor('NORMAL')
          
          const airportIcon = L.divIcon({
            html: `
              <div class="airport-marker clickable" data-code="${airport.code}">
                <div class="airport-dot" style="background: ${colors.bg}; box-shadow: 0 0 8px ${colors.glow}"></div>
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
            
          marker.on('click', (e) => {
            e.originalEvent.stopPropagation()
            router.push(`/airports/${airport.code}`)
          })

          airportMarkersRef.current?.addLayer(marker)
        })
      }
    }

    // Clear and update flight markers (with bounds filtering for performance)
    if (markersRef.current) {
      // Clear existing flight markers
      flightMarkersRef.current.forEach(marker => {
        markersRef.current?.removeLayer(marker)
      })
      flightMarkersRef.current.clear()

      // Filter flights to only show those in visible bounds (major performance boost)
      const visibleFlights = mapBounds 
        ? flights.filter(flight => mapBounds.contains([flight.lat, flight.lng]))
        : flights.slice(0, 500) // Fallback: limit to 500 if no bounds

      visibleFlights.forEach((flight) => {
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

    // Animate flight movements (throttled to 10 FPS for performance)
    const animateFlights = (currentTime: number) => {
      // Throttle: only update every 100ms (10 FPS instead of 60 FPS)
      if (currentTime - lastAnimationTime.current < 100) {
        animationFrameRef.current = requestAnimationFrame(animateFlights)
        return
      }
      lastAnimationTime.current = currentTime
      
      // Only animate flights that are currently visible
      const visibleFlights = mapBounds 
        ? flights.filter(flight => mapBounds.contains([flight.lat, flight.lng]))
        : flights.slice(0, 200) // Limit animation to 200 flights if no bounds
      
      visibleFlights.forEach((flight) => {
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

    // Start animation only if there are flights to animate
    if (flights.length > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateFlights)
    }

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Don't destroy map on every re-render, only on unmount
    }
  }, [flights, airports, center, zoom, router, mapBounds])

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

        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }

        .airport-marker.pulsing .airport-dot {
          animation: pulse-dot 2s ease-in-out infinite;
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

        /* Marker Cluster Styling */
        .custom-cluster-icon {
          background: none !important;
          border: none !important;
        }

        .cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(4px);
        }

        .cluster-small {
          width: 30px;
          height: 30px;
          background: rgba(59, 130, 246, 0.7);
          font-size: 12px;
        }

        .cluster-medium {
          width: 36px;
          height: 36px;
          background: rgba(96, 165, 250, 0.8);
          font-size: 14px;
        }

        .cluster-large {
          width: 44px;
          height: 44px;
          background: rgba(37, 99, 235, 0.9);
          font-size: 16px;
        }

        /* Optimize rendering performance */
        .leaflet-marker-icon {
          will-change: transform;
        }

        .flight-marker {
          will-change: transform;
        }
      `}</style>
      <div id="flight-map" />
    </>
  )
}