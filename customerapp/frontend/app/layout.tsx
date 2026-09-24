import type { Metadata, Viewport } from 'next'
import { brand } from '@/config/brand'
import { AppChrome } from '@/components/AppChrome'
import { DemoGate } from '@/components/DemoGate'
import { ServiceWorker } from '@/components/ServiceWorker'
import { ToastProvider } from '@/components/Toast'
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
  themeColor: '#2547d0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // `scroll-smooth` is what makes the appliance page's service row glide to
    // the section it points at instead of teleporting. The reduced-motion
    // block in globals.css turns it back off for anyone who asked for that.
    <html lang="en" className="scroll-smooth">
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <ToastProvider>
          <DemoGate>
            <AppChrome />
            {children}
          </DemoGate>
        </ToastProvider>
        <ServiceWorker />
      </body>
    </html>
  )
}
