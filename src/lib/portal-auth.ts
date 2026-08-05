const STORAGE_KEY = 'glowworks.portal.role'
const ADMIN_AUTH_STORAGE_KEY = 'glowworks.portal.adminAuth'
export const OWNER_PORTAL_EMAIL = 'klevis.ahmati@gmail.com'
export const DEFAULT_ADMIN_EMAIL = 'klevis.ahmati@gmail.com'
export const DEFAULT_ADMIN_PASSWORD = 'Glowworks2026!'
export const DEFAULT_ADMIN_ACCESS_CODE = 'GLOW2026'

function getEnvValue(name: string, fallback: string) {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.[name]?.trim() || fallback
}

export function authenticateAdmin(email: string, password: string) {
  if (typeof window === 'undefined') {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()
  const configuredEmail = getEnvValue('VITE_ADMIN_EMAIL', DEFAULT_ADMIN_EMAIL).toLowerCase()
  const configuredPassword = getEnvValue('VITE_ADMIN_PASSWORD', DEFAULT_ADMIN_PASSWORD)
  const isValid = normalizedEmail === configuredEmail && normalizedPassword === configuredPassword && normalizedEmail === OWNER_PORTAL_EMAIL

  if (!isValid) {
    return false
  }

  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({
    email: normalizedEmail,
    authenticatedAt: new Date().toISOString(),
  }))

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
    return JSON.parse(raw) as { email: string; authenticatedAt: string }
  } catch {
    return null
  }
}

export function hasValidAdminSession() {
  const session = getAdminAuthSession()
  return Boolean(session && session.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase())
}

export function logoutAdminSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
  }
}

export function getStoredPortalRole() {
  if (typeof window === 'undefined') {
    return null
  }

  const role = window.localStorage.getItem(STORAGE_KEY)
  return role === 'admin' ? 'admin' : role === 'customer' ? 'customer' : null
}

export function setStoredPortalRole(role: 'admin' | 'customer', email = OWNER_PORTAL_EMAIL) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, role)
    if (role === 'admin') {
      window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify({
        email: email.trim().toLowerCase(),
        authenticatedAt: new Date().toISOString(),
      }))
    }
  }
}
