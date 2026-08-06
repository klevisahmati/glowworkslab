import { Link } from '@tanstack/react-router'
import { ArrowLeft, UserCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { getStoredPortalRole, logoutAdminSession } from '../../lib/portal-auth'

type PortalShellProps = {
  children: ReactNode
  active: string
  title: string
  subtitle?: string
}

const navItems = [
  { key: 'admin', label: 'Διαχείριση', href: '/portal/admin' },
]

export function PortalShell({ children, active, title, subtitle }: PortalShellProps) {
  const role = getStoredPortalRole()

  const handleExit = async () => {
    await logoutAdminSession()
    window.location.href = '/portal'
  }

  return (
    <main className="portal-page">
      <div className="shell portal-shell">
        <nav className="portal-shell-nav">
          <Link className="portal-brand" to="/">
            <img className="portal-brand-logo" src="/images/glowworks-logo.webp" alt="Glowworks logo" />
            <span>Glowworks Portal</span>
          </Link>
          <div className="portal-main-nav">
            {navItems.map((item) => {
              if (item.key === 'admin' && role !== 'admin') {
                return null
              }
              return (
                <Link key={item.key} to={item.href as never} className={active === item.key ? 'portal-nav-link active' : 'portal-nav-link'}>
                  {item.label}
                </Link>
              )
            })}
          </div>
          <button className="portal-ghost-button" type="button" onClick={handleExit}>
            <ArrowLeft size={15} /> Έξοδος
          </button>
        </nav>

        <section className="portal-body-card">
          <header className="portal-header">
            <div>
              <p className="eyebrow"><span /> Πόρταλ πελάτη</p>
              <h1>{title}</h1>
              {subtitle ? <p className="portal-subtitle">{subtitle}</p> : null}
            </div>
            <div className="portal-profile-pill">
              <UserCircle2 size={18} />
              <span>{role === 'admin' ? 'Πρόσβαση διαχειριστή' : 'Πρόσβαση πελάτη'}</span>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  )
}
