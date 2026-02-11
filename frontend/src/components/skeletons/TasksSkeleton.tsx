/**
 * TasksSkeleton Component
 * Skeleton loader for tasks page
 */

export function TasksSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-8 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Task List Items */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
          >
            {/* Task Header */}
            <div className="flex items-start gap-4">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="flex gap-3">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-24 bg-gray-100 rounded-full" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
