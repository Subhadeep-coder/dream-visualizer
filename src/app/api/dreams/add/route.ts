import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeDreamWithAI } from "@/lib/dream-analysis-ai";
import { encrypt, safeDecrypt, isEncrypted } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    const cleanDescription = description.trim();

    // Analyze dream with AI (using unencrypted text)
    const analysis = await analyzeDreamWithAI(cleanDescription);

    // Encrypt the description before storing
    const encryptedDescription = encrypt(cleanDescription);

    // Create new dream entry with encrypted description
    const newDream = await prisma.dream.create({
      data: {
        userId: session.user.id,
        description: encryptedDescription,
        themes: analysis.themes,
        emotions: analysis.emotions,
        visual: analysis.visual,
      },
    });

    // Get updated dreams and decrypt descriptions for response
    const dreams = await prisma.dream.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Decrypt descriptions for client
    const decryptedDreams = dreams.map((dream) => ({
      ...dream,
      description: isEncrypted(dream.description)
        ? safeDecrypt(dream.description)
        : dream.description,
    }));

    // Calculate patterns
    const patterns = calculatePatterns(decryptedDreams);

    return NextResponse.json({ dreams: decryptedDreams, patterns });
  } catch (error) {
    console.error("Error adding dream:", error);
    return NextResponse.json({ error: "Failed to add dream" }, { status: 500 });
  }
}

function calculatePatterns(dreams: any[]) {
  const patterns: any = { themes: {}, emotions: {} };

  dreams.forEach((dream) => {
    dream.themes.forEach((theme: string) => {
      patterns.themes[theme] = (patterns.themes[theme] || 0) + 1;
    });

    dream.emotions.forEach((emotion: string) => {
      patterns.emotions[emotion] = (patterns.emotions[emotion] || 0) + 1;
    });
  });

  return patterns;
}
