import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BadgePercent,
  CarFront,
  Download,
  FileText,
  Home,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useState } from 'react'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { useLanguage } from '../../lib/language'
import { PortalActionButton } from '../../components/portal/PortalActionButton'
import { PortalEmptyState, PortalSectionCard } from '../../components/portal/PortalSectionCard'
import { hasValidAdminSession } from '../../lib/portal-auth'
import { fetchCustomerPortalStateByCode, getPortalState } from '../../lib/portal-session'
import { calculateWarrantyMeta } from '../../lib/warranty'
import type { CustomerProfile, PortalState, ServiceHistoryEntry, VehicleRecord, WarrantyRecord } from '../../types/portal'

export const Route = createFileRoute('/customer/$customerCode')({
  component: CustomerPortalPage,
})

function formatLocalizedDate(value: string, language: 'el' | 'en') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(language === 'el' ? 'el-GR' : 'en-GB', {
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
    discountExpiresAt: customer?.discountExpiresAt,
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

async function addGreekPdfFont(doc: jsPDF) {
  const response = await fetch('/fonts/NotoSans-Regular.ttf')
  if (!response.ok) {
    throw new Error('Unable to load the warranty PDF font')
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  const fontBase64 = window.btoa(binary)
  doc.addFileToVFS('NotoSans-Regular.ttf', fontBase64)
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'bold')
  doc.setFont('NotoSans', 'normal')
}
function CustomerPortalPage() {
  const { language } = useLanguage()
  const tr = (el: string, en: string) => language === 'el' ? el : en
  const formatDate = (value: string) => formatLocalizedDate(value, language)
  const { customerCode } = Route.useParams()
  const navigate = useNavigate()
  const initialPortalState = useMemo(() => getPortalState(), [])
  const [portalState, setPortalState] =
    useState<PortalState>(initialPortalState)
  const [customerProfileLoading, setCustomerProfileLoading] =
    useState(true)
  const matchedCustomer = portalState.customers.find(
    (profile) => profile.customerCode === customerCode,
  ) ?? null
  const customer =
    matchedCustomer ?? makeCustomerDraft({ customerCode })
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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

const [isAdminViewingCustomer, setIsAdminViewingCustomer] = useState(false)

useEffect(() => {
  setIsAdminViewingCustomer(hasValidAdminSession())
}, [])

const warrantyHistory = useMemo(() => {
  return customerHistory
    .slice()
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn))
    .map((entry) => ({
      entry,
      warranty: portalState.warranties.find(
        (warranty) => warranty.id === entry.warrantyId,
      ) ?? null,
      warrantyMeta: portalState.warranties.find(
        (warranty) => warranty.id === entry.warrantyId,
      )
        ? calculateWarrantyMeta(
            portalState.warranties.find(
              (warranty) => warranty.id === entry.warrantyId,
            ) as WarrantyRecord,
            now,
          )
        : null,
    }))
}, [customerHistory, now, portalState.warranties])

const memberDiscountCode = (customer.discountCode?.trim() || 'GLOW10').toUpperCase()

const percentageFromCode = Number(
  memberDiscountCode.match(/\d+(?:\.\d+)?/)?.[0],
)

const memberDiscountPercentage =
  Number.isFinite(percentageFromCode) && percentageFromCode > 0
    ? Math.min(percentageFromCode, 100)
    : 10

const discountExpiryTime = customer.discountExpiresAt
  ? new Date(customer.discountExpiresAt).getTime()
  : Number.NaN
const discountRemainingMs = Number.isFinite(discountExpiryTime)
  ? Math.max(0, discountExpiryTime - now.getTime())
  : 0
const discountIsActive = Boolean(
  customer.discountEnabled &&
  customer.discountExpiresAt &&
  discountRemainingMs > 0,
)
const discountIsExpired = Boolean(
  customer.discountExpiresAt && discountRemainingMs <= 0,
)
const countdownDays = Math.floor(discountRemainingMs / 86_400_000)
const countdownHours = Math.floor((discountRemainingMs / 3_600_000) % 24)
const countdownMinutes = Math.floor((discountRemainingMs / 60_000) % 60)
const countdownSeconds = Math.floor((discountRemainingMs / 1000) % 60)

  useEffect(() => {
    let isActive = true

    setCustomerProfileLoading(true)

    void fetchCustomerPortalStateByCode(customerCode, getPortalState())
      .then((hydratedState) => {
        if (isActive) {
          setPortalState(hydratedState)
        }
      })
      .catch((error) => {
        console.error('Failed to load customer profile', error)
      })
      .finally(() => {
        if (isActive) {
          setCustomerProfileLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [customerCode])

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
    await addGreekPdfFont(doc)
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

    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(23)
    doc.setTextColor(text)
    doc.text('GLOWWORKS', 56, 80)

    const glowworksWidth = doc.getTextWidth('GLOWWORKS')
    doc.setTextColor(cyan)
    doc.text('.LAB', 56 + glowworksWidth, 80)

    doc.setFontSize(10)
    doc.setTextColor(text)
    doc.text(tr("PREMIUM ΑΝΑΒΑΘΜΙΣΕΙΣ ΑΥΤΟΚΙΝΗΤΩΝ", "PREMIUM AUTOMOTIVE UPGRADES"), 515, 75, { align: 'right' })

    doc.setFontSize(11)
    doc.setTextColor(cyan)
    doc.text(tr("ΨΗΦΙΑΚΗ ΚΑΡΤΑ ΕΓΓΥΗΣΗΣ", "DIGITAL WARRANTY CARD"), 56, 105)

    doc.setFillColor(cyan)
    doc.roundedRect(56, 228, 140, 56, 12, 12, 'F')
    doc.setTextColor(background)
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(13)
    doc.text(tr("Εγγύηση", "Warranty"), 84, 252)

    doc.setTextColor(text)
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(16)
    doc.text(`${warranty.warrantyNumber ?? 'W-0001'}`, 56, 330)
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(muted)
    doc.text(tr("Στοιχεία εργασίας", "Service details"), 56, 352)

    doc.setTextColor(text)
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(13)
    doc.text(`${tr("Πελάτης", "Customer")}: ${customer.name}`, 56, 392)
    doc.text(`${tr("Όχημα", "Vehicle")}: ${entry.vehicle || `${primaryVehicle.make} ${primaryVehicle.model}`}`, 56, 420)
    doc.text(`${tr("Εργασία", "Installation")}: ${entry.title}`, 56, 448)
    doc.text(`${tr("Ολοκληρώθηκε", "Completed on")}: ${formatDate(entry.completedOn)}`, 56, 476)
    doc.text(`${tr("Λήξη", "Expires on")}: ${formatDate(warranty.endsOn)}`, 56, 504)

    doc.setTextColor(cyan)
    doc.setFont('NotoSans', 'bold')
    doc.text(tr("Όροι εγγύησης", "Warranty terms"), 56, 548)
    doc.setTextColor(text)
    doc.setFont('NotoSans', 'normal')
    const terms = doc.splitTextToSize(warranty.terms ?? tr("Η κάλυψη ισχύει υπό κανονική χρήση.", "Coverage applies under normal use."), 470)
    doc.text(terms, 56, 570)

    doc.setFillColor(18, 24, 38)
    doc.roundedRect(56, 690, 482, 84, 14, 14, 'F')
    doc.setDrawColor(magenta)
    doc.setLineWidth(1)
    doc.roundedRect(56, 690, 482, 84, 14, 14, 'S')
    doc.setTextColor(cyan)
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(12)
    doc.text(tr("Κατάσταση", "Status"), 80, 724)
    doc.setTextColor(text)
    doc.setFont('NotoSans', 'bold')
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

  if (customerProfileLoading) {
    return (
      <div className="customer-portal-page">
        <div className="customer-shell">
          <div className="customer-hero-card">
            <div className="customer-hero-copy">
              <p className="customer-eyebrow">{tr("Πύλη πελάτη", "Customer portal")}</p>
              <h1>{tr("Φόρτωση προφίλ πελάτη...", "Loading customer profile...")}</h1>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!matchedCustomer) {
    return (
      <div className="customer-portal-page">
        <div className="customer-shell">
          <div className="customer-hero-card">
            <div className="customer-hero-copy">
              <p className="customer-eyebrow">{tr("Πύλη πελάτη", "Customer portal")}</p>
              <h1>{tr("Το προφίλ πελάτη δεν βρέθηκε", "Customer profile not found")}</h1>
              <p>
                {tr("Ο σύνδεσμος πελάτη δεν είναι έγκυρος ή το προφίλ δεν είναι πλέον διαθέσιμο.", "This customer link is invalid or the profile is no longer available.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="customer-portal-page">
      <div className="customer-shell">
        {isAdminViewingCustomer ? (
          <div className="customer-card-actions" style={{ justifyContent: 'flex-start' }}>
            <PortalActionButton onClick={() => navigate({ to: '/portal/admin' })}>{tr("Επιστροφή στη διαχείριση", "Back to admin portal")}</PortalActionButton>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}><LanguageSwitcher /></div><header className="customer-hero-card">
          <img src="/images/glowworks-logo.webp" alt="Glowworks Lab logo" />
          <div className="customer-hero-copy">
            <p className="customer-eyebrow">{tr("Προφίλ πελάτη", "Customer profile")}</p>
            <h1>{customer.name}</h1>
            <p className="customer-hero-meta">{customer.customerCode}</p>
          </div>
          <div className="customer-hero-side">
            <div className="customer-hero-summary">
              <span>{tr("Ολοκληρωμένες εργασίες", "Completed jobs")}</span>
              <strong>{customerHistory.length}</strong>
            </div>
          </div>
        </header>

        <section className="customer-grid">
          <PortalSectionCard eyebrow={tr("Βασικά στοιχεία", "Basic details")} title={tr("Στοιχεία επικοινωνίας", "Contact information")} icon={<ShieldCheck size={16} />}>
            <div className="customer-list">
              <div className="customer-detail"><span>Email</span><strong>{customer.email}</strong></div>
              <div className="customer-detail"><span>{tr("Τηλέφωνο", "Phone")}</span><strong>{customer.phone}</strong></div>
              <div className="customer-detail"><span>{tr("Διεύθυνση", "Address")}</span><strong>{customer.address}</strong></div>
              <div className="customer-detail"><span>{tr("Επίπεδο μέλους", "Loyalty tier")}</span><strong>{customer.loyaltyTier}</strong></div>
            </div>
          </PortalSectionCard>

          <PortalSectionCard eyebrow={tr("Όχημα", "Vehicle")} title={tr("Το αυτοκίνητό σου", "Current vehicle")} icon={<CarFront size={16} />}>
            <div className="customer-list">
              <div className="customer-detail"><span>{tr("Μάρκα", "Brand")}</span><strong>{primaryVehicle.make}</strong></div>
              <div className="customer-detail"><span>{tr("Μοντέλο", "Model")}</span><strong>{primaryVehicle.model}</strong></div>
              <div className="customer-detail"><span>{tr("Έτος", "Year")}</span><strong>{primaryVehicle.year}</strong></div>
              <div className="customer-detail"><span>{tr("Πινακίδα", "Plate")}</span><strong>{primaryVehicle.plate}</strong></div>
            </div>
          </PortalSectionCard>
        </section>
        <section className="customer-member-grid">
          <PortalSectionCard
            eyebrow={tr("Προνόμιο μέλους", "Glowworks member benefit")}
            title={tr("Το προσωπικό σου προνόμιο", "Your personal benefit")}
            icon={<BadgePercent size={17} />}
            className="customer-member-benefit"
          >
                        {discountIsActive ? (
              <div className="customer-member-content">
                <p className="customer-member-kicker">{tr("ΕΝΕΡΓΟ ΠΡΟΝΟΜΙΟ ΜΕΛΟΥΣ", "MEMBER BENEFIT ACTIVE")}</p>
                <strong className="customer-member-value">{memberDiscountPercentage}% OFF</strong>
                <div className="customer-discount-countdown" aria-label={tr("Χρόνος που απομένει", "Discount time remaining")}>
                  <div><strong>{countdownDays}</strong><span>{tr("Ημέρες", "Days")}</span></div>
                  <div><strong>{String(countdownHours).padStart(2, '0')}</strong><span>{tr("Ώρες", "Hours")}</span></div>
                  <div><strong>{String(countdownMinutes).padStart(2, '0')}</strong><span>{tr("Λεπτά", "Minutes")}</span></div>
                  <div><strong>{String(countdownSeconds).padStart(2, '0')}</strong><span>{tr("Δευτερόλεπτα", "Seconds")}</span></div>
                </div>
                <p>{tr("Το προσωπικό σου προνόμιο ισχύει για την επόμενη αναβάθμιση στο Glowworks.lab.", "Your personal benefit is available for your next Glowworks.lab upgrade.")}</p>
                <div className="customer-member-code">
                  <span>{tr("ΚΩΔΙΚΟΣ ΜΕΛΟΥΣ", "MEMBER CODE")}</span>
                  <strong>{memberDiscountCode}</strong>
                </div>
                <small>{tr("Λήγει στις", "Expires on")} {formatDate(customer.discountExpiresAt as string)}</small>
              </div>
            ) : discountIsExpired ? (
              <div className="customer-member-content customer-member-expired">
                <p className="customer-member-kicker">{tr("ΠΡΟΝΟΜΙΟ ΜΕΛΟΥΣ", "MEMBER BENEFIT")}</p>
                <strong className="customer-member-value">{tr("ΕΛΗΞΕ", "EXPIRED")}</strong>
                <p>{tr("Το προνόμιο έληξε. Θα ενεργοποιηθεί ξανά όταν καταχωρηθεί νέα ολοκληρωμένη εργασία.", "This benefit has ended. It will restart only after Glowworks.lab adds a new completed service.")}</p>
                <div className="customer-member-code">
                  <span>{tr("ΚΩΔΙΚΟΣ ΜΕΛΟΥΣ", "MEMBER CODE")}</span>
                  <strong>{memberDiscountCode}</strong>
                </div>
                <small>{tr("Έληξε στις", "Expired on")} {formatDate(customer.discountExpiresAt as string)}</small>
              </div>
            ) : (
              <div className="customer-member-content">
                <p className="customer-member-kicker">{tr("ΠΡΟΝΟΜΙΟ ΜΕΛΟΥΣ", "MEMBER BENEFIT")}</p>
                <strong className="customer-member-value">{tr("ΜΗ ΕΝΕΡΓΟ", "NOT ACTIVE")}</strong>
                <p>{tr("Το προνόμιο 60 ημερών ενεργοποιείται αυτόματα μόλις καταχωρηθεί νέα ολοκληρωμένη εργασία.", "Your 60-day benefit starts automatically when Glowworks.lab adds a new completed service.")}</p>
              </div>
            )}
          </PortalSectionCard>

          <PortalSectionCard
            eyebrow={tr("Η εμπειρία σου", "Your experience")}
            title={tr("Η εμπειρία σου μετράει", "Your experience matters")}
            icon={<Sparkles size={17} />}
            className="customer-review-card"
          >
            <div className="customer-member-content">
              <p>
                {tr("Μοιράσου την ειλικρινή εμπειρία σου και βοήθησε άλλους οδηγούς να γνωρίσουν τη δουλειά μας.", "Share your honest experience and help other drivers discover our work.")}
              </p>

              <div className="customer-card-actions">
                <PortalActionButton
                  href="https://maps.app.goo.gl/va2psSDWoRwo5FZG9"
                  target="_blank"
                  rel="noreferrer"
                  primary
                >
                  {tr("Αξιολόγησέ μας στο Google", "Review us on Google")}
                </PortalActionButton>
              </div>

              <small>
                {tr("Η αξιολόγηση είναι προαιρετική και δεν συνδέεται με το προνόμιο μέλους.", "Leaving a review is optional and is not connected to your membership benefit.")}
              </small>
            </div>
          </PortalSectionCard>
        </section>
<PortalSectionCard
  className="customer-quick-actions-card"
  eyebrow={tr("Γρήγορες ενέργειες", "Quick actions")}
  title={tr("Επικοινωνία με Glowworks", "Contact Glowworks")}
  icon={<Sparkles size={16} />}
>
  <div
    className="customer-card-actions"
    style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}
  >
    <PortalActionButton
      href="https://www.instagram.com/glowworks.lab/"
      target="_blank"
      rel="noreferrer"
    >
      <Instagram size={16} /> Instagram
    </PortalActionButton>

    <PortalActionButton href="tel:+306937153914">
      <Phone size={16} /> {tr("Κάλεσέ μας", "Call us")}
    </PortalActionButton>

    <PortalActionButton href="mailto:klevis.ahmati@icloud.com">
      <Mail size={16} /> Email
    </PortalActionButton>

    <PortalActionButton
      href="https://maps.app.goo.gl/va2psSDWoRwo5FZG9"
      target="_blank"
      rel="noreferrer"
    >
      <MapPin size={16} /> {tr("Τοποθεσία", "Location")}
    </PortalActionButton>

    <PortalActionButton
      href="https://wa.me/306937153914"
      target="_blank"
      rel="noreferrer"
      primary
    >
      <MessageCircle size={16} /> WhatsApp
    </PortalActionButton>

    <PortalActionButton href="/">
      <Home size={16} /> {tr("Κεντρική ιστοσελίδα", "Main website")}
    </PortalActionButton>
  </div>
</PortalSectionCard>
        <PortalSectionCard eyebrow={tr("Συλλογή", "Gallery")} title={tr("Φωτογραφίες πελάτη", "Customer photos")} icon={<Sparkles size={16} />}>
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
            <p className="portal-muted">{tr("Δεν έχουν προστεθεί ακόμη φωτογραφίες για αυτόν τον πελάτη.", "No photos uploaded for this customer yet.")}</p>
          )}
        </PortalSectionCard>

        <PortalSectionCard eyebrow={tr("Εγγύηση", "Warranty")} title={tr("Εγγυήσεις εργασιών", "Job warranties")} icon={<ShieldCheck size={16} />}>
          {warrantyHistory.length ? (
            <div className="customer-list">
              {warrantyHistory.map(({ entry, warranty, warrantyMeta }) => (
                <div className="customer-detail" key={entry.id} style={{ alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span>{entry.completedOn}</span>
                    <strong>{entry.title}</strong>
                    {warranty ? (
                      <>
                        <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                          {tr("Εγγύηση", "Warranty")}: {warranty.warrantyNumber ?? 'Service warranty'} • {warrantyMeta?.statusLabel ?? warranty.status} • {tr("Λήγει", "Expires")} {warranty.endsOn}
                        </p>
                        <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                          {warranty.coverage}
                        </p>
                        <div className="customer-card-actions" style={{ justifyContent: 'flex-start', marginTop: '10px' }}>
                          <PortalActionButton primary onClick={() => { void downloadWarrantyPdf(entry, warranty) }}><Download size={16} /> {tr("Λήψη εγγύησης PDF", "Download warranty PDF")}</PortalActionButton>
                        </div>
                      </>
                    ) : (
                      <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        {tr("Δεν έχει συνδεθεί ακόμη εγγύηση με αυτή την εργασία.", "No warranty linked to this job yet.")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState title={tr("Αναμονή στοιχείων εγγύησης", "Warranty details pending")} description={tr("Τα στοιχεία εγγύησης θα εμφανιστούν εδώ μόλις καταχωρηθεί η εγκατάσταση.", "Your warranty details will appear here once the installation is recorded.")} />
          )}
        </PortalSectionCard>

        <PortalSectionCard eyebrow={tr("Υπηρεσίες", "Services")} title={tr("Εγκατεστημένες αναβαθμίσεις", "Installed services")} icon={<ShieldCheck size={16} />}>
          {customerHistory.length ? (
            <div className="customer-list">
              {customerHistory.slice().sort((a, b) => b.completedOn.localeCompare(a.completedOn)).map((entry) => (
                <div className="customer-detail" key={entry.id} style={{ alignItems: 'flex-start', gap: '10px' }}>
                  <div>
                    <span>{entry.completedOn}</span>
                    <strong>{entry.title}</strong>
                    <p style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {tr("Όχημα", "Vehicle")}: {entry.vehicle || `${primaryVehicle.make} ${primaryVehicle.model}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalEmptyState title={tr("Αναμονή ιστορικού εργασιών", "Service history pending")} description={tr("Το ιστορικό εγκαταστάσεων θα εμφανιστεί μόλις συνδεθούν οι εργασίες με το προφίλ σου.", "Your installation history will appear here once service records are linked to this profile.")} />
          )}
        </PortalSectionCard>
      </div>
    </div>
  )
}
