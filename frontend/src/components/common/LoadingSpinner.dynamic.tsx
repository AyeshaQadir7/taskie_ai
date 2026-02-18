import dynamic from 'next/dynamic'
import type { LoadingSpinnerProps } from './LoadingSpinner'

// Dynamically import LoadingSpinner component with code splitting
// SSR disabled for loading indicators as they're ephemeral UI elements
export const LoadingSpinner = dynamic(
  () => import('./LoadingSpinner').then(mod => ({ default: mod.LoadingSpinner })),
  {
    loading: () => <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-violet border-t-violet-dark animate-spin" />,
    ssr: false,
  }
) as React.ComponentType<LoadingSpinnerProps>
