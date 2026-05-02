export default function Loader() {
    // Determine how many skeletons to show (e.g., 8 covers most screens)
    const skeletons = Array(8).fill(0);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 w-full animate-pulse">
            {skeletons.map((_, index) => (
                <div key={index} className="bg-white rounded-[1rem] p-3 border border-gray-100 shadow-sm flex flex-col h-full">
                    {/* Image Placeholder matches aspect-[2/3] of ProductCard */}
                    <div className="relative aspect-[2/3] bg-gray-200 rounded-[.5rem] mb-4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    </div>

                    {/* Info Placeholder */}
                    <div className="flex-1 px-1 mt-2 flex flex-col">
                        {/* Title */}
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />

                        {/* Description */}
                        <div className="mb-3 space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded w-full" />
                            <div className="h-3 bg-gray-200 rounded w-5/6" />
                        </div>

                        {/* Rating and Price */}
                        <div className="flex justify-between items-center mt-auto pt-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-5 bg-gray-200 rounded w-1/4" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
