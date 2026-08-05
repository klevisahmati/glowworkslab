import { createFileRoute } from '@tanstack/react-router'
import { CarFront, Sparkles } from 'lucide-react'
import { PortalShell } from '../../components/portal/PortalShell'
import { portalVehicles } from '../../lib/portal-data'

export const Route = createFileRoute('/portal/vehicles')({
  component: VehiclesPage,
})

function VehiclesPage() {
  return (
    <PortalShell active="vehicles" title="Οχήματα" subtitle="Το συνδεδεμένο όχημά σου και τα assets των υπηρεσιών.">
      <div className="portal-grid portal-grid-two">
        {portalVehicles.map((vehicle) => (
          <div className="portal-card" key={vehicle.id}>
            <div className="portal-card-title-row">
              <h3>{vehicle.make} {vehicle.model}</h3>
              <div className="portal-chip"><CarFront size={15} /> {vehicle.plate}</div>
            </div>
            <div className="portal-list">
              <div className="portal-row">
                <div>
                  <strong>Έτος</strong>
                  <p>{vehicle.year}</p>
                </div>
                <div className="portal-row-meta">
                  <strong>VIN</strong>
                  <p>{vehicle.vin}</p>
                </div>
              </div>
              <div className="portal-row">
                <div>
                  <strong>Ημερομηνία αγοράς</strong>
                  <p>{vehicle.purchaseDate}</p>
                </div>
                <div className="portal-row-meta">
                  <strong>Ετικέτα NFC</strong>
                  <p>{vehicle.nfcTagId ?? 'Δεν έχει ανατεθεί'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Σημειώσεις φροντίδας οχήματος</h3>
          <div className="portal-chip"><Sparkles size={15} /> Concierge φροντίδα</div>
        </div>
        <p className="portal-muted">Κάθε αρχείο οχήματος μπορεί να συνδεθεί με μελλοντικά γεγονότα συντήρησης, ενημερώσεις εγκατάστασης και follow-up εκτεταμένων εγγυήσεων.</p>
      </div>
    </PortalShell>
  )
}
