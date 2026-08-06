import { createInitialPortalState } from './portal-data'
import { generateSecureCustomerPortalSlug } from './customer-links'
import { createWarrantyRecord } from './warranty'
import { DEFAULT_WEBSITE_CONTENT, deepCloneWebsiteContent, WEBSITE_CONTENT_VERSION } from './site-content'
import type { AdminAppointment, AdminDiscount, AdminGalleryItem, AdminService, AdminUploadBundle, CustomerProfile, PortalPreferences, PortalRole, PortalSession, PortalState, ServiceHistoryEntry, WarrantyClaim, WarrantyRecord, WebsiteContent } from '../types/portal'

const STORAGE_KEY = 'glowworks.portal.role'
const STATE_STORAGE_KEY = 'glowworks.portal.state'

function hasStoredPortalState() {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean(window.localStorage.getItem(STATE_STORAGE_KEY))
}

function getEnvValue(name: string, fallback: string) {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.[name]?.trim() || fallback
}

function hasSupabaseConfig() {
  const url = getEnvValue('VITE_SUPABASE_URL', '')
  const key = getEnvValue('VITE_SUPABASE_ANON_KEY', '')
  return Boolean(url && key && !url.includes('placeholder') && !key.includes('placeholder'))
}

function mapCustomerToRemoteRow(customer: CustomerProfile) {
  return {
    customer_id: customer.customerCode,
    full_name: customer.name,
    email: customer.email,
    phone: customer.phone || null,
    address: customer.address || null,
    loyalty_tier: customer.loyaltyTier || 'standard',
    status: 'active',
    created_at: customer.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function mapRemoteCustomerRow(row: Record<string, unknown>): CustomerProfile {
  return {
    id: String(row.customer_id ?? ''),
    customerCode: String(row.customer_id ?? ''),
    name: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    address: String(row.address ?? ''),
    loyaltyTier: String(row.loyalty_tier ?? 'standard'),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    discountEnabled: false,
    discountCode: '',
  }
}

async function getSupabaseClient() {
  try {
    const module = await import('./supabase/client')
    return module.supabase
  } catch (error) {
    console.warn('Supabase client could not be loaded', error)
    return null
  }
}

async function syncCustomersToSupabase(state: PortalState) {
  if (!hasSupabaseConfig()) {
    return false
  }

  try {
    const payload = state.customers.map(mapCustomerToRemoteRow)
    if (!payload.length) {
      return true
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'customer_id' })
    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.warn('Failed to sync customers to Supabase', error)
    return false
  }
}

async function deleteCustomerFromSupabase(customerCode: string) {
  if (!hasSupabaseConfig()) {
    return false
  }

  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return false
    }

    const { error } = await supabase.from('customers').delete().eq('customer_id', customerCode)
    if (error) {
      throw error
    }
    return true
  } catch (error) {
    console.warn('Failed to delete customer from Supabase', error)
    return false
  }
}

export async function hydratePortalStateFromSupabase(baseState: PortalState = getPortalState()) {
  if (!hasSupabaseConfig()) {
    return baseState
  }

  // Keep local edits as source of truth once a local state snapshot exists.
  if (hasStoredPortalState()) {
    return baseState
  }

  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return baseState
    }

    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (error) {
      throw error
    }

    const remoteCustomers = (data ?? []).map(mapRemoteCustomerRow)
    if (!remoteCustomers.length) {
      return baseState
    }

    const mergedCustomers = Array.from(new Map([...remoteCustomers, ...baseState.customers].map((customer) => [customer.customerCode, customer])).values())
    const nextState = {
      ...baseState,
      customers: mergedCustomers,
      customer: mergedCustomers[0] ?? baseState.customer,
    }
    savePortalState(nextState)
    return nextState
  } catch (error) {
    console.warn('Failed to hydrate portal state from Supabase', error)
    return baseState
  }
}

export async function syncPortalStateToSupabase(state: PortalState) {
  if (!hasSupabaseConfig()) {
    return false
  }

  return syncCustomersToSupabase(state)
}

function normalizeWebsiteContent(content: Partial<WebsiteContent> | null | undefined): WebsiteContent {
  const baseContent = deepCloneWebsiteContent(DEFAULT_WEBSITE_CONTENT)

  if (!content || typeof content !== 'object') {
    return baseContent
  }

  const normalizedContent: WebsiteContent = {
    ...baseContent,
    ...content,
    contentVersion: typeof content.contentVersion === 'string' ? content.contentVersion : baseContent.contentVersion,
    heroImage: typeof content.heroImage === 'string' ? content.heroImage : baseContent.heroImage,
    services: Array.isArray(content.services)
      ? content.services.map((service) => ({ ...service }))
      : baseContent.services,
    projects: Array.isArray(content.projects)
      ? content.projects.map((project) => ({ ...project }))
      : baseContent.projects,
    vehicleBrandModels: content.vehicleBrandModels && typeof content.vehicleBrandModels === 'object'
      ? Object.fromEntries(
          Object.entries(content.vehicleBrandModels).map(([brand, models]) => [brand, Array.isArray(models) ? [...models] : []]),
        )
      : baseContent.vehicleBrandModels,
  }

  return normalizedContent.contentVersion === WEBSITE_CONTENT_VERSION ? normalizedContent : baseContent
}

function readStoredState(): PortalState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STATE_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PortalState>
    const baseState = createInitialPortalState()

    return {
      ...baseState,
      ...parsed,
      customer: parsed.customer ?? baseState.customer,
      customers: parsed.customers ?? baseState.customers,
      vehicles: parsed.vehicles ?? baseState.vehicles,
      warranties: parsed.warranties ?? baseState.warranties,
      claims: parsed.claims ?? baseState.claims,
      serviceHistory: parsed.serviceHistory ?? baseState.serviceHistory,
      nfcTags: parsed.nfcTags ?? baseState.nfcTags,
      services: parsed.services ?? baseState.services,
      gallery: parsed.gallery ?? baseState.gallery,
      discounts: parsed.discounts ?? baseState.discounts,
      appointments: parsed.appointments ?? baseState.appointments,
      uploads: parsed.uploads ?? baseState.uploads,
      adminSummary: parsed.adminSummary ?? baseState.adminSummary,
      preferences: parsed.preferences ?? baseState.preferences,
      websiteContent: normalizeWebsiteContent(parsed.websiteContent),
      session: parsed.session ?? null,
    }
  } catch {
    return null
  }
}

export function getPortalState(): PortalState {
  const storedState = readStoredState()
  if (storedState) {
    return storedState
  }

  return createInitialPortalState()
}

export function savePortalState(state: PortalState) {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedState: PortalState = {
    ...state,
    session: state.session ?? null,
  }

  try {
    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(normalizedState))
  } catch (error) {
    const compactState: PortalState = {
      ...normalizedState,
      gallery: normalizedState.gallery.map((item) => ({
        ...item,
        imageUrl: item.imageUrl.startsWith('data:') ? '' : item.imageUrl,
      })),
    }

    try {
      window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(compactState))
      console.warn('Portal state exceeded localStorage limits; large inline gallery images were excluded from persistence.')
    } catch (fallbackError) {
      console.error('Failed to persist portal state to localStorage.', fallbackError ?? error)
    }
  }

  if (state.session?.role) {
    window.localStorage.setItem(STORAGE_KEY, state.session.role)
  }
}

export function updatePortalSession(role: PortalRole, email: string) {
  const nextState = {
    ...getPortalState(),
    session: {
      role,
      email,
      signedInAt: new Date().toISOString(),
    } as PortalSession,
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalPreferences(preferences: PortalPreferences) {
  const nextState = {
    ...getPortalState(),
    preferences,
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalWebsiteContent(content: WebsiteContent) {
  const nextState = {
    ...getPortalState(),
    websiteContent: normalizeWebsiteContent(content),
  }
  savePortalState(nextState)
  return nextState
}

export function createPortalClaim(claim: Omit<WarrantyClaim, 'id' | 'submittedAt'>) {
  const nextState = {
    ...getPortalState(),
    claims: [
      {
        ...claim,
        id: `claim-${Date.now()}`,
        submittedAt: new Date().toISOString().slice(0, 10),
      },
      ...getPortalState().claims,
    ],
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalCustomer(customer: CustomerProfile, baseState: PortalState = getPortalState()) {
  const nextCustomer: CustomerProfile = {
    ...customer,
    customerCode: (customer.customerCode ?? '').trim() || generateSecureCustomerPortalSlug(baseState.customers.map((item) => item.customerCode)),
  }
  const nextState = {
    ...baseState,
    customer: nextCustomer,
    customers: baseState.customers.some((item) => item.id === nextCustomer.id)
      ? baseState.customers.map((item) => item.id === nextCustomer.id ? nextCustomer : item)
      : [nextCustomer, ...baseState.customers],
  }
  savePortalState(nextState)
  void syncPortalStateToSupabase(nextState)
  return nextState
}

export function updatePortalVehicle(vehicle: VehicleRecord) {
  const nextState = {
    ...getPortalState(),
    vehicles: getPortalState().vehicles.some((item) => item.id === vehicle.id)
      ? getPortalState().vehicles.map((item) => item.id === vehicle.id ? vehicle : item)
      : [vehicle, ...getPortalState().vehicles],
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalWarranty(warranty: WarrantyRecord) {
  const nextState = {
    ...getPortalState(),
    warranties: getPortalState().warranties.some((item) => item.id === warranty.id)
      ? getPortalState().warranties.map((item) => item.id === warranty.id ? warranty : item)
      : [warranty, ...getPortalState().warranties],
  }
  savePortalState(nextState)
  void syncPortalStateToSupabase(nextState)
  return nextState
}

export function createPortalCustomer(customer: CustomerProfile) {
  const baseState = getPortalState()
  const nextCustomer: CustomerProfile = {
    ...customer,
    customerCode: (customer.customerCode ?? '').trim() || generateSecureCustomerPortalSlug(baseState.customers.map((item) => item.customerCode)),
  }
  const nextState = {
    ...baseState,
    customers: [nextCustomer, ...baseState.customers],
    customer: nextCustomer,
  }
  savePortalState(nextState)
  void syncPortalStateToSupabase(nextState)
  return nextState
}

export function deletePortalCustomer(customerId: string) {
  const baseState = getPortalState()
  const removedCustomer = baseState.customers.find((customer) => customer.id === customerId)
  const nextState = {
    ...baseState,
    customers: baseState.customers.filter((customer) => customer.id !== customerId),
    vehicles: baseState.vehicles.filter((vehicle) => vehicle.customerId !== customerId),
    warranties: baseState.warranties.filter((warranty) => warranty.customerId !== customerId),
    claims: baseState.claims.filter((claim) => claim.customerId !== customerId),
  }
  savePortalState(nextState)
  if (removedCustomer?.customerCode) {
    void deleteCustomerFromSupabase(removedCustomer.customerCode)
  }
  return nextState
}

export function updatePortalService(service: AdminService) {
  const nextState = {
    ...getPortalState(),
    services: getPortalState().services.some((item) => item.id === service.id)
      ? getPortalState().services.map((item) => item.id === service.id ? service : item)
      : [service, ...getPortalState().services],
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalGallery(item: AdminGalleryItem, baseState: PortalState = getPortalState()) {
  const nextState = {
    ...baseState,
    gallery: baseState.gallery.some((entry) => entry.id === item.id)
      ? baseState.gallery.map((entry) => entry.id === item.id ? item : entry)
      : [item, ...baseState.gallery],
  }
  savePortalState(nextState)
  return nextState
}

export function removePortalGalleryItem(itemId: string, baseState: PortalState = getPortalState()) {
  const nextState = {
    ...baseState,
    gallery: baseState.gallery.filter((entry) => entry.id !== itemId),
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalDiscount(discount: AdminDiscount) {
  const nextState = {
    ...getPortalState(),
    discounts: getPortalState().discounts.some((item) => item.id === discount.id)
      ? getPortalState().discounts.map((item) => item.id === discount.id ? discount : item)
      : [discount, ...getPortalState().discounts],
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalAppointment(appointment: AdminAppointment) {
  const nextState = {
    ...getPortalState(),
    appointments: getPortalState().appointments.some((item) => item.id === appointment.id)
      ? getPortalState().appointments.map((item) => item.id === appointment.id ? appointment : item)
      : [appointment, ...getPortalState().appointments],
  }
  savePortalState(nextState)
  return nextState
}

function addYears(value: string, years: number) {
  const date = new Date(value)
  date.setFullYear(date.getFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function createServiceWarrantyRecord(entry: ServiceHistoryEntry, baseState: PortalState) {
  const customerVehicle = baseState.vehicles.find((vehicle) => vehicle.customerId === entry.customerId)
  const warrantyNumber = entry.warrantyNumber || `W-SVC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const startsOn = entry.warrantyStartsOn || entry.completedOn
  const endsOn = entry.warrantyEndsOn || addYears(entry.completedOn, 2)

  return {
    id: `service-warranty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerId: entry.customerId,
    vehicleId: customerVehicle?.id ?? '',
    product: entry.title,
    status: 'Active' as const,
    installedAt: 'Glowworks Rhodes Studio',
    startsOn,
    endsOn,
    coverage: entry.warrantyCoverage || `2 years · service warranty · ${entry.title}`,
    notes: entry.warrantyNotes || entry.notes || `Service warranty for ${entry.title}`,
    warrantyNumber,
    durationYears: 2,
    installationDate: entry.completedOn,
    terms: `Coverage applies to the service "${entry.title}" under normal use and workmanship standards.`,
  } satisfies WarrantyRecord
}

export function addPortalServiceHistoryEntry(entry: ServiceHistoryEntry, baseState: PortalState = getPortalState()) {
  const warrantyRecord = createServiceWarrantyRecord(entry, baseState)
  const nextEntry = {
    ...entry,
    warrantyId: entry.warrantyId ?? warrantyRecord.id,
  }
  const nextState = {
    ...baseState,
    warranties: [warrantyRecord, ...baseState.warranties.filter((item) => item.id !== warrantyRecord.id)],
    serviceHistory: [nextEntry, ...baseState.serviceHistory.filter((item) => item.id !== entry.id)],
  }
  savePortalState(nextState)
  return nextState
}

export function updatePortalServiceHistoryEntry(entry: ServiceHistoryEntry, baseState: PortalState = getPortalState()) {
  const existingEntry = baseState.serviceHistory.find((item) => item.id === entry.id)

  if (!existingEntry) {
    return addPortalServiceHistoryEntry(entry, baseState)
  }

  const nextEntry = {
    ...existingEntry,
    ...entry,
    customerId: entry.customerId || existingEntry.customerId,
    warrantyId: entry.warrantyId ?? existingEntry.warrantyId,
  }

  const existingWarranty = existingEntry.warrantyId
    ? baseState.warranties.find((item) => item.id === existingEntry.warrantyId)
    : null

  const warrantyRecord = existingWarranty
    ? {
        ...existingWarranty,
        customerId: nextEntry.customerId,
        vehicleId: existingWarranty.vehicleId || baseState.vehicles.find((vehicle) => vehicle.customerId === nextEntry.customerId)?.id || '',
        product: nextEntry.title,
        status: existingWarranty.status,
        startsOn: nextEntry.warrantyStartsOn || existingWarranty.startsOn || nextEntry.completedOn,
        endsOn: nextEntry.warrantyEndsOn || existingWarranty.endsOn || addYears(nextEntry.completedOn, 2),
        coverage: nextEntry.warrantyCoverage || existingWarranty.coverage || `2 years · service warranty · ${nextEntry.title}`,
        notes: nextEntry.warrantyNotes || nextEntry.notes || existingWarranty.notes || `Service warranty for ${nextEntry.title}`,
        warrantyNumber: nextEntry.warrantyNumber || existingWarranty.warrantyNumber || `W-SVC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        durationYears: existingWarranty.durationYears ?? 2,
        installationDate: nextEntry.completedOn,
        terms: existingWarranty.terms || `Coverage applies to the service "${nextEntry.title}" under normal use and workmanship standards.`,
      }
    : createServiceWarrantyRecord(nextEntry, baseState)

  const nextState = {
    ...baseState,
    warranties: existingWarranty
      ? baseState.warranties.map((item) => item.id === existingWarranty.id ? warrantyRecord : item)
      : [warrantyRecord, ...baseState.warranties.filter((item) => item.id !== warrantyRecord.id)],
    serviceHistory: baseState.serviceHistory.map((item) => item.id === entry.id ? nextEntry : item),
  }

  savePortalState(nextState)
  return nextState
}

export function removePortalServiceHistoryEntry(entryId: string, baseState: PortalState = getPortalState()) {
  const removedEntry = baseState.serviceHistory.find((item) => item.id === entryId)
  const nextState = {
    ...baseState,
    serviceHistory: baseState.serviceHistory.filter((item) => item.id !== entryId),
    warranties: baseState.warranties.filter((item) => item.id !== removedEntry?.warrantyId),
  }
  savePortalState(nextState)
  return nextState
}

export function createPortalWarranty(warranty: WarrantyRecord, baseState: PortalState = getPortalState()) {
  const nextState = {
    ...baseState,
    warranties: [warranty, ...baseState.warranties.filter((item) => item.id !== warranty.id)],
  }
  savePortalState(nextState)
  return nextState
}

export function createPortalWarrantyFromAppointment(appointment: AdminAppointment, baseState: PortalState = getPortalState()) {
  const customer = baseState.customers.find((item) => item.id === appointment.customerId)
  const vehicle = baseState.vehicles.find((item) => item.customerId === appointment.customerId)

  if (!customer || !vehicle) {
    return baseState
  }

  const warranty = createWarrantyRecord({
    customer,
    vehicle,
    product: appointment.title,
    installationDate: appointment.installationDate ?? appointment.appointmentDate,
    durationYears: appointment.warrantyYears ?? 2,
    coverage: `${appointment.warrantyYears ?? 2} years · installation + component support`,
    notes: appointment.notes || 'Installation completed with premium warranty coverage.',
    installedAt: 'Glowworks Rhodes Studio',
    terms: 'Coverage applies under normal use and includes workmanship for the installed package.',
  })

  const nextState = createPortalWarranty(warranty, baseState)

  if (appointment.status === 'Completed') {
    const historyEntry: ServiceHistoryEntry = {
      id: `history-${Date.now()}`,
      customerId: customer.id,
      title: appointment.title,
      vehicle: appointment.vehicle || vehicle.model,
      completedOn: appointment.installationDate ?? appointment.appointmentDate,
      notes: appointment.notes || 'Installation completed with premium warranty coverage.',
    }

    return addPortalServiceHistoryEntry(historyEntry, nextState)
  }

  return nextState
}

export function updatePortalUploads(uploads: AdminUploadBundle) {
  const nextState = {
    ...getPortalState(),
    uploads,
  }
  savePortalState(nextState)
  return nextState
}
