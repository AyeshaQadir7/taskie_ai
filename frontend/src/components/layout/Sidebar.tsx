'use client'

/**
 * Sidebar Component
 * Fixed sidebar navigation for desktop view
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'
import { LayoutDashboard, CheckSquare, MessageSquare, Settings, LogOut } from 'lucide-react'

export function Sidebar() {
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

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#fff] border-r border-slate-light/10 shadow-sm flex flex-col">
      {/* Branding */}
      <div className="px-6 py-6 border-b border-slate-light/10">
        <h1 className="text-xl font-grotesk font-semibold text-slate">Taskie</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive
                  ? 'bg-violet-light/20 text-violet-dark'
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
  )
}
