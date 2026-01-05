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
                className="bg-[#1C1C1E] rounded-2xl w-32 h-32 p-3 flex flex-col justify-between active:scale-95 transition-all cursor-pointer relative overflow-hidden snap-start flex-shrink-0"
            >
                <div className="flex justify-between items-start">
                    {/* Placeholder Icon or First Letter */}
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-semibold text-sm">
                        {service.name[0].toUpperCase()}
                    </div>
                </div>

                <div>
                    <h3 className="text-[14px] font-semibold text-white leading-tight line-clamp-2 mb-1">
                        {service.name}
                    </h3>
                    <p className="text-[12px] text-gray-500">
                        {service.price_cents === 0 ? 'Free' : `$${(service.price_cents / 100).toFixed(2)}`}
                    </p>
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
