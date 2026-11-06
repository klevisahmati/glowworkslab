/**
 * Keep the desktop public navigation in sync with the current route
 * and with the sections visible on the homepage.
 */
export function installPublicNavActive(): () => void {
  const update = () => {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
    let active: 'projects' | 'products' | 'services' | 'process' | null = null

    if (pathname === '/projects' || pathname.startsWith('/project/')) {
      active = 'projects'
    } else if (pathname === '/products' || pathname.startsWith('/products/')) {
      active = 'products'
    } else if (pathname === '/') {
      const threshold = 160
      const services = document.getElementById('services')
      const process = document.getElementById('process')
      const booking = document.getElementById('booking')

      if (services && services.getBoundingClientRect().top <= threshold) {
        active = 'services'
      }
      if (process && process.getBoundingClientRect().top <= threshold) {
        active = 'process'
      }
      if (booking && booking.getBoundingClientRect().top <= threshold) {
        active = null
      }
    }

    const anchors = document.querySelectorAll<HTMLAnchorElement>(
      '.site-nav .nav-links > a, .gw-public-desktop .nav-links > a',
    )
    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href') || ''
      let key: typeof active = null
      if (href === '/projects') key = 'projects'
      if (href === '/products') key = 'products'
      if (href === '#services' || href === '/#services') key = 'services'
      if (href === '#process' || href === '/#process') key = 'process'

      const selected = key !== null && key === active
      anchor.classList.toggle('gw-nav-active', selected)
      if (selected) {
        anchor.setAttribute('aria-current', key === 'services' || key === 'process' ? 'location' : 'page')
      } else {
        anchor.removeAttribute('aria-current')
      }
    })
  }

  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('hashchange', update)
  window.addEventListener('popstate', update)
  return () => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('hashchange', update)
    window.removeEventListener('popstate', update)
  }
}
