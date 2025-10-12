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
  lat: number
  lon: number
  status?: string
}

interface FlightMapProps {
  flights?: Flight[]
  airports?: Airport[]
  center?: [number, number]
  zoom?: number
}

// Use Unicode plane character instead of SVG for MUCH better performance
// SVG rendering is very expensive with thousands of markers
const PLANE_CHAR = '✈️'

// Create plane icon as simple text (10x faster than SVG)
const createPlaneIcon = (size: number, heading: number) => {
  return `
    <div class="plane-icon" style="
      font-size: ${size}px;
      transform: rotate(${heading}deg);
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    ">✈</div>
  `
}

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
  const lastUpdateTime = useRef<number>(0)
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null)
  const [currentZoom, setCurrentZoom] = useState<number>(5)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()
  const [isZooming, setIsZooming] = useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout>()
  
  // No flight limiting - show all flights (user wants to see thousands)
  const getFlightLimit = useCallback((zoom: number) => {
    return Infinity // Show all flights
  }, [])
  
  // Get plane size based on zoom level (more aggressive scaling)
  const getPlaneSize = useCallback((zoom: number) => {
    if (zoom <= 4) return 10       // Tiny (continental view)
    if (zoom <= 5) return 12       // Very small (default view)
    if (zoom <= 6) return 16       // Small (regional view)
    if (zoom <= 8) return 20       // Medium (state view)
    if (zoom <= 10) return 24      // Normal (city view)
    return 28                       // Large (close-up view)
  }, [])

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
      
      // Track map bounds and zoom for intelligent filtering (debounced)
      const debouncedUpdate = () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        updateTimeoutRef.current = setTimeout(() => {
          setMapBounds(map.getBounds())
          setCurrentZoom(map.getZoom())
          setIsZooming(false) // Re-enable animation after zoom settles
        }, 300) // 300ms debounce for smoother zoom
      }
      
      // Pause animation during zoom for better performance
      map.on('zoomstart', () => {
        setIsZooming(true)
      })
      
      map.on('moveend', debouncedUpdate)
      map.on('zoomend', debouncedUpdate)
      
      // Set initial bounds and zoom
      setMapBounds(map.getBounds())
      setCurrentZoom(map.getZoom())
    }

    // Update airport markers
    if (airportMarkersRef.current) {
      // Clear existing airport markers
      airportMarkersRef.current.clearLayers()

      // Add airports if provided
      if (airports.length > 0) {
        airports.forEach((airport) => {
          // Skip airports without valid coordinates
          const lat = airport.lat
          const lon = airport.lon
          if (!lat || !lon) {
            console.warn(`Skipping airport ${airport.code}: missing coordinates`)
            return
          }
          
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
          const marker = L.marker([lat, lon], { icon: airportIcon })
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

    // Clear and update flight markers (optimized for thousands of flights)
    if (markersRef.current) {
      // Skip updates during active zooming for instant zoom response
      if (isZooming) {
        return
      }
      
      // Throttle updates: only update every 1.5 seconds max to prevent lag
      const now = Date.now()
      if (now - lastUpdateTime.current < 1500 && flightMarkersRef.current.size > 0) {
        return // Skip this update
      }
      lastUpdateTime.current = now
      
      // Clear existing flight markers
      flightMarkersRef.current.forEach(marker => {
        markersRef.current?.removeLayer(marker)
      })
      flightMarkersRef.current.clear()

      // Filter flights: only show those in visible bounds (major performance boost)
      let visibleFlights = mapBounds 
        ? flights.filter(flight => mapBounds.contains([flight.lat, flight.lng]))
        : flights // Show all if no bounds yet

      // Get plane size for current zoom
      const planeSize = getPlaneSize(currentZoom)

      // Batch DOM operations for better performance
      const fragment = document.createDocumentFragment()
      
      visibleFlights.forEach((flight) => {
        // Use simple text icon instead of SVG for 10x better performance
        const planeIcon = L.divIcon({
          html: createPlaneIcon(planeSize, flight.heading),
          className: 'custom-flight-marker',
          iconSize: [planeSize, planeSize],
          iconAnchor: [planeSize / 2, planeSize / 2],
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

    // Animate flight movements (optimized for thousands of flights)
    const animateFlights = (currentTime: number) => {
      // Pause animation during zoom for instant zoom response
      if (isZooming) {
        animationFrameRef.current = requestAnimationFrame(animateFlights)
        return
      }
      
      // More aggressive throttle: 3 FPS for ultra-smooth scroll
      if (currentTime - lastAnimationTime.current < 333) {
        animationFrameRef.current = requestAnimationFrame(animateFlights)
        return
      }
      lastAnimationTime.current = currentTime
      
      // Only animate flights that are currently visible in viewport
      const visibleFlights = mapBounds 
        ? flights.filter(flight => mapBounds.contains([flight.lat, flight.lng]))
        : flights
      
      // Sample every 5th flight for animation to reduce load (20% of flights animate)
      const animatedFlights = visibleFlights.filter((_, index) => index % 5 === 0)
      
      animatedFlights.forEach((flight) => {
        const marker = flightMarkersRef.current.get(flight.id)
        if (marker) {
          // Calculate movement based on speed and heading
          const speedInDegreesPerSecond = (flight.speed / 60) * 0.00001
          const radians = (flight.heading - 90) * (Math.PI / 180)
          const deltaLat = Math.sin(radians) * speedInDegreesPerSecond
          const deltaLng = Math.cos(radians) * speedInDegreesPerSecond
          
          const currentPos = marker.getLatLng()
          const newLat = currentPos.lat + deltaLat
          const newLng = currentPos.lng + deltaLng
          
          // Smoothly move the marker
          marker.setLatLng([newLat, newLng])
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
      // Cleanup
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [flights, airports, center, zoom, router, mapBounds, currentZoom, isZooming, getFlightLimit, getPlaneSize])

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
          contain: layout style paint; /* CSS containment for better performance */
          content-visibility: auto; /* Browser optimization hint */
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
          contain: layout style; /* Optimize individual markers */
        }

        .flight-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          contain: layout style paint; /* Isolate marker rendering */
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
          backface-visibility: hidden;
          -webkit-font-smoothing: subpixel-antialiased;
          transform: translateZ(0); /* Force GPU acceleration */
        }

        .flight-marker {
          will-change: transform;
          backface-visibility: hidden;
          transform: translateZ(0); /* Force GPU acceleration */
        }

        .plane-icon {
          color: #60a5fa;
          text-shadow: 
            0 0 3px rgba(30, 64, 175, 0.8),
            0 0 6px rgba(96, 165, 250, 0.5);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
        }

        /* Optimize Leaflet zoom animations */
        .leaflet-zoom-animated {
          will-change: transform;
        }

        .leaflet-tile-container {
          will-change: transform;
        }

        /* Zoom indicator */
        .zoom-indicator {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.85);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          color: #60a5fa;
          border: 1px solid rgba(96, 165, 250, 0.3);
          z-index: 1000;
          pointer-events: none;
          backdrop-filter: blur(10px);
        }

        .zoom-indicator .zoom-level {
          font-weight: bold;
          color: white;
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <div id="flight-map" />
        {currentZoom && (
          <div className="zoom-indicator">
            <div className="zoom-level">Zoom: {currentZoom}</div>
            <div>All flights visible • Optimized rendering</div>
          </div>
        )}
      </div>
    </>
  )
}