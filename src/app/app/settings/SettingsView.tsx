'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileTab from './ProfileTab'

export default function SettingsView({ profile, services, availabilityRules }: { profile: any, services: any[], availabilityRules: any[] }) {
    const router = useRouter()

    return (
        <div className="flex flex-col min-h-screen bg-black">
            {/* Header */}
            <div className="bg-[#1C1C1E] border-b border-gray-800">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-white">Settings</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <ProfileTab profile={profile} services={services} availabilityRules={availabilityRules} />
            </div>
        </div>
    )
}
