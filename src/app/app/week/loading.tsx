export default function Loading() {
    return (
        <div className="flex flex-col min-h-screen bg-[#1a1a1a] pb-24">
            {/* Header Skeleton */}
            <div className="pt-14 px-5 pb-6">
                <div className="h-9 w-28 bg-white/10 rounded-lg mb-6 animate-pulse" />

                {/* Week Strip Skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-9 h-9 bg-white/5 rounded-full animate-pulse" />
                            <div className="w-9 h-9 bg-white/5 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Days Skeleton */}
                <div className="flex justify-between px-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-[3.25rem]">
                            <div className="h-3 w-6 bg-white/5 rounded animate-pulse" />
                            <div className="w-9 h-9 bg-white/10 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Subheader Skeleton */}
            <div className="px-6 mb-5 flex items-end gap-3">
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            </div>

            {/* Filters Skeleton */}
            <div className="px-5 mb-6">
                <div className="relative rounded-xl p-1 flex overflow-hidden bg-white/5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 py-1.5 px-4">
                            <div className="h-4 bg-white/10 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Booking List Skeleton */}
            <div className="flex-1 px-5 space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="relative h-24 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] animate-pulse" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    </div>
                ))}
            </div>
        </div>
    )
}
