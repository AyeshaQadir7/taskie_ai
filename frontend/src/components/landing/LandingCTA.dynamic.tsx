import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/common/Skeleton'

function LandingCTALoadingSkeleton() {
  return (
    <section className="relative px-4 sm:px-6 py-20 sm:py-24 lg:py-28 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Heading skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-2xl mx-auto" />
          <Skeleton className="h-6 w-full max-w-xl mx-auto" />
        </div>

        {/* CTA buttons skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Skeleton className="h-12 w-40 mx-auto sm:mx-0" />
          <Skeleton className="h-12 w-40 mx-auto sm:mx-0" />
        </div>
      </div>
    </section>
  )
}

// Dynamically import LandingCTA component with code splitting
export const LandingCTA = dynamic(() => import('./LandingCTA').then(mod => ({ default: mod.LandingCTA })), {
  loading: () => <LandingCTALoadingSkeleton />,
  ssr: true,
}) as any
