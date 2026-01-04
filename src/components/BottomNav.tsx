'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Users, Settings } from 'lucide-react'

export default function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { href: '/app/today', icon: Home, label: 'Home' },
        { href: '/app/week', icon: Calendar, label: 'Calendar' },
        { href: '/app/bookings', icon: Users, label: 'Clients' },
        { href: '/app/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur-lg border-t border-gray-800 pb-safe pt-2 z-50">
            <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive
                                ? 'text-blue-500'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                {label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
