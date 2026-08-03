import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck, UserCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { clearStoredPortalRole, getStoredPortalRole } from '../../lib/portal-session'
import type { PortalRole } from '../../types/portal'

type PortalShellProps = {
  children: ReactNode
  active: string
  title: string
  subtitle?: string
}

const navItems = [
  { key: 'dashboard', label: 'Πίνακας', href: '/portal/dashboard' },
  { key: 'vehicles', label: 'Οχήματα', href: '/portal/vehicles' },
  { key: 'warranties', label: 'Εγγυήσεις', href: '/portal/warranties' },
  { key: 'claims', label: 'Αιτήσεις', href: '/portal/claims' },
  { key: 'nfc', label: 'NFC', href: '/portal/nfc' },
  { key: 'admin', label: 'Διαχείριση', href: '/portal/admin' },
  { key: 'profile', label: 'Προφίλ', href: '/portal/profile' },
]

export function PortalShell({ children, active, title, subtitle }: PortalShellProps) {
  const router = useRouter()
  const role = getStoredPortalRole()

  const handleExit = () => {
    clearStoredPortalRole()
    router.navigate({ to: '/portal' })
  }

  return (
    <main className="portal-page">
      <div className="shell portal-shell">
        <nav className="portal-shell-nav">
          <Link className="portal-brand" to="/portal/dashboard">
            <ShieldCheck size={18} /> Glowworks Portal
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
