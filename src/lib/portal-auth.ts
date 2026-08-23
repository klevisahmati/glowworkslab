import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase/client'

export type PortalStaffRole = 'admin' | 'reviewer'
export type PortalRole = PortalStaffRole | 'customer'

const STORAGE_KEY = 'glowworks-portal-role'
const EMAIL_STORAGE_KEY = 'glowworks-portal-email'
const ADMIN_EMAIL = 'klevis.ahmati@icloud.com'

function getPortalStaffRole(user: User | null): PortalStaffRole | null {
  if (!user) return null

  const metadataRole = user.app_metadata?.portal_role

  if (metadataRole === 'admin' || metadataRole === 'reviewer') {
    return metadataRole
  }

  if (user.email?.trim().toLowerCase() === ADMIN_EMAIL) {
    return 'admin'
  }

  return null
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<PortalStaffRole | null> {
  const normalizedEmail = email.trim().toLowerCase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error || !data.user) {
    return null
  }

  const role = getPortalStaffRole(data.user)

  if (!role) {
    await supabase.auth.signOut()
    return null
  }

  setStoredPortalRole(role, normalizedEmail)
  return role
}

export async function getValidPortalStaffRole(): Promise<PortalStaffRole | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    return null
  }

  return getPortalStaffRole(session.user)
}

export async function hasValidAdminSession(): Promise<boolean> {
  return Boolean(await getValidPortalStaffRole())
}

export function setStoredPortalRole(role: PortalRole, email = '') {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, role)

  if (email) {
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase())
  }
}

export function getStoredPortalRole(): PortalRole | null {
  if (typeof window === 'undefined') return null

  const role = window.localStorage.getItem(STORAGE_KEY)

  if (role === 'admin' || role === 'reviewer' || role === 'customer') {
    return role
  }

  return null
}

export function getStoredPortalEmail() {
  if (typeof window === 'undefined') return ''

  return window.localStorage.getItem(EMAIL_STORAGE_KEY) || ''
}

export async function clearPortalSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(EMAIL_STORAGE_KEY)
  }

  await supabase.auth.signOut()
}