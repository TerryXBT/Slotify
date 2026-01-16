"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
      <div className="glass w-full max-w-[380px] space-y-6 p-8 rounded-2xl text-center">
        {/* Email Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Check Your Email
        </h1>

        {/* Description */}
        <div className="space-y-2">
          <p className="text-gray-400 text-sm">
            We&apos;ve sent a confirmation link to:
          </p>
          {email && (
            <p className="text-white font-semibold text-lg break-all">
              {email}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-2">
          <p className="text-gray-300 text-sm">
            📬 Please check your inbox and click the confirmation link to
            activate your account.
          </p>
          <p className="text-gray-500 text-xs">
            Didn&apos;t receive the email? Check your spam folder or try signing
            up again.
          </p>
        </div>

        {/* Back to Login */}
        <Link
          href="/login"
          className="block w-full py-2.5 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-900">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
