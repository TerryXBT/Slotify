'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createService, restoreService, permanentlyDeleteService } from '../settings/actions'
import { Plus, Share2, Undo2, X, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Profile, Service } from '@/types'

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
    profile: Profile,
    services: Service[],
    deletedServices: Service[],
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
    const handleShare = async (e: React.MouseEvent, service: Service) => {
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
        <div className="flex flex-col min-h-screen bg-[#1a1a1a] pb-24 font-sans selection:bg-blue-500/30">
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
                    <div className="relative rounded-2xl overflow-hidden">
                        {/* Glassmorphism Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />

                        <div className="relative z-10 divide-y divide-white/5">
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
                                                {service.duration_minutes} min • ${((service.price_cents ?? 0) / 100).toFixed(0)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    <p className="text-white/70 font-medium">No services yet</p>
                                    <Link href="/app/services/new" className="mt-2 text-blue-500 text-sm font-semibold">
                                        Create your first service
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* GROUP 2: Business Profile */}
                <section>
                    <h2 className="text-[13px] text-gray-500 uppercase font-medium ml-4 mb-2">Business Profile</h2>
                    <div className="relative rounded-2xl overflow-hidden">
                        {/* Glassmorphism Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />

                        <div className="relative z-10 divide-y divide-white/5">
                            <Link
                                href="/app/settings/availability"
                                className="block px-4 py-4 active:bg-gray-800/50 group transition-colors"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[17px] text-white font-medium">Weekly Hours</span>
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                                </div>
                                {/* Mini Week View */}
                                <div className="flex gap-1.5">
                                    {DAYS.map((day) => {
                                        const hasRules = (rulesByDay.find(d => d.id === day.id)?.rules.length ?? 0) > 0
                                        return (
                                            <div key={day.id} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-gray-500 font-medium">{day.short[0]}</span>
                                                <div className={clsx(
                                                    "w-full h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors",
                                                    hasRules
                                                        ? "bg-blue-500/30 text-white border border-blue-500/40"
                                                        : "bg-white/5 text-gray-600 border border-white/5"
                                                )}>
                                                    {hasRules ? '✓' : '–'}
                                                </div>
                                            </div>
                                        )
                                    })}
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
                    </div>
                </section>

                {/* Recently Deleted */}
                {deletedServices.length > 0 && (
                    <section>
                        <div className="relative rounded-2xl overflow-hidden">
                            {/* Glassmorphism Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                            <div className="absolute inset-0 rounded-2xl border border-white/10" />

                            <button
                                onClick={() => setShowTrash(!showTrash)}
                                className="relative z-10 w-full px-4 py-3 flex items-center justify-between active:bg-white/5 transition-colors"
                            >
                                <span className="text-[15px] text-white/70 font-medium">Recently Deleted ({deletedServices.length})</span>
                                <ChevronDown className={clsx("w-5 h-5 text-white/50 transition-transform duration-200", showTrash && "rotate-180")} />
                            </button>

                            {showTrash && (
                                <div className="relative z-10 border-t border-white/10">
                                    {deletedServices.map((service: Service) => (
                                        <div
                                            key={service.id}
                                            className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0"
                                        >
                                            <div>
                                                <h4 className="text-[15px] text-gray-500 line-through">{service.name}</h4>
                                                <p className="text-[13px] text-gray-600">
                                                    Deleted {service.deleted_at ? new Date(service.deleted_at).toLocaleDateString() : 'recently'}
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
                    <div className="relative rounded-2xl p-6 w-full max-w-[320px] shadow-2xl overflow-hidden">
                        {/* Glassmorphism Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/20" />

                        <div className="relative z-10 text-center">
                            <h3 className="text-[17px] font-bold text-white mb-2">Delete "{permanentDeleteModal.serviceName}"?</h3>
                            <p className="text-white/80 text-[13px] mb-6 leading-relaxed">
                                This action cannot be undone. All associated bookings will be permanently removed.
                            </p>
                        </div>
                        <div className="relative z-10 flex gap-3">
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
