import type { AdminAppointment, AdminDiscount, AdminGalleryItem, AdminService, AdminSummary, AdminUploadBundle, CustomerProfile, NFCRecord, PortalPreferences, PortalState, ServiceHistoryEntry, VehicleRecord, WarrantyClaim, WarrantyRecord } from '../types/portal'

const createCustomer = (overrides: Partial<CustomerProfile> = {}): CustomerProfile => ({
  id: `cust-${Math.random().toString(36).slice(2, 8)}`,
  customerCode: 'GWL-000001',
  name: 'Nikos Papadopoulos',
  email: 'nikos@glowworks.lab',
  phone: '+30 693 715 3914',
  address: 'Rhodes, Greece',
  loyaltyTier: 'Diamond',
  createdAt: '2025-06-01',
  discountEnabled: true,
  discountCode: 'GLOW10',
  ...overrides,
})

export const portalCustomer: CustomerProfile = createCustomer()

export const portalCustomers: CustomerProfile[] = [
  portalCustomer,
  createCustomer({
    id: 'cust-002',
    customerCode: 'GWL-000002',
    name: 'Maria Ioannou',
    email: 'maria@glowworks.lab',
    phone: '+30 698 320 7721',
    address: 'Kallithea, Rhodes',
    loyaltyTier: 'Gold',
    createdAt: '2025-07-12',
  }),
  createCustomer({
    id: 'cust-003',
    customerCode: 'GWL-000003',
    name: 'Theo Vasilakis',
    email: 'theo@glowworks.lab',
    phone: '+30 694 110 8842',
    address: 'Faliraki, Rhodes',
    loyaltyTier: 'Platinum',
    createdAt: '2025-08-01',
  }),
]

export const portalVehicles: VehicleRecord[] = [
  {
    id: 'veh-001',
    customerId: 'cust-001',
    make: 'Mercedes-Benz',
    model: 'A-Class W177',
    year: 2024,
    vin: 'WDB12345678901234',
    plate: 'RO-4821',
    purchaseDate: '2024-03-14',
    nfcTagId: 'NFC-001',
  },
  {
    id: 'veh-002',
    customerId: 'cust-001',
    make: 'BMW',
    model: 'M4 G82',
    year: 2023,
    vin: 'WBA98765432109876',
    plate: 'RO-9010',
    purchaseDate: '2023-11-02',
    nfcTagId: 'NFC-002',
  },
]

export const portalWarranties: WarrantyRecord[] = [
  {
    id: 'w-1001',
    customerId: 'cust-001',
    vehicleId: 'veh-001',
    product: 'Ambient Lighting Package',
    status: 'Active',
    installedAt: 'Glowworks Rhodes Studio',
    startsOn: '2024-03-14',
    endsOn: '2026-03-14',
    coverage: '2 years · installation + component support',
    notes: 'Premium illumination system with custom scene presets.',
    warrantyNumber: 'W-GWL1-AMPL-20240314',
    durationYears: 2,
    installationDate: '2024-03-14',
    terms: 'Coverage applies under normal use and includes workmanship for the installed package.',
  },
  {
    id: 'w-1002',
    customerId: 'cust-001',
    vehicleId: 'veh-002',
    product: 'Starlight Headliner',
    status: 'Pending Review',
    installedAt: 'Glowworks Rhodes Studio',
    startsOn: '2023-11-02',
    endsOn: '2025-11-02',
    coverage: '2 years · service + material coverage',
    notes: 'Awaiting final inspection after seasonal service.',
    warrantyNumber: 'W-GWL1-STHL-20231102',
    durationYears: 2,
    installationDate: '2023-11-02',
    terms: 'Coverage applies under normal use and includes workmanship for the installed package.',
  },
]

export const portalClaims: WarrantyClaim[] = [
  {
    id: 'claim-001',
    warrantyId: 'w-1001',
    customerId: 'cust-001',
    title: 'Module brightness adjustment',
    type: 'Service',
    description: 'One lighting module shows weaker output during night mode.',
    priority: 'Medium',
    status: 'Pending',
    submittedAt: '2025-06-18',
  },
]

export const portalServiceHistory: ServiceHistoryEntry[] = [
  {
    id: 'history-001',
    customerId: 'cust-001',
    title: 'Premium Ambient Lighting',
    vehicle: 'Toyota C-HR',
    completedOn: '2026-07-31',
    notes: 'Premium ambient lighting upgrade completed in studio.',
  },
  {
    id: 'history-002',
    customerId: 'cust-001',
    title: 'Leather Steering Wheel',
    vehicle: 'Toyota C-HR',
    completedOn: '2026-12-15',
    notes: 'Custom leather steering wheel installed.',
  },
  {
    id: 'history-003',
    customerId: 'cust-001',
    title: 'Ceramic Coating',
    vehicle: 'Toyota C-HR',
    completedOn: '2027-03-08',
    notes: 'Long-lasting ceramic coating applied.',
  },
]

export const portalNfcTags: NFCRecord[] = [
  {
    id: 'nfc-001',
    tagId: 'NFC-001',
    vehicleId: 'veh-001',
    assignedTo: 'Mercedes-Benz A-Class',
    status: 'Active',
  },
  {
    id: 'nfc-002',
    tagId: 'NFC-002',
    vehicleId: 'veh-002',
    assignedTo: 'BMW M4',
    status: 'Pending',
  },
]

export const portalAdminSummary: AdminSummary = {
  activeCustomers: 24,
  pendingClaims: 7,
  expiringWarranties: 3,
  activeNfcTags: 18,
}

export const portalServices: AdminService[] = [
  { id: 'svc-001', name: 'Ambient Lighting', category: 'Lighting', description: 'Custom cabin lighting with scene presets', price: 1280, durationDays: 2 },
  { id: 'svc-002', name: 'Starlight Headliner', category: 'Headliner', description: 'Premium starfield roof lighting', price: 2880, durationDays: 3 },
  { id: 'svc-003', name: 'Custom Steering Wheel', category: 'Interior', description: 'Leather and carbon upgraded wheel', price: 980, durationDays: 1 },
]

export const portalGallery: AdminGalleryItem[] = [
  { id: 'gallery-001', title: 'Mercedes A-Class', description: 'Ambient light and premium trim', imageUrl: '/images/mercedes_a_class_w1172.jpg', category: 'Project', featured: true },
  { id: 'gallery-002', title: 'BMW M4', description: 'Interior lighting upgrade', imageUrl: '/images/IMG_2085.JPEG', category: 'Project', featured: true },
]

export const portalDiscounts: AdminDiscount[] = [
  { id: 'discount-001', code: 'GLOW10', description: 'Warranty loyalty discount', percentage: 10, validFrom: '2025-08-01', validTo: '2025-09-01', active: true, tier: 'Diamond' },
  { id: 'discount-002', code: 'VIP20', description: 'Premium loyalty incentive', percentage: 20, validFrom: '2025-08-01', validTo: '2025-10-01', active: true, tier: 'Platinum' },
]

export const portalAppointments: AdminAppointment[] = [
  { id: 'appt-001', customerId: 'cust-001', title: 'Ambient lighting inspection', appointmentDate: '2025-08-03', status: 'Confirmed', notes: 'Client arrival at 17:30', vehicle: 'Mercedes A-Class' },
  { id: 'appt-002', customerId: 'cust-002', title: 'Headliner consultation', appointmentDate: '2025-08-03', status: 'Pending', notes: 'Discuss upgrade options', vehicle: 'BMW M4' },
]

export const portalUploads: AdminUploadBundle = {
  installationPhotos: [{ name: 'installation-01.jpg', size: 320000, type: 'image/jpeg' }],
  invoicePdf: [{ name: 'invoice-01.pdf', size: 180000, type: 'application/pdf' }],
  warrantyPdf: [{ name: 'warranty-01.pdf', size: 220000, type: 'application/pdf' }],
}

export const portalPreferences: PortalPreferences = {
  notifications: true,
  reminders: true,
  preferredChannel: 'email',
}

export function createInitialPortalState(): PortalState {
  return {
    session: null,
    customer: { ...portalCustomer },
    customers: portalCustomers.map((customer) => ({ ...customer })),
    vehicles: portalVehicles.map((vehicle) => ({ ...vehicle })),
    warranties: portalWarranties.map((warranty) => ({ ...warranty })),
    claims: portalClaims.map((claim) => ({ ...claim })),
    serviceHistory: portalServiceHistory.map((history) => ({ ...history })),
    nfcTags: portalNfcTags.map((tag) => ({ ...tag })),
    services: portalServices.map((service) => ({ ...service })),
    gallery: portalGallery.map((item) => ({ ...item })),
    discounts: portalDiscounts.map((discount) => ({ ...discount })),
    appointments: portalAppointments.map((appointment) => ({ ...appointment })),
    uploads: {
      installationPhotos: portalUploads.installationPhotos.map((file) => ({ ...file })),
      invoicePdf: portalUploads.invoicePdf.map((file) => ({ ...file })),
      warrantyPdf: portalUploads.warrantyPdf.map((file) => ({ ...file })),
    },
    adminSummary: { ...portalAdminSummary },
    preferences: { ...portalPreferences },
  }
}

export function getWarrantyById(id: string) {
  return portalWarranties.find((item) => item.id === id) ?? null
}

export function getVehicleById(id: string) {
  return portalVehicles.find((item) => item.id === id) ?? null
}

export function getClaimsForCustomer(customerId: string) {
  return portalClaims.filter((item) => item.customerId === customerId)
}
