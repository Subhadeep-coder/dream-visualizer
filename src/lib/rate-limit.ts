interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up old entries every 5 minutes
    setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  private getKey(request: Request): string {
    // Try to get real IP from headers (for production behind proxies)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Use the first available IP
    const ip =
      forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";

    // Also include user agent to make it slightly more unique
    const userAgent = request.headers.get("user-agent") || "unknown";

    return `${ip}-${userAgent.slice(0, 50)}`;
  }

  check(request: Request): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const key = this.getKey(request);
    const now = Date.now();

    let entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.requests.set(key, entry);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: entry.resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
}

// Create different rate limiters for different endpoints
export const dreamAddLimiter = new RateLimiter(5, 60000); // 5 requests per minute for adding dreams
export const dreamDeleteLimiter = new RateLimiter(10, 60000); // 10 requests per minute for deleting dreams
export const generalLimiter = new RateLimiter(30, 60000); // 30 requests per minute for general API calls

export function createRateLimitResponse(resetTime: number) {
  const resetTimeSeconds = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: resetTimeSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": resetTimeSeconds.toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      },
    },
  );
}
