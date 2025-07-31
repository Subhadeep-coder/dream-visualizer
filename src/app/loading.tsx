import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Moon } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6">
            <Moon className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-light text-amber-900 mb-2">
              Dream Journal
            </h2>
            <p className="text-amber-700 font-light">Loading your dreams...</p>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            <span className="text-amber-700 font-light">Please wait</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
