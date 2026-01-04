'use client'

import { Clock, Copy, Check } from 'lucide-react'
import { useState } from 'react'

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
    const [copied, setCopied] = useState(false)

    const handleCopyLink = async () => {
        const bookingUrl = `${window.location.origin}/book/${username}/${service.id}`
        await navigator.clipboard.writeText(bookingUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-gray-800/50 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] font-bold text-white mb-0.5 leading-tight">
                        {service.name}
                    </h3>
                    {service.description && (
                        <p className="text-[13px] text-gray-400 line-clamp-2 mt-1">
                            {service.description}
                        </p>
                    )}
                </div>
                <span className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${service.is_active
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Details & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-gray-300">
                        <Clock className="w-[14px] h-[14px] text-gray-500" />
                        <span className="text-[13px] font-medium">{service.duration_minutes} min</span>
                    </div>
                    <div className="w-px h-3.5 bg-gray-700"></div>
                    {service.price_cents !== null && service.price_cents !== undefined && (
                        <div className="flex items-center gap-1.5 text-gray-300">
                            <span className="text-[13px] font-medium">
                                {service.price_cents === 0 ? 'Free' : `$${(service.price_cents / 100).toFixed(2)}`}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCopyLink}
                    disabled={copied}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ${copied
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white active:scale-95'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-[14px] h-[14px]" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="w-[14px] h-[14px]" />
                            Copy Link
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
