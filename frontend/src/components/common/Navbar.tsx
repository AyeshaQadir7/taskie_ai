"use client";

/**
 * Navbar Component
 * Compact, modern dashboard navigation bar
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { LogOut, Settings, ChevronDown, Grid2x2Check } from "lucide-react";

export function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Error is handled by auth context
    }
  };

  // Get user initials for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const initials = getInitials(user?.name, user?.email);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-light/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 justify-between items-center">
          {/* Logo */}
          <Link href="/tasks" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet flex items-center justify-center">
              <Grid2x2Check className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-grotesk font-semibold text-slate hidden sm:block">
              Taskie
            </span>
          </Link>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-light/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-violet flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{initials}</span>
                </div>
                <span className="text-sm text-slate hidden sm:block max-w-[120px] truncate">
                  {user.name || user.email?.split("@")[0]}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-light/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-light/10 py-1 animate-fade-in">
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-slate-light/10">
                    <p className="text-sm font-medium text-slate truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-slate-light/60 truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate hover:bg-slate-light/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoading ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
