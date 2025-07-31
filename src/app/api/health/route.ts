import { NextResponse } from "next/server";
import { generalLimiter, createRateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    // Check rate limit
    const rateLimitResult = generalLimiter.check(request);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const response = NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });

    // Add rate limit headers
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString(),
    );

    return response;
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
