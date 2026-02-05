function SkeletonLoader() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-pulse">
      {/* Skeleton for user message */}
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%]">
          <div className="flex items-start gap-3 flex-row-reverse">
            {/* Avatar skeleton */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>
            {/* Message content skeleton */}
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton for assistant message */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
          {/* Message content skeleton */}
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-11/12"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-10/12"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton for another user message */}
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%]">
          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton for another assistant message */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-11/12"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-9/12"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoader
