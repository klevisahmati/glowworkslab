import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPortalState, getStoredPortalRole, setStoredPortalRole } from '../lib/portal-session'

export const Route = createFileRoute('/portal')({
  component: PortalLandingPage,
})

function PortalLandingPage() {
  const router = useRouter()
  const [role, setRole] = useState<'customer' | 'admin' | null>(null)
  const [email, setEmail] = useState('nikos@glowworks.lab')

  useEffect(() => {
    const storedRole = getStoredPortalRole()
    setRole(storedRole)
    const state = getPortalState()
    if (state.session?.email) {
      setEmail(state.session.email)
    }
  }, [])

  const continueAs = (selectedRole: 'customer' | 'admin') => {
    setStoredPortalRole(selectedRole, email)
    setRole(selectedRole)
    router.navigate({ to: selectedRole === 'admin' ? '/portal/admin' : '/portal/dashboard' })
  }

  return (
    <main className="portal-page">
      <div className="shell portal-landing">
        <section className="portal-body-card portal-landing-card">
          <div className="portal-landing-copy">
            <p className="eyebrow"><span /> Glowworks customer portal</p>
            <h1>Welcome back to your ownership experience.</h1>
            <p>
              Access vehicle records, warranty coverage, service history and admin controls in one premium place.
            </p>
            <label className="form-grid" style={{ marginTop: '18px' }}>
              <label className="full">
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@glowworks.lab" />
              </label>
            </label>
            <div className="portal-actions">
              <button className="button button-primary" type="button" onClick={() => continueAs('customer')}>
                Continue as customer <ArrowRight size={18} />
              </button>
              <button className="button button-secondary" type="button" onClick={() => continueAs('admin')}>
                Continue as admin <ShieldCheck size={18} />
              </button>
            </div>
            <div className="portal-landing-info">
              <div>
                <Sparkles size={18} />
                <span>Live warranty snapshots</span>
              </div>
              <div>
                <Sparkles size={18} />
                <span>NFC-assisted service lookup</span>
              </div>
            </div>
          </div>
          <div className="portal-card portal-highlight-card">
            <h2>Current access</h2>
            <p>{role ? `Signed in as ${role} for ${email}.` : 'Choose a role to continue.'}</p>
            <p className="portal-muted">Your session is saved locally so returning visits keep your portal state intact.</p>
            <Link className="portal-nav-link" to="/portal/dashboard">Open dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
