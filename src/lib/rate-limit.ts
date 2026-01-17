/**
 * Rate limiter with Upstash Redis support
 * Falls back to in-memory storage if Redis is not configured
 */

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// ============================================
// In-Memory Fallback (for development)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
          rateLimitStore.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  );
}

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);
  }

  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: Math.floor(entry.resetAt / 1000),
  };
}

// ============================================
// Upstash Redis Implementation
// ============================================

const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = Boolean(UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN);

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  try {
    // Use Redis sorted set with sliding window algorithm
    // 1. Remove expired entries
    // 2. Add current request
    // 3. Count requests in window

    const pipeline = [
      // Remove old entries outside the window
      ["ZREMRANGEBYSCORE", key, "0", windowStart.toString()],
      // Add current request with timestamp as score
      ["ZADD", key, now.toString(), `${now}:${Math.random()}`],
      // Count all requests in window
      ["ZCARD", key],
      // Set expiry on the key
      ["EXPIRE", key, config.windowSeconds.toString()],
    ];

    const response = await fetch(`${UPSTASH_REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      console.error("[RateLimit] Redis request failed, falling back to memory");
      return checkRateLimitMemory(identifier, config);
    }

    const results = await response.json();
    const count = results[2]?.result || 0;
    const remaining = Math.max(0, config.limit - count);
    const success = count <= config.limit;

    return {
      success,
      limit: config.limit,
      remaining,
      reset: now + config.windowSeconds,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error, falling back to memory:", error);
    return checkRateLimitMemory(identifier, config);
  }
}

// ============================================
// Public API
// ============================================

/**
 * Check if a request is within rate limits
 * Uses Upstash Redis if configured, otherwise falls back to in-memory
 *
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (isRedisConfigured) {
    return checkRateLimitRedis(identifier, config);
  }

  // Fallback to in-memory for development or if Redis not configured
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[RateLimit] Redis not configured in production. Using in-memory fallback.",
    );
  }

  return checkRateLimitMemory(identifier, config);
}

/**
 * Synchronous rate limit check (in-memory only)
 * Use this when you need synchronous behavior
 * @deprecated Use async checkRateLimit instead
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  return checkRateLimitMemory(identifier, config);
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Standard proxy headers
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}
