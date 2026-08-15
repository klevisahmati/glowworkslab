import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  authenticateAdmin,
  getStoredPortalRole,
  hasValidAdminSession,
  setStoredPortalRole,
} from '../lib/portal-auth'

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
  const router = useRouter()
  const navigate = useNavigate()
  const [role, setRole] = useState<'admin' | null>(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const isAdminSessionActive = useMemo(
    () => hasValidAdminSession(),
    [role],
  )

  useEffect(() => {
    const storedRole = getStoredPortalRole()
    setRole(storedRole === 'admin' ? 'admin' : null)

    if (isAdminSessionActive) {
      navigate({ to: '/portal/admin' })
    }
  }, [isAdminSessionActive, navigate])

  const continueAsAdmin = async () => {
    if (!(await authenticateAdmin(adminEmail, adminPassword))) {
      setNotice('The admin email or password is incorrect.')
      return
    }

    setNotice(null)
    setStoredPortalRole('admin')
    setRole('admin')
    router.navigate({ to: '/portal/admin' })
  }

  return (
    <main className="portal-page">
      <div className="shell portal-landing">
        <section className="portal-body-card portal-landing-card">
          <div className="portal-landing-copy">
            <p className="eyebrow">
              <span /> Πόρταλ πελάτη Glowworks
            </p>

            <h1>Καλώς ήρθες ξανά στην εμπειρία ιδιοκτησίας σου.</h1>

            <p>
              Πρόσβαση σε αρχεία οχημάτων, κάλυψη εγγύησης,
              ιστορικό υπηρεσιών και εργαλεία διαχείρισης από
              ένα premium σημείο.
            </p>

            <div
              className="portal-card"
              style={{
                marginTop: '18px',
                padding: '16px',
                border: '1px solid rgba(76, 211, 209, 0.24)',
              }}
            >
              <p className="portal-eyebrow">Σύνδεση διαχειριστή</p>

              <p
                className="portal-muted"
                style={{ marginBottom: '12px' }}
              >
                Η πρόσβαση είναι διαθέσιμη μόνο για τον κύριο
                διαχειριστή του Glowworks portal.
              </p>

              <div className="form-grid">
                <label className="full">
                  <span>Admin email</span>
                  <input
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="Admin email"
                    autoComplete="email"
                  />
                </label>

                  <label className="full">
  <label className="full">
  <span>Admin password</span>
  <input
    value={adminPassword}
    onChange={(event) => setAdminPassword(event.target.value)}
    placeholder="Admin password"
    type="password"
    autoComplete="current-password"
  />
</label>
</label>
                </div>

                <div
                  className="portal-actions"
                  style={{ marginTop: '14px' }}
                >
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={continueAsAdmin}
                  >
                    Συνέχεια ως διαχειριστής <ShieldCheck size={18} />
                  </button>
                </div>

                {notice ? (
                  <p
                    className="portal-muted"
                    style={{ marginTop: '12px' }}
                  >
                    {notice}
                  </p>
                ) : null}
              </div>

              <div className="portal-landing-info">
                <div>
                  <Sparkles size={18} />
                  <span>Live στιγμιότυπα εγγύησης</span>
                </div>

                <div>
                  <Sparkles size={18} />
                  <span>Αναζήτηση υπηρεσίας με NFC</span>
              </div>
            </div>
          </div>

          <div className="portal-card portal-highlight-card">
            <h2>Τρέχουσα πρόσβαση</h2>

            <p>
              {role
                ? `Συνδεδεμένος ως admin για ${adminEmail}.`
                : 'Εισέλθε ως διαχειριστής για να συνεχίσεις.'}
            </p>

            <p className="portal-muted">
              Η συνεδρία σου αποθηκεύεται τοπικά, ώστε οι
              επαναλαμβανόμενες επισκέψεις να διατηρούν την
              κατάσταση του portal.
            </p>

            <div
              className="portal-actions"
              style={{ marginTop: '12px' }}
            >
              <Link
                className="button button-primary"
                to="/portal/admin"
              >
                Άνοιγμα admin portal
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}