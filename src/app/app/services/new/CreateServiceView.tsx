'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createService } from '../../settings/actions'
import { MapPin, Video, ChevronRight, Check } from 'lucide-react'
import clsx from 'clsx'

export default function CreateServiceView({ profile }: { profile: any }) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [locationType, setLocationType] = useState('physical')
    const [formData, setFormData] = useState({
        name: '',
        duration: 60,
        price: '',
        address: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        const data = new FormData()
        data.append('name', formData.name)
        data.append('duration', formData.duration.toString())
        data.append('price', (parseFloat(formData.price) || 0).toString())
        data.append('location_type', locationType)
        data.append('default_location', formData.address)

        const res = await createService(data)

        if (res?.error) {
            alert(res.error)
            setIsSaving(false)
        } else {
            router.push('/app/services')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between px-4 py-4 pt-14 bg-black/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800/50">
                <Link href="/app/services" className="text-blue-500 text-[17px] active:opacity-50 transition-opacity">
                    Cancel
                </Link>
                <h1 className="text-[17px] font-semibold">New Service</h1>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.name}
                    className="text-white text-[17px] font-semibold disabled:opacity-30 disabled:text-gray-500 active:opacity-70 transition-all"
                >
                    {isSaving ? 'Adding...' : 'Add'}
                </button>
            </div>

            <div className="p-4 space-y-8">
                {/* Form Group 1: Basic Info */}
                <div className="space-y-2">
                    <h2 className="text-[13px] text-gray-500 uppercase font-medium ml-4">Basic Information</h2>
                    <div className="bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-gray-800/80">
                        {/* Name */}
                        <div className="flex items-center px-4 py-3">
                            <label className="w-24 text-[17px] text-white">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Service Name"
                                className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-600 focus:outline-none text-right"
                                autoFocus
                            />
                        </div>

                        {/* Duration */}
                        <div className="flex items-center px-4 py-3">
                            <label className="w-24 text-[17px] text-white">Duration</label>
                            <div className="flex-1 flex items-center justify-end gap-2">
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    className="w-20 bg-transparent text-[17px] text-white placeholder-gray-600 focus:outline-none text-right"
                                />
                                <span className="text-[17px] text-white">min</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center px-4 py-3">
                            <label className="w-24 text-[17px] text-white">Price</label>
                            <div className="flex-1 flex items-center justify-end gap-2">
                                <span className="text-[17px] text-white">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                    className="w-24 bg-transparent text-[17px] text-white placeholder-gray-600 focus:outline-none text-right"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Group 2: Location */}
                <div className="space-y-2">
                    <h2 className="text-[13px] text-gray-500 uppercase font-medium ml-4">Location & Details</h2>
                    <div className="bg-[#1C1C1E] rounded-xl overflow-hidden divide-y divide-gray-800/80">
                        {/* Location Type */}
                        <div className="px-4 py-3">
                            <div className="bg-gray-800/50 p-0.5 rounded-lg flex">
                                <button
                                    type="button"
                                    onClick={() => setLocationType('physical')}
                                    className={clsx(
                                        "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all shadow-sm flex items-center justify-center gap-1.5",
                                        locationType === 'physical' ? "bg-[#636366] text-white" : "text-gray-400 hover:text-gray-300"
                                    )}
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    In Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocationType('online')}
                                    className={clsx(
                                        "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all shadow-sm flex items-center justify-center gap-1.5",
                                        locationType === 'online' ? "bg-[#636366] text-white" : "text-gray-400 hover:text-gray-300"
                                    )}
                                >
                                    <Video className="w-3.5 h-3.5" />
                                    Online
                                </button>
                            </div>
                        </div>

                        {/* Address/Link */}
                        <div className="flex items-center px-4 py-3">
                            <label className="w-24 text-[17px] text-white">
                                {locationType === 'online' ? 'Link' : 'Address'}
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder={locationType === 'online' ? 'Zoom/Meet Link' : '123 Main St'}
                                className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-600 focus:outline-none text-right"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
