'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { updateProfile } from '../actions'

const POLICY_TEMPLATES = [
    {
        id: 'flexible',
        name: 'Flexible',
        description: 'Cancel anytime for free',
        text: 'Free cancellation anytime before the appointment.'
    },
    {
        id: 'moderate',
        name: 'Moderate',
        description: 'Cancel 24 hours before for free',
        text: 'Free cancellation up to 24 hours before the appointment. Cancellations made within 24 hours may be subject to a fee.'
    },
    {
        id: 'strict',
        name: 'Strict',
        description: 'Cancel 48 hours before for 50% refund',
        text: 'Cancellations made 48+ hours before: full refund. Cancellations within 48 hours: 50% refund. No refund for no-shows.'
    },
    {
        id: 'custom',
        name: 'Custom',
        description: 'Write your own policy',
        text: ''
    },
    {
        id: 'none',
        name: 'No Policy',
        description: 'Don\'t show a cancellation policy',
        text: ''
    }
]

export default function BookingPageSettings({ profile }: { profile: any }) {
    const router = useRouter()
    const [selectedTemplate, setSelectedTemplate] = useState<string>(
        profile.cancellation_policy ? 'custom' : 'none'
    )
    const [customPolicy, setCustomPolicy] = useState(profile.cancellation_policy || '')
    const [saving, setSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = POLICY_TEMPLATES.find(t => t.id === templateId)
        if (template && template.id !== 'custom' && template.id !== 'none') {
            setCustomPolicy(template.text)
        } else if (template?.id === 'none') {
            setCustomPolicy('')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)

        const formData = new FormData(e.currentTarget)

        // Set cancellation policy based on selection
        if (selectedTemplate === 'none') {
            formData.set('cancellation_policy', '')
        } else if (selectedTemplate !== 'custom') {
            const template = POLICY_TEMPLATES.find(t => t.id === selectedTemplate)
            if (template) {
                formData.set('cancellation_policy', template.text)
            }
        }

        await updateProfile(formData)

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        setSaving(false)
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Saved successfully!</span>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-40 bg-black border-b border-gray-800">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-bold text-white">Booking Page</h1>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Bio <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="bio"
                        defaultValue={profile.bio || ''}
                        maxLength={200}
                        rows={3}
                        required
                        className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell clients about yourself (max 200 chars)"
                    />
                    <p className="text-xs text-gray-500 mt-1">This appears at the top of your booking page</p>
                </div>

                {/* Location & Phone */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                        <input
                            type="text"
                            name="location"
                            defaultValue={profile.location || ''}
                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="City"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            defaultValue={profile.phone || ''}
                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Phone number"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
                    <input
                        type="email"
                        name="email"
                        defaultValue={profile.email || ''}
                        className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contact@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">At least one contact method (location, phone, or email) recommended</p>
                </div>

                {/* Cancellation Policy */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Cancellation Policy</label>

                    <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                    >
                        {POLICY_TEMPLATES.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name} - {template.description}
                            </option>
                        ))}
                    </select>

                    {selectedTemplate === 'custom' && (
                        <textarea
                            name="cancellation_policy"
                            value={customPolicy}
                            onChange={(e) => setCustomPolicy(e.target.value)}
                            maxLength={500}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mt-3"
                            placeholder="Write your custom cancellation policy..."
                        />
                    )}

                    {selectedTemplate !== 'custom' && selectedTemplate !== 'none' && (
                        <input type="hidden" name="cancellation_policy" value={customPolicy} />
                    )}

                    {selectedTemplate === 'none' && (
                        <input type="hidden" name="cancellation_policy" value="" />
                    )}
                </div>

                {/* Save Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
