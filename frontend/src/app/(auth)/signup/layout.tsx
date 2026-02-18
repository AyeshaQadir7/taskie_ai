import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign Up for Taskie',
  description: 'Create a Taskie account to start managing your tasks and boost your productivity today',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sign Up for Taskie',
    description: 'Create an account and start managing your tasks',
  },
  twitter: {
    card: 'summary',
    title: 'Join Taskie',
    description: 'Create your free Taskie account today',
  },
}

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
