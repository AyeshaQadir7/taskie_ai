import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign In to Taskie',
  description: 'Sign in to your Taskie account to access your tasks and manage your productivity',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Sign In to Taskie',
    description: 'Access your tasks and manage your productivity',
  },
}

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
