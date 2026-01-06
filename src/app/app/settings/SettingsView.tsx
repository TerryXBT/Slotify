'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updateProfile } from './actions'
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Camera, X } from 'lucide-react'
import SignOutConfirmDialog from '@/components/SignOutConfirmDialog'
import { createClient } from '@/utils/supabase/client'
import Cropper from 'react-easy-crop'
import getCroppedImg, { Area } from '@/utils/cropImage'

export default function SettingsView({ profile }: { profile: any }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Avatar upload state
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
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

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        if (avatarUrl) {
            formData.append('avatar_url', avatarUrl)
        }
        const res = await updateProfile(formData)
        if (res?.success) {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
            setIsEditing(false)
            router.refresh()
        }
        setIsSaving(false)
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
        <div className="flex flex-col min-h-screen bg-black pb-24">
            {/* Header */}
            <div className="bg-[#1C1C1E] border-b border-gray-800">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium z-50 shadow-lg">
                    Profile saved!
                </div>
            )}

            {/* Profile Section */}
            <div className="bg-[#1C1C1E] mt-4 mx-4 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-500 text-sm font-medium"
                        >
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleProfileSubmit} className="p-4 space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <label className="cursor-pointer block">
                                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {avatarUrl || profile.avatar_url ? (
                                            <img src={avatarUrl || profile.avatar_url} alt={profile.full_name || 'Avatar'} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1C1C1E]">
                                        <Camera className="w-3 h-3 text-white" />
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
                            <div className="flex-1">
                                <p className="text-xs text-gray-400">Tap to change photo</p>
                                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                            <input
                                name="full_name"
                                defaultValue={profile.full_name || ''}
                                placeholder="Your name"
                                className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500"
                                required
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                            <textarea
                                name="bio"
                                defaultValue={profile.bio || ''}
                                placeholder="Tell clients about yourself..."
                                rows={3}
                                className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500 resize-none"
                            />
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={profile.email || ''}
                                    placeholder="email@example.com"
                                    className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                                <input
                                    name="phone"
                                    defaultValue={profile.phone || ''}
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Location</label>
                            <input
                                name="location"
                                defaultValue={profile.location || ''}
                                placeholder="City, Country"
                                className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 bg-gray-700 rounded-xl text-sm font-medium text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || uploading}
                                className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-gray-500" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{profile.full_name || 'No name'}</h3>
                                <p className="text-sm text-gray-400">@{profile.username || profile.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        {profile.bio && (
                            <p className="text-sm text-gray-300 mb-4">{profile.bio}</p>
                        )}
                        <div className="space-y-2 text-sm text-gray-400">
                            {profile.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Account Section */}
            <div className="bg-[#1C1C1E] mt-4 mx-4 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</h2>
                </div>
                <button
                    onClick={handleSignOutClick}
                    className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-900/50 transition-colors text-red-500"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>

            {/* Sign Out Confirmation Dialog */}
            <SignOutConfirmDialog
                isOpen={showSignOutConfirm}
                onClose={handleCancelSignOut}
                onConfirm={handleConfirmSignOut}
                isLoading={isSigningOut}
            />

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
