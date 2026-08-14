 import { createInitialPortalState } from './portal-data'
import { generateSecureCustomerPortalSlug } from './customer-links'
import { authenticateAdmin, getStoredPortalRole, hasValidAdminSession, logoutAdminSession, setStoredPortalRole } from './portal-auth'
import { createWarrantyRecord } from './warranty'
import type { AdminAppointment, AdminDiscount, AdminGalleryItem, AdminService, AdminUploadBundle, CustomerProfile, PortalPreferences, PortalRole, PortalSession, PortalState, ServiceHistoryEntry, VehicleRecord, WarrantyClaim, WarrantyRecord } from '../types/portal'

const STORAGE_KEY = 'glowworks.portal.role'
const STATE_STORAGE_KEY = 'glowworks.portal.state'
const ADMIN_ACCESS_CODE_STORAGE_KEY = 'glowworks.portal.adminCode'
const ADMIN_AUTH_STORAGE_KEY = 'glowworks.portal.adminAuth'
export const OWNER_PORTAL_EMAIL = 'klevis.ahmati@icloud.com'
export const DEFAULT_ADMIN_ACCESS_CODE = ''

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
    costumer_id: customer.customerCode,
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
    id: String(row.id ?? ''),
customerCode: String(row.costumer_id ?? row.id ?? ''),
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

function mapRemoteVehicleRow(row: Record<string, unknown>): VehicleRecord {
  return {
    id: String(row.id ?? ''),
    customerId: String(row.costumer_id ?? ''),
    make: String(row.make ?? ''),
    model: String(row.model ?? ''),
    year: Number(row.year ?? 0),
    vin: String(row.vin ?? ''),
    plate: String(row.registration ?? ''),
    purchaseDate: String(row.created_at ?? ''),
    nfcTagId: undefined,
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
    const supabase = await getSupabaseClient()

    if (!supabase) {
      return false
    }

    const payload = state.customers.map(mapCustomerToRemoteRow)

    if (!payload.length) {
      return true
    }

    const { error } = await supabase
  .from('costumers')
  .delete()
  .eq('id', customerCode)

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

    const { error } = await supabase.from('costumers').delete().eq('id', customerCode)
    if (error) {
      throw error
    }
    return true
  } catch (error) {
    console.warn('Failed to delete customer from Supabase', error)
    return false
  }
}

  export async function hydratePortalStateFromSupabase(baseState: PortalState) {
  if (!hasSupabaseConfig()) {
    return baseState
  }

  try {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return baseState
  }

  const { data: customerData, error: customerError } = await supabase
    .from('costumers')
    .select('*')
    .order('created_at', { ascending: false })

  if (customerError) {
    throw customerError
  }

  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (vehicleError) {
    throw vehicleError
  }

  const remoteCustomers = (customerData ?? []).map(mapRemoteCustomerRow)
  const remoteVehicles = (vehicleData ?? []).map(mapRemoteVehicleRow)

  const nextState = {
    ...baseState,
    customers: remoteCustomers,
    customer: remoteCustomers[0] ?? baseState.customer,
    vehicles: remoteVehicles,
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

export function isOwnerPortalEmail(email?: string | null) {
  return (email ?? '').trim().toLowerCase() === OWNER_PORTAL_EMAIL
}

export function getAdminAccessCode() {
  if (typeof window === 'undefined') {
    return getEnvValue('VITE_ADMIN_ACCESS_CODE', DEFAULT_ADMIN_ACCESS_CODE)
  }

  const storedCode = window.localStorage.getItem(ADMIN_ACCESS_CODE_STORAGE_KEY)
  return (storedCode ?? '').trim() || getEnvValue('VITE_ADMIN_ACCESS_CODE', DEFAULT_ADMIN_ACCESS_CODE)
}

export function setAdminAccessCode(code: string) {
  if (typeof window !== 'undefined') {
    const normalizedCode = code.trim()
    window.localStorage.setItem(ADMIN_ACCESS_CODE_STORAGE_KEY, normalizedCode || DEFAULT_ADMIN_ACCESS_CODE)
  }
}

export function getAdminAuthSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as { email: string; authenticatedAt: string }
  } catch {
    return null
  }
}

export function isOwnerAdminAccess(email?: string | null, enteredCode?: string | null) {
  if (!isOwnerPortalEmail(email)) {
    return false
  }

  const normalizedCode = (enteredCode ?? '').trim().toLowerCase()
  const configuredCode = getAdminAccessCode().trim().toLowerCase()

  if (!normalizedCode) {
    return configuredCode === DEFAULT_ADMIN_ACCESS_CODE.toLowerCase()
  }

  return normalizedCode === configuredCode
}

export function getPortalSessionSnapshot() {
  if (typeof window === 'undefined') {
    return null
  }

  const storedState = readStoredState()
  const rawRole = window.localStorage.getItem(STORAGE_KEY)
  const sessionRole = storedState?.session?.role ?? (rawRole === 'admin' ? 'admin' : rawRole === 'customer' ? 'customer' : null)
  const sessionEmail = storedState?.session?.email ?? storedState?.customer?.email ?? ''
  const sessionAdminCode = storedState?.session?.adminCode ?? getAdminAccessCode()

  return {
    role: sessionRole,
    email: sessionEmail,
    adminCode: sessionAdminCode,
  }
}

export function hasValidOwnerAdminSession() {
  const snapshot = getPortalSessionSnapshot()
  if (!snapshot || snapshot.role !== 'admin') {
    return false
  }

  return isOwnerPortalEmail(snapshot.email) && (snapshot.adminCode === DEFAULT_ADMIN_ACCESS_CODE || isOwnerAdminAccess(snapshot.email, snapshot.adminCode))
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
      session: parsed.session ?? null,
    }
  } catch {
    return null
  }
}

export function getStoredPortalRole(): PortalRole | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedState = readStoredState()
  const sessionRole = storedState?.session?.role
  if (sessionRole === 'admin' && !isOwnerPortalEmail(storedState?.session?.email)) {
    return 'customer'
  }
  if (sessionRole) {
    return sessionRole
  }

  return getStoredPortalRoleFromAuth()
}

function getStoredPortalRoleFromAuth() {
  const role = window.localStorage.getItem(STORAGE_KEY)
  if (role === 'admin' && !isOwnerPortalEmail(getAdminAuthSession()?.email)) {
    return 'customer'
  }
  return role === 'customer' || role === 'admin' ? role : null
}

export function setStoredPortalRole(role: PortalRole, email = OWNER_PORTAL_EMAIL, adminCode?: string) {
  if (typeof window !== 'undefined') {
    const normalizedEmail = email.trim().toLowerCase()
    const safeRole: PortalRole = role === 'admin' && !isOwnerPortalEmail(normalizedEmail) ? 'customer' : role
    const normalizedAdminCode = (adminCode ?? '').trim() || getAdminAccessCode()
    if (safeRole === 'admin') {
      setAdminAccessCode(normalizedAdminCode)
    }
    window.localStorage.setItem(STORAGE_KEY, safeRole)
    const state = getPortalState()
    const updatedState: PortalState = {
      ...state,
      session: {
        role: safeRole,
        email: normalizedEmail,
        signedInAt: new Date().toISOString(),
        ...(safeRole === 'admin' ? { adminCode: normalizedAdminCode } : {}),
      },
    }
    savePortalState(updatedState)
  }
}

export function clearStoredPortalRole() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
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

  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(normalizedState))
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
  if (removedCustomer?.id) {
    void deleteCustomerFromSupabase(removedCustomer.id)
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
