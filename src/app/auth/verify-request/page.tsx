"use client";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-amber-700 mb-6">
            We've sent you a magic link to sign in. Check your email and click
            the link to continue.
          </p>
          <div className="text-sm text-amber-600">
            <p>
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
