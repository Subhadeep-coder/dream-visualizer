"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, BarChart3, Eye, EyeOff, Trash2 } from "lucide-react";
import { User } from "next-auth";
import { clientSecurity } from "@/lib/client-security";

interface Dream {
  id: string;
  description: string;
  themes: string[];
  emotions: string[];
  visual: any;
  createdAt: Date;
}

export default function DreamJournalClient({
  initialData,
  user,
}: {
  initialData: { dreams: Dream[]; patterns: any };
  user: User;
}) {
  const [dreams, setDreams] = useState(initialData.dreams || []);
  const [patterns, setPatterns] = useState(initialData.patterns || {});
  const [newDream, setNewDream] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);

  const submitDream = async () => {
    if (!newDream.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await clientSecurity.secureFetch("/api/dreams/add", {
        method: "POST",
        body: JSON.stringify({
          description: newDream,
          csrfToken: await clientSecurity.getCSRFToken(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDreams(result.dreams);
        setPatterns(result.patterns);
        setNewDream("");
      } else if (response.status === 429) {
        // Rate limit exceeded
        const errorData = await response.json();
        const retryAfter = response.headers.get("Retry-After");
        console.error(
          "Rate limit exceeded. Retry after:",
          retryAfter,
          "seconds",
        );
        alert(
          `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        );
      } else if (response.status === 403) {
        // Security validation failed
        const errorData = await response.json();
        console.error("Security validation failed:", errorData.details);
        alert(
          "Security validation failed. Please refresh the page and try again.",
        );
        // Clear cached security token
        clientSecurity.clearToken();
      } else if (response.status === 400) {
        const errorData = await response.json();
        console.error("Validation error:", errorData.message);
        alert(errorData.message || "Please check your input and try again.");
      } else if (response.status === 503) {
        const errorData = await response.json();
        console.error("Service unavailable:", errorData.message);
        alert(
          "AI analysis is temporarily unavailable. Please try again later.",
        );
      } else {
        console.error("Failed to add dream");
        alert("Failed to add dream. Please try again.");
      }
    } catch (error) {
      console.error("Failed to add dream:", error);
      if (error instanceof Error && error.message.includes("CSRF")) {
        alert("Security token expired. Please refresh the page and try again.");
        clientSecurity.clearToken();
      } else {
        alert("Network error. Please check your connection and try again.");
      }
    }

    setIsSubmitting(false);
  };

  const deleteDream = async (dreamId: string) => {
    try {
      const response = await clientSecurity.secureFetch("/api/dreams/delete", {
        method: "POST",
        body: JSON.stringify({
          dreamId,
          csrfToken: await clientSecurity.getCSRFToken(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDreams(result.dreams);
        setPatterns(result.patterns);
        setSelectedDream(null);
      } else if (response.status === 429) {
        // Rate limit exceeded
        const errorData = await response.json();
        const retryAfter = response.headers.get("Retry-After");
        console.error(
          "Rate limit exceeded. Retry after:",
          retryAfter,
          "seconds",
        );
        alert(
          `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
        );
      } else if (response.status === 403) {
        // Security validation failed
        const errorData = await response.json();
        console.error("Security validation failed:", errorData.details);
        alert(
          "Security validation failed. Please refresh the page and try again.",
        );
        clientSecurity.clearToken();
      } else if (response.status === 404) {
        const errorData = await response.json();
        console.error("Dream not found:", errorData.message);
        alert("Dream not found or already deleted.");
        // Refresh the dreams list
        window.location.reload();
      } else {
        console.error("Failed to delete dream");
        alert("Failed to delete dream. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete dream:", error);
      if (error instanceof Error && error.message.includes("CSRF")) {
        alert("Security token expired. Please refresh the page and try again.");
        clientSecurity.clearToken();
      } else {
        alert("Network error. Please check your connection and try again.");
      }
    }
  };

  const DreamVisualization = ({ dream }: { dream: Dream }) => {
    const { visual, emotions, themes } = dream;

    return (
      <div
        style={{
          width: "200px",
          height: "200px",
          position: "relative",
          background: visual.backgroundColor,
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #f3e8d3",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(180, 83, 9, 0.1)",
        }}
        onClick={() => setSelectedDream(dream)}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(180, 83, 9, 0.15)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(180, 83, 9, 0.1)";
        }}
      >
        {/* Main shapes */}
        {visual.shapes?.map((shape: any, index: number) => (
          <div
            key={index}
            style={{
              position: "absolute",
              width: `${shape.size}px`,
              height: `${shape.size}px`,
              backgroundColor: shape.color,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              borderRadius:
                shape.type === "circle"
                  ? "50%"
                  : shape.type === "triangle"
                    ? "0"
                    : "8px",
              opacity: shape.opacity,
              transform: `rotate(${shape.rotation}deg)`,
              clipPath:
                shape.type === "triangle"
                  ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                  : "none",
            }}
          />
        ))}

        {/* Floating particles */}
        {visual.particles?.map((particle: any, index: number) => (
          <div
            key={index}
            style={{
              position: "absolute",
              width: `${particle.size || 4}px`,
              height: `${particle.size || 4}px`,
              backgroundColor: particle.color,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              borderRadius: "50%",
              opacity: 0.6,
              animation: `float-${index % 3} ${3 + (index % 2)}s infinite ease-in-out`,
            }}
          />
        ))}

        {/* Date overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(120, 53, 15, 0.8)",
            color: "white",
            fontSize: "10px",
            padding: "4px 6px",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          {new Date(dream.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  const DreamModal = ({
    dream,
    onClose,
  }: {
    dream: Dream | null;
    onClose: () => void;
  }) => {
    if (!dream) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(120, 53, 15, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}
        onClick={onClose}
      >
        <Card
          className="w-full max-w-2xl max-h-[80vh] overflow-auto bg-white/95 backdrop-blur-sm border-amber-200"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl text-amber-900 font-light">
                Dream from {new Date(dream.createdAt).toLocaleDateString()}
              </CardTitle>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <DreamVisualization dream={dream} />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">
                    Description:
                  </h4>
                  <p className="text-amber-700 leading-relaxed">
                    {dream.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-amber-800 mb-2">
                    AI-Detected Themes:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {dream.themes.map((theme, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-amber-800 mb-2">Emotions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {dream.emotions.map((emotion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-200">
              <Button
                onClick={() => deleteDream(dream.id)}
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Dream
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const PatternAnalysis = ({ patterns }: { patterns: any }) => {
    const topThemes = Object.entries(patterns.themes || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5);

    const topEmotions = Object.entries(patterns.emotions || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5);

    return (
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-900 font-light flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-amber-600" />
            Dream Patterns Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-amber-800 mb-4">
                Most Common Themes:
              </h4>
              <div className="space-y-3">
                {topThemes.map(([theme, count]: any) => (
                  <div key={theme}>
                    <div className="flex justify-between mb-1">
                      <span className="text-amber-700 capitalize font-medium">
                        {theme}
                      </span>
                      <span className="text-amber-600">{count}</span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / Math.max(...topThemes.map(([, c]: any) => c))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-amber-800 mb-4">
                Most Common Emotions:
              </h4>
              <div className="space-y-3">
                {topEmotions.map(([emotion, count]: any) => (
                  <div key={emotion}>
                    <div className="flex justify-between mb-1">
                      <span className="text-amber-700 capitalize font-medium">
                        {emotion}
                      </span>
                      <span className="text-amber-600">{count}</span>
                    </div>
                    <div className="w-full bg-orange-100 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / Math.max(...topEmotions.map(([, c]: any) => c))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-center text-amber-700">
              <p className="font-medium">
                Total Dreams: {dreams.length} • Average per Week:{" "}
                {(
                  dreams.length /
                  Math.max(
                    1,
                    Math.ceil(
                      (Date.now() -
                        new Date(
                          dreams[0]?.createdAt || Date.now(),
                        ).getTime()) /
                        (1000 * 60 * 60 * 24 * 7),
                    ),
                  )
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <style jsx>{`
        @keyframes float-0 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-1 {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
          }
        }
        @keyframes float-2 {
          0%,
          100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-8px);
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-light text-amber-900 mb-2">
                🌙 Dream Journal
              </h1>
              <p className="text-amber-700 font-light">
                Welcome back, {user.name || user.email}
              </p>
            </div>
            <Button
              onClick={() => signOut()}
              variant="ghost"
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 border border-amber-200 bg-white/60"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Add New Dream */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900 font-light flex items-center">
                <Plus className="w-5 h-5 mr-3 text-amber-600" />
                Record a New Dream
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={newDream}
                onChange={(e) => setNewDream(e.target.value)}
                placeholder="Describe your dream in detail... What did you see? How did you feel? Who was there? What happened?"
                className="min-h-[120px] border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 bg-white/50 text-amber-900 placeholder:text-amber-500"
              />
              <Button
                onClick={submitDream}
                disabled={!newDream.trim() || isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
              >
                {isSubmitting
                  ? "Analyzing with AI..."
                  : "🔮 Analyze & Visualize Dream"}
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <Button
              onClick={() => setShowPatterns(!showPatterns)}
              variant="ghost"
              className={
                showPatterns
                  ? "text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300"
                  : "text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 border border-amber-200 bg-white/60"
              }
            >
              {showPatterns ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showPatterns ? "Hide" : "Show"} AI Patterns
            </Button>
            <div className="text-amber-700 font-medium">
              {dreams.length} {dreams.length === 1 ? "dream" : "dreams"}{" "}
              recorded
            </div>
          </div>

          {/* Pattern Analysis */}
          {showPatterns && <PatternAnalysis patterns={patterns} />}

          {/* Dreams Gallery */}
          {dreams.length > 0 ? (
            <Card className="mt-8 bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-amber-900 font-light">
                  🎨 Your Dream Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {dreams.map((dream) => (
                    <DreamVisualization key={dream.id} dream={dream} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-16 bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
              <CardContent>
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-xl font-medium text-amber-900 mb-2">
                  No dreams recorded yet
                </h3>
                <p className="text-amber-700 font-light">
                  Start by describing your first dream above!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dream Detail Modal */}
      <DreamModal
        dream={selectedDream}
        onClose={() => setSelectedDream(null)}
      />
    </>
  );
}
