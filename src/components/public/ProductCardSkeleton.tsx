'use client'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden flex flex-col animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />

        {/* Description skeleton */}
        <div className="space-y-2 mb-3 flex-grow">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Price skeleton */}
        <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />

        {/* Button skeleton */}
        <div className="h-10 bg-gray-200 rounded-button w-full" />
      </div>
    </div>
  )
}
