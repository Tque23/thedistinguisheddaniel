import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { trajan } from './fonts'
import { SpeedInsights } from "@vercel/speed-insights/next"

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://distinguisheddaniel.com').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'The Distinguished Daniel Network & Institute',
  description:
    'An apostolic hub training, equipping and empowering believers to become distinguished Kingdom pioneers.',
  generator: 'v0.app',
  alternates: {
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={trajan.variable}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <SpeedInsights/>
      </body>
    </html>
  )
}
