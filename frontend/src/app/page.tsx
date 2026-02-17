/**
 * Home / Landing Page
 * Main entry point for unauthenticated users
 * Displays the landing page with product information
 */

import { LandingHeader } from '@/components/landing/LandingHeader'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { ValueProp } from '@/components/landing/ValueProp'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      <Hero />
      <Features />
      <ValueProp />
      <LandingCTA />
      <Footer />
    </div>
  )
}
