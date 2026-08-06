import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAuthenticatedAdmin } from '../lib/portal-auth'

export const Route = createFileRoute('/portal')({
  component: PortalLayout,
})

function PortalLayout() {
  const location = useLocation()
  const isPortalHome = location.pathname === '/portal'

  if (!isPortalHome) {
    return <Outlet />
  }

  return <PortalLandingPage />
}

function PortalLandingPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    void getAuthenticatedAdmin().then((admin) => {
      if (!active) {
        return
      }
      if (admin) {
        window.location.href = '/portal/admin'
        return
      }
      setIsCheckingSession(false)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="portal-page">
      <div className="shell portal-landing">
        <section className="portal-body-card portal-landing-card">
          <div className="portal-landing-copy">
            <p className="eyebrow"><span /> Glowworks admin portal</p>
            <h1>Secure access to the Glowworks control center.</h1>
            <p>
              Manage customer records, warranties, services, projects, and website content through an administrator account protected by Netlify Identity.
            </p>
            <div className="portal-card" style={{ marginTop: '18px', padding: '16px', border: '1px solid rgba(76, 211, 209, 0.24)' }}>
              <p className="portal-eyebrow">Administrator access</p>
              <p className="portal-muted" style={{ marginBottom: '12px' }}>
                {isCheckingSession ? 'Checking your secure session…' : 'Sign in with an invited account assigned the admin role.'}
              </p>
              <div className="portal-actions" style={{ marginTop: '14px' }}>
                <Link className="button button-primary" to="/portal/login">
                  Secure admin login <ShieldCheck size={18} />
                </Link>
              </div>
            </div>
            <div className="portal-landing-info">
              <div>
                <Sparkles size={18} />
                <span>Protected administrator sessions</span>
              </div>
              <div>
                <Sparkles size={18} />
                <span>Password recovery and invitations</span>
              </div>
            </div>
          </div>
          <div className="portal-card portal-highlight-card">
            <h2>Secure authentication</h2>
            <p>Administrator access now requires a verified Netlify Identity account with the admin role.</p>
            <p className="portal-muted">Passwords are handled by Netlify Identity and are no longer stored in public browser configuration.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
