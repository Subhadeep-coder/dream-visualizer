import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInForm from "@/components/SignInForm";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/me");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌙</div>
          <h1 className="text-3xl font-light text-amber-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-amber-700 font-light">
            Sign in to continue your dream journey
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
