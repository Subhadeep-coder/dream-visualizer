import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDreamWithAI } from "@/lib/dream-analysis-ai";
import { encrypt, safeDecrypt, isEncrypted } from "@/lib/encryption";
import { dreamAddLimiter, createRateLimitResponse } from "@/lib/rate-limit";
import {
  requestSecurity,
  createSecurityErrorResponse,
} from "@/lib/request-security";
import calculatePatterns from "@/lib/calculate-pattern";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = dreamAddLimiter.check(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body to get CSRF token
    const body = await request.json();
    const { description, csrfToken } = body;

    // Validate request security
    const securityResult = requestSecurity.validateRequest(request, {
      checkOrigin: true,
      checkCustomHeader: true,
      checkCSRF: true,
      csrfToken,
      sessionId: session.user.id,
    });

    if (!securityResult.valid) {
      console.warn("Security validation failed:", securityResult.errors);
      return createSecurityErrorResponse(securityResult.errors);
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    const cleanDescription = description.trim();

    if (cleanDescription.length > 5000) {
      return NextResponse.json(
        {
          error: "Description too long",
          message: "Dream description must be less than 5000 characters",
        },
        { status: 400 },
      );
    }

    if (cleanDescription.length < 10) {
      return NextResponse.json(
        {
          error: "Description too short",
          message: "Please provide a more detailed description of your dream",
        },
        { status: 400 },
      );
    }

    const analysis = await analyzeDreamWithAI(cleanDescription);
    const encryptedDescription = encrypt(cleanDescription);

    const newDream = await prisma.dream.create({
      data: {
        userId: session.user.id,
        description: encryptedDescription,
        themes: analysis.themes,
        emotions: analysis.emotions,
        visual: analysis.visual,
      },
    });

    const dreams = await prisma.dream.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const decryptedDreams = dreams.map((dream) => ({
      ...dream,
      description: isEncrypted(dream.description)
        ? safeDecrypt(dream.description)
        : dream.description,
    }));

    const patterns = calculatePatterns(decryptedDreams);

    const response = NextResponse.json({ dreams: decryptedDreams, patterns });
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString(),
    );
    response.headers.set("X-Security-Validated", "true");

    return response;
  } catch (error) {
    console.error("Error adding dream:", error);

    if (error instanceof Error && error.message.includes("AI analysis")) {
      return NextResponse.json(
        {
          error: "AI analysis failed",
          message:
            "Unable to analyze dream at the moment. Please try again later.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Failed to add dream" }, { status: 500 });
  }
}
