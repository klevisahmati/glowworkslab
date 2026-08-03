export interface CustomerRow {
  id: string
  customer_id: string
  full_name: string
  email: string
  phone?: string | null
  address?: string | null
  loyalty_tier: string
  status: string
  created_at: string
  updated_at: string
}

export interface VehicleRow {
  id: string
  vehicle_id: string
  customer_id: string
  make: string
  model: string
  year: number
  vin?: string | null
  plate?: string | null
  purchase_date?: string | null
  notes?: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ServiceRow {
  id: string
  service_id: string
  name: string
  category: string
  description?: string | null
  price: number
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InstallationRow {
  id: string
  installation_id: string
  vehicle_id: string
  service_id?: string | null
  installed_at: string
  technician?: string | null
  status: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface WarrantyRow {
  id: string
  warranty_id: string
  installation_id: string
  coverage_type: string
  starts_on: string
  ends_on: string
  status: string
  terms?: string | null
  created_at: string
  updated_at: string
}

export interface GalleryRow {
  id: string
  gallery_id: string
  title: string
  description?: string | null
  image_url?: string | null
  category: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface DiscountRow {
  id: string
  discount_id: string
  code: string
  description?: string | null
  percentage: number
  valid_from: string
  valid_to?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AppointmentRow {
  id: string
  appointment_id: string
  customer_id: string
  vehicle_id?: string | null
  service_id?: string | null
  appointment_date: string
  status: string
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface AdminRow {
  id: string
  admin_id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}
