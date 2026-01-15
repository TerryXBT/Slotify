'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signOut, updateProfile } from './actions'
import { User, Mail, Phone, MapPin, LogOut, Lock, Eye, EyeOff, Share2, Calendar as CalendarIcon, Clock, Briefcase, Camera, X } from 'lucide-react'
import SignOutConfirmDialog from '@/components/SignOutConfirmDialog'
import PushNotifications from '@/components/PushNotifications'
import DefaultBookingSettings from './DefaultBookingSettings'
import { createClient } from '@/utils/supabase/client'
import { toast } from '@/utils/toast'
import Cropper from 'react-easy-crop'
import getCroppedImg, { Area } from '@/utils/cropImage'
import type { Profile } from '@/types'

// Extended profile type for settings that includes UI-only fields
interface SettingsProfile extends Profile {
    email?: string | null  // May come from auth.users
    location?: string | null  // UI field, may need migration
}

interface AvailabilitySettings {
    default_buffer_minutes?: number | null
    default_cancellation_policy?: string | null
}

interface SettingsViewProps {
    profile: SettingsProfile
    availabilitySettings?: AvailabilitySettings | null
}

export default function SettingsView({ profile, availabilitySettings }: SettingsViewProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)

    // Password change state
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
            toast.error('File size must be less than 5MB')
            return
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
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
            toast.success('Avatar uploaded successfully')
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload avatar')
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
            toast.success('Profile saved successfully!')
            setIsEditing(false)
            router.refresh()
        } else {
            toast.error('Failed to save profile')
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
            toast.error('Failed to sign out. Please try again.')
            setIsSigningOut(false)
            setShowSignOutConfirm(false)
        }
    }

    const handleCancelSignOut = () => {
        setShowSignOutConfirm(false)
    }

    const handlePasswordChange = async () => {
        // Validation
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setIsChangingPassword(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            toast.success('Password updated successfully!')
            setShowPasswordDialog(false)
            setNewPassword('')
            setConfirmPassword('')
            setShowNewPassword(false)
            setShowConfirmPassword(false)
        } catch (error: unknown) {
            console.error('Password change error:', error)
            const message = error instanceof Error ? error.message : 'Failed to update password'
            toast.error(message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#1a1a1a] pb-24">
            {/* Header */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                </div>
            </div>

            {/* Profile Section */}
            <div className="relative mt-4 mx-4 rounded-2xl overflow-hidden">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />

                <div className="relative z-10 px-4 py-3 border-b border-white/10 flex items-center justify-between">
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
                    <form onSubmit={handleProfileSubmit} className="relative z-10 p-4 space-y-4">
                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <label className="cursor-pointer block">
                                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        {avatarUrl || profile.avatar_url ? (
                                            <Image
                                                src={avatarUrl || profile.avatar_url || ''}
                                                alt={profile.full_name || 'Avatar'}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                                unoptimized={avatarUrl?.startsWith('blob:') || avatarUrl?.startsWith('data:')}
                                            />
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
                    <div className="relative z-10 p-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.full_name || 'Avatar'}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                    />
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

            {/* Notifications Section */}
            <div className="mt-4 mx-4">
                <PushNotifications />
            </div>

            {/* Default Booking Settings */}
            <DefaultBookingSettings availabilitySettings={availabilitySettings} />

            {/* Quick Actions */}
            <div className="relative mt-4 mx-4 rounded-2xl overflow-hidden">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />

                <div className="relative z-10 px-4 py-3 border-b border-white/10">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h2>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-3 p-4">
                    <a
                        href={`/${profile?.username || profile?.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                            <Share2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-white text-center">Share Booking Page</span>
                    </a>

                    <Link
                        href="/app/week"
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                            <CalendarIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold text-white text-center">View Calendar</span>
                    </Link>

                    <Link
                        href="/app/settings/availability"
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                            <Clock className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-xs font-semibold text-white text-center">Set Hours</span>
                    </Link>

                    <Link
                        href="/app/services"
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                            <Briefcase className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-xs font-semibold text-white text-center">Manage Services</span>
                    </Link>
                </div>
            </div>

            {/* Account Section */}
            <div className="relative mt-4 mx-4 rounded-2xl overflow-hidden">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />

                <div className="relative z-10 px-4 py-3 border-b border-white/10">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</h2>
                </div>
                <button
                    onClick={() => setShowPasswordDialog(true)}
                    className="relative z-10 w-full px-4 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-white border-b border-white/10"
                >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Change Password</span>
                </button>
                <button
                    onClick={handleSignOutClick}
                    className="relative z-10 w-full px-4 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-red-500"
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

            {/* Change Password Dialog */}
            {showPasswordDialog && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={() => !isChangingPassword && setShowPasswordDialog(false)}
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="relative rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                            {/* Glassmorphism Background for Modal */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                            <div className="absolute inset-0 rounded-3xl border border-white/20" />

                            {/* Header */}
                            <div className="relative z-10 bg-gradient-to-r from-blue-600 to-blue-500 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <Lock className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Change Password</h3>
                                    </div>
                                    <button
                                        onClick={() => !isChangingPassword && setShowPasswordDialog(false)}
                                        className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                                        disabled={isChangingPassword}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-blue-100 text-sm mt-3">
                                    Create a strong password with at least 6 characters
                                </p>
                            </div>

                            {/* Body */}
                            <div className="relative z-10 p-6 space-y-5">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3.5 pr-12 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            disabled={isChangingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
                                            disabled={isChangingPassword}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {newPassword && newPassword.length < 6 && (
                                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                            <span>⚠</span>
                                            <span>Password must be at least 6 characters</span>
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3.5 pr-12 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            disabled={isChangingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
                                            disabled={isChangingPassword}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                            <span>⚠</span>
                                            <span>Passwords do not match</span>
                                        </p>
                                    )}
                                    {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                            <span>✓</span>
                                            <span>Passwords match</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="relative z-10 px-6 pb-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowPasswordDialog(false)
                                        setNewPassword('')
                                        setConfirmPassword('')
                                        setShowNewPassword(false)
                                        setShowConfirmPassword(false)
                                    }}
                                    disabled={isChangingPassword}
                                    className="flex-1 px-4 py-3.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-blue-500/25"
                                >
                                    {isChangingPassword ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Updating...
                                        </span>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

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
