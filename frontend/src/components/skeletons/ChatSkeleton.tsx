/**
 * ChatSkeleton Component
 * Skeleton loader for chat page
 */

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4 max-w-lg animate-pulse space-y-6">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gray-200 mx-auto shadow-lg" />

            {/* Text */}
            <div className="space-y-3">
              <div className="h-8 w-40 bg-gray-200 rounded-lg mx-auto" />
              <div className="h-5 w-56 bg-gray-100 rounded mx-auto" />
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 w-32 bg-gray-100 rounded-xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end border border-gray-200 rounded-2xl bg-gray-50 p-4 animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="flex-shrink-0 ml-4 h-9 w-9 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-3 w-32 bg-gray-100 rounded mt-2 mx-auto" />
        </div>
      </div>
    </div>
  );
}
