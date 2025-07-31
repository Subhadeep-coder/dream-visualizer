import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
            <Search className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl text-amber-900 font-light">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-6xl mb-4">🌙</div>
          <p className="text-amber-700 font-light">
            Looks like this page got lost in a dream. Let's get you back to
            reality!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              asChild
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="flex-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 border border-amber-200 bg-white/60"
            >
              <Link href="/me">
                <ArrowLeft className="w-4 h-4 mr-2" />
                My Dreams
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
