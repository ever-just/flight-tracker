import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Airport Watch - Real-Time US Airport & Flight Status Tracking',
  description: 'Monitor real-time flight delays, cancellations, and airport conditions across the United States. Live tracking of 100+ US airports with historical data, interactive maps, and performance analytics.',
  keywords: 'airport watch, flight tracker, airport status, flight delays, flight cancellations, US airports, real-time flights, aviation dashboard, airport delays, flight monitoring, FAA data, live flight map',
  authors: [{ name: 'Airport Watch' }],
  metadataBase: new URL('https://airportwatch.live'),
  openGraph: {
    title: 'Airport Watch - Real-Time Airport & Flight Status',
    description: 'Monitor live flight delays, cancellations, and airport conditions across the United States with real-time data from OpenSky Network, FAA, and BTS.',
    type: 'website',
    locale: 'en_US',
    url: 'https://airportwatch.live',
    siteName: 'Airport Watch',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Airport Watch - Real-Time Flight Status Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Airport Watch - Real-Time Flight Tracking',
    description: 'Monitor delays, cancellations, and airport conditions across 100+ US airports',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://airportwatch.live'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        inter.variable, 
        spaceGrotesk.variable,
        'font-sans antialiased min-h-screen'
      )}>
        <Providers>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
              <footer className="border-t border-aviation-navy-light/20 mt-auto">
                <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8">
                  <p className="text-center text-sm text-muted-foreground">
                    © 2025 Airport Watch. Data provided by FAA, OpenSky Network, and BTS.
                  </p>
                </div>
              </footer>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}