/**
 * Home / Landing Page
 * Main entry point for unauthenticated users
 * Displays the landing page with product information
 */

import type { Metadata } from 'next'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Hero } from '@/components/landing/Hero.dynamic'
import { Features } from '@/components/landing/Features.dynamic'
import { ValueProp } from '@/components/landing/ValueProp.dynamic'
import { LandingCTA } from '@/components/landing/LandingCTA.dynamic'
import { Footer } from '@/components/landing/Footer'
import { Heart } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Taskie - Modern Todo App for Task Management',
  description: 'Organize your tasks efficiently with Taskie. A modern, user-friendly todo application designed to boost your productivity and help you stay focused on what matters most.',
  openGraph: {
    title: 'Taskie - Modern Todo App',
    description: 'Organize your tasks efficiently with an intuitive todo application',
    url: 'https://taskie.app/',
    type: 'website',
    images: [
      {
        url: 'https://taskie.app/assets/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Taskie Landing Page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taskie - Todo App',
    description: 'Modern task management for productivity',
    images: ['https://taskie.app/assets/twitter-card.png'],
  },
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      <Hero />
      <Features />
      <ValueProp />
      <LandingCTA />
      <Footer />
      {/* Created by section */}
      <div className="py-6 px-0 flex items-center justify-center gap-2 text-white text-sm bg-slate-light">
        <span>Made with</span>
        <Heart className="w-4 h-4 text-white" />
        <span>by</span>
        <Link
          href="https://github.com/AyeshaQadir7"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline hover:text-violet transition-colors"
        >
          Ayesha Abdul Qadir
        </Link>
      </div>
    </div>
  )
}
