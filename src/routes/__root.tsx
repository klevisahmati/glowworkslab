import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
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
    links: [{ rel: 'icon', href: '/favicon.ico' }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <head><HeadContent /></head>
      <body><IdentityCallbackRedirect />{children}<Scripts /></body>
    </html>
  )
}

function IdentityCallbackRedirect() {
  useEffect(() => {
    const isIdentityCallback = /^#(confirmation_token|invite_token|recovery_token|access_token|token)=/.test(window.location.hash)
    if (isIdentityCallback && window.location.pathname !== '/portal/login') {
      window.location.replace(`/portal/login${window.location.hash}`)
    }
  }, [])

  return null
}
