import { login, signInWithGoogle, signInWithApple } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PasswordInput from "@/components/PasswordInput";

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
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 p-4">
      <div className="glass w-full max-w-[380px] space-y-6 p-8 rounded-2xl">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-white bg-white rounded-xl mb-4 shadow-md">
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M7 3v3M17 3v3" strokeLinecap="round" />
              <rect x="5.5" y="10" width="3" height="3" rx="0.5" />
              <rect x="10.5" y="10" width="3" height="3" rx="0.5" />
              <rect x="15.5" y="10" width="3" height="3" rx="0.5" />
              <rect x="5.5" y="15" width="3" height="3" rx="0.5" />
              <rect x="10.5" y="15" width="3" height="3" rx="0.5" />
              <rect x="15.5" y="15" width="3" height="3" rx="0.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-xs font-medium">
            Sign in to your Slotify account
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="border border-red-500/50 bg-red-500/10 px-3 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-red-400 text-xs text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="border border-green-500/50 bg-green-500/10 px-3 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-green-400 text-xs text-center font-medium">
              {success}
            </p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-2.5">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <GoogleIcon className="w-4 h-4" />
              Continue with Google
            </button>
          </form>

          <form action={signInWithApple}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-white/90 text-black text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AppleIcon className="w-4 h-4" />
              Continue with Apple
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
            or
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email/Password Form */}
        <form className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all hover:border-white/20"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all hover:border-white/20"
              placeholder="Enter your password"
            />
          </div>

          <button
            formAction={login}
            className="w-full py-2.5 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
          >
            Sign In
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <Link
            href="/signup"
            className="block text-xs text-gray-400 hover:text-white transition-colors font-medium"
          >
            Don&apos;t have an account?{" "}
            <span className="text-white underline underline-offset-2 decoration-white/50 hover:decoration-white">
              Sign Up
            </span>
          </Link>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.546,12.763c0.024-1.87,1.004-3.597,2.597-4.576c-1.009-1.442-2.64-2.323-4.399-2.378c-1.851-0.194-3.645,1.107-4.588,1.107c-0.961,0-2.413-1.088-3.977-1.056C6.122,5.927,4.25,7.068,3.249,8.867c-2.131,3.69-0.542,9.114,1.5,12.097c1.022,1.461,2.215,3.092,3.778,3.035c1.529-0.063,2.1-0.975,3.945-0.975c1.828,0,2.364,0.975,3.958,0.938c1.64-0.027,2.674-1.467,3.66-2.942c0.734-1.041,1.299-2.191,1.673-3.408C19.815,16.788,18.548,14.879,18.546,12.763z" />
      <path d="M15.535,3.847C16.429,2.773,16.87,1.393,16.763,0c-1.366,0.144-2.629,0.797-3.535,1.829c-0.895,1.019-1.349,2.351-1.261,3.705C13.352,5.548,14.667,4.926,15.535,3.847z" />
    </svg>
  );
}
