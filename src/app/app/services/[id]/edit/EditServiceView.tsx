'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateService, deleteService } from '../../../settings/actions'
import { MapPin, Video, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export default function EditServiceView({ service, profile }: { service: any, profile: any }) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [locationType, setLocationType] = useState(service.location_type || 'physical')
    const [isActive, setIsActive] = useState(service.is_active ?? true)

    // Form state to track changes
    const [formData, setFormData] = useState({
        name: service.name,
        duration: service.duration_minutes,
        price: service.price_cents / 100,
        address: service.default_location || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        const data = new FormData()
        data.append('name', formData.name)
        data.append('duration', formData.duration.toString())
        data.append('price', formData.price.toString())
        data.append('location_type', locationType)
        data.append('default_location', formData.address)
        data.append('is_active', isActive ? 'on' : 'off')

        await updateService(service.id, data)
        setIsSaving(false)
        router.push('/app/services')
        router.refresh()
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this service? It will be moved to recently deleted.')) {
            return
        }
        setIsDeleting(true)
        const res = await deleteService(service.id)
        if (res?.error) {
            alert(res.error)
            setIsDeleting(false)
        } else {
            router.push('/app/services')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between px-4 py-4 pt-14 bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <Link href="/app/services" className="text-blue-500 text-[17px]">
                    Cancel
                </Link>
                <h1 className="text-[17px] font-semibold">Edit Service</h1>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="text-blue-500 text-[17px] font-semibold disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Form Group */}
                <div className="relative rounded-2xl overflow-hidden">
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />

                    <div className="relative z-10 divide-y divide-white/5">
                    {/* Name */}
                    <div className="flex items-center px-4 py-3">
                        <label className="w-24 text-[17px] text-white">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Service Name"
                            className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
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
                                placeholder="60"
                                className="w-20 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
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
                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-24 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                            />
                        </div>
                    </div>

                    {/* Location Type */}
                    <div className="px-4 py-3">
                        <div className="bg-white/5 p-0.5 rounded-lg flex border border-white/10">
                            <button
                                type="button"
                                onClick={() => setLocationType('physical')}
                                className={clsx(
                                    "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
                                    locationType === 'physical' ? "bg-[#3A3A3C] text-white shadow-sm" : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                In Person
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocationType('online')}
                                className={clsx(
                                    "flex-1 py-1.5 px-3 rounded-[7px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5",
                                    locationType === 'online' ? "bg-[#3A3A3C] text-white shadow-sm" : "text-gray-400 hover:text-gray-300"
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
                            className="flex-1 bg-transparent text-[17px] text-white placeholder-gray-500 focus:outline-none text-right"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <label className="text-[17px] text-white">Active</label>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={clsx(
                                "w-[51px] h-[31px] rounded-full relative transition-colors duration-200 ease-in-out",
                                isActive ? "bg-[#34C759]" : "bg-[#39393D]"
                            )}
                        >
                            <span
                                className={clsx(
                                    "absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow transition-transform duration-200 ease-in-out",
                                    isActive ? "left-[22px]" : "left-[2px]"
                                )}
                            />
                        </button>
                    </div>
                    </div>
                </div>

                {/* Delete Button - Pure Text */}
                <div className="flex flex-col items-center gap-2 pt-4">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-[#FF3B30] text-[17px] font-normal active:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Service'}
                    </button>
                    <p className="text-[13px] text-gray-500">
                        This service will be moved to Recently Deleted
                    </p>
                </div>
            </div>
        </div>
    )
}
