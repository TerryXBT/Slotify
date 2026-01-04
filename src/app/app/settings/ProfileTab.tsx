'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, createService, updateService, deleteService } from './actions'
import { Plus, X, Copy, Check, Edit, Trash2, Share2, ChevronRight, MapPin, Video } from 'lucide-react'
import { createAvailabilityRule, updateAvailabilityRule, deleteAvailabilityRule } from './actions'
import clsx from 'clsx'

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
    const [editingService, setEditingService] = useState<string | null>(null)
    const [isCreatingService, setIsCreatingService] = useState(false)
    const [serviceLocationType, setServiceLocationType] = useState('physical')

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

    const handleShareService = (serviceId: string) => {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${profile.username}/${serviceId}`
        navigator.clipboard.writeText(link)
        setCopiedServiceId(serviceId)
        setTimeout(() => setCopiedServiceId(null), 2000)
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
                <Link
                    href="/app/settings/profile"
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors block"
                >
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
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
                </Link>
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

            {/* Availability Section - Link to dedicated page */}
            <div className="mt-6 border-t border-gray-800">
                <Link
                    href="/app/settings/availability"
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors block"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">Weekly Hours</h3>
                            {rulesByDay.every(d => d.rules.length === 0) && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-900/30 text-orange-400 rounded-full">
                                    Not Set
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage your weekly availability
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </Link>
            </div>

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

                            {/* Location Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Service Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setServiceLocationType('physical')}
                                        className={clsx(
                                            'p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                                            serviceLocationType === 'physical'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        )}
                                    >
                                        <MapPin className="w-4 h-4" />
                                        In-Person
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setServiceLocationType('online')}
                                        className={clsx(
                                            'p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                                            serviceLocationType === 'online'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        )}
                                    >
                                        <Video className="w-4 h-4" />
                                        Online
                                    </button>
                                </div>
                                <input type="hidden" name="location_type" value={serviceLocationType} />
                            </div>

                            {/* Location Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    {serviceLocationType === 'physical' ? 'Location' : 'Meeting Link'}
                                </label>
                                <input
                                    type="text"
                                    name="default_location"
                                    defaultValue={editingService ? services.find(s => s.id === editingService)?.default_location : ''}
                                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white"
                                    placeholder={serviceLocationType === 'physical' ? 'e.g., Downtown Studio, 123 Main St' : 'e.g., https://meet.google.com/...'}
                                />
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
