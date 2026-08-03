import { createInitialPortalState } from './portal-data'
import { createWarrantyRecord } from './warranty'
import type { AdminAppointment, AdminDiscount, AdminGalleryItem, AdminService, AdminUploadBundle, CustomerProfile, PortalPreferences, PortalRole, PortalSession, PortalState, ServiceHistoryEntry, WarrantyClaim, WarrantyRecord } from '../types/portal'

const STORAGE_KEY = 'glowworks.portal.role'
const STATE_STORAGE_KEY = 'glowworks.portal.state'

function readStoredState(): PortalState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STATE_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PortalState
    return {
      ...createInitialPortalState(),
      ...parsed,
      customer: parsed.customer ?? createInitialPortalState().customer,
      customers: parsed.customers ?? createInitialPortalState().customers,
      vehicles: parsed.vehicles ?? createInitialPortalState().vehicles,
      warranties: parsed.warranties ?? createInitialPortalState().warranties,
      claims: parsed.claims ?? createInitialPortalState().claims,
      serviceHistory: parsed.serviceHistory ?? createInitialPortalState().serviceHistory,
      nfcTags: parsed.nfcTags ?? createInitialPortalState().nfcTags,
      services: parsed.services ?? createInitialPortalState().services,
      gallery: parsed.gallery ?? createInitialPortalState().gallery,
      discounts: parsed.discounts ?? createInitialPortalState().discounts,
      appointments: parsed.appointments ?? createInitialPortalState().appointments,
      uploads: parsed.uploads ?? createInitialPortalState().uploads,
      adminSummary: parsed.adminSummary ?? createInitialPortalState().adminSummary,
      preferences: parsed.preferences ?? createInitialPortalState().preferences,
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
  if (storedState?.session?.role) {
    return storedState.session.role
  }

  const role = window.localStorage.getItem(STORAGE_KEY)
  return role === 'customer' || role === 'admin' ? role : null
}

export function setStoredPortalRole(role: PortalRole, email = 'nikos@glowworks.lab') {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, role)
    const state = getPortalState()
    const updatedState: PortalState = {
      ...state,
      session: {
        role,
        email,
        signedInAt: new Date().toISOString(),
      },
    }
    savePortalState(updatedState)
  }
}

export function clearStoredPortalRole() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(STATE_STORAGE_KEY)
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

  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state))
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

export function updatePortalCustomer(customer: CustomerProfile) {
  const nextState = {
    ...getPortalState(),
    customer,
    customers: getPortalState().customers.some((item) => item.id === customer.id)
      ? getPortalState().customers.map((item) => item.id === customer.id ? customer : item)
      : [customer, ...getPortalState().customers],
  }
  savePortalState(nextState)
  return nextState
}

export function createPortalCustomer(customer: CustomerProfile) {
  const nextState = {
    ...getPortalState(),
    customers: [customer, ...getPortalState().customers],
    customer,
  }
  savePortalState(nextState)
  return nextState
}

export function deletePortalCustomer(customerId: string) {
  const nextState = {
    ...getPortalState(),
    customers: getPortalState().customers.filter((customer) => customer.id !== customerId),
    vehicles: getPortalState().vehicles.filter((vehicle) => vehicle.customerId !== customerId),
    warranties: getPortalState().warranties.filter((warranty) => warranty.customerId !== customerId),
    claims: getPortalState().claims.filter((claim) => claim.customerId !== customerId),
  }
  savePortalState(nextState)
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

export function updatePortalGallery(item: AdminGalleryItem) {
  const nextState = {
    ...getPortalState(),
    gallery: getPortalState().gallery.some((entry) => entry.id === item.id)
      ? getPortalState().gallery.map((entry) => entry.id === item.id ? item : entry)
      : [item, ...getPortalState().gallery],
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

export function addPortalServiceHistoryEntry(entry: ServiceHistoryEntry, baseState: PortalState = getPortalState()) {
  const nextState = {
    ...baseState,
    serviceHistory: [entry, ...baseState.serviceHistory.filter((item) => item.id !== entry.id)],
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
