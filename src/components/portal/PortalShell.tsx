import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { clearStoredPortalRole, getStoredPortalRole } from '../../lib/portal-session'
import type { PortalRole } from '../../types/portal'

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
  const router = useRouter()
const [role, setRole] = useState<'admin' | 'customer' | null>(null)

useEffect(() => {
  setRole(getStoredPortalRole())
}, [])

  const handleExit = () => {
    clearStoredPortalRole()
    router.navigate({ to: '/portal' })
  }

  return (
    <main className="portal-page">
      <div className="shell portal-shell">
        <nav className="portal-shell-nav">
          <Link className="portal-brand" to="/">
            <img className="portal-brand-logo" src="/images/glowworks-logo.webp" alt="Glowworks logo" />
            <span>GLOWWORKS.LAB&nbsp;&nbsp;PORTAL</span>
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
        </nav>

        <section className="portal-body-card">
          <header className="portal-header">
            <div>
              <h1>{title}</h1>
              {subtitle ? <p className="portal-subtitle">{subtitle}</p> : null}
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  )
}
