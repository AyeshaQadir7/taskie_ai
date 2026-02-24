'use client'

/**
 * Dashboard Layout
 * Two-column layout with fixed sidebar, top header, and responsive main content
 */

import { ReactNode, useState } from 'react'
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
        {/* Top Header with Mobile Menu */}
        <TopHeader onMobileMenuOpen={() => setMobileSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
