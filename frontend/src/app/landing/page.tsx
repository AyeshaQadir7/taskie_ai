/**
 * Landing Page
 * Public landing page for unauthenticated users
 * Modern, professional design inspired by leading SaaS companies
 * Part of User Story 1: Landing Page
 */

import { LandingHeader } from '@/components/landing/LandingHeader'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { ValueProp } from '@/components/landing/ValueProp'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
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
