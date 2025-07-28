const SkeletonLoader = ({ count = 3, type = 'card' }) => {
    if (type === 'table') {
        return (
            <div className="w-full animate-pulse">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="flex space-x-4 items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
        </div>
    );
};

export default SkeletonLoader;