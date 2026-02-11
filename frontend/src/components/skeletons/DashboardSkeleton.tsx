/**
 * DashboardSkeleton Component
 * Skeleton loader for dashboard page
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-80 bg-gray-200 rounded-lg" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 space-y-4 sm:space-y-0">
        <div className="flex-1 space-y-3">
          <div className="h-8 w-96 bg-gray-200 rounded-lg" />
          <div className="h-5 w-80 bg-gray-100 rounded" />
        </div>
        <div className="h-11 w-32 bg-gray-200 rounded-lg flex-shrink-0" />
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Progress Card Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-gray-200 rounded-full" />
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="pt-4 space-y-2">
            <div className="h-4 w-40 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Stats Card Skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-6 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
