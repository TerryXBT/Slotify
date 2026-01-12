import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">
            <div className="w-full max-w-md space-y-12">
                {/* Logo/Brand - Minimal */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-white rounded-2xl mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-light tracking-tight text-white">Slotify</h1>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 rounded-lg">
                        <p className="text-red-400 text-sm text-center font-light">{error}</p>
                    </div>
                )}

                {/* Signup Form - Minimal */}
                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name</label>
                        <input
                            name="full_name"
                            required
                            autoComplete="name"
                            placeholder="John Appleseed"
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="john@example.com"
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Phone Number</label>
                        <input
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+1 234 567 890"
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            placeholder="Create a strong password"
                            className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors text-lg font-light"
                        />
                    </div>

                    <div className="pt-8 space-y-4">
                        <button
                            formAction={signup}
                            className="w-full py-4 border-2 border-white text-white font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300 rounded-lg text-base"
                        >
                            Create Account
                        </button>

                        <div className="text-center pt-2">
                            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors font-light">
                                Already have an account? <span className="underline">Sign In</span>
                            </Link>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-gray-600 font-light">
                        Professional booking platform
                    </p>
                </div>
            </div>
        </div>
    )
}
