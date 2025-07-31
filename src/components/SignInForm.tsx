"use client";

import type React from "react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Chrome } from "lucide-react";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("email", { email, callbackUrl: "/me" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/me" });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
      <CardContent className="p-8 space-y-6">
        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-amber-200 shadow-sm py-6 text-base font-normal"
        >
          <Chrome className="w-5 h-5 mr-3 text-amber-600" />
          {isGoogleLoading ? "Connecting..." : "Continue with Google"}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-amber-700 font-light">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign In */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-6 text-base border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 bg-white/50 text-amber-900 placeholder:text-amber-500"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-base font-normal shadow-lg disabled:opacity-50"
          >
            <Mail className="w-5 h-5 mr-3" />
            {isLoading ? "Sending magic link..." : "Send Magic Link"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-sm text-amber-600 font-light">
            We'll send you a secure link to sign in instantly
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
