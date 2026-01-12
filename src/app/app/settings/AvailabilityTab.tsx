'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Copy, Check, X, ChevronRight, Clock, Loader2 } from 'lucide-react'
import { createAvailabilityRule, updateAvailabilityRule, deleteAvailabilityRule } from './actions'
import clsx from 'clsx'

// --- Constants & Helpers ---

const DAYS = [
    { id: 1, label: 'Monday', short: 'Mon' },
    { id: 2, label: 'Tuesday', short: 'Tue' },
    { id: 3, label: 'Wednesday', short: 'Wed' },
    { id: 4, label: 'Thursday', short: 'Thu' },
    { id: 5, label: 'Friday', short: 'Fri' },
    { id: 6, label: 'Saturday', short: 'Sat' },
    { id: 0, label: 'Sunday', short: 'Sun' },
]

const TIME_INTERVAL = 15 // 15 mins for more precision

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
    _tempId?: string
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

    // UI States
    const [editingDayId, setEditingDayId] = useState<number | null>(null) // Controls the Edit Sheet
    const [copySheetOpen, setCopySheetOpen] = useState(false) // Controls Copy Sheet (inside Edit Sheet or Global)
    const [copySourceDay, setCopySourceDay] = useState<number | null>(null)
    const [selectedCopyDays, setSelectedCopyDays] = useState<number[]>([])

    // Derived state for change detection
    const hasChanges = useMemo(() => {
        if (localRules.length !== availabilityRules.length) return true

        for (const rule of localRules) {
            if (!rule.id) return true
            const original = availabilityRules.find(r => r.id === rule.id)
            if (!original) return true
            if (original.start_time_local.slice(0, 5) !== rule.start_time) return true
            if (original.end_time_local.slice(0, 5) !== rule.end_time) return true
        }

        const localIds = new Set(localRules.map(r => r.id).filter(Boolean))
        for (const rule of availabilityRules) {
            if (!localIds.has(rule.id)) return true
        }

        return false
    }, [localRules, availabilityRules])

    // --- Actions ---

    const handleAddRule = (dayId: number) => {
        const dayRules = localRules.filter(r => r.day_of_week === dayId).sort((a, b) => a.end_time.localeCompare(b.end_time))
        let start = '09:00'
        let end = '17:00'

        if (dayRules.length > 0) {
            const lastRule = dayRules[dayRules.length - 1]
            start = lastRule.end_time
            const [h, m] = start.split(':').map(Number)
            let endH = h + 1
            if (endH >= 24) endH = 23;
            const endHStr = endH.toString().padStart(2, '0')
            end = `${endHStr}:00`
            if (start >= '23:00') { start = '23:00'; end = '23:45'; }
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

    // Toggle Day: Only used on Main List
    const handleToggleDay = (e: React.MouseEvent, dayId: number, isOpen: boolean) => {
        e.stopPropagation() // Prevent opening edit sheet
        if (isOpen) {
            // Remove all rules for this day
            setLocalRules(localRules.filter(r => r.day_of_week !== dayId))
        } else {
            // Add default rule
            handleAddRule(dayId)
        }
    }

    // Copy Logic
    const handleOpenCopy = () => {
        if (editingDayId === null) return
        setCopySourceDay(editingDayId)
        setSelectedCopyDays([])
        setCopySheetOpen(true)
    }

    const handleApplyCopy = () => {
        if (copySourceDay === null) return

        const sourceRules = localRules.filter(r => r.day_of_week === copySourceDay)
        const newRules = localRules.filter(r => !selectedCopyDays.includes(r.day_of_week))

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
        setEditingDayId(null) // Close edit sheet after copying? Or keep open? Let's close for now.
    }

    // Save
    const handleSave = async () => {
        setSaving(true)
        try {
            const currentIds = new Set(localRules.map(r => r.id).filter(Boolean))
            const promises = []

            for (const oldRule of availabilityRules) {
                if (!currentIds.has(oldRule.id)) {
                    promises.push(deleteAvailabilityRule(oldRule.id))
                }
            }

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
            // Optional: visual feedback
        } catch (err) {
            console.error(err)
            alert('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    // --- Format Helpers ---
    const formatTimeRange = (start: string, end: string) => {
        const to12h = (t: string) => {
            const [h, m] = t.split(':').map(Number)
            const period = h < 12 ? 'AM' : 'PM'
            const hour = h % 12 || 12
            return `${hour}:${m.toString().padStart(2, '0')} ${period}`
        }
        return `${to12h(start)} - ${to12h(end)}`
    }

    const getDayStatusText = (dayId: number) => {
        const rules = localRules.filter(r => r.day_of_week === dayId).sort((a, b) => a.start_time.localeCompare(b.start_time))
        if (rules.length === 0) return 'Closed'
        if (rules.length === 1) return formatTimeRange(rules[0].start_time, rules[0].end_time)
        return `${rules.length} slots available`
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white font-sans selection:bg-blue-500/30 pb-20">
            {/* Header */}
            <div className="px-4 pt-14 pb-2 flex items-center justify-between bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <Link href="/app/services" className="flex items-center gap-1 text-blue-500 active:opacity-50 transition-opacity -ml-2 p-2">
                    <ChevronLeft className="w-6 h-6" />
                    <span className="text-[17px]">Back</span>
                </Link>
                <h1 className="text-[17px] font-semibold">Weekly Hours</h1>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={clsx(
                        "text-[17px] font-semibold transition-colors",
                        hasChanges ? "text-blue-500" : "text-gray-600",
                        saving && "opacity-50"
                    )}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* List */}
            <div className="px-4 mt-6">
                <div className="relative rounded-2xl overflow-hidden">
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />

                    <div className="relative z-10 divide-y divide-white/5">
                        {DAYS.map(day => {
                            const isOpen = localRules.some(r => r.day_of_week === day.id)
                            return (
                                <div
                                    key={day.id}
                                    onClick={() => setEditingDayId(day.id)}
                                    className="flex items-center justify-between px-4 py-3.5 active:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <span className="text-[17px] text-white font-medium w-24">{day.label}</span>

                                    <div className="flex-1 flex items-center justify-end gap-3">
                                        <span className={clsx(
                                            "text-[17px]",
                                            isOpen ? "text-gray-400" : "text-gray-600"
                                        )}>
                                            {getDayStatusText(day.id)}
                                        </span>

                                        {/* Toggle */}
                                        <div
                                            onClick={(e) => handleToggleDay(e, day.id, isOpen)}
                                            className={clsx(
                                                "w-[51px] h-[31px] rounded-full relative transition-colors duration-200 ease-in-out flex-shrink-0",
                                                isOpen ? "bg-[#34C759]" : "bg-[#39393D]"
                                            )}
                                        >
                                            <span
                                                className={clsx(
                                                    "absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ease-in-out",
                                                    isOpen ? "left-[22px]" : "left-[2px]"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Edit Day Modal (Centered) */}
            {editingDayId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingDayId(null)} />
                    <div className="relative w-full max-w-sm rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Glassmorphism Background for Modal */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/20" />

                        {/* Sheet Header */}
                        <div className="relative z-10 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className="text-[17px] font-semibold text-white">
                                {DAYS.find(d => d.id === editingDayId)?.label}
                            </span>
                            <button
                                onClick={() => setEditingDayId(null)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sheet Content */}
                        <div className="relative z-10 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {localRules.filter(r => r.day_of_week === editingDayId).length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500 mb-4">Closed on this day</p>
                                    <button
                                        onClick={() => handleAddRule(editingDayId)}
                                        className="text-blue-500 font-medium text-[17px]"
                                    >
                                        Add hours
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {localRules.map((rule, idx) => {
                                        if (rule.day_of_week !== editingDayId) return null
                                        const realIndex = localRules.indexOf(rule)
                                        return (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="flex-1 flex gap-2">
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={rule.start_time}
                                                            onChange={(e) => handleUpdateRule(realIndex, 'start_time', e.target.value)}
                                                            className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-[17px] text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            {TIME_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <span className="flex items-center text-gray-400 font-medium">to</span>
                                                    <div className="relative flex-1">
                                                        <select
                                                            value={rule.end_time}
                                                            onChange={(e) => handleUpdateRule(realIndex, 'end_time', e.target.value)}
                                                            className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-[17px] text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            {TIME_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRule(realIndex)}
                                                    className="p-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )
                                    })}

                                    <div className="pt-2 flex items-center justify-between">
                                        <button
                                            onClick={() => handleAddRule(editingDayId)}
                                            className="flex items-center gap-1 text-blue-500 font-medium text-[15px]"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Interval
                                        </button>

                                        <button
                                            onClick={handleOpenCopy}
                                            className="flex items-center gap-1 text-blue-500 font-medium text-[15px]"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy to...
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Copy Sheet (Nested or Overlay) */}
            {copySheetOpen && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCopySheetOpen(false)} />
                    <div className="relative w-full max-w-md rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
                        {/* Glassmorphism Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                        <div className="absolute inset-0 rounded-t-2xl border border-white/20 border-b-0" />

                        <div className="relative z-10 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <span className="text-[17px] font-semibold text-white">
                                Copy {DAYS.find(d => d.id === copySourceDay)?.label}'s schedule to...
                            </span>
                            <button onClick={() => setCopySheetOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative z-10 p-4 space-y-1 max-h-[60vh] overflow-y-auto">
                            {DAYS.filter(d => d.id !== copySourceDay).map(day => (
                                <label key={day.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 active:bg-white/10 cursor-pointer transition-colors">
                                    <span className="font-medium text-white">{day.label}</span>
                                    <div className={clsx(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        selectedCopyDays.includes(day.id) ? "bg-blue-600 border-blue-600" : "border-gray-500"
                                    )}>
                                        {selectedCopyDays.includes(day.id) && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedCopyDays.includes(day.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedCopyDays([...selectedCopyDays, day.id])
                                            else setSelectedCopyDays(selectedCopyDays.filter(id => id !== day.id))
                                        }}
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="relative z-10 p-4 border-t border-white/10">
                            <button
                                onClick={handleApplyCopy}
                                disabled={selectedCopyDays.length === 0}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
