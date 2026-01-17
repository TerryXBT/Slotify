"use client";

import { useState, useRef } from "react";
import { User, Camera, X } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import Cropper, { Area } from "react-easy-crop";
import type { Profile } from "@/types";
import { updateProfileOnboarding, uploadAvatarOnboarding } from "../actions";
import getCroppedImg from "@/utils/cropImage";

interface ProfileStepProps {
  profile: Profile;
  onNext: () => void;
  isPreviewMode?: boolean;
}

export default function ProfileStep({
  profile,
  onNext,
  isPreviewMode = false,
}: ProfileStepProps) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      if (!isPreviewMode) {
        const formData = new FormData();
        formData.append("file", croppedBlob, "avatar.jpg");
        const result = await uploadAvatarOnboarding(formData);
        if (result.error) {
          console.error("Avatar upload error:", result.error);
          setError(result.error);
          setImageSrc(null);
          return;
        }
        if (result.url) {
          setAvatarUrl(result.url);
        }
      } else {
        // In preview mode, just show the cropped image locally
        setAvatarUrl(URL.createObjectURL(croppedBlob));
      }

      setImageSrc(null);
    } catch (err) {
      console.error("Error cropping image:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // In preview mode, just proceed without saving
    if (isPreviewMode) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("bio", bio);
    if (avatarUrl) {
      formData.append("avatar_url", avatarUrl);
    }

    const result = await updateProfileOnboarding(formData);

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

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        {/* Glass Icon - Apple Style */}
        <div className="w-16 h-16 rounded-[18px] mx-auto mb-4 relative overflow-hidden bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2" />
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-8 h-8 text-white/80" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Set up your profile</h1>
        <p className="text-gray-400">
          This is what clients will see when booking
        </p>
      </div>

      {/* Form */}
      <div className={clsx(glassCard, "p-5 mb-6")}>
        <div className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-white/[0.12] to-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center text-3xl font-bold text-white/60">
                  {fullName?.[0]?.toUpperCase() ||
                    profile.username[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-gray-500 text-xs mt-2">Tap to upload photo</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              Your Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
              Short Bio{" "}
              <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients a bit about yourself..."
              rows={3}
              className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all resize-none"
            />
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
        disabled={isSubmitting}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          "Continue"
        )}
      </button>

      <button
        onClick={handleSkipStep}
        className="w-full text-gray-500 py-3 font-medium text-sm mt-2 active:opacity-70 transition-opacity"
      >
        Skip for now
      </button>

      {/* Crop Modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={() => setImageSrc(null)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-white font-medium">Adjust Photo</span>
            <button
              onClick={handleCropSave}
              disabled={isUploading}
              className="text-blue-500 font-semibold disabled:opacity-50"
            >
              {isUploading ? "..." : "Done"}
            </button>
          </div>
          <div className="flex-1 relative">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="p-6">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
