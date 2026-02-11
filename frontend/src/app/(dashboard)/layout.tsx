'use client'

/**
 * Dashboard Layout
 * Two-column layout with fixed sidebar, top header, and responsive main content
 */

import { ReactNode, useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { TopHeader } from '@/components/layout/TopHeader'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* Top Header */}
        <TopHeader />

        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-light/10 px-4 py-3 flex items-center justify-between md:hidden">
          <span className="text-lg font-grotesk font-semibold text-slate">
            Taskie
          </span>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 hover:bg-slate-light/5 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate" />
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
