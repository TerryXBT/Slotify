"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createService } from "../../settings/actions";
import { MapPin, Video, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import InfoTooltip from "@/components/InfoTooltip";
import type { Profile } from "@/types";

interface AvailabilitySettings {
  default_buffer_minutes?: number | null;
  default_cancellation_policy?: string | null;
}

interface CreateServiceViewProps {
  profile: Profile;
  availabilitySettings?: AvailabilitySettings | null;
}

const BUFFER_OPTIONS = [
  { value: 0, label: "None" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: -1, label: "Custom" },
];

const CANCELLATION_OPTIONS = [
  { value: "24h", label: "24 hours in advance" },
  { value: "48h", label: "48 hours in advance" },
  { value: "no_cancel", label: "Non-refundable" },
  { value: "custom", label: "Custom" },
];

export default function CreateServiceView({
  profile: _profile,
  availabilitySettings,
}: CreateServiceViewProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [locationType, setLocationType] = useState("physical");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [isBookingSettingsExpanded, setIsBookingSettingsExpanded] =
    useState(false);

  // Buffer time state
  const defaultBuffer = availabilitySettings?.default_buffer_minutes ?? 0;
  const [bufferOption, setBufferOption] = useState<number>(defaultBuffer);
  const [customBuffer, setCustomBuffer] = useState<number>(15);

  // Cancellation policy state
  const defaultCancellation =
    availabilitySettings?.default_cancellation_policy ?? "24h";
  const [cancellationOption, setCancellationOption] =
    useState<string>(defaultCancellation);
  const [customCancellation, setCustomCancellation] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("duration", formData.duration.toString());
    data.append("price", (parseFloat(formData.price) || 0).toString());
    data.append("price_negotiable", priceNegotiable.toString());
    data.append("location_type", locationType);
    data.append("default_location", formData.address);

    // Buffer time
    const finalBuffer = bufferOption === -1 ? customBuffer : bufferOption;
    data.append("buffer_minutes", finalBuffer.toString());

    // Cancellation policy
    const finalCancellation =
      cancellationOption === "custom" ? customCancellation : cancellationOption;
    data.append("cancellation_policy", finalCancellation);

    const res = await createService(data);

    if (res?.error) {
      alert(res.error);
      setIsSaving(false);
    } else {
      router.push("/app/services");
      router.refresh();
    }
  };

  const getBufferDisplayText = () => {
    if (bufferOption === 0) return "None";
    if (bufferOption === -1) return `${customBuffer} min`;
    const option = BUFFER_OPTIONS.find((o) => o.value === bufferOption);
    return option?.label || "None";
  };

  const getCancellationDisplayText = () => {
    if (cancellationOption === "custom") return customCancellation || "Not set";
    const option = CANCELLATION_OPTIONS.find(
      (o) => o.value === cancellationOption,
    );
    return option?.label || "24 hours in advance";
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-blue-500/30">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-4 pt-14 bg-[#1a1a1a]/80 backdrop-blur-xl sticky top-0 z-10 border-b border-white/5">
        <Link
          href="/app/services"
          className="text-blue-500 text-[17px] active:opacity-50 transition-opacity"
        >
          Cancel
        </Link>
        <h1 className="text-[17px] font-semibold">New Service</h1>
        <button
          onClick={handleSubmit}
          disabled={isSaving || !formData.name}
          className="bg-gray-200/90 text-blue-500 text-[15px] font-semibold px-5 py-1.5 rounded-full disabled:opacity-40 disabled:bg-gray-600/50 disabled:text-gray-400 active:bg-gray-300 active:scale-95 transition-all shadow-sm"
        >
          {isSaving ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Form Group 1: Basic Info */}
        <div className="space-y-2">
          <h2 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider ml-4">
            Basic Information
          </h2>
          <div className="relative rounded-2xl overflow-hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white/10" />

            <div className="relative z-10 divide-y divide-white/5">
              {/* Name */}
              <div className="flex items-center px-4 py-3.5">
                <label className="w-28 text-[17px] text-white font-medium">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Service Name"
                  className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[17px] text-white font-medium">
                    Description
                  </label>
                  <span className="text-[13px] text-gray-500">Optional</span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your service..."
                  rows={3}
                  className="w-full bg-black/20 text-[17px] text-white placeholder-gray-500 focus:outline-none resize-none rounded-xl p-3 border border-white/5 focus:border-white/20 transition-colors"
                />
              </div>

              {/* Duration */}
              <div className="flex items-center px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <label className="text-[17px] text-white font-medium">
                    Duration
                  </label>
                  <InfoTooltip
                    title="Duration"
                    content="The total length of this service. Clients will see available time slots based on this duration."
                  />
                </div>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                  />
                  <span className="text-[17px] text-gray-400">min</span>
                </div>
              </div>

              {/* Price */}
              <div className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[17px] text-white font-medium">
                      Price
                    </label>
                    <InfoTooltip
                      title="Price Negotiable"
                      content="When checked, the price will be hidden from clients. You can discuss and confirm the price directly with them."
                    />
                  </div>
                  {!priceNegotiable && (
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0.00"
                        className="w-24 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                      />
                    </div>
                  )}
                </div>
                {/* Price Negotiable Checkbox */}
                <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      priceNegotiable
                        ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30"
                        : "border-gray-500 bg-transparent group-hover:border-gray-400",
                    )}
                    onClick={() => setPriceNegotiable(!priceNegotiable)}
                  >
                    {priceNegotiable && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-[15px] text-gray-300 group-hover:text-white transition-colors">
                    Price negotiable
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Group 2: Location */}
        <div className="space-y-2">
          <h2 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider ml-4">
            Location & Details
          </h2>
          <div className="relative rounded-2xl overflow-hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white/10" />

            <div className="relative z-10 divide-y divide-white/5">
              {/* Location Type */}
              <div className="px-4 py-3.5">
                <div className="bg-black/30 p-1 rounded-xl flex border border-white/5">
                  <button
                    type="button"
                    onClick={() => setLocationType("physical")}
                    className={clsx(
                      "flex-1 py-2.5 px-4 rounded-lg text-[14px] font-semibold transition-all flex items-center justify-center gap-2",
                      locationType === "physical"
                        ? "bg-gradient-to-br from-white/20 to-white/10 text-white shadow-lg border border-white/10"
                        : "text-gray-400 hover:text-gray-300 hover:bg-white/5",
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    In Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType("online")}
                    className={clsx(
                      "flex-1 py-2.5 px-4 rounded-lg text-[14px] font-semibold transition-all flex items-center justify-center gap-2",
                      locationType === "online"
                        ? "bg-gradient-to-br from-white/20 to-white/10 text-white shadow-lg border border-white/10"
                        : "text-gray-400 hover:text-gray-300 hover:bg-white/5",
                    )}
                  >
                    <Video className="w-4 h-4" />
                    Online
                  </button>
                </div>
              </div>

              {/* Address/Link */}
              <div className="flex items-center px-4 py-3.5">
                <label className="w-28 text-[17px] text-white font-medium">
                  {locationType === "online" ? "Link" : "Address"}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder={
                    locationType === "online" ? "Zoom/Meet Link" : "123 Main St"
                  }
                  className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Group 3: Booking Settings */}
        <div className="space-y-2">
          <h2 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider ml-4">
            Booking Settings
          </h2>
          <div className="relative rounded-2xl overflow-hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white/10" />

            <div className="relative z-10">
              {/* Collapsed Preview / Expand Toggle */}
              <button
                type="button"
                onClick={() =>
                  setIsBookingSettingsExpanded(!isBookingSettingsExpanded)
                }
                className="w-full px-4 py-4 flex items-center justify-between active:bg-white/5 transition-colors"
              >
                <div className="text-left">
                  <div className="text-[15px] text-gray-200">
                    Buffer:{" "}
                    <span className="text-blue-400">
                      {getBufferDisplayText()}
                    </span>
                    <span className="text-gray-500 mx-2">·</span>
                    Cancel:{" "}
                    <span className="text-blue-400">
                      {getCancellationDisplayText()}
                    </span>
                  </div>
                  <div className="text-[13px] text-gray-500 mt-1">
                    Tap to customize for this service
                  </div>
                </div>
                <div
                  className={clsx(
                    "transition-all",
                    isBookingSettingsExpanded
                      ? "text-blue-400"
                      : "text-gray-400",
                  )}
                >
                  {isBookingSettingsExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {/* Expanded Settings */}
              {isBookingSettingsExpanded && (
                <div className="border-t border-white/5 px-4 py-3 space-y-4">
                  {/* Buffer Time - Compact Row */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] text-gray-300">
                          Buffer Time
                        </span>
                        <InfoTooltip
                          title="Buffer Time"
                          content="Buffer time is automatically reserved after each booking."
                        />
                      </div>
                      {bufferOption === -1 && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={customBuffer}
                            onChange={(e) =>
                              setCustomBuffer(parseInt(e.target.value) || 0)
                            }
                            className="w-14 bg-white/10 text-[14px] text-white px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                          />
                          <span className="text-[13px] text-gray-500">min</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {BUFFER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBufferOption(option.value)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95",
                            bufferOption === option.value
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-gray-300 hover:bg-white/15",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Cancellation Policy - Compact Row */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[15px] text-gray-300">
                        Cancellation
                      </span>
                      <InfoTooltip
                        title="Cancellation Policy"
                        content="This policy will be displayed on the booking page."
                      />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {CANCELLATION_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCancellationOption(option.value)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all active:scale-95",
                            cancellationOption === option.value
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-gray-300 hover:bg-white/15",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {cancellationOption === "custom" && (
                      <input
                        type="text"
                        value={customCancellation}
                        onChange={(e) => setCustomCancellation(e.target.value)}
                        placeholder="Enter custom policy..."
                        className="w-full mt-2 bg-white/10 text-[14px] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
