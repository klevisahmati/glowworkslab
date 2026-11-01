import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'el' | 'en'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode
  initialLanguage: Language
}) {
  const [language, updateLanguage] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (next: Language) => {
    updateLanguage(next)

    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie =
      `glowworks-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`

    try {
      window.localStorage.setItem('glowworks-language', next)
    } catch {
      // Cookie remains the source of truth.
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
