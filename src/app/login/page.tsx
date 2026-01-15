import { login, signup } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error, success } = await searchParams;

  if (user) {
    redirect("/app/today");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md space-y-12">
        {/* Logo/Brand - Minimal */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-white rounded-2xl mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              {/* Calendar body */}
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Calendar tabs */}
              <path d="M7 3v3M17 3v3" strokeLinecap="round" />
              {/* Grid cells - Row 1 */}
              <rect x="5.5" y="10" width="3" height="3" rx="0.5" />
              <rect x="10.5" y="10" width="3" height="3" rx="0.5" />
              <rect x="15.5" y="10" width="3" height="3" rx="0.5" />
              {/* Grid cells - Row 2 */}
              <rect x="5.5" y="15" width="3" height="3" rx="0.5" />
              <rect x="10.5" y="15" width="3" height="3" rx="0.5" />
              <rect x="15.5" y="15" width="3" height="3" rx="0.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white">
            Slotify
          </h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 rounded-lg">
            <p className="text-red-400 text-sm text-center font-light">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="border border-green-500/50 bg-green-500/5 px-4 py-3 rounded-lg">
            <p className="text-green-400 text-sm text-center font-light">
              {success}
            </p>
          </div>
        )}

        {/* Login Form - Minimal */}
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
              placeholder="Enter your password"
            />
          </div>

          <div className="pt-8 space-y-4">
            <button
              formAction={login}
              className="w-full py-4 border-2 border-white text-white font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300 rounded-lg text-base"
            >
              Sign In
            </button>

            <div className="text-center pt-2">
              <Link
                href="/signup"
                className="text-sm text-gray-400 hover:text-white transition-colors font-light"
              >
                Don&apos;t have an account?{" "}
                <span className="underline">Sign Up</span>
              </Link>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-600 font-light">
            Professional booking platform
          </p>
        </div>
      </div>
    </div>
  );
}
