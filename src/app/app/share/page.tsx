import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Share, ExternalLink } from "lucide-react";
import Link from "next/link";
import CopyButton from "./CopyButton";

export default async function SharePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/${profile?.username}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 font-sans pb-24 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-5 pt-12 pb-4 flex items-center justify-between">
        <Link
          href="/app/today"
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600 dark:text-blue-500" />
        </Link>
        <h1 className="text-lg font-bold">Share Profile</h1>
        <div className="w-10"></div>
      </header>

      <main className="px-5 mt-8 flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl shadow-xl flex items-center justify-center text-white text-3xl font-bold mb-6">
          {profile?.username?.[0]?.toUpperCase() || "P"}
        </div>

        <h2 className="text-2xl font-bold mb-2">@{profile?.username}</h2>
        <p className="text-gray-500 mb-8 text-center max-w-xs">
          Share this link to let clients book appointments with you instantly.
        </p>

        <div className="w-full max-w-sm space-y-4">
          {/* Link Card */}
          <div className="bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-gray-800 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Your Link
              </div>
              <div className="text-sm font-medium truncate text-blue-600">
                {publicUrl}
              </div>
            </div>
            <CopyButton text={publicUrl} />
          </div>

          {/* Native Share (Mobile) */}
          <button className="hidden w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <Share className="w-5 h-5" />
            Share Link
          </button>

          {/* Preview */}
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-xl border border-transparent transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            Preview Public Page
          </a>
        </div>
      </main>
    </div>
  );
}
