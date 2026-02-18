import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/common/Skeleton'

function FeaturesLoadingSkeleton() {
  return (
    <section className="relative px-4 sm:px-6 py-20 sm:py-24 lg:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Feature grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Dynamically import Features component with code splitting
export const Features = dynamic(() => import('./Features').then(mod => ({ default: mod.Features })), {
  loading: () => <FeaturesLoadingSkeleton />,
  ssr: true,
}) as any
