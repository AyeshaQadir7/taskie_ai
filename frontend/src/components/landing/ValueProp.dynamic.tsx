import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/common/Skeleton'

function ValuePropLoadingSkeleton() {
  return (
    <section className="relative px-4 sm:px-6 py-20 sm:py-24 lg:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left content skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full max-w-xs" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <Skeleton className="h-12 w-40" />
        </div>

        {/* Right image skeleton */}
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </section>
  )
}

// Dynamically import ValueProp component with code splitting
export const ValueProp = dynamic(() => import('./ValueProp').then(mod => ({ default: mod.ValueProp })), {
  loading: () => <ValuePropLoadingSkeleton />,
  ssr: true,
}) as any
