import { useLanguage } from '../lib/language'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="gw-language-switch" role="group" aria-label="Website language">
      <button
        type="button"
        className={language === 'el' ? 'is-active' : ''}
        aria-pressed={language === 'el'}
        onClick={() => setLanguage('el')}
      >
        EL
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={language === 'en' ? 'is-active' : ''}
        aria-pressed={language === 'en'}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
    </div>
  )
}