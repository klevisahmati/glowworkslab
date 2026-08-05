import { createFileRoute } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PortalShell } from '../../components/portal/PortalShell'
import { createPortalClaim, getPortalState } from '../../lib/portal-session'
import type { WarrantyClaim } from '../../types/portal'

export const Route = createFileRoute('/portal/claims')({
  component: ClaimsPage,
})

const blankClaimForm = {
  title: '',
  description: '',
  warrantyId: '',
  type: 'Service' as WarrantyClaim['type'],
  priority: 'Medium' as WarrantyClaim['priority'],
}

function ClaimsPage() {
  const [portalState, setPortalState] = useState(() => getPortalState())
  const [form, setForm] = useState(blankClaimForm)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim() || !form.description.trim() || !form.warrantyId) {
      setFeedback('Συμπλήρωσε τον τίτλο, την εγγύηση και την περιγραφή πριν την υποβολή.')
      return
    }

    const nextState = createPortalClaim({
      warrantyId: form.warrantyId,
      customerId: portalState.customer.id,
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      priority: form.priority,
      status: 'Pending',
    })

    setPortalState(nextState)
    setForm({ ...blankClaimForm })
    setFeedback('Η αίτησή σου αποθηκεύτηκε και περιμένει έλεγχο.')
  }

  return (
    <PortalShell active="claims" title="Αιτήσεις" subtitle="Ανοιχτές αιτήσεις υπηρεσιών και παρακολούθηση προόδου.">
      <div className="portal-grid portal-grid-two">
        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Ανοιχτές αιτήσεις</h3>
            <div className="portal-chip"><PlusCircle size={15} /> {portalState.claims.length}</div>
          </div>
          <div className="portal-list">
            {portalState.claims.map((claim) => {
              const warranty = portalState.warranties.find((item) => item.id === claim.warrantyId)
              return (
                <div className="portal-row" key={claim.id}>
                  <div>
                    <strong>{claim.title}</strong>
                    <p>{claim.description}</p>
                  </div>
                  <div className="portal-row-meta">
                    <div className="portal-chip">{claim.status}</div>
                    <p>{warranty?.product ?? 'Unknown warranty'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="portal-card">
          <div className="portal-card-title-row">
            <h3>Υποβολή αίτησης</h3>
            <div className="portal-chip"><PlusCircle size={15} /> Νέα αίτηση</div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="full">
              <span>Τίτλος θέματος</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Πρόβλημα φωτισμού μετά την εγκατάσταση" />
            </label>

            <label>
                <span>Εγγύηση</span>
                <select value={form.warrantyId} onChange={(event) => setForm((current) => ({ ...current, warrantyId: event.target.value }))}>
                <option value="">Επίλεξε εγγύηση</option>
                {portalState.warranties.map((warranty) => (
                  <option key={warranty.id} value={warranty.id}>{warranty.product}</option>
                ))}
              </select>
            </label>

            <label>
                <span>Τύπος</span>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as WarrantyClaim['type'] }))}>
                <option value="Service">Υπηρεσία</option>
                <option value="Inspection">Έλεγχος</option>
                <option value="Replacement">Αντικατάσταση</option>
                <option value="Other">Άλλο</option>
              </select>
            </label>

            <label>
                <span>Προτεραιότητα</span>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as WarrantyClaim['priority'] }))}>
                <option value="Low">Χαμηλή</option>
                <option value="Medium">Μεσαία</option>
                <option value="High">Υψηλή</option>
              </select>
            </label>

            <label className="full">
              <span>Περιγραφή</span>
              <textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Περιέγραψε το θέμα, το όχημα και τυχόν συμπτώματα που παρατήρησες." />
            </label>

            <button className="button button-primary" type="submit">Υποβολή αίτησης</button>
          </form>

          {feedback ? <p className="portal-muted" style={{ marginTop: '12px' }}>{feedback}</p> : null}
        </div>
      </div>
    </PortalShell>
  )
}
