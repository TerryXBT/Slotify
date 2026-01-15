'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('App Error:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
            <div className="relative rounded-3xl p-8 max-w-md w-full overflow-hidden">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-3xl border border-white/10" />

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Something went wrong
                    </h1>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        We encountered an unexpected error. Please try again or go back to the home page.
                    </p>

                    {error.digest && (
                        <p className="text-xs text-gray-600 mb-6 font-mono">
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>

                        <Link
                            href="/app/today"
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors active:scale-95"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
