import { supabase } from './client'
import type {
  AdminRow,
  AppointmentRow,
  CustomerRow,
  DiscountRow,
  GalleryRow,
  InstallationRow,
  ServiceRow,
  VehicleRow,
  WarrantyRow,
} from './types'

export async function getServices() {
  const { data, error } = await supabase.from('services').select('*').eq('is_active', true)
  if (error) throw error
  return data as ServiceRow[]
}

export async function getGallery() {
  const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as GalleryRow[]
}

export async function getDiscounts() {
  const { data, error } = await supabase.from('discounts').select('*').eq('is_active', true)
  if (error) throw error
  return data as DiscountRow[]
}

export async function getCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as CustomerRow[]
}

export async function getCustomerById(customerId: string) {
  const { data, error } = await supabase.from('customers').select('*').eq('customer_id', customerId).single()
  if (error) throw error
  return data as CustomerRow
}

export async function getVehiclesByCustomer(customerId: string) {
  const { data, error } = await supabase.from('vehicles').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
  if (error) throw error
  return data as VehicleRow[]
}

export async function getInstallationsByVehicle(vehicleId: string) {
  const { data, error } = await supabase.from('installations').select('*').eq('vehicle_id', vehicleId).order('installed_at', { ascending: false })
  if (error) throw error
  return data as InstallationRow[]
}

export async function getWarrantyByInstallation(installationId: string) {
  const { data, error } = await supabase.from('warranties').select('*').eq('installation_id', installationId).single()
  if (error) throw error
  return data as WarrantyRow
}

export async function getAppointments() {
  const { data, error } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true })
  if (error) throw error
  return data as AppointmentRow[]
}

export async function getAdmins() {
  const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as AdminRow[]
}

export async function createCustomer(input: Omit<CustomerRow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('customers').insert(input).select('*').single()
  if (error) throw error
  return data as CustomerRow
}

export async function createVehicle(input: Omit<VehicleRow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('vehicles').insert(input).select('*').single()
  if (error) throw error
  return data as VehicleRow
}

export async function createInstallation(input: Omit<InstallationRow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('installations').insert(input).select('*').single()
  if (error) throw error
  return data as InstallationRow
}

export async function createWarranty(input: Omit<WarrantyRow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('warranties').insert(input).select('*').single()
  if (error) throw error
  return data as WarrantyRow
}

export async function createAppointment(input: Omit<AppointmentRow, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('appointments').insert(input).select('*').single()
  if (error) throw error
  return data as AppointmentRow
}
