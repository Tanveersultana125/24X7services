import type { Metadata, Viewport } from 'next'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '24X7 Admin Console',
    template: '%s · 24X7 Admin',
  },
  description: 'Run the 24×7 appliance service network — bookings, dispatch, customers, technicians, payments and support.',
  applicationName: '24X7 Admin Console',
  icons: { icon: '/favicon.png' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1d57',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  )
}
