'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createService, restoreService, permanentlyDeleteService } from '../settings/actions'
import { Plus, Share2, Trash2, Undo2, X, ChevronDown, AlertTriangle, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface AvailabilityRule {
    id: string
    day_of_week: number
    start_time_local: string
    end_time_local: string
}

const DAYS = [
    { id: 1, label: 'Monday', short: 'Mon' },
    { id: 2, label: 'Tuesday', short: 'Tue' },
    { id: 3, label: 'Wednesday', short: 'Wed' },
    { id: 4, label: 'Thursday', short: 'Thu' },
    { id: 5, label: 'Friday', short: 'Fri' },
    { id: 6, label: 'Saturday', short: 'Sat' },
    { id: 0, label: 'Sunday', short: 'Sun' },
]

export default function ServicesView({ profile, services, deletedServices, availabilityRules }: {
    profile: any,
    services: any[],
    deletedServices: any[],
    availabilityRules: AvailabilityRule[]
}) {
    const router = useRouter()
    const [isCreatingService, setIsCreatingService] = useState(false)
    const [localServices, setLocalServices] = useState(services)

    // Trash state
    const [showTrash, setShowTrash] = useState(false)
    const [permanentDeleteModal, setPermanentDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({ isOpen: false, serviceId: null, serviceName: '' })
    const [isRestoringId, setIsRestoringId] = useState<string | null>(null)
    const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false)

    // Sync with server data
    useEffect(() => {
        setLocalServices(services)
    }, [services])

    // Get rules by day for display
    const rulesByDay = DAYS.map(day => ({
        ...day,
        rules: availabilityRules.filter(r => r.day_of_week === day.id)
    }))

    // Share service link
    const handleShare = async (e: React.MouseEvent, service: any) => {
        e.stopPropagation() // Prevent row click
        const url = `${window.location.origin}/${profile?.username || profile?.id}?service=${service.id}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: service.name,
                    text: `Book ${service.name}`,
                    url: url
                })
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(url)
            alert('Link copied to clipboard!')
        }
    }

    // Navigate to edit page
    const handleServiceClick = (serviceId: string) => {
        router.push(`/app/services/${serviceId}/edit`)
    }

    // Create new service
    const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        await createService(formData)
        setIsCreatingService(false)
        router.refresh()
    }

    // Restore service
    const handleRestoreService = async (id: string) => {
        setIsRestoringId(id)
        const res = await restoreService(id)
        if (res?.error) {
            alert(res.error)
        } else {
            router.refresh()
        }
        setIsRestoringId(null)
    }

    // Permanent delete handlers
    const openPermanentDeleteModal = (id: string, name: string) => {
        setPermanentDeleteModal({ isOpen: true, serviceId: id, serviceName: name })
    }

    const closePermanentDeleteModal = () => {
        setPermanentDeleteModal({ isOpen: false, serviceId: null, serviceName: '' })
    }

    const confirmPermanentDelete = async () => {
        if (!permanentDeleteModal.serviceId) return
        setIsPermanentlyDeleting(true)
        const res = await permanentlyDeleteService(permanentDeleteModal.serviceId)
        if (res?.error) {
            alert(res.error)
        } else {
            router.refresh()
        }
        setIsPermanentlyDeleting(false)
        closePermanentDeleteModal()
    }

    return (
        <div className="flex flex-col min-h-screen bg-black pb-24 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <div className="px-5 pt-16 pb-6 flex items-center justify-between">
                <h1 className="text-[34px] font-bold text-white tracking-tight leading-tight">Services</h1>
                <Link
                    href="/app/services/new"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 active:scale-95 transition-transform hover:bg-blue-500"
                >
                    <Plus className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-[15px]">Add Service</span>
                </Link>
            </div>

            <main className="px-5 space-y-8">
                {/* GROUP 1: Services List */}
                <section>
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden divide-y divide-gray-800/80">
                        {localServices.length > 0 ? (
                            localServices.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => handleServiceClick(service.id)}
                                    className="flex items-center justify-between px-4 py-4 active:bg-gray-800/50 cursor-pointer group transition-colors"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={clsx(
                                                "text-[17px] font-medium leading-tight",
                                                service.is_active ? "text-white" : "text-gray-500"
                                            )}>
                                                {service.name}
                                            </h3>
                                            {!service.is_active && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-500 uppercase tracking-wide">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[15px] text-gray-500 font-normal">
                                            {service.duration_minutes} min • ${(service.price_cents / 100).toFixed(0)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                </div>
                            ))
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center">
                                <p className="text-gray-500 font-medium">No services yet</p>
                                <Link href="/app/services/new" className="mt-2 text-blue-500 text-sm font-semibold">
                                    Create your first service
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* GROUP 2: Business Profile */}
                <section>
                    <h2 className="text-[13px] text-gray-500 uppercase font-medium ml-4 mb-2">Business Profile</h2>
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden divide-y divide-gray-800/80">
                        <Link
                            href="/app/settings/availability"
                            className="flex items-center justify-between px-4 py-4 active:bg-gray-800/50 group transition-colors"
                        >
                            <span className="text-[17px] text-white font-medium">Weekly Hours</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[17px] text-gray-500">
                                    {(() => {
                                        const activeDays = rulesByDay.filter(d => d.rules.length > 0)
                                        const count = activeDays.length

                                        if (count === 0) return 'Not set'
                                        if (count === 7) return 'Every Day'

                                        if (count === 6) {
                                            const allIds = new Set([0, 1, 2, 3, 4, 5, 6])
                                            const activeIds = new Set(activeDays.map(d => d.id))
                                            const missingId = [...allIds].find(id => !activeIds.has(id))
                                            const missingDay = DAYS.find(d => d.id === missingId)
                                            return missingDay ? `Except ${missingDay.label}` : activeDays.map(d => d.short).join(', ')
                                        }

                                        // Weekdays check (Mon-Fri)
                                        const isWeekdays = count === 5 && activeDays.every(d => d.id >= 1 && d.id <= 5)
                                        if (isWeekdays) return 'Weekdays'

                                        // Weekends check (Sat, Sun)
                                        const isWeekends = count === 2 && activeDays.every(d => d.id === 0 || d.id === 6)
                                        if (isWeekends) return 'Weekends'

                                        return activeDays.map(d => d.short).join(', ')
                                    })()}
                                </span>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                            </div>
                        </Link>

                        {/* Booking Page */}
                        <div
                            onClick={() => window.open(`/${profile?.username || profile?.id}`, '_blank')}
                            className="flex items-center justify-between px-4 py-4 active:bg-gray-800/50 cursor-pointer group transition-colors"
                        >
                            <span className="text-[17px] text-white font-medium">Booking Page</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[17px] text-gray-500 truncate max-w-[150px]">
                                    slotify.com/{profile?.username || profile?.id}
                                </span>
                                <Share2 className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recently Deleted */}
                {deletedServices.length > 0 && (
                    <section>
                        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setShowTrash(!showTrash)}
                                className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-800/50"
                            >
                                <span className="text-[15px] text-gray-400 font-medium">Recently Deleted ({deletedServices.length})</span>
                                <ChevronDown className={clsx("w-5 h-5 text-gray-500 transition-transform duration-200", showTrash && "rotate-180")} />
                            </button>

                            {showTrash && (
                                <div className="border-t border-gray-800/50">
                                    {deletedServices.map((service: any) => (
                                        <div
                                            key={service.id}
                                            className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 last:border-0"
                                        >
                                            <div>
                                                <h4 className="text-[15px] text-gray-500 line-through">{service.name}</h4>
                                                <p className="text-[13px] text-gray-600">
                                                    Deleted {new Date(service.deleted_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleRestoreService(service.id)}
                                                    disabled={isRestoringId === service.id}
                                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                                >
                                                    {isRestoringId === service.id ? (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Undo2 className="w-4 h-4 text-blue-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => openPermanentDeleteModal(service.id, service.name)}
                                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Permanent Delete Modal */}
            {permanentDeleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closePermanentDeleteModal} />
                    <div className="relative bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-[320px] shadow-2xl ring-1 ring-white/10">
                        <div className="text-center">
                            <h3 className="text-[17px] font-bold text-white mb-2">Delete "{permanentDeleteModal.serviceName}"?</h3>
                            <p className="text-white/80 text-[13px] mb-6 leading-relaxed">
                                This action cannot be undone. All associated bookings will be permanently removed.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={closePermanentDeleteModal}
                                disabled={isPermanentlyDeleting}
                                className="flex-1 py-3 text-[17px] text-blue-400 font-semibold active:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPermanentDelete}
                                disabled={isPermanentlyDeleting}
                                className="flex-1 py-3 text-[17px] text-[#FF453A] font-semibold active:bg-white/5 rounded-xl transition-colors"
                            >
                                {isPermanentlyDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
