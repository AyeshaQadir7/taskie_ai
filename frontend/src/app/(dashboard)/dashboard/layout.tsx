import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Taskie dashboard with task overview and statistics',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardPageLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
