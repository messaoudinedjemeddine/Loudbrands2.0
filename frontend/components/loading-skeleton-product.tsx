export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[4/5] mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8" style={{ minHeight: '600px' }}>
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-12 max-w-7xl mx-auto items-start" style={{ minHeight: '500px' }}>
        {/* Image Skeleton */}
        <div className="lg:order-1 flex-shrink-0 w-full" style={{ minHeight: '400px' }}>
          <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-xl lg:rounded-2xl animate-pulse w-full shadow-elegant dark:shadow-2xl mb-3 sm:mb-4 lg:mb-6" style={{ minHeight: '400px' }}></div>
          <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-gray-200 dark:bg-gray-700 rounded-md sm:rounded-lg flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="lg:order-2 space-y-4 sm:space-y-6 lg:space-y-8 animate-pulse">
          <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-6 sm:h-8 lg:h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="flex gap-4">
            <div className="h-11 sm:h-12 lg:h-14 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-11 sm:h-12 lg:h-14 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

