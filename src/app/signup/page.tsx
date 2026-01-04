import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans">
            <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C1E] p-8 rounded-[28px] shadow-xl border border-zinc-100 dark:border-zinc-800">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Create your account</h1>
                    <p className="text-zinc-500 text-sm">Enter your details to get started</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input
                            name="full_name"
                            required
                            placeholder="John Appleseed"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Phone Number</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="+1 234 567 890"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="Use a strong password"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        />
                    </div>

                    <button
                        formAction={signup}
                        className="w-full bg-black text-white dark:bg-white dark:text-black py-3.5 rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all mt-2"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-zinc-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
