'use client'

import { useState } from 'react'
import { updateDefaultBookingSettings } from './actions'
import { Clock, FileText, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import InfoTooltip from '@/components/InfoTooltip'
import { toast } from '@/utils/toast'

interface AvailabilitySettings {
    default_buffer_minutes?: number | null
    default_cancellation_policy?: string | null
}

interface DefaultBookingSettingsProps {
    availabilitySettings?: AvailabilitySettings | null
}

const BUFFER_OPTIONS = [
    { value: 0, label: 'None' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: -1, label: 'Custom' },
]

const CANCELLATION_OPTIONS = [
    { value: '24h', label: '24 hours in advance' },
    { value: '48h', label: '48 hours in advance' },
    { value: 'no_cancel', label: 'Non-refundable' },
    { value: 'custom', label: 'Custom' },
]

export default function DefaultBookingSettings({ availabilitySettings }: DefaultBookingSettingsProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Buffer time state
    const initialBuffer = availabilitySettings?.default_buffer_minutes ?? 0
    const isCustomBuffer = !BUFFER_OPTIONS.slice(0, -1).some(o => o.value === initialBuffer) && initialBuffer !== 0
    const [bufferOption, setBufferOption] = useState<number>(isCustomBuffer ? -1 : initialBuffer)
    const [customBuffer, setCustomBuffer] = useState<number>(isCustomBuffer ? initialBuffer : 15)

    // Cancellation policy state
    const initialCancellation = availabilitySettings?.default_cancellation_policy ?? '24h'
    const isCustomCancellation = !CANCELLATION_OPTIONS.slice(0, -1).some(o => o.value === initialCancellation)
    const [cancellationOption, setCancellationOption] = useState<string>(isCustomCancellation ? 'custom' : initialCancellation)
    const [customCancellation, setCustomCancellation] = useState<string>(isCustomCancellation ? initialCancellation : '')

    const handleSave = async () => {
        setIsSaving(true)

        const formData = new FormData()
        const finalBuffer = bufferOption === -1 ? customBuffer : bufferOption
        formData.append('default_buffer_minutes', finalBuffer.toString())

        const finalCancellation = cancellationOption === 'custom' ? customCancellation : cancellationOption
        formData.append('default_cancellation_policy', finalCancellation)

        const res = await updateDefaultBookingSettings(formData)

        if (res?.success) {
            toast.success('Default settings saved!')
            setIsExpanded(false)
        } else {
            toast.error(res?.error || 'Failed to save settings')
        }

        setIsSaving(false)
    }

    const getBufferDisplayText = () => {
        if (bufferOption === 0) return 'None'
        if (bufferOption === -1) return `${customBuffer} min`
        const option = BUFFER_OPTIONS.find(o => o.value === bufferOption)
        return option?.label || 'None'
    }

    const getCancellationDisplayText = () => {
        if (cancellationOption === 'custom') return customCancellation || 'Custom'
        const option = CANCELLATION_OPTIONS.find(o => o.value === cancellationOption)
        return option?.label || '24 hours in advance'
    }

    return (
        <div className="relative mt-4 mx-4 rounded-2xl overflow-hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white/10" />

            <div className="relative z-10 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Default Booking Settings</h2>
                {isExpanded && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="text-blue-500 text-sm font-medium disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>

            {!isExpanded ? (
                // Collapsed View
                <button
                    onClick={() => setIsExpanded(true)}
                    className="relative z-10 w-full"
                >
                    <div className="px-4 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-white">Buffer Time</div>
                                <div className="text-xs text-gray-500">{getBufferDisplayText()}</div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="px-4 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-white">Cancellation Policy</div>
                                <div className="text-xs text-gray-500">{getCancellationDisplayText()}</div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                </button>
            ) : (
                // Expanded View
                <div className="relative z-10 p-4 space-y-6">
                    {/* Buffer Time */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <label className="text-sm font-medium text-white">Buffer Time</label>
                            <InfoTooltip
                                title="Buffer Time"
                                content="Buffer time is automatically reserved after each booking. For example, if you set a 30-minute buffer and have a booking from 9:00-10:00, the next available slot will start at 10:30. This is the default for new services."
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {BUFFER_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setBufferOption(option.value)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        bufferOption === option.value
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {bufferOption === -1 && (
                            <div className="flex items-center gap-2 mt-3">
                                <input
                                    type="number"
                                    value={customBuffer}
                                    onChange={e => setCustomBuffer(parseInt(e.target.value) || 0)}
                                    className="w-20 bg-black/50 text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
                                />
                                <span className="text-sm text-gray-300">minutes</span>
                            </div>
                        )}
                    </div>

                    {/* Cancellation Policy */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <label className="text-sm font-medium text-white">Cancellation Policy</label>
                            <InfoTooltip
                                title="Cancellation Policy"
                                content="This policy will be displayed on the booking page so clients know the cancellation rules before booking. This is the default for new services."
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {CANCELLATION_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setCancellationOption(option.value)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        cancellationOption === option.value
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {cancellationOption === 'custom' && (
                            <textarea
                                value={customCancellation}
                                onChange={e => setCustomCancellation(e.target.value)}
                                placeholder="Enter your custom cancellation policy..."
                                rows={2}
                                className="w-full mt-3 bg-black/50 text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-600 border border-white/10"
                            />
                        )}
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500">
                        These defaults will be applied to new services. You can override them for individual services.
                    </p>

                    {/* Cancel Button */}
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}
