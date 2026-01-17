"use client";

import { useState } from "react";
import { Clock, Check, Sun, Moon, Calendar, Briefcase } from "lucide-react";
import clsx from "clsx";
import { setAvailabilityOnboarding } from "../actions";

interface AvailabilityStepProps {
  hasAvailability: boolean;
  onNext: () => void;
  isPreviewMode?: boolean;
}

const AVAILABILITY_TEMPLATES = [
  {
    id: "weekdays_9_5",
    name: "Standard Business",
    description: "Mon - Fri, 9 AM - 5 PM",
    icon: Briefcase,
    days: [false, true, true, true, true, true, false], // S M T W T F S
    hours: "9:00 - 17:00",
  },
  {
    id: "weekdays_10_6",
    name: "Late Start",
    description: "Mon - Fri, 10 AM - 6 PM",
    icon: Sun,
    days: [false, true, true, true, true, true, false],
    hours: "10:00 - 18:00",
  },
  {
    id: "all_week",
    name: "Full Week",
    description: "Every day, 9 AM - 5 PM",
    icon: Calendar,
    days: [true, true, true, true, true, true, true],
    hours: "9:00 - 17:00",
  },
  {
    id: "flexible",
    name: "Extended Hours",
    description: "Mon - Sat, 8 AM - 8 PM",
    icon: Moon,
    days: [false, true, true, true, true, true, true],
    hours: "8:00 - 20:00",
  },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export default function AvailabilityStep({
  hasAvailability,
  onNext,
  isPreviewMode = false,
}: AvailabilityStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);

    // In preview mode, just proceed without saving
    if (isPreviewMode) {
      setTimeout(() => {
        onNext();
      }, 500);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await setAvailabilityOnboarding(templateId);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      setSelectedTemplate(null);
      return;
    }

    // Brief delay to show selection
    setTimeout(() => {
      onNext();
    }, 500);
  };

  const handleSkipStep = () => {
    onNext();
  };

  // If user already has availability
  if (hasAvailability) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-8">
          {/* Glass Icon */}
          <div className="w-16 h-16 rounded-[18px] mx-auto mb-4 relative overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />
            <div className="w-full h-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Availability already set!</h1>
          <p className="text-gray-400">
            You can adjust your working hours anytime in Settings
          </p>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        {/* Glass Icon - Apple Style */}
        <div className="w-16 h-16 rounded-[18px] mx-auto mb-4 relative overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />
          <div className="w-full h-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-white/80" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Set your availability</h1>
        <p className="text-gray-400">
          When can clients book appointments with you?
        </p>
      </div>

      {/* Templates */}
      <div className="space-y-3 mb-6">
        {AVAILABILITY_TEMPLATES.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              disabled={isSubmitting}
              className={clsx(
                glassCard,
                "w-full p-4 text-left transition-all active:scale-[0.98]",
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-500/10"
                  : "hover:bg-white/[0.12]",
                isSubmitting && !isSelected && "opacity-50",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    isSelected ? "bg-blue-500" : "bg-white/[0.06]",
                  )}
                >
                  {isSelected && isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isSelected ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white mb-0.5">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Visual Day Indicator */}
              <div className="mt-3 flex items-center gap-1">
                {DAY_LABELS.map((day, idx) => (
                  <div
                    key={`${template.id}-${day}-${idx}`}
                    className={clsx(
                      "w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                      template.days[idx]
                        ? isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-white"
                        : "bg-white/[0.03] text-gray-600",
                    )}
                  >
                    {day}
                  </div>
                ))}
                <span className="ml-auto text-xs text-gray-500">
                  {template.hours}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="text-center mb-4">
        <p className="text-gray-600 text-sm">
          You can customize specific hours later in Settings
        </p>
      </div>

      <button
        onClick={handleSkipStep}
        disabled={isSubmitting}
        className="w-full text-gray-500 py-3 font-medium text-sm active:opacity-70 transition-opacity disabled:opacity-30"
      >
        Skip for now
      </button>
    </div>
  );
}
