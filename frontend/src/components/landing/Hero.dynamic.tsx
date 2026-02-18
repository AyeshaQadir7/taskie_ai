import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/common/Skeleton'

function HeroLoadingSkeleton() {
  return (
    <section className="relative flex flex-col items-center justify-start px-4 sm:px-6 py-20 sm:py-24 lg:py-28 overflow-hidden">
      {/* Badge skeleton */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>

      {/* Headline skeleton */}
      <div className="space-y-4 text-center w-full max-w-4xl">
        <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
        <Skeleton className="h-10 w-full max-w-2xl mx-auto" />
      </div>

      {/* Description skeleton */}
      <div className="space-y-2 text-center w-full max-w-2xl mx-auto mt-6">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>

      {/* CTA buttons skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
    </section>
  )
}

// Dynamically import Hero component with code splitting
export const Hero = dynamic(() => import('./Hero').then(mod => ({ default: mod.Hero })), {
  loading: () => <HeroLoadingSkeleton />,
  ssr: true,
}) as any
