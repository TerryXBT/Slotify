/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis or a dedicated service like Upstash
 */

interface RateLimitEntry {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    /**
     * Maximum number of requests allowed within the window
     */
    limit: number
    /**
     * Time window in seconds
     */
    windowSeconds: number
}

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    let entry = rateLimitStore.get(identifier)

    // Create new entry if doesn't exist or window expired
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + windowMs
        }
        rateLimitStore.set(identifier, entry)
    }

    // Increment count
    entry.count++

    const remaining = Math.max(0, config.limit - entry.count)
    const success = entry.count <= config.limit

    return {
        success,
        limit: config.limit,
        remaining,
        reset: Math.floor(entry.resetAt / 1000)
    }
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim()
    }

    if (realIp) {
        return realIp
    }

    // Fallback to a generic identifier
    return 'unknown'
}
