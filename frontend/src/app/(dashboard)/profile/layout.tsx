import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Profile Settings',
  description: 'Manage your Taskie profile and account settings',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
