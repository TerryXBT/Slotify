"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Link2,
} from "lucide-react";
import clsx from "clsx";
import { completeOnboarding } from "../actions";

interface ShareStepProps {
  username: string;
  onComplete: () => void;
  isPreviewMode?: boolean;
  baseUrl?: string | null;
}

export default function ShareStep({
  username,
  onComplete,
  isPreviewMode = false,
  baseUrl,
}: ShareStepProps) {
  const [copied, setCopied] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Use baseUrl from server if available, otherwise fall back to window.location.origin
  const origin =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const bookingUrl = `${origin}/${username}`;

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = bookingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Book an appointment with me",
          text: "Schedule a time that works for you",
          url: bookingUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleComplete = async () => {
    // In preview mode, just redirect without saving
    if (isPreviewMode) {
      onComplete();
      return;
    }

    setIsCompleting(true);
    await completeOnboarding();
    onComplete();
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        {/* Success indicator - subtle checkmark */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-green-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">You&apos;re all set!</h1>
        <p className="text-gray-400 text-lg">
          Share your booking page and start accepting appointments
        </p>
      </div>

      {/* Booking Link Card */}
      <div className={clsx(glassCard, "p-5 mb-4")}>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Link2 className="w-4 h-4 text-gray-400" />
          <span className="text-[13px] text-gray-400 uppercase font-medium tracking-wider">
            Your Booking Link
          </span>
        </div>

        {/* URL Display */}
        <div className="flex items-center gap-2 p-3.5 bg-black/30 rounded-xl mb-4 border border-white/5">
          <span className="flex-1 text-white font-mono text-sm truncate">
            {bookingUrl}
          </span>
          <button
            onClick={handleCopy}
            className={clsx(
              "p-2 rounded-lg transition-all",
              copied
                ? "bg-green-500/20 text-green-400"
                : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20",
            )}
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className={clsx(
              "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98]",
              copied
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.1]",
            )}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white/[0.06] border border-white/10 rounded-xl text-white font-medium transition-all hover:bg-white/[0.1] active:scale-[0.98]"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>

      {/* Preview Link */}
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          glassCard,
          "flex items-center justify-between p-4 mb-4 hover:bg-white/[0.12] transition-all group",
        )}
      >
        <div>
          <div className="font-medium text-white mb-0.5 group-hover:text-blue-400 transition-colors">
            Preview your page
          </div>
          <div className="text-sm text-gray-500">See what clients will see</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </div>
      </a>

      {/* Tips */}
      <div className={clsx(glassCard, "p-4 mb-8")}>
        <h3 className="font-medium text-white mb-3 text-sm">Quick tips</h3>
        <ul className="space-y-2.5 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span>Add your link to your social media bios</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span>Include it in your email signature</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span>Share it directly with clients who need to book</span>
          </li>
        </ul>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isCompleting}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isCompleting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Finishing up...
          </span>
        ) : (
          "Go to Dashboard"
        )}
      </button>
    </div>
  );
}
