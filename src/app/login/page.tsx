import { login, signup } from './actions'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await searchParams

    if (user) {
        redirect('/app/today')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
            <form className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-6 border border-gray-100 dark:border-zinc-800">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to manage your bookings</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <button formAction={login} className="w-full bg-black text-white dark:bg-white dark:text-black py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                        Sign In
                    </button>
                    <div className="text-center">
                        <Link href="/signup" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Don&apos;t have an account? Sign Up
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    )
}
