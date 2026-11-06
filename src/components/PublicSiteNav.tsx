import { installPublicNavActive } from '../lib/public-nav-active'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Home, Menu, X } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLanguage } from '../lib/language'

/** Shared navigation for public portfolio, project and 3D Shop pages. */
export function PublicSiteNav() {
  const { language } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  useEffect(() => installPublicNavActive(), [])
  const [isScrolled, setIsScrolled] = useState(false)
  useEffect(() => {
    const updateScroll = () => setIsScrolled(window.scrollY > 20)
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])
  const en = language === 'en'

  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)
  const homeLabel = en ? 'Home' : 'Αρχική'
  const bookLabel = en ? 'Book an appointment' : 'Κλείσε ραντεβού'

  return (
    <nav className={`gw-public-nav site-nav${isScrolled ? ' is-scrolled' : ''}`} aria-label={en ? 'Main navigation' : 'Κύρια πλοήγηση'}>
        {/* Desktop navigation mirrors the homepage. Mobile navigation below remains unchanged. */}
        <div className="gw-public-desktop nav-shell">
          <a className="brand" href="/" aria-label={en ? 'Glowworks.lab homepage' : 'Αρχική Glowworks.lab'}>
            <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" />
            <span className="brand-name">GLOWWORKS.LAB</span>
          </a>
          <div className="nav-links">
            <a className="nav-3d-shop" href="/products">3D SHOP</a>
            <a href="/projects">Projects</a>
            <a href="/#services">{en ? 'Services' : 'Υπηρεσίες'}</a>
            <a href="/#process">{en ? 'Our Process' : 'Διαδικασία'}</a>
            <LanguageSwitcher />
            <a className="nav-book" href="/#booking">
              {en ? 'Book an appointment' : 'Κλείστε ραντεβού'} <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      <div className="gw-public-nav-inner">
        <a className="gw-public-brand" href="/" aria-label={en ? 'Glowworks.lab home' : 'Αρχική Glowworks.lab'}>
          <img src="/images/glowworks-logo.webp" alt="Glowworks.lab" />
        </a>

        <div className="gw-public-nav-links">
          <a href="/" className="gw-public-home-link"><Home size={15} />{homeLabel}</a>
          <a href="/projects">Projects</a>
          <a href="/products">3D Shop</a>
          <a href="/#booking" className="gw-public-nav-book">{bookLabel}<ArrowUpRight size={16} /></a>
        </div>

        <div className="gw-public-nav-controls">
          <LanguageSwitcher />
          <a className="gw-public-mobile-home" href="/" aria-label={homeLabel} title={homeLabel}>
            <Home size={17} />
          </a>
          <button
            type="button"
            className="gw-public-menu-toggle"
            aria-label={isMenuOpen ? (en ? 'Close menu' : 'Κλείσιμο μενού') : (en ? 'Open menu' : 'Άνοιγμα μενού')}
            aria-controls="gw-public-menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <div id="gw-public-menu" className={`gw-public-mobile-menu${isMenuOpen ? ' is-open' : ''}`}>
        <a href="/" onClick={closeMenu}>{homeLabel}</a>
        <a href="/projects" onClick={closeMenu}>Projects</a>
        <a href="/products" onClick={closeMenu}>3D Shop</a>
        <a href="/#booking" onClick={closeMenu}>{bookLabel}<ArrowUpRight size={16} /></a>
      </div>
    </nav>
  )
}
