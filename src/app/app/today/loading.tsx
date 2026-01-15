export default function Loading() {
    return (
        <div className="min-h-screen bg-[#1a1a1a] pb-32">
            {/* Header Skeleton */}
            <header className="pt-14 pb-4 px-6 flex justify-between items-center">
                <div>
                    <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
                    <div className="h-4 w-20 bg-white/5 rounded mt-2 animate-pulse" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            </header>

            <main className="px-6 space-y-10 mt-6">
                {/* Up Next Skeleton */}
                <section>
                    <div className="h-6 w-20 bg-white/10 rounded mb-4 animate-pulse" />
                    <div className="relative rounded-3xl h-48 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03]" />
                        <div className="absolute inset-0 rounded-3xl border border-white/10" />
                    </div>
                </section>

                {/* Services Skeleton */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                        <div className="h-4 w-14 bg-white/5 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="relative rounded-2xl w-36 h-36 overflow-hidden flex-shrink-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] animate-pulse" />
                                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions Skeleton */}
                <section>
                    <div className="h-6 w-28 bg-white/10 rounded mb-4 animate-pulse" />
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="relative rounded-2xl h-24 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] animate-pulse" />
                                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
