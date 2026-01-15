'use client'

import { Link as LinkIcon, Edit, CheckCircle } from 'lucide-react'
import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import ServiceActionsSheet, { ActionItem } from './ServiceActionsSheet'

interface Service {
    id: string
    name: string
    duration_minutes: number
    price_cents: number | null
    price_negotiable?: boolean | null
    is_active: boolean | null
    description?: string | null
}

interface ServiceCardProps {
    service: Service
    username: string
}

function ServiceCard({ service, username }: ServiceCardProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const router = useRouter()

    const handleCopyLink = useCallback(async () => {
        const bookingUrl = `${window.location.origin}/book/${username}/${service.id}`
        await navigator.clipboard.writeText(bookingUrl)

        // Show local toast
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }, [username, service.id])

    const handleEditService = useCallback(() => {
        router.push(`/app/services/${service.id}/edit`)
    }, [router, service.id])

    const handleOpenSheet = useCallback(() => {
        setIsSheetOpen(true)
    }, [])

    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false)
    }, [])

    const actions: ActionItem[] = useMemo(() => [
        {
            label: 'Copy Booking Link',
            icon: <LinkIcon className="w-5 h-5" />,
            onClick: handleCopyLink
        },
        {
            label: 'Edit Service',
            icon: <Edit className="w-5 h-5" />,
            onClick: handleEditService
        }
    ], [handleCopyLink, handleEditService])

    const priceDisplay = useMemo(() => {
        if (service.price_negotiable) return 'Price TBD'
        if (service.price_cents == null || service.price_cents === 0) return 'Free'
        return `$${(service.price_cents / 100).toFixed(0)}`
    }, [service.price_cents, service.price_negotiable])

    return (
        <>
            <div
                onClick={handleOpenSheet}
                className="relative rounded-2xl w-36 h-36 p-4 flex flex-col justify-between active:scale-95 transition-all cursor-pointer overflow-hidden snap-start flex-shrink-0 group"
            >
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="relative z-10 flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white font-semibold text-sm transition-colors">
                        {service.name[0].toUpperCase()}
                    </div>
                    {/* Optional indicator of active/inactive if we want, but keeping it minimal */}
                </div>

                <div className="relative z-10 space-y-1">
                    <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                        {service.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-white/70 font-medium bg-white/10 px-2 py-0.5 rounded-md inline-block backdrop-blur-sm">
                            {priceDisplay}
                        </p>
                        <span className="text-[10px] text-white/50 font-medium">{service.duration_minutes}m</span>
                    </div>
                </div>
            </div>

            <ServiceActionsSheet
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
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

export default memo(ServiceCard)
