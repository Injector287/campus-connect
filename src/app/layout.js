import './globals.css'

export const metadata = {
  title: 'Loyola ERP',
  description: 'A modern, fast wrapper for Loyola College ERP',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
