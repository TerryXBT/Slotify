import { createClient } from '@/utils/supabase/server'
import { updateAvailability } from './actions'
import Link from 'next/link'

export default async function AvailabilityPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', user.id)

    const days = [
        { id: 1, name: 'Monday' },
        { id: 2, name: 'Tuesday' },
        { id: 3, name: 'Wednesday' },
        { id: 4, name: 'Thursday' },
        { id: 5, name: 'Friday' },
        { id: 6, name: 'Saturday' },
        { id: 0, name: 'Sunday' },
    ]

    const getRuleForDay = (dayId: number) => rules?.find(r => r.day_of_week === dayId)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24 text-gray-900 dark:text-gray-100">
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md px-5 pt-12 pb-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                <Link href="/app/today" className="text-blue-600 dark:text-blue-500 font-medium text-base">
                    Cancel
                </Link>
                <h1 className="text-lg font-bold">Standard Availability</h1>
                <button type="submit" form="avail-form" className="text-blue-600 dark:text-blue-500 font-bold text-base">
                    Save
                </button>
            </header>

            <main className="px-5 mt-4">
                <form id="avail-form" action={updateAvailability} className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                        {days.map(day => {
                            const rule = getRuleForDay(day.id)
                            const isActive = !!rule

                            return (
                                <div key={day.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-lg">{day.name}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name={`day_${day.id}_active`} defaultChecked={isActive} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            name={`day_${day.id}_start`}
                                            type="time"
                                            className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center w-full"
                                            defaultValue={rule?.start_time_local || '09:00'}
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            name={`day_${day.id}_end`}
                                            type="time"
                                            className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center w-full"
                                            defaultValue={rule?.end_time_local || '17:00'}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm px-4">
                        These settings apply to your recurring weekly schedule. You can block specific dates using "Busy Blocks".
                    </p>
                </form>
            </main>
        </div>
    )
}
