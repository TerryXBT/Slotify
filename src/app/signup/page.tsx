import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-2xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Slotify</h1>
                    <p className="text-gray-400 text-sm">Professional booking platform</p>
                </div>

                {/* Signup Form */}
                <form className="relative rounded-3xl overflow-hidden">
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                    <div className="absolute inset-0 rounded-3xl border border-white/20" />

                    <div className="relative z-10 p-8 space-y-6">
                        {error && (
                            <div className="relative rounded-2xl p-4 overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-xl" />
                                <div className="absolute inset-0 rounded-2xl border border-red-500/30" />
                                <p className="relative z-10 text-red-400 text-sm font-medium text-center">{error}</p>
                            </div>
                        )}

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
                            <p className="text-gray-400 text-sm">Enter your details to get started</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">Full Name</label>
                                <input
                                    name="full_name"
                                    required
                                    placeholder="John Appleseed"
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    placeholder="+1 234 567 890"
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-white/90 mb-2">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Use a strong password"
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <button
                            formAction={signup}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-[17px] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25"
                        >
                            Create Account
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                Already have an account? Sign In
                            </Link>
                        </div>
                    </div>
                </form>

                <p className="text-center text-gray-500 text-xs mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}
