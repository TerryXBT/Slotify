'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, updateProfile } from './actions'
import { User, Mail, Phone, MapPin, LogOut, ChevronRight } from 'lucide-react'

export default function SettingsView({ profile }: { profile: any }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateProfile(formData)
        if (res?.success) {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
            setIsEditing(false)
            router.refresh()
        }
        setIsSaving(false)
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
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
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name || 'Avatar'} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    name="avatar_url"
                                    defaultValue={profile.avatar_url || ''}
                                    placeholder="Avatar URL"
                                    className="w-full px-3 py-2 bg-black rounded-xl text-sm text-white placeholder-gray-500"
                                />
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
                                disabled={isSaving}
                                className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
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
                    onClick={handleSignOut}
                    className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-900/50 transition-colors text-red-500"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    )
}
