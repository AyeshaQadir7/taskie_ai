/**
 * Dashboard Layout
 * Layout for authenticated pages with navbar and tab navigation
 */

import { ReactNode } from 'react'
import { Navbar } from '@/components/common/Navbar'
import { TabNav } from '@/components/common/TabNav'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <TabNav />
      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
