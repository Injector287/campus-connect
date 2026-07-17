export default function manifest() {
  return {
    name: 'Loyola ERP',
    short_name: 'Loyola ERP',
    description: 'A modern, fast wrapper for Loyola College ERP',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
