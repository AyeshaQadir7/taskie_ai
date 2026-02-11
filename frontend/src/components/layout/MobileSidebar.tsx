'use client'

/**
 * Mobile Sidebar Component
 * Collapsible sidebar for mobile view with overlay backdrop
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'
import { X, LayoutDashboard, CheckSquare, MessageSquare, Settings, LogOut } from 'lucide-react'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { signOut, isLoading } = useAuth()

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'My AI', href: '/chat', icon: MessageSquare },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // Error is handled by auth context
    }
  }

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Close Button */}
        <div className="px-6 py-6 border-b border-slate-light/10 flex items-center justify-between">
          <h1 className="text-xl font-grotesk font-semibold text-slate">Taskie</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-light/5 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-violet-light/10 text-violet'
                    : 'text-slate hover:bg-slate-light/5'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-4 py-6 border-t border-slate-light/10 space-y-1">
          <Link
            href="/profile"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-violet-light/10 text-violet'
                : 'text-slate hover:bg-slate-light/5'
            }`}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate hover:bg-slate-light/5 transition-colors disabled:opacity-50"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">
              {isLoading ? 'Signing out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
