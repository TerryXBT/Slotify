'use client'

import { Info, X } from 'lucide-react'
import { useState, useCallback, memo } from 'react'

interface InfoTooltipProps {
    content: string
    title?: string
}

function InfoTooltip({ content, title }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleOpen = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-300 hover:bg-white/20 transition-all active:scale-95"
                aria-label="More information"
            >
                <Info className="w-3 h-3" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal Content */}
                    <div
                        className="relative bg-[#2C2C2E] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Title */}
                        {title && (
                            <h3 className="text-[17px] font-semibold text-white mb-2 pr-8">
                                {title}
                            </h3>
                        )}

                        {/* Content */}
                        <p className="text-[15px] text-gray-300 leading-relaxed">
                            {content}
                        </p>

                        {/* Got it Button */}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="mt-5 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors active:scale-[0.98]"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default memo(InfoTooltip)
