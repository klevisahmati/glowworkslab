import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Camera, CarFront, Clock3, Download, FileText, Instagram, MapPinned, MessageCircle, Phone, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useState } from 'react'
import { PortalActionButton } from '../../components/portal/PortalActionButton'
import { PortalEmptyState, PortalSectionCard } from '../../components/portal/PortalSectionCard'
import { buildCustomerPortalUrl } from '../../lib/customer-links'
import { portalClaims, portalDiscounts, portalGallery, portalVehicles, portalWarranties, portalCustomers } from '../../lib/portal-data'
import { getPortalState } from '../../lib/portal-session'
import { calculateWarrantyMeta, DEFAULT_WARRANTY_YEARS } from '../../lib/warranty'

export const Route = createFileRoute('/customer/$customerCode')({
  component: CustomerPortalPage,
})

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getGeneration(model: string) {
  const match = model.match(/\b(W\d{3}|G\d{2}|F\d{2}|X\d{3})\b/i)
  return match?.[1] ?? 'Signature generation'
}

function CustomerPortalPage() {
  const { customerCode } = Route.useParams()
  const customer = portalCustomers.find((profile) => profile.customerCode === customerCode) ?? portalCustomers[0]
  const customerVehicles = portalVehicles.filter((vehicle) => vehicle.customerId === customer.id)
  const customerWarranties = portalWarranties.filter((warranty) => warranty.customerId === customer.id)
  const customerClaims = portalClaims.filter((claim) => claim.customerId === customer.id)
  const serviceHistory = useMemo(() => {
    const state = getPortalState()
    return [...state.serviceHistory.filter((entry) => entry.customerId === customer.id)].sort((left, right) => right.completedOn.localeCompare(left.completedOn))
  }, [customer.id])
  const primaryVehicle = customerVehicles[0] ?? {
    id: 'pending',
    customerId: customer.id,
    make: 'Vehicle',
    model: 'Ready for your next installation',
    year: new Date().getFullYear(),
    vin: 'Pending',
    plate: 'Pending',
    purchaseDate: new Date().toISOString().slice(0, 10),
    nfcTagId: 'Pending',
  }
  const primaryWarranty = customerWarranties[0] ?? null
  const [now, setNow] = useState(new Date())
  const warrantyMeta = useMemo(() => primaryWarranty ? calculateWarrantyMeta(primaryWarranty, now) : null, [primaryWarranty, now])
  const activeDiscount = portalDiscounts.find((discount) => discount.active && discount.validTo >= new Date().toISOString().slice(0, 10)) ?? portalDiscounts[0]
  const loyaltyBanner = warrantyMeta?.isActive
    ? {
        title: 'Congratulations!',
        copy: `You currently receive a ${activeDiscount?.percentage ?? 10}% discount on every new service.`,
        tone: 'active' as const,
      }
    : {
        title: 'Warranty expired.',
        copy: 'Contact Glowworks Lab for exclusive loyalty offers.',
        tone: 'expired' as const,
      }
  const publicPortalUrl = useMemo(() => buildCustomerPortalUrl(customerCode, { kind: 'nfc' }), [customerCode])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const downloadWarrantyPdf = () => {
    if (!primaryWarranty) {
      return
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.setFillColor(9, 9, 13)
    doc.rect(0, 0, 595, 842, 'F')
    doc.setTextColor(248, 247, 243)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Glowworks Lab', 40, 70)
    doc.setFontSize(12)
    doc.setTextColor(76, 211, 209)
    doc.text('Digital Warranty Card', 40, 95)
    doc.setTextColor(248, 247, 243)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(`Warranty Number: ${primaryWarranty.warrantyNumber ?? 'W-0001'}`, 40, 140)
    doc.text(`Customer: ${customer.name}`, 40, 170)
    doc.text(`Vehicle: ${primaryVehicle.make} ${primaryVehicle.model}`, 40, 200)
    doc.text(`Installation: ${primaryWarranty.product}`, 40, 230)
    doc.text(`Installed On: ${formatDate(primaryWarranty.startsOn)}`, 40, 260)
    doc.text(`Expires On: ${formatDate(primaryWarranty.endsOn)}`, 40, 290)
    doc.text(`Warranty Terms: ${primaryWarranty.terms ?? 'Coverage applies under normal use.'}`, 40, 330)
    doc.setFontSize(12)
    doc.setTextColor(76, 211, 209)
    doc.text(`Status: ${warrantyMeta?.statusLabel ?? 'WARRANTY ACTIVE'}`, 40, 380)
    doc.save(`${primaryWarranty.warrantyNumber ?? 'warranty'}.pdf`)
  }

  return (
    <div className="customer-portal-page">
      <div className="customer-shell">
        <header className="customer-hero-card">
          <img src="/images/glowworks-logo.webp" alt="Glowworks Lab logo" />
          <div className="customer-hero-copy">
            <p className="customer-eyebrow">Premium ownership portal</p>
            <h1>{customer.name}</h1>
            <p className="customer-hero-meta">{customer.customerCode} • {primaryVehicle.make} {primaryVehicle.model}</p>
          </div>
        </header>

        <PortalSectionCard eyebrow="Stable public link" title="Tap-ready access for NFC and future QR codes" icon={<ShieldCheck size={16} />} tone="accent">
          <div className="customer-link-banner">
            <a className="customer-link-anchor" href={publicPortalUrl}>{publicPortalUrl}</a>
            <p className="customer-muted">This is the URL to store on the NFC keychain or a future QR code. It stays tied to the customer code, so it never needs to change when profile details change.</p>
          </div>
        </PortalSectionCard>

        <section className="customer-grid">
          <PortalSectionCard eyebrow="Vehicle profile" title="Tailored ownership details" icon={<CarFront size={16} />}>
            <div className="customer-list">
              <div className="customer-detail"><span>Brand</span><strong>{primaryVehicle.make}</strong></div>
              <div className="customer-detail"><span>Model</span><strong>{primaryVehicle.model}</strong></div>
              <div className="customer-detail"><span>Generation</span><strong>{getGeneration(primaryVehicle.model)}</strong></div>
              <div className="customer-detail"><span>Year</span><strong>{primaryVehicle.year}</strong></div>
              <div className="customer-detail"><span>License plate</span><strong>{primaryVehicle.plate}</strong></div>
            </div>
          </PortalSectionCard>

          <PortalSectionCard eyebrow="Warranty protection" title="Coverage at a glance" icon={<ShieldCheck size={16} />}>
            {primaryWarranty ? (
              <div className="customer-warranty-stack">
                <div className={`customer-status-pill ${warrantyMeta?.statusTone ?? 'active'}`}>
                  <Sparkles size={14} /> {warrantyMeta?.statusLabel ?? 'WARRANTY ACTIVE'}
                </div>
                <div className="customer-stat-grid">
                  <div className="customer-stat">
                    <strong>{formatDate(primaryWarranty.endsOn)}</strong>
                    <span>Warranty expiration</span>
                  </div>
                  <div className="customer-stat">
                    <strong>{warrantyMeta?.daysRemaining ?? 0} days</strong>
                    <span>Live countdown</span>
                  </div>
                </div>
                <p className="customer-muted">{primaryWarranty.coverage}</p>
                <div className="customer-card-actions">
                  <PortalActionButton primary onClick={downloadWarrantyPdf}><Download size={16} /> Download PDF</PortalActionButton>
                  <span className="customer-muted">Default warranty duration: {primaryWarranty.durationYears ?? DEFAULT_WARRANTY_YEARS} years</span>
                </div>
              </div>
            ) : (
              <PortalEmptyState title="Warranty details pending" description="Your warranty details will populate here once your installation is recorded." />
            )}
          </PortalSectionCard>
        </section>

        <section className="customer-grid">
          <PortalSectionCard eyebrow="Installed services" title="Everything curated in-house" icon={<CalendarDays size={16} />} className="large-card">
            <div className="customer-list">
              {serviceHistory.length > 0 ? serviceHistory.map((entry) => (
                <div className="customer-detail customer-detail-stack" key={entry.id}>
                  <div>
                    <strong>{entry.title}</strong>
                    <p>{entry.vehicle}</p>
                  </div>
                  <div className="customer-detail-right">
                    <span>{formatDate(entry.completedOn)}</span>
                    <small>{entry.notes}</small>
                  </div>
                </div>
              )) : (
                <PortalEmptyState title="Service history is loading" description="Your service history will appear here after each installation is completed." />
              )}
            </div>
          </PortalSectionCard>

          <PortalSectionCard eyebrow="Service history" title="Each visit documented" icon={<Clock3 size={16} />}>
            <div className="customer-list">
              {customerClaims.length > 0 ? customerClaims.map((claim) => (
                <div className="customer-detail customer-detail-stack" key={claim.id}>
                  <div>
                    <strong>{claim.title}</strong>
                    <p>{claim.description}</p>
                  </div>
                  <div className="customer-detail-right">
                    <span>{claim.status}</span>
                    <small>{formatDate(claim.submittedAt)}</small>
                  </div>
                </div>
              )) : (
                <PortalEmptyState title="No service requests yet" description="Your next appointment will appear here." />
              )}
            </div>
          </PortalSectionCard>
        </section>

        <PortalSectionCard eyebrow="Installation gallery" title="Signature transformations" icon={<Camera size={16} />}>
          <div className="customer-gallery">
            {portalGallery.slice(0, 3).map((item) => (
              <figure key={item.id}>
                <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" />
                <figcaption>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </PortalSectionCard>

        <PortalSectionCard eyebrow="Member benefits" title="Current loyalty discount" icon={<Star size={16} />}>
          <div className={`customer-loyalty-banner ${loyaltyBanner.tone}`}>
            <div>
              <p className="customer-section-label">{customer.loyaltyTier} member</p>
              <h3>{loyaltyBanner.title}</h3>
              <p>{loyaltyBanner.copy}</p>
              <p className="customer-muted">Current loyalty code: {activeDiscount?.code ?? 'GLOW10'} • {activeDiscount?.percentage ?? 10}% off</p>
            </div>
            <div className={`customer-status-pill ${loyaltyBanner.tone}`}><Sparkles size={14} /> {warrantyMeta?.isActive ? 'Valid now' : 'Contact us'}</div>
          </div>
        </PortalSectionCard>

        <PortalSectionCard eyebrow="Direct concierge" title="Contact or manage your next visit">
          <div className="customer-actions">
            <PortalActionButton primary href="/">Book Appointment</PortalActionButton>
            <PortalActionButton href={`tel:${customer.phone}`}><Phone size={16} /> Call</PortalActionButton>
            <PortalActionButton href="https://wa.me/306937153914" target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</PortalActionButton>
            <PortalActionButton href="https://www.instagram.com/" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</PortalActionButton>
            <PortalActionButton href="https://maps.google.com/?q=Glowworks+Lab+Rhodes+Greece" target="_blank" rel="noreferrer"><MapPinned size={16} /> Google Maps</PortalActionButton>
            <PortalActionButton href="https://search.google.com/local/writereview?placeid=ChIJ0wQ3Xj..." target="_blank" rel="noreferrer"><Star size={16} /> Leave a Google Review</PortalActionButton>
            <PortalActionButton onClick={downloadWarrantyPdf}><Download size={16} /> Download Warranty PDF</PortalActionButton>
            <PortalActionButton href="/invoice.pdf" download><FileText size={16} /> Download Invoice</PortalActionButton>
          </div>
        </PortalSectionCard>
      </div>
    </div>
  )
}
