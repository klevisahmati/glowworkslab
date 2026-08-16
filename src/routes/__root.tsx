import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Glowworks.lab — Custom Interior Upgrades | Ρόδος' },
      { name: 'description', content: 'Ambient light, custom τιμόνια, αστέρια οροφής και οθόνες αυτοκινήτου από τη Glowworks.lab στη Ρόδο.' },
      { name: 'theme-color', content: '#09090d' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=3' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  )
}
