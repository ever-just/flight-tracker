import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/navigation'
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
  title: 'Flight Tracker - Real-Time US Airport & Flight Status Dashboard',
  description: 'Track real-time flight status, delays, and airport conditions across the United States. Monitor top 100 US airports with live updates, historical trends, and interactive maps.',
  keywords: 'flight tracker, airport status, flight delays, US airports, real-time flights, aviation dashboard',
  authors: [{ name: 'Flight Tracker Team' }],
  openGraph: {
    title: 'Flight Tracker - Real-Time US Airport Status',
    description: 'Monitor live flight status and airport conditions across the United States',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flight Tracker Dashboard',
    description: 'Real-time US airport and flight status monitoring',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0A1929',
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
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-aviation-navy-light/20 mt-auto">
              <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8">
                <p className="text-center text-sm text-muted-foreground">
                  © 2024 Flight Tracker. Data provided by FAA, OpenSky Network, and BTS.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}