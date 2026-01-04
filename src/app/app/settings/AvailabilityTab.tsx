'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Copy, Check, AlertCircle, X, Loader2 } from 'lucide-react'
import { createAvailabilityRule, updateAvailabilityRule, deleteAvailabilityRule } from './actions'

// --- Constants & Helpers ---

const DAYS = [
    { id: 1, label: 'Mon', fullLabel: 'Monday' },
    { id: 2, label: 'Tue', fullLabel: 'Tuesday' },
    { id: 3, label: 'Wed', fullLabel: 'Wednesday' },
    { id: 4, label: 'Thu', fullLabel: 'Thursday' },
    { id: 5, label: 'Fri', fullLabel: 'Friday' },
    { id: 6, label: 'Sat', fullLabel: 'Saturday' },
    { id: 0, label: 'Sun', fullLabel: 'Sunday' },
]

const TIME_INTERVAL = 30 // minutes

const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += TIME_INTERVAL) {
            const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            const period = hour < 12 ? 'am' : 'pm'
            const minuteStr = minute.toString().padStart(2, '0')
            const hourStr = hour.toString().padStart(2, '0')
            const time24 = `${hourStr}:${minuteStr}`
            const timeLabel = `${h}:${minuteStr} ${period}`
            options.push({ value: time24, label: timeLabel })
        }
    }
    return options
}

const TIME_OPTIONS = generateTimeOptions()

// --- Types ---

interface AvailabilityRule {
    id: string
    day_of_week: number
    start_time_local: string
    end_time_local: string
}

interface LocalRule {
    id: string | null
    day_of_week: number
    start_time: string
    end_time: string
    _tempId?: string // for keying new local rules
}

// --- Components ---

export default function AvailabilityTab({
    availabilityRules
}: {
    availabilityRules: AvailabilityRule[]
}) {
    const router = useRouter()

    // Initialize state
    const [localRules, setLocalRules] = useState<LocalRule[]>(
        availabilityRules.map(r => ({
            id: r.id,
            day_of_week: r.day_of_week,
            start_time: r.start_time_local.slice(0, 5),
            end_time: r.end_time_local.slice(0, 5)
        }))
    )

    const [saving, setSaving] = useState(false)
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    // Copy Sheet State
    const [copySheetOpen, setCopySheetOpen] = useState(false)
    const [copySourceDay, setCopySourceDay] = useState<number | null>(null)
    const [selectedCopyDays, setSelectedCopyDays] = useState<number[]>([])

    // Confirmation Dialog
    const [confirmCloseDay, setConfirmCloseDay] = useState<{ isOpen: boolean, dayId: number | null }>({ isOpen: false, dayId: null })

    // Derived state for change detection
    const hasChanges = useMemo(() => {
        // Simple length check first
        if (localRules.length !== availabilityRules.length) return true

        // Deep check
        // This is a simplified check; for perfect diffing we might need more logic, 
        // but broadly verifying if current rules match specific subsets of original rules is enough.
        // Given we edit in place, we can check if any rule is dirty.
        // A rule is dirty if it has no ID (new) or if its values differ from the original with same ID.

        for (const rule of localRules) {
            if (!rule.id) return true // New rule
            const original = availabilityRules.find(r => r.id === rule.id)
            if (!original) return true // Should not happen usually
            if (original.start_time_local.slice(0, 5) !== rule.start_time) return true
            if (original.end_time_local.slice(0, 5) !== rule.end_time) return true
        }

        // Check for deleted rules (ids in original but not in local)
        const localIds = new Set(localRules.map(r => r.id).filter(Boolean))
        for (const rule of availabilityRules) {
            if (!localIds.has(rule.id)) return true
        }

        return false
    }, [localRules, availabilityRules])

    // --- Actions ---

    const handleAddRule = (dayId: number) => {
        // Smart defaults
        const dayRules = localRules.filter(r => r.day_of_week === dayId).sort((a, b) => a.end_time.localeCompare(b.end_time))
        let start = '09:00'
        let end = '17:00'

        if (dayRules.length > 0) {
            const lastRule = dayRules[dayRules.length - 1]
            start = lastRule.end_time
            // Add 1 hour, handle wrapper around 24h roughly or just clamp
            const [h, m] = start.split(':').map(Number)
            let endH = h + 1
            if (endH >= 24) endH = 23; // Clamp to end of day
            const endHStr = endH.toString().padStart(2, '0')
            end = `${endHStr}:00`

            // If start is already late, fallback
            if (start >= '23:00') {
                // Edge case: try to find a gap or just default? 
                // Simple behavior: just add a valid slot if possible or leave it to user
                start = '23:00'
                end = '23:45'
            }
        }

        const newRule: LocalRule = {
            id: null,
            day_of_week: dayId,
            start_time: start,
            end_time: end,
            _tempId: Math.random().toString(36).substr(2, 9)
        }
        setLocalRules([...localRules, newRule])
    }

    const handleUpdateRule = (ruleIndex: number, field: 'start_time' | 'end_time', value: string) => {
        const newRules = [...localRules]
        newRules[ruleIndex] = { ...newRules[ruleIndex], [field]: value }
        setLocalRules(newRules)
    }

    const handleDeleteRule = (ruleIndex: number) => {
        const newRules = [...localRules]
        newRules.splice(ruleIndex, 1)
        setLocalRules(newRules)
    }

    // Toggle Close Day Logic
    const handleToggleDay = (dayId: number, isOpen: boolean) => {
        if (isOpen) {
            // Close the day
            const dayRules = localRules.filter(r => r.day_of_week === dayId)
            if (dayRules.length > 0) {
                // Ask for confirmation
                setConfirmCloseDay({ isOpen: true, dayId })
            } else {
                // No rules, 'closing' is no-op/visual but we ensure strictly no rules exist
                setLocalRules(localRules.filter(r => r.day_of_week !== dayId))
            }
        } else {
            // Open the day -> Add default 9-5
            handleAddRule(dayId)
        }
    }

    const confirmCloseDayAction = () => {
        if (confirmCloseDay.dayId !== null) {
            setLocalRules(localRules.filter(r => r.day_of_week !== confirmCloseDay.dayId))
        }
        setConfirmCloseDay({ isOpen: false, dayId: null })
    }

    // Copy Logic
    const openCopySheet = (dayId: number) => {
        setCopySourceDay(dayId)
        setSelectedCopyDays([])
        setCopySheetOpen(true)
    }

    const handleApplyCopy = () => {
        if (copySourceDay === null) return

        const sourceRules = localRules.filter(r => r.day_of_week === copySourceDay)
        // Remove existing rules for target days
        let newRules = localRules.filter(r => !selectedCopyDays.includes(r.day_of_week))

        // Add copies
        selectedCopyDays.forEach(targetDay => {
            sourceRules.forEach(src => {
                newRules.push({
                    id: null,
                    day_of_week: targetDay,
                    start_time: src.start_time,
                    end_time: src.end_time,
                    _tempId: Math.random().toString(36).substr(2, 9)
                })
            })
        })

        setLocalRules(newRules)
        setCopySheetOpen(false)
    }

    // Validation
    const getRuleError = (rule: LocalRule, allRulesForDay: LocalRule[]) => {
        if (rule.end_time <= rule.start_time) return "End time must be after start"

        // Overlap check
        const overlap = allRulesForDay.some(other => {
            if (other === rule) return false
            // (StartA <= EndB) and (EndA >= StartB)
            return rule.start_time < other.end_time && rule.end_time > other.start_time
        })
        if (overlap) return "Overlaps with another slot"

        return null
    }

    const hasAnyErrors = localRules.some(r => {
        const dayRules = localRules.filter(d => d.day_of_week === r.day_of_week)
        return getRuleError(r, dayRules) !== null
    })

    // Save
    const handleSave = async () => {
        if (hasAnyErrors) return
        setSaving(true)

        try {
            // 1. Delete removed rules
            const currentIds = new Set(localRules.map(r => r.id).filter(Boolean))
            const promises = []

            for (const oldRule of availabilityRules) {
                if (!currentIds.has(oldRule.id)) {
                    promises.push(deleteAvailabilityRule(oldRule.id))
                }
            }

            // 2. Update/Create rules
            for (const rule of localRules) {
                const formData = new FormData()
                formData.append('day_of_week', rule.day_of_week.toString())
                formData.append('start_time', rule.start_time)
                formData.append('end_time', rule.end_time)

                if (rule.id) {
                    promises.push(updateAvailabilityRule(rule.id, formData))
                } else {
                    promises.push(createAvailabilityRule(formData))
                }
            }

            await Promise.all(promises)

            router.refresh()
            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 3000)
        } catch (err) {
            console.error(err)
            // Error handling toast?
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="pb-32 bg-black min-h-screen text-white font-sans">
            {/* --- Top Bar --- */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
                <Link href="/app/settings" className="p-2 -ml-2 text-blue-500 hover:text-blue-400 active:opacity-70">
                    <div className="flex items-center gap-1">
                        <ChevronLeft className="w-6 h-6" />
                        <span className="text-[17px]">Back</span>
                    </div>
                </Link>

                <h1 className="text-[17px] font-semibold absolute left-1/2 -translate-x-1/2">
                    Weekly Hours
                </h1>

                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving || hasAnyErrors}
                    className={`text-[17px] font-semibold transition-colors
                        ${hasChanges && !hasAnyErrors ? 'text-blue-500 hover:text-blue-400' : 'text-gray-600 cursor-not-allowed'}
                        ${saving ? 'opacity-50' : ''}
                    `}
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                </button>
            </div>

            {/* --- Success Toast --- */}
            <div className={`fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 transition-all duration-300 ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Saved changes</span>
            </div>

            {/* --- Content --- */}
            <div className="p-4 space-y-6 max-w-lg mx-auto">
                {DAYS.map(day => {
                    const dayRules = localRules.filter(r => r.day_of_week === day.id)
                    const isOpen = dayRules.length > 0

                    return (
                        <div key={day.id} className="bg-[#1C1C1E] rounded-xl overflow-hidden ring-1 ring-white/5">
                            {/* Day Header */}
                            <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-[17px]">{day.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isOpen && (
                                        <button
                                            onClick={() => openCopySheet(day.id)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-all text-xs font-medium flex items-center gap-1"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </button>
                                    )}

                                    {/* Toggle (Switch) */}
                                    <button
                                        onClick={() => handleToggleDay(day.id, isOpen)}
                                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 ring-blue-500 ring-offset-2 ring-offset-black
                                            ${isOpen ? 'bg-green-500' : 'bg-gray-600'}
                                        `}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                                            ${isOpen ? 'translate-x-5' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>
                            </div>

                            {/* Intervals */}
                            {isOpen ? (
                                <div className="p-4 space-y-4">
                                    {dayRules.map((rule, idx) => {
                                        // Find actual index in main array
                                        const realIndex = localRules.indexOf(rule)
                                        const error = getRuleError(rule, dayRules)

                                        return (
                                            <div key={rule.id || rule._tempId || idx} className="animate-fade-in">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                        {/* Start Time */}
                                                        <div className="relative">
                                                            <select
                                                                value={rule.start_time}
                                                                onChange={(e) => handleUpdateRule(realIndex, 'start_time', e.target.value)}
                                                                className={`w-full appearance-none bg-[#2C2C2E] text-white rounded-lg px-3 py-2.5 text-[15px] font-medium border focus:outline-none focus:ring-2 transition-all
                                                                    ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-transparent focus:ring-blue-500/20'}
                                                                `}
                                                            >
                                                                {TIME_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* End Time */}
                                                        <div className="relative">
                                                            <select
                                                                value={rule.end_time}
                                                                onChange={(e) => handleUpdateRule(realIndex, 'end_time', e.target.value)}
                                                                className={`w-full appearance-none bg-[#2C2C2E] text-white rounded-lg px-3 py-2.5 text-[15px] font-medium border focus:outline-none focus:ring-2 transition-all
                                                                    ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-transparent focus:ring-blue-500/20'}
                                                                `}
                                                            >
                                                                {TIME_OPTIONS.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteRule(realIndex)}
                                                        className="p-2.5 bg-[#2C2C2E] hover:bg-red-500/20 hover:text-red-500 text-gray-400 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                {error && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-red-500 text-xs font-medium pl-1">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        {error}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    <button
                                        onClick={() => handleAddRule(day.id)}
                                        className="mt-2 text-blue-400 text-[15px] font-medium flex items-center gap-2 py-2 px-1 hover:text-blue-300 transition-colors active:opacity-70"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add time
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500 text-sm">
                                    Closed
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* --- Modals --- */}

            {/* Copy Sheet */}
            {copySheetOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCopySheetOpen(false)} />
                    <div className="relative w-full sm:max-w-md bg-[#1C1C1E] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl animate-slide-up">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="font-semibold text-white">Copy schedule to...</h3>
                            <button onClick={() => setCopySheetOpen(false)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {/* Quick Select */}
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setSelectedCopyDays(DAYS.filter(d => d.id >= 1 && d.id <= 5 && d.id !== copySourceDay).map(d => d.id))}
                                    className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-gray-700 rounded-full text-xs font-medium text-white transition-colors whitespace-nowrap"
                                >
                                    Weekdays
                                </button>
                                <button
                                    onClick={() => setSelectedCopyDays(DAYS.filter(d => (d.id === 0 || d.id === 6) && d.id !== copySourceDay).map(d => d.id))}
                                    className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-gray-700 rounded-full text-xs font-medium text-white transition-colors whitespace-nowrap"
                                >
                                    Weekend
                                </button>
                                <button
                                    onClick={() => setSelectedCopyDays(DAYS.filter(d => d.id !== copySourceDay).map(d => d.id))}
                                    className="px-3 py-1.5 bg-[#2C2C2E] hover:bg-gray-700 rounded-full text-xs font-medium text-white transition-colors whitespace-nowrap"
                                >
                                    All Days
                                </button>
                            </div>

                            <div className="space-y-1">
                                {DAYS.filter(d => d.id !== copySourceDay).map(day => (
                                    <label key={day.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                                        <span className="font-medium text-[15px]">{day.fullLabel}</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                            ${selectedCopyDays.includes(day.id)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-600 bg-transparent'}
                                        `}>
                                            {selectedCopyDays.includes(day.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedCopyDays.includes(day.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedCopyDays(prev => [...prev, day.id])
                                                else setSelectedCopyDays(prev => prev.filter(id => id !== day.id))
                                            }}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-[#1C1C1E]">
                            <button
                                onClick={handleApplyCopy}
                                disabled={selectedCopyDays.length === 0}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Close Dialog */}
            {confirmCloseDay.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmCloseDay({ isOpen: false, dayId: null })} />
                    <div className="relative bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-white/10 animate-fade-in text-center">
                        <h3 className="text-lg font-bold text-white mb-2">Close this day?</h3>
                        <p className="text-gray-400 text-[15px] mb-6">
                            This will remove all time slots for this day.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmCloseDay({ isOpen: false, dayId: null })}
                                className="flex-1 py-2.5 bg-[#2C2C2E] hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCloseDayAction}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                            >
                                Close Day
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    )
}
