'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateProfile, signOut, createService, updateService, deleteService } from './actions'
import { Plus, X, Copy, Check, Edit, Trash2, Share2, ChevronRight, Camera, Upload } from 'lucide-react'
import { createAvailabilityRule, updateAvailabilityRule, deleteAvailabilityRule } from './actions'
import { createClient } from '@/utils/supabase/client'
import Cropper from 'react-easy-crop'
import getCroppedImg, { Area } from '@/utils/cropImage'

// Monday-first order
const DAYS = [
    { id: 1, label: 'Monday', short: 'M' },
    { id: 2, label: 'Tuesday', short: 'T' },
    { id: 3, label: 'Wednesday', short: 'W' },
    { id: 4, label: 'Thursday', short: 'T' },
    { id: 5, label: 'Friday', short: 'F' },
    { id: 6, label: 'Saturday', short: 'S' },
    { id: 0, label: 'Sunday', short: 'S' },
]

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            const period = hour < 12 ? 'am' : 'pm'
            const minuteStr = minute.toString().padStart(2, '0')
            const hourStr = hour.toString().padStart(2, '0')
            const time24 = `${hourStr}:${minuteStr}`
            const timeLabel = `${h}:${minuteStr} ${period}`
            options.push({ value: time24, label: timeLabel })
        }
    }
    return options
}

const TIME_OPTIONS = generateTimeOptions()

interface AvailabilityRule {
    id: string
    day_of_week: number
    start_time_local: string
    end_time_local: string
}

interface LocalRule {
    id: string | null
    day_of_week: number
    start_time: string
    end_time: string
}

export default function ProfileTab({ profile, services, availabilityRules }: { profile: any, services: any[], availabilityRules: AvailabilityRule[] }) {
    const router = useRouter()
    const [showSuccess, setShowSuccess] = useState(false)
    const [copiedServiceId, setCopiedServiceId] = useState<string | null>(null)
    const [editingProfile, setEditingProfile] = useState(false)
    const [editingService, setEditingService] = useState<string | null>(null)
    const [isCreatingService, setIsCreatingService] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')

    // Crop state
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [originalFile, setOriginalFile] = useState<File | null>(null)

    // Availability state
    const [localRules, setLocalRules] = useState<LocalRule[]>(
        availabilityRules.map(r => ({
            id: r.id,
            day_of_week: r.day_of_week,
            start_time: r.start_time_local.slice(0, 5),
            end_time: r.end_time_local.slice(0, 5)
        }))
    )

    const [copyModalOpen, setCopyModalOpen] = useState(false)
    const [copySourceDay, setCopySourceDay] = useState<number | null>(null)
    const [selectedDays, setSelectedDays] = useState<number[]>([])

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleShareService = (serviceId: string) => {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${profile.username}/${serviceId}`
        navigator.clipboard.writeText(link)
        setCopiedServiceId(serviceId)
        setTimeout(() => setCopiedServiceId(null), 2000)
    }

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

    const handleAddDay = (dayOfWeek: number) => {
        setLocalRules([...localRules, {
            id: null,
            day_of_week: dayOfWeek,
            start_time: '08:00',
            end_time: '20:00'
        }])
    }

    const handleDeleteRule = async (index: number) => {
        const rule = localRules[index]
        if (rule.id) {
            await deleteAvailabilityRule(rule.id)
        }
        setLocalRules(localRules.filter((_, i) => i !== index))
        router.refresh()
    }

    const handleTimeChange = async (index: number, field: 'start_time' | 'end_time', value: string) => {
        const newRules = [...localRules]
        newRules[index][field] = value
        setLocalRules(newRules)

        const rule = newRules[index]
        const formData = new FormData()
        formData.append('start_time', rule.start_time)
        formData.append('end_time', rule.end_time)

        if (rule.id === null) {
            formData.append('day_of_week', rule.day_of_week.toString())
            const result = await createAvailabilityRule(formData)
            if (result.success) {
                router.refresh()
            }
        } else {
            await updateAvailabilityRule(rule.id, formData)
        }
    }

    const openCopyModal = (dayOfWeek: number) => {
        setCopySourceDay(dayOfWeek)
        setSelectedDays([])
        setCopyModalOpen(true)
    }

    const handleApplyCopy = async () => {
        if (copySourceDay === null) return

        const sourceRules = localRules.filter(r => r.day_of_week === copySourceDay)

        for (const day of selectedDays) {
            const existingRules = localRules.filter(r => r.day_of_week === day)
            for (const rule of existingRules) {
                if (rule.id) {
                    await deleteAvailabilityRule(rule.id)
                }
            }

            for (const sourceRule of sourceRules) {
                const formData = new FormData()
                formData.append('day_of_week', day.toString())
                formData.append('start_time', sourceRule.start_time)
                formData.append('end_time', sourceRule.end_time)
                await createAvailabilityRule(formData)
            }
        }

        setCopyModalOpen(false)
        router.refresh()
    }

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        if (avatarUrl) {
            formData.append('avatar_url', avatarUrl)
        }
        await updateProfile(formData)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        setEditingProfile(false)
        router.refresh()
    }

    const handleServiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        if (editingService) {
            await updateService(editingService, formData)
            setEditingService(null)
        } else {
            await createService(formData)
            setIsCreatingService(false)
        }
        router.refresh()
    }

    const handleDeleteService = async (id: string) => {
        if (confirm('Are you sure you want to delete this service?')) {
            await deleteService(id)
            router.refresh()
        }
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    const rulesByDay = DAYS.map(day => ({
        ...day,
        rules: localRules.filter(r => r.day_of_week === day.id)
    }))

    return (
        <div className="max-w-2xl mx-auto pb-24">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Saved successfully!</span>
                </div>
            )}

            {/* Profile Section - Clickable */}
            <div className="mt-6">
                <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors"
                >
                    {avatarUrl || profile.avatar_url ? (
                        <img
                            src={avatarUrl || profile.avatar_url}
                            alt="Avatar"
                            className="w-16 h-16 rounded-full object-cover shadow-md"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                            {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 text-left">
                        <h2 className="text-xl font-semibold text-white">
                            {profile.full_name || profile.username}
                        </h2>
                        <p className="text-sm text-gray-400">@{profile.username}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Booking Page Section */}
            <div className="mt-6 border-t border-gray-800">
                <Link
                    href="/app/settings/booking-page"
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors block"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">Booking Page</h3>
                            {(!profile.bio || (!profile.location && !profile.phone && !profile.email)) && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-900/30 text-orange-400 rounded-full">
                                    Incomplete
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Customize your public booking page</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>
            </div>

            {/* Services Section */}
            <div className="mt-6">
                <div className="px-6 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Services</h3>
                </div>

                {services.length > 0 && services.map((service, index) => (
                    <div key={service.id} className={index > 0 ? 'border-t border-gray-800' : ''}>
                        <div className="px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{service.name}</p>
                                <p className="text-sm text-gray-400">
                                    {service.duration_minutes} min · ${(service.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleShareService(service.id)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Share booking link"
                                >
                                    {copiedServiceId === service.id ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Share2 className="w-4 h-4 text-blue-500" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingService(service.id)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Edit service"
                                >
                                    <Edit className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Delete service"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="px-6 py-4 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={() => setIsCreatingService(true)}
                        className="flex items-center gap-2 text-blue-500 font-medium hover:text-blue-400 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Service
                    </button>
                </div>
            </div>

            {/* Availability Section */}
            <div className="mt-6">
                <div className="px-6 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weekly Hours</h3>
                </div>

                {rulesByDay.map((day, index) => (
                    <div key={day.id} className={index > 0 ? 'border-t border-gray-800' : ''}>
                        <div className="px-6 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-white font-medium w-24">{day.label}</span>
                                <div className="flex-1">
                                    {day.rules.length === 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => handleAddDay(day.id)}
                                            className="text-gray-500 text-sm hover:text-blue-500 transition-colors"
                                        >
                                            Unavailable
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            {day.rules.map((rule, ruleIndex) => {
                                                const globalIndex = localRules.indexOf(rule)
                                                return (
                                                    <div key={globalIndex} className="flex items-center gap-2">
                                                        <select
                                                            value={rule.start_time}
                                                            onChange={(e) => handleTimeChange(globalIndex, 'start_time', e.target.value)}
                                                            className="px-2 py-1 text-sm bg-gray-900 border border-gray-800 rounded-lg text-white"
                                                        >
                                                            {TIME_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>

                                                        <span className="text-gray-600 text-sm">-</span>

                                                        <select
                                                            value={rule.end_time}
                                                            onChange={(e) => handleTimeChange(globalIndex, 'end_time', e.target.value)}
                                                            className="px-2 py-1 text-sm bg-gray-900 border border-gray-800 rounded-lg text-white"
                                                        >
                                                            {TIME_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRule(globalIndex)}
                                                            className="p-1 hover:bg-gray-800 rounded transition-colors"
                                                        >
                                                            <X className="w-4 h-4 text-gray-500" />
                                                        </button>

                                                        {ruleIndex === 0 && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddDay(day.id)}
                                                                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4 text-gray-500" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openCopyModal(day.id)}
                                                                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                                                                >
                                                                    <Copy className="w-4 h-4 text-gray-500" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sign Out */}
            <div className="mt-6 border-t border-gray-800">
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-6 py-4 text-red-500 font-medium text-left hover:bg-gray-900/50 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* Crop Modal */}
            {cropModalOpen && imageSrc && (
                <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-lg font-bold text-white">Adjust Photo</h3>
                        <button
                            onClick={() => {
                                setCropModalOpen(false)
                                setImageSrc(null)
                            }}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
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

                    <div className="p-6 border-t border-gray-800">
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handleCropSave}
                            disabled={uploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {uploading ? 'Uploading...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Profile Edit Modal */}
            {editingProfile && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Edit Profile</h3>

                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group">
                                    {avatarUrl || profile.avatar_url ? (
                                        <img
                                            src={avatarUrl || profile.avatar_url}
                                            alt="Avatar"
                                            className="w-20 h-20 rounded-full object-cover shadow-md"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                            {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Click to upload photo
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    defaultValue={profile.full_name || ''}
                                    className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your display name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                                <div className="px-4 py-3 border border-gray-700 rounded-xl bg-gray-900/50 text-gray-500">
                                    @{profile.username}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Username cannot be changed (used in booking URLs)</p>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Booking Page Information</h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                                        <textarea
                                            name="bio"
                                            defaultValue={profile.bio || ''}
                                            maxLength={200}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="Tell clients about yourself (max 200 chars)"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                                            <input
                                                type="text"
                                                name="location"
                                                defaultValue={profile.location || ''}
                                                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="City"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                defaultValue={profile.phone || ''}
                                                className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Phone number"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            defaultValue={profile.email || ''}
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="contact@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Cancellation Policy</label>
                                        <textarea
                                            name="cancellation_policy"
                                            defaultValue={profile.cancellation_policy || ''}
                                            maxLength={500}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="e.g., Cancel 24 hours before for free, otherwise 50% charge"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingProfile(false)
                                        setAvatarUrl(profile.avatar_url || '')
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service Modal */}
            {(isCreatingService || editingService) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {editingService ? 'Edit Service' : 'New Service'}
                        </h3>

                        <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingService ? services.find(s => s.id === editingService)?.name : ''}
                                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    placeholder="e.g., 30 Minute Meeting"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        name="duration"
                                        required
                                        defaultValue={editingService ? services.find(s => s.id === editingService)?.duration_minutes : '30'}
                                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        step="0.01"
                                        defaultValue={editingService ? (services.find(s => s.id === editingService)?.price_cents / 100).toFixed(2) : '0'}
                                        className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreatingService(false)
                                        setEditingService(null)
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingService ? 'Save' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Copy Modal */}
            {copyModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Copy times to...</h3>

                        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
                            {DAYS.map(day => (
                                <label key={day.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-800 p-3 rounded-lg transition-colors">
                                    <span className="text-white">{day.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedDays([...selectedDays, day.id])
                                            } else {
                                                setSelectedDays(selectedDays.filter(d => d !== day.id))
                                            }
                                        }}
                                        className="w-5 h-5 rounded"
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setCopyModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyCopy}
                                disabled={selectedDays.length === 0}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}
