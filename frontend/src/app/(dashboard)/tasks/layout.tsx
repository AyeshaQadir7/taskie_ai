import type { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'My Tasks',
  description: 'Manage and view all your tasks',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TasksLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
