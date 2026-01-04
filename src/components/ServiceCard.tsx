'use client'

import { MoreHorizontal, Link as LinkIcon, Edit, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import ServiceActionsSheet, { ActionItem } from './ServiceActionsSheet'
import Link from 'next/link'

interface Service {
    id: string
    name: string
    duration_minutes: number
    price_cents: number
    is_active: boolean
    description?: string
}

interface ServiceCardProps {
    service: Service
    username: string
}

export default function ServiceCard({ service, username }: ServiceCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const handleCopyLink = async () => {
        const bookingUrl = `${window.location.origin}/book/${username}/${service.id}`
        await navigator.clipboard.writeText(bookingUrl)

        // Show local toast
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }

    const actions: ActionItem[] = [
        {
            label: 'Copy Booking Link',
            icon: <LinkIcon className="w-5 h-5" />,
            onClick: handleCopyLink
        },
        {
            label: 'Edit Service',
            icon: <Edit className="w-5 h-5" />,
            onClick: () => {
                // TODO: Navigate to edit page
                window.location.href = `/app/settings?tab=services`
            }
        }
    ]

    return (
        <>
            <div
                onClick={() => setIsSheetOpen(true)}
                className="bg-[#1C1C1E] rounded-2xl p-4 border border-gray-800/50 active:bg-gray-800/50 transition-colors cursor-pointer relative overflow-hidden"
            >
                <div className="flex items-center justify-between gap-4">

                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-semibold text-white leading-tight mb-1 truncate">
                            {service.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[15px] text-gray-400">
                            <span>
                                {service.duration_minutes > 1440
                                    ? 'Custom Duration'
                                    : `${service.duration_minutes} min`}
                            </span>

                            {service.price_cents !== null && service.price_cents !== undefined && (
                                <>
                                    <span className="text-gray-600">•</span>
                                    <span>
                                        {service.price_cents === 0 ? 'Free' : `$${(service.price_cents / 100).toFixed(2)}`}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Menu */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/50 text-gray-400">
                            <MoreHorizontal className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            <ServiceActionsSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                actions={actions}
                title={service.name}
            />

            {/* Local Toast */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-[14px] font-semibold">Link Copied</span>
                    </div>
                </div>
            )}
        </>
    )
}
