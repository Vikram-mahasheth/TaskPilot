const SkeletonLoader = ({ count = 1 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg shadow animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;