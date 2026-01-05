'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, createService, updateService, toggleServiceActive, deleteService, restoreService, permanentlyDeleteService } from './actions'
import { Plus, X, Copy, Check, Edit, Trash2, Share2, ChevronRight, MapPin, Video, Undo2, AlertTriangle, ChevronDown } from 'lucide-react'
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

export default function ProfileTab({ profile, services, deletedServices, availabilityRules }: { profile: any, services: any[], deletedServices: any[], availabilityRules: AvailabilityRule[] }) {
    const router = useRouter()
    const [showSuccess, setShowSuccess] = useState(false)
    const [copiedServiceId, setCopiedServiceId] = useState<string | null>(null)
    const [editingService, setEditingService] = useState<string | null>(null)
    const [isCreatingService, setIsCreatingService] = useState(false)
    const [serviceLocationType, setServiceLocationType] = useState('physical')
    const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null)
    // Local state for service active status (optimistic updates)
    const [localServices, setLocalServices] = useState(services.map(s => ({ ...s, is_active: s.is_active ?? true })))
    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({ isOpen: false, serviceId: null, serviceName: '' })
    const [isDeleting, setIsDeleting] = useState(false)
    // Trash section state
    const [showTrash, setShowTrash] = useState(false)
    const [permanentDeleteModal, setPermanentDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({ isOpen: false, serviceId: null, serviceName: '' })
    const [isRestoringId, setIsRestoringId] = useState<string | null>(null)
    const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false)

    // Sync local state with server data when props change (after router.refresh())
    useEffect(() => {
        setLocalServices(services.map(s => ({ ...s, is_active: s.is_active ?? true })))
    }, [services])

    const handleToggleActive = async (serviceId: string, currentState: boolean) => {
        setTogglingServiceId(serviceId)
        // Optimistic update
        setLocalServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: !currentState } : s))
        const result = await toggleServiceActive(serviceId, !currentState)
        if (result.error) {
            // Revert on error
            setLocalServices(prev => prev.map(s => s.id === serviceId ? { ...s, is_active: currentState } : s))
            alert(result.error)
        }
        setTogglingServiceId(null)
        router.refresh()
    }

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

    const openDeleteModal = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, serviceId: id, serviceName: name })
    }

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, serviceId: null, serviceName: '' })
    }

    const confirmDeleteService = async () => {
        if (!deleteModal.serviceId) return
        setIsDeleting(true)

        const res = await deleteService(deleteModal.serviceId)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            // Update local state
            setLocalServices(prev => prev.filter(s => s.id !== deleteModal.serviceId))
            router.refresh()
        }
        setIsDeleting(false)
        closeDeleteModal()
    }

    // Restore service from trash
    const handleRestoreService = async (id: string) => {
        setIsRestoringId(id)
        const res = await restoreService(id)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            router.refresh()
        }
        setIsRestoringId(null)
    }

    // Open permanent delete modal
    const openPermanentDeleteModal = (id: string, name: string) => {
        setPermanentDeleteModal({ isOpen: true, serviceId: id, serviceName: name })
    }

    const closePermanentDeleteModal = () => {
        setPermanentDeleteModal({ isOpen: false, serviceId: null, serviceName: '' })
    }

    // Permanently delete service and all related bookings
    const confirmPermanentDelete = async () => {
        if (!permanentDeleteModal.serviceId) return
        setIsPermanentlyDeleting(true)

        const res = await permanentlyDeleteService(permanentDeleteModal.serviceId)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            router.refresh()
        }
        setIsPermanentlyDeleting(false)
        closePermanentDeleteModal()
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

                {localServices.length > 0 && localServices.map((service, index) => (
                    <div key={service.id} className={clsx(
                        index > 0 ? 'border-t border-gray-800' : '',
                        !service.is_active && 'opacity-50'
                    )}>
                        <div className="px-6 py-4 flex items-center gap-4 hover:bg-gray-900/50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-white">{service.name}</p>
                                    {!service.is_active && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-400 rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">
                                    {service.duration_minutes} min · ${(service.price_cents / 100).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Active Toggle */}
                                <button
                                    type="button"
                                    onClick={() => handleToggleActive(service.id, service.is_active)}
                                    disabled={togglingServiceId === service.id}
                                    className={clsx(
                                        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                                        service.is_active ? 'bg-green-600' : 'bg-gray-700',
                                        togglingServiceId === service.id && 'opacity-50 cursor-not-allowed'
                                    )}
                                    title={service.is_active ? 'Click to deactivate' : 'Click to activate'}
                                >
                                    <span className={clsx(
                                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                                        service.is_active && 'translate-x-5'
                                    )} />
                                </button>
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
                                    onClick={() => openDeleteModal(service.id, service.name)}
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

            {/* Deleted Services (Trash) */}
            {deletedServices.length > 0 && (
                <div className="mt-2 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={() => setShowTrash(!showTrash)}
                        className="w-full px-6 py-4 flex items-center justify-between text-gray-400 hover:bg-gray-900/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Recently Deleted</span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-400 rounded-full">
                                {deletedServices.length}
                            </span>
                        </div>
                        <ChevronDown className={clsx("w-4 h-4 transition-transform", showTrash && "rotate-180")} />
                    </button>

                    {showTrash && (
                        <div className="px-6 pb-4 space-y-2">
                            {deletedServices.map((service: any) => (
                                <div
                                    key={service.id}
                                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800/50"
                                >
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400 line-through">{service.name}</h4>
                                        <p className="text-xs text-gray-500">
                                            Deleted {new Date(service.deleted_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleRestoreService(service.id)}
                                            disabled={isRestoringId === service.id}
                                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Restore"
                                        >
                                            {isRestoringId === service.id ? (
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Undo2 className="w-4 h-4 text-blue-400" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openPermanentDeleteModal(service.id, service.name)}
                                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Delete permanently"
                                        >
                                            <X className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDeleteModal} />
                    <div className="relative bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Service?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                <span className="font-medium text-white">"{deleteModal.serviceName}"</span> will be moved to Recently Deleted. You can restore it later or delete it permanently.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteService}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Modal */}
            {permanentDeleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closePermanentDeleteModal} />
                    <div className="relative bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Permanently Delete?</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Are you sure you want to permanently delete <span className="font-medium text-white">"{permanentDeleteModal.serviceName}"</span>?
                            </p>
                            <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 mb-6">
                                <p className="text-red-400 text-xs">
                                    ⚠️ This will also delete <strong>all bookings</strong> associated with this service. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closePermanentDeleteModal}
                                disabled={isPermanentlyDeleting}
                                className="flex-1 px-4 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmPermanentDelete}
                                disabled={isPermanentlyDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                                {isPermanentlyDeleting ? 'Deleting...' : 'Delete Forever'}
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
