"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-amber-900 font-light">
                Critical Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl mb-4">🌙</div>
              <p className="text-amber-700 font-light">
                A critical error occurred that prevented the application from
                loading properly.
              </p>

              <Button
                onClick={reset}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart Application
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
