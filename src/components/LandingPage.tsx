"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Moon, Stars } from "lucide-react";

export default function LandingPage() {
  const [floatingElements, setFloatingElements] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);

  useEffect(() => {
    // Generate subtle floating elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setFloatingElements(elements);
  }, []);

  const handleGetStarted = () => {
    signIn(undefined, { callbackUrl: "/me" });
  };

  return (
    <>
      <style jsx>{`
        @keyframes gentle-float {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-15px);
            opacity: 0.6;
          }
        }
        .floating-element {
          animation: gentle-float 4s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Subtle Floating Elements */}
        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="floating-element absolute"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              animationDelay: `${element.delay}s`,
            }}
          >
            {element.id % 2 === 0 ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : (
              <Stars className="w-3 h-3 text-orange-300" />
            )}
          </div>
        ))}

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <div className="mb-12">
              <div className="text-8xl mb-8">🌙</div>
              <h1 className="text-5xl md:text-6xl font-light text-amber-900 mb-8 leading-tight">
                Dream Journal
              </h1>
              <p className="text-xl text-amber-700 mb-12 font-light">
                Transform your dreams into visual stories
              </p>
            </div>

            {/* Simple CTA */}
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg font-normal rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
