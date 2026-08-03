export type PortalRole = 'customer' | 'admin'

export interface PortalSession {
  role: PortalRole
  email: string
  signedInAt: string
}

export interface PortalPreferences {
  notifications: boolean
  reminders: boolean
  preferredChannel: 'email' | 'sms' | 'phone'
}

export interface PortalState {
  session: PortalSession | null
  customer: CustomerProfile
  customers: CustomerProfile[]
  vehicles: VehicleRecord[]
  warranties: WarrantyRecord[]
  claims: WarrantyClaim[]
  serviceHistory: ServiceHistoryEntry[]
  nfcTags: NFCRecord[]
  services: AdminService[]
  gallery: AdminGalleryItem[]
  discounts: AdminDiscount[]
  appointments: AdminAppointment[]
  uploads: AdminUploadBundle
  adminSummary: AdminSummary
  preferences: PortalPreferences
}

export interface CustomerProfile {
  id: string
  customerCode: string
  name: string
  email: string
  phone: string
  address: string
  loyaltyTier: string
  createdAt: string
}

export interface VehicleRecord {
  id: string
  customerId: string
  make: string
  model: string
  year: number
  vin: string
  plate: string
  purchaseDate: string
  nfcTagId?: string
}

export interface WarrantyRecord {
  id: string
  customerId: string
  vehicleId: string
  product: string
  status: 'Active' | 'Pending Review' | 'Expired' | 'Claimed'
  installedAt: string
  startsOn: string
  endsOn: string
  coverage: string
  notes: string
  warrantyNumber?: string
  durationYears?: number
  installationDate?: string
  terms?: string
}

export interface WarrantyClaim {
  id: string
  warrantyId: string
  customerId: string
  title: string
  type: 'Service' | 'Inspection' | 'Replacement' | 'Other'
  description: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedAt: string
}

export interface ServiceHistoryEntry {
  id: string
  customerId: string
  title: string
  vehicle: string
  completedOn: string
  notes?: string
}

export interface NFCRecord {
  id: string
  tagId: string
  vehicleId: string
  assignedTo: string
  status: 'Active' | 'Pending' | 'Inactive'
}

export interface AdminService {
  id: string
  name: string
  category: string
  description: string
  price: number
  durationDays: number
}

export interface AdminGalleryItem {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  featured: boolean
}

export interface AdminDiscount {
  id: string
  code: string
  description: string
  percentage: number
  validFrom: string
  validTo: string
  active: boolean
  tier?: 'Standard' | 'Gold' | 'Platinum' | 'Diamond'
}

export interface AdminAppointment {
  id: string
  customerId: string
  title: string
  appointmentDate: string
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
  notes: string
  vehicle: string
  warrantyYears?: number
  installationDate?: string
}

export interface UploadedFileMeta {
  name: string
  size: number
  type: string
}

export interface AdminUploadBundle {
  installationPhotos: UploadedFileMeta[]
  invoicePdf: UploadedFileMeta[]
  warrantyPdf: UploadedFileMeta[]
}

export interface AdminSummary {
  activeCustomers: number
  pendingClaims: number
  expiringWarranties: number
  activeNfcTags: number
}
