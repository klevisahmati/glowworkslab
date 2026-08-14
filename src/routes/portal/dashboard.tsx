import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CarFront, ShieldCheck, Sparkles } from 'lucide-react'
import { PortalShell } from '../../components/portal/PortalShell'
import { portalAdminSummary, portalCustomer, portalVehicles, portalWarranties } from '../../lib/portal-data'
import SupabaseTest from '../../SupabaseTest'

export const Route = createFileRoute('/portal/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <PortalShell active="dashboard" title="Πίνακας ελέγχου" subtitle="Η επισκόπηση της εγγύησης και της ιδιοκτησίας σου.">
      <SupabaseTest />
      <div className="portal-grid">
        <div className="portal-card portal-highlight-card">

          <p className="portal-eyebrow">Καλώς όρισες ξανά</p>
          <h2>{portalCustomer.name}</h2>
          <p>{portalCustomer.email}</p>
          <div className="portal-actions">
            <Link className="button button-primary" to="/portal/warranties">
              Επισκόπηση εγγυήσεων <ArrowRight size={18} />
            </Link>
            <Link className="button button-secondary" to="/portal/claims">
              Προβολή αιτήσεων
            </Link>
            <a className="button button-secondary" href="/">
              Επιστροφή στην αρχική σελίδα
            </a>
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-stat-row">
            <div className="portal-stat">
              <strong>{portalVehicles.length}</strong>
              <span>Οχήματα</span>
            </div>
            <div className="portal-stat">
              <strong>{portalWarranties.length}</strong>
              <span>Εγγυήσεις</span>
            </div>
            <div className="portal-stat">
              <strong>{portalAdminSummary.pendingClaims}</strong>
              <span>Εκκρεμείς αιτήσεις</span>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-grid portal-grid-two">
        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Συνδεδεμένα οχήματα</h3>
            <Link className="portal-nav-link" to="/portal/vehicles">Διαχείριση</Link>
          </div>
          <div className="portal-list">
            {portalVehicles.map((vehicle) => (
              <div className="portal-row" key={vehicle.id}>
                <div>
                  <strong>{vehicle.make} {vehicle.model}</strong>
                  <p>{vehicle.plate} • {vehicle.year}</p>
                </div>
                <div className="portal-chip"><CarFront size={15} />{vehicle.nfcTagId ?? 'No tag'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Κατάσταση εγγύησης</h3>
            <Link className="portal-nav-link" to="/portal/warranties">Άνοιγμα</Link>
          </div>
          <div className="portal-list">
            {portalWarranties.map((warranty) => (
              <div className="portal-row" key={warranty.id}>
                <div>
                  <strong>{warranty.product}</strong>
                  <p>{warranty.status}</p>
                </div>
                <div className="portal-chip"><ShieldCheck size={15} />{warranty.endsOn}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Σημειώσεις premium υπηρεσιών</h3>
          <div className="portal-chip"><Sparkles size={15} /> Υποστήριξη concierge</div>
        </div>
        <p className="portal-muted">Τα αρχεία του οχήματός σου και η κάλυψη εγγύησης ελέγχονται από την ομάδα του Glowworks Lab μετά από κάθε εγκατάσταση. Αν αλλάξει κάτι, θα το δεις εδώ.</p>
      </div>
    </PortalShell>
  )
}
