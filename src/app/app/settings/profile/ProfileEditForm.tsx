'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Camera, X } from 'lucide-react'
import { updateProfile, signOut } from '../actions'
import { createClient } from '@/utils/supabase/client'
import Cropper from 'react-easy-crop'
import getCroppedImg, { Area } from '@/utils/cropImage'
import SignOutConfirmDialog from '@/components/SignOutConfirmDialog'

export default function ProfileEditForm({ profile }: { profile: any }) {
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
    const [isSaving, setIsSaving] = useState(false)
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Crop state
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        setOriginalFile(file)
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string)
            setCropModalOpen(true)
        })
        reader.readAsDataURL(file)
    }

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels || !originalFile) return

        setUploading(true)
        try {
            // Get cropped image blob
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)

            // Upload to Supabase
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const fileExt = originalFile.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedBlob, {
                    upsert: true,
                    contentType: 'image/jpeg'
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            setAvatarUrl(publicUrl)
            setCropModalOpen(false)
            setImageSrc(null)
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload avatar')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        if (avatarUrl) {
            formData.append('avatar_url', avatarUrl)
        }
        await updateProfile(formData)
        setTimeout(() => {
            router.back()
        }, 300)
    }

    const handleSignOutClick = () => {
        setShowSignOutConfirm(true)
    }

    const handleConfirmSignOut = async () => {
        setIsSigningOut(true)
        try {
            await signOut()
            router.push('/login')
        } catch (error) {
            console.error('Sign out error:', error)
            setIsSigningOut(false)
            setShowSignOutConfirm(false)
        }
    }

    const handleCancelSignOut = () => {
        setShowSignOutConfirm(false)
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
                <div className="px-4 py-3 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-gray-800/50 rounded-lg transition-colors active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6 text-blue-500" />
                    </button>
                    <h1 className="flex-1 text-center text-[17px] font-semibold text-white -ml-10">Profile</h1>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="pb-safe">
                {/* Avatar Section */}
                <div className="flex flex-col items-center pt-8 pb-6 px-6">
                    <div className="relative group mb-2">
                        <label className="cursor-pointer block">
                            {avatarUrl || profile.avatar_url ? (
                                <img
                                    src={avatarUrl || profile.avatar_url}
                                    alt="Avatar"
                                    className="w-[120px] h-[120px] rounded-full object-cover shadow-2xl"
                                />
                            ) : (
                                <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[48px] font-semibold shadow-2xl">
                                    {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-[3px] border-black">
                                <Camera className="w-4 h-4 text-white" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <p className="text-[13px] text-gray-400 mt-1">Tap to change photo</p>
                </div>

                {/* Form Fields */}
                <div className="px-4 space-y-6">
                    {/* Display Name Card */}
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                        <div className="px-4 py-3">
                            <label className="block text-[13px] font-medium text-gray-400 mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                defaultValue={profile.full_name || ''}
                                className="w-full bg-transparent text-white text-[17px] placeholder:text-gray-500 focus:outline-none"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Username Card */}
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                        <div className="px-4 py-3">
                            <label className="block text-[13px] font-medium text-gray-400 mb-2">
                                Username
                            </label>
                            <div className="text-gray-500 text-[17px]">
                                @{profile.username}
                            </div>
                        </div>
                        <div className="px-4 pb-3">
                            <p className="text-[13px] text-gray-500">
                                Username cannot be changed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 mt-8 space-y-3">
                    <button
                        type="submit"
                        disabled={isSaving || uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[17px] font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isSaving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignOutClick}
                        className="w-full bg-[#1C1C1E] hover:bg-[#2C2C2E] active:bg-[#3C3C3E] text-red-500 text-[17px] font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Safe bottom padding */}
                <div className="h-8" />

            {/* Sign Out Confirmation Dialog */}
            <SignOutConfirmDialog
                isOpen={showSignOutConfirm}
                onClose={handleCancelSignOut}
                onConfirm={handleConfirmSignOut}
                isLoading={isSigningOut}
            />
            </form>

            {/* Crop Modal */}
            {cropModalOpen && imageSrc && (
                <div className="fixed inset-0 bg-black z-[60] flex flex-col">
                    <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setCropModalOpen(false)
                                    setImageSrc(null)
                                }}
                                className="text-blue-500 text-[17px] font-normal"
                            >
                                Cancel
                            </button>
                            <h3 className="text-[17px] font-semibold text-white">Edit Photo</h3>
                            <button
                                onClick={handleCropSave}
                                disabled={uploading}
                                className="text-blue-500 text-[17px] font-semibold disabled:opacity-50"
                            >
                                {uploading ? 'Saving...' : 'Done'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>

                    <div className="p-6 bg-black border-t border-gray-800/50">
                        <div className="mb-2">
                            <label className="block text-[13px] text-gray-400 mb-3 text-center">
                                Pinch to zoom
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                .slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    )
}
