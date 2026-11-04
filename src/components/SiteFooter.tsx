import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '../lib/language'

export function SiteFooter() {
  const { language } = useLanguage()
  const en = language === 'en'

  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <img
          src="/images/glowworks-logo.webp"
          alt="Glowworks.lab"
          loading="lazy"
        />

        <p className="footer-signature">
          <span>Where automotive design becomes personal.</span>
          <small>
            {en ? 'Crafted in Rhodes.' : 'Δημιουργημένο στη Ρόδο.'}
          </small>
        </p>

        <a href="#top">
          {en ? 'Back to top' : 'Επιστροφή στην αρχή'}
          <ArrowUpRight size={16} />
        </a>
      </div>

      <div className="shell footer-bottom">
        <span>© 2026 Glowworks.lab</span>
        <span>{en ? 'Rhodes, Greece' : 'Ρόδος, Ελλάδα'}</span>
        <a
          href="https://www.instagram.com/glowworks.lab/"
          target="_blank"
          rel="noopener noreferrer"
        >
          @glowworks.lab
        </a>
      </div>
    </footer>
  )
}