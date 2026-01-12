'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Briefcase, Settings } from 'lucide-react'

export default function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { href: '/app/today', icon: Home, label: 'Home' },
        { href: '/app/week', icon: Calendar, label: 'Calendar' },
        { href: '/app/services', icon: Briefcase, label: 'Services' },
        { href: '/app/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <nav className="fixed bottom-6 left-0 right-0 pb-safe z-50 px-4">
            <div className="relative max-w-md mx-auto rounded-[32px] overflow-hidden">
                {/* Glassmorphism Background - Darker for distinction */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.10] to-white/[0.08] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-[32px] border border-white/20" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-70" />

                <div className="relative z-10 grid grid-cols-4 h-16 px-2">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive
                                    ? 'text-white'
                                    : 'text-white/50 hover:text-white/70'
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
            </div>
        </nav>
    )
}
