'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface ActionItem {
    label: string
    icon: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
}

interface ServiceActionsSheetProps {
    isOpen: boolean
    onClose: () => void
    actions: ActionItem[]
    title?: string
}

export default function ServiceActionsSheet({ isOpen, onClose, actions, title }: ServiceActionsSheetProps) {
    const [isVisible, setIsVisible] = useState(false)

    // Handle animation timing
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            ></div>

            {/* Sheet */}
            <div
                className={`relative w-full max-w-sm bg-[#1C1C1E] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:translate-y-8'
                    }`}
            >
                {/* Header handle for mobile */}
                <div className="w-full h-1.5 flex justify-center pt-3 pb-6 sm:hidden" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
                </div>

                <div className="px-4 pb-6 sm:p-6">
                    {title && (
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white sm:block hidden">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="space-y-1">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    action.onClick()
                                    onClose()
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[16px] font-medium transition-colors active:scale-[0.98] ${action.variant === 'destructive'
                                    ? 'text-red-500 hover:bg-red-500/10 active:bg-red-500/20'
                                    : 'text-gray-200 hover:bg-white/5 active:bg-white/10'
                                    }`}
                            >
                                <span className={action.variant === 'destructive' ? 'text-red-500' : 'text-gray-400'}>
                                    {action.icon}
                                </span>
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 sm:hidden">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-xl bg-gray-800 text-white font-semibold text-[16px] active:scale-95 transition-transform"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
