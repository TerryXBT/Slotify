'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Clock, DollarSign, Edit, Trash2, X, MapPin, Video } from 'lucide-react'
import { createService, updateService, deleteService } from './actions'
import clsx from 'clsx'

export default function ServicesTab({ services }: { services: any[] }) {
    const router = useRouter()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({ isOpen: false, serviceId: null, serviceName: '' })
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await createService(formData)
        setLoading(false)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            setIsCreateModalOpen(false)
            router.refresh()
        }
    }

    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateService(editingService.id, formData)
        setLoading(false)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            setEditingService(null)
            router.refresh()
        }
    }

    function openDeleteModal(id: string, name: string) {
        setDeleteModal({ isOpen: true, serviceId: id, serviceName: name })
    }

    function closeDeleteModal() {
        setDeleteModal({ isOpen: false, serviceId: null, serviceName: '' })
    }

    async function confirmDeleteService() {
        if (!deleteModal.serviceId) return
        setIsDeleting(true)

        const res = await deleteService(deleteModal.serviceId)
        if (res?.error) {
            alert(res.error)
        } else if (res?.success) {
            router.refresh()
        }
        setIsDeleting(false)
        closeDeleteModal()
    }

    const ServiceForm = ({ onSubmit, initialData, title, onClose }: any) => {
        const [locationType, setLocationType] = useState(initialData?.location_type || 'physical')

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#1C1C1E] w-full max-w-md rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">{title}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Name</label>
                            <input name="name" required defaultValue={initialData?.name} className="w-full p-3 rounded-xl bg-black border-none font-medium focus:ring-2 focus:ring-blue-500 text-white" placeholder="e.g. Tennis Lesson" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (min)</label>
                                <div className="relative">
                                    <input type="number" name="duration" required defaultValue={initialData?.duration_minutes || 60} className="w-full p-3 pl-9 rounded-xl bg-black border-none font-medium focus:ring-2 focus:ring-blue-500 text-white" />
                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                                <div className="relative">
                                    <input type="number" name="price" required defaultValue={initialData?.price_cents ? initialData.price_cents / 100 : 50} className="w-full p-3 pl-9 rounded-xl bg-black border-none font-medium focus:ring-2 focus:ring-blue-500 text-white" />
                                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                                </div>
                            </div>
                        </div>

                        {/* Location Type */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Service Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLocationType('physical')}
                                    className={clsx(
                                        'p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                                        locationType === 'physical'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-black text-gray-400 hover:bg-gray-900'
                                    )}
                                >
                                    <MapPin className="w-4 h-4" />
                                    In-Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLocationType('online')}
                                    className={clsx(
                                        'p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                                        locationType === 'online'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-black text-gray-400 hover:bg-gray-900'
                                    )}
                                >
                                    <Video className="w-4 h-4" />
                                    Online
                                </button>
                            </div>
                            <input type="hidden" name="location_type" value={locationType} />
                        </div>

                        {/* Location Field */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {locationType === 'physical' ? 'Location' : 'Meeting Link'}
                            </label>
                            <input
                                name="default_location"
                                defaultValue={initialData?.default_location}
                                className="w-full p-3 rounded-xl bg-black border-none font-medium focus:ring-2 focus:ring-blue-500 text-white"
                                placeholder={locationType === 'physical' ? 'e.g. Downtown Studio, 123 Main St' : 'e.g. https://meet.google.com/...'}
                            />
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3 p-3 bg-black rounded-xl border border-gray-800">
                            <input
                                type="checkbox"
                                name="is_active"
                                defaultChecked={initialData?.is_active ?? true}
                                className="w-5 h-5 rounded border-gray-600 bg-transparent text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <div>
                                <label className="block text-sm font-bold text-white">Active Service</label>
                                <p className="text-xs text-gray-500">Visible on your booking page</p>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-2 transition-all active:scale-[0.98]">
                            {loading ? 'Saving...' : 'Save Service'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Services List */}
            <div className="space-y-3 pb-24">
                {services.map(s => (
                    <div key={s.id} className={clsx(
                        "bg-[#1C1C1E] p-4 rounded-xl border border-gray-800 shadow-sm flex items-center gap-4 transition-opacity",
                        !s.is_active && "opacity-60"
                    )}>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white leading-tight">{s.name}</h4>
                                {!s.is_active && (
                                    <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 text-[10px] font-bold uppercase tracking-wide">Inactive</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration_minutes}m</span>
                                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${(s.price_cents / 100).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setEditingService(s)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors">
                                <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => openDeleteModal(s.id, s.name)} disabled={loading} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {services.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <p>No services yet.</p>
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 text-white active:scale-90 transition-transform z-30 hover:bg-blue-500"
            >
                <Plus className="w-8 h-8" />
            </button>

            {/* Modals */}
            {isCreateModalOpen && <ServiceForm title="New Service" onSubmit={handleCreate} onClose={() => setIsCreateModalOpen(false)} />}
            {editingService && <ServiceForm title="Edit Service" initialData={editingService} onSubmit={handleUpdate} onClose={() => setEditingService(null)} />}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeDeleteModal} />
                    <div className="relative bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Service?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Are you sure you want to delete <span className="font-medium text-white">"{deleteModal.serviceName}"</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteService}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
