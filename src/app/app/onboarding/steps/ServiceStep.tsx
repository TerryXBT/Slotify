"use client";

import { useState } from "react";
import {
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Video,
  Check,
  Timer,
  Ban,
} from "lucide-react";
import clsx from "clsx";
import { createServiceOnboarding } from "../actions";

interface ServiceStepProps {
  hasServices: boolean;
  onNext: () => void;
  isPreviewMode?: boolean;
}

// Pre-defined service templates
const SERVICE_TEMPLATES = [
  {
    id: "consultation",
    name: "Consultation",
    duration: 60,
    price: 100,
    description: "One-on-one consultation session",
    icon: "briefcase",
  },
  {
    id: "coaching",
    name: "Coaching Session",
    duration: 45,
    price: 75,
    description: "Personal coaching and guidance",
    icon: "user",
  },
  {
    id: "tutoring",
    name: "Tutoring",
    duration: 60,
    price: 50,
    description: "Private tutoring session",
    icon: "book",
  },
  {
    id: "custom",
    name: "Custom Service",
    duration: 30,
    price: 0,
    description: "",
    icon: "plus",
  },
];

// Cancel policy options
const CANCEL_POLICIES = [
  {
    id: "flexible",
    label: "Flexible",
    description: "Free cancellation up to 24 hours before",
    hours: 24,
  },
  {
    id: "moderate",
    label: "Moderate",
    description: "Free cancellation up to 48 hours before",
    hours: 48,
  },
  { id: "strict", label: "Strict", description: "Non-refundable", hours: 0 },
];

export default function ServiceStep({
  hasServices,
  onNext,
  isPreviewMode = false,
}: ServiceStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("in_person");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [cancelPolicy, setCancelPolicy] = useState("flexible");

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  // Handle price input - prevent negative numbers
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive numbers or empty
    if (value === "" || (parseFloat(value) >= 0 && !value.startsWith("-"))) {
      setPrice(value);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = SERVICE_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setName(template.id === "custom" ? "" : template.name);
      setDuration(template.duration);
      setPrice(template.price > 0 ? template.price.toString() : "");
      setDescription(template.description);
      setShowForm(true);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter a service name");
      return;
    }

    // Validate price is not negative
    if (price && parseFloat(price) < 0) {
      setError("Price cannot be negative");
      return;
    }

    // In preview mode, just proceed without saving
    if (isPreviewMode) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("duration_minutes", duration.toString());
    formData.append("price", price || "0");
    formData.append("description", description);
    formData.append("location_type", locationType);
    formData.append("buffer_before", bufferBefore.toString());
    formData.append("buffer_after", bufferAfter.toString());
    formData.append("cancel_policy", cancelPolicy);

    const result = await createServiceOnboarding(formData);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onNext();
  };

  const handleSkipStep = () => {
    onNext();
  };

  // If user already has services, show simplified view
  if (hasServices && !showForm) {
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
          <h1 className="text-2xl font-bold mb-2">
            You already have services!
          </h1>
          <p className="text-gray-400">
            You can add more services later from the Services page
          </p>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98]"
        >
          Continue
        </button>

        <button
          onClick={() => setShowForm(true)}
          className="w-full text-blue-400 py-3 font-medium text-sm mt-2 active:opacity-70 transition-opacity"
        >
          Add another service
        </button>
      </div>
    );
  }

  // Template selection
  if (!showForm) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-8">
          {/* Glass Icon - Apple Style */}
          <div className="w-16 h-16 rounded-[18px] mx-auto mb-4 relative overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />
            <div className="w-full h-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white/80" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Create your first service</h1>
          <p className="text-gray-400">
            What would you like to offer to your clients?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {SERVICE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={clsx(
                glassCard,
                "w-full p-4 text-left transition-all active:scale-[0.98] hover:bg-white/[0.12]",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white mb-1">
                    {template.name}
                  </h3>
                  {template.id !== "custom" && (
                    <p className="text-sm text-gray-500">
                      {template.duration} min • ${template.price}
                    </p>
                  )}
                  {template.id === "custom" && (
                    <p className="text-sm text-gray-500">
                      Create your own service
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSkipStep}
          className="w-full text-gray-500 py-3 font-medium text-sm active:opacity-70 transition-opacity"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // Service form
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {selectedTemplate === "custom"
            ? "Create your service"
            : "Customize your service"}
        </h1>
        <p className="text-gray-400">You can always edit this later</p>
      </div>

      <div className={clsx(glassCard, "p-5 mb-4")}>
        <div className="space-y-5">
          {/* Service Name */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              Service Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Consultation, Coaching Session"
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={clsx(
                    "py-3 rounded-xl font-medium text-sm transition-all",
                    duration === d
                      ? "bg-blue-500 text-white"
                      : "bg-white/[0.06] text-gray-400 border border-white/10 hover:bg-white/[0.1]",
                  )}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Price - without spinner buttons */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />
              Price{" "}
              <span className="text-gray-600 normal-case">
                (leave empty for free)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={handlePriceChange}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all [appearance:textfield]"
              />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocationType("in_person")}
                className={clsx(
                  "py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                  locationType === "in_person"
                    ? "bg-blue-500 text-white"
                    : "bg-white/[0.06] text-gray-400 border border-white/10 hover:bg-white/[0.1]",
                )}
              >
                <MapPin className="w-4 h-4" />
                In Person
              </button>
              <button
                type="button"
                onClick={() => setLocationType("video")}
                className={clsx(
                  "py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                  locationType === "video"
                    ? "bg-blue-500 text-white"
                    : "bg-white/[0.06] text-gray-400 border border-white/10 hover:bg-white/[0.1]",
                )}
              >
                <Video className="w-4 h-4" />
                Virtual
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              Description{" "}
              <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this service includes..."
              rows={2}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Buffer Time & Cancel Policy */}
      <div className={clsx(glassCard, "p-5 mb-6")}>
        <div className="space-y-5">
          {/* Buffer Time */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider">
                <Timer className="w-3.5 h-3.5 inline mr-1" />
                Buffer Time
              </label>
              <div className="group relative">
                <button
                  type="button"
                  className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-all"
                >
                  <span className="text-xs font-medium">i</span>
                </button>
                <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-[#2a2a2a] border border-white/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Buffer time adds extra minutes before or after each
                    appointment. This gives you time to prepare or take a break
                    between bookings.
                  </p>
                  <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-[#2a2a2a] border-r border-b border-white/20 rotate-45" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-2 px-1">Before</p>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={`before-${mins}`}
                      type="button"
                      onClick={() => setBufferBefore(mins)}
                      className={clsx(
                        "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                        bufferBefore === mins
                          ? "bg-blue-500 text-white"
                          : "bg-white/[0.06] text-gray-400 border border-white/10",
                      )}
                    >
                      {mins === 0 ? "None" : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 px-1">After</p>
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={`after-${mins}`}
                      type="button"
                      onClick={() => setBufferAfter(mins)}
                      className={clsx(
                        "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                        bufferAfter === mins
                          ? "bg-blue-500 text-white"
                          : "bg-white/[0.06] text-gray-400 border border-white/10",
                      )}
                    >
                      {mins === 0 ? "None" : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Policy */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              <Ban className="w-3.5 h-3.5 inline mr-1" />
              Cancellation Policy
            </label>
            <div className="space-y-2">
              {CANCEL_POLICIES.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setCancelPolicy(policy.id)}
                  className={clsx(
                    "w-full p-3 rounded-xl text-left transition-all flex items-center justify-between",
                    cancelPolicy === policy.id
                      ? "bg-blue-500/20 border border-blue-500/50"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]",
                  )}
                >
                  <div>
                    <p
                      className={clsx(
                        "font-medium text-sm",
                        cancelPolicy === policy.id
                          ? "text-blue-400"
                          : "text-white",
                      )}
                    >
                      {policy.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {policy.description}
                    </p>
                  </div>
                  {cancelPolicy === policy.id && (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !name.trim()}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating...
          </span>
        ) : (
          "Create Service"
        )}
      </button>

      <button
        onClick={() => setShowForm(false)}
        className="w-full text-gray-500 py-3 font-medium text-sm mt-2 active:opacity-70 transition-opacity"
      >
        Back to templates
      </button>
    </div>
  );
}
