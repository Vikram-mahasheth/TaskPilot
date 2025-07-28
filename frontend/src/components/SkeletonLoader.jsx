export const SkeletonCard = () => (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
    </div>
);

export const SkeletonColumn = () => (
    <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4 w-full md:w-1/3 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    </div>
);