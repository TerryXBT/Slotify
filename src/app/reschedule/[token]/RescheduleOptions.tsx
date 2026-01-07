'use client'

import { format } from 'date-fns'
import { confirmReschedule } from '../actions'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface RescheduleOption {
    id: string
    start_at: string
    end_at: string
}

export default function RescheduleOptions({ token, options }: { token: string, options: RescheduleOption[] }) {
    const [loading, setLoading] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSelect = async (optionId: string) => {
        setLoading(optionId)
        setError('')

        try {
            const formData = new FormData()
            formData.append('token', token)
            formData.append('optionId', optionId)

            const res = await confirmReschedule(formData)
            if (res?.error) {
                setError(res.error)
                setLoading(null)
            } else {
                setSuccess(true)
            }
        } catch (e) {
            setError('Something went wrong')
            setLoading(null)
        }
    }

    if (success) {
        return (
            <div className="text-center py-8 animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Rescheduled!</h2>
                <p className="text-gray-600">Your appointment has been updated.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {error && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{error}</div>}

            {options.map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!loading}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-[0.98] group relative"
                >
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                        {format(new Date(opt.start_at), 'EEEE, MMMM d')}
                    </div>
                    <div className="text-lg font-bold text-gray-600 group-hover:text-blue-600">
                        {format(new Date(opt.start_at), 'h:mm a')}
                    </div>
                    {loading === opt.id && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    )
}
