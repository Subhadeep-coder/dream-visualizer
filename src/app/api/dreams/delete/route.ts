import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeDecrypt, isEncrypted } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dreamId } = await request.json();

    // Delete the dream (only if it belongs to the user)
    await prisma.dream.delete({
      where: {
        id: dreamId,
        userId: session.user.id, // Ensure user can only delete their own dreams
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
    console.error("Error deleting dream:", error);
    return NextResponse.json(
      { error: "Failed to delete dream" },
      { status: 500 },
    );
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
