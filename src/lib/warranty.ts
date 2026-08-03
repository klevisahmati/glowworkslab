import type { CustomerProfile, VehicleRecord, WarrantyRecord } from '../types/portal'

export const DEFAULT_WARRANTY_YEARS = 2

export function addYears(value: string, years: number) {
  const date = new Date(value)
  date.setFullYear(date.getFullYear() + years)
  return date.toISOString().slice(0, 10)
}

export function buildWarrantyNumber(customerCode: string, product: string, installationDate: string) {
  const safeProduct = product.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'WRT'
  const safeDate = installationDate.replace(/-/g, '')
  return `W-${customerCode.replace(/[^A-Z0-9]/g, '').slice(-4)}-${safeProduct}-${safeDate}`
}

export function calculateWarrantyMeta(warranty: WarrantyRecord, now = new Date()) {
  const start = new Date(warranty.startsOn)
  const end = new Date(warranty.endsOn)
  const diffMs = end.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / 86_400_000))
  const isActive = now >= start && now <= end

  return {
    isActive,
    daysRemaining,
    statusLabel: isActive ? 'WARRANTY ACTIVE' : 'WARRANTY EXPIRED',
    statusTone: isActive ? 'active' as const : 'expired' as const,
  }
}

export function createWarrantyRecord(params: {
  customer: CustomerProfile
  vehicle: VehicleRecord
  product: string
  installationDate: string
  durationYears?: number
  coverage?: string
  notes?: string
  installedAt?: string
  terms?: string
}) {
  const durationYears = params.durationYears ?? DEFAULT_WARRANTY_YEARS
  const startsOn = params.installationDate
  const endsOn = addYears(params.installationDate, durationYears)
  const warrantyNumber = buildWarrantyNumber(params.customer.customerCode, params.product, params.installationDate)
  const computedStatus = calculateWarrantyMeta({
    id: '',
    customerId: params.customer.id,
    vehicleId: params.vehicle.id,
    product: params.product,
    status: 'Active',
    installedAt: params.installedAt ?? 'Glowworks Rhodes Studio',
    startsOn,
    endsOn,
    coverage: params.coverage ?? 'Premium installation coverage',
    notes: params.notes ?? '',
    warrantyNumber,
    durationYears,
    installationDate: startsOn,
    terms: params.terms ?? 'Coverage applies under normal use and includes workmanship for the installed package.',
  }).isActive
    ? 'Active' as const
    : 'Expired' as const

  return {
    id: `w-${Date.now()}`,
    customerId: params.customer.id,
    vehicleId: params.vehicle.id,
    product: params.product,
    status: computedStatus,
    installedAt: params.installedAt ?? 'Glowworks Rhodes Studio',
    startsOn,
    endsOn,
    coverage: params.coverage ?? 'Premium installation coverage',
    notes: params.notes ?? '',
    warrantyNumber,
    durationYears,
    installationDate: startsOn,
    terms: params.terms ?? 'Coverage applies under normal use and includes workmanship for the installed package.',
  } satisfies WarrantyRecord
}
