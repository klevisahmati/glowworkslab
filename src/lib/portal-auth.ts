import { supabase } from './supabase/client'

const STORAGE_KEY = 'glowworks.portal.role'
const ADMIN_EMAIL = 'klevis.ahmati@icloud.com'

function getConfiguredAdminEmail() {
  return ADMIN_EMAIL.trim().toLowerCase()
}

export async function authenticateAdmin(
  email: string,
  password: string,
) {
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

  if (data.user.email?.toLowerCase() !== configuredEmail) {
    await supabase.auth.signOut()
    return false
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, 'admin')
  }

  return true
}

export async function hasValidAdminSession() {
  const configuredEmail = getConfiguredAdminEmail()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.user) {
    return false
  }

  return (
    Boolean(configuredEmail) &&
    session.user.email?.toLowerCase() === configuredEmail
  )
}

export async function logoutAdminSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  await supabase.auth.signOut()
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
  _email = '',
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, role)
}
