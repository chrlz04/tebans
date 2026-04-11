interface RateLimitEntry {
  count:     number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS  = 15 * 60 * 1000  // 15 minutes
const MAX_ATTEMPTS = 10             // max attempts per window

export function checkRateLimit(identifier: string): {
  allowed:   boolean
  remaining: number
  resetTime: number
} {
  const now   = Date.now()
  const entry = store.get(identifier)

  // No entry or window has expired — reset
  if (!entry || now > entry.resetTime) {
    store.set(identifier, {
      count:     1,
      resetTime: now + WINDOW_MS,
    })
    return {
      allowed:   true,
      remaining: MAX_ATTEMPTS - 1,
      resetTime: now + WINDOW_MS,
    }
  }

  // Within window — increment count
  entry.count++
  store.set(identifier, entry)

  if (entry.count > MAX_ATTEMPTS) {
    return {
      allowed:   false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed:   true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetTime: entry.resetTime,
  }
}

// Clean up expired entries every 15 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) store.delete(key)
  }
}, WINDOW_MS)