import type { ReactNode } from 'react'

type PortalSectionCardProps = {
  eyebrow?: string
  title: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'default' | 'accent' | 'muted'
}

export function PortalSectionCard({ eyebrow, title, icon, actions, children, className = '', tone = 'default' }: PortalSectionCardProps) {
  return (
    <article className={`customer-card customer-card-${tone} ${className}`.trim()}>
      <div className="customer-card-header">
        <div>
          {eyebrow ? <p className="customer-section-label">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {icon ? <div className="customer-icon-pill">{icon}</div> : null}
      </div>
      {actions ? <div className="customer-card-actions-inline">{actions}</div> : null}
      {children}
    </article>
  )
}

export function PortalEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="customer-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}
