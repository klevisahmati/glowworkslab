const STORAGE_KEY = 'glowworks.portal.role'
const ADMIN_AUTH_STORAGE_KEY = 'glowworks.portal.adminAuth'
const ADMIN_EMAIL_ENV = 'VITE_ADMIN_EMAIL'
const ADMIN_PASSWORD_ENV = 'VITE_ADMIN_PASSWORD'

function getEnvValue(name: string, fallback: string) {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.[name]?.trim() || fallback
}

function getConfiguredAdminEmail() {
  return getEnvValue(ADMIN_EMAIL_ENV, '').toLowerCase()
}

function getConfiguredAdminPassword() {
  return getEnvValue(ADMIN_PASSWORD_ENV, '')
}

export function authenticateAdmin(email: string, password: string) {
  if (typeof window === 'undefined') {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()
  const configuredEmail = getConfiguredAdminEmail()
  const configuredPassword = getConfiguredAdminPassword()
  const isValid = Boolean(configuredEmail && configuredPassword) && normalizedEmail === configuredEmail && normalizedPassword === configuredPassword

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
  return Boolean(session && session.email.toLowerCase() === getConfiguredAdminEmail())
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

export function setStoredPortalRole(role: 'admin' | 'customer', email = '') {
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
