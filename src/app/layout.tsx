import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MR Coaching',
  description: 'Client workout programming and coaching platform',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MR Coaching' },
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#3b82f6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><meta name="format-detection" content="telephone=no" /></head>
      <body className="pb-safe antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}