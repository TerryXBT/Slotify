"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateService, deleteService } from "../../../settings/actions";
import { MapPin, Video, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import InfoTooltip from "@/components/InfoTooltip";
import type { Service, Profile } from "@/types";

interface AvailabilitySettings {
  default_buffer_minutes?: number | null;
  default_cancellation_policy?: string | null;
}

interface EditServiceViewProps {
  service: Service;
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

export default function EditServiceView({
  service,
  profile: _profile,
  availabilitySettings,
}: EditServiceViewProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [locationType, setLocationType] = useState(
    service.location_type || "physical",
  );
  const [isActive, setIsActive] = useState(service.is_active ?? true);
  const [priceNegotiable, setPriceNegotiable] = useState(
    service.price_negotiable ?? false,
  );
  const [isBookingSettingsExpanded, setIsBookingSettingsExpanded] =
    useState(false);

  // Buffer time state
  const serviceBuffer = service.buffer_minutes;
  const defaultBuffer = availabilitySettings?.default_buffer_minutes ?? 0;
  const initialBuffer = serviceBuffer ?? defaultBuffer;
  const isCustomBuffer =
    !BUFFER_OPTIONS.slice(0, -1).some((o) => o.value === initialBuffer) &&
    initialBuffer !== 0;
  const [bufferOption, setBufferOption] = useState<number>(
    isCustomBuffer ? -1 : initialBuffer,
  );
  const [customBuffer, setCustomBuffer] = useState<number>(
    isCustomBuffer ? initialBuffer : 15,
  );

  // Cancellation policy state
  const serviceCancellation = service.cancellation_policy;
  const defaultCancellation =
    availabilitySettings?.default_cancellation_policy ?? "24h";
  const initialCancellation = serviceCancellation ?? defaultCancellation;
  const isCustomCancellation = !CANCELLATION_OPTIONS.slice(0, -1).some(
    (o) => o.value === initialCancellation,
  );
  const [cancellationOption, setCancellationOption] = useState<string>(
    isCustomCancellation ? "custom" : initialCancellation,
  );
  const [customCancellation, setCustomCancellation] = useState<string>(
    isCustomCancellation ? initialCancellation : "",
  );

  // Form state to track changes
  const [formData, setFormData] = useState({
    name: service.name,
    description: service.description || "",
    duration: service.duration_minutes,
    price: (service.price_cents ?? 0) / 100,
    address: service.default_location || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("duration", formData.duration.toString());
    data.append("price", formData.price.toString());
    data.append("price_negotiable", priceNegotiable.toString());
    data.append("location_type", locationType);
    data.append("default_location", formData.address);
    data.append("is_active", isActive ? "on" : "off");

    // Buffer time
    const finalBuffer = bufferOption === -1 ? customBuffer : bufferOption;
    data.append("buffer_minutes", finalBuffer.toString());

    // Cancellation policy
    const finalCancellation =
      cancellationOption === "custom" ? customCancellation : cancellationOption;
    data.append("cancellation_policy", finalCancellation);

    await updateService(service.id, data);
    setIsSaving(false);
    router.push("/app/services");
    router.refresh();
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this service? It will be moved to recently deleted.",
      )
    ) {
      return;
    }
    setIsDeleting(true);
    const res = await deleteService(service.id);
    if (res?.error) {
      alert(res.error);
      setIsDeleting(false);
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
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-4 pt-14 bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
        <Link href="/app/services" className="text-blue-500 text-[17px]">
          Cancel
        </Link>
        <h1 className="text-[17px] font-semibold">Edit Service</h1>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="text-blue-500 text-[17px] font-semibold disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Information */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative z-10 px-4 py-3 border-b border-white/10">
            <h2 className="text-[13px] text-gray-400 uppercase font-medium">
              Basic Information
            </h2>
          </div>

          <div className="relative z-10 divide-y divide-white/5">
            {/* Name */}
            <div className="flex items-center px-4 py-3">
              <label className="w-24 text-[17px] text-white">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Service Name"
                className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
              />
            </div>

            {/* Description */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[17px] text-white">Description</label>
                <span className="text-[13px] text-gray-500">Optional</span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your service..."
                rows={3}
                className="w-full bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none resize-none"
              />
            </div>

            {/* Duration */}
            <div className="flex items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <label className="text-[17px] text-white">Duration</label>
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
                  placeholder="60"
                  className="w-20 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                />
                <span className="text-[17px] text-white">min</span>
              </div>
            </div>

            {/* Price */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[17px] text-white">Price</label>
                  <InfoTooltip
                    title="Price Negotiable"
                    content="When checked, the price will be hidden from clients. You can discuss and confirm the price directly with them."
                  />
                </div>
                {!priceNegotiable && (
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] text-white">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-24 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                    />
                  </div>
                )}
              </div>
              {/* Price Negotiable Checkbox */}
              <label className="flex items-center gap-3 mt-3 cursor-pointer">
                <div
                  className={clsx(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                    priceNegotiable
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-600 bg-transparent",
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
                <span className="text-[15px] text-gray-300">
                  Price negotiable
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Location & Details */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative z-10 px-4 py-3 border-b border-white/10">
            <h2 className="text-[13px] text-gray-400 uppercase font-medium">
              Location & Details
            </h2>
          </div>

          <div className="relative z-10 divide-y divide-white/5">
            {/* Location Type */}
            <div className="px-4 py-3">
              <div className="bg-white/5 p-0.5 rounded-lg flex border border-white/10">
                <button
                  type="button"
                  onClick={() => setLocationType("physical")}
                  className={clsx(
                    "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
                    locationType === "physical"
                      ? "bg-[#3A3A3C] text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300",
                  )}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  In Person
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType("online")}
                  className={clsx(
                    "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
                    locationType === "online"
                      ? "bg-[#3A3A3C] text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300",
                  )}
                >
                  <Video className="w-3.5 h-3.5" />
                  Online
                </button>
              </div>
            </div>

            {/* Address/Link */}
            <div className="flex items-center px-4 py-3">
              <label className="w-24 text-[17px] text-white">
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

        {/* Booking Settings */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative z-10 px-4 py-3 border-b border-white/10">
            <h2 className="text-[13px] text-gray-400 uppercase font-medium">
              Booking Settings
            </h2>
          </div>

          <div className="relative z-10">
            {/* Collapsed Preview / Expand Toggle */}
            <button
              type="button"
              onClick={() =>
                setIsBookingSettingsExpanded(!isBookingSettingsExpanded)
              }
              className="w-full px-4 py-3 flex items-center justify-between active:bg-white/5 transition-colors"
            >
              <div className="text-left">
                <div className="text-[15px] text-gray-300">
                  Buffer: {getBufferDisplayText()} · Cancel:{" "}
                  {getCancellationDisplayText()}
                </div>
                <div className="text-[13px] text-gray-500 mt-0.5">
                  Tap to customize for this service
                </div>
              </div>
              {isBookingSettingsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Expanded Settings */}
            {isBookingSettingsExpanded && (
              <div className="divide-y divide-white/5 border-t border-white/5">
                {/* Buffer Time */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-[17px] text-white">
                      Buffer Time
                    </label>
                    <InfoTooltip
                      title="Buffer Time"
                      content="Buffer time is automatically reserved after each booking. For example, if you set a 30-minute buffer and have a booking from 9:00-10:00, the next available slot will start at 10:30."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {BUFFER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBufferOption(option.value)}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-[15px] font-medium transition-all",
                          bufferOption === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {bufferOption === -1 && (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        value={customBuffer}
                        onChange={(e) =>
                          setCustomBuffer(parseInt(e.target.value) || 0)
                        }
                        className="w-20 bg-black/50 text-[17px] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                      />
                      <span className="text-[17px] text-gray-300">minutes</span>
                    </div>
                  )}
                </div>

                {/* Cancellation Policy */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-[17px] text-white">
                      Cancellation Policy
                    </label>
                    <InfoTooltip
                      title="Cancellation Policy"
                      content="This policy will be displayed on the booking page so clients know the cancellation rules before booking."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CANCELLATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCancellationOption(option.value)}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-[15px] font-medium transition-all",
                          cancellationOption === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {cancellationOption === "custom" && (
                    <textarea
                      value={customCancellation}
                      onChange={(e) => setCustomCancellation(e.target.value)}
                      placeholder="Enter your custom cancellation policy..."
                      rows={2}
                      className="w-full mt-3 bg-black/50 text-[17px] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-600 border border-white/10"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <label className="text-[17px] text-white">Active</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={clsx(
                "w-[51px] h-[31px] rounded-full relative transition-colors duration-200 ease-in-out",
                isActive ? "bg-[#34C759]" : "bg-[#39393D]",
              )}
            >
              <span
                className={clsx(
                  "absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ease-in-out",
                  isActive ? "left-[22px]" : "left-[2px]",
                )}
              />
            </button>
          </div>
        </div>

        {/* Delete Button */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-[#FF3B30] text-[17px] font-normal active:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Service"}
          </button>
          <p className="text-[13px] text-gray-500">
            This service will be moved to Recently Deleted
          </p>
        </div>
      </div>
    </div>
  );
}
