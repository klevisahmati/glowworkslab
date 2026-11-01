import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { LanguageProvider } from '../lib/language'
import { readLanguagePreference } from '../lib/language-server'
import '../styles.css'

export const Route = createRootRoute({
  headers: () => ({ 'Cache-Control': 'private, no-store' }),
  beforeLoad: async () => ({
    initialLanguage: await readLanguagePreference(),
  }),
  component: RootApp,
  head: ({ match }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: match.context.initialLanguage === 'en'
          ? 'Glowworks.lab — Premium Car Customisation in Rhodes'
          : 'Glowworks.lab — Αναβαθμίσεις Αυτοκινήτων στη Ρόδο',
      },
      {
        name: 'description',
        content: match.context.initialLanguage === 'en'
          ? 'Premium automotive customisation in Rhodes, Greece. OEM ambient lighting, custom steering wheels, starlight headliners and multimedia upgrades.'
          : 'Premium αναβαθμίσεις αυτοκινήτων στη Ρόδο. Εργοστασιακός ambient φωτισμός, custom τιμόνια, αστέρια οροφής και οθόνες multimedia.',
      },
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

function RootApp() {
  const { initialLanguage } = Route.useRouteContext()

  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <Outlet />
    </LanguageProvider>
  )
}
