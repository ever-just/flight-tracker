/**
 * Real-time Flight Tracker Service
 * Accumulates flight data over 24 hours to provide accurate "today" statistics
 */

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { pipeline } from 'stream/promises'

interface FlightSnapshot {
  callsign: string
  altitude: number
  speed: number
  onGround: boolean
  timestamp: number
  lat: number
  lng: number
}

interface DailyStats {
  totalUniqueFlights: number
  currentlyFlying: number
  avgAltitude: number
  avgSpeed: number
  peakFlights: number
  peakTime: string
  lastUpdate: string
  dataPoints: number
}

class RealtimeFlightTracker {
  private flightHistory: Map<string, FlightSnapshot[]> = new Map()
  private currentSnapshot: FlightSnapshot[] = []
  private yesterdayStats: DailyStats | null = null
  private lastCleanup: number = Date.now()
  private peakFlights: number = 0
  private peakTime: string = new Date().toISOString()
  private currentDelays: number = 0
  private currentCancellations: number = 0
  
  // Constants
  private readonly HISTORY_DURATION = 24 * 60 * 60 * 1000 // 24 hours in ms
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // Cleanup every 5 minutes
  private readonly DATA_FILE = path.join(process.cwd(), 'data', 'flight-history.json')
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB limit
  private readonly MAX_HISTORY_DAYS = 7 // Keep 7 days of data
  private readonly ARCHIVE_DIR = path.join(process.cwd(), 'data', 'archives')
  
  constructor() {
    this.loadFromFile()
    
    // Pre-populate yesterday stats if empty (for demo purposes)
    if (!this.yesterdayStats) {
      this.yesterdayStats = {
        totalUniqueFlights: 2500,  // Reasonable estimate
        currentlyFlying: 0,
        avgAltitude: 32000,
        avgSpeed: 450,
        peakFlights: 2200,
        peakTime: new Date(Date.now() - 86400000).toISOString(),
        lastUpdate: new Date(Date.now() - 86400000).toISOString(),
        dataPoints: 50000
      }
    }
    
    // Schedule hourly cleanup to rotate file if needed
    setInterval(async () => {
      try {
        await this.rotateDataFile()
      } catch (error) {
        console.error('[FLIGHT TRACKER] Error rotating data file:', error)
      }
    }, 60 * 60 * 1000) // Every hour
  }
  
  /**
   * Update with latest flight data from OpenSky
   */
  public updateFlights(flights: any[]): void {
    const now = Date.now()
    
    // Convert to snapshot format
    this.currentSnapshot = flights.map(f => ({
      callsign: f.callsign || f.id,
      altitude: f.altitude || 0,
      speed: f.speed || 0,
      onGround: f.onGround || false,
      timestamp: now,
      lat: f.lat,
      lng: f.lng
    }))
    
    // Track peak flights
    const currentlyFlying = this.currentSnapshot.filter(f => !f.onGround).length
    if (currentlyFlying > this.peakFlights) {
      this.peakFlights = currentlyFlying
      this.peakTime = new Date().toISOString()
    }
    
    // Add to history
    this.currentSnapshot.forEach(flight => {
      if (!this.flightHistory.has(flight.callsign)) {
        this.flightHistory.set(flight.callsign, [])
      }
      this.flightHistory.get(flight.callsign)!.push(flight)
    })
    
    // Cleanup old data periodically
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanupOldData()
      this.lastCleanup = now
    }
    
    // Save to file after updating
    this.saveToFile()
  }
  
  /**
   * Save data to file for persistence
   */
  private async saveToFile(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.DATA_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      
      // Prune old data before saving to keep file size manageable
      this.pruneOldData()
      
      // Convert Map to array for JSON serialization
      const data = {
        flightHistory: Array.from(this.flightHistory.entries()),
        yesterdayStats: this.yesterdayStats,
        peakFlights: this.peakFlights,
        peakTime: this.peakTime,
        currentDelays: this.currentDelays,
        currentCancellations: this.currentCancellations,
        timestamp: Date.now()
      }
      
      fs.writeFileSync(this.DATA_FILE, JSON.stringify(data, null, 2))
      
      // Check file size after saving
      await this.checkAndRotateIfNeeded()
    } catch (error) {
      console.error('[FLIGHT TRACKER] Error saving data:', error)
    }
  }
  
  /**
   * Rotate data file if it exceeds size limit
   */
  private async rotateDataFile(): Promise<void> {
    try {
      if (!fs.existsSync(this.DATA_FILE)) {
        return
      }
      
      const stats = await fs.promises.stat(this.DATA_FILE)
      
      if (stats.size > this.MAX_FILE_SIZE) {
        console.log(`[FLIGHT TRACKER] File size ${Math.round(stats.size / 1024 / 1024)}MB exceeds limit, rotating...`)
        
        // Ensure archive directory exists
        if (!fs.existsSync(this.ARCHIVE_DIR)) {
          await fs.promises.mkdir(this.ARCHIVE_DIR, { recursive: true })
        }
        
        // Archive current file
        const timestamp = new Date().toISOString().split('T')[0]
        const archivePath = path.join(this.ARCHIVE_DIR, `flight-history-${timestamp}.json.gz`)
        
        // Compress and move
        const gzip = zlib.createGzip()
        const source = fs.createReadStream(this.DATA_FILE)
        const destination = fs.createWriteStream(archivePath)
        
        await pipeline(source, gzip, destination)
        console.log(`[FLIGHT TRACKER] Archived to ${archivePath}`)
        
        // Start fresh with last 24 hours only
        this.pruneOldData()
        await this.saveToFile()
      }
    } catch (error) {
      console.error('[FLIGHT TRACKER] Error rotating data file:', error)
    }
  }
  
  /**
   * Check file size and rotate if needed
   */
  private async checkAndRotateIfNeeded(): Promise<void> {
    try {
      if (fs.existsSync(this.DATA_FILE)) {
        const stats = await fs.promises.stat(this.DATA_FILE)
        if (stats.size > this.MAX_FILE_SIZE) {
          await this.rotateDataFile()
        }
      }
    } catch (error) {
      console.error('[FLIGHT TRACKER] Error checking file size:', error)
    }
  }
  
  /**
   * Prune data older than MAX_HISTORY_DAYS
   */
  private pruneOldData(): void {
    const cutoffTime = Date.now() - (this.MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000)
    let prunedCount = 0
    
    for (const [callsign, history] of this.flightHistory.entries()) {
      const recentHistory = history.filter(h => h.timestamp > cutoffTime)
      
      if (recentHistory.length === 0) {
        this.flightHistory.delete(callsign)
        prunedCount++
      } else if (recentHistory.length < history.length) {
        this.flightHistory.set(callsign, recentHistory)
      }
    }
    
    if (prunedCount > 0) {
      console.log(`[FLIGHT TRACKER] Pruned ${prunedCount} old flight records`)
    }
  }
  
  /**
   * Load data from file
   */
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.DATA_FILE, 'utf-8'))
        
        // Restore data, filtering out entries older than 24 hours
        const cutoff = Date.now() - this.HISTORY_DURATION
        this.flightHistory = new Map(
          data.flightHistory
            .map(([key, value]: [string, FlightSnapshot[]]) => [
              key,
              value.filter((s: FlightSnapshot) => s.timestamp > cutoff)
            ])
            .filter(([_, value]: [string, FlightSnapshot[]]) => value.length > 0)
        )
        
        this.yesterdayStats = data.yesterdayStats
        this.peakFlights = data.peakFlights || 0
        this.peakTime = data.peakTime || new Date().toISOString()
        this.currentDelays = data.currentDelays || 0
        this.currentCancellations = data.currentCancellations || 0
        
        console.log('[FLIGHT TRACKER] Loaded persisted data from file')
      }
    } catch (error) {
      console.error('[FLIGHT TRACKER] Error loading data:', error)
    }
  }
  
  /**
   * Remove flight data older than 24 hours
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.HISTORY_DURATION
    
    for (const [callsign, snapshots] of this.flightHistory.entries()) {
      // Filter out old snapshots
      const recent = snapshots.filter(s => s.timestamp > cutoff)
      
      if (recent.length === 0) {
        this.flightHistory.delete(callsign)
      } else {
        this.flightHistory.set(callsign, recent)
      }
    }
  }
  
  /**
   * Get statistics for "today" (last 24 hours)
   */
  public getTodayStats(): DailyStats {
    const now = Date.now()
    const cutoff = now - this.HISTORY_DURATION
    
    // Get unique flights seen in last 24 hours
    const uniqueFlights = new Set<string>()
    let totalAltitude = 0
    let totalSpeed = 0
    let flyingCount = 0
    let dataPoints = 0
    
    for (const [callsign, snapshots] of this.flightHistory.entries()) {
      const recentSnapshots = snapshots.filter(s => s.timestamp > cutoff)
      
      if (recentSnapshots.length > 0) {
        uniqueFlights.add(callsign)
        
        // Use most recent snapshot for current stats
        const latest = recentSnapshots[recentSnapshots.length - 1]
        if (!latest.onGround) {
          totalAltitude += latest.altitude
          totalSpeed += latest.speed
          flyingCount++
        }
        
        dataPoints += recentSnapshots.length
      }
    }
    
    // Calculate current flying from live snapshot
    const currentlyFlying = this.currentSnapshot.filter(f => !f.onGround).length
    
    return {
      totalUniqueFlights: uniqueFlights.size,
      currentlyFlying,
      avgAltitude: flyingCount > 0 ? Math.round(totalAltitude / flyingCount) : 0,
      avgSpeed: flyingCount > 0 ? Math.round(totalSpeed / flyingCount) : 0,
      peakFlights: this.peakFlights,
      peakTime: this.peakTime,
      lastUpdate: new Date().toISOString(),
      dataPoints
    }
  }
  
  /**
   * Calculate change from yesterday
   */
  public getChangeFromYesterday(): number {
    if (!this.yesterdayStats) {
      // Save current as "yesterday" for next time
      this.yesterdayStats = this.getTodayStats()
      return 0
    }
    
    const todayStats = this.getTodayStats()
    const change = ((todayStats.totalUniqueFlights - this.yesterdayStats.totalUniqueFlights) / 
                   this.yesterdayStats.totalUniqueFlights) * 100
    
    return Math.round(change * 10) / 10 // Round to 1 decimal
  }
  
  /**
   * Save yesterday's stats (should be called once per day)
   */
  public saveYesterdayStats(): void {
    this.yesterdayStats = this.getTodayStats()
  }
  
  /**
   * Set real delays from FAA data
   */
  public setRealDelays(faaData: any): void {
    this.currentDelays = faaData.totalDelays || 0
    this.currentCancellations = faaData.totalCancellations || 0
    this.saveToFile() // Persist the new data
  }
  
  /**
   * Get current delays (real if available, otherwise estimated)
   */
  public getDelays(): number {
    // Return real delays if we have them
    if (this.currentDelays > 0) {
      return this.currentDelays
    }
    
    // Otherwise fall back to estimation
    return this.getEstimatedDelays()
  }
  
  /**
   * Get current cancellations
   */
  public getCancellations(): number {
    return this.currentCancellations
  }
  
  /**
   * Get estimated delays based on ground traffic (fallback when no FAA data)
   */
  public getEstimatedDelays(): number {
    // Estimate delays based on planes on ground at airports
    // This is a rough estimate - real delays would come from FAA
    const groundedAtAirports = this.currentSnapshot.filter(f => 
      f.onGround && f.altitude < 1000
    ).length
    
    // Rough estimate: if more than 30% of planes are on ground, there might be delays
    const totalPlanes = this.currentSnapshot.length
    if (totalPlanes === 0) return 0
    
    const groundRatio = groundedAtAirports / totalPlanes
    
    if (groundRatio > 0.4) {
      return Math.round(groundedAtAirports * 0.3) // Estimate 30% are delayed
    } else if (groundRatio > 0.3) {
      return Math.round(groundedAtAirports * 0.15) // Estimate 15% are delayed
    }
    
    return Math.round(groundedAtAirports * 0.05) // Normal operations, 5% delays
  }
  
  /**
   * Get busy airports based on flight concentration
   */
  public getBusyAirports(): { code: string; flights: number }[] {
    // Major US airports and their coordinates
    const airports = [
      { code: 'ATL', lat: 33.6407, lng: -84.4277 },
      { code: 'ORD', lat: 41.9742, lng: -87.9073 },
      { code: 'DFW', lat: 32.8998, lng: -97.0403 },
      { code: 'DEN', lat: 39.8561, lng: -104.6737 },
      { code: 'LAX', lat: 33.9425, lng: -118.4081 },
      { code: 'JFK', lat: 40.6413, lng: -73.7781 },
      { code: 'SFO', lat: 37.6213, lng: -122.3790 },
      { code: 'SEA', lat: 47.4502, lng: -122.3088 },
      { code: 'LAS', lat: 36.0840, lng: -115.1537 },
      { code: 'MCO', lat: 28.4312, lng: -81.3081 }
    ]
    
    // Count flights near each airport (within 50km)
    const airportActivity = airports.map(airport => {
      const nearbyFlights = this.currentSnapshot.filter(flight => {
        const distance = this.calculateDistance(
          flight.lat, flight.lng,
          airport.lat, airport.lng
        )
        return distance < 50 // Within 50km
      }).length
      
      return { code: airport.code, flights: nearbyFlights }
    })
    
    // Sort by activity
    return airportActivity.sort((a, b) => b.flights - a.flights).slice(0, 5)
  }
  
  /**
   * Calculate distance between two coordinates in km
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

// Singleton instance
let tracker: RealtimeFlightTracker | null = null

export function getFlightTracker(): RealtimeFlightTracker {
  if (!tracker) {
    tracker = new RealtimeFlightTracker()
  }
  return tracker
}

export type { DailyStats, FlightSnapshot }
