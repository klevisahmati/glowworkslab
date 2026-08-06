import { createFileRoute } from '@tanstack/react-router'
import {
  acceptInvite,
  AuthError,
  handleAuthCallback,
  MissingIdentityError,
  requestPasswordRecovery,
  updateUser,
} from '@netlify/identity'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  AdminRoleRequiredError,
  authenticateAdmin,
  getAuthenticatedAdmin,
  isAdminUser,
  logoutAdminSession,
  setStoredPortalRole,
} from '../../lib/portal-auth'

export const Route = createFileRoute('/portal/login')({
  component: AdminLoginPage,
})

function getAuthErrorMessage(error: unknown) {
  if (error instanceof AdminRoleRequiredError) {
    return 'This account does not have administrator access.'
  }
  if (error instanceof MissingIdentityError) {
    return 'Secure login is not enabled on this deployment yet.'
  }
  if (error instanceof AuthError) {
    if (error.status === 401) {
      return 'The email or password is incorrect.'
    }
    if (error.status === 403) {
      return 'This account cannot sign in. Check that the invitation was accepted.'
    }
    return error.message
  }
  return 'Unable to complete the secure login. Please try again.'
}

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const callback = await handleAuthCallback()
        if (!active || !callback) {
          const admin = await getAuthenticatedAdmin()
          if (active && admin) {
            window.location.href = '/portal/admin'
          }
          return
        }

        if (callback.type === 'invite') {
          if (!callback.token) {
            setNotice('This administrator invitation link is invalid or expired.')
            return
          }
          setInviteToken(callback.token)
          setNotice('Choose a password to accept your administrator invitation.')
          return
        }

        if (callback.type === 'recovery') {
          setIsRecovery(true)
          setNotice('Enter a new password for your administrator account.')
          return
        }

        if (callback.user && isAdminUser(callback.user)) {
          setStoredPortalRole('admin')
          window.location.href = '/portal/admin'
          return
        }

        if (callback.user) {
          await logoutAdminSession()
          setNotice('This account does not have administrator access.')
        }
      } catch (error) {
        if (active) {
          setNotice(getAuthErrorMessage(error))
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setNotice(null)

    try {
      if (inviteToken) {
        const user = await acceptInvite(inviteToken, password)
        if (!isAdminUser(user)) {
          await logoutAdminSession()
          throw new AdminRoleRequiredError()
        }
        setStoredPortalRole('admin')
        window.location.href = '/portal/admin'
        return
      }

      if (isRecovery) {
        await updateUser({ password })
        const admin = await getAuthenticatedAdmin()
        if (!admin) {
          throw new AdminRoleRequiredError()
        }
        window.location.href = '/portal/admin'
        return
      }

      await authenticateAdmin(email, password)
      window.location.href = '/portal/admin'
    } catch (error) {
      setNotice(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendRecoveryEmail = async () => {
    if (!email.trim()) {
      setNotice('Enter your administrator email first.')
      return
    }

    setIsSubmitting(true)
    setNotice(null)
    try {
      await requestPasswordRecovery(email.trim().toLowerCase())
      setNotice('A password recovery link was sent if the account exists.')
    } catch (error) {
      setNotice(getAuthErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordMode = Boolean(inviteToken || isRecovery)

  return (
    <main className="portal-page">
      <div className="shell portal-landing">
        <section className="portal-body-card portal-landing-card">
          <form className="portal-card" style={{ maxWidth: '460px', margin: '0 auto' }} onSubmit={submit}>
            <p className="portal-eyebrow">Admin access</p>
            <h1>{inviteToken ? 'Accept administrator invite' : isRecovery ? 'Set a new password' : 'Secure administrator login'}</h1>
            <p className="portal-muted">
              {passwordMode
                ? 'Use a strong password with at least eight characters.'
                : 'Sign in with the Netlify Identity account assigned the admin role.'}
            </p>
            <div className="form-grid" style={{ marginTop: '16px' }}>
              {!passwordMode ? (
                <label className="full">
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="admin@example.com"
                  />
                </label>
              ) : null}
              <label className="full">
                <span>{passwordMode ? 'New password' : 'Password'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete={passwordMode ? 'new-password' : 'current-password'}
                    placeholder={passwordMode ? 'Choose a secure password' : 'Enter your password'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className="button button-secondary"
                    style={{ minHeight: '44px', paddingInline: '14px' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>
            <button className="button button-primary" type="submit" disabled={isSubmitting} style={{ marginTop: '16px', width: '100%' }}>
              {isSubmitting ? 'Please wait…' : inviteToken ? 'Accept invitation' : isRecovery ? 'Update password' : 'Sign in'}
            </button>
            {!passwordMode ? (
              <button className="portal-ghost-button" type="button" onClick={sendRecoveryEmail} disabled={isSubmitting} style={{ marginTop: '12px', width: '100%' }}>
                Forgot password?
              </button>
            ) : null}
            {notice ? <p className="portal-muted" role="status" style={{ marginTop: '12px' }}>{notice}</p> : null}
          </form>
        </section>
      </div>
    </main>
  )
}
