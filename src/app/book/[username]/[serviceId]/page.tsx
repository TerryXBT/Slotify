import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BookingForm from './BookingForm'
import { MapPin, Mail, Phone, Info, Video, ExternalLink } from 'lucide-react'

export default async function PublicBookingPage({
    params
}: {
    params: Promise<{ username: string; serviceId: string }>
}) {
    const { username, serviceId } = await params
    const supabase = await createClient()

    // Fetch provider profile
    const { data: provider } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (!provider) {
        notFound()
    }

    // Fetch service
    const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('provider_id', provider.id)
        .eq('is_active', true)
        .single()

    if (!service) {
        notFound()
    }

    // Fetch provider's availability
    const { data: availability } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', provider.id)
        .order('day_of_week')

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <div className="max-w-2xl mx-auto">
                {/* Header - Provider Info */}
                <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        {provider.avatar_url ? (
                            <img
                                src={provider.avatar_url}
                                alt={provider.full_name || provider.username}
                                className="w-20 h-20 rounded-full object-cover shadow-md mb-4"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4">
                                {provider.full_name?.[0] || provider.username[0].toUpperCase()}
                            </div>
                        )}

                        {/* Provider Name */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {provider.full_name || provider.username}
                        </h2>

                        {/* Location */}
                        {provider.location && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-3">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{provider.location}</span>
                            </div>
                        )}

                        {/* Bio */}
                        {provider.bio && (
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
                                {provider.bio}
                            </p>
                        )}

                        {/* Divider */}
                        <div className="w-full border-t border-gray-200 dark:border-gray-800 my-4"></div>

                        {/* Service Info */}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {service.name}
                        </h1>

                        <div className="flex items-center justify-center gap-6 text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{service.duration_minutes} min</span>
                            </div>
                            {service.price_cents > 0 && (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11- 18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>${(service.price_cents / 100).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Service Location */}
                        {service.default_location && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                {service.location_type === 'online' ? (
                                    <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
                                        <Video className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">Online Meeting</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                Link will be sent after booking confirmation
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">Location</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {service.default_location}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Form */}
                <div className="p-8">
                    <BookingForm
                        service={service}
                        providerId={provider.id}
                        providerName={provider.full_name || provider.username}
                        availability={availability || []}
                    />
                </div>

                {/* Important Information Section */}
                {(provider.cancellation_policy || provider.phone || provider.email) && (
                    <div className="bg-white dark:bg-[#1C1C1E] border-t border-gray-200 dark:border-gray-800 p-8 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Important Information</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Cancellation Policy */}
                            {provider.cancellation_policy && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cancellation Policy</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">
                                        {provider.cancellation_policy}
                                    </p>
                                </div>
                            )}

                            {/* Contact Information */}
                            {(provider.phone || provider.email) && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h4>
                                    <div className="space-y-2">
                                        {provider.phone && (
                                            <a
                                                href={`tel:${provider.phone}`}
                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {provider.phone}
                                            </a>
                                        )}
                                        {provider.email && (
                                            <a
                                                href={`mailto:${provider.email}`}
                                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                            >
                                                <Mail className="w-4 h-4" />
                                                {provider.email}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
