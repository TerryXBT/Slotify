'use client'

import Link from 'next/link'
import { Plus, Clock, Settings, Calendar } from 'lucide-react'

export default function ActionGrid() {
    // Defines actions: Add Slot, Reschedule, Settings/Calendar?
    // User image showed: Add Slot, Calendar, Client List
    // We have existing links: Busy Block (/app/busy/new), Reschedule (/app/reschedule), Settings (/app/settings)

    // Let's make 3 buttons.
    const actions = [
        {
            label: 'Add Block',
            icon: <Plus className="w-6 h-6" />,
            href: '/app/busy/new',
            color: 'text-blue-500'
        },
        /* {
            label: 'Reschedule',
            icon: <Clock className="w-6 h-6" />,
            href: '/app/reschedule',
            color: 'text-orange-500'
        }, */
        {
            label: 'Settings',
            icon: <Settings className="w-6 h-6" />,
            href: '/app/settings',
            color: 'text-gray-400'
        }
    ]

    return (
        <div className="grid grid-cols-3 gap-4">
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center active:scale-90 transition-transform group-active:bg-gray-800">
                        <div className={action.color}>{action.icon}</div>
                    </div>
                    <span className="text-[12px] font-medium text-gray-400">
                        {action.label}
                    </span>
                </Link>
            ))}
        </div>
    )
}
