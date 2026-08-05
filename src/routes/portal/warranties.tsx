import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { PortalShell } from '../../components/portal/PortalShell'
import { portalWarranties } from '../../lib/portal-data'

export const Route = createFileRoute('/portal/warranties')({
  component: WarrantiesPage,
})

function WarrantiesPage() {
  return (
    <PortalShell active="warranties" title="Εγγυήσεις" subtitle="Παρακολούθηση κάθε εγκατάστασης και πακέτου υπηρεσίας.">
      <div className="portal-card">
        <div className="portal-card-title-row">
            <h3>Αρχεία κάλυψης</h3>
            <Link className="portal-nav-link" to="/portal/claims">Υποβολή αίτησης</Link>
        </div>
        <div className="portal-list">
          {portalWarranties.map((warranty) => (
            <div className="portal-row" key={warranty.id}>
              <div>
                <strong>{warranty.product}</strong>
                <p>{warranty.coverage}</p>
              </div>
              <div className="portal-row-meta">
                <div className="portal-chip"><ShieldCheck size={15} />{warranty.status}</div>
                <p>{warranty.startsOn} → {warranty.endsOn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-title-row">
            <h3>Πώς λειτουργεί η υποστήριξη εγγύησης</h3>
        </div>
        <p className="portal-muted">Κάθε αρχείο εγγύησης ελέγχεται από την ομάδα μας και μπορεί να επεκταθεί ή να ενημερωθεί μετά από ένα γεγονός υπηρεσίας. Για επείγοντα θέματα, χρησιμοποίησε την ενότητα αιτήσεων για να ανοίξεις ένα ticket υποστήριξης.</p>
        <Link className="button button-secondary" to="/portal/claims">
          Άνοιγμα κέντρου αιτήσεων <ArrowRight size={18} />
        </Link>
      </div>
    </PortalShell>
  )
}
