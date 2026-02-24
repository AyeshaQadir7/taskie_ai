'use client'

/**
 * TopHeader Component
 * Navigation header with user account menu
 */

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'
import { ChevronDown, LogOut, Settings, User, Menu } from 'lucide-react'

export interface TopHeaderProps {
  onMobileMenuOpen?: () => void
}

export function TopHeader({ onMobileMenuOpen }: TopHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { label: 'My Tasks', href: '/tasks' },
    { label: 'My AI', href: '/chat' },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch {
      // Error is handled by auth context
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-[#fff] border-b border-gray-200 ">
      <div className="px-4 md:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Button */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate" />
          </button>

          {/* Center: Navigation Links (desktop only) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'text-violet-dark bg-violet-light/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right: User Menu */}
          <div className="ml-auto">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
              >
                <div className="h-8 w-8 rounded-full bg-violet-light/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-violet-dark">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-900">
                  {user?.name || user?.email}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-600 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-xs text-gray-600">Account</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User size={16} />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        router.push('/profile')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings size={16} />
                      Account Settings
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Logout */}
                  <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {isLoading ? 'Signing out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
