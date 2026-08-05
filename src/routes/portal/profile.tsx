import { createFileRoute } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { PortalShell } from '../../components/portal/PortalShell'
import { portalCustomer } from '../../lib/portal-data'

export const Route = createFileRoute('/portal/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <PortalShell active="profile" title="Προφίλ" subtitle="Στοιχεία λογαριασμού και προτιμήσεις.">
      <div className="portal-grid portal-grid-two">
        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Κύρια επαφή</h3>
            <div className="portal-chip"><UserRound size={15} /> {portalCustomer.loyaltyTier}</div>
          </div>
          <div className="portal-list">
            <div className="portal-row">
              <div>
                <strong>Όνομα</strong>
                <p>{portalCustomer.name}</p>
              </div>
              <div className="portal-row-meta">
                <strong>Email</strong>
                <p>{portalCustomer.email}</p>
              </div>
            </div>
            <div className="portal-row">
              <div>
                <strong>Τηλέφωνο</strong>
                <p>{portalCustomer.phone}</p>
              </div>
              <div className="portal-row-meta">
                <strong>Διεύθυνση</strong>
                <p>{portalCustomer.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Προτιμήσεις</h3>
          </div>
          <p className="portal-muted">Η προτεραιότητα υποστήριξης, οι εποχιακές υπενθυμίσεις συντήρησης και οι ενημερώσεις εγκατάστασης μπορούν να διαχειριστούν εδώ ως μέρος της πλήρους εμπειρίας.</p>
        </div>
      </div>
    </PortalShell>
  )
}
