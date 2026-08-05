import { createFileRoute } from '@tanstack/react-router'
import { Tag } from 'lucide-react'
import { PortalShell } from '../../components/portal/PortalShell'
import { portalNfcTags } from '../../lib/portal-data'

export const Route = createFileRoute('/portal/nfc')({
  component: NfcPage,
})

function NfcPage() {
  return (
    <PortalShell active="nfc" title="NFC Tags" subtitle="Scan and verify your installed upgrade references.">
      <div className="portal-card">
        <div className="portal-card-title-row">
          <h3>Tag registry</h3>
          <div className="portal-chip"><Tag size={15} /> Connected</div>
        </div>
        <div className="portal-list">
          {portalNfcTags.map((tag) => (
            <div className="portal-row" key={tag.id}>
              <div>
                <strong>{tag.tagId}</strong>
                <p>{tag.assignedTo}</p>
              </div>
              <div className="portal-row-meta">
                <div className="portal-chip">{tag.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  )
}
