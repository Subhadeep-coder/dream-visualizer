import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LandingPage from "@/components/LandingPage";

export const metadata = {
  title: "Dream Journal Visualizer - Transform Your Dreams Into Art",
  description:
    "Visualize and analyze your dreams with AI-powered insights and beautiful abstract art",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/me");
  }

  return <LandingPage />;
}
