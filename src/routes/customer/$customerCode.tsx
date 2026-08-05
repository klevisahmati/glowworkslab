import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CarFront, Download, FileText, ShieldCheck, Sparkles } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useState } from 'react'
import { PortalActionButton } from '../../components/portal/PortalActionButton'
import { PortalEmptyState, PortalSectionCard } from '../../components/portal/PortalSectionCard'
import { hasValidAdminSession } from '../../lib/portal-auth'
import { getPortalState } from '../../lib/portal-session'
import { calculateWarrantyMeta } from '../../lib/warranty'
import type { CustomerProfile, PortalState, ServiceHistoryEntry, VehicleRecord, WarrantyRecord } from '../../types/portal'

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

function makeCustomerDraft(customer?: Partial<CustomerProfile>): CustomerProfile {
  return {
    id: customer?.id ?? `cust-${Math.random().toString(36).slice(2, 8)}`,
    customerCode: customer?.customerCode ?? '',
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
    loyaltyTier: customer?.loyaltyTier ?? 'Standard',
    createdAt: customer?.createdAt ?? new Date().toISOString().slice(0, 10),
    discountEnabled: customer?.discountEnabled ?? false,
    discountCode: customer?.discountCode ?? '',
  }
}

function makeVehicleDraft(vehicle?: Partial<VehicleRecord>, customerId = ''): VehicleRecord {
  return {
    id: vehicle?.id ?? `veh-${Math.random().toString(36).slice(2, 8)}`,
    customerId: vehicle?.customerId ?? customerId,
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? new Date().getFullYear(),
    vin: vehicle?.vin ?? '',
    plate: vehicle?.plate ?? '',
    purchaseDate: vehicle?.purchaseDate ?? new Date().toISOString().slice(0, 10),
    nfcTagId: vehicle?.nfcTagId ?? '',
  }
}

function makeWarrantyDraft(warranty?: Partial<WarrantyRecord>, customerId = '', vehicleId = ''): WarrantyRecord {
  return {
    id: warranty?.id ?? `w-${Math.random().toString(36).slice(2, 8)}`,
    customerId: warranty?.customerId ?? customerId,
    vehicleId: warranty?.vehicleId ?? vehicleId,
    product: warranty?.product ?? '',
    status: warranty?.status ?? 'Active',
    installedAt: warranty?.installedAt ?? 'Glowworks Rhodes Studio',
    startsOn: warranty?.startsOn ?? new Date().toISOString().slice(0, 10),
    endsOn: warranty?.endsOn ?? new Date().toISOString().slice(0, 10),
    coverage: warranty?.coverage ?? '',
    notes: warranty?.notes ?? '',
    warrantyNumber: warranty?.warrantyNumber ?? '',
    durationYears: warranty?.durationYears ?? 2,
    installationDate: warranty?.installationDate ?? new Date().toISOString().slice(0, 10),
    terms: warranty?.terms ?? '',
  }
}

function CustomerPortalPage() {
  const { customerCode } = Route.useParams()
  const navigate = useNavigate()
  const initialPortalState = useMemo(() => getPortalState(), [])
  const initialCustomer = initialPortalState.customers.find((profile) => profile.customerCode === customerCode)
    ?? initialPortalState.customer
    ?? initialPortalState.customers[0]
    ?? null
  const [portalState, setPortalState] = useState<PortalState>(initialPortalState)
  const customer = portalState.customers.find((profile) => profile.customerCode === customerCode) ?? portalState.customer ?? portalState.customers[0] ?? makeCustomerDraft()
  const customerVehicles = portalState.vehicles.filter((vehicle) => vehicle.customerId === customer.id)
  const customerWarranties = portalState.warranties.filter((warranty) => warranty.customerId === customer.id)
  const customerHistory = portalState.serviceHistory.filter((entry) => entry.customerId === customer.id)
  const customerGallery = portalState.gallery.filter((item) => item.customerId === customer.id)
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
  const [now, setNow] = useState(new Date())
  const isAdminViewingCustomer = hasValidAdminSession()
  const serviceEntriesWithWarranties = useMemo(() => {
    return customerHistory.slice().sort((a, b) => b.completedOn.localeCompare(a.completedOn)).map((entry) => ({
      entry,
      warranty: portalState.warranties.find((warranty) => warranty.id === entry.warrantyId) ?? null,
      warrantyMeta: portalState.warranties.find((warranty) => warranty.id === entry.warrantyId)
        ? calculateWarrantyMeta(portalState.warranties.find((warranty) => warranty.id === entry.warrantyId) as WarrantyRecord, now)
        : null,
    }))
  }, [customerHistory, now, portalState.warranties])
  const activeDiscount = customer.discountEnabled
    ? (portalState.discounts.find((discount) => discount.active && discount.validTo >= new Date().toISOString().slice(0, 10)) ?? portalState.discounts[0])
    : null

  useEffect(() => {
    const nextState = getPortalState()
    const selectedCustomer = nextState.customers.find((profile) => profile.customerCode === customerCode)
      ?? nextState.customer
      ?? nextState.customers[0]
      ?? null

    if (!selectedCustomer) {
      navigate({ to: '/portal' })
      return
    }

    setPortalState(nextState)
  }, [customerCode, navigate])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  const loadImageToDataUrl = async (src: string) => {
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Unable to load image: ${src}`)
    }

    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Unable to read image data'))
      reader.readAsDataURL(blob)
    })
  }

  const downloadWarrantyPdf = async (entry: ServiceHistoryEntry, warranty: WarrantyRecord | null) => {
    if (!warranty) {
      return
    }

    const warrantyMeta = calculateWarrantyMeta(warranty, now)
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = 595
    const pageHeight = 842
    const cyan = '#4CD3D1'
    const magenta = '#F23AA3'
    const background = '#070B12'
    const panel = '#121826'
    const text = '#F8F7F3'
    const muted = '#AAB3C5'

    doc.setFillColor(7, 11, 18)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setFillColor(242, 58, 163)
    doc.rect(40, 40, pageWidth - 80, 120, 'F')
    doc.setFillColor(18, 24, 38)
    doc.roundedRect(40, 190, pageWidth - 80, 520, 18, 18, 'F')
    doc.setDrawColor(76, 211, 209)
    doc.setLineWidth(1.2)
    doc.roundedRect(40, 190, pageWidth - 80, 520, 18, 18, 'S')

    doc.setTextColor(text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.text('Glowworks Lab', 56, 78)
    doc.setFontSize(12)
    doc.setTextColor(cyan)
    doc.text('Digital warranty card', 56, 102)

    try {
      const logoDataUrl = await loadImageToDataUrl('/images/glowworks-logo.webp')
      doc.addImage(logoDataUrl, 'WEBP', 430, 58, 86, 60)
    } catch {
      doc.setTextColor(text)
      doc.setFont('helvetica', 'bold')
      doc.text('Glowworks', 454, 83)
    }

    doc.setFillColor(cyan)
    doc.roundedRect(56, 228, 140, 56, 12, 12, 'F')
    doc.setTextColor(background)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Warranty', 84, 252)

    doc.setTextColor(text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(`${warranty.warrantyNumber ?? 'W-0001'}`, 56, 330)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(muted)
    doc.text('Service details', 56, 352)

    doc.setTextColor(text)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.text(`Customer: ${customer.name}`, 56, 392)
    doc.text(`Vehicle: ${entry.vehicle || `${primaryVehicle.make} ${primaryVehicle.model}`}`, 56, 420)
    doc.text(`Installation: ${entry.title}`, 56, 448)
    doc.text(`Completed on: ${formatDate(entry.completedOn)}`, 56, 476)
    doc.text(`Expires on: ${formatDate(warranty.endsOn)}`, 56, 504)

    doc.setTextColor(cyan)
    doc.setFont('helvetica', 'bold')
    doc.text('Warranty terms', 56, 548)
    doc.setTextColor(text)
    doc.setFont('helvetica', 'normal')
    const terms = doc.splitTextToSize(warranty.terms ?? 'Coverage applies under normal use.', 470)
    doc.text(terms, 56, 570)

    doc.setFillColor(18, 24, 38)
    doc.roundedRect(56, 690, 482, 84, 14, 14, 'F')
    doc.setDrawColor(magenta)
    doc.setLineWidth(1)
    doc.roundedRect(56, 690, 482, 84, 14, 14, 'S')
    doc.setTextColor(cyan)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Status', 80, 724)
    doc.setTextColor(text)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(warrantyMeta?.statusLabel ?? 'WARRANTY ACTIVE', 80, 748)

    doc.save(`${warranty.warrantyNumber ?? entry.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  const downloadInvoicePdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    doc.setFillColor(9, 9, 13)
    doc.rect(0, 0, 595, 842, 'F')
    doc.setTextColor(248, 247, 243)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Glowworks Lab', 40, 70)
    doc.setFontSize(12)
    doc.setTextColor(76, 211, 209)
    doc.text('Invoice', 40, 95)
    doc.setTextColor(248, 247, 243)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.text(`Invoice Number: INV-${customer.customerCode}`, 40, 140)
    doc.text(`Customer: ${customer.name}`, 40, 170)
    doc.text(`Vehicle: ${primaryVehicle.make} ${primaryVehicle.model}`, 40, 200)
    doc.text(`Service Package: ${customerHistory[0]?.title ?? 'Awaiting installation'}`, 40, 230)
    doc.text(`Issued: ${formatDate(new Date().toISOString().slice(0, 10))}`, 40, 260)
    doc.text('Status: Paid / Prepared for delivery', 40, 290)
    doc.text('Thank you for choosing Glowworks Lab.', 40, 340)
    doc.save(`${customer.customerCode}-invoice.pdf`)
  }

  return (
    <div className="customer-portal-page">
      <div className="customer-shell">
        {isAdminViewingCustomer ? (
          <div className="customer-card-actions" style={{ justifyContent: 'flex-start' }}>
            <PortalActionButton onClick={() => navigate({ to: '/portal/admin' })}>Back to admin portal</PortalActionButton>
          </div>
        ) : null}
        <header className="customer-hero-card">
          <img src="/images/glowworks-logo.webp" alt="Glowworks Lab logo" />
          <div className="customer-hero-copy">
            <p className="customer-eyebrow">Customer profile</p>
            <h1>{customer.name}</h1>
            <p className="customer-hero-meta">{customer.customerCode}</p>
          </div>
          <div className="customer-hero-side">
            <div className="customer-hero-summary">
              <span>Completed jobs</span>
              <strong>{customerHistory.length}</strong>
            </div>
          </div>
        </header>

        <section className="customer-grid">
          <PortalSectionCard eyebrow="Basic details" title="Contact information" icon={<ShieldCheck size={16} />}>
            <div className="customer-list">
              <div className="customer-detail"><span>Email</span><strong>{customer.email}</strong></div>
              <div className="customer-detail"><span>Phone</span><strong>{customer.phone}</strong></div>
              <div className="customer-detail"><span>Address</span><strong>{customer.address}</strong></div>
              <div className="customer-detail"><span>Loyalty tier</span><strong>{customer.loyaltyTier}</strong></div>
            </div>
          </PortalSectionCard>

          <PortalSectionCard eyebrow="Vehicle" title="Current vehicle" icon={<CarFront size={16} />}>
            <div className="customer-list">
              <div className="customer-detail"><span>Brand</span><strong>{primaryVehicle.make}</strong></div>
              <div className="customer-detail"><span>Model</span><strong>{primaryVehicle.model}</strong></div>
              <div className="customer-detail"><span>Year</span><strong>{primaryVehicle.year}</strong></div>
              <div className="customer-detail"><span>Plate</span><strong>{primaryVehicle.plate}</strong></div>
            </div>
          </PortalSectionCard>
        </section>

        <PortalSectionCard eyebrow="Gallery" title="Customer photos" icon={<Sparkles size={16} />}>
          {customerGallery.length ? (
            <div className="customer-gallery">
              {customerGallery.map((item) => (
                <figure key={item.id}>
                  <img src={item.imageUrl} alt={item.title || 'Glowworks project photo'} />
                  <figcaption>
                    <strong>{item.title}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="portal-muted">No photos uploaded for this customer yet.</p>
          )}
        </PortalSectionCard>

        <PortalSectionCard eyebrow="Warranty" title="Job warranties" icon={<ShieldCheck size={16} />}>
          {serviceEntriesWithWarranties.length ? (
            <div className="customer-list">
              {serviceEntriesWithWarranties.map(({ entry, warranty, warrantyMeta }) => (
                <div className="customer-detail" key={entry.id} style={{ alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span>{entry.completedOn}</span>
                    <strong>{entry.title}</strong>
                    {warranty ? (
                      <>
                        <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                          Warranty: {warranty.warrantyNumber ?? 'Service warranty'} • {warrantyMeta?.statusLabel ?? warranty.status} • Expires {warranty.endsOn}
                        </p>
                        <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                          {warranty.coverage}
                        </p>
                        <div className="customer-card-actions" style={{ justifyContent: 'flex-start', marginTop: '10px' }}>
                          <PortalActionButton primary onClick={() => { void downloadWarrantyPdf(entry, warranty) }}><Download size={16} /> Download warranty PDF</PortalActionButton>
                        </div>
                      </>
                    ) : (
                      <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        No warranty linked to this job yet.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState title="Warranty details pending" description="Your warranty details will appear here once the installation is recorded." />
          )}
        </PortalSectionCard>

        <PortalSectionCard eyebrow="Services" title="Installed services" icon={<ShieldCheck size={16} />}>
          {customerHistory.length ? (
            <div className="customer-list">
              {customerHistory.slice().sort((a, b) => b.completedOn.localeCompare(a.completedOn)).map((entry) => (
                <div className="customer-detail" key={entry.id} style={{ alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <span>{entry.completedOn}</span>
                    <strong>{entry.title}</strong>
                    <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      Vehicle: {entry.vehicle || `${primaryVehicle.make} ${primaryVehicle.model}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState title="Service history pending" description="Your installation history will appear here once service records are linked to this profile." />
          )}
        </PortalSectionCard>
      </div>
    </div>
  )
}
