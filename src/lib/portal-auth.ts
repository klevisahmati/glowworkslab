import { supabase } from './supabase/client'

const STORAGE_KEY = 'glowworks.portal.role'
const ADMIN_AUTH_STORAGE_KEY = 'glowworks.portal.adminAuth.v2'
const ADMIN_EMAIL = 'klevis.ahmati@icloud.com'

function getConfiguredAdminEmail() {
  return ADMIN_EMAIL
}

export async function authenticateAdmin(
  email: string,
  password: string,
) {
  if (typeof window === 'undefined') {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  const configuredEmail = getConfiguredAdminEmail()

  if (!configuredEmail || normalizedEmail !== configuredEmail) {
    return false
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error || !data.user) {
    return false
  }

  window.localStorage.setItem(
    ADMIN_AUTH_STORAGE_KEY,
    JSON.stringify({
      email: normalizedEmail,
      authenticatedAt: new Date().toISOString(),
    }),
  )

  return true
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
    return JSON.parse(raw) as {
      email: string
      authenticatedAt: string
    }
  } catch {
    return null
  }
}

export function hasValidAdminSession() {
  const session = getAdminAuthSession()
  const configuredEmail = getConfiguredAdminEmail()

  return Boolean(
    configuredEmail &&
    session?.email.toLowerCase() === configuredEmail,
  )
}

export function logoutAdminSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  void supabase.auth.signOut()
}

export function getStoredPortalRole() {
  if (typeof window === 'undefined') {
    return null
  }

  const role = window.localStorage.getItem(STORAGE_KEY)

  return role === 'admin'
    ? 'admin'
    : role === 'customer'
      ? 'customer'
      : null
}

export function setStoredPortalRole(
  role: 'admin' | 'customer',
  email = '',
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, role)

  if (role === 'admin') {
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        authenticatedAt: new Date().toISOString(),
      }),
    )
  }
}