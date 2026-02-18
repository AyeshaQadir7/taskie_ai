import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Chat with our AI assistant to manage your tasks',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
