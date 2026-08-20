import './globals.css'

export const metadata = {
  title: 'Flow',
  description: 'A modern, fast wrapper for Loyola College ERP',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/apple-icon.png'
  },
  appleWebApp: {
    title: 'Flow',
    capable: true,
    statusBarStyle: 'default'
  }
}

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
