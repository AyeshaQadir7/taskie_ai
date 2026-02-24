import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Roboto } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/auth-context'
import '@/styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
})

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Taskie - Modern Todo App for Task Management',
    template: '%s | Taskie',
  },
  description: 'Taskie is a modern, user-friendly todo application for managing your tasks efficiently. Organize, prioritize, and track your productivity with our intuitive task management system.',
  keywords: ['todo', 'task management', 'productivity', 'tasks', 'to-do list', 'productivity app'],
  authors: [
    {
      name: 'Ayesha Abdul Qadir',
      url: 'https://github.com/AyeshaQadir7',
    },
  ],
  creator: 'Ayesha Abdul Qadir',
  publisher: 'Taskie',
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://taskie.app',
    title: 'Taskie - Modern Todo App for Task Management',
    description: 'A modern, user-friendly todo application for managing your tasks efficiently with an intuitive interface.',
    siteName: 'Taskie',
    images: [
      {
        url: 'https://taskie.app/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Taskie - Todo App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taskie - Modern Todo App',
    description: 'Organize and manage your tasks with Taskie',
    images: ['https://taskie.app/assets/twitter-card.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/assets/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Taskie',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
}

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`scroll-smooth ${spaceGrotesk.className} ${roboto.className}`}>
      <head>
        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Inline critical styles for initial render */}
        <style dangerouslySetInnerHTML={{__html: `
          html { scroll-behavior: smooth; }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #323843;
            font-family: 'Roboto', 'Space Grotesk', system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Taskie',
              alternateName: 'Taskie - Todo App',
              description: 'A modern, user-friendly todo application for managing your tasks efficiently',
              url: 'https://taskie.app',
              image: 'https://taskie.app/assets/og-image.png',
              applicationCategory: 'ProductivityApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Person',
                name: 'Ayesha Abdul Qadir',
                url: 'https://github.com/AyeshaQadir7',
              },
            }),
          }}
        />
      </head>
      <body className='bg-white max-w-[1400px] mx-auto overflow-x-hidden scroll-smooth'>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RootLayoutContent>{children}</RootLayoutContent>
}
