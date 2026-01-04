'use client'

import { cancelBookingViaToken } from '@/app/actions/cancel'
import { useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'

export default function CancelConfirmation({ token }: { token: string }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleConfirm = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await cancelBookingViaToken(token)
            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess(true)
            }
        } catch (e) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Cancelled</h2>
                <p className="text-gray-600">Your appointment has been cancelled.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{error}</div>}

            <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Yes, Cancel Appointment
            </button>

            <button disabled className="w-full text-gray-500 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-not-allowed opacity-50">
                No, keep it
            </button>
        </div>
    )
}
