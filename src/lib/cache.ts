// Simple in-memory cache (since DB keeps timing out)
interface CacheEntry {
  value: any
  expiresAt: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map()

  set(key: string, value: any, ttlSeconds: number) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear() {
    this.cache.clear()
  }

  // Clean expired entries periodically
  cleanup() {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new MemoryCache()

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000)
}

