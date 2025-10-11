import { NextRequest, NextResponse } from 'next/server'

// Store for maintaining realistic incremental changes
let lastFlights: any[] = []
let lastUpdateTime = Date.now()

interface Flight {
  id: string
  flightNumber: string
  airline: string
  origin: string
  destination: string
  scheduledTime: string
  actualTime: string
  gate: string
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived'
  type: 'departure' | 'arrival'
  aircraft: string
  altitude?: number
  speed?: number
  heading?: number
  delay?: number
}

function generateRecentFlights(limit: number = 100): Flight[] {
  const airlines = ['UA', 'AA', 'DL', 'WN', 'AS', 'B6', 'NK', 'F9', 'HA', 'JB']
  const airports = ['LAX', 'JFK', 'ORD', 'DFW', 'ATL', 'SFO', 'SEA', 'MIA', 'BOS', 'PHX', 'DEN', 'LAS', 'MCO', 'IAH', 'EWR', 'MSP', 'DTW', 'CLT', 'PHL', 'LGA']
  const aircraft = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A321', 'Boeing 787', 'Embraer E175', 'Boeing 757', 'Airbus A330', 'Boeing 767', 'CRJ-900']
  
  const now = new Date()
  const currentHour = now.getHours()
  const isPeakHours = (currentHour >= 6 && currentHour <= 9) || (currentHour >= 16 && currentHour <= 20)
  const isNightHours = currentHour >= 22 || currentHour <= 4
  const timeSinceLastUpdate = Date.now() - lastUpdateTime
  
  // Calculate status distribution based on time of day
  const delayRate = isPeakHours ? 0.25 : isNightHours ? 0.10 : 0.18
  const boardingRate = 0.15
  const departedRate = 0.20
  const arrivedRate = 0.20
  const cancelRate = isPeakHours ? 0.03 : 0.02
  
  const flights: Flight[] = []
  
  // If we have previous flights, update them incrementally
  if (lastFlights.length > 0 && timeSinceLastUpdate < 60000) {
    // Update existing flights
    lastFlights.forEach((flight, index) => {
      // Progress flight status over time
      let newStatus = flight.status
      const random = Math.random()
      
      if (flight.status === 'boarding' && random > 0.7) {
        newStatus = 'departed'
      } else if (flight.status === 'departed' && random > 0.8) {
        newStatus = 'arrived'
      } else if (flight.status === 'on-time' && random > 0.9) {
        newStatus = 'boarding'
      } else if (flight.status === 'delayed' && random > 0.95) {
        newStatus = 'boarding'
      }
      
      // Update times if status changed
      const scheduledTime = new Date(now)
      scheduledTime.setMinutes(scheduledTime.getMinutes() - (limit - index) * 5)
      
      const actualTime = new Date(scheduledTime)
      if (flight.delay) {
        actualTime.setMinutes(actualTime.getMinutes() + flight.delay)
      }
      
      flights.push({
        ...flight,
        status: newStatus,
        scheduledTime: scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actualTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    })
    
    // Add a few new flights at the top
    const newFlightCount = Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < newFlightCount; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)]
      const flightNum = Math.floor(Math.random() * 9000) + 1000
      const scheduledTime = new Date(now)
      scheduledTime.setMinutes(scheduledTime.getMinutes() + i * 5)
      
      const isDelayed = Math.random() < delayRate
      const delayMinutes = isDelayed ? Math.floor(Math.random() * 45) + 5 : 0
      const actualTime = new Date(scheduledTime)
      actualTime.setMinutes(actualTime.getMinutes() + delayMinutes)
      
      const statusRandom = Math.random()
      let status: Flight['status'] = 'on-time'
      if (statusRandom < cancelRate) status = 'cancelled'
      else if (statusRandom < cancelRate + delayRate) status = 'delayed'
      else if (statusRandom < cancelRate + delayRate + boardingRate) status = 'boarding'
      else if (statusRandom < cancelRate + delayRate + boardingRate + departedRate) status = 'departed'
      else if (statusRandom < cancelRate + delayRate + boardingRate + departedRate + arrivedRate) status = 'arrived'
      
      const origin = airports[Math.floor(Math.random() * airports.length)]
      let destination = airports[Math.floor(Math.random() * airports.length)]
      while (destination === origin) {
        destination = airports[Math.floor(Math.random() * airports.length)]
      }
      
      flights.unshift({
        id: `${airline}${flightNum}-${Date.now()}-${i}`,
        flightNumber: `${airline}${flightNum}`,
        airline,
        origin,
        destination,
        scheduledTime: scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actualTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 50) + 1}`,
        status,
        type: Math.random() > 0.5 ? 'departure' : 'arrival',
        aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
        altitude: status === 'arrived' || status === 'boarding' ? 0 : Math.floor(Math.random() * 40000),
        speed: status === 'arrived' || status === 'boarding' ? 0 : Math.floor(Math.random() * 300) + 200,
        heading: Math.floor(Math.random() * 360),
        delay: delayMinutes
      })
    }
    
    // Keep only the most recent flights
    return flights.slice(0, limit)
  }
  
  // Generate new flights from scratch
  for (let i = 0; i < limit; i++) {
    const scheduledTime = new Date(now)
    scheduledTime.setMinutes(scheduledTime.getMinutes() - (limit - i) * 5)
    
    const isDelayed = Math.random() < delayRate
    const delayMinutes = isDelayed ? Math.floor(Math.random() * 45) + 5 : 0
    const actualTime = new Date(scheduledTime)
    actualTime.setMinutes(actualTime.getMinutes() + delayMinutes)
    
    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    const flightNum = Math.floor(Math.random() * 9000) + 1000
    
    const statusRandom = Math.random()
    let status: Flight['status'] = 'on-time'
    if (statusRandom < cancelRate) status = 'cancelled'
    else if (statusRandom < cancelRate + delayRate) status = 'delayed'
    else if (statusRandom < cancelRate + delayRate + boardingRate) status = 'boarding'
    else if (statusRandom < cancelRate + delayRate + boardingRate + departedRate) status = 'departed'
    else if (statusRandom < cancelRate + delayRate + boardingRate + departedRate + arrivedRate) status = 'arrived'
    
    const origin = airports[Math.floor(Math.random() * airports.length)]
    let destination = airports[Math.floor(Math.random() * airports.length)]
    while (destination === origin) {
      destination = airports[Math.floor(Math.random() * airports.length)]
    }
    
    flights.push({
      id: `${airline}${flightNum}-${Date.now()}-${i}`,
      flightNumber: `${airline}${flightNum}`,
      airline,
      origin,
      destination,
      scheduledTime: scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actualTime: actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 50) + 1}`,
      status,
      type: Math.random() > 0.5 ? 'departure' : 'arrival',
      aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
      altitude: status === 'arrived' || status === 'boarding' ? 0 : Math.floor(Math.random() * 40000),
      speed: status === 'arrived' || status === 'boarding' ? 0 : Math.floor(Math.random() * 300) + 200,
      heading: Math.floor(Math.random() * 360),
      delay: delayMinutes
    })
  }
  
  return flights.reverse() // Most recent first
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    // Generate fresh flight data
    const flights = generateRecentFlights(Math.min(limit, 200))
    
    // Store for next incremental update
    lastFlights = flights
    lastUpdateTime = Date.now()
    
    // Add headers to prevent caching for real-time data
    const headers = new Headers()
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json({
      flights,
      total: flights.length,
      timestamp: new Date().toISOString()
    }, { headers })
    
  } catch (error) {
    console.error('Error fetching recent flights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent flights' },
      { status: 500 }
    )
  }
}
