export default function Loading() {
    return (
        <div className="flex flex-col min-h-screen bg-[#1a1a1a] pb-24">
            {/* Header */}
            <div className="px-5 pt-16 pb-6 flex items-center justify-between">
                <div className="h-9 w-24 bg-white/10 rounded-lg animate-pulse" />
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 animate-pulse">
                    <div className="w-4 h-4" />
                    <div className="h-4 w-20" />
                </div>
            </div>

            <main className="px-5 space-y-8">
                {/* Services List Skeleton */}
                <section>
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03]" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />

                        <div className="relative z-10 divide-y divide-white/5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-4">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="h-5 w-32 bg-white/10 rounded mb-2 animate-pulse" />
                                        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                                    </div>
                                    <div className="w-5 h-5 bg-white/5 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Business Profile Skeleton */}
                <section>
                    <div className="h-4 w-28 bg-white/10 rounded ml-4 mb-2 animate-pulse" />
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03]" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />

                        <div className="relative z-10 divide-y divide-white/5">
                            <div className="px-4 py-4">
                                <div className="h-5 w-24 bg-white/10 rounded mb-3 animate-pulse" />
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <div key={i} className="flex-1 h-8 bg-white/5 rounded animate-pulse" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-4 py-4">
                                <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
                                <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
