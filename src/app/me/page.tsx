import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeDecrypt, isEncrypted } from "@/lib/encryption";
import DreamJournalClient from "@/components/DreamJournalClient";

async function getDreamData(userId: string) {
  const dreams = await prisma.dream.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Decrypt descriptions
  const decryptedDreams = dreams.map((dream) => ({
    ...dream,
    description: isEncrypted(dream.description)
      ? safeDecrypt(dream.description)
      : dream.description,
  }));

  // Calculate patterns
  const patterns: any = { themes: {}, emotions: {} };

  decryptedDreams.forEach((dream) => {
    dream.themes.forEach((theme: string) => {
      patterns.themes[theme] = (patterns.themes[theme] || 0) + 1;
    });

    dream.emotions.forEach((emotion: string) => {
      patterns.emotions[emotion] = (patterns.emotions[emotion] || 0) + 1;
    });
  });

  return { dreams: decryptedDreams, patterns };
}

export const metadata = {
  title: "My Dream Journal - Dream Visualizer",
  description: "Your personal dream journal with AI-powered analysis",
};

export default async function DreamJournalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const initialData = await getDreamData(session.user.id);

  return <DreamJournalClient initialData={initialData} user={session.user} />;
}
