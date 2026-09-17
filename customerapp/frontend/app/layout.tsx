import type { Metadata, Viewport } from 'next'
import { brand } from '@/config/brand'
import { AppChrome } from '@/components/AppChrome'
import { ServiceWorker } from '@/components/ServiceWorker'
import { ToastProvider } from '@/components/Toast'
import { usingEmulators } from '@/lib/firebase'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: `${brand.fullName} — ${brand.tagline}`,
    template: `%s · ${brand.name}`,
  },
  description:
    'Book appliance repair, service, installation and maintenance. Transparent pricing, verified technicians, and repairs only after your approval.',
  applicationName: brand.fullName,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: brand.name,
    statusBarStyle: 'default',
  },
  formatDetection: {
    // Addresses and booking references otherwise get turned into phone links.
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The app has a bottom nav and sticky CTAs that need the safe area.
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* The first screen cannot render its content until Firestore answers,
            so the handshake starts while the bundle is still parsing rather
            than after it. Two origins, because auth and data are separate
            hosts; neither is preloaded, only connected to.
            
            Skipped against the emulators, where those hosts are never reached
            and the connections would be opened for nothing. */}
        {usingEmulators ? null : (
          <>
            <link rel="preconnect" href="https://firestore.googleapis.com" />
            <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
          </>
        )}
      </head>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <ToastProvider>
          <AppChrome />
          {children}
        </ToastProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
