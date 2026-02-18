'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';

/**
 * 404 Not Found Page
 * Custom error page for missing routes
 */

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-light/5 to-white flex items-center justify-center px-4 py-20 overflow-hidden relative">

      <div
        className="w-full max-w-2xl relative z-10 text-center space-y-8"
      >
        {/* 404 Number */}
        <div>
          <div className="text-9xl font-bold text-transparent bg-gradient-to-r from-violet to-violet-dark bg-clip-text mb-4">
            404
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1
            className="text-5xl sm:text-6xl font-bold text-slate tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Page Not Found
          </h1>
          <p className="text-xl text-slate-light/80 max-w-lg mx-auto leading-relaxed">
            Oops! The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Search suggestion */}
        <div
          className="flex items-center justify-center gap-2 text-sm text-slate-light/60"
         
        >
          <Search className="w-4 h-4" />
          <span>Let's get you back on track</span>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
       
        >
          <Link href="/">
            <Button variant="secondary" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

        </div>
      </div>
    </div>
  );
}
