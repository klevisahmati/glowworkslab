import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authenticateAdmin, setStoredPortalRole } from '../../lib/portal-auth'

export const Route = createFileRoute('/portal/login')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = () => {
    if (!authenticateAdmin(email, password)) {
      setNotice('The admin email or password is incorrect.')
      return
    }

    setNotice(null)
    setStoredPortalRole('admin', email)
    navigate({ to: '/portal/admin' })
  }

  return (
    <main className="portal-page">
      <div className="shell portal-landing">
        <section className="portal-body-card portal-landing-card">
          <div className="portal-card" style={{ maxWidth: '460px', margin: '0 auto' }}>
            <p className="portal-eyebrow">Admin access</p>
            <h1>Secure administrator login</h1>
            <p className="portal-muted">Use your administrator credentials to access the protected admin dashboard.</p>
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <label className="full">
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="admin@your-domain.com" />
              </label>
              <label className="full">
                <span>Password</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter admin password"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className="button button-secondary"
                    style={{ padding: '8px 10px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>
            <div className="portal-actions" style={{ marginTop: '16px' }}>
              <button className="button button-primary" type="button" onClick={submit}>Sign in</button>
            </div>
            {notice ? <p className="portal-muted" style={{ marginTop: '12px' }}>{notice}</p> : null}
          </div>
        </section>
      </div>
    </main>
  )
}
