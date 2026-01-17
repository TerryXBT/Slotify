"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";
import type { Profile } from "@/types";
import ProfileStep from "./steps/ProfileStep";
import ServiceStep from "./steps/ServiceStep";
import AvailabilityStep from "./steps/AvailabilityStep";
import ShareStep from "./steps/ShareStep";
import { skipOnboarding } from "./actions";

const STEPS = [
  { id: 0, title: "Welcome", description: "Let's get you started" },
  { id: 1, title: "Your Profile", description: "Tell us about yourself" },
  { id: 2, title: "Your Service", description: "What do you offer?" },
  { id: 3, title: "Availability", description: "When are you available?" },
  { id: 4, title: "Share", description: "Get your booking link" },
];

interface OnboardingFlowProps {
  profile: Profile;
  initialStep: number;
  hasServices: boolean;
  hasAvailability: boolean;
  isPreviewMode?: boolean;
  baseUrl?: string | null;
}

export default function OnboardingFlow({
  profile,
  initialStep,
  hasServices,
  hasAvailability,
  isPreviewMode = false,
  baseUrl,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    const result = await skipOnboarding();
    if (result.success) {
      router.push("/app/today");
    }
    setIsSkipping(false);
  };

  const handleComplete = () => {
    router.push("/app/today");
  };

  // Glass card style
  const glassCard =
    "relative rounded-3xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-medium">
            👁 Preview Mode - Changes won&apos;t be saved
          </span>
          <button
            onClick={() => router.push("/app/today")}
            className="text-amber-400 text-sm font-medium hover:text-amber-300"
          >
            Exit Preview
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-4 flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-blue-500 font-medium active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {STEPS.slice(1).map((step) => (
              <div
                key={step.id}
                className={clsx(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentStep >= step.id ? "bg-blue-500 w-6" : "bg-white/20",
                )}
              />
            ))}
          </div>

          {currentStep < 4 ? (
            <button
              onClick={handleSkip}
              disabled={isSkipping}
              className="text-gray-500 font-medium text-sm active:opacity-70 transition-opacity"
            >
              {isSkipping ? "..." : "Skip"}
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </header>

      <main className="px-4 py-8 max-w-lg mx-auto">
        {/* Welcome Step */}
        {currentStep === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              {/* Glass Icon - Apple Style */}
              <div className="w-20 h-20 rounded-[22px] mx-auto mb-6 relative overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M3 10h18" />
                    <path d="M8 2v4M16 2v4" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-3">Welcome to Slotify</h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Let&apos;s set up your booking page in just a few minutes
              </p>
            </div>

            <div className={clsx(glassCard, "p-6 mb-6")}>
              <h3 className="font-semibold text-lg mb-4">
                Here&apos;s what we&apos;ll do:
              </h3>
              <div className="space-y-4">
                {[
                  {
                    num: 1,
                    title: "Set up your profile",
                    desc: "Add your name and photo",
                  },
                  {
                    num: 2,
                    title: "Create a service",
                    desc: "What you offer to clients",
                  },
                  {
                    num: 3,
                    title: "Set your hours",
                    desc: "When you're available",
                  },
                  {
                    num: 4,
                    title: "Share your link",
                    desc: "Start accepting bookings",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-bold text-sm">
                        {item.num}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-gray-500 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
            >
              Get Started
            </button>

            <p className="text-center text-gray-600 text-sm mt-4">
              Takes about 2 minutes
            </p>
          </div>
        )}

        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <ProfileStep
            profile={profile}
            onNext={handleNext}
            isPreviewMode={isPreviewMode}
          />
        )}

        {/* Step 2: Service */}
        {currentStep === 2 && (
          <ServiceStep
            hasServices={hasServices}
            onNext={handleNext}
            isPreviewMode={isPreviewMode}
          />
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <AvailabilityStep
            hasAvailability={hasAvailability}
            onNext={handleNext}
            isPreviewMode={isPreviewMode}
          />
        )}

        {/* Step 4: Share */}
        {currentStep === 4 && (
          <ShareStep
            username={profile.username}
            onComplete={handleComplete}
            isPreviewMode={isPreviewMode}
            baseUrl={baseUrl}
          />
        )}
      </main>
    </div>
  );
}
