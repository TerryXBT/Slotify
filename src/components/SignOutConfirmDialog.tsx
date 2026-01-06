'use client'

import { useEffect } from 'react'

interface SignOutConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isLoading?: boolean
}

export default function SignOutConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}: SignOutConfirmDialogProps) {
    // Handle keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            } else if (e.key === 'Enter' && !isLoading) {
                onConfirm()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, onConfirm, isLoading])

    if (!isOpen) return null

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-[#1C1C1E] rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-white">Sign Out</h3>
                    <p className="text-gray-400">Are you sure you want to sign out?</p>
                </div>

                <div className="flex border-t border-gray-800">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-4 text-gray-400 hover:bg-gray-900/50 transition-colors font-medium border-r border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-4 text-red-500 hover:bg-gray-900/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                <span>Signing out...</span>
                            </>
                        ) : (
                            'Sign Out'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
