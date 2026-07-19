import './globals.css'

export const metadata = {
  title: 'Loyola ERP',
  description: 'A modern, fast wrapper for Loyola College ERP',
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
