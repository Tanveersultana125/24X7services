import type { Metadata, Viewport } from 'next'
import { StoreProvider } from '@/lib/store'
import { AppShell } from '@/components/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '24X7 Technician Partner',
    template: '%s · 24X7 Technician',
  },
  description: 'Receive, run and close 24×7 appliance service jobs — Samsung, LG, Bosch and IBM.',
  applicationName: '24X7 Technician Partner',
  icons: { icon: '/favicon.png' },
  appleWebApp: { capable: true, title: '24X7 Partner', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
