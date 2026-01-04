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
        <div className="group bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {service.name}
                    </h3>
                    {service.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {service.description}
                        </p>
                    )}
                </div>
                <span className={`ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${service.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            {/* Details & Action */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold">{service.duration_minutes} min</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                    {service.price_cents !== null && service.price_cents !== undefined && (
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <span className="text-sm font-semibold">
                                {service.price_cents === 0 ? 'Free' : `$${(service.price_cents / 100).toFixed(2)}`}
                            </span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCopyLink}
                    disabled={copied}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${copied
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md active:scale-95'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
