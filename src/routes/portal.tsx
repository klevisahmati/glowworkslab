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
            <p className="eyebrow"><span /> Πόρταλ πελάτη Glowworks</p>
            <h1>Καλώς ήρθες ξανά στην εμπειρία ιδιοκτησίας σου.</h1>
            <p>
              Πρόσβαση σε αρχεία οχημάτων, κάλυψη εγγύησης, ιστορικό υπηρεσιών και εργαλεία διαχείρισης από ένα premium σημείο.
            </p>
            <label className="form-grid" style={{ marginTop: '18px' }}>
              <label className="full">
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@glowworks.lab" />
              </label>
            </label>
            <div className="portal-actions">
              <button className="button button-primary" type="button" onClick={() => continueAs('customer')}>
                Συνέχεια ως πελάτης <ArrowRight size={18} />
              </button>
              <button className="button button-secondary" type="button" onClick={() => continueAs('admin')}>
                Συνέχεια ως διαχειριστής <ShieldCheck size={18} />
              </button>
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
            <p>{role ? `Συνδεδεμένος ως ${role} για ${email}.` : 'Επίλεξε ρόλο για να συνεχίσεις.'}</p>
            <p className="portal-muted">Η συνεδρία σου αποθηκεύεται τοπικά, ώστε οι επαναλαμβανόμενες επισκέψεις να διατηρούν την κατάσταση του portal.</p>
            <Link className="portal-nav-link" to="/portal/dashboard">Άνοιγμα πίνακα</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
